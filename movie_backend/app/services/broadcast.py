# app/services/broadcast.py
from typing import Dict, Set
from fastapi import WebSocket

# simple in-memory broadcaster indexed by showtime_id
_connections: Dict[int, Set[WebSocket]] = {}


async def register_ws(showtime_id: int, ws: WebSocket):
    await ws.accept()
    conns = _connections.setdefault(showtime_id, set())
    conns.add(ws)


def unregister_ws(showtime_id: int, ws: WebSocket):
    conns = _connections.get(showtime_id)
    if conns and ws in conns:
        conns.remove(ws)


async def broadcast_to_showtime(showtime_id: int, payload: dict):
    conns = list(_connections.get(showtime_id, []))
    to_remove = []
    for ws in conns:
        try:
            await ws.send_json(payload)
        except Exception:
            to_remove.append(ws)
    for ws in to_remove:
        unregister_ws(showtime_id, ws)
