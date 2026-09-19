<?php
/**
 * Category 03 Step 03 automated test suite for HttpFetcher. Dependency-free,
 * matching tests/run-url-validation-tests.php. Run with:
 *
 *   php tests/run-http-fetcher-tests.php
 *
 * Most tests run against a real local `php -S` fixture server
 * (tests/support/fixture-router.php) rather than mocking curl - this
 * exercises HttpFetcher's actual timeout/retry/redirect/size-cap/
 * content-type logic over a real HTTP connection, deterministically, per
 * the task's "use mocked/local test servers where practical" instruction.
 *
 * The fixture server's loopback address would be rejected by the real
 * production security check (correctly - loopback is exactly what SSRF
 * protection exists to block), so these tests use AllowlistUrlSafetyChecker,
 * a test-only stand-in for "is this URL safe to fetch" that approves only
 * the fixture server itself. It does not re-implement or weaken any real
 * SSRF logic - that logic (private IP ranges, localhost, DNS rebinding,
 * etc.) is exhaustively covered separately by
 * tests/run-url-validation-tests.php against the real validate_public_url().
 * A handful of tests below use the REAL DefaultUrlSafetyChecker instead,
 * specifically to prove the real production wiring also works end-to-end.
 *
 * DNS failure and TLS failure are not reproduced as live network
 * conditions here: this fetcher pins every connection to a pre-validated
 * IP (CURLOPT_RESOLVE), so DNS resolution happens only inside the safety
 * checker (already covered by Step 02's suite), not inside curl itself -
 * and reliably producing a bad-certificate TLS handshake needs a second
 * TLS-terminating server this suite doesn't stand up. Both are instead
 * covered as direct, deterministic unit tests of
 * HttpFetcher::classifyCurlError(), which is the one place that
 * classification logic lives.
 */

require_once __DIR__ . '/../src/Crawler/HttpFetcher.php';
require_once __DIR__ . '/../src/Crawler/HttpFetcherConfig.php';
require_once __DIR__ . '/../src/Crawler/RetryPolicy.php';
require_once __DIR__ . '/../src/Crawler/ContentTypeClassifier.php';
require_once __DIR__ . '/../src/Crawler/UrlSafetyCheckerInterface.php';
require_once __DIR__ . '/AllowlistUrlSafetyChecker.php';

$total = 0;
$failed = 0;

function check(string $label, bool $condition, string $detail = ''): void
{
    global $total, $failed;
    $total++;
    if ($condition) {
        echo "  PASS  {$label}\n";
    } else {
        $failed++;
        echo "  FAIL  {$label}" . ($detail !== '' ? " -- {$detail}" : '') . "\n";
    }
}

// ---------------------------------------------------------------------
// Fixture server lifecycle
// ---------------------------------------------------------------------

$port = 8139;
$base = "http://127.0.0.1:{$port}";
$routerPath = __DIR__ . '/support/fixture-router.php';
$serverCmd = sprintf(
    'php -S 127.0.0.1:%d %s > /tmp/sitewell-fixture-server.log 2>&1 & echo $!',
    $port,
    escapeshellarg($routerPath)
);
$serverPid = (int) trim(shell_exec($serverCmd));

function wait_for_server(string $base, int $timeoutMs = 3000): bool
{
    $deadline = microtime(true) + ($timeoutMs / 1000);
    while (microtime(true) < $deadline) {
        $ch = curl_init($base . '/ok');
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT_MS => 300]);
        curl_exec($ch);
        $ok = curl_errno($ch) === 0;
        curl_close($ch);
        if ($ok) {
            return true;
        }
        usleep(50_000);
    }
    return false;
}

if (!wait_for_server($base)) {
    fwrite(STDERR, "Fixture server did not start on {$base}\n");
    exit(1);
}

register_shutdown_function(function () use ($serverPid) {
    if ($serverPid > 0) {
        @posix_kill($serverPid, SIGTERM);
    }
});

// ---------------------------------------------------------------------
// Fetcher wired to the fixture server via the test-only allowlist checker
// ---------------------------------------------------------------------

$checker = (new AllowlistUrlSafetyChecker())->allow('127.0.0.1', $port);

function make_fetcher(AllowlistUrlSafetyChecker $checker, array $overrides = []): HttpFetcher
{
    $config = new HttpFetcherConfig(
        connectTimeoutSeconds: $overrides['connectTimeoutSeconds'] ?? 2.0,
        requestTimeoutSeconds: $overrides['requestTimeoutSeconds'] ?? 1.5,
        maxResponseBytes: $overrides['maxResponseBytes'] ?? 50 * 1024,
        maxRedirects: $overrides['maxRedirects'] ?? 5,
        maxRetries: $overrides['maxRetries'] ?? 2,
        retryBaseDelayMs: $overrides['retryBaseDelayMs'] ?? 50,
        maxRetryDelayMs: $overrides['maxRetryDelayMs'] ?? 200,
        maxTotalDurationSeconds: $overrides['maxTotalDurationSeconds'] ?? 20.0,
    );
    return new HttpFetcher($config, $checker);
}

