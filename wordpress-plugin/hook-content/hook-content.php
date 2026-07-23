<?php
/**
 * Plugin Name: Hook the Horizon Content
 * Description: Durable content models, bounded application routes, publication visibility, and sensitive-location safeguards for Hook the Horizon.
 * Version: 0.3.1
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Text Domain: hook-the-horizon-content
 */
declare(strict_types=1);
defined('ABSPATH') || exit;

const HTH_CONTENT_VERSION = '0.3.1';
const HTH_REWRITE_VERSION_OPTION = 'hth_content_rewrite_version';

require_once __DIR__ . '/includes/publication-visibility.php';

function hth_register_content_types(): void
{
    register_post_type('hth_field_report', [
        'labels' => ['name' => __('Field Reports', 'hook-the-horizon-content'), 'singular_name' => __('Field Report', 'hook-the-horizon-content')],
        'public' => true, 'show_in_rest' => true, 'has_archive' => 'field-reports',
        'rewrite' => ['slug' => 'field-reports', 'with_front' => false],
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions'],
    ]);
    register_post_type('hth_gear_verdict', [
        'labels' => ['name' => __('Gear Verdicts', 'hook-the-horizon-content'), 'singular_name' => __('Gear Verdict', 'hook-the-horizon-content')],
        'public' => true, 'show_in_rest' => true, 'has_archive' => 'gear-verdicts',
        'rewrite' => ['slug' => 'gear-verdicts', 'with_front' => false],
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions'],
    ]);
    register_taxonomy('hth_water_type', ['post', 'hth_field_report', 'hth_gear_verdict'], [
        'labels' => ['name' => __('Water Types', 'hook-the-horizon-content'), 'singular_name' => __('Water Type', 'hook-the-horizon-content')],
        'public' => true, 'show_in_rest' => true, 'hierarchical' => true,
        'rewrite' => ['slug' => 'water-types', 'with_front' => false],
    ]);
}
add_action('init', 'hth_register_content_types');

function hth_register_application_assets(): void
{
    wp_register_style('hth-application-shell', plugins_url('assets/presentation-planner-shell.css', __FILE__), [], HTH_CONTENT_VERSION);
}
add_action('wp_enqueue_scripts', 'hth_register_application_assets');

/**
 * Render a bounded local application frame.
 *
 * The helper does not pass WordPress identity, post content, exact-location data,
 * or server-side state into the application. The credentialless attribute is a
 * browser-supported defense in depth; the sandbox permissions remain limited to
 * the module runtime, client-side form handling, and user-requested downloads.
 */
function hth_render_local_application_frame(string $application, string $title, int $height, string $description, string $no_script): string
{
    static $instance = 0;
    $instance++;
    $height = max(640, min(2200, $height));
    $source = plugins_url(sprintf('assets/%s/preview/index.html', $application), __FILE__);
    wp_enqueue_style('hth-application-shell');
    $heading_id = sprintf('hth-%s-heading-%d', sanitize_html_class($application), $instance);

    ob_start();
    ?>
    <section class="hth-application-embed" aria-labelledby="<?php echo esc_attr($heading_id); ?>">
        <header class="hth-application-embed__header">
            <p class="hth-application-embed__eyebrow"><?php esc_html_e('Hook the Horizon application', 'hook-the-horizon-content'); ?></p>
            <h2 id="<?php echo esc_attr($heading_id); ?>"><?php echo esc_html($title); ?></h2>
            <p><?php echo esc_html($description); ?></p>
        </header>
        <div class="hth-application-embed__frame-wrap">
            <iframe class="hth-application-embed__frame" src="<?php echo esc_url($source); ?>" title="<?php echo esc_attr($title); ?>" height="<?php echo esc_attr((string) $height); ?>" loading="lazy" referrerpolicy="no-referrer" credentialless sandbox="allow-scripts allow-same-origin allow-downloads allow-forms"></iframe>
        </div>
        <noscript><p class="hth-application-embed__notice"><?php echo esc_html($no_script); ?></p></noscript>
    </section>
    <?php
    return (string) ob_get_clean();
}

/** @param array<int,array{label:string,href:string}> $links */
function hth_render_application_continuations(string $heading, string $prompt, array $links): string
{
    ob_start();
    ?>
    <nav class="hth-application-continuations" aria-label="<?php echo esc_attr($heading); ?>">
        <h2><?php echo esc_html($heading); ?></h2>
        <p><?php echo esc_html($prompt); ?></p>
        <ul>
            <?php foreach ($links as $link) : ?>
                <li><a href="<?php echo esc_url($link['href']); ?>"><?php echo esc_html($link['label']); ?></a></li>
            <?php endforeach; ?>
        </ul>
    </nav>
    <?php
    return (string) ob_get_clean();
}

