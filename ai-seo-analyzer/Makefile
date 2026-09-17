.PHONY: api-install api-dev api-test api-migrate api-worker web-install web-dev web-test web-build

# --- Backend ---
api-install:
	cd apps/api && uv sync

api-dev:
	cd apps/api && uv run uvicorn app.main:app --reload

api-test:
	cd apps/api && uv run pytest

api-migrate:
	cd apps/api && uv run alembic upgrade head

api-worker:
	cd apps/api && uv run celery -A app.core.celery_app.celery_app worker --loglevel=info

# --- Frontend ---
web-install:
	cd apps/web && npm install

web-dev:
	cd apps/web && npm run dev

web-test:
	cd apps/web && npm test

web-build:
	cd apps/web && npm run build
