<?php
/**
 * PHP port of apps/web's app/report/issue/page.tsx. No real issue store
 * exists yet, so any id honestly resolves to "not found" - this mirrors
 * that logic in PHP rather than hardcoding a single branch.
 */
$url = trim($_GET['url'] ?? '');
$issue_id = $_GET['id'] ?? '';

$page_title = 'Issue — Sitewell';
require __DIR__ . '/includes/header.php';

$report_href = '/report.php?url=' . urlencode($url) . '&section=problems';
$scan_href = '/scan.php?url=' . urlencode($url);
?>
  <main class="main">
    <?php if ($url === ''): ?>
      <div class="empty-state u-text-center">
        <p class="empty-state__title">Scan required</p>
        <p class="empty-state__desc">Analyze a website first to see details about a specific issue.</p>
        <div class="empty-state__action">
          <a href="/" class="btn btn--primary">Analyze a website</a>
        </div>
      </div>

    <?php elseif ($issue_id === ''): ?>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/report.php">Report</a>
        <span class="breadcrumb__sep" aria-hidden="true">/</span>
        <a href="<?= htmlspecialchars($report_href) ?>">Problems</a>
        <span class="breadcrumb__sep" aria-hidden="true">/</span>
        <span class="breadcrumb__current">Issue</span>
      </nav>
      <div class="empty-state u-text-center">
        <p class="empty-state__title">Report unavailable</p>
        <p class="empty-state__desc">We don&rsquo;t have a report to show issue details from yet.</p>
        <div class="empty-state__action">
          <a href="<?= htmlspecialchars($scan_href) ?>" class="btn btn--primary">Analyze this website</a>
        </div>
      </div>

    <?php else:
      // No real issue store exists yet - every id honestly resolves to
      // nothing, same as findIssueById() in the Next.js version.
      $issue = null;
    ?>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/report.php">Report</a>
        <span class="breadcrumb__sep" aria-hidden="true">/</span>
        <a href="<?= htmlspecialchars($report_href) ?>">Problems</a>
        <span class="breadcrumb__sep" aria-hidden="true">/</span>
        <span class="breadcrumb__current">Issue</span>
      </nav>
      <div class="empty-state u-text-center">
        <p class="empty-state__title">Issue not found</p>
        <p class="empty-state__desc">
          We couldn&rsquo;t find this issue. It may have already been resolved, or the link may be
          out of date.
        </p>
        <div class="empty-state__action">
          <a href="<?= htmlspecialchars($report_href) ?>" class="btn btn--primary">Back to problems</a>
        </div>
      </div>
    <?php endif; ?>
  </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
