from sqlalchemy import JSON, Column, ForeignKey, Integer, String, Boolean, DateTime, UniqueConstraint, Enum
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
import enum

from app.db.database import Base

class SeatStatus(enum.Enum):
    available = "available"
    locked = "locked"
    booked = "booked"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True,nullable=False, index=True)
    password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

class Movie(Base):
    __tablename__ = "movies"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String)
    poster_url = Column(String)
    rating = Column(String(10))
    release_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    showtimes = relationship("ShowTime", back_populates="movie", cascade="all, delete-orphan")

class ShowTime(Base):
    __tablename__ = "showtimes"
    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    start_time = Column((DateTime(timezone=True)), nullable=False, index=True)
    hall = Column(String(100), default="Main Hall")
    created_at = Column((DateTime(timezone=True)), default=datetime.now(timezone.utc))

    movie = relationship("Movie", back_populates="showtimes")
    seats = relationship("Seat", back_populates="showtime", cascade="all, delete-orphan")

class Seat(Base):
    __tablename__ = "seats"
    id = Column(Integer, primary_key=True, index=True)
    showtime_id = Column(Integer, ForeignKey("showtimes.id", ondelete="CASCADE"), nullable=False, index=True)
    row = Column(String(4), nullable=False)
    number = Column(Integer, nullable=False)
    status = Column(Enum(SeatStatus), default=SeatStatus.available, nullable=False)
    locked_by = Column(Integer, nullable=True)   # user_id who locked
    locked_until = Column((DateTime(timezone=True)), nullable=True)
    price = Column(Integer, nullable=False, default=100)

    showtime = relationship("ShowTime", back_populates="seats")

    __table_args__ = (UniqueConstraint("showtime_id", "row", "number", name="uix_showtime_row_number"),)

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    showtime_id = Column(Integer, ForeignKey("showtimes.id"), nullable=False, index=True)
    seats = Column(JSON, nullable=False)                  # [{"row":"A","number":1, "seat_id": 123}]
    total_amount = Column(Integer, nullable=False, default=0)
    status = Column(String(50), default="confirmed")      # confirmed/cancelled/refunded
    created_at = Column((DateTime(timezone=True)), default=datetime.now(timezone.utc))