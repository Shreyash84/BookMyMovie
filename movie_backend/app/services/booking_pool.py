import asyncio
import traceback
from typing import Dict, Any, List

from app.db.database import async_session
from app.services.redis_client import get_redis
from app.services.broadcast import broadcast_to_showtime
from app.db.crud import (
    lock_seats,
    create_booking,
    mark_seats_booked,
    get_seats_for_showtime,
    get_booking_by_id,
    mark_seats_available,
)
from app.db.models import SeatStatus  # used to check seat status enum


# ------------------------------------------------------------
# 📦 Request Envelopes
# ------------------------------------------------------------

class BookingRequest:
    def __init__(self, user_id: int, showtime_id: int, seat_ids: List[int], result_future: asyncio.Future):
        self.user_id = user_id
        self.showtime_id = showtime_id
        self.seat_ids = seat_ids
        self.result_future = result_future


class CancelRequest:
    def __init__(self, booking_id: int, user_id: int, seat_ids: List[int], result_future: asyncio.Future):
        self.booking_id = booking_id
        self.user_id = user_id
        self.seat_ids = seat_ids
        self.result_future = result_future


class UpdateRequest:
    def __init__(self, booking_id: int, user_id: int, new_seat_ids: List[int], result_future: asyncio.Future):
        self.booking_id = booking_id
        self.user_id = user_id
        self.new_seat_ids = new_seat_ids
        self.result_future = result_future


# ------------------------------------------------------------
# 🎟️ Ticket Pool — per-showtime sequential processor
# ------------------------------------------------------------