$fetcher = make_fetcher($checker);

// ---------------------------------------------------------------------
echo "== HttpFetcher: successful responses (real local server) ==\n";
// ---------------------------------------------------------------------

$r = $fetcher->fetch("{$base}/ok");
check('200 response is success with correct status/content', $r->success && $r->statusCode === 200 && $r->contentCategory === ContentTypeClassifier::HTML, $r->success ? "status={$r->statusCode}" : $r->userFacingErrorMessage);
check('200 response body is captured', $r->success && str_contains((string) $r->body, 'ok'));
check('durationMs is recorded and positive', $r->durationMs >= 0);

$r = $fetcher->fetch("{$base}/not-found");
check('404 is a successful fetch carrying status 404, not a PHP error', $r->success && $r->statusCode === 404);

$r = $fetcher->fetch("{$base}/forbidden");
check('403 is a successful fetch carrying status 403', $r->success && $r->statusCode === 403);

$r = $fetcher->fetch("{$base}/server-error");
check('500 is a successful fetch carrying status 500', $r->success && $r->statusCode === 500);

// ---------------------------------------------------------------------
echo "\n== HttpFetcher: redirects ==\n";
// ---------------------------------------------------------------------

$r = $fetcher->fetch("{$base}/redirect-once");
check(
    'a single redirect is followed to the final page',
    $r->success && $r->statusCode === 200 && $r->redirectCount === 1 && $r->finalUrl === "{$base}/ok",
    $r->success ? "redirectCount={$r->redirectCount} finalUrl={$r->finalUrl}" : $r->userFacingErrorMessage
);
check('redirect history records the original URL', $r->success && $r->redirectHistory === ["{$base}/redirect-once"]);

$r = $fetcher->fetch("{$base}/chain/0");
check(
    'a chain longer than the redirect cap fails as too_many_redirects',
    !$r->success && $r->errorCode === FetchResult::ERROR_TOO_MANY_REDIRECTS,
    $r->success ? 'was accepted' : ($r->errorCode ?? '')
);

$r = $fetcher->fetch("{$base}/redirect-loop-a");
check(
    'a two-URL redirect loop is detected and blocked',
    !$r->success && $r->errorCode === FetchResult::ERROR_REDIRECT_LOOP,
    $r->success ? 'was accepted' : ($r->errorCode ?? '')
);

$r = $fetcher->fetch("{$base}/redirect-to-unsafe");
check(
    'a redirect to a target the safety checker does not approve is blocked, not followed',
    !$r->success && $r->errorCode === FetchResult::ERROR_UNSAFE_REDIRECT,
    $r->success ? 'was accepted' : ($r->errorCode ?? '')
);

// ---------------------------------------------------------------------
echo "\n== HttpFetcher: timeouts and size limits ==\n";
// ---------------------------------------------------------------------

$slowFetcher = make_fetcher($checker, ['requestTimeoutSeconds' => 0.5, 'maxRetries' => 0]);
$r = $slowFetcher->fetch("{$base}/slow");
check(
    'a response slower than the configured timeout fails as timeout',
    !$r->success && $r->errorCode === FetchResult::ERROR_TIMEOUT,
    $r->success ? 'was accepted' : ($r->errorCode ?? '')
);
// php -S is single-threaded: the /slow handler above keeps sleeping
// server-side for its own full duration even though the client already
// gave up. Without waiting it out here, the very next request would queue
// behind it and could spuriously time out itself.
usleep(1_300_000);

$r = $fetcher->fetch("{$base}/large");
check(
    'a response larger than the configured byte limit fails as too_large',
    !$r->success && $r->errorCode === FetchResult::ERROR_TOO_LARGE,
    $r->success ? 'was accepted' : ($r->errorCode ?? '')
);

// ---------------------------------------------------------------------
echo "\n== HttpFetcher: content types ==\n";
// ---------------------------------------------------------------------

$r = $fetcher->fetch("{$base}/json");
check('JSON response is fetched successfully and classified as json', $r->success && $r->contentCategory === ContentTypeClassifier::JSON);

$r = $fetcher->fetch("{$base}/plain");
check('plain text response is classified as text', $r->success && $r->contentCategory === ContentTypeClassifier::TEXT);

