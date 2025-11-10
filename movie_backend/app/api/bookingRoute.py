# app/api/v1/bookings.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.schemas.bookingSchema import BookingRequest, BookingResponse, CancelBookingRequest, BookingUpdateRequest
from app.services.booking_pool import TicketPool

from app.db.crud import get_seats_for_showtime
from sqlalchemy.future import select
from app.db.models import Booking, Movie, ShowTime

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

@router.get("/me")
async def get_my_bookings(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    query = (
        select(Booking, Movie.title, ShowTime.start_time, ShowTime.id.label("showtime_id"))
        .join(ShowTime, Booking.showtime_id == ShowTime.id)
        .join(Movie, ShowTime.movie_id == Movie.id)
        .where(Booking.user_id == user.id)
    )

    result = await db.execute(query)
    bookings = []
    for booking, movie_title, start_time, showtime_id in result.all():
        bookings.append({
            "id": booking.id,
            "movie_title": movie_title,
            "showtime_id": showtime_id,  # ✅ Explicitly from query
            "showtime": start_time,
            "seats": booking.seats,
            "total_amount": booking.total_amount,
            "status": booking.status,
            "created_at": booking.created_at,
        })
    return bookings

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
            "locked_until": s.locked_until.isoformat() if s.locked_until else None,   #type: ignore
            "price": s.price,
        }
        for s in seats
    ]
    return res

@router.put("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking_endpoint(
    booking_id: int,
    body: CancelBookingRequest,  # ✅ Now explicitly typed
    user=Depends(get_current_user),
):
    pool = TicketPool()
    result = await pool.enqueue_cancel(
        booking_id=booking_id,
        user_id=user.id,
        seat_ids=body.seat_ids,   # ✅ Get list directly from model
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return BookingResponse(
        success=True,
        message=result["message"],
        booking_id=booking_id,
    )
    
@router.get("/{booking_id}")
async def get_booking_by_id_endpoint(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Get details of a specific booking (used in EditBooking page).
    """
    query = (
        select(Booking, Movie.title, ShowTime.start_time)
        .join(ShowTime, Booking.showtime_id == ShowTime.id)
        .join(Movie, ShowTime.movie_id == Movie.id)
        .where(Booking.id == booking_id, Booking.user_id == user.id)
    )
    result = await db.execute(query)
    record = result.first()

    if not record:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking, movie_title, start_time = record
    return {
        "id": booking.id,
        "movie_title": movie_title,
        "showtime": start_time,
        "showtime_id": booking.showtime_id,
        "seats": booking.seats,
        "total_amount": booking.total_amount,
        "status": booking.status,
        "created_at": booking.created_at,
    }

    
@router.put("/{booking_id}/update", response_model=BookingResponse)
async def update_booking_endpoint(
    booking_id: int,
    body: BookingUpdateRequest,
    user=Depends(get_current_user),
):
    pool = TicketPool()
    result = await pool.enqueue_update(
        booking_id=booking_id,
        user_id=user.id,
        new_seat_ids=body.new_seat_ids,
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return BookingResponse(
        success=True,
        message=result["message"],
        booking_id=booking_id,
    )
    

