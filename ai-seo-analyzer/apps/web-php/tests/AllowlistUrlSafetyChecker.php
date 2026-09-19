<?php
require_once __DIR__ . '/../src/Crawler/UrlSafetyCheckerInterface.php';

/**
 * Test-only UrlSafetyCheckerInterface implementation: approves exactly the
 * host:port pairs it's told about (the local fixture test server), and
 * rejects everything else exactly like a real SSRF rejection would -
 * letting tests/run-http-fetcher-tests.php prove "an unapproved redirect
 * target is refused" without needing a real private/internal address.
 *
 * The real SSRF logic (private IP ranges, localhost, DNS rebinding, etc.)
 * is exhaustively covered by tests/run-url-validation-tests.php against
 * the real validate_public_url()/SsrfGuard - this class deliberately does
 * not re-implement any of that; it only stands in for "which hosts is
 * this particular test allowed to reach," which is a test concern, not a
 * security one.
 */
final class AllowlistUrlSafetyChecker implements UrlSafetyCheckerInterface
{
    /** @var array<string,string> "host:port" => resolved IP to pin to */
    private array $allowed = [];

    public function allow(string $host, int $port, string $resolvedIp = '127.0.0.1'): self
    {
        $this->allowed["{$host}:{$port}"] = $resolvedIp;
        return $this;
    }

    public function checkAndResolve(string $url): string
    {
        $parts = parse_url($url);
        if (!$parts || empty($parts['host']) || empty($parts['scheme'])) {
            throw new UnsafeURLException("That doesn't look like a valid website address.", isSecurityBlock: false);
        }
        if (!in_array($parts['scheme'], ['http', 'https'], true)) {
            throw new UnsafeURLException('Only http:// and https:// website addresses are supported.');
        }
        $port = $parts['port'] ?? ($parts['scheme'] === 'https' ? 443 : 80);
        $key = "{$parts['host']}:{$port}";

        if (!isset($this->allowed[$key])) {
            throw new UnsafeURLException(
                "That address points to a private or internal network and can't be analyzed."
            );
        }

        return $this->allowed[$key];
    }
}
