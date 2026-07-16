<?php
/**
 * Plugin Name: Hook the Horizon Content
 * Description: Durable content models and bounded application routes for Hook the Horizon.
 * Version: 0.1.3
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Text Domain: hook-the-horizon-content
 */
declare(strict_types=1);
defined('ABSPATH') || exit;

const HTH_CONTENT_VERSION = '0.1.3';
const HTH_REWRITE_VERSION_OPTION = 'hth_content_rewrite_version';

function hth_register_content_types(): void
{
    register_post_type('hth_field_report', [
        'labels' => [
            'name' => __('Field Reports', 'hook-the-horizon-content'),
            'singular_name' => __('Field Report', 'hook-the-horizon-content'),
        ],
        'public' => true,
        'show_in_rest' => true,
        'has_archive' => 'field-reports',
        'rewrite' => ['slug' => 'field-reports', 'with_front' => false],
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions'],
    ]);

    register_post_type('hth_gear_verdict', [
        'labels' => [
            'name' => __('Gear Verdicts', 'hook-the-horizon-content'),
            'singular_name' => __('Gear Verdict', 'hook-the-horizon-content'),
        ],
        'public' => true,
        'show_in_rest' => true,
        'has_archive' => 'gear-verdicts',
        'rewrite' => ['slug' => 'gear-verdicts', 'with_front' => false],
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions'],
    ]);

    register_taxonomy('hth_water_type', ['post', 'hth_field_report', 'hth_gear_verdict'], [
        'labels' => [
            'name' => __('Water Types', 'hook-the-horizon-content'),
            'singular_name' => __('Water Type', 'hook-the-horizon-content'),
        ],
        'public' => true,
        'show_in_rest' => true,
        'hierarchical' => true,
        'rewrite' => ['slug' => 'water-types', 'with_front' => false],
    ]);
}
add_action('init', 'hth_register_content_types');

function hth_register_application_assets(): void
{
    wp_register_style(
        'hth-presentation-planner-shell',
        plugins_url('assets/presentation-planner-shell.css', __FILE__),
        [],
        HTH_CONTENT_VERSION
    );
}
add_action('wp_enqueue_scripts', 'hth_register_application_assets');

/**
 * Render the local-first Presentation Planner in an isolated application frame.
 *
 * The iframe asset is packaged from the canonical applications source during the
 * release build. It does not receive WordPress cookies, user identity, precise
 * location, post content, or server-side state from this shortcode.
 */
function hth_render_presentation_planner_shortcode(array $attributes = []): string
{
    $attributes = shortcode_atts([
        'title' => __('Horizon Smart Mode Presentation Planner', 'hook-the-horizon-content'),
        'height' => '980',
    ], $attributes, 'hth_presentation_planner');

    $height = max(640, min(1800, absint($attributes['height'])));
    $title = sanitize_text_field((string) $attributes['title']);
    $source = plugins_url('assets/presentation-planner/preview/index.html', __FILE__);

    wp_enqueue_style('hth-presentation-planner-shell');

    ob_start();
    ?>
    <section class="hth-application-embed" aria-labelledby="hth-presentation-planner-heading">
        <header class="hth-application-embed__header">
            <p class="hth-application-embed__eyebrow"><?php esc_html_e('Hook the Horizon application', 'hook-the-horizon-content'); ?></p>
            <h2 id="hth-presentation-planner-heading"><?php echo esc_html($title); ?></h2>
            <p><?php esc_html_e('The planner runs locally in your browser. It does not request exact location, create an account, or send inventory and outcome history to WordPress.', 'hook-the-horizon-content'); ?></p>
        </header>
        <div class="hth-application-embed__frame-wrap">
            <iframe
                class="hth-application-embed__frame"
                src="<?php echo esc_url($source); ?>"
                title="<?php echo esc_attr($title); ?>"
                height="<?php echo esc_attr((string) $height); ?>"
                loading="lazy"
                referrerpolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-downloads"
            ></iframe>
        </div>
        <noscript>
            <p class="hth-application-embed__notice"><?php esc_html_e('Presentation Planner requires JavaScript for its local deterministic calculations. No external analytics or recommendation service is required.', 'hook-the-horizon-content'); ?></p>
        </noscript>
    </section>
    <?php
    return (string) ob_get_clean();
}
add_shortcode('hth_presentation_planner', 'hth_render_presentation_planner_shortcode');

function hth_maybe_refresh_rewrite_rules(): void
{
    if (get_option(HTH_REWRITE_VERSION_OPTION) === HTH_CONTENT_VERSION) {
        return;
    }

    flush_rewrite_rules(false);
    update_option(HTH_REWRITE_VERSION_OPTION, HTH_CONTENT_VERSION, false);
}
add_action('init', 'hth_maybe_refresh_rewrite_rules', 99);

register_activation_hook(__FILE__, static function (): void {
    hth_register_content_types();
    flush_rewrite_rules();
    update_option(HTH_REWRITE_VERSION_OPTION, HTH_CONTENT_VERSION, false);
});

register_deactivation_hook(__FILE__, static function (): void {
    flush_rewrite_rules();
    delete_option(HTH_REWRITE_VERSION_OPTION);
});
