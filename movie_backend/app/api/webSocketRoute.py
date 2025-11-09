from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.broadcast import register_ws, unregister_ws
from app.services.redis_client import get_redis
import asyncio
import json

router = APIRouter()

@router.websocket("/ws/showtime/{showtime_id}")
async def websocket_endpoint(ws: WebSocket, showtime_id: int):
    await register_ws(showtime_id, ws)
    redis = get_redis()

    pubsub = redis.pubsub()
    await pubsub.subscribe(f"showtime:{showtime_id}")

    try:
        while True:
            msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if msg and msg["type"] == "message":
                try:
                    payload = json.loads(msg["data"])
                    await ws.send_json(payload)
                except Exception:
                    pass
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        unregister_ws(showtime_id, ws)
        await pubsub.unsubscribe(f"showtime:{showtime_id}")
