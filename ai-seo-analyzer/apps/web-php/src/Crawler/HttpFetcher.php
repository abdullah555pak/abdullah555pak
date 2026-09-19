<?php
require_once __DIR__ . '/HttpFetcherConfig.php';
require_once __DIR__ . '/RetryPolicy.php';
require_once __DIR__ . '/FetchResult.php';
require_once __DIR__ . '/ContentTypeClassifier.php';
require_once __DIR__ . '/UrlSafetyCheckerInterface.php';

/**
 * Category 03 Step 03: fetches exactly one already-approved URL over
 * HTTP(S) and returns a structured FetchResult. This is a network-fetching
 * component only - it never parses HTML for SEO facts (that is a later
 * step's HtmlParser) and never fetches more than the one URL/redirect
 * chain it was asked for (no queue, no link discovery, no multi-page
 * crawl - all explicitly out of scope for this step).
 *
 * Security: every single URL this class is about to connect to - the
 * originally requested one AND every redirect hop after it - goes through
 * $safetyChecker (real validate_public_url() in production; see
 * UrlSafetyCheckerInterface's docblock for why tests can swap it) before
 * any curl_init() happens. There is no code path here that skips this
 * check; a caller handing this class a raw, unvalidated browser-submitted
 * URL is exactly the intended, safe way to use it - this class does not
 * trust that URL either, it re-derives safety itself.
 *
 * Redirects are never auto-followed by curl (CURLOPT_FOLLOWLOCATION is
 * always false) specifically so each hop's destination can be validated
 * before it is ever connected to - a public URL redirecting to a private
 * IP, localhost, or a disallowed scheme is refused at that hop, exactly
 * like Step 02's SsrfGuard does for its own (HEAD-only, pre-check) probe.
 * This class does its own, independent re-validation on real GET requests
 * because a server can legitimately behave differently for GET than HEAD
 * - passing SsrfGuard's earlier check is not treated as a substitute for
 * this.
 */
final class HttpFetcher
{
    private HttpFetcherConfig $config;
    private UrlSafetyCheckerInterface $safetyChecker;
    private RetryPolicy $retryPolicy;

    public function __construct(
        ?HttpFetcherConfig $config = null,
        ?UrlSafetyCheckerInterface $safetyChecker = null,
        ?RetryPolicy $retryPolicy = null,
    ) {
        $this->config = $config ?? HttpFetcherConfig::fromEnv();
        $this->safetyChecker = $safetyChecker ?? new DefaultUrlSafetyChecker();
        $this->retryPolicy = $retryPolicy ?? new RetryPolicy(
            $this->config->maxRetries,
            $this->config->retryBaseDelayMs,
            $this->config->maxRetryDelayMs,
        );
    }

    public function fetch(string $url): FetchResult
    {
        $startedAt = microtime(true);
        $requestedUrl = $url;
        $currentUrl = $url;
        $visited = [];
        $redirectHistory = [];
        $totalRetries = 0;

        for ($hop = 0; $hop <= $this->config->maxRedirects; $hop++) {
            if ($this->elapsedSeconds($startedAt) >= $this->config->maxTotalDurationSeconds) {
                return FetchResult::failure(
                    $requestedUrl,
                    $currentUrl,
                    FetchResult::ERROR_TOTAL_DURATION_EXCEEDED,
                    'This website took too long to analyze overall.',
                    $this->elapsedMs($startedAt),
                    $redirectHistory,
                    $totalRetries,
                );
            }

            try {
                $resolvedIp = $this->safetyChecker->checkAndResolve($currentUrl);
            } catch (UnsafeURLException $e) {
                $errorCode = $hop === 0
                    ? ($e->isSecurityBlock ? FetchResult::ERROR_SSRF_BLOCKED : FetchResult::ERROR_INVALID_URL)
                    : FetchResult::ERROR_UNSAFE_REDIRECT;
                return FetchResult::failure(
                    $requestedUrl,
                    $currentUrl,
                    $errorCode,
                    $e->getMessage(),
                    $this->elapsedMs($startedAt),
                    $redirectHistory,
                    $totalRetries,
                    debugDetail: $hop === 0 ? null : "blocked redirect target at hop {$hop}: {$e->getMessage()}",
                );
            }

            if (in_array($currentUrl, $visited, true)) {
                return FetchResult::failure(
                    $requestedUrl,
                    $currentUrl,
                    FetchResult::ERROR_REDIRECT_LOOP,
                    "This website redirects in a loop and can't be analyzed.",
                    $this->elapsedMs($startedAt),
                    $redirectHistory,
                    $totalRetries,
                );
            }
            $visited[] = $currentUrl;

            $hopResult = $this->fetchOneHopWithRetries($currentUrl, $resolvedIp, $startedAt);
            $totalRetries += $hopResult['retries'];

            if ($hopResult['kind'] === 'failure') {
                return FetchResult::failure(
                    $requestedUrl,
                    $currentUrl,
                    $hopResult['errorCode'],
                    $hopResult['message'],
                    $this->elapsedMs($startedAt),
                    $redirectHistory,
                    $totalRetries,
                    debugDetail: $hopResult['debug'] ?? null,
                );
            }

            if ($hopResult['kind'] === 'redirect') {
                if ($hop === $this->config->maxRedirects) {
                    return FetchResult::failure(
                        $requestedUrl,
                        $currentUrl,
                        FetchResult::ERROR_TOO_MANY_REDIRECTS,
                        "This website redirects too many times and can't be analyzed.",
                        $this->elapsedMs($startedAt),
                        $redirectHistory,
                        $totalRetries,
                    );
                }
                $redirectHistory[] = $currentUrl;
                $currentUrl = $hopResult['location'];
                continue;
            }

            // Terminal response - success, regardless of HTTP status code.
            return FetchResult::success(
                $requestedUrl,
                $currentUrl,
                $hopResult['statusCode'],
                $hopResult['headers'],
                $hopResult['contentType'],
                $hopResult['bodyBytes'],
                $hopResult['body'],
                $this->elapsedMs($startedAt),
                $redirectHistory,
                $totalRetries,
            );
        }

        // Unreachable: the hop===maxRedirects branch above always returns
        // before a next iteration would start. Kept as a safety net so this
        // method can never fall through without returning a FetchResult.
        return FetchResult::failure(
            $requestedUrl,
            $currentUrl,
            FetchResult::ERROR_TOO_MANY_REDIRECTS,
            "This website redirects too many times and can't be analyzed.",
            $this->elapsedMs($startedAt),
            $redirectHistory,
            $totalRetries,
        );
    }

