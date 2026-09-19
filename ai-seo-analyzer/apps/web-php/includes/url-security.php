<?php
/**
 * URL safety validation - PHP port of apps/api's app/core/security.py.
 *
 * This is the real security boundary (unlike includes/url-validation.php,
 * which is just a light client-side-style format check for the homepage
 * form's UX). It answers exactly one question: "Is it safe to eventually
 * let a crawler fetch this URL?" It does not fetch anything itself.
 *
 * Rules enforced (mirrors the Python version exactly):
 *   - Only http/https schemes are accepted.
 *   - No embedded credentials (http://user:pass@host).
 *   - The hostname must resolve, and none of its resolved addresses may be
 *     private, loopback, link-local, multicast, reserved, or otherwise
 *     non-public (blocks localhost, RFC1918 ranges, the cloud metadata
 *     address 169.254.169.254, etc).
 *
 * Same caveat as the Python version: DNS can answer differently between
 * this check and a later real connection (DNS rebinding) - a future real
 * crawler MUST re-resolve and re-check the IP at actual connect time and
 * on every redirect hop. This module is not a substitute for that.
 */

class UnsafeURLException extends Exception
{
    /**
     * Category 03 Step 02 addition: lets a caller (SsrfGuard) tell a real
     * SSRF/security rejection (private IP, localhost, disallowed scheme
     * or port, embedded credentials) apart from a plain format problem
     * (empty input, too long, unparseable, host doesn't resolve) without
     * having to guess from the message text. Defaults to true because
     * most rejections here are security-relevant; the handful of purely
     * format-related throws below pass false explicitly.
     */
    public function __construct(string $message, public readonly bool $isSecurityBlock = true)
    {
        parent::__construct($message);
    }
}

const ALLOWED_URL_SCHEMES = ['http', 'https'];

// Ranges PHP's own FILTER_FLAG_NO_PRIV_RANGE / FILTER_FLAG_NO_RES_RANGE
// don't reliably cover, matching the Python version's _EXTRA_BLOCKED_NETWORKS.
const EXTRA_BLOCKED_CIDRS = [
    '100.64.0.0/10',      // carrier-grade NAT
    '192.0.0.0/24',       // IETF protocol assignments
    '192.0.2.0/24',       // TEST-NET-1
    '198.18.0.0/15',      // benchmarking
    '198.51.100.0/24',    // TEST-NET-2
    '203.0.113.0/24',     // TEST-NET-3
    '224.0.0.0/4',        // multicast - PHP's FILTER_FLAG_NO_RES_RANGE does not cover this
    '255.255.255.255/32', // limited broadcast - not covered by FILTER_FLAG_NO_RES_RANGE either
    '::ffff:0:0/96',      // IPv4-mapped IPv6
    '64:ff9b::/96',       // NAT64
    '100::/64',           // discard-only
];

function ip_in_cidr(string $ip, string $cidr): bool
{
    [$subnet, $maskBitsRaw] = explode('/', $cidr);
    $maskBits = (int) $maskBitsRaw;

    $ipBin = @inet_pton($ip);
    $subnetBin = @inet_pton($subnet);
    if ($ipBin === false || $subnetBin === false || strlen($ipBin) !== strlen($subnetBin)) {
        return false;
    }

    $fullBytes = intdiv($maskBits, 8);
    $remainderBits = $maskBits % 8;

    if ($fullBytes > 0 && substr($ipBin, 0, $fullBytes) !== substr($subnetBin, 0, $fullBytes)) {
        return false;
    }
    if ($remainderBits === 0) {
        return true;
    }

    $mask = chr((0xFF << (8 - $remainderBits)) & 0xFF);
    return (substr($ipBin, $fullBytes, 1) & $mask) === (substr($subnetBin, $fullBytes, 1) & $mask);
}

function is_blocked_ip(string $ip): bool
{
    if ($ip === '0.0.0.0' || $ip === '::') {
        return true; // unspecified
    }

    // Covers private (RFC1918, ULA fc00::/7) and reserved ranges
    // (loopback, link-local, multicast, documentation/test ranges, etc).
    $publicOnly = filter_var(
        $ip,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    );
    if ($publicOnly === false) {
        return true;
    }

    foreach (EXTRA_BLOCKED_CIDRS as $cidr) {
        if (ip_in_cidr($ip, $cidr)) {
            return true;
        }
    }
    return false;
}

