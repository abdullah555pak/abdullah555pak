# Sitewell — AI Website SEO & Growth Analyzer

Status: **project foundation only.** There is no crawler, SEO engine, or AI
analysis yet — see `docs/BLUEPRINT.md` for the full product/architecture
plan and its phased roadmap. This README covers what exists today: a
Next.js frontend, a FastAPI backend with one real endpoint (URL safety
validation), and the scaffolding both will grow into.

## What's actually here right now

- A homepage where you can type a URL and click **Analyze Website**.
- A backend that validates the URL is safe to eventually scan (rejects
  private/internal addresses, disallowed schemes, malformed input) and
  responds with a clear "not implemented yet" — never fake results.
- Health-check endpoints, structured logging, safe error handling, and an
  empty Celery/Redis job queue proven to work.
- Empty, named module folders for every future feature area (crawler,
  SEO checks, AI explainer, GSC/GA4/keyword/backlink integrations,
  billing, notifications, etc.) so later steps have an agreed home to
  build into.

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+ and [`uv`](https://docs.astral.sh/uv/) (`pip install uv` if you don't have it)
- PostgreSQL 16 (running locally, or via Docker)
- Redis 7 (running locally, or via Docker)

## 1. Backend setup (`apps/api`)

```bash
cd apps/api
cp .env.example .env        # edit if your local Postgres/Redis differ from the defaults
uv sync                     # installs dependencies into a local .venv
```

Make sure Postgres and Redis are running and match your `.env` (defaults
assume a local Postgres on 5432 with user/password `postgres` and a local
Redis on 6379). If you don't have them installed, the quickest path is
Docker:

```bash
docker compose -f ../../infra/docker-compose.yml up postgres redis
```

Run the database migrations (there are no tables yet, so this is
currently a no-op — it proves the connection and Alembic wiring work):

```bash
uv run alembic upgrade head
```

Start the API:

```bash
uv run uvicorn app.main:app --reload
```

The API is now at `http://localhost:8000`. Interactive docs: `http://localhost:8000/docs`.

(Optional) start a worker to prove the background-job pipeline works:

```bash
uv run celery -A app.core.celery_app.celery_app worker --loglevel=info
```

## 2. Frontend setup (`apps/web`)

In a separate terminal:

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. Type any website address and click
**Analyze Website** — it will tell you plainly that analysis isn't built
yet (it does not pretend to show a score or results).

## Running tests

```bash
# Backend
cd apps/api && uv run pytest

# Frontend
cd apps/web && npm test
```

Or, from the repo root, using the provided `Makefile`:

```bash
make api-install && make api-test
make web-install && make web-test
```

## Project layout

```
ai-seo-analyzer/
├── apps/
│   ├── web/     # Next.js frontend
│   └── api/     # FastAPI backend (modular monolith; see app/modules/)
├── packages/
│   └── shared-types/   # reserved for generated API types
├── infra/
│   ├── docker-compose.yml   # local Postgres/Redis/API/worker
│   └── render.yaml          # placeholder deploy config, not yet used
└── docs/
    └── BLUEPRINT.md          # full architecture & roadmap
```

## Environment variables

Each app has a `.env.example` documenting every variable it reads —
`apps/api/.env.example` and `apps/web/.env.example`. Copy them to `.env`
(API) and `.env.local` (web) and fill in values for your machine. Real
`.env` files are git-ignored and must never be committed.

## What's intentionally not here yet

No crawler, no SEO checks, no AI calls, no auth, no payments, no paid
external API integrations, no deployment. Those arrive in later
development steps per the phased roadmap in `docs/BLUEPRINT.md`.
