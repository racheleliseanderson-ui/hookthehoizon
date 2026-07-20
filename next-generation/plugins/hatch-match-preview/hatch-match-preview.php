<?php
/**
 * Plugin Name: Hook the Horizon Hatch Match Preview
 * Description: Bounded, local-first biological identification preview for HTH-HM-001.
 * Version: 0.1.0-preview
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Text Domain: hth-hatch-match-preview
 */

declare(strict_types=1);
defined('ABSPATH') || exit;

const HTH_HATCH_MATCH_PREVIEW_VERSION = '0.1.0-preview';

function hth_hatch_match_preview_shortcode(array $attributes = []): string
{
    $attributes = shortcode_atts([
        'title' => __('Read the water’s tiny print.', 'hth-hatch-match-preview'),
        'height' => '1050',
    ], $attributes, 'hth_hatch_match');

    $height = max(720, min(1800, absint($attributes['height'])));
    $source = plugins_url('assets/preview/index.html', __FILE__);
    wp_enqueue_style(
        'hth-hatch-match-preview-shell',
        plugins_url('assets/preview/shell.css', __FILE__),
        [],
        HTH_HATCH_MATCH_PREVIEW_VERSION
    );

    ob_start();
    ?>
    <section class="hth-hatch-shell" aria-labelledby="hth-hatch-title">
        <header class="hth-hatch-shell__header">
            <p class="hth-hatch-shell__eyebrow"><?php esc_html_e('Hook the Horizon · Hatch Match', 'hth-hatch-match-preview'); ?></p>
            <h2 id="hth-hatch-title"><?php echo esc_html((string) $attributes['title']); ?></h2>
            <p><?php esc_html_e('Use broad water type, life stage, and visible cues to compare a small reviewed reference set. The result is an identification hypothesis—not a current hatch report, fishing promise, regulation statement, or exact-location tool.', 'hth-hatch-match-preview'); ?></p>
        </header>
        <iframe class="hth-hatch-shell__frame" src="<?php echo esc_url($source); ?>" title="<?php esc_attr_e('Hatch Match biological reference preview', 'hth-hatch-match-preview'); ?>" height="<?php echo esc_attr((string) $height); ?>" loading="lazy" referrerpolicy="no-referrer" credentialless sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
        <noscript><p><?php esc_html_e('Hatch Match requires JavaScript for local comparison. The reviewed source records remain available in the preview package.', 'hth-hatch-match-preview'); ?></p></noscript>
    </section>
    <?php
    return (string) ob_get_clean();
}
add_shortcode('hth_hatch_match', 'hth_hatch_match_preview_shortcode');

add_action('rest_api_init', static function (): void {
    register_rest_route('horizon-preview/v1', '/hatch-match-readiness', [
        'methods' => 'GET',
        'permission_callback' => static fn (): bool => current_user_can('edit_posts'),
        'callback' => static fn (): WP_REST_Response => new WP_REST_Response([
            'applicationId' => 'HTH-HM-001',
            'pluginVersion' => HTH_HATCH_MATCH_PREVIEW_VERSION,
            'publicationState' => 'approved_preview',
            'productionActivationAuthorized' => false,
            'dataOwner' => 'HTH-HM-001',
            'conditionsOwner' => 'HHI-001',
        ]),
    ]);
});
