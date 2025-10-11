# app/api/v1/bookings.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.schemas.bookingSchema import BookingRequest, BookingResponse
from app.services.booking_pool import TicketPool, TicketPool as TP
from app.db.crud import get_seats_for_showtime
from app.db.database import async_session

router = APIRouter(prefix="/bookings", tags=["Bookings"])

# create a global pool instance
_pool = TicketPool()


@router.post("/", response_model=BookingResponse)
async def create_booking_endpoint(payload: BookingRequest, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # Additional validation: check seats belong to showtime, prices etc
    seats = await get_seats_for_showtime(db, payload.showtime_id)
    seats_map = {s.id: s for s in seats}
    for sid in payload.seat_ids:
        if sid not in seats_map:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"seat {sid} not found for this showtime")

    # Enqueue booking request into the TicketPool
    result = await _pool.enqueue_booking(user.id, payload.showtime_id, payload.seat_ids)
    if not result.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.get("message"))
    return BookingResponse(success=True, message="Booked", booking_id=result.get("booking_id"))


@router.get("/showtime/{showtime_id}/seats")
async def get_seats(showtime_id: int, db: AsyncSession = Depends(get_db)):
    seats = await get_seats_for_showtime(db, showtime_id)
    # convert seat objects to JSON friendly
    res = [
        {
            "id": s.id,
            "row": s.row,
            "number": s.number,
            "status": s.status.value,
            "locked_by": s.locked_by,
            "locked_until": s.locked_until.isoformat() if s.locked_until else None,
            "price": s.price,
        }
        for s in seats
    ]
    return res
