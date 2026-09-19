<?php
/**
 * Category 03 Step 02 automated test suite for URL validation + SSRF
 * protection. Dependency-free (no PHPUnit/Composer) to match the rest of
 * this project - run directly with:
 *
 *   php tests/run-url-validation-tests.php
 *
 * Covers: UrlNormalizer (pure), validate_public_url() (the real security
 * boundary, includes/url-security.php), and SsrfGuard's redirect-chain
 * walking (src/Crawler/SsrfGuard.php) via FakeRedirectProbe so redirect-
 * to-a-private-target scenarios never need a real unsafe network target.
 *
 * A handful of tests near the bottom (marked "[network]") depend on real
 * DNS resolution and outbound connectivity for example.com, a domain
 * IANA reserves specifically for this kind of documentation/testing use.
 * If this environment has no outbound network access those few tests -
 * and only those - will fail; everything else in this suite is fully
 * offline and deterministic.
 */

require_once __DIR__ . '/../includes/url-security.php';
require_once __DIR__ . '/../src/Crawler/UrlNormalizer.php';
require_once __DIR__ . '/../src/Crawler/ValidationResult.php';
require_once __DIR__ . '/../src/Crawler/SsrfGuard.php';
require_once __DIR__ . '/FakeRedirectProbe.php';

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

function expect_valid(string $label, string $url): void
{
    try {
        $resolvedIp = null;
        $result = validate_public_url($url, $resolvedIp);
        check($label, true, "normalized to: {$result}");
    } catch (UnsafeURLException $e) {
        check($label, false, "unexpectedly rejected: " . $e->getMessage());
    }
}

function expect_rejected(string $label, string $url, ?string $expectedSubstring = null): void
{
    try {
        validate_public_url($url);
        check($label, false, 'unexpectedly accepted');
    } catch (UnsafeURLException $e) {
        $ok = $expectedSubstring === null || str_contains($e->getMessage(), $expectedSubstring);
        check($label, $ok, $ok ? '' : "message was: " . $e->getMessage());
    }
}

// ---------------------------------------------------------------------
echo "== UrlNormalizer (pure, offline) ==\n";
// ---------------------------------------------------------------------

check(
    'lowercases scheme and host',
    UrlNormalizer::normalize('HTTPS://EXAMPLE.COM/Path') === 'https://example.com/Path'
);
check(
    'defaults missing scheme to https',
    UrlNormalizer::normalize('example.com') === 'https://example.com/'
);
check(
    'strips default https port, keeps non-default',
    UrlNormalizer::normalize('https://example.com:443/x') === 'https://example.com/x'
    && UrlNormalizer::normalize('https://example.com:8443/x') === 'https://example.com:8443/x'
);
check(
    'empty path becomes root slash',
    UrlNormalizer::normalize('https://example.com') === 'https://example.com/'
);
check(
    'trailing slash is preserved as a distinct path (not collapsed)',
    UrlNormalizer::normalize('https://example.com/about') === 'https://example.com/about'
    && UrlNormalizer::normalize('https://example.com/about/') === 'https://example.com/about/'
);
check(
    'fragment is stripped',
    UrlNormalizer::normalize('https://example.com/page#section') === 'https://example.com/page'
);
check(
    'query parameters are sorted by key',
    UrlNormalizer::normalize('https://example.com/?b=2&a=1') === 'https://example.com/?a=1&b=2'
);
check(
    'percent-encoding is uppercased',
    UrlNormalizer::normalize('https://example.com/a%2fb') === 'https://example.com/a%2Fb'
);
check(
    'unparseable input returns null',
    UrlNormalizer::normalize('') === null
);

// ---------------------------------------------------------------------
echo "\n== validate_public_url(): valid public addresses (literal IPs, offline) ==\n";
// ---------------------------------------------------------------------

expect_valid('bare public IPv4', 'https://93.184.216.34');
expect_valid('public IPv4 with no scheme (defaults https)', '93.184.216.34');
expect_valid('public IPv4 with explicit default https port', 'https://93.184.216.34:443');
expect_valid('public IPv4 with explicit default http port', 'http://93.184.216.34:80');
expect_valid('public IPv4 with a path', 'https://93.184.216.34/path/to/page');

