<?php
require_once __DIR__ . '/ContentTypeClassifier.php';

/**
 * Category 03 Step 03: the structured outcome of HttpFetcher::fetch() -
 * what future crawler code (Step 04+, HtmlParser) consumes instead of
 * inspecting curl internals or catching exceptions. Deliberately separates
 * request/response/redirect/timing/error concerns into distinct fields
 * rather than one flat grab-bag.
 *
 * $userFacingErrorMessage is the only field this project's UI code should
 * ever render directly to a visitor - $errorCode is a stable,
 * machine-readable reason for logs/future logic, and $debugDetail (present
 * only on failure, and only ever intended for error_log(), never for a
 * client response) carries the raw technical detail (curl error string,
 * etc.) - mirrors ValidationResult's userMessage/reason split from Step 02.
 */
final class FetchResult
{
    public const ERROR_INVALID_URL = 'invalid_url';
    public const ERROR_SSRF_BLOCKED = 'ssrf_blocked';
    public const ERROR_DNS = 'dns';
    public const ERROR_TIMEOUT = 'timeout';
    public const ERROR_SSL = 'ssl';
    public const ERROR_CONNECTION_RESET = 'connection_reset';
    public const ERROR_TOO_LARGE = 'too_large';
    public const ERROR_TOO_MANY_REDIRECTS = 'too_many_redirects';
    public const ERROR_REDIRECT_LOOP = 'redirect_loop';
    public const ERROR_UNSAFE_REDIRECT = 'unsafe_redirect';
    public const ERROR_TOTAL_DURATION_EXCEEDED = 'total_duration_exceeded';
    public const ERROR_NETWORK = 'network_error';

    private function __construct(
        public readonly bool $success,
        public readonly string $requestedUrl,
        public readonly ?string $finalUrl,
        public readonly ?int $statusCode,
        /** @var array<string,string> lowercased header name => value; Set-Cookie is deliberately never stored here (see HttpFetcher). */
        public readonly array $headers,
        public readonly ?string $contentType,
        /** One of ContentTypeClassifier's category constants. */
        public readonly ?string $contentCategory,
        /** Actual bytes received (post any decompression), not a trusted Content-Length header. */
        public readonly ?int $contentLength,
        public readonly ?string $body,
        public readonly int $durationMs,
        public readonly int $redirectCount,
        /** @var list<string> every URL visited before finalUrl, in order. */
        public readonly array $redirectHistory,
        public readonly int $retryCount,
        public readonly ?string $errorCode,
        public readonly ?string $userFacingErrorMessage,
        public readonly ?string $debugDetail,
    ) {
    }

    public static function success(
        string $requestedUrl,
        string $finalUrl,
        int $statusCode,
        array $headers,
        ?string $contentType,
        ?int $contentLength,
        ?string $body,
        int $durationMs,
        array $redirectHistory,
        int $retryCount,
    ): self {
        return new self(
            success: true,
            requestedUrl: $requestedUrl,
            finalUrl: $finalUrl,
            statusCode: $statusCode,
            headers: $headers,
            contentType: $contentType,
            contentCategory: ContentTypeClassifier::classify($contentType),
            contentLength: $contentLength,
            body: $body,
            durationMs: $durationMs,
            redirectCount: count($redirectHistory),
            redirectHistory: $redirectHistory,
            retryCount: $retryCount,
            errorCode: null,
            userFacingErrorMessage: null,
            debugDetail: null,
        );
    }

    public static function failure(
        string $requestedUrl,
        ?string $finalUrl,
        string $errorCode,
        string $userFacingErrorMessage,
        int $durationMs,
        array $redirectHistory = [],
        int $retryCount = 0,
        ?string $debugDetail = null,
    ): self {
        return new self(
            success: false,
            requestedUrl: $requestedUrl,
            finalUrl: $finalUrl,
            statusCode: null,
            headers: [],
            contentType: null,
            contentCategory: null,
            contentLength: null,
            body: null,
            durationMs: $durationMs,
            redirectCount: count($redirectHistory),
            redirectHistory: $redirectHistory,
            retryCount: $retryCount,
            errorCode: $errorCode,
            userFacingErrorMessage: $userFacingErrorMessage,
            debugDetail: $debugDetail,
        );
    }
}