/**
 * Validate a user-submitted website address.
 *
 * Returns the normalized "scheme://host[:port]" on success.
 * Throws UnsafeURLException with a beginner-friendly message on failure.
 *
 * @param string|null $outResolvedIp Category 03 Step 02 addition: when
 *   passed by reference, receives the exact IP address this call
 *   validated as safe. Callers that need to actually connect (e.g. the
 *   crawler's redirect-safety probe) MUST reuse this IP - pinning the
 *   connection to it, rather than letting a second DNS lookup happen at
 *   connect time - to close the gap between "checked" and "connected"
 *   a hostile or misconfigured DNS server could otherwise exploit (DNS
 *   rebinding). Optional and backward compatible: existing callers that
 *   only need a yes/no answer can ignore this parameter entirely.
 */
function validate_public_url(string $raw_url, ?string &$outResolvedIp = null): string
{
    $raw_url = trim($raw_url);
    if ($raw_url === '') {
        throw new UnsafeURLException('Please enter a website address.', isSecurityBlock: false);
    }
    if (strlen($raw_url) > 2048) {
        throw new UnsafeURLException('That website address is too long.', isSecurityBlock: false);
    }

    // Allow "example.com" as well as "https://example.com".
    $candidate = str_contains($raw_url, '//') ? $raw_url : '//' . $raw_url;
    $parsed = @parse_url($candidate);
    if ($parsed === false) {
        throw new UnsafeURLException("That doesn't look like a valid website address.", isSecurityBlock: false);
    }

    $scheme = strtolower($parsed['scheme'] ?? 'https');
    if (!in_array($scheme, ALLOWED_URL_SCHEMES, true)) {
        throw new UnsafeURLException('Only http:// and https:// website addresses are supported.');
    }

    if (!empty($parsed['user']) || !empty($parsed['pass'])) {
        throw new UnsafeURLException("Web addresses with a username or password aren't supported.");
    }

    $hostname = isset($parsed['host']) ? strtolower($parsed['host']) : null;
    if (!$hostname) {
        throw new UnsafeURLException("That doesn't look like a valid website address.", isSecurityBlock: false);
    }

    if ($hostname === 'localhost' || str_ends_with($hostname, '.localhost')) {
        throw new UnsafeURLException("Local addresses can't be analyzed.");
    }

    // Category 03 Step 02: only the standard web ports are supported. This
    // isn't primarily an SSRF control (a private IP is already blocked
    // below regardless of port) - it's specifically to stop a *public*,
    // otherwise-legitimate host from being used to probe non-web internal
    // services on unusual ports (a database, cache, or admin panel
    // listening on the same public-facing machine). No such service is
    // ever something a website-analysis tool has a legitimate reason to
    // reach, so rather than maintain a blocklist of known service ports,
    // every non-default port is rejected outright.
    if (isset($parsed['port'])) {
        $defaultPort = $scheme === 'https' ? 443 : 80;
        if ($parsed['port'] !== $defaultPort) {
            throw new UnsafeURLException(
                'Only the standard web ports are supported (port 80 for http, or 443 for https).'
            );
        }
    }

    // PHP's parse_url keeps the brackets around an IPv6 literal host
    // (e.g. "[::1]"), unlike Python's urlparse. Strip them so a literal
    // IP address - v4 or v6 - is recognized and checked directly,
    // matching socket.getaddrinfo's behavior of accepting literal IPs
    // without a DNS lookup.
    $literalIp = trim($hostname, '[]');
    if (filter_var($literalIp, FILTER_VALIDATE_IP)) {
        $resolved = [$literalIp];
    } else {
        // Resolve both A and AAAA records, like Python's socket.getaddrinfo.
        $resolved = [];
        $ipv4 = @gethostbynamel($hostname);
        if (is_array($ipv4)) {
            $resolved = array_merge($resolved, $ipv4);
        }
        $aaaaRecords = @dns_get_record($hostname, DNS_AAAA);
        if (is_array($aaaaRecords)) {
            foreach ($aaaaRecords as $record) {
                if (!empty($record['ipv6'])) {
                    $resolved[] = $record['ipv6'];
                }
            }
        }
        $resolved = array_unique($resolved);
    }

    if (empty($resolved)) {
        throw new UnsafeURLException(
            "We couldn't find that website. Check the address and try again.",
            isSecurityBlock: false
        );
    }

    foreach ($resolved as $ip) {
        if (is_blocked_ip($ip)) {
            throw new UnsafeURLException(
                "That address points to a private or internal network and can't be analyzed."
            );
        }
    }

    // Any of the resolved+validated IPs is safe to pin to; the first is
    // picked only for determinism, not because it's preferred in any way.
    $outResolvedIp = $resolved[array_key_first($resolved)];

    $port_part = isset($parsed['port']) ? ':' . $parsed['port'] : '';
    return $scheme . '://' . $hostname . $port_part;
}
