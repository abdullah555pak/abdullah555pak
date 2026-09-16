"""
Liveness and readiness endpoints.

/healthz        - liveness only: "is the process up". No dependency calls,
                  so it can't fail just because Postgres/Redis are slow.
/v1/health      - readiness: reports each dependency's status individually
                  rather than throwing a 500 if one is down.
"""
from fastapi import APIRouter

from app.core.redis_client import check_redis_connection
from app.db.session import check_database_connection

router = APIRouter(tags=["health"])


@router.get("/healthz")
async def liveness() -> dict:
    return {"status": "ok"}


@router.get("/health")
async def readiness() -> dict:
    db_ok = await check_database_connection()
    redis_ok = await check_redis_connection()
    overall = "ok" if db_ok and redis_ok else "degraded"
    return {
        "status": overall,
        "dependencies": {
            "database": "ok" if db_ok else "unavailable",
            "redis": "ok" if redis_ok else "unavailable",
        },
    }
