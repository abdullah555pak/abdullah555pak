<?php
/**
 * Category 03 Step 03: turns a raw Content-Type response header into one of
 * a small set of categories the future crawler needs to make decisions on
 * (mainly: "is this HTML worth parsing?"). Pure and stateless - no network,
 * no security decisions - kept separate from HttpFetcher purely so it's
 * trivially unit-testable on its own.
 */
final class ContentTypeClassifier
{
    public const HTML = 'html';
    public const XHTML = 'xhtml';
    public const JSON = 'json';
    public const TEXT = 'text';
    public const IMAGE = 'image';
    public const BINARY = 'binary';
    public const OTHER = 'other';
    public const UNKNOWN = 'unknown';

    public static function classify(?string $contentTypeHeader): string
    {
        if ($contentTypeHeader === null || trim($contentTypeHeader) === '') {
            return self::UNKNOWN;
        }

        // A Content-Type header is "type/subtype; charset=...; boundary=..." -
        // only the type/subtype portion before the first ';' matters here.
        $mime = strtolower(trim(explode(';', $contentTypeHeader, 2)[0]));

        return match (true) {
            $mime === 'text/html' => self::HTML,
            $mime === 'application/xhtml+xml' => self::XHTML,
            $mime === 'application/json' || str_ends_with($mime, '+json') => self::JSON,
            str_starts_with($mime, 'text/') => self::TEXT,
            str_starts_with($mime, 'image/') => self::IMAGE,
            in_array($mime, [
                'application/pdf',
                'application/zip',
                'application/octet-stream',
                'application/x-gzip',
                'application/gzip',
                'font/woff',
                'font/woff2',
            ], true) || str_starts_with($mime, 'audio/') || str_starts_with($mime, 'video/') || str_starts_with($mime, 'font/') => self::BINARY,
            $mime !== '' => self::OTHER,
            default => self::UNKNOWN,
        };
    }

    /** Whether the future HtmlParser step should ever be handed this body. */
    public static function isHtmlLike(string $category): bool
    {
        return $category === self::HTML || $category === self::XHTML;
    }
}
