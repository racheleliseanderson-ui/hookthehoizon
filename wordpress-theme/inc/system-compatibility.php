<?php
/**
 * Temporary theme bridge for the canonical Compatibility Builder until hook-content 0.3.0 is deployed.
 */
declare(strict_types=1);

defined('ABSPATH') || exit;

add_shortcode('hth_system_compatibility_runtime', static function (): string {
    $src = get_theme_file_uri('assets/system-compatibility/index.html');
    return sprintf(
        '<div class="hth-compatibility-frame"><iframe src="%1$s" title="Hook the Horizon Compatibility Builder" loading="eager" sandbox="allow-scripts allow-downloads allow-forms allow-same-origin" referrerpolicy="same-origin"></iframe><noscript><p>JavaScript is required for the local compatibility evaluator. No setup facts are sent to WordPress.</p></noscript></div>',
        esc_url($src)
    );
});
