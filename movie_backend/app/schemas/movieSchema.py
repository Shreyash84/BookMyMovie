# app/schemas/movie.py
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class MovieBase(BaseModel):
    title: str
    description: Optional[str]
    poster_url: Optional[str]
    rating: Optional[str]
    release_date: Optional[datetime]


class MovieCreate(MovieBase):
    pass


class MovieOut(MovieBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ShowTimeOut(BaseModel):
    id: int
    movie_id: int
    start_time: datetime
    hall: Optional[str]

    class Config:
        from_attributes = True
