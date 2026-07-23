<?php
/**
 * Plugin Name: Hook the Horizon Hatch Match Preview
 * Description: Bounded, local-first biological plausibility preview for HTH-HM-001.
 * Version: 0.1.1-preview
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Text Domain: hth-hatch-match-preview
 */

declare(strict_types=1);
defined('ABSPATH') || exit;

const HTH_HATCH_MATCH_PREVIEW_VERSION = '0.1.1-preview';

function hth_hatch_match_preview_shortcode(array $attributes = []): string
{
    $attributes = shortcode_atts([
        'title' => __('Read the water’s tiny print.', 'hth-hatch-match-preview'),
        'height' => '1050',
    ], $attributes, 'hth_hatch_match');

    $height = max(720, min(1800, absint($attributes['height'])));
    $source = plugins_url('assets/preview/index.html', __FILE__);
    wp_enqueue_style('hth-hatch-match-preview-shell', plugins_url('assets/preview/shell.css', __FILE__), [], HTH_HATCH_MATCH_PREVIEW_VERSION);

    ob_start();
    ?>
    <section class="hth-hatch-shell" aria-labelledby="hth-hatch-title">
        <header class="hth-hatch-shell__header">
            <p class="hth-hatch-shell__eyebrow"><?php esc_html_e('Hook the Horizon · Hatch Match', 'hth-hatch-match-preview'); ?></p>
            <h2 id="hth-hatch-title"><?php echo esc_html((string) $attributes['title']); ?></h2>
            <p><?php esc_html_e('Use broad water type, life stage, and visible cues to compare a small reviewed reference set. The result is a plausibility hypothesis—not a current hatch report, species-level certainty engine, fishing promise, regulation statement, or exact-location tool.', 'hth-hatch-match-preview'); ?></p>
        </header>
        <iframe class="hth-hatch-shell__frame" src="<?php echo esc_url($source); ?>" title="<?php esc_attr_e('Hatch Match biological plausibility preview', 'hth-hatch-match-preview'); ?>" height="<?php echo esc_attr((string) $height); ?>" loading="lazy" referrerpolicy="no-referrer" credentialless sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
        <noscript><p><?php esc_html_e('Hatch Match requires JavaScript for local comparison. The reviewed source records remain available in the preview package.', 'hth-hatch-match-preview'); ?></p></noscript>
    </section>
    <?php
    return (string) ob_get_clean();
}
add_shortcode('hth_hatch_match', 'hth_hatch_match_preview_shortcode');

/** @return array<string,mixed> */
function hth_hatch_match_read_data(string $name): array
{
    $allowed = ['seed-records.json', 'maintenance-policy.json', 'maintenance-log.json', 'runtime-manifest.json'];
    if (!in_array($name, $allowed, true)) return [];
    $path = __DIR__ . '/data/' . $name;
    if (!is_readable($path)) return [];
    $decoded = json_decode((string) file_get_contents($path), true);
    return is_array($decoded) ? $decoded : [];
}

/** @param array<string,mixed> $seed */
function hth_hatch_match_freshness_state(array $seed): string
{
    if (($seed['maintenanceState'] ?? null) !== 'active') return 'source_unavailable';
    $expires = strtotime((string) ($seed['expiresDate'] ?? ''));
    $nextReview = strtotime((string) ($seed['nextReviewDate'] ?? ''));
    if (!$expires || !$nextReview) return 'source_contract_incomplete';
    if (time() > $expires) return 'expired';
    if (time() > $nextReview) return 'review_overdue';
    return 'current_for_preview';
}

add_action('rest_api_init', static function (): void {
    register_rest_route('horizon-preview/v1', '/hatch-match-readiness', [
        'methods' => 'GET',
        'permission_callback' => static fn (): bool => current_user_can('edit_posts'),
        'callback' => static function (): WP_REST_Response {
            $seed = hth_hatch_match_read_data('seed-records.json');
            $policy = hth_hatch_match_read_data('maintenance-policy.json');
            $log = hth_hatch_match_read_data('maintenance-log.json');
            $manifest = hth_hatch_match_read_data('runtime-manifest.json');
            $sources = isset($seed['sources']) && is_array($seed['sources']) ? array_map(static fn (array $source): array => [
                'id' => $source['id'] ?? null,
                'sourceOwner' => $source['sourceOwner'] ?? null,
                'reviewedAt' => $source['reviewedAt'] ?? null,
                'nextReviewAt' => $source['nextReviewAt'] ?? null,
                'url' => $source['url'] ?? null,
            ], $seed['sources']) : [];
            $response = new WP_REST_Response([
                'applicationId' => 'HTH-HM-001',
                'pluginVersion' => HTH_HATCH_MATCH_PREVIEW_VERSION,
                'publicationState' => $seed['publicationState'] ?? 'unavailable',
                'productionActivationAuthorized' => false,
                'dataOwner' => 'HTH-HM-001',
                'conditionsOwner' => 'HHI-001',
                'plausibilityOnly' => true,
                'currentHatchReport' => false,
                'speciesLevelCertainty' => false,
                'catchPrediction' => false,
                'seedSchemaVersion' => $seed['schemaVersion'] ?? null,
                'recordCount' => isset($seed['records']) && is_array($seed['records']) ? count($seed['records']) : 0,
                'sourceCount' => count($sources),
                'sources' => $sources,
                'reviewedDate' => $seed['reviewedDate'] ?? null,
                'nextReviewDate' => $seed['nextReviewDate'] ?? null,
                'expiresDate' => $seed['expiresDate'] ?? null,
                'freshnessState' => hth_hatch_match_freshness_state($seed),
                'maintenanceState' => $seed['maintenanceState'] ?? null,
                'policyId' => $policy['policyId'] ?? null,
                'policySchemaVersion' => $policy['schemaVersion'] ?? null,
                'policyStatus' => $policy['status'] ?? null,
                'primaryOwner' => is_array($policy['primaryOwner'] ?? null) ? ($policy['primaryOwner']['name'] ?? null) : ($policy['primaryOwner'] ?? null),
                'secondaryOperationalOwner' => is_array($policy['secondaryOperationalOwner'] ?? null) ? ($policy['secondaryOperationalOwner']['role'] ?? null) : ($policy['secondaryOperationalOwner'] ?? null),
                'maintenanceEntryCount' => isset($log['entries']) && is_array($log['entries']) ? count($log['entries']) : 0,
                'runtimeManifestSchemaVersion' => $manifest['schemaVersion'] ?? null,
                'runtimeArtifacts' => array_keys(is_array($manifest['artifacts'] ?? null) ? $manifest['artifacts'] : []),
                'protectedOutputClasses' => ['coordinates', 'private-access-instructions', 'vulnerable-water-identifiers', 'contributor-sensitive-information'],
            ]);
            $response->header('Cache-Control', 'no-store, private, max-age=0');
            return $response;
        },
    ]);
});
