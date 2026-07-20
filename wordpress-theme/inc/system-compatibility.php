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

add_shortcode('hth_system_compatibility_resilient', static function (): string {
    if (shortcode_exists('hth_system_compatibility')) {
        return do_shortcode('[hth_system_compatibility]');
    }

    $src = get_theme_file_uri('assets/system-compatibility/index.html');
    return sprintf(
        '<div class="hth-compatibility-frame"><iframe src="%1$s" title="Hook the Horizon Compatibility Builder" loading="eager" sandbox="allow-scripts allow-downloads allow-forms allow-same-origin" referrerpolicy="same-origin"></iframe><noscript><p>JavaScript is required for the local compatibility evaluator. No setup facts are sent to WordPress.</p></noscript></div>',
        esc_url($src)
    );
});
