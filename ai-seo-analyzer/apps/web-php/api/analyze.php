<?php
/**
 * PHP port of apps/api's POST /v1/analyze.
 *
 * Category 03 Step 03: validates the submitted URL (Step 02's SsrfGuard),
 * then performs one real, structured HTTP fetch of it (Step 03's
 * HttpFetcher) and reports exactly what came back - status code, content
 * type, timing. It still does not crawl more than that one URL/redirect
 * chain, does not parse HTML for SEO facts, and does not return any
 * score, finding, or report - none of that exists yet. See
 * src/Crawler/HttpFetcher.php and docs/CRAWLER_BLUEPRINT.md.
 */
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../includes/url-security.php';
require_once __DIR__ . '/../src/Crawler/SsrfGuard.php';
require_once __DIR__ . '/../src/Crawler/HttpFetcher.php';

header('Content-Type: application/json');

function error_body(string $message, string $code): array
{
    return ['error' => ['code' => $code, 'message' => $message]];
}

/**
 * fetch-level failures HttpFetcher classifies as "the URL itself wasn't
 * safe" rather than "the request technically failed" - these get the same
 * 400 treatment as a Step 02 validation rejection, not a 502, since from
 * the caller's point of view they're the same kind of event (this can
 * legitimately happen even after SsrfGuard already approved the URL: a
 * redirect a HEAD-based pre-check saw as safe can behave differently on
 * the real GET request - see HttpFetcher's class docblock).
 */
const FETCH_SECURITY_ERROR_CODES = [
    FetchResult::ERROR_SSRF_BLOCKED,
    FetchResult::ERROR_INVALID_URL,
    FetchResult::ERROR_UNSAFE_REDIRECT,
];

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

// Category 03 Step 03: perform exactly one real HTTP fetch of the
// approved URL. HttpFetcher independently re-validates every URL it's
// about to connect to (the starting URL and every redirect hop) through
// the same security layer SsrfGuard already used above - it never trusts
// that this request already passed that check. See HttpFetcher's docblock.
$fetcher = new HttpFetcher();
$fetch = $fetcher->fetch($result->normalizedUrl);

if (!$fetch->success) {
    $isSecurityEvent = in_array($fetch->errorCode, FETCH_SECURITY_ERROR_CODES, true);

    // A security-relevant divergence between SsrfGuard's pre-check and
    // HttpFetcher's own re-check is unusual enough to be worth its own
    // log line, distinct from Step 02's "blocked at first submission" log.
    if ($isSecurityEvent) {
        error_log(sprintf(
            '[http-fetcher] blocked at fetch time (passed SsrfGuard pre-check): error_code=%s remote_addr=%s',
            $fetch->errorCode,
            $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ));
    } elseif ($fetch->debugDetail !== null) {
        // Technical detail (raw curl error, byte counts, etc.) is server-
        // log-only - $fetch->userFacingErrorMessage is what ever reaches
        // the response body below.
        error_log(sprintf(
            '[http-fetcher] fetch failed: error_code=%s detail=%s',
            $fetch->errorCode,
            $fetch->debugDetail
        ));
    }

    http_response_code($isSecurityEvent ? 400 : 502);
    echo json_encode([
        'normalized_url' => $result->normalizedUrl,
        'fetch' => [
            'success' => false,
            'error_code' => $fetch->errorCode,
            'message' => $fetch->userFacingErrorMessage,
        ],
    ]);
    exit;
}

http_response_code(200);
echo json_encode([
    'normalized_url' => $result->normalizedUrl,
    'fetch' => [
        'success' => true,
        'requested_url' => $fetch->requestedUrl,
        'final_url' => $fetch->finalUrl,
        'status_code' => $fetch->statusCode,
        'content_type' => $fetch->contentType,
        'content_category' => $fetch->contentCategory,
        'content_length' => $fetch->contentLength,
        'duration_ms' => $fetch->durationMs,
        'redirect_count' => $fetch->redirectCount,
        'retry_count' => $fetch->retryCount,
    ],
    // Deliberately not "we analyzed your website" - a raw HTTP fetch is
    // not SEO analysis, and this project never claims otherwise.
    'message' => 'We successfully connected to your website and retrieved basic technical information. ' .
        'Full SEO analysis (scoring, recommendations, and page content checks) has not been implemented yet.',
]);
