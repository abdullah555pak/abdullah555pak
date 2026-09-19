<?php
require_once __DIR__ . '/../src/Crawler/RedirectProbeInterface.php';

/**
 * Test double for RedirectProbeInterface - returns pre-programmed
 * responses instead of making a real network request, so redirect-chain
 * safety logic (e.g. "a redirect to a private IP is blocked") can be
 * tested deterministically and without ever needing a real, reachable
 * private/internal target.
 *
 * Responses are keyed by the exact URL SsrfGuard will probe. A URL with
 * no programmed response is treated as a terminal 200 (no redirect) so
 * tests only need to specify the hops they actually care about.
 */
final class FakeRedirectProbe implements RedirectProbeInterface
{
    /** @var array<string, ProbeResult> */
    private array $responses = [];

    /** @var list<string> URLs this fake was actually asked to probe, in order - lets a test assert which hops were reached. */
    public array $probedUrls = [];

    public function redirectTo(string $fromUrl, string $toUrl): self
    {
        $this->responses[$fromUrl] = new ProbeResult(fetchFailed: false, statusCode: 302, redirectLocation: $toUrl);
        return $this;
    }

    public function respondOk(string $url): self
    {
        $this->responses[$url] = new ProbeResult(fetchFailed: false, statusCode: 200);
        return $this;
    }

    public function respondFetchFailed(string $url): self
    {
        $this->responses[$url] = new ProbeResult(fetchFailed: true);
        return $this;
    }

    public function probe(string $url, string $resolvedIp): ProbeResult
    {
        $this->probedUrls[] = $url;
        return $this->responses[$url] ?? new ProbeResult(fetchFailed: false, statusCode: 200);
    }
}