    /**
     * Runs one hop to completion, including any retries this hop's own
     * failure/status code is entitled to. Retries never cross a redirect
     * boundary - each hop gets its own retry budget (RetryPolicy is
     * consulted fresh per hop), matching the blueprint's "max retries per
     * URL," not per whole redirect chain.
     *
     * @return array{kind:string, retries:int, ...}
     */
    private function fetchOneHopWithRetries(string $url, string $resolvedIp, float $startedAt): array
    {
        $attempts = 0;

        while (true) {
            $attempts++;

            if ($this->elapsedSeconds($startedAt) >= $this->config->maxTotalDurationSeconds) {
                return [
                    'kind' => 'failure',
                    'errorCode' => FetchResult::ERROR_TOTAL_DURATION_EXCEEDED,
                    'message' => 'This website took too long to analyze overall.',
                    'debug' => null,
                    'retries' => $attempts - 1,
                ];
            }

            $raw = $this->executeSingleRequest($url, $resolvedIp);

            if (!$raw['ok']) {
                $errorCode = $raw['errorCode'];
                if ($errorCode !== FetchResult::ERROR_TOO_LARGE
                    && $this->retryPolicy->isRetryableErrorCode($errorCode)
                    && $this->retryPolicy->hasRetriesLeft($attempts)
                ) {
                    $this->sleepMs($this->retryPolicy->delayMsFor($attempts, null));
                    continue;
                }
                return [
                    'kind' => 'failure',
                    'errorCode' => $errorCode,
                    'message' => $raw['message'],
                    'debug' => $raw['debug'],
                    'retries' => $attempts - 1,
                ];
            }

            $statusCode = $raw['statusCode'];
            if ($this->retryPolicy->isRetryableStatus($statusCode) && $this->retryPolicy->hasRetriesLeft($attempts)) {
                $this->sleepMs($this->retryPolicy->delayMsFor($attempts, $statusCode, $raw['headers']));
                continue;
            }

            if ($statusCode >= 300 && $statusCode < 400 && $raw['redirectUrl'] !== null) {
                return ['kind' => 'redirect', 'location' => $raw['redirectUrl'], 'retries' => $attempts - 1];
            }

            return [
                'kind' => 'terminal',
                'statusCode' => $statusCode,
                'headers' => $raw['headers'],
                'contentType' => $raw['contentType'],
                'body' => $raw['body'],
                'bodyBytes' => $raw['bodyBytes'],
                'retries' => $attempts - 1,
            ];
        }
    }

