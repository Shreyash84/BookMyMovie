from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone

from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User, Movie, ShowTime, Seat, Booking, SeatStatus

#Users
async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    user = await db.execute(select(User).where(User.email == email))
    return user.scalars().first()

# async def create_user(db: AsyncSession, request: SignUpRequest) -> User:
#     user = User(email=request.email, hashed_password=request.password, name=f"{request.first_name} {request.last_name}")
#     db.add(user)
#     await db.flush()
#     return user

# MOVIES
async def create_movie(db: AsyncSession, **kwargs) -> Movie:
    movie = Movie(**kwargs)
    db.add(movie)
    await db.flush()
    return movie


async def list_movies(db: AsyncSession, skip: int = 0, limit: int = 20):
    q = await db.execute(select(Movie).offset(skip).limit(limit))
    return q.scalars().all()


async def get_movie(db: AsyncSession, movie_id: int) -> Optional[Movie]:
    q = await db.execute(select(Movie).where(Movie.id == movie_id))
    return q.scalars().first()


# SHOWTIMES
async def create_showtime(db: AsyncSession, movie_id: int, start_time: datetime, hall: str = "Main Hall") -> ShowTime:
    st = ShowTime(movie_id=movie_id, start_time=start_time, hall=hall)
    db.add(st)
    await db.flush()
    return st


async def get_showtime(db: AsyncSession, showtime_id: int) -> Optional[ShowTime]:
    q = await db.execute(select(ShowTime).where(ShowTime.id == showtime_id))
    return q.scalars().first()


# SEATS
# This function is key for creating the full seat map for a showtime, efficiently in one shot.
async def bulk_create_seats(db: AsyncSession, showtime_id: int, rows: List[str], cols: int, price: int = 100):
    seats = []
    for r in rows:
        for n in range(1, cols + 1):
            s = Seat(showtime_id=showtime_id, row=r, number=n, price=price)
            seats.append(s)
            db.add(s)
    await db.flush()
    return seats


async def get_seats_for_showtime(db: AsyncSession, showtime_id: int):
    q = await db.execute(select(Seat).where(Seat.showtime_id == showtime_id).order_by(Seat.row, Seat.number))
    return q.scalars().all()


async def are_seats_available(db: AsyncSession, seat_ids: List[int]) -> bool:
    q = await db.execute(select(Seat).where(Seat.id.in_(seat_ids)))
    seats = q.scalars().all()
    return all(s.status == SeatStatus.available for s in seats)


# LOCK / UNLOCK seats (DB-level)
async def lock_seats(db: AsyncSession, seat_ids: List[int], user_id: int, lock_seconds: int = 120) -> bool:
    # atomic-ish: check seats are available, then update status to locked
    now = datetime.now(timezone.utc)
    lock_until = now + timedelta(seconds=lock_seconds)
    q = select(Seat).where(Seat.id.in_(seat_ids)).with_for_update()
    res = await db.execute(q)
    seats = res.scalars().all()
    if not seats or any(s.status != SeatStatus.available for s in seats):
        return False
    for s in seats:
        s.status = SeatStatus.locked   
        s.locked_by = user_id
        s.locked_until = lock_until
        db.add(s)
    # flush commit will be handled by caller transaction
    await db.flush()
    return True


async def unlock_seats(db: AsyncSession, seat_ids: List[int]):
    q = await db.execute(select(Seat).where(Seat.id.in_(seat_ids)))
    seats = q.scalars().all()
    for s in seats:
        s.status = SeatStatus.available
        s.locked_by = None
        s.locked_until = None
        db.add(s)
    await db.flush()
    return True


# BOOKING
async def create_booking(db: AsyncSession, user_id: int, showtime_id: int, seats_payload: List[Dict[str, Any]], total_amount: int) -> Booking:
    booking = Booking(user_id=user_id, showtime_id=showtime_id, seats=seats_payload, total_amount=total_amount)
    db.add(booking)
    await db.flush()
    return booking


async def mark_seats_booked(db: AsyncSession, seat_ids: List[int]):
    q = await db.execute(select(Seat).where(Seat.id.in_(seat_ids)).with_for_update())
    seats = q.scalars().all()
    for s in seats:
        s.status = SeatStatus.booked
        s.locked_by = None
        s.locked_until = None
        db.add(s)
    await db.flush()
    

async def get_booking_by_id(db, booking_id: int):
    result = await db.execute(select(Booking).filter(Booking.id == booking_id))
    return result.scalars().first()

async def mark_seats_available(db, seat_ids: list[int]):
    if not seat_ids:
        return
    await db.execute(
        Seat.__table__.update()
        .where(Seat.id.in_(seat_ids))
        .values(status="available", locked_by=None, locked_until=None)
    )

from sqlalchemy import update
from sqlalchemy.future import select
from app.db.models import Booking
import json

async def remove_seats_from_booking(db, booking_id: int, seat_ids: list[int]):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        return None

    # Filter out cancelled seats
    remaining = [s for s in booking.seats if s["seat_id"] not in seat_ids]

    # Update DB JSON
    await db.execute(
        update(Booking)
        .where(Booking.id == booking_id)
        .values(seats=remaining)
    )
    await db.commit()
    return remaining


async def create_user_if_not_exists(db, email, name, picture=None):
    from app.db.models import User
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            name=name,
            password="google_password",  # Google users don’t have passwords
            is_active=True,
            is_admin=False,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user