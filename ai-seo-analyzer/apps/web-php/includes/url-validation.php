<?php
/**
 * Server-side port of apps/web's lib/url-format.ts. Format check only
 * (not a security boundary) - just enough to catch an obviously
 * incomplete address before sending the user to the scan page.
 */
function looks_like_website_address(string $value): bool
{
    $value = trim($value);
    if ($value === '') {
        return false;
    }

    $candidate = preg_match('#^https?://#i', $value) ? $value : 'https://' . $value;
    $parts = parse_url($candidate);

    if (!$parts || empty($parts['host'])) {
        return false;
    }

    // Host must contain at least one dot and look like a real domain
    // (letters/digits/hyphens/dots only), e.g. "example.com".
    return (bool) preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i', $parts['host']);
}
