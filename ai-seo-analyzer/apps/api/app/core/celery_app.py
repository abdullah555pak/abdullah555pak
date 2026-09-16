"""
Background-job foundation.

This wires up Celery against Redis so the queue exists and can be proven
to work (see app/workers/tasks/health.py). No real job types (crawl,
render, AI-explain, notifications) are defined yet - those queues are
named here as placeholders for when those features are built.
"""
from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "sitewell",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks.health"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_default_queue="default",
)

# Future queues (declared here, not yet in use): "crawl", "render", "ai",
# "notifications" - added when the tasks that need them are built.
