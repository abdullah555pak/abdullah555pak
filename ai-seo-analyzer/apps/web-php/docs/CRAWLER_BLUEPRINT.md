# Real PHP Website Crawler — Architecture & Technical Blueprint

Category 03, Step 01. **Planning only — no crawler code exists yet.** This
document is the contract every later crawler implementation step (02–13)
builds against. It does not crawl anything, does not fetch anything, and
introduces zero new runtime behavior.

## 0. Inspection of the existing project (input to this design)

| Found | Detail |
|---|---|
| Entry points | `index.php`, `scan.php`, `report.php`, `issue.php` (page renders); `api/analyze.php` (JSON API) |
| Routing | Flat, file-based, query-string driven (`?url=&section=&id=`) — no router library |
| Existing SSRF/validation | `includes/url-security.php` (`validate_public_url()`) — already blocks disallowed schemes, credentials, localhost, and every resolved IP that's private/loopback/link-local/multicast/reserved/a cloud-metadata address. This is the foundation the crawler's SSRF guard extends, not replaces. |
| Existing light validation | `includes/url-validation.php` (`looks_like_website_address()`) — format-only check for the homepage form's UX, not a security boundary |
| Config/env handling | None yet — no `.env`, no secrets, no framework config layer |
| Database | None connected. `ext-pdo_sqlite`, `ext-pdo_mysql`, `ext-pdo_pgsql` are all available in the PHP build, but nothing is wired up |
| Scan UI | `scan.php` already does the real thing a crawler-triggering request should look like: submits a URL to a JSON API (`api/analyze.php`), gets back a structured `{status, error:{code,message}}` shape, and renders it — this is the pattern the real crawl-start/crawl-status endpoints should continue |
| Reusable services | `includes/url-security.php`, `includes/bootstrap.php` (error-display hardening, already runs first on every request including the API) |
| Relevant PHP extensions available | `curl`, `dom`, `libxml`, `simplexml`, `json`, `mbstring`, `openssl`, `intl` (→ `idn_to_ascii`), `pdo` (+`pdo_sqlite`/`pdo_mysql`/`pdo_pgsql`) |
| Package manager | Composer 2.8 is installed on the system; no `composer.json` exists in the project yet |

**Conclusion:** the current project has no backend "service layer" to reuse beyond
the SSRF validator and the bootstrap hardening — everything else is
page-rendering code. The crawler needs genuinely new architecture, but it
should extend `url-security.php` rather than duplicate it, and it should
keep the existing `includes/`-based page code completely untouched.

---

## 1. Final crawler architecture

Plain PHP has no framework here, so "architecture" means: a small set of
focused classes with one job each, autoloaded via Composer (PSR-4), living
in a new `src/Crawler/` namespace that is completely separate from the
page-rendering `includes/` directory. `api/*.php` files stay thin — they
translate HTTP requests into calls on these classes and translate results
back into JSON. No framework is introduced; Composer here is only doing
autoloading, which is standard, minimal, and not "a framework."

```
CrawlManager                      (orchestrator — the only class api/*.php talks to)
 ├─ UrlNormalizer                 (pure functions: normalize/compare URLs)
 ├─ SsrfGuard                     (extends url-security.php's checks; re-checked per redirect hop)
 ├─ RobotsTxtHandler              (fetch + parse + query "is this path allowed")
 ├─ SitemapDiscovery              (find + parse sitemaps, feed URLs to the queue)
 ├─ UrlQueue                      (DB-backed; add/claim/complete/dedupe)
 ├─ HttpFetcher                   (curl wrapper; one URL in, HttpResponse out)
 ├─ HtmlParser                    (DOMDocument/DOMXPath wrapper; HttpResponse → PageFacts)
 ├─ LinkExtractor                 (part of HtmlParser's output: internal/external links)
 ├─ Deduplicator                  (URL-normalization-based; lives inside UrlQueue)
 ├─ CrawlLimits                   (immutable config/policy value object)
 ├─ CrawlState                    (state-machine constants + valid-transition table)
 └─ Storage\CrawlRepository,
    Storage\CrawlPageRepository,
    Storage\CrawlErrorRepository  (PDO-based persistence, one repository per entity)
```

Why this shape and not a 1:1 copy of the prompt's suggested pipeline:
**Deduplication** is not a separate service — it's a property of how
`UrlQueue::add()` behaves (insert-or-ignore keyed on normalized URL), so it's
folded into `UrlQueue` rather than being its own class with its own state.
**Crawl Result** is not a class either — it's just the current row(s) in
`crawls`/`crawl_pages`/`crawl_errors`, read back through the repositories;
inventing a separate "CrawlResult" object would just be a second copy of
data the database already holds. Everything else in the prompt's list maps
1:1 to a component above.

---

## 2. Recommended PHP-compatible libraries/dependencies

