<?php
/**
 * PHP port of apps/api's POST /v1/analyze.
 *
 * Same contract as the FastAPI version it replaces: validates that the
 * submitted URL is safe to eventually scan, then responds with an honest
 * 501 - it does not crawl anything, does not run any SEO checks, and does
 * not return any score, finding, or report, because none of that exists
 * yet. See apps/api/app/api/v1/routers/analyze.py for the original.
 */
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../includes/url-security.php';
require_once __DIR__ . '/../src/Crawler/SsrfGuard.php';

header('Content-Type: application/json');

function error_body(string $message, string $code): array
{
    return ['error' => ['code' => $code, 'message' => $message]];
}

function not_implemented_body(string $message, string $normalizedUrl): array
{
    // normalized_url sits alongside the error so a caller can tell "this
    // URL was validated" apart from "the feature isn't built yet" instead
    // of treating the whole 501 response as one undifferentiated failure.
    return ['normalized_url' => $normalizedUrl, 'error' => ['code' => 'not_implemented', 'message' => $message]];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(error_body('Only POST is supported on this endpoint.', 'method_not_allowed'));
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
$url = is_array($data) ? ($data['url'] ?? null) : null;

if (!is_string($url) || $url === '' || strlen($url) > 2048) {
    http_response_code(422);
    echo json_encode(error_body("That request wasn't in the expected format.", 'invalid_request'));
    exit;
}

// Category 03 Step 02: SsrfGuard wraps validate_public_url() and additionally
// walks and re-validates every redirect hop, so a public URL that redirects
// to a private/internal target is caught here too - not just a URL that is
// unsafe on its face. See src/Crawler/SsrfGuard.php.
$result = SsrfGuard::checkUrlSafety($url);

if (!$result->valid) {
    // Security-relevant rejections (private IP, unsafe redirect, disallowed
    // scheme/port) are logged server-side only, for abuse monitoring - never
    // shown to the visitor beyond the already-safe $userMessage, and never
    // written anywhere a report or client response could later expose them.
    if ($result->securityStatus === ValidationResult::STATUS_BLOCKED) {
        error_log(sprintf(
            '[ssrf-guard] blocked url submission: reason=%s remote_addr=%s',
            $result->reason,
            $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ));
    }
    http_response_code(400);
    echo json_encode(error_body($result->userMessage, 'invalid_url'));
    exit;
}

http_response_code(501);
echo json_encode(not_implemented_body(
    'Website crawling and SEO analysis are not implemented yet. The real crawler is coming in ' .
    'a later development step (Category 03).',
    $result->normalizedUrl
));
