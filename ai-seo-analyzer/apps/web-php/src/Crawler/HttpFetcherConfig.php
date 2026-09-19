<?php
/**
 * Category 03 Step 03: every tunable HttpFetcher uses lives here, not as
 * magic numbers scattered through HttpFetcher.php. Every default below is
 * chosen for a concrete reason (documented inline and in
 * docs/CRAWLER_BLUEPRINT.md's Step 03 notes) and can be overridden per
 * environment via the listed environment variable, without a code change.
 *
 * This step's fetch is synchronous - a browser's fetch() to api/analyze.php
 * is waiting on it - unlike the background-worker crawl the blueprint's
 * §10 timeouts/limits were originally sized for. Defaults here are
 * deliberately a bit tighter than that table for exactly that reason; see
 * the Step 03 notes in the blueprint for the full comparison.
 */
final class HttpFetcherConfig
{
    private const DEFAULT_USER_AGENT = 'SitewellCrawler/1.0 (+website analysis fetch; no rendering, metadata only)';

    public function __construct(
        /** HTTP_CONNECT_TIMEOUT - seconds allowed to establish the TCP/TLS connection, per attempt. */
        public readonly float $connectTimeoutSeconds = 5.0,
        /** HTTP_REQUEST_TIMEOUT - seconds allowed for one full request/response, per attempt (includes connect time). */
        public readonly float $requestTimeoutSeconds = 15.0,
        /** HTTP_MAX_RESPONSE_BYTES - response body is aborted mid-transfer past this many bytes. */
        public readonly int $maxResponseBytes = 5 * 1024 * 1024,
        /** Per SsrfGuard's own cap (Step 02) - kept identical so a chain judged safe up front is never re-walked further here. */
        public readonly int $maxRedirects = 5,
        /** Per hop: how many times a transient failure may be retried before giving up on that hop. */
        public readonly int $maxRetries = 2,
        public readonly int $retryBaseDelayMs = 300,
        /** Hard ceiling on any single retry delay, including an honored Retry-After - a hostile/misconfigured server asking for an hour's wait does not get one on a synchronous request. */
        public readonly int $maxRetryDelayMs = 3000,
        /** Wall-clock budget across every hop and retry combined, so a pathological chain (many hops, each retried, each slow) still can't hold the PHP worker open indefinitely. */
        public readonly float $maxTotalDurationSeconds = 45.0,
        public readonly string $userAgent = self::DEFAULT_USER_AGENT,
    ) {
    }

    public static function fromEnv(): self
    {
        $defaults = new self();
        return new self(
            connectTimeoutSeconds: self::floatEnv('HTTP_CONNECT_TIMEOUT', $defaults->connectTimeoutSeconds),
            requestTimeoutSeconds: self::floatEnv('HTTP_REQUEST_TIMEOUT', $defaults->requestTimeoutSeconds),
            maxResponseBytes: self::intEnv('HTTP_MAX_RESPONSE_BYTES', $defaults->maxResponseBytes),
            maxRedirects: self::intEnv('HTTP_MAX_REDIRECTS', $defaults->maxRedirects),
            maxRetries: self::intEnv('HTTP_MAX_RETRIES', $defaults->maxRetries),
            retryBaseDelayMs: self::intEnv('HTTP_RETRY_BASE_DELAY_MS', $defaults->retryBaseDelayMs),
            maxRetryDelayMs: self::intEnv('HTTP_MAX_RETRY_DELAY_MS', $defaults->maxRetryDelayMs),
            maxTotalDurationSeconds: self::floatEnv('HTTP_MAX_TOTAL_DURATION', $defaults->maxTotalDurationSeconds),
            userAgent: self::stringEnv('HTTP_USER_AGENT', $defaults->userAgent),
        );
    }

    private static function floatEnv(string $name, float $default): float
    {
        $value = getenv($name);
        return $value === false || $value === '' ? $default : (float) $value;
    }

    private static function intEnv(string $name, int $default): int
    {
        $value = getenv($name);
        return $value === false || $value === '' ? $default : (int) $value;
    }

    private static function stringEnv(string $name, string $default): string
    {
        $value = getenv($name);
        return $value === false || $value === '' ? $default : $value;
    }
}
