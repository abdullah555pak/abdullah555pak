<?php
/**
 * PHP port of apps/web's lib/report-types.ts REPORT_CATEGORIES - the 11
 * SEO categories the (not-yet-built) analyzer will eventually check.
 * Pure data, no logic - kept in one place so report.php and any future
 * page can share it.
 */
const REPORT_CATEGORIES = [
    ['id' => 'technical-seo', 'title' => 'Technical SEO', 'description' => "Whether search engines can properly reach, read, and index your pages."],
    ['id' => 'performance', 'title' => 'Performance', 'description' => 'How quickly your pages load and respond for visitors.'],
    ['id' => 'content', 'title' => 'Content & On-Page SEO', 'description' => 'Your page titles, descriptions, headings, and written content.'],
    ['id' => 'structured-data', 'title' => 'Structured Data', 'description' => 'Extra hidden information that helps search engines understand your pages.'],
    ['id' => 'mobile-seo', 'title' => 'Mobile SEO', 'description' => 'Whether your site works well for the majority of visitors browsing on a phone.'],
    ['id' => 'accessibility', 'title' => 'Accessibility', 'description' => 'Whether people using screen readers or keyboards can use your site.'],
    ['id' => 'ads', 'title' => 'Ads & Monetization', 'description' => 'Ads, affiliate links, or other monetization signals found on your site.'],
    ['id' => 'traffic', 'title' => 'Traffic & Audience', 'description' => 'How many people visit your site and how they find it.'],
    ['id' => 'keywords', 'title' => 'Keywords', 'description' => 'Search terms your site already ranks for, and ones it could target.'],
    ['id' => 'backlinks', 'title' => 'Backlinks & Authority', 'description' => 'Other websites linking to yours.'],
    ['id' => 'competitors', 'title' => 'Competitors', 'description' => 'How your site compares to others you choose.'],
];

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'passed', 'informational'];

const SEVERITY_META = [
    'critical' => ['label' => 'Critical', 'tone' => 'critical'],
    'high' => ['label' => 'High', 'tone' => 'warn'],
    'medium' => ['label' => 'Medium', 'tone' => 'gold'],
    'low' => ['label' => 'Low', 'tone' => 'info'],
    'passed' => ['label' => 'Passed', 'tone' => 'good'],
    'informational' => ['label' => 'Informational', 'tone' => 'muted'],
];

function report_category_by_id(string $id): ?array
{
    foreach (REPORT_CATEGORIES as $category) {
        if ($category['id'] === $id) {
            return $category;
        }
    }
    return null;
}
