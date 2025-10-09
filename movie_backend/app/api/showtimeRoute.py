from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.crud import get_seats_for_showtime, are_seats_available
from app.db.models import SeatStatus

from app.db.database import get_db    
from app.db.models import ShowTime


router = APIRouter(prefix="/showtimes", tags=["Showtimes"])

@router.get("/")
async def get_showtimes(movie_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ShowTime).where(ShowTime.movie_id == movie_id))
    showtimes = result.scalars().all()
    if not showtimes:
        raise HTTPException(status_code=404, detail="No showtimes found for this movie")
    return showtimes

@router.get("/{showtime_id}/seats")
async def get_seat_availability(showtime_id: int, db: AsyncSession = Depends(get_db)):
    seats = await get_seats_for_showtime(db, showtime_id)
    if not seats:
        raise HTTPException(status_code=404, detail="No seats found for this showtime")

    return {
        "showtime_id": showtime_id,
        "total_seats": len(seats),
        "available": sum(1 for s in seats if s.status == SeatStatus.available),   #type: ignore
        "locked": sum(1 for s in seats if s.status == SeatStatus.locked),         #type: ignore
        "booked": sum(1 for s in seats if s.status == SeatStatus.booked),         #type: ignore
        "seats": [
            {
                "id": seat.id,
                "row": seat.row,
                "number": seat.number,
                "status": seat.status.value,
                "price": seat.price,
            }
            for seat in seats
        ]
    }