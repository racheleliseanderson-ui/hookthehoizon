<?php
/**
 * Resilient Compatibility Builder bridge.
 *
 * The canonical hook-content shortcode remains the preferred runtime. The
 * theme-owned local fallback is used only while an older installed plugin does
 * not yet register that shortcode.
 */
declare(strict_types=1);

defined('ABSPATH') || exit;

/** Render the theme-owned local Compatibility Builder fallback. */
function hth_render_system_compatibility_theme_fallback(): string
{
    $src = get_theme_file_uri('assets/system-compatibility/index.html');

    return sprintf(
        '<div class="hth-compatibility-frame"><iframe src="%1$s" title="Hook the Horizon Compatibility Builder" loading="eager" sandbox="allow-scripts allow-downloads allow-forms allow-same-origin" referrerpolicy="same-origin"></iframe><noscript><p>JavaScript is required for the local compatibility evaluator. No setup facts are sent to WordPress.</p></noscript></div>',
        esc_url($src)
    );
}

/** Prefer the plugin implementation and fail over to the theme-owned application. */
function hth_render_system_compatibility_resilient_shortcode(): string
{
    if (shortcode_exists('hth_system_compatibility')) {
        return do_shortcode('[hth_system_compatibility]');
    }

    return hth_render_system_compatibility_theme_fallback();
}

add_shortcode('hth_system_compatibility_resilient', 'hth_render_system_compatibility_resilient_shortcode');

/**
 * Preserve the canonical page contract when an older Hook Content package is
 * active. Plugins load before themes, so this late init check does not replace
 * a plugin-owned implementation; it only fills the missing shortcode.
 */
add_action('init', static function (): void {
    if (! shortcode_exists('hth_system_compatibility')) {
        add_shortcode('hth_system_compatibility', 'hth_render_system_compatibility_theme_fallback');
    }
}, 100);
