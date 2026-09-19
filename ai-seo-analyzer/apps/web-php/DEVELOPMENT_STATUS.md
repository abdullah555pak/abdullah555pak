# Development Status — PHP application (`apps/web-php`)

Snapshot as of the end of **Category 02 — UI/UX & Simple Design**. This file
covers the PHP codebase specifically. Update it at the end of every category
so anyone (human or AI) picking up the project can orient in under a minute.

## A note on how this codebase relates to the rest of the repository

`apps/web-php` is a plain PHP + HTML + CSS rebuild of the site's front end.
It was created mid-way through Category 02 so the project could be previewed
and run with zero build tooling (no Node/npm, no git command-line tools
required beyond PHP itself). **From this point forward it is the project's
primary, source-of-truth front end.**

An earlier Next.js/React + FastAPI implementation also exists in this
repository (`apps/web`, `apps/api`) and is more complete — it additionally
has a dedicated Issue Detail / Fix Guide page and a dedicated SEO Action
Plan page with search/filter/status UI, plus 163 frontend and 60 backend
automated tests. That codebase is no longer the direction being developed
and is kept only for reference; do not extend it going forward. Nothing
about this note changes what's written below — it describes the current
state of `apps/web-php`, the codebase this file is actually for.

## Current project status

Category 01 (project foundation) and Category 02 (UI/UX) are both complete
for this codebase's scope. No product features exist yet — the application
does not analyze any real website. It's a working skeleton: pages that
render, a URL input that validates safely, and a backend endpoint that
honestly reports "not built yet" rather than returning invented results.

**Real SEO analysis has not been implemented yet.**

## Technology stack

| Area | Technology |
|---|---|
| Language / runtime | PHP 8.4 (CLI built-in server for local dev; no framework) |
| Templating | Plain PHP includes (`includes/header.php`, `includes/footer.php`, etc.) - no template engine |
| Styling | One hand-written CSS file (`assets/css/style.css`), CSS custom properties for the design system - no CSS framework |
| Client-side JS | Small inline `<script>` blocks per page (URL-clear button, live fetch to the API, filter-pill toggling) - no JS framework or bundler |
| Data storage | None. No database is connected; nothing is persisted. |
| Routing | Flat, file-based (`index.php`, `scan.php`, `report.php`, `issue.php`), driven by query-string parameters (`?url=&section=&id=`) - no router |
| Configuration | None needed yet - no secrets, no environment variables, no `.env` file exist in this codebase |

## What has been implemented

- **Homepage** (`index.php`) - hero copy, a labeled URL input with a clear
  (×) button, inline validation errors, a 4-step "How it works" explainer,
  a collapsible "What is SEO?" disclosure, and an honest trust notice about
  what the tool can and can't see.
- **Scan page** (`scan.php`) - takes the submitted URL, calls the real
  backend API, and renders whatever it honestly returns: a "not built yet"
  message, a security rejection (e.g. a private/internal address), or a
  generic failure - never a fake result.
- **Results dashboard** (`report.php`) - Overview (health-summary card that
  always shows "—" plus a real sentence explaining why, a "What should I
  fix first?" card, and 11 SEO-category cards all honestly marked
  "Unavailable"/"Not analyzed yet"), a Problems section (working search
  field and severity filter pills, category/sort dropdowns), an
  Action Plan section (same honest "not available yet" card), and one
  section per SEO category - all reachable through a sidebar (desktop) /
  dropdown (mobile) navigation that highlights the current section.
- **Issue page** (`issue.php`) - breadcrumb navigation and the three honest
  states a real click-through can reach today: no scan yet, no specific
  issue selected, or (always, since no issue store exists) "Issue not
  found."
- **Backend API** (`api/analyze.php` + `includes/url-security.php`) - a full
  PHP port of the original SSRF-safe URL validator: rejects disallowed
  schemes, embedded credentials, localhost, and any address whose resolved
  IP is private/loopback/link-local/multicast/reserved/a cloud metadata
  address. Verified against the same 22-URL malicious-input battery the
  original implementation used - 100% still rejected.
- **Accessibility**: a skip-to-main-content link on every page, visible
  keyboard focus rings on every interactive element, non-color-only status
  badges (icon dot + text label, never color alone), and WCAG AA-compliant
  text contrast on every badge tone and the muted gray (verified by
  computing actual contrast ratios, not just eyeballing it).
- **Responsive layout**: verified with no horizontal overflow and no
  console/page errors across every current page at 320px/375px/768px/
  1024px/1440px/1920px viewport widths.
