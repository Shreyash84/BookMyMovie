# app/api/v1/movies.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.db.database import get_db
from app.api.deps import get_current_user
from app.schemas.movieSchema import MovieCreate, MovieOut, ShowTimeOut
from app.db.crud import create_movie, list_movies, create_showtime, bulk_create_seats, get_movie

router = APIRouter(
    prefix="/movie",
    tags=["Movie"],
)

@router.post("/create", response_model=MovieOut)
async def create_movie_endpoint(payload: MovieCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # only admin (example)
    print("Current User:", user.email, "Is Admin:", user.is_admin)  #type: ignore
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    movie = await create_movie(db, **payload.dict())  #type: ignore
    await db.commit()
    await db.refresh(movie)
    return movie

@router.put("/update/{movie_id}", response_model=MovieOut)
async def update_movie_endpoint(movie_id: int, payload: MovieCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # only admin (example)
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    movie = await get_movie(db, movie_id)
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    for key, value in payload.dict().items(): 
        setattr(movie, key, value)
    db.add(movie)
    await db.commit()
    await db.refresh(movie)
    return movie

@router.get("/list", response_model=list[MovieOut])
async def list_movies_endpoint(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    movies = await list_movies(db, skip, limit)
    return movies


@router.post("/{movie_id}/showtimes", response_model=ShowTimeOut)
async def create_showtime_endpoint(movie_id: int, start_time: datetime, hall: str = "Main Hall", rows: str = "A,B,C,D", cols: int = 10, price: int = 100, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # admin only
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    st = await create_showtime(db, movie_id, start_time, hall)
    await db.commit()
    # generate seat layout
    rows_list = [r.strip() for r in rows.split(",")]
    await bulk_create_seats(db, st.id, rows_list, cols, price=price)  #type: ignore
    await db.commit()
    await db.refresh(st)
    return st


@router.get("/{movie_id}", response_model=MovieOut)
async def get_movie_endpoint(movie_id: int, db: AsyncSession = Depends(get_db)):
    movie = await get_movie(db, movie_id)
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return movie
