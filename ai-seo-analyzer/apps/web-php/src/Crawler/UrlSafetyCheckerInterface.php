<?php
require_once __DIR__ . '/../../includes/url-security.php';

/**
 * The one security decision HttpFetcher needs before it is allowed to
 * connect anywhere: "is this exact URL safe to fetch, and if so, what IP
 * must the connection be pinned to?" Kept as a narrow interface - the same
 * pattern Step 02's RedirectProbeInterface used - purely so automated
 * tests can point HttpFetcher's real curl/timeout/retry/redirect/size-cap
 * logic at a real local test server without that server's loopback
 * address ever being accepted by production code.
 *
 * There is exactly one production implementation (DefaultUrlSafetyChecker,
 * below), and it does nothing but call the real validate_public_url() -
 * this is NOT a second, independent SSRF system; it is a one-line
 * pass-through so the *existing* check can be swapped out in tests. Every
 * real request path (api/analyze.php and anything built on top of it)
 * uses the default implementation exclusively; nothing in this project
 * ever constructs an HttpFetcher with any other implementation outside of
 * tests/.
 */
interface UrlSafetyCheckerInterface
{
    /**
     * @throws UnsafeURLException when the URL is not safe to fetch. The
     *   exception's isSecurityBlock flag (Step 02) distinguishes a real
     *   security rejection from a plain format problem.
     * @return string the exact IP HttpFetcher must pin its connection to
     *   (never let curl re-resolve the hostname itself - see Step 02's
     *   DNS-rebinding notes in includes/url-security.php).
     */
    public function checkAndResolve(string $url): string;
}

final class DefaultUrlSafetyChecker implements UrlSafetyCheckerInterface
{
    public function checkAndResolve(string $url): string
    {
        $resolvedIp = null;
        validate_public_url($url, $resolvedIp);
        return $resolvedIp;
    }
}
