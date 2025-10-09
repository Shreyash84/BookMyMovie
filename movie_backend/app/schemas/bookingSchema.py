# app/schemas/booking.py
from typing import List
from pydantic import BaseModel


class SeatSelection(BaseModel):
    seat_id: int


class BookingRequest(BaseModel):
    showtime_id: int
    seat_ids: List[int]


class BookingResponse(BaseModel):
    success: bool
    message: str
    booking_id: int | None = None
