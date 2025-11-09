from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import init_models

from app.api.authRoute import router as auth_router
from app.api.movieRoute import router as movieRouter
from app.api.showtimeRoute import router as showtimeRouter
from app.api.bookingRoute import router as bookingRouter
from app.api.webSocketRoute import router as webSocketRouter

# ✅ Allowed origins for dev (Frontend, Google login popup)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost",
    "http://127.0.0.1",
]

# ✅ Lifespan for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("🚀 Starting BookMyMovie backend...")
    await init_models()
    print("✅ Database models initialized successfully.")
    yield
    # Shutdown logic
    print("🛑 Shutting down BookMyMovie backend...")

# ✅ Create app instance with lifespan
app = FastAPI(title="BookMyMovie API", lifespan=lifespan)

# ✅ CORS setup (must be added before including routers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Allow cookies / Authorization headers
    allow_methods=["*"],     # Allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],     # Allow all headers including Authorization
)

# ✅ Routers
app.include_router(auth_router)
app.include_router(movieRouter)
app.include_router(showtimeRouter)
app.include_router(bookingRouter)
app.include_router(webSocketRouter)

@app.get("/")
def read_root():
    return {"message": "🎬 Welcome to BookMyMovie API"}
