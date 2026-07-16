<?php
/**
 * Plugin Name: Hook the Horizon Content
 * Description: Durable content models for Hook the Horizon.
 * Version: 0.1.1
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Text Domain: hook-the-horizon-content
 */
declare(strict_types=1);
defined('ABSPATH') || exit;

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

register_activation_hook(__FILE__, static function (): void {
    hth_register_content_types();
    flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, static function (): void {
    flush_rewrite_rules();
});
