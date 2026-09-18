<?php
/**
 * Shared page shell. Every page includes this, then header.php, then
 * its own content, then footer.php - same layout as the Next.js
 * version's <Header>/<main>/<Footer> structure.
 *
 * @var string $page_title Set by the including page before requiring this file.
 */
$page_title = $page_title ?? 'Sitewell';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= htmlspecialchars($page_title) ?></title>
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
<div class="page">
  <header class="site-header">
    <div class="site-header__inner">
      <a href="/" class="brand">
        <span class="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M11 4a7 7 0 1 0 4.9 12l4.05 4.05a1 1 0 0 0 1.4-1.4L17.3 14.6A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" fill="currentColor"/></svg>
        </span>
        Sitewell
      </a>
    </div>
  </header>
