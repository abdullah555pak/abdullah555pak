<?php
/**
 * Structured outcome of SsrfGuard::checkUrlSafety() - what future crawler
 * code (Step 03+) consumes instead of catching exceptions or parsing
 * strings. Deliberately keeps the safe, beginner-facing $userMessage
 * separate from $reason, which is an internal, stable, machine-readable
 * code (never shown to a visitor - see includes/bootstrap.php's error-
 * display hardening for the same "never leak internals" principle
 * applied here at the data-shape level instead of the PHP-error level).
 */
final class ValidationResult
{
    public const STATUS_SAFE = 'safe';
    public const STATUS_BLOCKED = 'blocked';
    public const STATUS_INVALID = 'invalid';

    private function __construct(
        public readonly bool $valid,
        public readonly ?string $normalizedUrl,
        public readonly ?string $hostname,
        public readonly ?string $scheme,
        public readonly ?int $port,
        public readonly ?string $reason,
        public readonly string $userMessage,
        public readonly string $securityStatus,
        public readonly int $redirectCount = 0,
    ) {
    }

    public static function ok(string $normalizedUrl, string $hostname, string $scheme, ?int $port, int $redirectCount = 0): self
    {
        return new self(
            valid: true,
            normalizedUrl: $normalizedUrl,
            hostname: $hostname,
            scheme: $scheme,
            port: $port,
            reason: null,
            userMessage: 'This website address was accepted and validated.',
            securityStatus: self::STATUS_SAFE,
            redirectCount: $redirectCount,
        );
    }

    /**
     * @param string $securityStatus One of STATUS_BLOCKED (a real SSRF/
     *   security concern - private IP, unsafe redirect target, disallowed
     *   scheme/port) or STATUS_INVALID (a plain format problem - empty,
     *   malformed, not a security event worth treating differently).
     */
    public static function fail(string $reason, string $userMessage, string $securityStatus = self::STATUS_BLOCKED): self
    {
        return new self(
            valid: false,
            normalizedUrl: null,
            hostname: null,
            scheme: null,
            port: null,
            reason: $reason,
            userMessage: $userMessage,
            securityStatus: $securityStatus,
        );
    }
}
