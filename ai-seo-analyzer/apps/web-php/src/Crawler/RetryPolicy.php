<?php
/**
 * Category 03 Step 03: decides, in one place, which fetch failures are
 * worth retrying and how long to wait before the next attempt. Kept out of
 * HttpFetcher so the "what's retryable" decision is a single reviewable
 * list rather than scattered if-statements.
 *
 * Deliberately conservative - retrying something that will never succeed
 * (a 404, a blocked URL, a bad TLS config) just makes a doomed request
 * slower and hammers the target for no reason. Only genuinely transient
 * conditions are retried:
 *   - HTTP 429, 502, 503, 504
 *   - low-level connection interruptions (reset, "got nothing back", etc.)
 *
 * Never retried, on purpose: invalid/malformed URLs, anything SsrfGuard/
 * validate_public_url() rejected, DNS failures (resolution already
 * succeeded once before this fetcher can even reach the network - see
 * HttpFetcher's docblock - so a DNS-stage failure here is not the kind of
 * blip a second attempt fixes), TLS/certificate failures (a cert problem
 * won't be different half a second later), oversized responses, unsafe
 * redirects, redirect loops, and any 4xx other than 429 (the request
 * itself is the problem, not the timing).
 */
final class RetryPolicy
{
    private const RETRYABLE_STATUS_CODES = [429, 502, 503, 504];
    private const RETRYABLE_ERROR_CODES = ['connection_reset', 'network_error'];

    public function __construct(
        private readonly int $maxRetries,
        private readonly int $baseDelayMs,
        private readonly int $maxDelayMs,
    ) {
    }

    public function isRetryableStatus(int $statusCode): bool
    {
        return in_array($statusCode, self::RETRYABLE_STATUS_CODES, true);
    }

    public function isRetryableErrorCode(string $errorCode): bool
    {
        return in_array($errorCode, self::RETRYABLE_ERROR_CODES, true);
    }

    /** @param int $attemptsSoFar Attempts already made (1 after the first try). */
    public function hasRetriesLeft(int $attemptsSoFar): bool
    {
        return $attemptsSoFar <= $this->maxRetries;
    }

    /**
     * @param int $attemptsSoFar Attempts already made (1 = about to schedule the 2nd try).
     * @param array<string,string> $headers Lowercased response headers, for Retry-After.
     */
    public function delayMsFor(int $attemptsSoFar, ?int $statusCode, array $headers = []): int
    {
        if ($statusCode === 429 && isset($headers['retry-after'])) {
            $retryAfterSeconds = self::parseRetryAfter($headers['retry-after']);
            if ($retryAfterSeconds !== null) {
                return min($retryAfterSeconds * 1000, $this->maxDelayMs);
            }
        }

        $exponential = $this->baseDelayMs * (2 ** max(0, $attemptsSoFar - 1));
        return min($exponential, $this->maxDelayMs);
    }

    /**
     * Retry-After is either a plain integer number of seconds, or an
     * HTTP-date. Only the seconds form is common in practice; the date
     * form is parsed too so a compliant server is never treated as if it
     * sent nothing. Returns null (caller falls back to exponential
     * backoff) for anything that parses to a negative or unreasonable wait.
     */
    private static function parseRetryAfter(string $value): ?int
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }
        if (ctype_digit($value)) {
            $seconds = (int) $value;
            return $seconds >= 0 ? $seconds : null;
        }
        $timestamp = strtotime($value);
        if ($timestamp === false) {
            return null;
        }
        $seconds = $timestamp - time();
        return $seconds >= 0 ? $seconds : null;
    }
}
