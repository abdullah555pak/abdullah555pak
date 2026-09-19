<?php
/**
 * "What should I fix first?" - shared between the Overview and Action
 * Plan sections, same as apps/web's PrioritySummary component. Always
 * the empty state today: nothing has ever been analyzed.
 *
 * @var string|null $priority_summary_heading_level Heading tag to use
 *   ('h2' or 'h3'). Defaults to 'h2', which is correct when this sits
 *   as a sibling of the page's other top-level sections (Overview).
 *   report.php passes 'h3' when including this inside the Action Plan
 *   section, since there it's a subsection of that section's own h2,
 *   not a peer of it - keeps the heading hierarchy from skipping/
 *   flattening levels (Step 08 accessibility audit).
 */
$heading_tag = $priority_summary_heading_level ?? 'h2';
if (!in_array($heading_tag, ['h2', 'h3'], true)) {
    $heading_tag = 'h2';
}
?>
<div class="card">
  <<?= $heading_tag ?> class="card-title">What should I fix first?</<?= $heading_tag ?>>
  <div class="u-mt-1">
    <p class="empty-state__title">Real scan data is not available yet</p>
    <p class="empty-state__desc">This section will show real results once the analysis engine that checks it has been built.</p>
  </div>
</div>
<?php unset($priority_summary_heading_level, $heading_tag); ?>
