<?php
/**
 * Pure URL normalization rules (Category 03 Step 01 blueprint, section 6).
 * No security decisions live here - this only makes two representations
 * of "the same" URL compare equal; includes/url-security.php decides
 * whether a URL is safe.
 */
final class UrlNormalizer
{
    /**
     * Normalize a URL that has already been confirmed parseable (e.g. by
     * validate_public_url()). Returns null only if $url truly can't be
     * parsed - callers should have already validated it by that point.
     *
     * Rules applied (see docs/CRAWLER_BLUEPRINT.md section 6):
     *   - scheme/host lowercased, missing scheme defaults to https
     *   - default port (80/443) stripped, non-default kept
     *   - empty path becomes "/"; a non-root trailing slash is NOT added
     *     or removed - "/about" and "/about/" may be genuinely different
     *     pages, and collapsing them would hide a real redirect
     *   - fragment always stripped (never sent to the server)
     *   - query parameters sorted alphabetically by key for comparison,
     *     values and their encoding are left as-is
     *   - percent-encoding normalized to uppercase hex digits
     */
    public static function normalize(string $url): ?string
    {
        $candidate = str_contains($url, '//') ? $url : '//' . $url;
        $parsed = @parse_url($candidate);
        if ($parsed === false || empty($parsed['host'])) {
            return null;
        }

        $scheme = strtolower($parsed['scheme'] ?? 'https');
        $host = strtolower($parsed['host']);

        $port = $parsed['port'] ?? null;
        $defaultPort = $scheme === 'https' ? 443 : 80;
        $portPart = ($port !== null && $port !== $defaultPort) ? ':' . $port : '';

        $path = $parsed['path'] ?? '';
        if ($path === '') {
            $path = '/';
        }
        $path = self::normalizePercentEncoding($path);

        $queryPart = '';
        if (isset($parsed['query']) && $parsed['query'] !== '') {
            parse_str($parsed['query'], $queryParams);
            ksort($queryParams);
            $queryPart = '?' . http_build_query($queryParams);
        }

        // Fragment is intentionally dropped - it never reaches the server.

        return $scheme . '://' . $host . $portPart . $path . $queryPart;
    }

    /** Uppercases the hex digits of percent-encoded octets, e.g. %2f -> %2F. */
    private static function normalizePercentEncoding(string $value): string
    {
        return (string) preg_replace_callback(
            '/%[0-9a-fA-F]{2}/',
            static fn(array $m): string => strtoupper($m[0]),
            $value
        );
    }
}
