<?php
require_once __DIR__ . '/includes/report-data.php';

$url = trim($_GET['url'] ?? '');
$section = $_GET['section'] ?? 'overview';

$page_title = 'Report' . ($url !== '' ? " for $url" : '') . ' — Sitewell';
require __DIR__ . '/includes/header.php';
?>
  <main class="main" style="max-width: 64rem;">
    <?php if ($url === ''): ?>
      <div class="empty-state u-text-center">
        <p class="empty-state__title">No report available</p>
        <p class="empty-state__desc">We don&rsquo;t have a scan for this website yet.</p>
        <div class="empty-state__action">
          <a href="/" class="btn btn--primary">Analyze this website</a>
        </div>
      </div>
    <?php else:
      $scan_href = '/scan.php?url=' . urlencode($url);
      $nav_items = array_merge(
          [['id' => 'overview', 'label' => 'Overview'], ['id' => 'problems', 'label' => 'Problems']],
          array_map(fn($c) => ['id' => $c['id'], 'label' => $c['title']], REPORT_CATEGORIES),
          [['id' => 'action-plan', 'label' => 'Action Plan']]
      );
    ?>
      <div class="report-header">
        <div>
          <a href="/" class="report-header__back">&larr; Back to Home</a>
          <h1 class="report-header__url"><?= htmlspecialchars($url) ?></h1>
          <p class="report-header__status"><strong>Not scanned yet</strong></p>
        </div>
        <div>
          <a href="<?= htmlspecialchars($scan_href) ?>" class="btn btn--secondary">Re-scan</a>
        </div>
      </div>

      <div class="report-layout u-mt-1">
        <nav class="report-nav" aria-label="Report sections">
          <div class="u-hidden-desktop">
            <label for="report-nav-select" class="field-label">Jump to report section</label>
            <select id="report-nav-select" class="select-input" onchange="location.href = this.value">
              <?php foreach ($nav_items as $item):
                $href = '/report.php?url=' . urlencode($url) . '&section=' . urlencode($item['id']); ?>
                <option value="<?= htmlspecialchars($href) ?>" <?= $item['id'] === $section ? 'selected' : '' ?>>
                  <?= htmlspecialchars($item['label']) ?>
                </option>
              <?php endforeach; ?>
            </select>
          </div>
          <ul class="report-nav__list u-hidden-mobile">
            <?php foreach ($nav_items as $item):
              $href = '/report.php?url=' . urlencode($url) . '&section=' . urlencode($item['id']);
              $active = $item['id'] === $section; ?>
              <li>
                <a href="<?= htmlspecialchars($href) ?>" class="report-nav__link<?= $active ? ' is-active' : '' ?>" <?= $active ? 'aria-current="page"' : '' ?>>
                  <?= htmlspecialchars($item['label']) ?>
                </a>
              </li>
            <?php endforeach; ?>
          </ul>
        </nav>

        <div class="report-content">
          <?php if ($section === 'overview'): ?>
            <div style="display:flex; flex-direction:column; gap:1.5rem;">
              <!-- Health summary: never a fake score - see lib/report-types.ts HealthSummary. -->
              <div class="card">
                <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.5rem;">
                  <h2 style="margin:0; font-size:1.125rem; font-weight:600;">Overall SEO health</h2>
                  <span class="badge badge--muted"><span class="badge__dot" aria-hidden="true"></span>Unavailable</span>
                </div>
                <div class="health-top">
                  <div class="health-score">
                    <span class="health-score__value" aria-hidden="true">&mdash;</span>
                    <span class="health-score__label">Score will appear after analysis</span>
                  </div>
                  <div class="health-stats">
                    <div class="health-stat"><span class="health-stat__value">&mdash;</span><span class="health-stat__label">Critical issues</span></div>
                    <div class="health-stat"><span class="health-stat__value">&mdash;</span><span class="health-stat__label">Important issues</span></div>
                    <div class="health-stat"><span class="health-stat__value">&mdash;</span><span class="health-stat__label">Improvements</span></div>
                  </div>
                </div>
                <p style="margin-top:1rem; font-size:0.875rem; color:var(--color-muted);">
                  Analysis data will appear here after a real scan. This score will never be a guess or a
                  placeholder number &mdash; it&rsquo;s calculated only from checks that have actually run.
                </p>
              </div>

              <?php require __DIR__ . '/includes/priority-summary.php'; ?>

              <section aria-labelledby="browse-category-heading">
                <div style="display:flex; flex-wrap:wrap; align-items:start; justify-content:space-between; gap:0.5rem;">
                  <div>
                    <h2 id="browse-category-heading" style="margin:0; font-size:1.25rem; font-weight:600;">Browse by category</h2>
                    <p style="margin:0.15rem 0 0; font-size:0.875rem; color:var(--color-muted);">Each area of your site&rsquo;s SEO, checked separately.</p>
                  </div>
                </div>
                <div class="category-grid u-mt-1">
                  <?php foreach (REPORT_CATEGORIES as $category):
                    $href = '/report.php?url=' . urlencode($url) . '&section=' . urlencode($category['id']); ?>
                    <div class="card category-card">
                      <div class="category-card__top">
                        <h3 class="category-card__title"><?= htmlspecialchars($category['title']) ?></h3>
                        <span class="badge badge--muted"><span class="badge__dot" aria-hidden="true"></span>Unavailable</span>
                      </div>
                      <p class="category-card__desc"><?= htmlspecialchars($category['description']) ?></p>
                      <p class="category-card__count">Not analyzed yet</p>
                      <div><a href="<?= htmlspecialchars($href) ?>" class="btn btn--secondary btn--sm">View details</a></div>
                    </div>
                  <?php endforeach; ?>
                </div>
              </section>
            </div>

          <?php elseif ($section === 'problems'): ?>
            <section aria-labelledby="problems-heading">
              <h2 id="problems-heading" style="margin:0; font-size:1.25rem; font-weight:600;">Problems</h2>
              <p style="margin:0.15rem 0 0; font-size:0.875rem; color:var(--color-muted);">Every issue we find will be listed here, most important first.</p>

              <div style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                <div style="max-width:20rem;">
                  <label for="issue-search" class="field-label">Search issues</label>
                  <input id="issue-search" type="search" class="text-input" placeholder="e.g. meta description">
                </div>

                <div role="group" aria-label="Filter issues by severity" class="filter-pills">
                  <button type="button" class="filter-pill is-active">All</button>
                  <?php foreach (SEVERITY_ORDER as $sev): ?>
                    <button type="button" class="filter-pill"><?= htmlspecialchars(SEVERITY_META[$sev]['label']) ?></button>
                  <?php endforeach; ?>
                </div>

                <div class="filters-row">
                  <label>Category
                    <select class="select-input">
                      <option>All categories</option>
                      <?php foreach (REPORT_CATEGORIES as $c): ?>
                        <option><?= htmlspecialchars($c['title']) ?></option>
                      <?php endforeach; ?>
                    </select>
                  </label>
                  <label>Sort by
                    <select class="select-input">
                      <option>Highest priority</option>
                      <option>Most affected pages</option>
                      <option>Category</option>
                      <option>Recently detected</option>
                    </select>
                  </label>
                </div>

                <div class="card">
                  <p class="empty-state__title">Real scan data is not available yet</p>
                  <p class="empty-state__desc">This section will show real results once the analysis engine that checks it has been built.</p>
                </div>
              </div>
            </section>

          <?php elseif ($section === 'action-plan'): ?>
            <section aria-labelledby="action-plan-heading">
              <h2 id="action-plan-heading" style="margin:0; font-size:1.25rem; font-weight:600;">Action plan</h2>
              <p style="margin:0.15rem 0 0; font-size:0.875rem; color:var(--color-muted);">A prioritized, step-by-step to-do list built from your results.</p>
              <div class="u-mt-1">
                <?php require __DIR__ . '/includes/priority-summary.php'; ?>
              </div>
            </section>

          <?php elseif ($category = report_category_by_id($section)): ?>
            <section aria-labelledby="category-section-heading">
              <div style="display:flex; flex-wrap:wrap; align-items:start; justify-content:space-between; gap:0.5rem;">
                <div>
                  <h2 id="category-section-heading" style="margin:0; font-size:1.25rem; font-weight:600;"><?= htmlspecialchars($category['title']) ?></h2>
                  <p style="margin:0.15rem 0 0; font-size:0.875rem; color:var(--color-muted);"><?= htmlspecialchars($category['description']) ?></p>
                </div>
                <span class="badge badge--muted"><span class="badge__dot" aria-hidden="true"></span>Unavailable</span>
              </div>
              <div class="card u-mt-1">
                <p class="empty-state__title">Real scan data is not available yet</p>
                <p class="empty-state__desc">This section will show real results once the analysis engine that checks it has been built.</p>
                <div class="empty-state__action">
                  <a href="<?= htmlspecialchars($scan_href) ?>" class="btn btn--secondary btn--sm">Analyze this website</a>
                </div>
              </div>
            </section>

          <?php else: ?>
            <div class="empty-state">
              <p class="empty-state__title">Section not found</p>
              <p class="empty-state__desc">That report section doesn&rsquo;t exist.</p>
            </div>
          <?php endif; ?>
        </div>
      </div>
    <?php endif; ?>
  </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
