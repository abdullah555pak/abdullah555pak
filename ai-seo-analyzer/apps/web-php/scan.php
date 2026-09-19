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
        This calls the real PHP backend at /api/analyze.php - the same
        SSRF-safe URL validation as apps/api/app/core/security.py, and
        the same honest 501 "not built yet" response - not a hardcoded
        message. See includes/url-security.php and api/analyze.php.
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

    function renderResult(title, message, tone, badgeText, badgeTone) {
      statusEl.innerHTML =
        '<span class="badge badge--' + badgeTone + '">' +
        '<span class="badge__dot" aria-hidden="true"></span>' + badgeText + '</span>';
      resultEl.innerHTML =
        '<h2 style="color: var(--color-' + tone + '); font-size: 1.25rem; font-weight: 600; margin: 0;">' +
        title + '</h2>' +
        '<p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--color-ink-soft);">' +
        message + '</p>' +
        '<div style="margin-top: 1.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.75rem;">' +
        '<a href="/" class="btn btn--secondary">Back to Home</a></div>';
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
        var message = (result.body && result.body.error && result.body.error.message) ||
          'Something went wrong. Please try again.';

        if (result.status === 501) {
          renderResult("This part of Sitewell isn't available yet", message, 'gold', 'Unavailable', 'gold');
        } else if (result.status === 400) {
          renderResult('This address can&rsquo;t be analyzed', message, 'critical', 'Blocked', 'critical');
        } else {
          renderResult('Analysis failed', message, 'critical', 'Failed', 'critical');
        }
      })
      .catch(function () {
        renderResult(
          'Analysis failed',
          "We couldn't reach the Sitewell server. Please try again in a moment.",
          'critical',
          'Failed',
          'critical'
        );
      });
  })();
</script>
<?php endif; ?>
