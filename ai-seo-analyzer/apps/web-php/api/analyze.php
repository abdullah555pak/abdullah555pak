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

header('Content-Type: application/json');

function error_body(string $message, string $code): array
{
    return ['error' => ['code' => $code, 'message' => $message]];
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

try {
    validate_public_url($url);
} catch (UnsafeURLException $e) {
    http_response_code(400);
    echo json_encode(error_body($e->getMessage(), 'invalid_url'));
    exit;
}

http_response_code(501);
echo json_encode(error_body(
    "Website analysis isn't built yet. We checked that this address is safe to scan, but " .
    'the crawler and SEO engine are coming in a later development step.',
    'not_implemented'
));