// ---------------------------------------------------------------------
echo "\n== validate_public_url(): invalid format (not security events) ==\n";
// ---------------------------------------------------------------------

expect_rejected('empty string', '', 'Please enter');
expect_rejected('whitespace only', '   ', 'Please enter');
// These don't contain "//", so they fail to parse at all rather than
// reaching the scheme check - still safely rejected either way, just with
// a generic "not a valid address" message instead of the scheme-specific
// one, so no particular message is asserted here.
expect_rejected('javascript: scheme', 'javascript:alert(1)');
expect_rejected('data: scheme', 'data:text/html,<script>alert(1)</script>');
expect_rejected('file: scheme', 'file:///etc/passwd', 'http:// and https://');
expect_rejected('ftp: scheme', 'ftp://93.184.216.34/file', 'http:// and https://');
expect_rejected('embedded credentials', 'https://user:pass@93.184.216.34', 'username or password');
expect_rejected('non-default port', 'https://93.184.216.34:8443', 'standard web ports');
expect_rejected('url over 2048 chars', 'https://93.184.216.34/' . str_repeat('a', 2100), 'too long');

// ---------------------------------------------------------------------
echo "\n== validate_public_url(): SSRF targets (must be blocked, offline) ==\n";
// ---------------------------------------------------------------------

expect_rejected('loopback 127.0.0.1', 'http://127.0.0.1');
expect_rejected('loopback ::1', 'http://[::1]');
expect_rejected('hostname "localhost"', 'http://localhost', 'Local addresses');
expect_rejected('unspecified 0.0.0.0', 'http://0.0.0.0');
expect_rejected('unspecified ::', 'http://[::]');
expect_rejected('link-local / cloud metadata 169.254.169.254', 'http://169.254.169.254');
expect_rejected('link-local ipv6 fe80::1', 'http://[fe80::1]');
expect_rejected('private RFC1918 10.x', 'http://10.0.0.1');
expect_rejected('private RFC1918 172.16.x', 'http://172.16.0.1');
expect_rejected('private RFC1918 192.168.x', 'http://192.168.1.1');
expect_rejected('unique local ipv6 fc00::/7', 'http://[fc00::1]');
expect_rejected('carrier-grade NAT 100.64.0.0/10', 'http://100.64.0.1');
expect_rejected('IETF protocol assignments 192.0.0.0/24', 'http://192.0.0.1');
expect_rejected('TEST-NET-1 192.0.2.0/24', 'http://192.0.2.1');
expect_rejected('benchmarking 198.18.0.0/15', 'http://198.18.0.1');
expect_rejected('TEST-NET-2 198.51.100.0/24', 'http://198.51.100.1');
expect_rejected('TEST-NET-3 203.0.113.0/24', 'http://203.0.113.1');
expect_rejected('multicast 224.0.0.1', 'http://224.0.0.1');
expect_rejected('IPv4-mapped IPv6 loopback', 'http://[::ffff:127.0.0.1]');

// ---------------------------------------------------------------------
echo "\n== SsrfGuard: redirect-chain walking (FakeRedirectProbe, offline) ==\n";
// ---------------------------------------------------------------------

// A distinct "safe" public IP to use as a redirect destination, separate
// from the start URL, so tests can tell hops apart.
$safeStart = 'https://93.184.216.34/';
$safeOtherPublic = 'https://172.217.0.0/'; // also a public unicast IP

$probe = (new FakeRedirectProbe())->respondOk($safeStart);
$result = SsrfGuard::checkUrlSafety($safeStart, $probe);
check(
    'no redirect: terminal 200 is valid with redirectCount 0',
    $result->valid && $result->redirectCount === 0,
    $result->valid ? '' : $result->userMessage
);

$probe = (new FakeRedirectProbe())
    ->redirectTo($safeStart, $safeOtherPublic)
    ->respondOk($safeOtherPublic);
$result = SsrfGuard::checkUrlSafety($safeStart, $probe);
check(
    'one redirect to another public target is followed and allowed',
    $result->valid && $result->redirectCount === 1,
    $result->valid ? '' : $result->userMessage
);

