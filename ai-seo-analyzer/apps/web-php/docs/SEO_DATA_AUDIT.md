# SEO Data Audit — What "Real Analysis" Actually Requires

Audit performed before Category 03 Step 04. Scope: **inspect and design only** —
no scoring, analyzers, APIs, or crawler expansion were implemented as part of
this document. Companion to `docs/CRAWLER_BLUEPRINT.md` (which covers the
crawler itself); this document covers what happens *after* raw crawl data
exists — turning it into evidence, scores, and an honest report.

---

## 1. Current capabilities (what actually works today)

Verified by re-reading every file in `apps/web-php` — not assumed from prior
steps' summaries.

| Path | What it actually does |
|---|---|
| `index.php` | Light client-facing format check (`looks_like_website_address()`), then a 302 redirect to `/scan.php?url=...`. Does not validate safety and does not fetch anything. |
| `scan.php` | Client JS `fetch()`s `POST /api/analyze.php`, renders one of three real, distinct states (blocked / validated-but-unreachable / connected) from the actual response. No fake data. |
| `api/analyze.php` | Runs `SsrfGuard::checkUrlSafety()` (Step 02), then `HttpFetcher::fetch()` (Step 03) — a **real** HTTP GET of the approved URL, with real status code, headers, content-type, timing, redirect/retry counts. Returns that metadata as JSON. |
| `src/Crawler/*` | Real, tested SSRF protection (56 tests) and a real, tested single-URL HTTP fetcher (52 tests) — see the two prior CRAWLER_BLUEPRINT.md step sections for detail. |
| `report.php` | Renders the 11 static `REPORT_CATEGORIES` (from `includes/report-data.php`), every one hardcoded to "Unavailable"/"—". Takes only `?url=` and `?section=` from the query string — **it never receives the fetch result from `scan.php`'s API call**, because nothing persists that result anywhere. |
| `issue.php` | Three honest empty states; no issue ever exists because nothing is stored. |

**The single most important finding of this audit:** `HttpFetcher` already
performs a real fetch and already receives the target site's actual HTML body
(`FetchResult::$body`) — but `api/analyze.php` never reads it into the JSON
response, and even if it did, nothing downstream would do anything with it.
**The raw HTML of every scanned page is currently fetched and then
immediately discarded.** No `DOMDocument`/`DOMXPath` call exists anywhere in
this codebase yet. Nothing is parsed. Nothing is stored. This is the actual
gap between "we can fetch a page" and "we can tell you anything about it."

## 2. Current limitations

- **No persistence of any kind.** No database, no file-based storage, no
  session. A scan's result exists only inside one HTTP response and the
  browser DOM that rendered it; refresh the page and it's gone. `report.php`
  and `scan.php` are not connected to each other by any shared state — only
  by a URL string in the query string, which is *data the user typed*, not
  *evidence about their site*.