| Purpose | Choice | Why |
|---|---|---|
| Autoloading | **Composer, PSR-4, zero runtime deps beyond PHP itself** | Standard, not a framework, needed the moment we have more than a handful of classes |
| HTTP fetching | **`ext-curl`** (built-in) | Already installed; supports per-request timeouts, manual redirect control (required for SSRF-safe redirect handling — see §7), streaming body callbacks (required to enforce size caps mid-download, not just after), gzip/deflate. No HTTP client library needed. |
| HTML parsing | **`ext-dom` + `ext-libxml`** (built-in), via `DOMDocument` + `DOMXPath` | Built-in, no dependency, and libxml's HTML parser is deliberately lenient with the broken markup real websites ship. `libxml_use_internal_errors(true)` suppresses warnings instead of crashing on malformed HTML. |
| XML sitemap parsing | **`ext-libxml` streaming (`XMLReader`) for large files, `SimpleXML`/`DOMDocument` for small ones** | Both built-in. `XMLReader` avoids loading a huge sitemap fully into memory (see §10's size limits). |
| URL parsing/normalization | **PHP's native `parse_url()` + hand-written normalization rules** (§6) | Zero-dependency and fully sufficient for the rules we need. If normalization edge cases prove too fiddly in implementation, `league/uri` (a small, focused, framework-agnostic library, ~no transitive deps) is the fallback — not adopted up front, to honor "no heavy dependencies for simple UI/logic requirements." |
| IDN (internationalized domains) | **`ext-intl`'s `idn_to_ascii()`** (built-in) | Converts `bücher.example` → `xn--...` (punycode) before any validation/DNS step, so SSRF and normalization logic only ever deals with ASCII hostnames. |
| robots.txt parsing | **Hand-written parser** (~100 lines, simple line-based format) | The format is small and well-specified enough that a dependency isn't justified; also lets us log exactly why a line was ignored, which matters for the "no legal-compliance claims" requirement (§6.5). |
| Storage | **PDO, driver TBD per environment (`pdo_sqlite` for local dev, `pdo_mysql`/`pdo_pgsql` in a real deployment)** | All three are already installed; SQLite needs zero setup for local development (matches the project's "no database yet, no config yet" reality today) while the same PDO code works unchanged against MySQL/Postgres later. |
| Background processing | **No message-broker library** — a plain PHP CLI script polling a database table (§16) | Avoids introducing Redis/a queue broker just to run a crawler; the existing project has none installed, and a DB-polling worker is a well-established, dependency-free pattern that scales to multiple worker processes later. |

Nothing above is installed by this step. This is a recommendation list for
the implementation steps that follow.

**Step 02 correction:** URL validation + SSRF protection (`src/Crawler/`,
below) was implemented with plain `require_once` includes, **not**
Composer/PSR-4, despite the recommendation above. With only five small
classes so far, adding a `composer.json` would have meant asking the
project's users — who have struggled specifically with local Node/npm/
Composer-style tooling — to also run `composer install` before `php -S`
works again, for no functional benefit yet. Composer remains the right
call once the class count from later crawler steps (§3) makes manual
`require_once` chains unwieldy; revisit then, not before.

---

## 3. Folder/file structure changes (proposed — not created yet)

```
apps/web-php/
├── composer.json                        NEW — PSR-4 autoload only, no framework
├── src/
│   └── Crawler/
│       ├── CrawlManager.php
│       ├── UrlNormalizer.php
│       ├── SsrfGuard.php                 wraps/extends includes/url-security.php
│       ├── RobotsTxtHandler.php
│       ├── SitemapDiscovery.php
│       ├── UrlQueue.php
│       ├── HttpFetcher.php
│       ├── HttpResponse.php              value object: status/headers/body/timing
│       ├── HtmlParser.php
│       ├── PageFacts.php                 value object: the raw-data contract (§18)
│       ├── CrawlLimits.php               value object: every configurable cap (§10)
│       ├── CrawlState.php                state constants + transition table (§17)
│       └── Storage/
│           ├── CrawlRepository.php
│           ├── CrawlUrlRepository.php
│           ├── CrawlPageRepository.php
│           ├── CrawlErrorRepository.php
│           └── schema.sql
├── workers/
│   └── crawl-worker.php                  CLI entry point (cron or long-running loop)
├── api/
│   ├── analyze.php                        EXISTING, evolves: becomes "start a crawl"
│   ├── crawl-status.php                   NEW: polling endpoint for progress
│   └── crawl-cancel.php                   NEW: sets status=cancelling
├── includes/                                UNCHANGED — page rendering stays as-is
└── docs/
    └── CRAWLER_BLUEPRINT.md                 this document
```

`includes/url-security.php` is not deleted or moved — `Crawler\SsrfGuard`
requires it and calls `validate_public_url()` as its first check, then adds
the crawler-specific behavior that a one-shot form validator doesn't need
(re-checking on every redirect hop, pinning the resolved IP for the actual
`curl` connection). Page-rendering code (`index.php`, `report.php`, ...)
never depends on anything under `src/Crawler/`.

**Step 02 status:** `UrlNormalizer.php`, `SsrfGuard.php`, `ValidationResult.php`,
`RedirectProbeInterface.php` and `CurlRedirectProbe.php` now exist under
`src/Crawler/`, plus a `tests/` directory (`FakeRedirectProbe.php` and
`run-url-validation-tests.php`) — see §7 for what each does.

**Step 03 status:** `HttpFetcher.php`, `HttpFetcherConfig.php`,
`FetchResult.php`, `RetryPolicy.php`, `ContentTypeClassifier.php` and
`UrlSafetyCheckerInterface.php` now also exist under `src/Crawler/` — see
§12.1 for what each does. `tests/` gained `AllowlistUrlSafetyChecker.php`,
`run-http-fetcher-tests.php`, and a `tests/support/fixture-router.php`
local test server. `api/analyze.php` now performs one real HTTP fetch of
the validated URL and returns structured status/content-type/timing
information — it still returns no score, finding, or report, and it still
does not start a background crawl (§17's `crawls`/`crawl_urls` tables and
`workers/crawl-worker.php` remain unbuilt).

Everything else in the tree above (`CrawlManager`, `RobotsTxtHandler`,
`SitemapDiscovery`, `UrlQueue`, `HtmlParser`, `Storage/`, `workers/`, the
two new polling/cancel `api/` endpoints, and the database schema in §4)
remains unbuilt, exactly as this blueprint originally scoped for later
steps.

---

## 4. Database / data model proposal

Minimal entity set — five tables, no premature normalization:

**`crawls`** (one row per scan)
`id, url (original input), normalized_url, status, stop_reason (nullable), pages_discovered, pages_crawled, pages_failed, started_at, finished_at, limits_json (the CrawlLimits used, so a crawl's behavior stays reproducible/auditable), created_at`

**`crawl_urls`** (the queue *and* its own history — one row per discovered URL)
`id, crawl_id, url, normalized_url, discovery_source (seed|internal_link|sitemap|redirect), depth, priority, status (pending|fetching|done|failed|skipped), retry_count, claimed_at, claimed_by (worker id, for crash recovery — §16), http_status (nullable until fetched), created_at, updated_at`
Unique constraint on `(crawl_id, normalized_url)` — this **is** the
deduplication mechanism (§8), not a separate lookup structure.

**`crawl_pages`** (extracted facts — one row per successfully fetched page)
`id, crawl_url_id, title, meta_description, meta_robots, canonical_url, h1..h6_json (or a single headings_json), word_count, internal_link_count, external_link_count, image_count, images_missing_alt_count, lang, og_json, structured_data_json, content_size_bytes, response_time_ms, fetched_at`

**`crawl_errors`** (one row per failure, always tied to a `crawl_urls` row)
`id, crawl_id, crawl_url_id, error_type (dns|timeout|ssl|http_4xx|http_5xx|redirect_loop|oversized|invalid_html|robots_blocked|ssrf_blocked|other), message, occurred_at`

**`crawl_resources`** — deferred, not created in this step. Per-image/
per-script rows aren't needed until an analyzer actually asks for them; a
placeholder table now would be speculative schema no code uses yet, which
this project has consistently avoided.

**Storage policy:** store extracted *facts* (title text, counts, JSON of
structured headings/links), never the raw HTML body. Raw HTML is useful
only transiently during parsing and is discarded after `PageFacts` are
extracted — keeping it would make `crawl_pages` grow unboundedly for no
benefit any planned analyzer needs. `crawl_urls` and `crawl_errors` are
kept for the life of the crawl (useful for the partial-crawl UI and for
debugging); a future retention/cleanup job (not in scope here) can prune
old crawls' detail rows while keeping `crawls` summaries.

---

## 5. Crawl lifecycle

```
pending → validating → queued → running → completed
                              ↘  running → partial
                              ↘  running → failed
                    running/queued → cancelling → cancelled
```

| State | Meaning |
|---|---|
| `pending` | Crawl row created, not yet picked up by any worker |
| `validating` | Worker is running `SsrfGuard`/`UrlNormalizer` on the seed URL |
| `queued` | Seed URL accepted, sitting in `crawl_urls` waiting for a worker to fetch it |
| `running` | At least one URL has been fetched; more remain or are being processed |
| `paused` | Reserved for future use (e.g. a "pause my scan" UI feature) — no code path sets this in the initial implementation; documented now so the column/UI can support it later without a schema change |
| `cancelling` | User requested cancellation; worker will stop after finishing its current URL |
| `cancelled` | Worker observed `cancelling` and stopped; partial data is kept, not deleted |
| `completed` | Queue fully drained *and* no configured limit was hit |
| `partial` | Queue processing stopped because a limit was hit (§15), not because it was naturally exhausted |
| `failed` | The crawl could not produce any usable data at all (e.g. seed URL SSRF-blocked, DNS never resolved, robots.txt disallows the entire site) — distinct from "partial," which always has *some* real data |

This maps directly onto the existing frontend vocabulary
(`scan.php`'s `"Checking…"` → result states, `report.php`'s "Not scanned
yet"), so the UI work already done in Category 02 does not need to change
shape, only start reading real values instead of always getting "no scan
exists."

---

## 6. URL normalization rules

Applied identically everywhere a URL is compared (queue dedup, internal/
external classification, canonical comparison):

1. IDN hostnames → ASCII via `idn_to_ascii()` first, before anything else.
2. Scheme and host lowercased. Missing scheme defaults to `https`.
3. Default ports removed (`:80` on http, `:443` on https); non-default
   ports kept.
4. Empty path normalized to `/`. A trailing slash on a non-root path is
   **not** added or removed automatically (`/about` and `/about/` are
   treated as *distinct* URLs — sites routinely serve different content or
   redirect one to the other; collapsing them would hide a real redirect
   the crawler should observe and record, not assume).
5. Fragment (`#...`) is always stripped before storage/comparison — it's
   never sent to the server and never distinguishes different content.
6. Query string: kept, but with parameters **sorted alphabetically by key**
   before comparison, so `?b=2&a=1` and `?a=1&b=2` dedupe as the same URL.
   Values are not reordered or filtered (a future step may add a
   configurable "ignore tracking parameters like `utm_*`" list, but that's
   an explicit policy decision deferred to when it's needed, not assumed
   now).
7. Percent-encoding normalized to uppercase hex digits (`%2f` → `%2F`) so
   equivalent-but-differently-encoded URLs still dedupe.
8. The normalized form is what's stored in `normalized_url` columns and
   used for the queue's uniqueness constraint; the original, as-discovered
   form is kept alongside it for display/debugging.

Redirects are **not** folded into normalization — a redirect is a fact the
crawler records (source URL, target URL, status code), never silently
collapsed into "the same URL."

---

## 7. SSRF protection design

Foundation: `includes/url-security.php`'s `validate_public_url()` already
implements the hard part correctly — scheme allowlist, credential
rejection, `localhost`/`*.localhost` rejection, and IP-range blocking via
PHP's `FILTER_FLAG_NO_PRIV_RANGE`/`FILTER_FLAG_NO_RES_RANGE` plus an extra
explicit CIDR blocklist for ranges those flags miss (carrier-grade NAT,
IETF protocol assignments, documentation ranges, NAT64, etc — see that
file's own docblock). `SsrfGuard` (new) wraps this and adds what a
one-shot form check doesn't need but a crawler must have:

1. **Re-validate on every redirect hop, not just the original URL.**
   `curl`'s automatic redirect-following (`CURLOPT_FOLLOWLOCATION`) is
   **never enabled**. `HttpFetcher` fetches one URL, and if the response is
   a redirect, `CrawlManager` extracts the `Location` header, runs it
   through `SsrfGuard::validate()` again exactly like a fresh URL, and only
   then issues the next request. This is the only way to stop a malicious
   or compromised site from returning `200 OK` to the validator's check and
   then `302`-ing the *actual* fetch to `http://169.254.169.254/`.
2. **Cap total redirects per URL** (§10) — independent of the
   general "max requests" limit, so a redirect loop can't consume a
   disproportionate share of the crawl budget before the loop-detector
   (§15) even triggers.
3. **DNS rebinding protection: resolve once, connect to the resolved IP,
   re-validate that IP, and pin it for the actual request.** The risk: a
   hostname could resolve to a public IP at validation time and a private
   IP by the time `curl` actually connects (attacker controls their own
   DNS). Mitigation: resolve the hostname ourselves, validate *that*
   specific IP with the same blocklist logic `validate_public_url()` uses,
   then tell curl to connect to that exact IP for that request (curl's
   `CURLOPT_RESOLVE` option — pins a host:port to a specific IP for the
   life of that one request, without needing a second DNS lookup that
   could return something different). This closes the gap between
   "checked" and "connected" that a pure application-level hostname check
   can never close on its own — which is exactly why the blueprint
   explicitly warns not to rely on a blacklist check alone.
4. **Every fetch, always, goes through the same guard** — there is no
   second code path (e.g. "trusted" sitemap URLs, or robots.txt itself)
   that skips validation. §7 and §9 of the task both call out sitemap URLs
   specifically as not-automatically-trustworthy; this is enforced by
   having exactly one fetch entry point (`HttpFetcher::fetch()`, always
   called through `SsrfGuard` first) that every other component uses.

### 7.1 Step 02 implementation notes

What was actually built, and two naming/behavior details that differ
slightly from the prose above:

- The entry point is `SsrfGuard::checkUrlSafety(string $rawUrl, ?RedirectProbeInterface $probe = null): ValidationResult`
  (not `SsrfGuard::validate()` as §7's prose says above) — the extra
  `$probe` parameter is what makes point 1 above testable at all: tests
  inject a `FakeRedirectProbe` that returns canned redirect chains, since
  there is no safe way to test "a redirect to 169.254.169.254 is blocked"
  against a real server.
- `CurlRedirectProbe` (the real, `curl`-backed `RedirectProbeInterface`
  implementation) sends a `HEAD` request with `CURLOPT_FOLLOWLOCATION`
  disabled, pinned to the pre-validated IP via `CURLOPT_RESOLVE` — this is
  point 3 above, implemented. It is deliberately **not** the `HttpFetcher`
  from §3/§12: it downloads no body and exists only to answer "does this
  redirect, and to where?" during the safety check. §12's `HttpFetcher`,
  when built, must independently adopt the same `CURLOPT_RESOLVE` pinning
  pattern for its own connections — passing this safety check once does
  not make a later, separate connection automatically safe.
- `validate_public_url()` gained a by-reference `$outResolvedIp` parameter
  and now also rejects non-default ports (any port other than 80 for
  `http://` or 443 for `https://`) — not primarily an SSRF control (a
  private IP is already blocked regardless of port) but to stop a public
  host from being used to probe unrelated internal services running on
  unusual ports on that same public machine.
- Writing the test suite surfaced two real gaps in the existing
  `EXTRA_BLOCKED_CIDRS` list that PHP's `FILTER_FLAG_NO_RES_RANGE` does
  not cover and the original list also missed: multicast (`224.0.0.0/4`)
  and the limited broadcast address (`255.255.255.255/32`). Both are now
  blocked.

### 7.2 Known limitations (not claimed to be perfect)

Per this step's own instructions, this is not presented as airtight SSRF
protection — these are the honest gaps as of Step 02:

- **No IDN/punycode normalization yet.** §6.1 calls for `idn_to_ascii()`
  before any validation step; `UrlNormalizer` does not call it yet. A
  Unicode hostname still goes through the same DNS-resolution-then-IP-
  block check as any other hostname (so it can't resolve to a private IP
  undetected), but homograph-style lookalike domains are not specifically
  flagged, and normalization/dedup of an IDN vs. its punycode form isn't
  guaranteed to match. Deferred to whichever step first needs to compare
  URLs across an actual crawl (§6's queue dedup), since Step 02 has no
  such comparison yet.
- **The redirect probe is HEAD-only.** A server that only issues a
  redirect in response to `GET` (not `HEAD`) would report as "no
  redirect" to `SsrfGuard`, then behave differently when a future
  `HttpFetcher` performs the real `GET`. `HttpFetcher` must not treat a
  prior `SsrfGuard` pass as a substitute for its own hop-by-hop validation
  — §7 point 1 already requires every hop to be re-validated at fetch
  time, independent of this earlier check.
- **DNS rebinding is closed for the probe's own connection only.** Pinning
  via `CURLOPT_RESOLVE` protects exactly the one connection `SsrfGuard`
  itself makes. It provides no protection for any other code path that
  might independently re-resolve the same hostname later; every future
  network call in this project must do its own resolve-then-pin, not rely
  on an earlier `SsrfGuard` result.
- **A five-hop redirect cap is a heuristic, not a proof.** It stops
  unbounded chains and simple two-URL loops (both tested), but a
  sufficiently long non-repeating chain that happens to stay under the cap
  would still be followed hop-by-hop — each hop is independently validated
  as safe, so this isn't a bypass of the safety check itself, just a
  reminder that "under the cap" and "a normal website" aren't the same
  thing.
- **A blocklist-based approach is inherently a moving target.** New IP
  ranges get reserved, cloud providers add metadata endpoints, and no
  static CIDR list can be asserted complete forever. This step reuses
  PHP's built-in reserved/private-range filters plus a documented,
  explicit extra list rather than trying to hand-maintain a from-scratch
  blocklist, but "complete forever" is not a claim this document makes.

---

## 8. robots.txt strategy

- Fetched once per crawl (`https://{host}/robots.txt`, then `http://` if
  https fails), through the normal `SsrfGuard`-protected fetch path — it is
  not special-cased or exempted from validation.
- Parsed by a small hand-written parser recognizing `User-agent`, `Allow`,
  `Disallow`, `Crawl-delay`, and `Sitemap` directives; groups are matched
  against our own identifying user-agent first, falling back to `*`.
- Parsed rules are cached **in memory for the duration of that one crawl**
  (attached to the `CrawlManager` instance / passed into `UrlQueue`), not
  persisted — a robots.txt file can legitimately change between scans, and
  a new scan should always re-fetch it.
- **Unavailable** (network error, non-2xx, timeout): treated as "allow all"
  — this is the conventional interpretation search engines use — but the
  crawl explicitly records `robots_available = false` on the `crawls` row
  so this is visible later, never silently assumed.
- **Malformed** (unparseable content, wrong content-type serving HTML
  error pages, etc.): lines that don't match a recognized directive are
  skipped individually rather than aborting the whole file; if *nothing*
  parseable is found, treated the same as "unavailable."
- **Explicit non-claim:** this implementation respects `robots.txt` as a
  technical crawling courtesy. It is not, and this document does not
  claim it to be, a guarantee of legal compliance with any site's terms of
  service or applicable law — that determination is a human/legal one, out
  of scope for this tool.

---

## 9. Sitemap discovery strategy

Discovery order: (1) every `Sitemap:` line in `robots.txt`, (2) if none
found, a conventional `/sitemap.xml` probe, (3) nothing else is guessed —
no crawling around looking for sitemap-shaped links.

- Every discovered sitemap URL is validated through `SsrfGuard` like any
  other URL before it's fetched — a sitemap pointing at an internal
  address is rejected the same as any other malicious redirect target.
- Content-Type and root-element are checked before trusting the file
  (`<sitemapindex>` vs `<urlset>`) — a `200 OK` HTML error page is not
  silently parsed as if it were XML.
- **Sitemap index files** are followed recursively, one level of
  recursion tracked explicitly (a sitemap index pointing at another
  sitemap index pointing at another... is capped, not followed forever).
- Parsed with `XMLReader` (streaming) rather than loading the whole
  document into memory, specifically so a very large sitemap doesn't
  exhaust worker memory.
- **Limits applied:** max sitemaps processed per crawl, max URLs read per
  sitemap, max total URLs contributed by sitemaps overall (§10) — once hit,
  remaining entries are simply not read; this is recorded as a normal
  partial-crawl condition (§15), not an error.
- URLs pulled from a sitemap enter the same `UrlQueue` as URLs discovered
  by following links, with `discovery_source = 'sitemap'` and normal
  deduplication — a URL already queued from a page link isn't queued
  twice because a sitemap also mentions it.
- Duplicate URLs *within or across* sitemaps are naturally handled by the
  same normalized-URL uniqueness constraint used everywhere else (§4/§8).

---

## 10. Crawl-limit strategy

Every limit is a field on the `CrawlLimits` value object — nothing is a
magic number buried in code, and every default is chosen for a concrete
reason:

| Limit | Default | Reasoning |
|---|---|---|
| Max pages | 200 | Enough to characterize a typical small/medium marketing site's structure without risking a multi-hour crawl of a 50,000-page e-commerce catalog by accident. Large sites hit `partial` and are clearly labeled as such (§15), never silently truncated without saying so. |
| Max crawl depth | 5 | Most useful on-site content is reachable within a few clicks from the homepage; unbounded depth is how a crawler wanders into calendar widgets and infinite pagination. |
| Max response size (per page) | 5 MB | Comfortably covers real HTML pages (even heavy ones); anything larger is far more likely to be a misconfigured endpoint or a deliberately hostile response than a page a human reads. |
| Max redirects (per URL) | 5 | Matches common browser/HTTP-client convention; anything beyond this is a redirect loop or an attack pattern, not a normal same-site redirect chain. |
| Per-request timeout | 15s connect / 30s total | Generous for a slow but legitimate server; short enough that one unresponsive page can't stall a worker indefinitely. |
| Max total scan duration | 10 minutes | Upper bound on server resource commitment per scan regardless of how many limits above are individually still "not yet hit" — the hard stop that guarantees a scan always finishes in bounded time. |
| Max concurrent requests (per crawl) | 4 | Politeness default (§11) — enough to make reasonable progress without hammering the target. |
| Max retries (per URL) | 2 | Covers a transient network blip without turning a genuinely dead page into an infinite retry loop. |
| Max sitemap entries read | 5,000 (across all sitemaps in one crawl) | Bounds worst-case memory/time spent on sitemap parsing itself, independent of the page-crawl budget above. |

All of these are overridable per crawl (stored in `crawls.limits_json`,
§4) so a future "advanced options" UI or an internal admin override can
adjust them without a code change — but the defaults above are what an
ordinary user gets.

---

## 11. Rate limiting & politeness

- **Concurrency cap** (§10) bounds simultaneous in-flight requests to one
  target site — never "as many as the server can accept."
- **Small delay between requests** to the same host (default: a short
  fixed delay, e.g. a few hundred milliseconds, between one finished
  request and the next one starting against that host) even when under
  the concurrency cap, so a fast local worker doesn't burst-fetch a slow
  target.
- **`Crawl-delay`** from `robots.txt`, when present, is honored as a floor
  on that per-host delay (never fetched faster than the site asked for).
- **HTTP 429 (Too Many Requests)**: back off using the response's
  `Retry-After` header if present; otherwise apply exponential backoff
  starting from the base delay, capped at a maximum wait, up to the
  per-URL retry limit (§10) before giving up on that URL and recording it
  as an error, not as a crawl-ending failure.
- **HTTP 503 (Service Unavailable)**: same backoff treatment as 429 — many
  servers use 503 for "temporarily overloaded, try again shortly."
- **Repeated server failures** (see §21) trip a circuit breaker: if a high
  proportion of recent requests to the target are failing, the crawl stops
  *early* and reports why, rather than continuing to hammer a site that's
  clearly struggling or down.

---

## 12. HTTP fetcher strategy

One class, one job: take a single, already-SSRF-validated URL, return a
`HttpResponse` value object (or throw a typed error the caller records).
Built on `ext-curl`:

- `CURLOPT_FOLLOWLOCATION = false` always (redirects are handled one hop
  at a time by `CrawlManager`, per §7).
- `CURLOPT_RESOLVE` pins the connection to the pre-validated IP (§7.3).
- `CURLOPT_CONNECTTIMEOUT` / `CURLOPT_TIMEOUT` enforce §10's timeout
  limits.
- `CURLOPT_ENCODING = ''` lets curl negotiate/decompress gzip or deflate
  automatically where the server supports it — reduces transfer time for
  large HTML documents at effectively no cost.
- A `CURLOPT_WRITEFUNCTION` streaming callback accumulates the body and
  **aborts the transfer** the moment accumulated bytes exceed the
  configured max response size — this enforces the cap on the actual bytes
  received, not just on a `Content-Length` header a hostile server could
  lie about or omit.
- Captured per response: final status code, all response headers,
  `Content-Type`, actual body size received, total request duration, and
  (from curl's own timing info) DNS/connect/TLS/time-to-first-byte where
  available — the "response timing information" the task asks the crawler
  to eventually collect.
- TLS/SSL failures, DNS failures, and connection failures are caught as
  distinct curl error conditions and translated into the `error_type`
  categories in §15/§21, not left as raw curl error codes.
- Parsing HTML is explicitly **not** this class's job — `HttpFetcher`
  hands a `HttpResponse` (status + headers + raw body) to `HtmlParser`;
  neither class knows about the other's internals.

### 12.1 Step 03 implementation notes

What was actually built, in `src/Crawler/`, and how it differs from the
prose above now that there's no `CrawlManager` yet to own redirect
following:

- The result type is called `FetchResult`, not `HttpResponse` — chosen to
  read clearly next to Step 02's `ValidationResult` (`valid`/`success`
  follow the same pattern: a bool plus a `userMessage`-style field, never
  a thrown exception for a normal non-2xx HTTP response).
- With no `CrawlManager` built yet, `HttpFetcher` itself walks the
  redirect chain (still capped at 5, still one hop at a time, still
  `CURLOPT_FOLLOWLOCATION = false`) rather than a separate orchestrator
  calling it once per hop. This is a Step 03 simplification, not a
  reversal of §7's design — when `CrawlManager` exists, the natural change
  is `CrawlManager` driving hop-by-hop calls into a `HttpFetcher` that
  fetches exactly one URL and never follows anything itself; nothing in
  today's `FetchResult` shape needs to change for that split to happen.
- Every hop's safety check goes through a new `UrlSafetyCheckerInterface`
  (production implementation: `DefaultUrlSafetyChecker`, a one-line
  wrapper around `validate_public_url()`) rather than calling
  `validate_public_url()` directly. This exists for exactly one reason:
  letting `tests/run-http-fetcher-tests.php` point `HttpFetcher`'s real
  curl/timeout/retry/redirect/size-cap logic at a real local test server,
  whose loopback address production code must (and does) still reject.
  The interface is never given any other implementation outside `tests/`.
- Redirects are re-validated independently of Step 02's `SsrfGuard`, on
  purpose: `SsrfGuard`'s own pre-check (§7) uses `CurlRedirectProbe`,
  which sends `HEAD`, not `GET`. A server that only redirects on `GET`
  would look safe to that pre-check and then behave differently here — so
  `HttpFetcher` never treats "`SsrfGuard` already approved this" as a
  reason to skip its own check on any hop, including the first.
- One consequence worth knowing, not a bug: in the normal `api/analyze.php`
  flow, `SsrfGuard` runs first and already fully walks the redirect chain
  before `HttpFetcher` is ever called, so `HttpFetcher` is usually handed
  an already-final URL — `fetch.redirect_count` in the API response
  reflects only redirects `HttpFetcher` itself followed (typically 0), not
  the total distance from the originally-submitted URL. Confirmed against
  real sites during manual testing (e.g. submitting `google.com` returns
  `normalized_url: https://www.google.com/` with `redirect_count: 0`,
  because `SsrfGuard` already resolved that redirect earlier in the same
  request).
- Config lives in `HttpFetcherConfig`, readable from environment variables
  (`HTTP_CONNECT_TIMEOUT`, `HTTP_REQUEST_TIMEOUT`, `HTTP_MAX_RESPONSE_BYTES`,
  `HTTP_MAX_REDIRECTS`, `HTTP_MAX_RETRIES`, `HTTP_RETRY_BASE_DELAY_MS`,
  `HTTP_MAX_RETRY_DELAY_MS`, `HTTP_MAX_TOTAL_DURATION`, `HTTP_USER_AGENT`)
  via `getenv()` — no new dependency, consistent with Step 02's decision
  not to introduce Composer yet. Defaults are deliberately tighter than
  §10's table (5s connect / 15s request per attempt, not 15s/30s): this
  fetch is synchronous — a browser's own `fetch()` to `api/analyze.php` is
  waiting on it — unlike the background-worker crawl §10 was originally
  sized for. A `HTTP_MAX_TOTAL_DURATION` (default 45s) wall-clock budget
  was added across every hop and retry combined, which §10's table doesn't
  have an equivalent for yet, specifically so a pathological chain (many
  hops, each retried, each slow) still can't hold a synchronous request
  open indefinitely.
- Retry policy lives in `RetryPolicy`, matching §10/§11/§15's intent
  (429/502/503/504 retryable, `Retry-After` honored and capped, a fixed
  4xx or a security rejection never retried) but scoped per-hop, and with
  every delay capped (`HTTP_MAX_RETRY_DELAY_MS`, default 3s) for the same
  synchronous-request reason above — a background worker can afford to
  honor a long `Retry-After`; a request a browser is waiting on cannot.
- `api/analyze.php` never returns the fetched response body to the
  browser — only structured metadata (status, content type, timing,
  redirect/retry counts). §22/§23 ask this step to prove the fetch works,
  not to display page content, and returning a target site's raw HTML
  into `scan.php`'s existing `innerHTML`-based rendering without a reason
  to would be an unnecessary opening for injected markup from a hostile
  site to reach a visitor's browser. Every dynamic value `scan.php` *does*
  render (final URL, content type) is HTML-escaped before insertion — see
  `scan.php`'s `escapeHtml()`.

### 12.2 Known limitations (not claimed to be perfect)

- **DNS failure and TLS failure aren't exercised as live network
  conditions in the automated suite.** Every real connection is pinned to
  a pre-validated IP (`CURLOPT_RESOLVE`), so DNS resolution happens inside
  the safety checker, not inside curl — genuinely reproducing a
  curl-level DNS failure through the normal flow isn't really possible by
  design, and standing up a second TLS-terminating server with a bad
  certificate just for one test wasn't done this step. Both are instead
  covered as direct, deterministic unit tests of the errno → `errorCode`
  mapping (`HttpFetcher::classifyCurlError()`), and the "TLS verification
  is never disabled" guarantee is enforced by a source-inspection
  regression test rather than a live handshake failure.
- **A five-hop redirect cap and a per-hop retry cap are heuristics**, the
  same honest caveat Step 02 made about `SsrfGuard`'s own cap — they stop
  unbounded chains and simple loops, not every conceivable shape of slow
  or wasteful target.
- **Compression is whatever curl's own build supports** (`CURLOPT_ENCODING
  = ''` negotiates gzip/deflate, and brotli if curl was built with it) —
  this project doesn't implement or verify support for any specific
  algorithm beyond gzip, which the test suite does exercise.
- **The response-size cap applies uniformly to every content type**, not
  just HTML — simpler and safer, at the cost of capping a large legitimate
  non-HTML file (e.g. a PDF) at the same limit as a page. Content-type-
  specific limits are deferred until a real use for non-HTML content
  exists.

---

## 13. HTML extraction strategy

`HtmlParser` takes a `HttpResponse` body, returns a `PageFacts` value
object. Implementation basis: `DOMDocument::loadHTML()` with
`libxml_use_internal_errors(true)` (so malformed real-world HTML produces
a best-effort DOM instead of a fatal error), queried via `DOMXPath`.

Extracted per page (facts only — see §18 for why nothing here is a score):

- `<title>` text
- `<meta name="description">` content
- `<meta name="robots">` content (page-level robots directives, distinct
  from the site-level `robots.txt`)
- `<link rel="canonical">` href
- All `<h1>`–`<h6>` text, in document order, with their level — enough for
  a future analyzer to judge heading structure without the crawler making
  that judgment itself
- All `<a>` links: href (normalized, §6), anchor text, and whether internal
  or external (§9-of-the-task-prompt's internal/external rule, §14 below)
- All `<img>`: src, alt attribute (present/absent and its text), so a
  future analyzer can compute "images missing alt text" without the
  crawler deciding that's good or bad
- `<html lang="">` value
- Open Graph tags (`<meta property="og:*">`) as a flat key/value map
- JSON-LD structured data (`<script type="application/ld+json">` contents,
  parsed as JSON and stored as-is) — the dominant real-world structured
  data format; microdata/RDFa parsing is **not** attempted in v1 (noted as
  a documented gap, not silently skipped)
- Basic content signals: rendered text length / word count, so an analyzer
  can later flag "very thin content" — the crawler reports the number, it
  does not decide whether that number is a problem

Nothing above computes a score, a pass/fail judgment, or a recommendation
— that is the explicit line drawn in §18.

---

## 14. JavaScript-heavy websites

A plain `curl`-based fetch only ever sees the HTML the server sends in its
initial response. What it **can** reliably detect: the raw document
structure, any content that's server-rendered or present in the initial
HTML (including most static site generators, traditional server-rendered
apps, and increasingly common SSR/SSG JS frameworks), all HTTP-level
facts (status, headers, redirects, timing), robots.txt/sitemap content,
and metadata tags (since these almost always live in a server-rendered
`<head>` even on otherwise JS-heavy sites).

What it **cannot** detect: content that's injected into the DOM by
client-side JavaScript after initial load (a common pattern in
client-side-rendered single-page apps) — such a page may appear to the
crawler as an near-empty `<body>` with a script tag, even though a real
visitor sees a full page.

This blueprint does **not** make browser rendering mandatory for every
page, for cost/resource reasons: launching a headless browser per page is
an order of magnitude more expensive in CPU/RAM/time than an HTTP fetch,
and most pages don't need it. The intended future design (not implemented
now):

1. The plain-HTTP crawl always runs first and is the default for every
   page.
2. A lightweight heuristic flags pages that are *likely* to need rendering
   — e.g. a very small extracted text/word count combined with the
   presence of known SPA framework markers (a near-empty root `<div>`,
   bundle-style script tags, etc.).
3. **Only** flagged pages (and only up to a small, separately-configured
   limit, so this can't become "every page now gets a browser") would be
   optionally re-fetched through a headless-rendering path.
4. That rendering path would itself be a separate, optional component —
   most plausibly a small dedicated microservice (e.g. a Node/Playwright
   process, or `chrome-php/chrome` driving headless Chrome via the DevTools
   Protocol from PHP) that the crawler calls over a local, tightly-scoped
   interface, rather than embedding a browser dependency into every crawl
   worker. It would go through the exact same `SsrfGuard` validation as
   every other fetch before rendering anything.

None of this is built in this step; it's documented here so the plain-HTTP
crawler's architecture doesn't need to change shape when it's added later.

---

## 15. Error handling strategy

Every URL is processed inside its own error boundary in the worker loop —
one bad page updates that page's `crawl_urls`/`crawl_errors` rows and the
worker moves on; it never terminates the crawl or the worker process.

| Failure | Handling |
|---|---|
| DNS failure | Recorded as `error_type = dns`; URL marked `failed` after retries (§10) exhausted |
| Connection timeout | `error_type = timeout`; retried up to the retry limit with backoff, then `failed` |
| SSL/TLS failure | `error_type = ssl`; not retried (a cert problem won't fix itself between retries) — recorded and skipped |
| HTTP 4xx | `error_type = http_4xx`; recorded with the exact status, not retried (client errors are stable) |
| HTTP 5xx | `error_type = http_5xx`; retried with backoff (transient-server-error assumption), then recorded as failed if still failing |
| Redirect loop | Detected via the per-URL redirect cap (§7.2/§10) being exceeded; `error_type = redirect_loop` |
| Invalid/malformed HTML | `libxml_use_internal_errors` prevents this from being fatal; parser extracts whatever it can from the best-effort DOM and proceeds — never an `error_type` on its own unless the body isn't HTML at all |
| Unsupported content type | Non-HTML responses (PDFs, images linked as pages, etc.) are recorded (status, content-type, size) but not run through `HtmlParser`; not treated as an error, just "nothing to extract" |
| robots.txt errors | Per §8 — unavailable/malformed both degrade to "allow all," never a crawl-ending error |
| Sitemap errors | Per §9 — a bad sitemap reduces discovered-URL count, never aborts the crawl |
| Oversized response | Transfer aborted mid-stream by `HttpFetcher` (§12); `error_type = oversized` |
| Rate limiting (429/503) | Handled by the backoff/retry policy in §11, not treated as a hard error unless retries are exhausted |
| Crawler cancellation | Not an error at all — the worker's normal loop checks for `cancelling` between URLs (§16) and exits cleanly |

---

## 16. Partial-crawl strategy

`crawls.pages_discovered` (every URL ever added to `crawl_urls`) and
`crawls.pages_crawled` (every URL actually fetched, success or failure)
are both tracked continuously, not computed after the fact. When any limit
in §10 is hit before the queue is naturally empty:

- Status is set to `partial`, **never** `completed`.
- `stop_reason` records exactly which limit was hit
  (`max_pages`, `max_depth`, `max_duration`, `cancelled`, or
  `error_threshold` from §11's circuit breaker).
- The `crawls` row already has both `pages_discovered` and `pages_crawled`
  populated, so "10,000 pages exist, 500 were scanned" is a real, queryable
  fact, not something the frontend has to infer.
- This data is exactly what the existing `report.php`/`scan.php` UI's
  established "honest partial/unavailable state" pattern (built in
  Category 02) needs to render truthfully — no UI change of *shape* is
  required, only wiring real numbers into states that already exist as
  designed empty/placeholder states today.

---

## 17. Background processing strategy

No request to `api/analyze.php` will ever block waiting for a crawl to
finish — that's the current temporary demo behavior (a synchronous
"safe to scan, but not built yet" check) and is not how the real crawler
works.

1. **Start**: `api/analyze.php` (evolved) validates the seed URL,
   creates a `crawls` row (`status = pending`) and one `crawl_urls` row for
   the seed, and returns immediately (`202 Accepted`, `{crawl_id}`). No
   crawling happens on this request.
2. **Queueing**: that seed `crawl_urls` row *is* the queue's starting
   state — there's no separate queue data structure to keep in sync with
   the database, the database table **is** the queue.
3. **Workers**: `workers/crawl-worker.php` is a CLI script, invoked either
   as a short-lived process on a schedule (cron every N seconds) or as a
   longer-running supervised loop (via `supervisord`/`systemd`), depending
   on the eventual hosting environment — the code doesn't need to know or
   care which. Each invocation: claims a small batch of `pending`
   `crawl_urls` rows for a crawl that isn't `cancelling`/finished (an
   atomic `UPDATE ... SET status='fetching', claimed_at=NOW(), claimed_by=:worker_id WHERE status='pending' ... LIMIT n`,
   which is how multiple worker processes can run concurrently without
   double-processing the same URL), processes each through
   `HttpFetcher`→`HtmlParser`, writes results, and updates the parent
   `crawls` row's progress counters.
4. **Progress storage**: nothing beyond the `crawls`/`crawl_urls` rows
   already described — progress *is* those row counts, read live.
5. **Frontend polling**: `api/crawl-status.php?crawl_id=` — a cheap,
   read-only query returning `{status, pages_discovered, pages_crawled,
   stop_reason}` — is polled by the browser every few seconds, the same
   "call an API, render whatever it honestly says" pattern `scan.php`
   already uses today, just repeated on an interval instead of once.
6. **Cancellation**: `api/crawl-cancel.php` sets `crawls.status =
   'cancelling'`. The worker loop checks this flag before claiming its
   *next* URL (not mid-fetch) and, if set, stops claiming new work and sets
   `status = 'cancelled'`. Already-fetched data is kept, not discarded.
7. **Failure recovery**: if a worker process dies mid-URL (server restart,
   OOM-kill, etc.), that URL is left `status = 'fetching'` with a stale
   `claimed_at`. A sweep at the start of every worker invocation resets any
   `fetching` row whose `claimed_at` is older than a short threshold (e.g.
   a few minutes — comfortably longer than the per-request timeout in
   §10) back to `pending`, so it's naturally picked up again. No
   dead-letter queue or separate recovery process is needed for this
   scale.

This design deliberately does not require Redis, a message broker, or a
long-lived daemon framework — it's the smallest mechanism that gives real
asynchrony, real progress reporting, real cancellation, and real crash
recovery, and it's portable to essentially any PHP hosting environment.

---

## 18. Cost & resource control

- Every numeric limit in §10 exists specifically to bound CPU/RAM/network/
  duration *per crawl*.
- **Concurrent scans per server**: a configurable global cap on how many
  crawls may be `running`/`queued` at once (enforced by the worker: when
  claiming work, it only claims for crawls under that cap, and new crawl
  submissions beyond the cap are queued in `pending` rather than started
  immediately — the user sees an honest "waiting to start" state, not a
  failure).
- **Concurrent scans per user/IP**: a configurable cap on how many crawls
  one submitter may have active at once (see §20 abuse scenarios).
- **Database growth**: bounded by not storing raw HTML (§4) and by the
  fixed per-crawl row-count ceiling that §10's `max pages` limit implies
  (a crawl can produce at most `max_pages` rows in `crawl_pages`, ever).
- **Large websites specifically**: handled by `partial` status (§15), not
  by refusing to scan them or by silently crawling forever — the same
  bounded-cost guarantee applies whether the target has 5 pages or
  5 million.

---

## 19. Security & abuse protections

| Scenario (from the task's list) | Protection |
|---|---|
| User submits an internal IP / localhost / cloud metadata URL | `SsrfGuard`/`validate_public_url()` rejects it before any crawl row is even created — §7 |
| User creates a huge crawl | Bounded by every limit in §10; result is `partial`, not an unbounded resource sink |
| User starts many scans | Per-user/IP concurrent-scan cap (§18); a simple rate limit on crawl-start requests (e.g. max N new crawls per hour per submitter) |
| Target returns huge responses | Streaming size cap aborts the transfer mid-download (§12), not after the fact |
| Redirect chain attacks (SSRF via redirect, or pure loop) | Per-hop re-validation + per-URL redirect cap (§7, §10) |
| Malformed HTML | `libxml_use_internal_errors` — never fatal (§13, §15) |
| Slow server ("slow-loris"-style) | Connect/total timeouts (§10/§12) bound how long any single request can occupy a worker |
| Crawl trap (e.g. infinitely generated calendar/pagination links) | Max depth + max pages (§10) bound total work regardless of how many links a trap generates; combined with... |
| Infinite URL parameters / duplicate URL explosion | ...normalized-URL deduplication (§6/§8) collapses parameter-order variants, and a future refinement (documented, not built now) could cap distinct query-parameter *combinations* per path if trap patterns prove common in practice |
| One target site effectively down/hostile | The error-rate circuit breaker (§11) stops the crawl early rather than retrying into a wall indefinitely |

---

## 20. Raw crawler data contract

**The crawler's only job is to produce facts. It never produces
judgments.** Concretely: every field described in §4/§13 is either a
direct observation (a status code, a header value, response timing, a
byte count) or a neutral extraction (the literal text of a title, the
literal `href` of a link, whether an `alt` attribute is present). Nothing
the crawler writes is a score, a severity level, a pass/fail verdict, a
priority, or a recommendation — those concepts do not exist anywhere in
the schema proposed in §4.

The boundary, explicitly:

```
RAW CRAWL DATA (this document, this category)
  crawls, crawl_urls, crawl_pages, crawl_errors
  = what a page IS: its status code, its title text, whether it has
    a canonical tag, how many words it has, what links it contains.

                         ────────────  ↓  consumed by, never blended with  ────────────

SEO ANALYSIS / RECOMMENDATIONS (a later category, not this one)
  = what a page's facts MEAN: "this title is too short," "this page
    has no canonical tag and that's a problem," "fix this by...".
```

A future analyzer reads `crawl_pages` rows (read-only, from its own code)
and produces its own separate records — this is exactly the shape the
frontend's existing `ReportIssue`/action-plan concepts (built in Category
02) already expect: a `ReportIssue` is never something the crawler
creates.

---

## 21. Future crawler implementation steps

Adjusted slightly from the task's suggested order — storage moves earlier
(orchestration needs somewhere to write to) and a plain synchronous
orchestration milestone is inserted before background processing, so
there's a working (if not-yet-scalable) end-to-end crawl to test against
before the added complexity of a worker/queue system:

| Step | Scope |
|---|---|
| 02 | URL normalization + `SsrfGuard` (extends existing `url-security.php`) |
| 03 | `HttpFetcher` (curl wrapper, manual redirects, streaming size cap, timing capture) |
| 04 | `RobotsTxtHandler` + `SitemapDiscovery` |
| 05 | `UrlQueue` + deduplication (in-memory first; DB-backed once storage exists) |
| 06 | `HtmlParser` + `PageFacts` extraction |
| 07 | Storage layer: schema + repositories (§4) |
| 08 | `CrawlManager` orchestration: wire 02–07 together for a **synchronous**, small, single-request crawl (e.g. capped at ~10 pages) — first end-to-end milestone |
| 09 | Background processing: `workers/crawl-worker.php`, crawl-start/status/cancel API endpoints, claim/recovery logic (§17) |
| 10 | Frontend progress/cancellation integration — wire `scan.php`/`report.php`'s existing honest-state UI to real polling data |
| 11 | Large-site handling: concurrency (§11), sitemap-driven prioritization, the circuit breaker (§11/§19) |
| 12 | Crawler security testing: an SSRF-battery-style automated test suite against `SsrfGuard` (redirect-based bypasses, DNS-rebinding simulation, every case from the existing 22-URL battery re-run against the crawler's entry points, not just the form validator) |
| 13 | Final crawler QA: full manual + scripted run against real, permission-appropriate public test sites; confirm partial/error/cancellation states all surface correctly in the UI |

---

## 22. Potential problems and how this architecture prevents them

| Problem | Prevented by |
|---|---|
| Crawler used to probe internal infrastructure | SsrfGuard on every single fetch, including redirects, sitemaps, and robots.txt — no exemptions anywhere (§7) |
| DNS rebinding bypasses hostname-based checks | Resolve-then-pin-then-validate-the-IP via `CURLOPT_RESOLVE` (§7.3) |
| One slow/broken page hangs an entire scan | Per-request timeouts + per-URL error boundary (§10, §15) |
| A crawl never finishes on a huge site | Hard caps on pages/depth/duration, degrading to `partial`, never unbounded (§10, §15) |
| Worker crash loses track of in-flight work | `claimed_at` staleness sweep re-queues abandoned URLs (§17) |
| Database fills up with raw HTML | Raw bodies are never persisted, only extracted facts (§4) |
| A user starts unlimited expensive scans | Per-user/IP concurrency + rate limits, plus a global server-wide concurrent-scan cap (§18, §19) |
| A crawl trap or parameter explosion balloons the queue | Normalized-URL dedup + max-pages/max-depth caps bound total queue growth regardless of how many URLs a trap generates (§6, §10, §19) |
| Malformed HTML crashes the parser | `libxml_use_internal_errors` + best-effort DOM extraction, never fatal (§13) |
| A hostile sitemap/robots.txt is blindly trusted | Content-type/structure validation before parsing; both degrade gracefully to "unavailable" rather than being assumed correct (§8, §9) |
| Crawler-produced data gets confused with SEO judgments later | Strict raw-facts-only schema with no score/severity/recommendation fields anywhere; analyzers are a separate, later, read-only consumer (§20) |
| UI has to change shape once real data exists | Crawl states (§5) and partial/error reporting (§15) are designed to slot into the empty/partial/failed states the Category 02 UI already implements, not to replace them |

---

## Scope confirmation

Nothing in this document has been implemented. No file under `src/`,
`workers/`, or new `api/*.php` endpoints exists yet; `composer.json` has
not been created; no database has been connected; no external website has
been fetched. `includes/`, the existing four pages, and `api/analyze.php`
are all unchanged by this step.

STEP 01 COMPLETE — PHP CRAWLER ARCHITECTURE AND BLUEPRINT READY FOR IMPLEMENTATION.