class TicketPool:
    """
    Handles concurrent seat operations (booking / cancel / update)
    safely by queuing them per showtime.
    """

    def __init__(self):
        self.queues: Dict[int, asyncio.Queue] = {}
        self.workers: Dict[int, asyncio.Task] = {}
        self.redis = get_redis()

    # --------------------------------------------------------
    # 🧩 Queue Management
    # --------------------------------------------------------
    def _ensure_queue(self, showtime_id: int):
        """Ensure a dedicated queue/worker exists for each showtime."""
        if showtime_id not in self.queues:
            q = asyncio.Queue()
            self.queues[showtime_id] = q
            task = asyncio.create_task(self._worker(showtime_id, q))
            self.workers[showtime_id] = task

    # --------------------------------------------------------
    # 🟢 Public enqueue methods
    # --------------------------------------------------------
    async def enqueue_booking(self, user_id: int, showtime_id: int, seat_ids: List[int]) -> Dict[str, Any]:
        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        br = BookingRequest(user_id=user_id, showtime_id=showtime_id, seat_ids=seat_ids, result_future=fut)
        self._ensure_queue(showtime_id)
        await self.queues[showtime_id].put(br)
        return await fut

    async def enqueue_cancel(self, booking_id: int, user_id: int, seat_ids: List[int]) -> Dict[str, Any]:
        async with async_session() as db:
            booking = await get_booking_by_id(db, booking_id)
            if not booking:
                return {"success": False, "message": "booking not found"}
            if booking.user_id != user_id:
                return {"success": False, "message": "not authorized"}
            showtime_id = booking.showtime_id

        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        cr = CancelRequest(booking_id=booking_id, user_id=user_id, seat_ids=seat_ids, result_future=fut)
        self._ensure_queue(showtime_id)
        await self.queues[showtime_id].put(cr)
        return await fut

    async def enqueue_update(self, booking_id: int, user_id: int, new_seat_ids: List[int]) -> Dict[str, Any]:
        async with async_session() as db:
            booking = await get_booking_by_id(db, booking_id)
            if not booking:
                return {"success": False, "message": "Booking not found"}
            if booking.user_id != user_id:
                return {"success": False, "message": "Not authorized"}
            showtime_id = booking.showtime_id

        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        ur = UpdateRequest(booking_id=booking_id, user_id=user_id, new_seat_ids=new_seat_ids, result_future=fut)
        self._ensure_queue(showtime_id)
        await self.queues[showtime_id].put(ur)
        return await fut

    # --------------------------------------------------------
    # ⚙️ Worker
    # --------------------------------------------------------
    async def _worker(self, showtime_id: int, queue: asyncio.Queue):
        """Sequentially process all requests for a single showtime."""
        while True:
            req = await queue.get()
            try:
                if isinstance(req, BookingRequest):
                    result = await self._process_booking_request(req)
                elif isinstance(req, CancelRequest):
                    result = await self._process_cancel_request(showtime_id, req)
                elif isinstance(req, UpdateRequest):
                    result = await self._process_update_request(showtime_id, req)
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

    # --------------------------------------------------------
    # 🧾 Process Booking
    # --------------------------------------------------------
    async def _process_booking_request(self, br: BookingRequest) -> Dict[str, Any]:
        async with async_session() as db:
            async with db.begin():
                ok = await lock_seats(db, br.seat_ids, br.user_id, lock_seconds=120)
                if not ok:
                    return {"success": False, "message": "some seats are no longer available"}

                seats = await get_seats_for_showtime(db, br.showtime_id)
                seat_map = {s.id: s for s in seats}

                selected_payload = []
                total = 0
                for sid in br.seat_ids:
                    s = seat_map.get(sid)
                    if not s:
                        return {"success": False, "message": f"seat {sid} not found"}
                    selected_payload.append(
                        {"seat_id": s.id, "row": s.row, "number": s.number, "price": s.price}
                    )
                    total += s.price

                booking = await create_booking(db, br.user_id, br.showtime_id, selected_payload, total)
                await mark_seats_booked(db, br.seat_ids)

            # commit broadcast
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

    # --------------------------------------------------------
    # 🧾 Process Cancel
    # --------------------------------------------------------
    async def _process_cancel_request(self, showtime_id: int, cr: CancelRequest) -> Dict[str, Any]:
        async with async_session() as db:
            async with db.begin():
                booking = await get_booking_by_id(db, cr.booking_id)
                if not booking:
                    return {"success": False, "message": "booking not found"}
                if booking.user_id != cr.user_id:
                    return {"success": False, "message": "unauthorized"}
                if booking.showtime_id != showtime_id:
                    return {"success": False, "message": "showtime mismatch"}

                seat_ids = getattr(cr, "seat_ids", [])
                if not seat_ids:
                    return {"success": False, "message": "no seats specified"}

                # ensure those belong to the booking
                booked_ids = [s["seat_id"] for s in booking.seats]
                invalid = [sid for sid in seat_ids if sid not in booked_ids]
                if invalid:
                    return {"success": False, "message": f"invalid seat ids {invalid}"}

                await mark_seats_available(db, seat_ids)
                remaining = [s for s in booking.seats if s["seat_id"] not in seat_ids]
                booking.seats = remaining
                db.add(booking)
            await db.commit()

        payload = {
            "type": "seats_updated",
            "showtime_id": showtime_id,
            "seat_ids": seat_ids,
            "status": "available",
        }
        try:
            await self.redis.publish(f"showtime:{showtime_id}", str(payload))
        except Exception:
            pass
        await broadcast_to_showtime(showtime_id, payload)

        return {"success": True, "message": f"Seats {seat_ids} cancelled", "booking_id": cr.booking_id}

    # --------------------------------------------------------
    # 🧾 Process Update (Edit Booking)
    # --------------------------------------------------------
    async def _process_update_request(self, showtime_id: int, ur: UpdateRequest) -> Dict[str, Any]:
        """
        Atomically update a booking:
        - compute old vs new seats
        - release seats that were removed
        - lock & book new seats
        - update booking record (seats + total_amount)
        - broadcast both releases and new bookings
        """
        async with async_session() as db:
            async with db.begin():
                booking = await get_booking_by_id(db, ur.booking_id)
                if not booking:
                    return {"success": False, "message": "booking not found"}
                if booking.user_id != ur.user_id:
                    return {"success": False, "message": "unauthorized"}
                if booking.showtime_id != showtime_id:
                    return {"success": False, "message": "showtime mismatch"}

                old_seat_ids = [s["seat_id"] for s in booking.seats]
                new_seat_ids = ur.new_seat_ids

                # No-op check
                if set(old_seat_ids) == set(new_seat_ids):
                    return {"success": False, "message": "no changes detected"}

                # load current seat rows for validation
                all_seats = await get_seats_for_showtime(db, showtime_id)
                seat_map = {s.id: s for s in all_seats}

                # Validate new seats exist and are available (unless already owned by this booking)
                for sid in new_seat_ids:
                    s = seat_map.get(sid)
                    if not s:
                        return {"success": False, "message": f"seat {sid} not found"}
                    # check availability: compare enum value
                    if sid not in old_seat_ids and getattr(s.status, "value", s.status) != "available":
                        return {"success": False, "message": f"Seat {s.row}{s.number} unavailable"}

                # Determine to_release and to_book
                to_release = [sid for sid in old_seat_ids if sid not in new_seat_ids]
                to_book = [sid for sid in new_seat_ids if sid not in old_seat_ids]

                # 1) Release seats removed from booking
                if to_release:
                    await mark_seats_available(db, to_release)

                # 2) Lock new seats (so no one else grabs them during update)
                if to_book:
                    ok = await lock_seats(db, to_book, ur.user_id, lock_seconds=120)
                    if not ok:
                        # revert any releases already done in this transaction by raising (transaction will roll back)
                        return {"success": False, "message": "some new seats are no longer available"}

                    # Mark them booked now
                    await mark_seats_booked(db, to_book)

                # 3) Update booking record seats + total
                updated_seats = []
                total = 0
                for sid in new_seat_ids:
                    s = seat_map[sid]
                    updated_seats.append(
                        {"seat_id": s.id, "row": s.row, "number": s.number, "price": s.price}
                    )
                    total += s.price

                booking.seats = updated_seats
                booking.total_amount = total
                db.add(booking)
            # commit transaction
            await db.commit()

        # Broadcast: first released seats as available, then newly booked seats as booked
        try:
            if to_release:
                payload_release = {
                    "type": "seats_updated",
                    "showtime_id": showtime_id,
                    "seat_ids": to_release,
                    "status": "available",
                }
                await self.redis.publish(f"showtime:{showtime_id}", str(payload_release))
                await broadcast_to_showtime(showtime_id, payload_release)

            if to_book:
                payload_booked = {
                    "type": "seats_updated",
                    "showtime_id": showtime_id,
                    "seat_ids": to_book,
                    "status": "booked",
                }
                await self.redis.publish(f"showtime:{showtime_id}", str(payload_booked))
                await broadcast_to_showtime(showtime_id, payload_booked)
        except Exception:
            # best-effort: if redis pub fails, still proceed
            pass

        return {"success": True, "message": "booking updated successfully", "booking_id": ur.booking_id}
