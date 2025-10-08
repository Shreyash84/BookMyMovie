# app/db/base.py

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# ✅ Async engine
engine = create_async_engine(
    settings.DATABASE_URL
)

# ✅ Async session factory
async_session = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession
)

# ✅ Base model
Base = declarative_base()

# ✅ Helper to initialize tables (only for development)
async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ✅ Dependency to get async DB session per request
async def get_db():
    async with async_session() as db:
        yield db
