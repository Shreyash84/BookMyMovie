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
    get_booking_by_id,
    mark_seats_available,
)

# Request envelope for booking
class BookingRequest:
    def __init__(self, user_id: int, showtime_id: int, seat_ids: List[int], result_future: asyncio.Future):
        self.user_id = user_id
        self.showtime_id = showtime_id
        self.seat_ids = seat_ids
        self.result_future = result_future


# Request envelope for cancellation
class CancelRequest:
    def __init__(self, booking_id: int, user_id: int, seat_ids: List[int], result_future: asyncio.Future):
        self.booking_id = booking_id
        self.user_id = user_id
        self.seat_ids = seat_ids
        self.result_future = result_future



class TicketPool:
    """
    Per-showtime queue / worker pool.
    - enqueue booking or cancellation requests for a showtime
    - ensure all requests are processed sequentially
    - publish seat changes to Redis pubsub + in-memory broadcast
    """

    def __init__(self):
        # queues per showtime
        self.queues: Dict[int, asyncio.Queue] = {}
        # worker tasks per showtime
        self.workers: Dict[int, asyncio.Task] = {}
        self.redis = get_redis()

    # ensure each showtime has its own queue and worker
    def _ensure_queue(self, showtime_id: int):
        if showtime_id not in self.queues:
            q = asyncio.Queue()
            self.queues[showtime_id] = q
            task = asyncio.create_task(self._worker(showtime_id, q))
            self.workers[showtime_id] = task

    async def enqueue_booking(self, user_id: int, showtime_id: int, seat_ids: List[int]) -> Dict[str, Any]:
        """
        Enqueue and await a booking result.
        Returns { "success": bool, "message": str, "booking_id": Optional[int] }
        """
        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        br = BookingRequest(user_id=user_id, showtime_id=showtime_id, seat_ids=seat_ids, result_future=fut)
        self._ensure_queue(showtime_id)
        await self.queues[showtime_id].put(br)
        return await fut

    async def enqueue_cancel(self, booking_id: int, user_id: int, seat_ids: List[int]) -> Dict[str, Any]:
        """
        Enqueue and await a cancellation result.
        Returns { "success": bool, "message": str, "booking_id": Optional[int] }
        """
        # Fetch booking to know which queue to use
        async with async_session() as db:
            booking = await get_booking_by_id(db, booking_id)
            if not booking:
                return {"success": False, "message": "booking not found"}
            if booking.user_id != user_id:
                return {"success": False, "message": "not authorized to cancel this booking"}
            showtime_id = booking.showtime_id

        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        cr = CancelRequest(booking_id=booking_id, user_id=user_id, seat_ids=seat_ids, result_future=fut)

        self._ensure_queue(showtime_id)
        await self.queues[showtime_id].put(cr)
        return await fut

    async def _worker(self, showtime_id: int, queue: asyncio.Queue):
        """
        Worker that handles both booking and cancellation sequentially per showtime.
        """
        while True:
            req = await queue.get()
            try:
                if isinstance(req, BookingRequest):
                    result = await self._process_booking_request(req)
                elif isinstance(req, CancelRequest):
                    result = await self._process_cancel_request(showtime_id, req)
                else:
                    result = {"success": False, "message": "unknown request type"}

                if not req.result_future.cancelled():
                    req.result_future.set_result(result)
            except Exception:
                traceback.print_exc()
                if not req.result_future.cancelled():
                    req.result_future.set_result({"success": False, "message": "internal error"})
            finally:
                queue.task_done()

    async def _process_booking_request(self, br: BookingRequest) -> Dict[str, Any]:
        """
        Process a single booking: lock seats, create booking, mark seats booked.
        Runs inside a per-showtime worker to ensure atomicity.
        """
        async with async_session() as db:
            async with db.begin():
                ok = await lock_seats(db, br.seat_ids, br.user_id, lock_seconds=120)
                if not ok:
                    return {"success": False, "message": "some seats are no longer available"}

                seats = await get_seats_for_showtime(db, br.showtime_id)
                seats_map = {s.id: s for s in seats}
                selected_seats_payload = []
                total = 0

                for s_id in br.seat_ids:
                    s = seats_map.get(s_id)
                    if not s:
                        return {"success": False, "message": f"seat {s_id} not found"}
                    selected_seats_payload.append(
                        {"seat_id": s.id, "row": s.row, "number": s.number, "price": s.price}
                    )
                    total += s.price

                booking = await create_booking(db, br.user_id, br.showtime_id, selected_seats_payload, total)
                await mark_seats_booked(db, br.seat_ids)

            # Transaction committed — broadcast updates
            payload = {
                "type": "seats_updated",
                "showtime_id": br.showtime_id,
                "seat_ids": br.seat_ids,
                "status": "booked",
            }
            try:
                await self.redis.publish(f"showtime:{br.showtime_id}", str(payload))
            except Exception:
                pass
            await broadcast_to_showtime(br.showtime_id, payload)

            return {"success": True, "message": "booked", "booking_id": booking.id}

    async def _process_cancel_request(self, showtime_id: int, cr: CancelRequest) -> Dict[str, Any]:
        """
        Atomically cancel a booking:
        - verify booking exists and belongs to user
        - mark seats available
        - commit
        - broadcast real-time update
        """
        async with async_session() as db:
            async with db.begin():
                booking = await get_booking_by_id(db, cr.booking_id)
                if not booking:
                    return {"success": False, "message": "booking not found"}
                if booking.user_id != cr.user_id:
                    return {"success": False, "message": "not authorized to cancel this booking"}
                if booking.showtime_id != showtime_id:
                    return {"success": False, "message": "booking/showtime mismatch"}

                # ⬇️ this list should come from request payload
                seat_ids_to_cancel = getattr(cr, "seat_ids", [])
                if not seat_ids_to_cancel:
                    return {"success": False, "message": "no seats specified to cancel"}

                # Check those seats actually belong to this booking
                booking_seat_ids = [s["seat_id"] for s in booking.seats]
                invalid = [s for s in seat_ids_to_cancel if s not in booking_seat_ids]
                if invalid:
                    return {"success": False, "message": f"Invalid seat_ids: {invalid}"}

                # 1️⃣ Mark those seats available
                await mark_seats_available(db, seat_ids_to_cancel)

                # 2️⃣ Remove from booking JSON
                remaining = [s for s in booking.seats if s["seat_id"] not in seat_ids_to_cancel]
                booking.seats = remaining
                db.add(booking)
            # Commit transaction
            await db.commit()

        # 3️⃣ Broadcast update
        payload = {
            "type": "seats_updated",
            "showtime_id": showtime_id,
            "seat_ids": seat_ids_to_cancel,
            "status": "available",
        }
        try:
            await self.redis.publish(f"showtime:{showtime_id}", str(payload))
        except Exception:
            pass

        await broadcast_to_showtime(showtime_id, payload)

        return {
            "success": True,
            "message": f"Seats {seat_ids_to_cancel} cancelled successfully",
            "booking_id": cr.booking_id,
        }
