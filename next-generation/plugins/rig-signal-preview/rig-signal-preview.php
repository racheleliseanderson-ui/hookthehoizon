<?php
/**
 * Plugin Name: Hook the Horizon Rig Signal
 * Description: Local-first device-event evidence validator for HTH-RS-001.
 * Version: 0.1.0
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Text Domain: hth-rig-signal
 */
declare(strict_types=1);
defined('ABSPATH') || exit;

const HTH_RIG_SIGNAL_VERSION = '0.1.0';

add_shortcode('hth_rig_signal', static function (array $attributes = []): string {
    $attributes = shortcode_atts(['height' => '1500'], $attributes, 'hth_rig_signal');
    $height = max(840, min(2600, absint($attributes['height'])));
    $source = plugins_url('assets/preview/index.html', __FILE__);
    wp_enqueue_style('hth-rig-signal-shell', plugins_url('assets/shell.css', __FILE__), [], HTH_RIG_SIGNAL_VERSION);
    ob_start(); ?>
    <section class="hth-rig-signal" aria-labelledby="hth-rig-signal-title">
      <header class="hth-rig-signal__header">
        <p class="hth-rig-signal__eyebrow"><?php esc_html_e('Hook the Horizon · Rig Signal', 'hth-rig-signal'); ?></p>
        <h2 id="hth-rig-signal-title"><?php esc_html_e('Read the device claim before letting it become field truth.', 'hth-rig-signal'); ?></h2>
        <p><?php esc_html_e('Validate one location-free device or manual event against identity, maturity, evidence, calibration, uncertainty, quality, privacy, and retention boundaries.', 'hth-rig-signal'); ?></p>
      </header>
      <iframe class="hth-rig-signal__frame" src="<?php echo esc_url($source); ?>" title="<?php esc_attr_e('Rig Signal event validator', 'hth-rig-signal'); ?>" height="<?php echo esc_attr((string) $height); ?>" loading="eager" referrerpolicy="no-referrer" credentialless sandbox="allow-scripts allow-same-origin allow-downloads allow-forms"></iframe>
      <noscript><p><?php esc_html_e('Rig Signal requires JavaScript for its local contract validation. No device event is sent to WordPress.', 'hth-rig-signal'); ?></p></noscript>
      <nav class="hth-rig-signal__continuations" aria-label="<?php esc_attr_e('After the Rig Signal result', 'hth-rig-signal'); ?>">
        <h3><?php esc_html_e('After the result', 'hth-rig-signal'); ?></h3>
        <p><?php esc_html_e('Keep the event within its evidence limits before using it in a field decision.', 'hth-rig-signal'); ?></p>
        <ul>
          <li><a href="/tools/"><?php esc_html_e('Open the field systems studio', 'hth-rig-signal'); ?></a></li>
          <li><a href="/field-files/"><?php esc_html_e('Read the field-testing and evidence system', 'hth-rig-signal'); ?></a></li>
          <li><a href="/research-and-standards/"><?php esc_html_e('Inspect source, privacy, and evidence standards', 'hth-rig-signal'); ?></a></li>
          <li><a href="/start-here/"><?php esc_html_e('Return to Start Here', 'hth-rig-signal'); ?></a></li>
        </ul>
      </nav>
    </section>
    <?php return (string) ob_get_clean();
});

add_action('rest_api_init', static function (): void {
    register_rest_route('horizon-preview/v1', '/rig-signal-status', [
        'methods' => WP_REST_Server::READABLE,
        'permission_callback' => '__return_true',
        'callback' => static fn (): WP_REST_Response => new WP_REST_Response([
            'applicationId' => 'HTH-RS-001',
            'schemaVersion' => '1.0.0',
            'pluginVersion' => HTH_RIG_SIGNAL_VERSION,
            'status' => 'local_event_validator',
            'manualBaseline' => true,
            'locationIncluded' => false,
            'catchPrediction' => false,
        ], 200),
    ]);
});