$probe = (new FakeRedirectProbe())->redirectTo($safeStart, 'http://127.0.0.1/');
$result = SsrfGuard::checkUrlSafety($safeStart, $probe);
check(
    'redirect to loopback 127.0.0.1 is blocked',
    !$result->valid && $result->securityStatus === ValidationResult::STATUS_BLOCKED,
    $result->valid ? 'was accepted' : $result->userMessage
);

$probe = (new FakeRedirectProbe())->redirectTo($safeStart, 'http://169.254.169.254/latest/meta-data/');
$result = SsrfGuard::checkUrlSafety($safeStart, $probe);
check(
    'redirect to cloud metadata address is blocked',
    !$result->valid && $result->securityStatus === ValidationResult::STATUS_BLOCKED,
    $result->valid ? 'was accepted' : $result->userMessage
);

$probe = (new FakeRedirectProbe())->redirectTo($safeStart, 'http://10.0.0.5/internal');
$result = SsrfGuard::checkUrlSafety($safeStart, $probe);
check(
    'redirect to a private RFC1918 address is blocked',
    !$result->valid && $result->securityStatus === ValidationResult::STATUS_BLOCKED,
    $result->valid ? 'was accepted' : $result->userMessage
);

$loopA = 'https://93.184.216.34/a';
$loopB = 'https://93.184.216.34/b';
$probe = (new FakeRedirectProbe())->redirectTo($loopA, $loopB)->redirectTo($loopB, $loopA);
$result = SsrfGuard::checkUrlSafety($loopA, $probe);
check(
    'a redirect loop is detected and blocked',
    !$result->valid && $result->reason === 'redirect_loop',
    $result->valid ? 'was accepted' : ($result->reason ?? '')
);

$chainProbe = new FakeRedirectProbe();
$hopUrl = $safeStart;
for ($i = 1; $i <= 6; $i++) {
    $nextHop = 'https://93.184.216.34/hop' . $i;
    $chainProbe->redirectTo($hopUrl, $nextHop);
    $hopUrl = $nextHop;
}
$chainProbe->respondOk($hopUrl);
$result = SsrfGuard::checkUrlSafety($safeStart, $chainProbe);
check(
    'a chain longer than the redirect cap is blocked as too many redirects',
    !$result->valid && $result->reason === 'too_many_redirects',
    $result->valid ? 'was accepted' : ($result->reason ?? '')
);

$probe = (new FakeRedirectProbe())->respondFetchFailed($safeStart);
$result = SsrfGuard::checkUrlSafety($safeStart, $probe);
check(
    'a probe-level network failure fails open (target IP was already validated)',
    $result->valid,
    $result->valid ? '' : $result->userMessage
);

$probe = (new FakeRedirectProbe())->redirectTo($safeStart, 'javascript:alert(1)');
$result = SsrfGuard::checkUrlSafety($safeStart, $probe);
check(
    'a redirect to a disallowed scheme is blocked, not followed',
    !$result->valid,
    $result->valid ? 'was accepted' : ''
);

// ---------------------------------------------------------------------
echo "\n== [network] live DNS + connectivity sanity checks (example.com) ==\n";
// ---------------------------------------------------------------------

expect_valid('[network] https://example.com is accepted', 'https://example.com');
expect_valid('[network] bare "example.com" is accepted', 'example.com');
check(
    '[network] "example.com" and "https://example.com" normalize the same way',
    UrlNormalizer::normalize('example.com') === UrlNormalizer::normalize('https://example.com')
);
expect_rejected(
    '[network] a hostname that cannot be resolved is rejected',
    'https://this-domain-should-not-exist-abcxyz123456789.com',
    "couldn't find"
);

$netProbe = null; // default CurlRedirectProbe - a real request to example.com
$netResult = SsrfGuard::checkUrlSafety('https://example.com', $netProbe);
check(
    '[network] SsrfGuard accepts a real, safe public site end-to-end',
    $netResult->valid,
    $netResult->valid ? '' : $netResult->userMessage
);

// ---------------------------------------------------------------------
echo "\n{$total} tests, " . ($total - $failed) . " passed, {$failed} failed.\n";
exit($failed > 0 ? 1 : 0);
