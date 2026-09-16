"""
Shared Redis client + a health-check helper. Redis is planned to serve the
job queue, rate limiting, and provider-response caching (see
docs/BLUEPRINT.md, Section C) - none of those uses are wired up yet.
"""
import redis.asyncio as redis

from app.core.config import get_settings

settings = get_settings()

redis_client = redis.from_url(settings.redis_url, decode_responses=True)


async def check_redis_connection() -> bool:
    try:
        return bool(await redis_client.ping())
    except Exception:
        return False
