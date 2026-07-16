<?php
/**
 * Plugin Name: Hook the Horizon Content
 * Description: Durable content models for Hook the Horizon.
 * Version: 0.1.2
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Text Domain: hook-the-horizon-content
 */
declare(strict_types=1);
defined('ABSPATH') || exit;

const HTH_CONTENT_VERSION = '0.1.2';
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
