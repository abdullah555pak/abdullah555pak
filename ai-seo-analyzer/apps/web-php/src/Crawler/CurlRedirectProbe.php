<?php
require_once __DIR__ . '/RedirectProbeInterface.php';

/**
 * Real network implementation of RedirectProbeInterface, via ext-curl.
 * A HEAD request (no body downloaded) with automatic redirect-following
 * disabled - SsrfGuard decides hop by hop whether a redirect target is
 * safe before this class is ever asked to touch it.
 */
final class CurlRedirectProbe implements RedirectProbeInterface
{
    public function __construct(
        private readonly float $connectTimeoutSeconds = 5.0,
        private readonly float $totalTimeoutSeconds = 8.0,
    ) {
    }

    public function probe(string $url, string $resolvedIp): ProbeResult
    {
        $parts = parse_url($url);
        if (!$parts || empty($parts['host']) || empty($parts['scheme'])) {
            return new ProbeResult(fetchFailed: true);
        }
        $host = $parts['host'];
        $port = $parts['port'] ?? ($parts['scheme'] === 'https' ? 443 : 80);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_NOBODY => true, // HEAD - never downloads a response body
            CURLOPT_FOLLOWLOCATION => false, // SsrfGuard follows hops itself, one at a time
            CURLOPT_CONNECTTIMEOUT => $this->connectTimeoutSeconds,
            CURLOPT_TIMEOUT => $this->totalTimeoutSeconds,
            CURLOPT_RETURNTRANSFER => true,
            // Pin to the IP SsrfGuard already validated - never let curl do
            // its own, separate DNS resolution for this connection (that
            // second lookup is exactly the DNS-rebinding gap this exists
            // to close; see includes/url-security.php's docblock).
            CURLOPT_RESOLVE => ["{$host}:{$port}:{$resolvedIp}"],
            CURLOPT_HEADER => false,
            CURLOPT_USERAGENT => 'SitewellSecurityCheck/1.0 (+validation probe, no content fetched)',
        ]);

        curl_exec($ch);
        $errorNumber = curl_errno($ch);
        if ($errorNumber !== 0) {
            curl_close($ch);
            return new ProbeResult(fetchFailed: true);
        }

        $statusCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $location = curl_getinfo($ch, CURLINFO_REDIRECT_URL) ?: null;
        curl_close($ch);

        return new ProbeResult(fetchFailed: false, statusCode: $statusCode, redirectLocation: $location);
    }
}
