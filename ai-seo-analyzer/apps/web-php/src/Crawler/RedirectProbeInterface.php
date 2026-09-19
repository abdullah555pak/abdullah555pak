<?php
/**
 * The one capability SsrfGuard needs from the network: "if I request this
 * URL, does it redirect, and to where?" Kept as a tiny interface (rather
 * than SsrfGuard calling curl directly) so the redirect-chain-walking
 * logic can be tested with a fake implementation that returns canned
 * responses - there's no safe way to test "a redirect to a private IP is
 * blocked" against a real server, since reaching a real private IP from
 * the test itself is exactly what must never happen.
 *
 * This is intentionally narrow: it is NOT the future HttpFetcher from the
 * crawler blueprint (that fetches full page content for parsing). This
 * exists only to answer the redirect question during the safety check.
 */
interface RedirectProbeInterface
{
    /**
     * Probe one URL. Must not follow redirects itself - the caller
     * (SsrfGuard) decides whether following is safe after seeing the
     * result. $resolvedIp is the exact IP SsrfGuard already validated for
     * this URL's host; implementations that make a real connection MUST
     * connect to that IP specifically (never re-resolve), so nothing can
     * change between "validated" and "connected."
     */
    public function probe(string $url, string $resolvedIp): ProbeResult;
}

final class ProbeResult
{
    public function __construct(
        /** True only when the probe itself could not be completed (network/timeout/TLS failure) - not a 4xx/5xx from the server, which is a normal, successful probe. */
        public readonly bool $fetchFailed,
        public readonly ?int $statusCode = null,
        public readonly ?string $redirectLocation = null,
    ) {
    }

    public function isRedirect(): bool
    {
        return $this->statusCode !== null && $this->statusCode >= 300 && $this->statusCode < 400 && $this->redirectLocation !== null;
    }
}