$r = $fetcher->fetch("{$base}/image");
check(
    'binary image response is fetched successfully (not parsed as HTML) and classified as image',
    $r->success && $r->contentCategory === ContentTypeClassifier::IMAGE,
    $r->success ? "category={$r->contentCategory}" : $r->userFacingErrorMessage
);

$r = $fetcher->fetch("{$base}/gzip-html");
check(
    'a gzip-compressed response is transparently decompressed',
    $r->success && str_contains((string) $r->body, 'compressed'),
    $r->success ? substr((string) $r->body, 0, 40) : $r->userFacingErrorMessage
);

// ---------------------------------------------------------------------
echo "\n== HttpFetcher: retry behavior ==\n";
// ---------------------------------------------------------------------

$counterFile = sys_get_temp_dir() . '/sitewell-flaky-503-' . uniqid();
@unlink($counterFile);
$r = $fetcher->fetch("{$base}/flaky-503?counterfile=" . urlencode($counterFile));
check(
    '503 that recovers within the retry budget eventually succeeds',
    $r->success && $r->statusCode === 200 && $r->retryCount === 2,
    $r->success ? "statusCode={$r->statusCode} retryCount={$r->retryCount}" : $r->userFacingErrorMessage
);
@unlink($counterFile);

$r = $fetcher->fetch("{$base}/service-unavailable");
check(
    '503 that never recovers exhausts retries and returns the final status, not a thrown error',
    $r->success && $r->statusCode === 503 && $r->retryCount === 2,
    $r->success ? "statusCode={$r->statusCode} retryCount={$r->retryCount}" : $r->userFacingErrorMessage
);

$r = $fetcher->fetch("{$base}/rate-limited");
check(
    '429 is retried up to the retry limit and the final 429 is returned',
    $r->success && $r->statusCode === 429 && $r->retryCount === 2,
    $r->success ? "statusCode={$r->statusCode} retryCount={$r->retryCount}" : $r->userFacingErrorMessage
);

$noRetryFetcher = make_fetcher($checker, ['maxRetries' => 0]);
$r = $noRetryFetcher->fetch("{$base}/not-found");
check('404 is never retried even when retries are otherwise allowed', $r->success && $r->statusCode === 404 && $r->retryCount === 0);

// ---------------------------------------------------------------------
echo "\n== RetryPolicy (pure, offline) ==\n";
// ---------------------------------------------------------------------

$policy = new RetryPolicy(maxRetries: 2, baseDelayMs: 100, maxDelayMs: 5000);
check('429/502/503/504 are retryable statuses', $policy->isRetryableStatus(429) && $policy->isRetryableStatus(502) && $policy->isRetryableStatus(503) && $policy->isRetryableStatus(504));
check('404 and 200 are not retryable statuses', !$policy->isRetryableStatus(404) && !$policy->isRetryableStatus(200));
check('connection_reset and network_error are retryable error codes', $policy->isRetryableErrorCode('connection_reset') && $policy->isRetryableErrorCode('network_error'));
check('dns, ssl and too_large are never retryable error codes', !$policy->isRetryableErrorCode('dns') && !$policy->isRetryableErrorCode('ssl') && !$policy->isRetryableErrorCode('too_large'));
check('exponential backoff doubles per attempt', $policy->delayMsFor(1, null) === 100 && $policy->delayMsFor(2, null) === 200 && $policy->delayMsFor(3, null) === 400);
check('Retry-After (seconds) is honored for 429', $policy->delayMsFor(1, 429, ['retry-after' => '2']) === 2000);
check('Retry-After is capped at the configured maximum delay', (new RetryPolicy(2, 100, 1000))->delayMsFor(1, 429, ['retry-after' => '999']) === 1000);
check(
    'hasRetriesLeft respects the configured max (maxRetries=2 allows attempts 1 and 2 to retry, not 3)',
    $policy->hasRetriesLeft(1) && $policy->hasRetriesLeft(2) && !$policy->hasRetriesLeft(3)
);

// ---------------------------------------------------------------------
echo "\n== ContentTypeClassifier (pure, offline) ==\n";
// ---------------------------------------------------------------------

