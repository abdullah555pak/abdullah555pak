from fastapi import APIRouter

from app.api.v1.routers import analyze

# Health endpoints are mounted separately at the app root (no /v1 prefix) -
# see app/main.py - since liveness/readiness checks shouldn't depend on an
# API version.
api_router = APIRouter(prefix="/v1")
api_router.include_router(analyze.router)
