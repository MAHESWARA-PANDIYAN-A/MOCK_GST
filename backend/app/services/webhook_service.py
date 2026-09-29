import datetime
import httpx
from app.core.config import settings

async def dispatch_webhook(event_name: str, payload: dict):
    if not settings.WEBHOOK_URL:
        return
    
    data = {
        "event": event_name,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        **payload
    }
    
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            response = await client.post(settings.WEBHOOK_URL, json=data)
            print(f"Webhook {event_name} dispatched to {settings.WEBHOOK_URL}: {response.status_code}")
    except Exception as e:
        print(f"Webhook dispatch failed (non-blocking): {e}")
