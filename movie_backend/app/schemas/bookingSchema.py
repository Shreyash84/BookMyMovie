# app/schemas/booking.py
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class SeatSelection(BaseModel):
    seat_id: int
    

class CancelBookingRequest(BaseModel):
    seat_ids: List[int]


class BookingRequest(BaseModel):
    showtime_id: int
    seat_ids: List[int]


class BookingResponse(BaseModel):
    success: bool
    message: str
    booking_id: Optional[int] = None
    movie_title: Optional[str] = None
    showtime: Optional[datetime] = None
    hall: Optional[str] = None
    seats: Optional[List[Dict[str, Any]]] = None
    total_amount: Optional[int] = None

    class Config:
        from_attributes = True

class BookingUpdateRequest(BaseModel):
    """Schema for editing a booking (swapping seats)"""
    new_seat_ids: List[int]