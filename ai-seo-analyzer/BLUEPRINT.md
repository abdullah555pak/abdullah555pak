# AI Website SEO & Growth Analyzer — Master Technical Blueprint

Status: **Planning only.** No implementation code in this document or commit. This is the
architecture every later phase must follow.

## 0. Product summary

A user pastes a public URL, clicks **Analyze Website**, and gets back one simple report:
what's good, what's wrong, what to fix, in plain language, with a prioritized to-do list.
Everything technical (raw Lighthouse scores, header dumps, regex-matched schema errors) exists,
but hidden behind "Show technical details" toggles. The product's hard problem is not the UI —
it's building a backend that safely crawls arbitrary attacker-controlled URLs, degrades honestly
when data isn't available, and can grow from "one free scan" to "monitored portfolio of sites
with scheduled scans and paid tiers" without a rewrite.

Three design commitments carried through every section below:

1. **Simple surface, honest backend.** The UI never has more than a handful of visible
   choices. The backend is allowed to be as sophisticated as it needs to be.
2. **No invented numbers.** Every data point is tagged `verified | estimated | detected |
   unavailable` at the data model level, not just in the UI copy, so it can't be lost in a
   refactor.
3. **Every external integration is optional and pluggable.** The product must work (with
   reduced depth) if Search Console, GA4, keyword APIs, or backlink APIs are never connected.

---