check('text/html -> html', ContentTypeClassifier::classify('text/html; charset=utf-8') === ContentTypeClassifier::HTML);
check('application/xhtml+xml -> xhtml', ContentTypeClassifier::classify('application/xhtml+xml') === ContentTypeClassifier::XHTML);
check('application/json -> json', ContentTypeClassifier::classify('application/json') === ContentTypeClassifier::JSON);
check('application/ld+json -> json (structured-data +json suffix)', ContentTypeClassifier::classify('application/ld+json') === ContentTypeClassifier::JSON);
check('text/plain -> text', ContentTypeClassifier::classify('text/plain') === ContentTypeClassifier::TEXT);
check('image/png -> image', ContentTypeClassifier::classify('image/png') === ContentTypeClassifier::IMAGE);
check('application/pdf -> binary', ContentTypeClassifier::classify('application/pdf') === ContentTypeClassifier::BINARY);
check('application/x-made-up -> other', ContentTypeClassifier::classify('application/x-made-up') === ContentTypeClassifier::OTHER);
check('missing content-type -> unknown', ContentTypeClassifier::classify(null) === ContentTypeClassifier::UNKNOWN);
check('isHtmlLike is true only for html/xhtml', ContentTypeClassifier::isHtmlLike(ContentTypeClassifier::HTML) && ContentTypeClassifier::isHtmlLike(ContentTypeClassifier::XHTML) && !ContentTypeClassifier::isHtmlLike(ContentTypeClassifier::JSON));

// ---------------------------------------------------------------------
echo "\n== HttpFetcher::classifyCurlError (pure, offline - stands in for DNS/TLS failure tests) ==\n";
// ---------------------------------------------------------------------

check('CURLE_COULDNT_RESOLVE_HOST -> dns', HttpFetcher::classifyCurlError(CURLE_COULDNT_RESOLVE_HOST, 'x')['errorCode'] === FetchResult::ERROR_DNS);
check('CURLE_OPERATION_TIMEDOUT -> timeout', HttpFetcher::classifyCurlError(CURLE_OPERATION_TIMEDOUT, 'x')['errorCode'] === FetchResult::ERROR_TIMEOUT);
check('CURLE_SSL_CACERT -> ssl', HttpFetcher::classifyCurlError(CURLE_SSL_CACERT, 'x')['errorCode'] === FetchResult::ERROR_SSL);
check('CURLE_SSL_CONNECT_ERROR -> ssl', HttpFetcher::classifyCurlError(CURLE_SSL_CONNECT_ERROR, 'x')['errorCode'] === FetchResult::ERROR_SSL);
check('CURLE_RECV_ERROR -> connection_reset', HttpFetcher::classifyCurlError(CURLE_RECV_ERROR, 'x')['errorCode'] === FetchResult::ERROR_CONNECTION_RESET);
check('CURLE_COULDNT_CONNECT -> connection_reset', HttpFetcher::classifyCurlError(CURLE_COULDNT_CONNECT, 'x')['errorCode'] === FetchResult::ERROR_CONNECTION_RESET);
check('an unrecognized curl errno falls back to network_error', HttpFetcher::classifyCurlError(9999, 'x')['errorCode'] === FetchResult::ERROR_NETWORK);
check('classifyCurlError never leaks the raw curl message into the user-facing message', !str_contains(HttpFetcher::classifyCurlError(CURLE_SSL_CACERT, 'super technical detail xyz')['message'], 'xyz'));

// ---------------------------------------------------------------------
echo "\n== Security regression guard (source inspection, offline) ==\n";
// ---------------------------------------------------------------------

$source = file_get_contents(__DIR__ . '/../src/Crawler/HttpFetcher.php');
check('TLS verification is never set to false anywhere in HttpFetcher.php', !preg_match('/CURLOPT_SSL_VERIFYPEER\s*=>\s*false/i', $source));
check('CURLOPT_FOLLOWLOCATION is always false (redirects are hand-validated)', (bool) preg_match('/CURLOPT_FOLLOWLOCATION\s*=>\s*false/', $source) && !preg_match('/CURLOPT_FOLLOWLOCATION\s*=>\s*true/', $source));
check('only http/https protocols are permitted', str_contains($source, 'CURLPROTO_HTTP | CURLPROTO_HTTPS'));

// ---------------------------------------------------------------------
echo "\n== [network] SSRF integration + real HTTPS site (real DefaultUrlSafetyChecker) ==\n";
// ---------------------------------------------------------------------

$realFetcher = new HttpFetcher(new HttpFetcherConfig(maxRetries: 0));
$r = $realFetcher->fetch('http://127.0.0.1/');
check(
    '[network] a loopback URL is blocked by the real safety checker before any request is made',
    !$r->success && $r->errorCode === FetchResult::ERROR_SSRF_BLOCKED,
    $r->success ? 'was accepted' : ($r->errorCode ?? '')
);

$r = $realFetcher->fetch('https://example.com');
check(
    '[network] a real public HTTPS site is fetched successfully end-to-end',
    $r->success && $r->statusCode === 200 && $r->contentCategory === ContentTypeClassifier::HTML,
    $r->success ? "status={$r->statusCode}" : $r->userFacingErrorMessage
);

// ---------------------------------------------------------------------
echo "\n{$total} tests, " . ($total - $failed) . " passed, {$failed} failed.\n";
exit($failed > 0 ? 1 : 0);
