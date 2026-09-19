<?php
/**
 * Router for a `php -S 127.0.0.1:<port> tests/support/fixture-router.php`
 * test server used only by tests/run-http-fetcher-tests.php. Serves a
 * fixed set of canned, deterministic responses so HttpFetcher's real
 * curl/timeout/retry/redirect/size-cap logic can be exercised against a
 * real local HTTP server instead of relying on real internet websites
 * (which are slow, non-deterministic, and can change at any time).
 *
 * Never used by the application itself - only by the test runner, which
 * starts and stops this server around the test run.
 */

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$selfPort = $_SERVER['SERVER_PORT'];

function json_response(int $status, array $body): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($body);
}

function counter_increment(string $file): int
{
    $count = 0;
    if (is_file($file)) {
        $count = (int) file_get_contents($file);
    }
    $count++;
    file_put_contents($file, (string) $count);
    return $count;
}

switch (true) {
    case $path === '/ok':
        http_response_code(200);
        header('Content-Type: text/html; charset=utf-8');
        echo '<html><head><title>Fixture OK</title></head><body>ok</body></html>';
        break;

    case $path === '/not-found':
        http_response_code(404);
        header('Content-Type: text/html');
        echo '<html><body>not found</body></html>';
        break;

    case $path === '/forbidden':
        http_response_code(403);
        header('Content-Type: text/html');
        echo '<html><body>forbidden</body></html>';
        break;

    case $path === '/server-error':
        http_response_code(500);
        header('Content-Type: text/html');
        echo '<html><body>server error</body></html>';
        break;

    case $path === '/service-unavailable':
        http_response_code(503);
        header('Content-Type: text/html');
        echo '<html><body>unavailable</body></html>';
        break;

    case $path === '/redirect-once':
        http_response_code(302);
        header('Location: http://127.0.0.1:' . $selfPort . '/ok');
        break;

    case $path === '/redirect-loop-a':
        http_response_code(302);
        header('Location: http://127.0.0.1:' . $selfPort . '/redirect-loop-b');
        break;

    case $path === '/redirect-loop-b':
        http_response_code(302);
        header('Location: http://127.0.0.1:' . $selfPort . '/redirect-loop-a');
        break;

    case (bool) preg_match('#^/chain/(\d+)$#', $path, $m):
        $n = (int) $m[1];
        http_response_code(302);
        header('Location: http://127.0.0.1:' . $selfPort . '/chain/' . ($n + 1));
        break;

    case $path === '/redirect-to-unsafe':
        // Not a real private IP - the test's AllowlistUrlSafetyChecker
        // simply doesn't recognize this host:port, which is enough to
        // prove HttpFetcher refuses to follow a redirect its safety
        // checker didn't approve. See tests/AllowlistUrlSafetyChecker.php.
        http_response_code(302);
        header('Location: http://127.0.0.1:1/blocked');
        break;

    case $path === '/slow':
        // php -S is single-threaded: even after the client gives up and
        // disconnects, this sleep keeps running server-side and blocks
        // every other request behind it. Kept short (not the 3s an earlier
        // version used) so the test runner's fixed recovery pause after
        // the timeout test (see run-http-fetcher-tests.php) stays small.
        usleep(1_500_000); // 1.5s - longer than the timeout test's client-side timeout
        http_response_code(200);
        header('Content-Type: text/html');
        echo 'slow response body';
        break;

    case $path === '/large':
        http_response_code(200);
        header('Content-Type: text/html');
        // 200KB - tests configure a much smaller HTTP_MAX_RESPONSE_BYTES so
        // this reliably triggers the size-cap abort regardless of any
        // future change to the production default.
        echo str_repeat('x', 200 * 1024);
        break;

    case $path === '/json':
        json_response(200, ['ok' => true, 'fixture' => 'json']);
        break;

    case $path === '/plain':
        http_response_code(200);
        header('Content-Type: text/plain');
        echo 'plain text body';
        break;

    case $path === '/image':
        http_response_code(200);
        header('Content-Type: image/png');
        // Minimal valid 1x1 PNG byte sequence - real binary, not text.
        echo base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
        break;

    case $path === '/gzip-html':
        http_response_code(200);
        header('Content-Type: text/html');
        header('Content-Encoding: gzip');
        echo gzencode('<html><body>compressed</body></html>', 6);
        break;

    case (bool) preg_match('#^/flaky-503$#', $path):
        $counterFile = $_GET['counterfile'] ?? (sys_get_temp_dir() . '/sitewell-flaky-503-default');
        $attempt = counter_increment($counterFile);
        if ($attempt < 3) {
            http_response_code(503);
            header('Content-Type: text/html');
            echo 'temporarily unavailable';
        } else {
            http_response_code(200);
            header('Content-Type: text/html');
            echo 'recovered after retries';
        }
        break;

    case (bool) preg_match('#^/rate-limited$#', $path):
        http_response_code(429);
        header('Retry-After: 0');
        header('Content-Type: text/html');
        echo 'slow down';
        break;

    default:
        http_response_code(404);
        header('Content-Type: text/plain');
        echo 'no such fixture route: ' . $path;
        break;
}
