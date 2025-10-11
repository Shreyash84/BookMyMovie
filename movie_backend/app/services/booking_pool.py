# app/services/booking_pool.py
import asyncio
from typing import Dict, Any, List, Optional
import traceback

from app.db.database import async_session
from app.services.redis_client import get_redis
from app.services.broadcast import broadcast_to_showtime

from app.db.crud import (
    are_seats_available,
    lock_seats,
    create_booking,
    mark_seats_booked,
    get_seats_for_showtime,
)

# Request envelope
class BookingRequest:
    def __init__(self, user_id: int, showtime_id: int, seat_ids: List[int], result_future: asyncio.Future):
        self.user_id = user_id
        self.showtime_id = showtime_id
        self.seat_ids = seat_ids
        self.result_future = result_future


class TicketPool:
    """
    Per-showtime queue / worker pool.
    - enqueue booking requests for a showtime
    - ensure they are processed sequentially
    - publish seat changes to Redis pubsub + in-memory broadcast
    """

    def __init__(self):
        # queues per showtime
        self.queues: Dict[int, asyncio.Queue] = {}
        # worker tasks per showtime
        self.workers: Dict[int, asyncio.Task] = {}
        self.redis = get_redis()

    def _ensure_queue(self, showtime_id: int):
        if showtime_id not in self.queues:
            q = asyncio.Queue()
            self.queues[showtime_id] = q
            # create a worker task
            task = asyncio.create_task(self._worker(showtime_id, q))
            self.workers[showtime_id] = task

    async def enqueue_booking(self, user_id: int, showtime_id: int, seat_ids: List[int]) -> Dict[str, Any]:
        """
        Enqueue and await the booking result.
        Returns a dict { "success": bool, "message": str, "booking_id": Optional[int] }
        """
        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        br = BookingRequest(user_id=user_id, showtime_id=showtime_id, seat_ids=seat_ids, result_future=fut)
        self._ensure_queue(showtime_id)
        await self.queues[showtime_id].put(br)
        # wait for worker to set the future result
        return await fut

    async def _worker(self, showtime_id: int, queue: asyncio.Queue):
        """
        Worker: runs forever until cancelled. Processes booking requests sequentially.
        """
        while True:
            br: BookingRequest = await queue.get()
            try:
                result = await self._process_booking_request(br)
                if not br.result_future.cancelled():
                    br.result_future.set_result(result)
            except Exception as e:
                traceback.print_exc()
                if not br.result_future.cancelled():
                    br.result_future.set_result({"success": False, "message": "internal error"})
            finally:
                queue.task_done()

    async def _process_booking_request(self, br: BookingRequest) -> Dict[str, Any]:
        """
        Process a single booking: lock seats, create booking, mark seats booked.
        This function runs inside the worker (single thread of execution per showtime).
        """
        async with async_session() as db:   
            # Begin transaction
            async with db.begin():
                # 1) Try to lock seats in DB using row-level locks
                ok = await lock_seats(db, br.seat_ids, br.user_id, lock_seconds=120)
                if not ok:
                    return {"success": False, "message": "some seats are no longer available"}

                # 2) compute amount and payload for seats (read seats)
                seats = await get_seats_for_showtime(db, br.showtime_id)
                seats_map = {s.id: s for s in seats}
                selected_seats_payload = []
                total = 0
                for s_id in br.seat_ids:
                    s = seats_map.get(s_id)
                    if not s:
                        return {"success": False, "message": f"seat {s_id} not found"}
                    selected_seats_payload.append({"seat_id": s.id, "row": s.row, "number": s.number, "price": s.price})
                    total += s.price

                # 3) create booking record
                booking = await create_booking(db, br.user_id, br.showtime_id, selected_seats_payload, total)

                # 4) mark seats booked
                await mark_seats_booked(db, br.seat_ids)

            # Transaction committed at this point

            # 5) publish update to Redis (channel: showtime:{id}) and broadcast in-memory
            payload = {"type": "seats_updated", "showtime_id": br.showtime_id, "seat_ids": br.seat_ids, "status": "booked"}
            # publish to redis channel (stringify)
            try:
                await self.redis.publish(f"showtime:{br.showtime_id}", str(payload))
            except Exception:
                # redis best-effort
                pass
            # broadcast to connected WS clients (in process)
            await broadcast_to_showtime(br.showtime_id, payload)

            return {"success": True, "message": "booked", "booking_id": booking.id}
