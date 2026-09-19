<?php
require_once __DIR__ . '/../../includes/url-security.php';
require_once __DIR__ . '/UrlNormalizer.php';
require_once __DIR__ . '/ValidationResult.php';
require_once __DIR__ . '/RedirectProbeInterface.php';
require_once __DIR__ . '/CurlRedirectProbe.php';

/**
 * Category 03 Step 02 entry point: "is it safe to let a crawler fetch this
 * URL, including everywhere it redirects to?"
 *
 * This is the only class future crawler code (Step 03+) should call. It
 * composes three already-independently-tested pieces rather than
 * duplicating any of their logic:
 *   - includes/url-security.php's validate_public_url() - the actual
 *     SSRF/private-IP/scheme/port boundary, reused unchanged per hop.
 *   - UrlNormalizer - so the returned normalizedUrl is in one canonical
 *     form regardless of which hop it came from.
 *   - RedirectProbeInterface - the only piece that touches the network,
 *     swappable in tests.
 *
 * Every redirect hop is validated exactly as if a user had typed it in
 * directly - a public host redirecting to a private IP, localhost, or an
 * unsafe scheme is blocked at that hop, not just the first one.
 */
final class SsrfGuard
{
    /**
     * Matches the Step 01 blueprint's crawl-limit guidance and common
     * browser practice; also bounds how long a single safety check can
     * take before giving up on an uncooperative or looping target.
     */
    private const MAX_REDIRECTS = 5;

    public static function checkUrlSafety(string $rawUrl, ?RedirectProbeInterface $probe = null): ValidationResult
    {
        $probe ??= new CurlRedirectProbe();

        $currentUrl = $rawUrl;
        $visited = [];

        for ($hop = 0; $hop <= self::MAX_REDIRECTS; $hop++) {
            try {
                $resolvedIp = null;
                // validate_public_url() intentionally returns only
                // "scheme://host[:port]" - it exists to answer "is this
                // host safe", not to carry a path/query through. Using
                // that truncated value below would probe (and report) the
                // site's root on every hop, silently discarding whatever
                // path or query the actual URL/redirect pointed at, so the
                // full URL for probing/normalizing is built from
                // $currentUrl instead - the scheme/host/port it shares
                // with the validated value are exactly what was just
                // confirmed safe.
                validate_public_url($currentUrl, $resolvedIp);
            } catch (UnsafeURLException $e) {
                return ValidationResult::fail(
                    reason: 'validation_failed_at_hop_' . $hop,
                    userMessage: $e->getMessage(),
                    securityStatus: $e->isSecurityBlock ? ValidationResult::STATUS_BLOCKED : ValidationResult::STATUS_INVALID,
                );
            }

            $normalized = UrlNormalizer::normalize($currentUrl);
            if ($normalized === null) {
                // Should be unreachable - validate_public_url() only returns
                // parseable URLs - but never trust an unreachable branch to
                // stay unreachable; fail closed rather than assume.
                return ValidationResult::fail(
                    reason: 'normalization_failed',
                    userMessage: "That doesn't look like a valid website address.",
                    securityStatus: ValidationResult::STATUS_INVALID,
                );
            }

            if (isset($visited[$normalized])) {
                return ValidationResult::fail(
                    reason: 'redirect_loop',
                    userMessage: 'This website redirects in a loop and can\'t be analyzed.',
                    securityStatus: ValidationResult::STATUS_BLOCKED,
                );
            }
            $visited[$normalized] = true;

            $parsed = parse_url($normalized);
            $scheme = $parsed['scheme'];
            $hostname = $parsed['host'];
            $port = $parsed['port'] ?? null;

            if ($hop === self::MAX_REDIRECTS) {
                return ValidationResult::fail(
                    reason: 'too_many_redirects',
                    userMessage: 'This website redirects too many times and can\'t be analyzed.',
                    securityStatus: ValidationResult::STATUS_BLOCKED,
                );
            }

            $result = $probe->probe($normalized, $resolvedIp);

            if ($result->fetchFailed) {
                // The target's IP already passed validate_public_url() above,
                // so failing to reach it is a connectivity/timeout problem,
                // not a security bypass - fail open on *this* check and let
                // the crawler's own fetch step report the real error later.
                return ValidationResult::ok(
                    normalizedUrl: $normalized,
                    hostname: $hostname,
                    scheme: $scheme,
                    port: $port,
                    redirectCount: $hop,
                );
            }

            if (!$result->isRedirect()) {
                return ValidationResult::ok(
                    normalizedUrl: $normalized,
                    hostname: $hostname,
                    scheme: $scheme,
                    port: $port,
                    redirectCount: $hop,
                );
            }

            // It's a redirect - loop again to validate the destination
            // before ever treating it as safe.
            $currentUrl = $result->redirectLocation;
        }

        // Unreachable: the loop above always returns by hop === MAX_REDIRECTS.
        return ValidationResult::fail(
            reason: 'too_many_redirects',
            userMessage: 'This website redirects too many times and can\'t be analyzed.',
            securityStatus: ValidationResult::STATUS_BLOCKED,
        );
    }
}