- **Single URL only.** No queue, no multi-page crawl, no sitemap discovery,
  no robots.txt handling (all explicitly deferred per the blueprint and every
  prior step's scope).
- **No HTML parsing.** Title, meta description, headings, canonical, robots
  meta, links, images, structured data — none of it is extracted, despite
  the raw bytes already being fetched.
- **No analyzer of any kind.** No scoring, no findings, no evidence model.
- **No background/async processing.** Everything happens synchronously
  inside one PHP request, bounded by `HttpFetcher`'s ~45s total budget —
  fine for one page, not viable for a real multi-page crawl (that needs the
  worker/queue design already in `CRAWLER_BLUEPRINT.md` §17, also unbuilt).
- **No external API integration layer.** No OAuth, no Search Console/
  Analytics/PageSpeed client, no config for API keys.
- **No configuration system beyond ad hoc `getenv()` reads** (`HttpFetcherConfig`
  only). No `.env` loader, no secrets store.

## 3. Real SEO data available from public crawling

Split deliberately into "already retrievable today" (the fetch layer exists)
vs. "requires a new analyzer to extract" (needs `DOMDocument`/`DOMXPath` or
similar, none of which exists yet):

**Already retrievable via `HttpFetcher`/`FetchResult` today, unused:**
HTTP status code, response headers (minus `Set-Cookie`, deliberately
dropped), `Content-Type`, actual byte size received, response time (ms),
final URL after redirects, redirect count/history, HTTPS-or-not (from the
scheme), retry count.

**Requires a new HTML-parsing analyzer (not built):** `<title>`, meta
description, meta robots, canonical URL, H1–H6 text and structure, word
count/content, internal vs. external links, anchor text, image `src`/`alt`,
Open Graph/Twitter Card tags, JSON-LD/microdata/RDFa structured data,
hreflang tags, viewport meta tag (mobile signal), inline vs. external
CSS/JS counts (a rough performance signal without a real browser).

**Requires new, separate fetches (not built):** `robots.txt` (allow/disallow
rules, crawl-delay, sitemap references — §8 of the blueprint), sitemap.xml
discovery/parsing (§9 of the blueprint), and, at multi-page scale, internal
link graph structure (needs more than one page to be meaningful).

**Requires more than a plain HTTP fetch can ever provide (real browser
needed):** actual rendered Core Web Vitals (LCP/CLS/INP), JS-rendered
content for client-side-rendered pages (see blueprint §14's documented
limitation — plain HTTP crawling already can't see this), actual mobile
viewport rendering/tap-target sizing.

## 4. Data requiring external APIs (not authorization — just a service)

- **PageSpeed Insights / Chrome UX Report (CrUX) API** — lab data (a
  synthetic Lighthouse run) and field data (real Chrome user metrics,
  when the site has enough traffic to have a CrUX dataset) for Core Web
  Vitals. Needs a Google API key; free tier with quota; no site-owner
  authorization needed since it's public aggregate/on-demand data.
- **Keyword volume/difficulty providers** (e.g. a DataForSEO/similar API) —
  third-party estimates, not Google's own ground truth, always "Estimated."
- **Backlink index providers** — third-party crawled link indexes (their own
  crawlers, not ours); always "Estimated" relative to the true, unknowable
  complete backlink graph. Paid, usage-limited.
- **Traffic estimate providers** (e.g. SimilarWeb-style services) —
  modeled/estimated traffic for any domain, not the site's real analytics.
  Always "Estimated," never "Verified," regardless of source reputation.

## 5. Data requiring user authorization (the website owner connects an account)

- **Google Search Console (OAuth)** — clicks, impressions, CTR, average
  position, the actual queries and pages Google shows the site for, plus
  device/country breakdowns where available, and real indexing status per
  URL (far more reliable than inferring indexability from robots
  meta/robots.txt alone). This is the *only* reliable source of real
  "how does Google actually treat this site" data — nothing public can
  substitute for it.
- **Google Analytics (OAuth)** — real users, sessions, page views,
  engagement metrics for *that specific site's actual visitors*. No public
  crawl or third-party estimate can produce this; only the owner's own
  Analytics property has it.

Both are explicitly **Verified**, first-party data once connected — the
highest confidence tier this product can ever offer, categorically different
from any third-party estimate.

---

## 6. Proposed SEO health scoring methodology (architecture, not implemented)

### 6.1 Core unit: the Finding, not the score

Every analyzer produces zero or more **Findings** against a fixed, versioned
**rule catalog** (e.g. `technical.robots_txt_missing`,
`onpage.title_too_long`, `structured_data.invalid_json_ld`). A Finding is
never a raw number — it's evidence:

```
Finding {
  rule_id           # stable, catalog-defined id
  category          # one of the fixed categories below
  scope             # 'page' | 'site'
  severity          # critical | high | medium | low | passed | informational
  evidence          # the actual detected value/snippet - "why we say this"
  points_possible   # this rule's max contribution, from the catalog
  points_earned     # 0..points_possible
  page_url          # null for site-scope findings
}
```

The score is *computed from* Findings, on demand or cached — it is never a
value an analyzer invents directly. This is what makes "click the score to
see why" (§10) possible at all: the explanation **is** the list of Findings
that produced it, not a separate narrative someone has to write by hand.

### 6.2 Category score: applicable-denominator model

For each category, a category score = `sum(points_earned) / sum(points_possible)
× 100`, but **only over rules that were actually evaluable for this scan**.
A rule that couldn't be checked (data unavailable — e.g. PageSpeed API not
configured, so no Performance-via-CrUX rules ran) is excluded from *both*
numerator and denominator. This directly satisfies "does not punish a site
for data that cannot be measured": an unmeasured rule is invisible to the
score, not silently scored as a failure (0) or a pass (100) — either of
which would be a fabrication.

Each rule fires **at most once per scope** it applies to (once per page for
page-scope rules, once for the whole scan for site-scope rules) —
this is the mechanism that prevents double-counting: a missing `<title>` is
one `onpage.title_missing` finding on that page, never also counted again
under Technical SEO or Content just because it's SEO-relevant to multiple
categories in a narrative sense. Cross-cutting facts (e.g. "not HTTPS")
live in exactly one category (Security/HTTPS) and other categories may
*reference* that finding's evidence in their explanation text without
scoring it a second time.

### 6.3 Proposed categories and indicative weights

Weights below are a **starting proposal to review, not a final decision** —
flagged explicitly per the task's "do not finalize arbitrary weights without
explaining them." Rationale for the tiering:

| Category | Indicative weight | Why this tier |
|---|---|---|
| Crawlability & Indexability | Highest | If search engines can't reach or index a page, nothing else in the report matters for that page — this gates everything else. |
| Technical SEO | Highest | Broken canonicals, redirect chains, duplicate content signals, HTTP errors — structural problems that undermine every other category's findings. |
| On-Page SEO / Content | High | Directly what search engines and users read to judge relevance — the most classically "SEO" category, and fully checkable from a public crawl. |
| Security / HTTPS | Medium-high | A binary, unambiguous, zero-false-positive signal (HTTPS or not) that both search engines and users weight heavily — cheap to check exactly right, so it should count meaningfully. |
| Performance | Medium | Real user impact, but this project's *reliable* signal (CrUX field data) requires an external API (§4) — weight should not assume that API is always connected; see §6.4. |
| Mobile SEO | Medium | Increasingly how most traffic arrives, but plain-HTTP checks here (viewport meta, etc.) are necessarily shallow signals, not real rendering — weighted to match what's actually verifiable. |
| Structured Data | Medium-low | High value when present and valid, but its *absence* is not itself a serious problem for every site type — a "missing" finding here should be lower severity than a genuinely broken page. |
| Internal Links / Images | Low-medium | Real, checkable, but generally smaller-impact findings (an image without `alt` text vs. a page that returns a 500). |
| Ads/Monetization | Informational only, not scored | This is a detection/disclosure category (§7 item 12), not a "problem," so it should not move the health score at all — flagging its presence is useful, penalizing it is not appropriate for a general-purpose SEO tool. |

**Explicit non-decision:** exact numeric weights (e.g. "Technical SEO = 25%,
On-Page = 20%...") are deliberately not fixed here — that's an implementation
detail to set (and to make easily tunable/versioned — see §13's
`rule_catalog` versioning) once real rules exist to weigh, not something to
guess at during an architecture-only step.

### 6.4 Handling a category with zero applicable rules

If every rule in a category was unmeasurable for this scan (e.g. no
PageSpeed API key configured, so Performance has zero evaluable rules), that
category is shown as **"Not available"**, excluded entirely from the overall
score's weighted average (its weight is redistributed proportionally among
categories that *did* produce data) — never silently averaged in as a 0.

### 6.5 Overall score

`overall = weighted_average(available_category_scores)`, with the weights
above (or their tuned replacements) renormalized over only the categories
that have data. The response always carries which categories contributed
and which didn't, so "the score" is never presented without "the score,
based on N of M categories."

---

## 7. Required analyzer modules

| # | Analyzer | Data source | Status |
|---|---|---|---|
| 1 | Technical SEO | Public crawl (status codes, redirects, canonical, robots meta, duplicate-content signals across pages) | Not built |
| 2 | On-Page SEO | Public crawl (title, meta description, headings) | Not built |
| 3 | Content Analyzer | Public crawl (word count, readability heuristics, duplicate content) | Not built |
| 4 | Performance Analyzer | Public crawl for basic timing (`FetchResult::durationMs` already exists) *plus* PageSpeed/CrUX API for real Core Web Vitals | Not built; partially blocked on API (§4) |
| 5 | Mobile Analyzer | Public crawl (viewport meta, responsive signals) — real rendering would need a browser (out of scope, see blueprint §14) | Not built |
| 6 | Structured Data Analyzer | Public crawl (JSON-LD/microdata parsing + schema validation) | Not built |
| 7 | Internal Link Analyzer | Public crawl, needs multi-page data to be meaningful | Not built; blocked on multi-page crawler |
| 8 | Image Analyzer | Public crawl (`<img>` tags, `alt`, file size from response) | Not built |
| 9 | Crawlability Analyzer | Public crawl + robots.txt/sitemap fetch | Not built; blocked on robots.txt/sitemap fetch (blueprint §8/§9) |
| 10 | Indexability Signal Analyzer | Public crawl (robots meta, canonical, status codes) — *signals* only; real indexing status needs GSC (§5) | Not built |
| 11 | HTTPS/Security Signal Analyzer | Public crawl (scheme, redirect behavior, could add header checks like HSTS) | Not built; cheapest to build — no new fetch needed, data already in `FetchResult` |
| 12 | Ads/Monetization Analyzer | Public crawl (ad network script/tag detection) — detection/disclosure only, not scored (§6.3) | Not built |
| 13 | Search Console module | External API + user authorization | Not built; requires OAuth |
| 14 | Analytics module | External API + user authorization | Not built; requires OAuth |
| 15 | Keyword Data module | External API (paid) | Not built; requires API key + budget decision |
| 16 | Backlink Data module | External API (paid) | Not built; requires API key + budget decision |
| 17 | Competitor Data module | Derived from #15/#16 for a user-chosen competitor URL | Not built; depends on #15/#16 existing first |

## 8. Page-level vs. website-level data

Two distinct scopes need to exist in the data model from the start (this
drives the `findings.scope` field in §6.1 and the schema in §13):

- **Page-level**: everything that's a property of one specific URL — title,
  meta description, H1, images, canonical, per-page status code. Rolls up
  into site-level *aggregates* (e.g. "3 of 10 pages missing a meta
  description") but is never itself the whole-site conclusion.
- **Site-level**: properties of the site as a whole, not any one page —
  robots.txt presence/rules, sitemap presence/validity, HTTPS-wide
  enforcement (does HTTP actually redirect to HTTPS site-wide?), overall
  internal linking structure, crawl error rate.

The overall health score is a **combination of both**: site-level findings
contribute directly; page-level findings contribute through an aggregate
(e.g. "% of scanned pages with a valid title") rather than one page's
result standing in for the whole site.

## 9. Partial-crawl handling

Directly reusing `CRAWLER_BLUEPRINT.md` §16's `partial` crawl status (already
designed, not yet built): when `pages_crawled < pages_discovered`, or a
configured limit (§10 of the blueprint) was hit before the site was fully
explored, the report **must**:

- Show a visible **"Partial scan"** indicator, not just an asterisk.
- State exact coverage: `pages_scanned / pages_discovered` (e.g. "42 of
  ~600 pages discovered were scanned"), plus which limit stopped it
  (`max_pages`, `max_duration`, etc. — the `stop_reason` field already
  designed in the blueprint).
- Distinguish **site-level** findings (robots.txt, sitemap, HTTPS
  enforcement — these are genuinely complete even in a partial page-crawl,
  since they don't depend on how many pages were fetched) from **page-level
  aggregates**, which must be phrased as "of the pages scanned," never as a
  whole-site claim ("no pages are missing titles" is wrong; "none of the 42
  scanned pages were missing a title" is correct).
- Never compute a page-level aggregate finding (e.g. "average word count")
  and present it as if it described the entire site when coverage is
  materially incomplete — the UI should show the coverage percentage
  directly next to any such aggregate, not bury it in a tooltip.

## 10. Score explanation (UI requirement, informs the data model)

For the score to be explainable, `report.php`'s eventual real data source
must expose, per category and overall:

- The score/rate itself, plus **which categories contributed** and their
  individual scores (§6.5).
- Every Finding that earned or lost points, grouped as positive (`passed`
  severity) vs. problems (`critical`/`high`/`medium`/`low`), each with its
  evidence.
- Explicitly listed **unavailable/unmeasured** rules and why (no API
  configured, feature not connected, page not reached).
- A visible methodology version/link (ties to the versioned `rule_catalog`
  in §13) so "why did my score change between scans" is answerable — a
  score change should always be traceable to either (a) the site actually
  changing, or (b) the rule catalog/weights changing, never ambiguous
  between the two.

This is a data-shape requirement now (Findings + evidence + coverage, not a
bare number) even though the UI itself is future work.

## 11. Real-time / current scan UI audit

**Current state:** `scan.php` is single-URL and synchronous — it shows
"Checking…" then one of three final states within seconds. There is no
"progress" concept today because there's only ever one request in flight.

**Once the multi-page crawler (blueprint §17) exists**, real, honest
progress fields already designed there are: pages discovered, pages
queued, pages scanned (success + failure), pages remaining *only once
discovery has meaningfully stabilized*, current stage (`validating` →
`queued` → `running` → `completed`/`partial`, from blueprint §5), crawl
duration so far, and per-page errors as they occur.

**Explicit anti-pattern to avoid:** a fabricated completion percentage.
Total page count is discovered incrementally as the crawl runs — "37%
complete" implies a known total that usually doesn't exist yet, especially
early in a crawl. Prefer honest counts ("42 pages scanned, 58 more
queued, more may still be discovered") over a percentage, and only show a
percentage once discovery has clearly stabilized (e.g. no new URLs found
in the last N fetches), explicitly labeled as "of URLs discovered so far."

## 12. API requirements (for future integration — not connected now)

| Service | Provides | Auth | Verified/Estimated | Limits/Cost | Required or optional |
|---|---|---|---|---|---|
| Google Search Console API | Clicks, impressions, CTR, position, queries, real indexing status | OAuth (site owner) | Verified | Free; Google-side quota | Optional — but the *only* real indexability ground truth |
| Google Analytics (GA4) API | Users, sessions, page views, engagement | OAuth (site owner) | Verified | Free; Google-side quota | Optional |
| PageSpeed Insights / CrUX API | Lab (Lighthouse) + field (real-user) Core Web Vitals | API key (no site-owner auth needed) | Field = Verified (real user data); Lab = Estimated (synthetic run) | Free tier, rate-limited | Recommended for a credible Performance category |
| Keyword volume provider (3rd party) | Search volume/difficulty estimates | API key | Estimated | Paid, usage-limited | Optional |
| Backlink index provider (3rd party) | Crawled backlink data | API key | Estimated (their crawl, not ground truth) | Paid, usage-limited | Optional |
| Traffic estimate provider (3rd party) | Modeled traffic | API key | Estimated | Paid, usage-limited | Optional |
| Competitor comparison | Derived from keyword/backlink providers above | Same as those | Estimated | Same as those | Optional, depends on above |

No keys are configured or requested by this audit.

## 13. Database requirements (proposed schema — not created yet)

Extends, rather than replaces, `CRAWLER_BLUEPRINT.md` §4's already-designed
`crawls`/`crawl_urls`/`crawl_pages`/`crawl_errors` tables. New entities this
audit identifies as needed once scoring/evidence/external data exist:

- **`websites`** — `id, root_url, created_at`. The parent entity a scan
  belongs to (no user accounts exist yet, so no owner column required
  today — added later if/when accounts exist).
- **`rule_catalog`** — `rule_id, category, description, severity_default,
  points_possible, version, active`. Versioned so a score change is always
  attributable (§10) to either the site or a rule-catalog version bump,
  never ambiguous.
- **`findings`** — `id, crawl_id, crawl_url_id (nullable, for site-scope),
  rule_id, category, scope, severity, points_possible, points_earned,
  evidence_json, created_at`. The evidence ledger §6.1/§10 depend on.
- **`category_scores`** (or computed on read from `findings` — a
  materialized cache is optional, not required at design time) —
  `crawl_id, category, score, points_earned, points_possible,
  rules_evaluated, rules_unavailable`.
- **`external_connections`** — `id, website_id, provider (search_console|
  analytics), oauth_token_encrypted, connected_at, status, last_synced_at`.
- **`external_data_snapshots`** — `id, website_id, provider, metric, value,
  period_start, period_end, fetched_at, confidence (verified|estimated)`.
  Keeps GSC/GA imports separate from crawl-derived `findings`, since their
  lifecycle (periodic re-sync) is entirely different from a crawl's.

**Not created in this step** — this is a proposal for review, matching the
task's explicit "provide a proposed schema first" / "do not blindly create
all tables yet."

## 14. Missing features matrix

**ALREADY IMPLEMENTED**
SSRF-safe URL validation and redirect-chain protection (Step 02); a real,
tested single-URL HTTP fetcher with retries/timeouts/size caps (Step 03);
honest zero-data UI shell for homepage/scan/report/issue pages.

**PARTIALLY IMPLEMENTED**
Raw HTTP response data exists in `FetchResult` but is discarded before
reaching the report page (§1) — the fetch works, nothing consumes its
output yet.

**MISSING (buildable from public crawl alone, no API needed)**
HTML parsing (title/meta/headings/canonical/robots-meta/links/images/
structured data), robots.txt + sitemap fetching, multi-page crawl/queue,
persistence of any kind, every analyzer in §7 items 1–12, the scoring
engine (§6), score explanation UI, partial-scan UI (§9), Fix Guide and
dedicated Action Plan pages (noted as missing since the Next.js reference
app, per `DEVELOPMENT_STATUS.md`).

**REQUIRES EXTERNAL API**
Real Core Web Vitals (PageSpeed/CrUX), keyword volume, backlink index,
traffic estimates, competitor data (§4/§12).

**REQUIRES USER AUTHORIZATION**
Search Console data, Analytics data (§5).

**NOT TECHNICALLY POSSIBLE FROM PUBLIC URL ALONE, EVEN WITH A CRAWLER**
Exact rendered Core Web Vitals without either a real browser or the CrUX
API; a site's actual private traffic/visitor numbers without Analytics;
Google's actual indexing decisions without Search Console (robots
meta/canonical are *signals* Google is likely to follow, never a
guarantee); any "exact" backlink count (every provider, including
Google's own Search Console, shows a sample/index, not the true complete
graph — this should always be phrased as an estimate/sample, even inside
the "Verified" GSC-connected tier, and documented as such wherever
backlink counts are ever shown).

---

## 15. Confidence labeling (applies across all of the above)

Every data point in the eventual product carries one of exactly four
labels, enforced at the data-model level (a `Finding`/`ExternalDataSnapshot`
without one of these is not a valid record):

| Label | Meaning | Example |
|---|---|---|
| **Detected** | Found directly by our own crawler from the public page/site | "Title: `Home — Example Co.`, detected from `<title>`" |
| **Verified** | Confirmed via an authorized, first-party connected source | "1,204 clicks last 28 days, verified via connected Search Console" |
| **Estimated** | A third-party model/index, never ground truth | "Estimated monthly search volume: 2,400 (third-party keyword data provider)" |
| **Unavailable** | Genuinely not obtainable right now, stated plainly | "Backlink count: unavailable — connect a backlink data provider" |

No metric is ever shown without one of these, and "Estimated" is never
visually or textually presented as equivalent to "Verified" or "Detected."

## 16. Recommended development order

1. **HTML parsing (`HtmlParser` + `PageFacts`)** — the highest-leverage next
   step: it turns the HTTP fetch that already exists into actual page data
   (title, meta, headings, links, images, structured data) with zero new
   external dependencies or persistence required first. Can be built and
   demoed against the existing single-URL flow before anything else changes.
2. **Minimal persistence** (`websites`, `crawls`, `crawl_urls`, `crawl_pages`
   — blueprint §4, plus `findings`/`rule_catalog` from §13 here) — required
   before a score can mean anything across more than one HTTP response.
3. **robots.txt + sitemap fetching** (blueprint §8/§9) — needed before
   Crawlability/Indexability findings are meaningful, and before a real
   multi-page crawl can responsibly begin.
4. **Multi-page crawler + worker/queue** (blueprint §17) — turns "one URL"
   into "a site," enabling site-level findings and internal link analysis.
5. **Core analyzers, public-data-only first**: Technical SEO, On-Page SEO,
   HTTPS/Security (cheapest — data already exists), Structured Data, Images,
   Internal Links, Crawlability/Indexability signals, Content, Mobile
   signals, Ads/Monetization detection — in roughly that order, cheapest/
   highest-confidence signals first.
6. **Scoring engine** (§6) — once real Findings exist from step 5, build the
   category/overall score calculation and the evidence ledger.
7. **Score explanation UI + partial-scan UI** (§9/§10) — surface what step 6
   produces honestly.
8. **Action Plan / Fix Guide**, now backed by real Findings instead of the
   current static placeholder.
9. **Re-scan + verification** — compare a new scan's Findings against a
   prior one, so "fixed" claims are themselves evidence-based.
10. **External integrations last**: PageSpeed/CrUX (no user auth needed,
    lowest integration cost) → Search Console → Analytics (both need OAuth
    flow + token storage) → paid third-party keyword/backlink/traffic data
    (needs a budget/cost decision before any key is purchased) →
    competitor comparison (depends on the keyword/backlink integrations).

## 17. Confirmed: not implemented as part of this audit

No scoring code, analyzer code, Google/keyword/backlink/traffic API
integration, AI analysis, multi-page crawler, sitemap crawler, or robots.txt
crawler was written. The only change made is this document.

## 18. Potential technical problems & security/cost concerns (for later steps)

- **Cost exposure**: every paid third-party API (keywords, backlinks,
  traffic) turns each user-initiated scan into a real dollar cost if wired
  in naively — needs caching, rate limiting, and a usage-cap decision before
  any key is purchased, not after.
- **OAuth token storage**: Search Console/Analytics tokens are sensitive
  credentials belonging to the site owner — need encryption at rest and a
  clear revocation path; a bug here is a real security incident, not a
  cosmetic one.
- **Multi-page crawl resource risk**: everything the blueprint already
  designed against (unbounded time/memory/requests) becomes a real
  operational concern the moment persistence + a worker exist — the limits
  already specified in blueprint §10 must ship *with* the crawler, not
  after.
- **Scoring credibility risk**: a scoring model that's too opaque or too
  aggressively penalizes unmeasurable data will be read as arbitrary by
  users no matter how well-intentioned — the applicable-denominator design
  in §6.2 exists specifically to avoid this, and should not be simplified
  away under implementation pressure.
- **Stale external data**: GSC/GA data has its own processing delay
  (typically 1–3 days for Search Console); the UI must date-stamp every
  external metric, never imply it's as fresh as a crawl just run seconds
  ago.

## Exact next development step

Per the recommended order (§16), the safest next step is **building
`HtmlParser`/`PageFacts`** (blueprint §13's already-designed shape) to
extract real on-page data from the HTML `HttpFetcher` already fetches — no
new dependency, no persistence, no external API, and directly demoable
against the existing single-URL scan flow. This is a natural "Category 03
Step 04" scope, but is **not started by this audit** and awaits explicit
approval.
