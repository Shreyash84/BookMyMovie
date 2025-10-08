from fastapi import FastAPI
from app.db.database import engine, Base, init_models
from app.api.authRoute import router as auth_router
from app.api.movieRoute import router as movieRouter

async def on_startup():
    await init_models()
    
app = FastAPI(on_startup=[on_startup])

app.include_router(auth_router)
app.include_router(movieRouter)

@app.get("/")
def read_root():
    return {"message": "Welcome to BookMyMovie"}
 