<?php
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/url-validation.php';

$url = trim($_GET['url'] ?? '');
$hasUsableUrl = $url !== '' && looks_like_website_address($url);

$page_title = 'Analyzing ' . ($url !== '' ? $url : 'your website') . ' — Sitewell';
require __DIR__ . '/includes/header.php';
?>
  <main class="main" id="main-content">
    <?php if (!$hasUsableUrl): ?>
      <div class="empty-state u-text-center">
        <p class="empty-state__title">No website to analyze</p>
        <p class="empty-state__desc">We didn&rsquo;t get a valid website address to scan.</p>
        <div class="empty-state__action">
          <a href="/" class="btn btn--secondary btn--sm">Back to Home</a>
        </div>
      </div>
    <?php else: ?>
      <a href="/" class="report-header__back">&larr; Back to Home</a>
      <div class="u-text-center">
        <h1 class="hero__title" style="font-size:1.5rem;">Analyzing your website</h1>
        <p style="margin-top:0.25rem; font-size:0.875rem; font-weight:600; color:var(--color-ink-soft); word-break:break-all;">
          <?= htmlspecialchars($url) ?>
        </p>
        <div id="scan-status" role="status" aria-live="polite" style="margin-top:0.75rem;">
          <span class="badge badge--info"><span class="badge__dot" aria-hidden="true"></span>Checking&hellip;</span>
        </div>
      </div>

      <!--
        This calls the real PHP backend at /api/analyze.php: SSRF-safe URL
        validation (includes/url-security.php, src/Crawler/SsrfGuard.php),
        then one real HTTP fetch of the approved URL
        (src/Crawler/HttpFetcher.php). Every value rendered below comes
        from that response, never a hardcoded/fake result - including
        when the fetch itself fails after a URL passes validation.
      -->
      <div id="scan-result" role="alert" class="u-mt-2 u-text-center" style="max-width: 28rem; margin-left: auto; margin-right: auto;"></div>
    <?php endif; ?>
  </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