## A. Recommended technology stack and why

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (React) + TypeScript, Tailwind CSS** | SSR for fast first paint of the report, file-based routing for `/report/[id]`, one codebase for marketing pages + app, huge ecosystem, easy path to a future mobile-friendly PWA. |
| API layer | **Node.js (NestJS) or Python (FastAPI)** — recommend **FastAPI** | The SEO/crawling/AI-analysis domain is Python-native (BeautifulSoup, readability parsers, tokenizers, ML libs, Playwright). FastAPI gives typed request/response models (Pydantic) which map cleanly onto the verified/estimated/detected/unavailable data contract. NestJS is the fallback if the team is TypeScript-only — the architecture below is language-agnostic at the service-boundary level. |
| Job queue / async workers | **Redis + Celery (Python) or BullMQ (Node)** | Crawling and analysis must never block an HTTP request; scans run as background jobs with progress polling/streaming. |
| Headless browser | **Playwright (Chromium)**, pooled via a dedicated **render service** | Needed for JS-rendered sites, Core Web Vitals, and screenshot capture. Isolated into its own service because it's the most resource-hungry, most exploitable (SSRF, zip bombs, infinite redirects) component. |
| Primary database | **PostgreSQL** | Relational integrity for users/sites/scans/subscriptions; JSONB columns for flexible per-check result payloads; mature, cheap to scale vertically first. |
| Cache / rate limiting / queue backing | **Redis** | Job queue, per-IP/user rate limiting counters, short-lived crawl result caching, distributed locks (don't scan the same URL twice concurrently). |
| Object storage | **S3-compatible (S3 / R2 / MinIO)** | Screenshots, raw HTML snapshots, HAR files, PDF report exports. Never store large blobs in Postgres. |
| Search/analytics (later phase) | **OpenSearch/Elasticsearch or ClickHouse** | Historical trend queries across millions of scan rows, once scan volume justifies it. Not needed at MVP — Postgres handles it fine for phase 1–2. |
| AI provider | **Claude (Anthropic API)** via a thin internal `AIExplainerService` | Used only for *explaining* and *prioritizing* findings in beginner language — never for producing the underlying facts (those come from deterministic checks). Abstracted behind an interface so the provider is swappable. |
| Infra / deployment | **Docker containers, orchestrated on a managed platform (e.g., Kubernetes, ECS, or Fly/Render for MVP)** | Crawler/render workers need independent horizontal scaling and stricter network policy than the API and web tiers. |
| Payments | **Stripe (Billing + Customer Portal)** | Industry standard, handles plan changes, invoicing, webhooks; avoids building PCI-scoped code. |
| Auth | **Managed auth (e.g., Auth.js/NextAuth, Clerk, or Supabase Auth) backed by our own `users` table** | Avoid hand-rolling password storage; still keep our own user/org tables as source of truth for entitlements. |

Everything above is chosen so each layer can be replaced independently — the crawler doesn't
know about Stripe, the AI service doesn't know about the database schema, the frontend only
ever talks to one API gateway.

---

## B. Frontend architecture

**Principle: one primary action, one result screen, complexity hidden in disclosure widgets.**

- **Pages**
  - `/` — URL input + "Analyze Website" button. Nothing else above the fold.
  - `/scan/[scanId]` — live progress ("Crawling… Checking SEO… Checking performance… Asking AI to
    explain results…") using polling or a WebSocket/SSE channel to the job status.
  - `/report/[reportId]` — the report itself (see layout below).
  - `/dashboard` — (post-auth) saved sites, scan history, monitoring status.
  - `/pricing`, `/account`, `/billing`.
- **Report layout (top to bottom)**
  1. **Score summary** — one overall score + 3–5 category scores (SEO, Performance, Technical,
     Content, Monetization) as simple gauges. No jargon in labels.
  2. **Top 3 things to fix first** — the prioritized action plan, always visible, plain language.
  3. **What's good** — short positive list (keeps the tone constructive).
  4. **Issues grouped by category**, each issue rendered as a card:
     - Plain-language title ("Your images don't have descriptions")
     - Why it matters (1–2 sentences)
     - Step-by-step fix (numbered)
     - A `<Details>` accordion: "Show technical details" (raw selector, HTTP header, code
       snippet, the exact rule that fired)
     - A **data badge**: Verified / Estimated / Detected / Unavailable, always rendered, never
       omitted even when a section is empty.
  5. **Traffic, Keywords, Backlinks, Competitors** — these render as cards that either show data
     (with source + confidence badge) or an honest "We don't have reliable data for this yet —
     here's how to unlock it" empty state (e.g., "Connect Google Search Console").
  6. **Re-scan button** and **"Track this website" (save + monitor)** call to action.
- **Component principles**
  - A single `<Finding>` component renders every issue everywhere (report, PDF export, email
    digest) so tone/format never drifts.
  - No SEO terminology in top-level copy without a plain-language rewrite; a
    `glossary.json` maps every technical term to a one-line explanation shown on hover/tap.
  - Fully responsive/mobile-first; report must be legible on a phone since that's how many
    non-technical users will open a shared link or email.
- **State/data fetching:** server components for the report shell (fast, cache-friendly, SEO'd
  itself), client components only for interactive bits (accordions, re-scan button, live
  progress).

---

## C. Backend architecture

Service-oriented from day one, but deployed as a **modular monolith first** (one deployable
that's internally split into modules matching the future services) so we don't pay
microservice operational overhead before we have the traffic to need it. Boundaries are chosen
so each module can be peeled into its own service later with no API contract change.

```
apps/
  api-gateway/        # public REST/GraphQL API, auth, rate limiting, request validation
  scan-orchestrator/   # owns the scan state machine, enqueues jobs, aggregates results
  crawler-service/     # fetches pages, respects robots.txt, SSRF-safe networking
  render-service/      # Playwright pool, isolated network namespace
  seo-engine/          # deterministic rule checks over crawled data
  ai-explainer/        # turns findings into beginner language + prioritization (LLM calls)
  integrations/        # GSC, GA4, keyword APIs, backlink APIs, ads-network detection
  reporting/           # assembles final report JSON, historical diffing, PDF export
  billing/             # Stripe integration, plan entitlements
  notifications/       # email/alerts for scheduled scans and regressions
```

- **Communication:** internal modules talk via an in-process function call in the monolith
  phase; the contract is already an async **job/event** shape (`ScanRequested`,
  `PageCrawled`, `ChecksCompleted`, `ReportReady`) so swapping in-process calls for a message
  queue (e.g., moving `render-service` to its own pod) is a deployment change, not a rewrite.
- **Scan state machine:** `queued → crawling → analyzing → ai_explaining → completed | failed
  | partial` — "partial" is a first-class state (see Section X): a scan that got a robots.txt
  block on half its checks still returns a report, clearly marked.
- **API surface (representative, not final):**
  - `POST /v1/scans` `{url}` → `{scanId}`
  - `GET /v1/scans/:id` → status + progress
  - `GET /v1/reports/:id` → full report JSON
  - `POST /v1/sites` (save a site for monitoring) — auth required
  - `POST /v1/sites/:id/schedule` (cron-style recurring scans) — paid plans
  - `GET /v1/sites/:id/history` — historical score/report list
- All endpoints behind a single **API gateway** that owns authn/z, rate limiting, and request
  validation, so every downstream module can trust its inputs.

---

## D. Database architecture

PostgreSQL, normalized core tables + JSONB for extensible check payloads.

```
users(id, email, auth_provider_id, plan_id, created_at, ...)
organizations(id, name, owner_user_id, ...)          -- future team accounts
sites(id, org_id/user_id, root_url, verified_owner BOOLEAN, created_at)
scans(id, site_id, requested_by_user_id, status, started_at, finished_at,
      crawl_summary JSONB, error_reason TEXT NULL)
pages_crawled(id, scan_id, url, http_status, fetched_at, raw_html_object_key,
              rendered BOOLEAN, screenshot_object_key)
findings(id, scan_id, category, severity, code, title, explanation,
         fix_steps JSONB, data_confidence ENUM('verified','estimated','detected','unavailable'),
         raw_evidence JSONB)
scores(id, scan_id, category, score, max_score)
reports(id, scan_id, summary JSONB, generated_at)          -- denormalized, cache-friendly
integrations(id, user_id/site_id, provider ENUM('gsc','ga4','keyword_api','backlink_api'),
             oauth_tokens ENCRYPTED, status, last_synced_at)
external_data_cache(id, site_id, provider, data_type, payload JSONB, fetched_at, expires_at)
keyword_opportunities(id, site_id, keyword, source, volume_estimate, difficulty_estimate,
                       confidence ENUM(...))
backlinks(id, site_id, source_domain, target_url, discovered_at, source_provider, confidence)
competitors(id, site_id, competitor_url, added_by, comparison_data JSONB)
subscriptions(id, user_id, stripe_customer_id, plan, status, current_period_end)
scan_schedules(id, site_id, cron_expression, plan_required, next_run_at)
alerts(id, site_id, type, triggered_at, payload JSONB, delivered BOOLEAN)
audit_log(id, actor, action, target, created_at)          -- security/compliance trail
```

Design notes:
- `data_confidence` is a column, not UI logic — every query that reads a finding/metric
  carries its trust level with it by construction.
- Raw HTML, screenshots, HARs go to **object storage**, referenced by key — keeps Postgres
  small and fast, and lets us apply independent retention/lifecycle policies (e.g., purge raw
  HTML after 30 days, keep findings forever).
- `external_data_cache` is a generic cache table so every external API integration (Section H)
  shares one TTL/expiry mechanism instead of each integration inventing its own caching.
- Partition `scans`, `pages_crawled`, and `findings` by time (e.g., monthly range partitions)
  once volume grows — schema supports it from day one by keeping `created_at`/`started_at` as
  the leading index column.
- Read replicas for the dashboard/history queries once write load from active crawls
  contends with read-heavy reporting.

---

## E. Crawler architecture

The crawler is the highest-risk, highest-value component (arbitrary user-supplied URLs) and is
isolated accordingly.

- **Two-stage fetch:**
  1. **Static fetch** (fast path): plain HTTP client (no cookies/JS) fetches HTML, headers,
     robots.txt, sitemap.xml. Used for most technical/SEO checks.
  2. **Rendered fetch** (Playwright, only when needed — JS-heavy sites, Core Web Vitals,
     visual/ads detection): runs in the isolated `render-service` with a hard resource budget.
- **Crawl scope control:** MVP crawls the entered URL + a bounded set of internally-linked
  pages (e.g., homepage + up to N pages via sitemap or same-domain link discovery, N capped by
  plan tier). Full-site crawls are a paid/async "deep scan" job, not a blocking part of the
  first free scan.
- **Politeness & compliance:** always fetch and honor `robots.txt` and `X-Robots-Tag` /
  `noindex` meta before crawling further pages; respect `Crawl-delay`; identify with a clear,
  honest `User-Agent` (`AIWebsiteAnalyzerBot/1.0 (+https://ourdomain.com/bot)`) and provide a
  real bot-info page and opt-out mechanism (domain block-list) for site owners who don't want
  to be scanned.
- **SSRF and abuse containment (see Section N for full detail):**
  - Resolve DNS and re-validate the resolved IP is public before every connection (blocks
    `localhost`, `127.0.0.0/8`, `169.254.169.254` cloud metadata, RFC1918 ranges, IPv6
    equivalents), and re-check on every redirect hop (DNS rebinding defense).
  - Crawler and renderer run in network-namespaced containers with an egress allow-list
    (HTTP/HTTPS only, no internal service ranges reachable).
  - Hard caps: max redirects (5), max response size (e.g., 15MB per resource), max total pages
    per scan, per-page and per-scan wall-clock timeout, max concurrent connections per target
    domain (also politeness).
  - Content-type allow-list before parsing; never execute or `eval` fetched content outside the
    sandboxed renderer.
- **Output contract:** the crawler doesn't interpret anything — it produces a normalized
  `CrawlResult` (HTML, headers, timing, screenshot ref, console errors, network waterfall,
  robots/sitemap data) that downstream analysis modules consume. Keeping the crawler "dumb"
  means new checks never require touching networking code.

---

## F. SEO analysis engine architecture

A **rule-based, pluggable check registry** — not a monolithic script — so checks can be added,
versioned, and unit-tested independently.

```
interface Check {
  id: string;                // e.g. "missing-meta-description"
  category: "technical" | "onpage" | "performance" | "content" | "monetization";
  run(crawlResult): FindingOrNull;
  dataConfidence: "verified" | "estimated" | "detected";
}
```

- Checks are pure functions over the `CrawlResult` (+ optional external-data inputs) →
  deterministic, testable with fixture HTML, versionable (bump `code` version when a rule's
  logic changes so historical trend charts stay meaningful).
- Categories mirror the report UI sections directly: technical SEO (robots/sitemap/canonical/
  status codes/redirect chains/HTTPS/mobile viewport/structured data), on-page/content
  (titles, meta descriptions, heading structure, keyword usage, content length/duplication,
  image alt text), performance (Core Web Vitals via Lighthouse/CrUX where available, resource
  weight, render-blocking assets), monetization/ads signals (Section I).
- **Scoring:** each check contributes a weighted point value to its category score; weights
  live in config (versioned, not hardcoded) so scoring methodology can evolve without code
  changes, and every score change is explainable ("you lost 5 points because...").
- **Severity model:** `critical | warning | info` maps directly to how findings are sorted in
  the "what to fix first" plan (combined with estimated effort/impact — see Section G).
- The engine is run entirely server-side, is fast (target: seconds, not minutes for the static
  checks), and never calls out to paid APIs — those are optional enrichments layered on top
  (Section H), so the core product works with zero external API cost.

---

## G. AI analysis architecture

The AI's job is **explanation and prioritization**, never fact invention.

- **Strict input/output contract:** `AIExplainerService` receives the *already-computed*,
  structured findings (from Section F/I/J/K/L) plus site context (industry guess, page type) —
  it is never given raw HTML and asked to "find SEO problems" freeform, which would risk
  hallucinated, non-actionable, or inconsistent results.
- **What the AI is used for:**
  1. Rewriting each deterministic finding into a beginner-friendly explanation + step-by-step
     fix, from a controlled prompt template per finding `code` (consistent tone, reviewable).
  2. Producing the **prioritized action plan**: given the list of findings with severity/effort
     metadata, rank the top N by (impact × ease), explained in one sentence each.
  3. Optional narrative summary ("Your site's biggest opportunity is...") — clearly labeled as
     AI-generated commentary, distinct from the underlying verified/estimated data.
- **Guardrails:**
  - Every AI output is *attached to* a finding `code` that already has a deterministic,
    human-written fallback explanation — if the AI call fails, times out, or is disabled (cost
    control), the report still ships with the fallback text. AI is an enhancement layer, never
    a dependency for correctness.
  - Prompts explicitly forbid ranking guarantees, ranking predictions, or invented statistics;
    a post-generation validator scans AI output for banned phrases (e.g., "guaranteed to rank
    #1", specific traffic-increase percentages not backed by data) and falls back to the
    template text if triggered.
  - Responses are cached per `(finding_code, content_hash)` so identical findings across
    thousands of scans don't re-trigger the LLM — this is also the primary cost control lever.
- **Provider abstraction:** `AIExplainerService` is an interface; Claude is the initial
  implementation, chosen so model/provider can change without touching callers.

---

## H. External API architecture

All third-party data providers sit behind one **integrations gateway** pattern so adding a new
provider never touches core scan logic.

```
interface DataProvider {
  name: string;
  isConfigured(site): boolean;          // e.g., OAuth connected?
  fetch(site, params): ProviderResult;  // normalized shape + confidence + source + fetchedAt
  cachePolicyTtl: Duration;
}
```

- Concrete providers (each independently pluggable/optional, added in later phases):
  - **Google Search Console** (OAuth) — real impressions/clicks/queries → `verified` traffic
    and keyword data when connected.
  - **Google Analytics 4** (OAuth) — real traffic/behavior data → `verified`.
  - **PageSpeed Insights / CrUX API** — real-user performance data where available
    (`verified`), lab data (`estimated`) as fallback.
  - **Keyword data API** (e.g., a licensed keyword-volume provider) — `estimated` unless the
    site owner has connected GSC, in which case actual query data is `verified`.
  - **Backlink data API** (e.g., a licensed backlink index provider) — inherently a sample of
    the web, always labeled `estimated`/partial, never presented as exhaustive.
- **Every provider call goes through:** the generic cache (`external_data_cache`, Section D),
  a circuit breaker (a flaky provider degrades to "unavailable" rather than hanging the scan),
  and a per-plan quota check (Section P).
- Reports never block on optional providers — the scan pipeline fetches what's configured and
  available within a timeout budget, and marks the rest `unavailable` with a clear reason
  ("Connect Google Search Console to see real search traffic").

---

## I. Ads detection architecture

A dedicated check category, not bolted onto content checks:

- **Detected signals** (from crawl + rendered DOM): known ad-network script tags/iframes
  (Google AdSense/Ad Manager, Media.net, Taboola/Outbrain, etc. matched against a maintained
  signature list), affiliate-link patterns (`rel=sponsored`, common affiliate URL shapes),
  analytics/monetization pixels.
- **Rendered-page checks** (needs `render-service`): ad density vs. content ratio, layout shift
  caused by ad slots (ties into Core Web Vitals/CLS), intrusive interstitial detection.
- **Output:** monetization findings like "You have ads that may be slowing your site down" or
  "No monetization detected — if you intend to monetize, here are common options" — always
  `detected` confidence (we can only say what signature matched, never claim exact ad revenue).
- Signature list lives in versioned config, updated independently of core code deploys.

---

## J. Traffic/audience data architecture

- **No traffic estimation without a real source presented as fact.** Traffic is one of three
  states per site:
  1. `verified` — GA4/GSC connected → real numbers, real trend charts.
  2. `estimated` — a licensed third-party traffic-estimation API result, clearly labeled
     "Estimated — third-party model, not exact" with the provider named.
  3. `unavailable` — no source connected → UI shows "We don't have traffic data yet" plus a CTA
     to connect GA4/GSC, never a fabricated number or placeholder chart.
- Historical traffic (once a site is monitored) is stored as time series
  (`site_id, date, sessions, source`) so we can chart real trend lines once connected, and the
  chart itself distinguishes verified vs estimated segments visually (not just in a tooltip).

---

## K. Keyword architecture

- Two independent lanes, both surfaced with confidence badges:
  1. **Actual performance keywords** (verified) — from GSC once connected: what you already
     rank for, impressions, position.
  2. **Opportunity keywords** (estimated) — from a licensed keyword-volume API, matched against
     on-page content gaps found by the SEO engine (Section F): "your page talks about X but
     doesn't target the related search term Y, which gets an estimated Z searches/month."
- Keyword suggestions always route back into a **fix step** ("Add a section about Y to this
  page") rather than being presented as a bare, actionless list — ties back to requirement #14
  (exact instructions) and keeps a beginner from staring at a keyword table with no idea what
  to do.
- No keyword-difficulty/volume number is ever shown without its provider name and "estimated"
  label, since these numbers vary significantly by source.

---

## L. Backlink architecture

- Backlink data always comes from a licensed third-party backlink index (no provider crawls
  "the whole web" itself in this product — that's a multi-year, massive-infra undertaking out
  of scope) — always labeled `estimated`/partial coverage.
- Report surfaces: total referring domains (approximate), notable new/lost links since last
  scan (once monitoring is active — this is a real diff, so it can be `verified` *relative to
  our own last snapshot* even though the absolute number is `estimated`), and toxic/spammy
  link flags (`detected` via heuristics, reviewed not auto-acted-on).
- Cached aggressively (`external_data_cache`) — backlink indexes update slowly and are usually
  the most expensive API calls per lookup, so TTL here is the longest of any provider (days,
  not hours).

---

## M. Competitor analysis architecture

- User (or AI, from industry/content signals) supplies 1–3 competitor URLs.
- Competitor pages get the **same deterministic SEO engine** (Section F) run against them
  (lighter-weight: no full monitoring, no AI explanation per competitor finding — just scores)
  so comparisons are apples-to-apples, not a different heuristic.
- Traffic/keyword/backlink comparison columns follow the same confidence-labeling rules as
  Sections J/K/L — most competitor traffic data will be `estimated` or `unavailable` unless a
  paid provider is connected, and the UI says so rather than showing blank-looking silence.
- Competitor scans are rate-limited/queued at lower priority than the user's own site scan —
  never block the primary report on competitor analysis; competitor comparison can arrive as a
  progressive enhancement to the report a few seconds/minutes later.

---

## N. Security architecture

Security is foundational, not a phase — called out explicitly because the core feature
(user-submitted URL → server-side fetch) is a textbook SSRF vector.

- **SSRF defense in depth** (the crawler section's controls, restated as policy):
  1. URL scheme allow-list: `http`/`https` only — reject `file://`, `ftp://`, `gopher://`,
     `data:`, etc.
  2. Resolve hostname → IP **before** connecting; reject private/reserved/loopback/link-local
     ranges (RFC1918, 127.0.0.0/8, 169.254.0.0/16 including the `169.254.169.254` cloud
     metadata address, ::1, fc00::/7, etc.) and re-resolve/re-check on *every* redirect hop to
     defeat DNS-rebinding and open-redirect chaining.
  3. Outbound network calls from crawler/render workers happen inside a network policy that
     physically cannot reach internal services, the orchestration control plane, or the cloud
     metadata endpoint — enforced at the infra layer (egress firewall/NAT rules), not just in
     application code, so a code bug alone can't cause an SSRF breach.
  4. No credentials, service tokens, or internal DNS are present in the crawler container's
     environment at all (principle of least privilege — it has nothing worth exfiltrating even
     if fully compromised by a malicious target page).
- **Rendered content isolation:** Playwright runs with `--no-sandbox` disabled (sandbox ON),
  disables file downloads, disables devtools protocol exposure externally, runs as a
  non-root, ephemeral, single-use browser context per scan (destroyed after, never reused
  across users/sites to prevent cross-scan data leakage via cache/cookies).
- **Input validation:** URL parsing/normalization with a strict library, punycode/homograph
  awareness (surface a warning if a submitted domain looks like a lookalike of a popular
  domain — informational, not blocking), max URL length, reject credentials-in-URL
  (`user:pass@host`).
- **Application security:** standard OWASP Top 10 hygiene — parameterized queries/ORM only,
  output encoding for any user-influenced content rendered in the report (page titles,
  meta descriptions pulled from the target site are *untrusted HTML* and must be rendered as
  text, never injected as HTML, to prevent stored XSS via a malicious target site's own
  content), CSRF protection on state-changing endpoints, strict CSP on the frontend.
- **Secrets management:** OAuth tokens for GSC/GA4 and API keys for paid data providers
  encrypted at rest (KMS-backed), never logged, scoped per-integration with minimal OAuth
  scopes requested.
- **Tenant isolation:** row-level ownership checks on every query touching `sites`, `scans`,
  `reports` — a user must never be able to fetch another user's saved-site history by guessing
  an ID (use non-sequential IDs/UUIDs + explicit ownership checks, not security-by-obscurity
  alone).
- **Audit logging** of auth events, integration connects/disconnects, plan changes, and admin
  actions.

---

## O. Rate limiting and abuse prevention

- **Multi-layer limits:**
  - Per-IP and per-account request-rate limits at the API gateway (token bucket in Redis).
  - Per-account **scan quota** by plan tier (e.g., free: 3 scans/day, 1 concurrent; paid tiers
    higher), enforced before a job is enqueued, not after crawling starts.
  - Global concurrency cap on active crawl/render jobs (protects shared infra from a burst).
  - Per-target-domain rate limiting independent of who requested it (don't let 50 different
    free users trigger 50 simultaneous crawls of the same target site — dedupe/queue by
    normalized domain, and reuse a very-recent cached scan result when appropriate).
- **Abuse-specific protections:**
  - CAPTCHA or equivalent (e.g., Cloudflare Turnstile) on anonymous/unauthenticated scan
    submission to blunt scripted mass-scanning.
  - Detect and block scan requests targeting our own infrastructure's public hostnames
    (prevents recursive self-scanning abuse loops).
  - Domain block-list/allow-list: site owners can request their domain be excluded from
    third-party scans (robots.txt-style opt-out, honored even if a different user requests it).
  - Anomaly detection on account behavior (e.g., one account scanning thousands of distinct
    domains rapidly → likely reconnaissance/abuse tooling, not a real SEO user) → auto
    throttle + flag for review.

---

## P. Cost-control architecture

External APIs and AI calls are the two line items that can silently spike costs on user-
controlled input volume, so both get hard budget controls, not just monitoring:

- **AI cost control:**
  - Finding-level response caching (Section G) is the primary lever — most findings across
    the internet are common (missing meta description, missing alt text) and share cached
    explanations.
  - Per-scan token budget cap; if exceeded, remaining findings use the deterministic fallback
    template instead of a fresh AI call.
  - Batch findings into as few LLM calls per scan as possible (one call for "explain these N
    findings" rather than N calls).
- **Third-party data API cost control:**
  - Aggressive TTL caching per provider (`external_data_cache`), tuned per data type (backlink
    data cached longest, performance data shortest).
  - Per-plan quotas on how often *paid* external lookups (keyword/backlink APIs) refresh —
    e.g., free tier gets cached/stale data or none, paid tiers get fresher pulls.
  - Provider calls gated by an internal **budget guard** service tracking daily/monthly spend
    per provider against a configured ceiling, with automatic soft-degradation (fall back to
    "unavailable"/cached data) rather than an unbounded bill if traffic spikes.
- **Compute cost control:** crawl depth/page-count caps by plan, render-service (most
  expensive: headless Chrome) invoked only when a check actually needs rendered output, worker
  autoscaling with a hard max instance ceiling.
- **Cost visibility:** per-scan cost is logged (AI tokens + API calls + compute-seconds) from
  day one, even before it's used for billing decisions — you can't control what you don't
  measure.

---

## Q. Authentication architecture

- Anonymous users can run a limited number of scans (growth/conversion lever — zero friction
  to try the product), results tied to a short-lived session/browser token; **saving**,
  **monitoring**, and **history** all require an account.
- Managed auth provider (OAuth social login + email/password + magic link) issuing JWT/session
  cookies; our own `users` table is the source of truth for plan/entitlements, keyed off the
  auth provider's stable user ID.
- Role model from day one even though only one role exists at launch: `owner`, `member`,
  `viewer` scoped to an `organization` — because "team accounts sharing monitored sites" is an
  explicit future requirement, and retrofitting roles onto a single-user schema later is
  painful.
- Separate, more tightly scoped auth for OAuth integrations (GSC/GA4) — those tokens belong to
  a `site`/`integration` record, not the user session, since a site's GSC connection may
  outlive the connecting user's session.

---

## R. Monitoring architecture

Two distinct meanings of "monitoring" in this product — both are first-class:

1. **Product monitoring (of websites, for users):** scheduled re-scans (`scan_schedules`),
   diffing new report against the last one, and `alerts` on regressions (score drop, site went
   down, new critical issue appeared, lost a valuable backlink) delivered via email initially,
   webhook/Slack later. This is a paid-tier feature and a major retention driver.
2. **System monitoring (of our own infra, for us):**
   - Application metrics (request latency, queue depth, scan success/failure rate, per-stage
     duration) via Prometheus/Grafana or a hosted equivalent.
   - Structured logging with correlation/trace IDs threaded through
     gateway → orchestrator → crawler → engine → AI → report, so one scan's full lifecycle is
     traceable.
   - Error tracking (e.g., Sentry) on all services.
   - Uptime/synthetic checks on the crawler pipeline itself (a canary scan against a known
     stable site, run periodically, alerts if the pipeline breaks silently).
   - Cost dashboards feeding the budget guard (Section P).
   - Security alerting on anomalous SSRF-blocked attempts, spikes in blocked-domain hits, and
     auth anomalies.

---

## S. Subscription/payment architecture

- Stripe Billing owns plans/prices/invoices/proration; our `subscriptions` table mirrors
  Stripe state via webhooks (never trust client-reported plan state).
- **Entitlements service**: a single source of truth function (`getEntitlements(userId)` →
  scan quota, monitored-site limit, scan frequency, API-provider access, export formats,
  team-seat count) that every quota/rate-limit check (Section O) and feature gate in the
  frontend calls — so plan logic lives in one place, not scattered `if (plan === 'pro')` checks.
- Plan tiers (illustrative, refine later): **Free** (limited scans, no monitoring, ads/basic
  checks only), **Pro** (monitoring, scheduled scans, history, more scan depth), **Agency/Team**
  (multiple sites, team seats, white-label export, API access, deepest external-data refresh
  rates).
- Webhook handlers for `invoice.payment_failed`, `customer.subscription.updated/deleted` update
  entitlements immediately and trigger graceful downgrade (e.g., pause schedules beyond the new
  plan's limit, don't just start failing silently).

---

## T. Testing architecture

- **Unit tests:** every SEO check (Section F) tested against fixture HTML snapshots
  (good/bad/edge cases per rule) — this is the highest-leverage test suite in the whole system
  since checks are pure functions.
- **Contract tests:** each `DataProvider` (Section H) implementation tested against a recorded
  fixture response (VCR-style cassette) so provider outages/schema changes are caught without
  hitting real paid APIs in CI.
- **Integration tests:** full scan pipeline run against a small set of controlled test sites
  (a fixture site we host ourselves with known, intentional issues) — asserts the *whole*
  pipeline produces expected findings end-to-end.
- **Security tests:** an SSRF test suite specifically — a battery of malicious URLs (localhost
  variants, metadata IP, DNS-rebinding domain, redirect chains to internal IPs, non-http
  schemes) run against the crawler in CI, asserting every one is blocked.
- **Load/abuse tests:** rate limiter and queue behavior under burst load; verify a single
  target domain can't be flooded regardless of requester count.
- **AI output tests:** golden-file tests asserting the banned-phrase validator (Section G)
  catches ranking-guarantee language, and that AI-disabled mode still produces a complete,
  coherent report via fallback templates.
- **E2E/UI tests** (Playwright) covering the golden path: submit URL → see progress → see
  report → expand a technical detail → re-scan.

---

## U. Deployment architecture

- **Environments:** local (docker-compose), staging, production — identical container images
  promoted between them, config via environment/secret store, never rebuilt per-env.
- **Independent scaling groups:** `web` (Next.js), `api-gateway`, `scan-orchestrator` workers,
  `crawler` workers, `render-service` workers (Chromium — most memory-hungry, isolated node
  pool/network policy), `ai-explainer` workers — each scales on its own metric (queue depth for
  workers, request rate for web/API).
- **CI/CD:** on merge to main — run full test suite (Section T) including the SSRF battery as a
  required, non-skippable gate — build images, deploy to staging automatically, promote to
  production via manual approval initially (automate once confidence/coverage is high).
- **Blue/green or rolling deploys** for the API/web tier; workers drain in-flight jobs before
  shutdown (no scan silently dropped mid-crawl on a deploy).
- **Infra as code** (Terraform or equivalent) for network policy, egress rules, and the
  render-service's isolated network namespace specifically — the SSRF network boundary must be
  reproducible and reviewable as code, not a manually-clicked firewall rule.
- **Database migrations** versioned and applied via CI gate, backward-compatible by convention
  (additive-first, remove-later) to support zero-downtime deploys.

---

## V. Complete project folder structure

```
ai-seo-analyzer/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/
│   │   │   ├── page.tsx              # URL input landing page
│   │   │   ├── scan/[scanId]/page.tsx
│   │   │   ├── report/[reportId]/page.tsx
│   │   │   ├── dashboard/
│   │   │   ├── pricing/
│   │   │   └── account/
│   │   ├── components/
│   │   │   ├── Finding.tsx
│   │   │   ├── ScoreGauge.tsx
│   │   │   ├── ConfidenceBadge.tsx
│   │   │   └── ActionPlan.tsx
│   │   ├── lib/glossary.json
│   │   └── ...
│   ├── api-gateway/                  # FastAPI: auth, routing, rate limiting
│   ├── scan-orchestrator/            # state machine, job enqueue/aggregation
│   ├── crawler-service/              # SSRF-safe fetcher, robots/sitemap parsing
│   ├── render-service/               # isolated Playwright pool
│   ├── seo-engine/
│   │   ├── checks/
│   │   │   ├── technical/
│   │   │   ├── onpage/
│   │   │   ├── performance/
│   │   │   ├── content/
│   │   │   └── monetization/
│   │   ├── scoring/
│   │   └── registry.py
│   ├── ai-explainer/
│   │   ├── prompts/
│   │   ├── validators/               # banned-phrase / guarantee checks
│   │   └── provider_adapter.py
│   ├── integrations/
│   │   ├── providers/
│   │   │   ├── google_search_console.py
│   │   │   ├── google_analytics.py
│   │   │   ├── pagespeed.py
│   │   │   ├── keyword_provider.py
│   │   │   └── backlink_provider.py
│   │   └── data_provider_interface.py
│   ├── reporting/                    # report assembly, diffing, PDF export
│   ├── billing/                      # Stripe webhooks, entitlements service
│   └── notifications/                # email/alert delivery
├── packages/
│   ├── shared-types/                 # cross-service TypeScript/Pydantic schemas
│   ├── ui-kit/                       # shared React components (if split later)
│   └── config/                       # scoring weights, ad signatures, banned phrases
├── infra/
│   ├── terraform/
│   ├── docker/
│   └── k8s/ (or ecs/, fly/)
├── tests/
│   ├── fixtures/html/                # good/bad HTML snapshots per check
│   ├── ssrf/                         # malicious URL battery
│   └── e2e/
└── docs/
    └── BLUEPRINT.md                  # this document
```

---

## W. Data flow: URL submission → final report

```
1. User submits URL (web) 
     → api-gateway: validate URL syntax, auth/anon session, rate-limit check, plan-quota check
     → scan-orchestrator: create `scans` row (status=queued), enqueue CrawlJob

2. crawler-service picks up job
     → SSRF-safe DNS resolve + connect, fetch robots.txt/sitemap, fetch HTML + headers
     → decide if rendering is needed → optionally enqueue RenderJob to render-service
     → store raw HTML/screenshot in object storage, write `pages_crawled` rows
     → status=crawling → analyzing; emit PageCrawled event(s)

3. seo-engine consumes CrawlResult(s)
     → runs all registered checks per category → produces `findings` (with data_confidence)
       and `scores` rows synchronously (fast, deterministic)

4. integrations (parallel, best-effort, time-boxed)
     → for each configured/available provider: fetch (or serve from cache), normalize,
       tag confidence, write to `keyword_opportunities`/`backlinks`/traffic tables
     → unavailable/timed-out providers recorded as `unavailable`, never block step 5

5. ai-explainer consumes findings + scores + available external data
     → batches findings → LLM call(s) → beginner explanations + prioritized action plan
     → validator screens output for banned claims → fallback to template text if triggered
     → status=ai_explaining → completed (or partial, see Section X)

6. reporting assembles final `reports` row (denormalized JSON: scores, findings grouped by
   category, action plan, external-data sections each with confidence + source + fetchedAt)
     → cache report JSON (CDN/Redis) for fast repeat loads
     → notifications: if this is a re-scan of a monitored site, diff against previous report,
       fire `alerts` on regressions

7. web polls/subscribes to scan status → redirects to /report/[reportId] on completion
     → report renders from the single denormalized JSON payload (no N+1 fetches)
```

Every arrow above is an event/job boundary, which is what lets any single stage (e.g.,
render-service) be scaled, replaced, or hardened independently without touching the others.

---

## X. Handling unavailable or estimated data

This is a cross-cutting contract, enforced at the data-model level (Section D:
`data_confidence` column) and the UI level (Section B: `ConfidenceBadge` on every metric), not
left to convention:

| Label | Meaning | Example | UI treatment |
|---|---|---|---|
| **Verified** | Came directly from an authoritative, connected source (GSC, GA4, our own deterministic HTML/HTTP inspection) | "This page returns HTTP 404" / GSC-reported clicks | Solid badge, no hedging language |
| **Estimated** | A third-party model/index approximation, inherently imprecise | Keyword search volume, third-party traffic estimate, backlink count | Badge + provider name + "estimated, not exact" tooltip; ranges rather than false-precision single numbers where the provider supports it |
| **Detected** | We found a signal via pattern/heuristic matching, but can't confirm intent or exhaustiveness | Ad network script detected, possible duplicate content, affiliate link pattern | Badge + "we detected signs of X" phrasing, never "you have X" as flat fact |
| **Unavailable** | No source configured, or the source failed/timed out/was blocked (e.g., robots.txt disallowed a page, GSC not connected, backlink API down) | No traffic data without GA4/GSC | Explicit empty-state card explaining *why* and, where actionable, *how to unlock it* — never a blank space, spinner-forever, or fabricated placeholder |

Rules that follow from this contract:
- A **scan can complete as `partial`** — if robots.txt blocks 3 of 10 pages, or a provider
  times out, the report still ships, and the specific gaps are listed plainly ("we couldn't
  check 3 pages because this site's robots.txt disallows it") rather than silently omitted.
- The overall score calculation excludes `unavailable` categories from the denominator (never
  penalize a site for data we simply don't have) and visibly notes which categories were
  excluded.
- AI narrative text is explicitly instructed (and post-validated) to preserve these labels
  rather than smoothing them into confident-sounding prose.
- Historical trend charts (Section J) visually distinguish verified vs. estimated segments
  (e.g., solid vs. dashed line) rather than presenting one continuous trustworthy-looking line.

---

## Y. Development phases (in order)

**Phase 0 — Foundations (no user-facing feature yet)**
Repo/infra scaffolding, Postgres schema (core tables), SSRF-safe crawler with its full test
battery, object storage wiring, CI pipeline with security gate. *Nothing ships without this.*

**Phase 1 — MVP: single free scan, no accounts**
Static-fetch crawler (no rendering yet) → seo-engine technical + on-page checks only → simple
scoring → deterministic (non-AI) plain-language explanations → single-page report UI
(Sections B/W minus AI/external data). Goal: prove the core loop end-to-end, safely.

**Phase 2 — Add rendering + performance + AI explanations**
render-service (Playwright) for Core Web Vitals/JS sites, ads/monetization detection, AI
explainer + prioritized action plan with guardrails/validator, PDF export.

**Phase 3 — Accounts, history, re-scans**
Auth, `sites`/save feature, scan history, manual re-scan + before/after diff view, basic
free/paid plan split (entitlements service) even before full Stripe integration is exposed.

**Phase 4 — External data integrations**
GSC + GA4 OAuth connections (verified traffic/keywords), PageSpeed/CrUX integration, provider
gateway + caching + budget guard (Sections H/P) built out fully.

**Phase 5 — Keyword & backlink providers, competitor analysis**
Licensed keyword/backlink API integrations, competitor URL comparison, content-gap keyword
suggestions tied to fix steps.

**Phase 6 — Monitoring, scheduling, alerts, subscriptions**
`scan_schedules`, regression diffing, email alerts, full Stripe billing + entitlements
enforcement across all quotas, team/org accounts and roles.

**Phase 7 — Scale-out & hardening**
Split modular monolith into independently deployed services where load justifies it (crawler
and render-service first), add OpenSearch/ClickHouse for historical analytics at scale,
formal load testing, expand abuse-detection heuristics, SOC2-style controls if pursuing
enterprise customers.

Each phase ships a usable product increment; none requires undoing a prior phase's
architecture, because Sections C–F and N were designed as the stable core from the start.

---

## Z. Potential problems we must design for now

| Problem | Why it will happen | Architectural mitigation already in this blueprint |
|---|---|---|
| **SSRF via crawler** | Product's core feature is "fetch a URL the user chose" | IP-range validation on every connection + every redirect hop, network-namespaced egress, no internal credentials in crawler containers (Section N) |
| **DNS rebinding** | Attacker's DNS answers a safe IP at check-time, an internal IP at connect-time | Re-resolve and re-validate IP *at actual socket-connect time*, not just at initial validation (Section N) |
| **Zip-bomb / huge-response DoS** | Malicious or misconfigured target site returns gigabytes of data | Hard per-resource and per-page size caps, streaming reads with early abort (Section E) |
| **Headless-browser exploits** | Playwright/Chromium renders arbitrary attacker-controlled JS/HTML | Sandboxed, ephemeral, non-root browser contexts; disabled downloads/devtools; isolated network policy (Section N) |
| **Same-domain scan flooding** | Many users (or one abusive user) hammering one target site or our own infra | Per-target-domain concurrency caps + result caching/dedup independent of requester (Section O) |
| **Scripted mass-scanning / reconnaissance abuse** | Free, low-friction tool is attractive for scraping-at-scale via our infra as a proxy | CAPTCHA on anonymous submission, per-account anomaly detection, domain block-list (Section O) |
| **AI hallucinating facts or ranking guarantees** | LLMs generalize/embellish, and "guaranteed #1 ranking" is an easy trap to fall into | Findings computed deterministically first, AI only explains/prioritizes them; banned-phrase validator with template fallback (Section G) |
| **Runaway AI/API costs from viral traffic** | Cost scales with user-submitted volume, which we don't control | Response caching by finding code, per-scan token/call budgets, provider budget guard with auto-degrade (Section P) |
| **Data-accuracy disputes ("your tool said my traffic is X, but it's not")** | Estimated data (traffic, keywords, backlinks) is inherently approximate and provider-dependent | Confidence labeling enforced at schema level, provider name + timestamp always shown, ranges over false-precision numbers (Section X) |
| **Silent partial failures presented as complete reports** | A blocked page, a timed-out provider, or a failed check could otherwise just vanish from the report | `partial` scan status is first-class; every unavailable section explains *why*, not just omits (Section X) |
| **Backlink/keyword provider coverage gaps** | No third-party index covers 100% of the web | Always labeled estimated/partial coverage, never presented as exhaustive (Sections K/L) |
| **Stale cached data misrepresented as fresh** | Aggressive caching (needed for cost control) risks showing outdated numbers as current | Every cached data point carries `fetchedAt`, cache TTLs tuned per data volatility, UI surfaces "as of [date]" (Sections D/H/P) |
| **Competitor scans becoming a backdoor for arbitrary URL abuse** | "Enter a competitor URL" is just another user-controlled URL into the same crawler | Routed through the identical SSRF-safe crawler with the same limits/quotas — no separate, less-guarded code path (Section M) |
| **Schema/rule versioning breaking historical trend comparisons** | SEO rules and scoring weights will change over time as best practices evolve | Each check has a versioned `code`; scoring weights are config, not hardcoded; historical reports store the rule version used (Sections F/D) |
| **Multi-tenant data leakage** | Bugs in ID handling could expose one user's saved sites/history to another | Non-guessable IDs + explicit ownership checks on every query, never relying on ID obscurity alone (Section N) |
| **OAuth token compromise (GSC/GA4)** | Long-lived third-party tokens are a high-value target if the DB is ever breached | Encrypted at rest via KMS, minimal requested scopes, tokens scoped to `site`/`integration` records with independent revocation (Sections H/N) |
| **Scaling crawl/render workers under load spikes (e.g., viral traffic)** | Rendering is the most resource-intensive stage and easiest to overwhelm | Independently scaling worker pools with hard max-instance ceilings + queue-based backpressure rather than unbounded autoscale (Sections C/P/U) |
| **Monitoring/alert fatigue once scheduled scans launch** | Small, noisy fluctuations could trigger alerts on every re-scan | Alert thresholds tuned on meaningful deltas (score swings, new critical findings) not every score-point wobble, configurable per site later |
| **Payment/entitlement drift between Stripe and our DB** | Webhook delivery failures or race conditions could leave a user's plan out of sync with billing | Stripe as source of truth via webhooks + periodic reconciliation job comparing DB entitlements to Stripe subscription state (Section S) |
| **Legal/compliance exposure from scanning sites the requester doesn't own** | Anyone can enter any public URL — including sites they don't own, at scale | Honor robots.txt/opt-out block-lists, publish clear bot identification + terms of use, avoid deep/full-site crawling without evidence of a legitimate relationship to the domain (ties Sections E/O) |
| **Monolith-to-microservices migration pain later** | Starting monolithic (Section C) for speed risks becoming a rewrite when scaling | Internal module boundaries already modeled as async job/event contracts, not direct function coupling, so extraction is a deployment change (Section C) |

---

**This document is the reference architecture for all subsequent build phases.** Any deviation
during implementation (e.g., choosing a different keyword-data provider, or starting with
NestJS instead of FastAPI) should be a deliberate, documented decision against this blueprint,
not a silent drift.
