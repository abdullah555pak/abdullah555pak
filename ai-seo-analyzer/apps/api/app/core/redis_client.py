"""
Shared Redis client + a health-check helper. Redis is planned to serve the
job queue, rate limiting, and provider-response caching (see
docs/BLUEPRINT.md, Section C) - none of those uses are wired up yet.
"""
import redis.asyncio as redis

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)

redis_client = redis.from_url(settings.redis_url, decode_responses=True)


async def check_redis_connection() -> bool:
    try:
        return bool(await redis_client.ping())
    except Exception as exc:
        # Log only the exception type, never str(exc) or the Redis URL -
        # driver error messages can echo back connection details.
        logger.warning("redis_health_check_failed", error_type=type(exc).__name__)
        return False