<?php if ($hasUsableUrl): ?>
<script>
  (function () {
    var url = <?= json_encode($url) ?>;
    var statusEl = document.getElementById('scan-status');
    var resultEl = document.getElementById('scan-result');

    function actionButtons(reportUrl) {
      var html = '<div style="margin-top: 1.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.75rem;">';
      if (reportUrl) {
        html += '<a href="/report.php?url=' + encodeURIComponent(reportUrl) + '" class="btn btn--primary">View Report</a>';
      }
      html += '<a href="/" class="btn btn--secondary">Back to Home</a></div>';
      return html;
    }

    // Every value below that can contain data from the *target* website
    // (its final URL after redirects, its own Content-Type header) is
    // escaped before going into innerHTML - a malicious site's own
    // redirect target or response header is not something this page
    // should ever be able to inject markup with.
    function escapeHtml(value) {
      var div = document.createElement('div');
      div.textContent = value === null || value === undefined ? '' : String(value);
      return div.innerHTML;
    }

    // Three genuinely different situations, kept visually and textually
    // distinct so none of them reads as "something is wrong with your
    // website" when that isn't true: (1) the URL itself was rejected
    // (renderError/Blocked), (2) the URL was fine but we couldn't reach
    // it right now (renderFetchFailure), (3) we reached it and got a real
    // HTTP response (renderFetchSuccess) - which is still only raw
    // connectivity/technical info, never an SEO analysis.
    function renderFetchSuccess(fetchData, normalizedUrl, message) {
      statusEl.innerHTML =
        '<span class="badge badge--good"><span class="badge__dot" aria-hidden="true"></span>Connected</span>';

      var finalUrl = fetchData.final_url || normalizedUrl;
      var redirectNote = '';
      if (fetchData.redirect_count > 0) {
        redirectNote = '<p style="margin-top: 0.35rem; font-size: 0.8125rem; color: var(--color-ink-soft);">' +
          'Your site redirected ' + escapeHtml(fetchData.redirect_count) +
          (fetchData.redirect_count === 1 ? ' time' : ' times') +
          ' to <strong>' + escapeHtml(finalUrl) + '</strong>.</p>';
      }

      resultEl.innerHTML =
        '<h2 style="color: var(--color-good); font-size: 1.25rem; font-weight: 600; margin: 0;">' +
        'We successfully connected to your website</h2>' +
        '<p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--color-ink-soft);">' +
        'We reached <strong>' + escapeHtml(finalUrl) + '</strong> and received a real response.</p>' +
        redirectNote +
        '<div class="card" style="margin-top: 1.5rem; text-align: left;">' +
        '<span class="badge badge--gold"><span class="badge__dot" aria-hidden="true"></span>Technical details only - not an analysis</span>' +
        '<dl style="margin-top: 0.75rem; font-size: 0.8125rem; color: var(--color-ink-soft); display: grid; grid-template-columns: auto 1fr; gap: 0.35rem 0.75rem;">' +
        '<dt>HTTP status</dt><dd>' + escapeHtml(fetchData.status_code) + '</dd>' +
        '<dt>Content type</dt><dd>' + escapeHtml(fetchData.content_type || 'Not reported') + '</dd>' +
        '<dt>Response time</dt><dd>' + escapeHtml(fetchData.duration_ms) + ' ms</dd>' +
        '</dl>' +
        '<p style="margin-top: 0.75rem; font-size: 0.8125rem; color: var(--color-ink-soft);">' + escapeHtml(message) + '</p>' +
        '</div>' +
        actionButtons(normalizedUrl);
    }

    function renderFetchFailure(normalizedUrl, fetchData) {
      statusEl.innerHTML =
        '<span class="badge badge--critical"><span class="badge__dot" aria-hidden="true"></span>Couldn&rsquo;t connect</span>';
      resultEl.innerHTML =
        '<h2 style="color: var(--color-critical); font-size: 1.25rem; font-weight: 600; margin: 0;">' +
        'We couldn&rsquo;t reach your website</h2>' +
        '<p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--color-ink-soft);">' +
        'Your address' + (normalizedUrl ? ' (<strong>' + escapeHtml(normalizedUrl) + '</strong>)' : '') +
        ' passed our safety checks, but we weren&rsquo;t able to connect to it.</p>' +
        '<p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--color-ink-soft);">' +
        escapeHtml(fetchData.message || 'Please try again in a moment.') + '</p>' +
        actionButtons(null);
    }

    function renderError(title, message, badgeText) {
      statusEl.innerHTML =
        '<span class="badge badge--critical"><span class="badge__dot" aria-hidden="true"></span>' + badgeText + '</span>';
      resultEl.innerHTML =
        '<h2 style="color: var(--color-critical); font-size: 1.25rem; font-weight: 600; margin: 0;">' +
        title + '</h2>' +
        '<p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--color-ink-soft);">' +
        message + '</p>' + actionButtons(null);
    }

    fetch('/api/analyze.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url }),
    })
      .then(function (res) {
        return res.json().then(function (body) { return { status: res.status, body: body }; });
      })
      .then(function (result) {
        var body = result.body || {};

        if (result.status === 200 && body.fetch && body.fetch.success) {
          renderFetchSuccess(body.fetch, body.normalized_url || url, body.message || '');
          return;
        }

        // fetch.success === false covers both: (a) HttpFetcher itself
        // couldn't reach the target (502) and (b) the rare case where
        // HttpFetcher's own re-check disagrees with SsrfGuard's earlier
        // pre-check (400) - see api/analyze.php. Both are "validated, but
        // not reachable," not "rejected," so both render the same way.
        if (body.fetch && body.fetch.success === false) {
          renderFetchFailure(body.normalized_url || null, body.fetch);
          return;
        }

        var message = (body.error && body.error.message) ||
          'Something went wrong. Please try again.';

        if (result.status === 400) {
          renderError('This address can&rsquo;t be analyzed', message, 'Blocked');
        } else {
          renderError('Analysis failed', message, 'Failed');
        }
      })
      .catch(function () {
        renderError(
          'Analysis failed',
          "We couldn't reach the Sitewell server. Please try again in a moment.",
          'Failed'
        );
      });
  })();
</script>
<?php endif; ?>