function hth_render_presentation_planner_shortcode(array $attributes = []): string
{
    $attributes = shortcode_atts(['title' => __('Horizon Smart Mode Presentation Planner', 'hook-the-horizon-content'), 'height' => '980'], $attributes, 'hth_presentation_planner');
    $application = hth_render_local_application_frame('presentation-planner', sanitize_text_field((string) $attributes['title']), absint($attributes['height']), __('The planner runs locally in your browser. It does not request exact location, create an account, or send inventory and outcome history to WordPress.', 'hook-the-horizon-content'), __('Presentation Planner requires JavaScript for its local deterministic calculations. No external analytics or recommendation service is required.', 'hook-the-horizon-content'));
    $continuations = hth_render_application_continuations(
        __('After the result', 'hook-the-horizon-content'),
        __('Confirm the setup, verify current conditions, and change one major variable during the field test.', 'hook-the-horizon-content'),
        [
            ['label' => __('Check whether the complete setup works together', 'hook-the-horizon-content'), 'href' => '/compatibility-builder/'],
            ['label' => __('Verify current trip conditions and access', 'hook-the-horizon-content'), 'href' => '/honey-hole-intelligence/'],
            ['label' => __('Open supporting field files', 'hook-the-horizon-content'), 'href' => '/field-files/'],
            ['label' => __('Return to Start Here', 'hook-the-horizon-content'), 'href' => '/start-here/'],
        ]
    );
    return $application . $continuations;
}
add_shortcode('hth_presentation_planner', 'hth_render_presentation_planner_shortcode');

function hth_render_system_compatibility_shortcode(array $attributes = []): string
{
    $attributes = shortcode_atts(['title' => __('Rod, Reel, Line, Leader, and Lure Compatibility Builder', 'hook-the-horizon-content'), 'height' => '1320'], $attributes, 'hth_system_compatibility');
    return hth_render_local_application_frame('system-compatibility', sanitize_text_field((string) $attributes['title']), absint($attributes['height']), __('The builder runs locally and evaluates only the ratings and broad conditions you enter. It rejects exact-location fields and does not use affiliate status in the result.', 'hook-the-horizon-content'), __('System Compatibility requires JavaScript for its local deterministic checks. Use manufacturer ratings and the printable worksheet when JavaScript is unavailable.', 'hook-the-horizon-content'));
}
add_shortcode('hth_system_compatibility', 'hth_render_system_compatibility_shortcode');

function hth_maybe_refresh_rewrite_rules(): void
{
    if (get_option(HTH_REWRITE_VERSION_OPTION) === HTH_CONTENT_VERSION) return;
    flush_rewrite_rules(false);
    update_option(HTH_REWRITE_VERSION_OPTION, HTH_CONTENT_VERSION, false);
}
add_action('init', 'hth_maybe_refresh_rewrite_rules', 99);

add_filter('wp_read_image_metadata', static function ($metadata) {
    if (!is_array($metadata)) return $metadata;
    foreach (['latitude', 'longitude', 'location', 'gps', 'GPSLatitude', 'GPSLongitude', 'GPSPosition'] as $key) unset($metadata[$key]);
    return $metadata;
}, 10, 1);

add_filter('rest_prepare_attachment', static function (WP_REST_Response $response): WP_REST_Response {
    $data = $response->get_data();
    if (isset($data['media_details']['image_meta']) && is_array($data['media_details']['image_meta'])) {
        foreach (['latitude', 'longitude', 'location', 'gps', 'GPSLatitude', 'GPSLongitude', 'GPSPosition'] as $key) unset($data['media_details']['image_meta'][$key]);
        $response->set_data($data);
    }
    return $response;
});

RE_Publication_Visibility::boot([
    'name' => 'Hook the Horizon', 'domain' => 'https://hookthehorizon.blog/',
    'description' => 'Field-led fishing intelligence covering water, conditions, technique, equipment, species, destinations, safety, and stewardship.',
    'text_domain' => 'hook-the-horizon-content', 'post_types' => ['post', 'page', 'hth_field_report', 'hth_gear_verdict'],
    'article_types' => ['post', 'hth_field_report', 'hth_gear_verdict'],
]);

register_activation_hook(__FILE__, static function (): void { hth_register_content_types(); flush_rewrite_rules(); update_option(HTH_REWRITE_VERSION_OPTION, HTH_CONTENT_VERSION, false); });
register_deactivation_hook(__FILE__, static function (): void { flush_rewrite_rules(); delete_option(HTH_REWRITE_VERSION_OPTION); });
