<?php
require_once __DIR__ . '/includes/url-validation.php';

$error = null;
$value = '';

// Same behavior as the React URLInputForm: light format check only,
// then redirect to /scan.php?url=... which owns the real scan flow.
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $value = trim($_POST['website-url'] ?? '');

    if ($value === '') {
        $error = 'Please enter a website address, such as example.com or https://example.com.';
    } elseif (!looks_like_website_address($value)) {
        $error = 'Please enter a complete website address, such as https://example.com';
    } else {
        header('Location: /scan.php?url=' . urlencode($value));
        exit;
    }
}

$page_title = 'Sitewell — Know what\'s holding your website back';
require __DIR__ . '/includes/header.php';
?>
  <main class="main">
    <div class="hero">
      <p class="hero__eyebrow">For website owners with zero SEO experience</p>
      <h1 class="hero__title">Know what&rsquo;s holding your website back.</h1>
      <p class="hero__subtitle">
        Enter your website address and we&rsquo;ll check it for problems, explain them in
        plain language, and tell you exactly what to do next.
      </p>
    </div>

    <div class="url-form-wrap">
      <div class="card">
        <label for="website-url" class="url-form-wrap__label">Website address</label>
        <form method="post" class="url-form" novalidate>
          <div class="url-form__field">
            <input
              id="website-url"
              name="website-url"
              type="text"
              inputmode="url"
              autocomplete="off"
              placeholder="e.g. example.com"
              value="<?= htmlspecialchars($value) ?>"
              aria-describedby="url-help"
              <?= $error ? 'aria-invalid="true"' : '' ?>
            >
            <button type="button" class="url-form__clear" aria-label="Clear website address" onclick="document.getElementById('website-url').value=''; this.classList.remove('is-visible'); document.getElementById('website-url').focus();">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
          <button type="submit" class="btn btn--primary">Analyze Website</button>
        </form>
      </div>

      <p id="url-help" class="url-form__help">
        You don&rsquo;t need to type &ldquo;https://&rdquo; &mdash; we&rsquo;ll use a secure
        connection automatically. We&rsquo;ll check things like your page titles, site speed,
        and mobile-friendliness.
      </p>

      <?php if ($error): ?>
        <div class="u-mt-1" role="alert">
          <p class="error-state"><?= htmlspecialchars($error) ?></p>
        </div>
      <?php endif; ?>

      <p class="url-form__caption">
        Click <strong>Analyze Website</strong> and we&rsquo;ll scan your site, then walk you
        through the results &mdash; no signup required.
      </p>
    </div>

    <div class="section-block">
      <section aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" class="section-heading">How it works</h2>
        <ol class="steps-grid">
          <li class="steps-grid__item">
            <span class="steps-grid__num" aria-hidden="true">1</span>
            <div>
              <p class="steps-grid__title">Enter your website</p>
              <p class="steps-grid__desc">Paste your website address and click Analyze Website.</p>
            </div>
          </li>
          <li class="steps-grid__item">
            <span class="steps-grid__num" aria-hidden="true">2</span>
            <div>
              <p class="steps-grid__title">We check available website data</p>
              <p class="steps-grid__desc">We look at your site&rsquo;s public pages, and connected accounts if you have them.</p>
            </div>
          </li>
          <li class="steps-grid__item">
            <span class="steps-grid__num" aria-hidden="true">3</span>
            <div>
              <p class="steps-grid__title">We explain the problems</p>
              <p class="steps-grid__desc">Every issue is explained in plain language, not technical jargon.</p>
            </div>
          </li>
          <li class="steps-grid__item">
            <span class="steps-grid__num" aria-hidden="true">4</span>
            <div>
              <p class="steps-grid__title">We guide you through the fixes</p>
              <p class="steps-grid__desc">You get exact, step-by-step instructions for what to do next.</p>
            </div>
          </li>
        </ol>
        <p class="footnote">
          Some information may be estimated or unavailable &mdash; we&rsquo;ll always tell you
          which is which, never guess silently.
        </p>
      </section>

      <details class="disclosure">
        <summary>
          New to this? What is SEO?
          <span class="disclosure__chevron" aria-hidden="true">&rsaquo;</span>
        </summary>
        <div class="disclosure__body">
          <p>
            SEO stands for <strong>Search Engine Optimization</strong> &mdash; the practice of
            making small improvements to your website so that search engines like Google can
            understand it better and show it to more of the people searching for things related
            to your business.
          </p>
          <p>
            You don&rsquo;t need to be technical to improve it. That&rsquo;s what this tool is
            for &mdash; finding the problems and explaining, in plain language, exactly what to
            do about them.
          </p>
        </div>
      </details>

      <section aria-labelledby="trust-heading" class="trust">
        <h2 id="trust-heading" class="trust__heading">Good to know before you start</h2>
        <ul class="trust__list">
          <li><span class="trust__dot" aria-hidden="true"></span>We only check information that&rsquo;s publicly available on your website.</li>
          <li><span class="trust__dot" aria-hidden="true"></span>Some data, like real visitor traffic, needs you to connect your own account (such as Google Analytics) &mdash; we can&rsquo;t see it otherwise.</li>
          <li><span class="trust__dot" aria-hidden="true"></span>Traffic and advertising history aren&rsquo;t always available for every site.</li>
          <li><span class="trust__dot" aria-hidden="true"></span>Anything we estimate instead of verify is always clearly labeled as an estimate.</li>
          <li><span class="trust__dot" aria-hidden="true"></span>We never guarantee where you&rsquo;ll rank on Google &mdash; no honest tool can.</li>
        </ul>
      </section>
    </div>
  </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
<script>
  (function () {
    var input = document.getElementById('website-url');
    var clearBtn = document.querySelector('.url-form__clear');
    function sync() {
      clearBtn.classList.toggle('is-visible', input.value.length > 0);
    }
    input.addEventListener('input', sync);
    sync();
  })();
</script>