    /**
     * The only place curl is actually invoked. One request, no redirect
     * following, response body capped mid-stream (not just checked after
     * the fact), connection pinned to the pre-validated IP.
     *
     * @return array{ok:bool,...}
     */
    private function executeSingleRequest(string $url, string $resolvedIp): array
    {
        $parts = parse_url($url);
        if (!$parts || empty($parts['host']) || empty($parts['scheme'])) {
            return [
                'ok' => false,
                'errorCode' => FetchResult::ERROR_INVALID_URL,
                'message' => "That doesn't look like a valid website address.",
                'debug' => 'unparseable URL reached executeSingleRequest',
            ];
        }
        $host = $parts['host'];
        $port = $parts['port'] ?? ($parts['scheme'] === 'https' ? 443 : 80);

        $collectedHeaders = [];
        $body = '';
        $bodyBytes = 0;
        $sizeCapExceeded = false;
        $maxBytes = $this->config->maxResponseBytes;

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_HTTPGET => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT_MS => (int) round($this->config->connectTimeoutSeconds * 1000),
            CURLOPT_TIMEOUT_MS => (int) round($this->config->requestTimeoutSeconds * 1000),
            // Never let curl re-resolve the hostname - always the exact IP
            // $safetyChecker already validated for this URL (see class docblock).
            CURLOPT_RESOLVE => ["{$host}:{$port}:{$resolvedIp}"],
            CURLOPT_ENCODING => '', // negotiate + auto-decompress gzip/deflate/br if the server supports it
            CURLOPT_USERAGENT => $this->config->userAgent,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
            // Never disabled - see class docblock and docs/CRAWLER_BLUEPRINT.md
            // Step 03 notes. A broken/invalid certificate is a fetch failure,
            // not something to silently ignore.
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            // No cookie jar, no CURLOPT_COOKIE, no Authorization header, no
            // credentials of any kind are ever set - nothing from the
            // visitor's own browser session reaches the target site.
            CURLOPT_HEADERFUNCTION => function ($curlHandle, string $headerLine) use (&$collectedHeaders): int {
                $length = strlen($headerLine);
                $line = trim($headerLine);
                if ($line === '' || !str_contains($line, ':')) {
                    return $length;
                }
                [$name, $value] = explode(':', $line, 2);
                $name = strtolower(trim($name));
                if ($name === 'set-cookie') {
                    // Never stored - this project has no use for a target
                    // site's cookies, and there's no reason to retain them.
                    return $length;
                }
                $collectedHeaders[$name] = trim($value);
                return $length;
            },
            CURLOPT_WRITEFUNCTION => function ($curlHandle, string $chunk) use (&$body, &$bodyBytes, &$sizeCapExceeded, $maxBytes): int {
                $bodyBytes += strlen($chunk);
                if ($bodyBytes > $maxBytes) {
                    $sizeCapExceeded = true;
                    return 0; // any return other than strlen($chunk) aborts the transfer immediately
                }
                $body .= $chunk;
                return strlen($chunk);
            },
        ]);

        curl_exec($ch);
        $errno = curl_errno($ch);

        if ($sizeCapExceeded) {
            curl_close($ch);
            return [
                'ok' => false,
                'errorCode' => FetchResult::ERROR_TOO_LARGE,
                'message' => "That website's response was too large to analyze.",
                'debug' => "response body exceeded the {$maxBytes}-byte limit",
            ];
        }

        if ($errno !== 0) {
            $rawError = curl_error($ch);
            curl_close($ch);
            return array_merge(['ok' => false], self::classifyCurlError($errno, $rawError));
        }

        $statusCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $redirectUrl = curl_getinfo($ch, CURLINFO_REDIRECT_URL) ?: null;
        curl_close($ch);

        return [
            'ok' => true,
            'statusCode' => $statusCode,
            'headers' => $collectedHeaders,
            'body' => $body,
            'bodyBytes' => $bodyBytes,
            'contentType' => $collectedHeaders['content-type'] ?? null,
            'redirectUrl' => $redirectUrl,
        ];
    }

    /**
     * Public (not private) specifically so tests can assert the curl
     * errno → errorCode mapping directly and deterministically (e.g. "DNS
     * failure" and "TLS failure") without needing to reproduce those exact
     * network conditions against a real server - see
     * tests/run-http-fetcher-tests.php for why that's impractical here.
     *
     * @return array{errorCode:string,message:string,debug:string}
     */
    public static function classifyCurlError(int $errno, string $rawMessage): array
    {
        $debug = "curl errno {$errno}: {$rawMessage}";

        return match ($errno) {
            CURLE_COULDNT_RESOLVE_HOST => [
                'errorCode' => FetchResult::ERROR_DNS,
                'message' => "We couldn't find that website. Check the address and try again.",
                'debug' => $debug,
            ],
            CURLE_OPERATION_TIMEDOUT => [
                'errorCode' => FetchResult::ERROR_TIMEOUT,
                'message' => 'The website took too long to respond.',
                'debug' => $debug,
            ],
            CURLE_SSL_CONNECT_ERROR, CURLE_SSL_CACERT, CURLE_SSL_CERTPROBLEM, CURLE_SSL_PEER_CERTIFICATE => [
                'errorCode' => FetchResult::ERROR_SSL,
                'message' => "This website's secure connection (HTTPS) couldn't be verified.",
                'debug' => $debug,
            ],
            CURLE_COULDNT_CONNECT, CURLE_GOT_NOTHING, CURLE_RECV_ERROR, CURLE_SEND_ERROR, CURLE_PARTIAL_FILE => [
                'errorCode' => FetchResult::ERROR_CONNECTION_RESET,
                'message' => 'The connection to that website was interrupted.',
                'debug' => $debug,
            ],
            default => [
                'errorCode' => FetchResult::ERROR_NETWORK,
                'message' => "We couldn't reach that website. Please try again.",
                'debug' => $debug,
            ],
        };
    }

    private function elapsedSeconds(float $startedAt): float
    {
        return microtime(true) - $startedAt;
    }

    private function elapsedMs(float $startedAt): int
    {
        return (int) round($this->elapsedSeconds($startedAt) * 1000);
    }

    private function sleepMs(int $milliseconds): void
    {
        if ($milliseconds > 0) {
            usleep($milliseconds * 1000);
        }
    }
}
