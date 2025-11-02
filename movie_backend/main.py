from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.db.database import engine, Base, init_models
from app.api.authRoute import router as auth_router
from app.api.movieRoute import router as movieRouter
from app.api.showtimeRoute import router as showtimeRouter
from app.api.bookingRoute import router as bookingRouter
from app.services.broadcast import register_ws, unregister_ws
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


async def on_startup():
    await init_models()
    
app = FastAPI(on_startup=[on_startup])

app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,  # Allow cookies and authorization headers
        allow_methods=["*"],     # Allow all methods (GET, POST, PUT, DELETE, etc.)
        allow_headers=["*"],     # Allow all headers
    )

app.include_router(auth_router)
app.include_router(movieRouter)
app.include_router(showtimeRouter)
app.include_router(bookingRouter)

@app.get("/")
def read_root():
    return {"message": "Welcome to BookMyMovie"}
 
@app.websocket("/ws/showtime/{showtime_id}")
async def websocket_showtime(websocket: WebSocket, showtime_id: int):
    await register_ws(showtime_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()  # keep it alive; in real use handle ping/pong
            # echo or ignore
            await websocket.send_text("ok")
    except WebSocketDisconnect:
        unregister_ws(showtime_id, websocket)