- **Security-UI hygiene**: `includes/bootstrap.php` runs first on every
  request (page or API) and forces `display_errors` off, so a raw PHP
  warning/error can never leak to a visitor regardless of the host's own
  `php.ini` defaults (common local setups like XAMPP/MAMP ship with
  `display_errors` on). No environment variables, secrets, or server
  internals are read or echoed anywhere in the codebase.

## What has intentionally NOT been implemented yet

- Website crawling of any kind (no HTTP fetching of a target site happens
  anywhere in this codebase)
- Technical SEO / on-page / performance / structured-data / mobile /
  accessibility / ads analysis
- AI-generated explanations or a real, data-driven action plan
- A dedicated Fix Guide page and a dedicated Action Plan page (with its
  own search/category/status filters and a category-grouped action list) -
  these exist in the earlier Next.js codebase (`apps/web`) but have not
  been ported to PHP yet
- Traffic, keyword, or backlink data (verified, estimated, or otherwise)
- Competitor analysis
- User accounts, authentication, or sessions
- Saved websites, scan history, or scheduled scans
- Any database table or schema - nothing is stored anywhere
- Automated tests for the PHP codebase (there is currently no PHPUnit or
  similar test suite; verification so far has been manual + scripted
  Playwright checks run during development, not a committed test suite)
- Deployment of any kind

## Current PHP architecture

```
apps/web-php/
├── index.php              Homepage + URL input form (POST to self)
├── scan.php                Scan page - calls api/analyze.php via fetch()
├── report.php               Results dashboard (all sections, one file)
├── issue.php                Issue detail honest empty states
├── api/
│   └── analyze.php          JSON API: validates a URL, returns 501 "not built yet"
├── includes/
│   ├── bootstrap.php        Runs first on every request - error display hardening
│   ├── header.php            Shared <head>/<header>, opens <body><div class="page">
│   ├── footer.php            Shared <footer>, closes the page shell
│   ├── url-validation.php    Light client-UX-style format check (homepage form)
│   ├── url-security.php      The real SSRF-safe validator (security boundary)
│   ├── report-data.php       The 11 SEO category definitions + severity metadata
│   └── priority-summary.php  Shared "What should I fix first?" card
└── assets/
    └── css/style.css         The entire design system (one file, CSS custom properties)
```

## How to run the project locally

**Prerequisite:** PHP 8+ (check with `php -v`; install via `brew install php`
on macOS if missing, or download from php.net).

```bash
cd apps/web-php
php -S localhost:8000
```

Open `http://localhost:8000` in a browser. No `npm install`, no build step,
no database, no environment file needed.

## Current testing status

No automated PHP test suite exists yet (see "What has NOT been
implemented" above). Verification for this codebase has been:

- `php -l` syntax-checked on every file after every change
- A scripted, non-committed Playwright pass covering: every page at 6
  viewport widths (0 horizontal-overflow issues, 0 console/page errors),
  the full user journey (homepage → scan → back home → report → each
  report section), every reachable error/empty state (empty URL, invalid
  URL format, missing report, no website to scan, a blocked private/
  internal address, issue-not-found, report-unavailable, scan-required),
  keyboard focus visibility, and the severity-filter-pill interactivity
- The 22-URL SSRF malicious-input battery, run directly against
  `includes/url-security.php`, confirming every case is still rejected
  after every change made this category
- A full-project grep audit for fake/placeholder SEO data (scores,
  percentages, traffic, keyword/backlink counts, rankings) - none found

Adding a real PHPUnit test suite for this codebase is a reasonable next
step but was not required to complete Category 02.

## Known limitations

- No automated test suite for the PHP code yet (noted above).
- The SSRF-safe validator only proves an address is *safe to eventually
  fetch*; it does not fetch anything. A real crawler (not built yet) must
  re-validate at actual connect time and on every redirect hop, since DNS
  can answer differently between this check and a later real request.
- The Fix Guide and dedicated Action Plan pages exist only in the earlier
  Next.js codebase, not here (see above) - the report page's Action Plan
  *section* exists and is honest, but there's no standalone page with its
  own filters/search yet.
- The Problems/Action-Plan filter and search controls are real, interactive
  UI, but since zero real issues exist to filter, every combination
  correctly shows the same honest "not available yet" message - this is
  expected, not a bug.

## Next development category

**Category 03.** UI/UX is complete, QA-tested, and confirmed to run
cleanly from a stopped state with no database or environment setup
required. Ready to proceed once approved.
