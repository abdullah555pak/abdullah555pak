"""
A trivial task proving the Celery/Redis job pipeline works end to end.
Real task types (crawl, render, ai_explain, notify) are added alongside
the features that need them.
"""
from app.core.celery_app import celery_app


@celery_app.task(name="health.ping")
def ping() -> str:
    return "pong"
