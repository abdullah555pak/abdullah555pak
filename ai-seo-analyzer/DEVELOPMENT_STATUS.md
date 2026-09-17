# Development Status

Snapshot as of the end of **Category 01 — Project Foundation**. Update this
file at the end of every category so anyone (human or AI) picking up the
project can orient in under a minute.

## Current project status

Foundation complete, audited, and verified with a real clean-start test.
No product features exist yet — there is nothing that analyzes a website.
The project is a working skeleton: a frontend and backend that start,
talk to each other, validate input safely, and honestly report that
analysis isn't built yet.

## Technology stack

Matches the Step 02 approved architecture, with one documented deviation:

| Area | Chosen | Note |
|---|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS | Approved as Next.js 14; upgraded to **Next 16 / React 19** during Step 03 because 14.2.15 carried known critical CVEs. `npm audit` is clean at the current versions. |
| Backend | Python, FastAPI | As approved |
| Database | PostgreSQL, SQLAlchemy 2.0 (async), Alembic | As approved. No tables exist yet - schema arrives with the first real feature. |
| Background jobs | Celery + Redis | As approved. Wired and proven with a health-check task; no real job types yet. |
| Caching | Redis | As approved. Used for the readiness check today; rate limiting/caching not built yet. |
| Auth | Backend-owned JWT (planned) | Not implemented - no user accounts exist yet. |
| AI | Anthropic Claude (planned) | Not installed - no AI calls exist yet. |
| Payments | Stripe (planned) | Not installed. |
| External APIs | GSC / GA4 / PageSpeed / keyword / backlink providers (planned) | Not installed - empty provider module folders only. |
| Deployment | Vercel (web) / Render (api) (planned) | Not deployed. `infra/render.yaml` is an unused placeholder. |

Dependencies for anything not yet built are deliberately **not installed**,
per the "avoid unnecessary dependencies" rule carried through every step.

## What has been completed

- Repo/folder structure for the full future product (`apps/web`, `apps/api`,
  `packages/shared-types`, `infra/`, `docs/`).
- Backend: app factory, CORS, security response headers, per-request
  logging, safe error handling (no stack traces ever reach a client),
  liveness/readiness health checks, async DB engine/session + Alembic
  wiring, Celery/Redis wiring with a proof-of-life task.
- **SSRF-safe URL validator** (`app/core/security.py`) - rejects private/
  loopback/link-local/cloud-metadata addresses and disallowed schemes.
  This is the one piece of real "logic" in the project, and it's the
  piece every future crawler feature depends on.
- One real endpoint: `POST /v1/analyze` - validates the URL, then
  responds `501` with a clear "not implemented yet" message.
- Frontend: homepage with product name, one-line description, URL input,
  and an **Analyze Website** button that calls the real API and shows
  its honest response - never a fake score or result.
- Empty, named module packages for every future feature area (crawler,
  render, seo_engine checks, ai_explainer, GSC/GA4/keyword/backlink
  providers, reporting, billing, notifications).
- 60 backend tests + 4 frontend tests, all passing, including a
  dedicated SSRF malicious-URL battery, CORS-restrictiveness and
  error-leakage checks, and env-driven-config proof.
- A full foundation audit (Category 01, Step 04) that found and fixed a
  real issue (missing `.dockerignore` risking `.env`/`.venv` baked into
  a future image) and closed test-coverage gaps.

## What has NOT been implemented yet

- Website crawling (no HTTP fetching of target sites happens anywhere)
- Technical SEO / on-page / performance / ads analysis
- AI-generated explanations or a prioritized action plan
- Traffic, keyword, or backlink data (verified, estimated, or otherwise)
- Competitor analysis
- User accounts, authentication, or sessions
- Saved websites, scan history, or scheduled scans
- Reports, notifications, or alerts
- Subscriptions or payment processing
- Any database table or schema (the connection works; nothing is stored)
- Deployment of any kind

## How to run the project locally

**Prerequisites:** Node.js 20+, npm, Python 3.11+, [`uv`](https://docs.astral.sh/uv/), a local PostgreSQL 16, a local Redis 7.

```bash
# Backend
cd apps/api
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload      # http://localhost:8000

# Frontend (separate terminal)
cd apps/web
cp .env.example .env.local
npm install
npm run dev                                # http://localhost:3000
```

Or, from the repo root:

```bash
make api-install && make api-migrate && make api-dev
make web-install && make web-dev
```

Full details, including a Docker-based path for Postgres/Redis, are in
`README.md`.

## How to run tests

```bash
make api-test    # or: cd apps/api && uv run pytest      (60 tests)
make web-test    # or: cd apps/web && npm test            (4 tests)
```

## Important environment variables

Full documented lists live in `apps/api/.env.example` and
`apps/web/.env.example`. The ones that matter for local dev:

| Variable | App | Purpose |
|---|---|---|
| `DATABASE_URL` | api | Postgres connection string |
| `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | api | Redis / job queue |
| `ALLOWED_ORIGINS` | api | CORS allow-list (must include the frontend's URL) |
| `NEXT_PUBLIC_API_URL` | web | Where the frontend sends requests |

No secret-bearing variable (JWT keys, OAuth credentials, AI/Stripe API
keys) exists yet - they're listed, commented out, in
`apps/api/.env.example` as a preview of what's coming, not something to
fill in early.

## Known limitations

- No database tables exist - `alembic upgrade head` is currently a no-op.
- The URL validator only proves an address is *safe to eventually fetch*;
  it does not fetch anything. The real crawler (not built yet) must
  re-validate at actual connect time and on every redirect hop (DNS can
  answer differently between this check and a later real request).
- No rate limiting is wired up yet (documented as a near-term gap, not
  silently skipped).
- A stray Next.js-auto-generated `apps/web/CLAUDE.md` file exists on disk
  from before `agentRules: false` was set; it's git-ignored and harmless,
  but a repo-tooling restriction prevents this session from deleting it.
  Safe to delete by hand at any time.

## Next development category

**Category 02 — UI/UX.** Foundation is audited, tested, and confirmed to
start cleanly from a stopped state. Ready to proceed once approved.
