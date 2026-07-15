<?php
/**
 * Plugin Name: Hook the Horizon Content
 * Description: Durable content models for Hook the Horizon.
 * Version: 0.1.0
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Text Domain: hook-content
 */
declare(strict_types=1);
defined('ABSPATH') || exit;

add_action('init', static function (): void {
    register_post_type('hth_field_note', [
        'labels' => ['name' => __('Field Notes', 'hook-content'), 'singular_name' => __('Field Note', 'hook-content')],
        'public' => true,
        'show_in_rest' => true,
        'has_archive' => true,
        'rewrite' => ['slug' => 'field-notes'],
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions'],
    ]);
    register_post_type('hth_gear_verdict', [
        'labels' => ['name' => __('Gear Verdicts', 'hook-content'), 'singular_name' => __('Gear Verdict', 'hook-content')],
        'public' => true,
        'show_in_rest' => true,
        'has_archive' => true,
        'rewrite' => ['slug' => 'gear-verdicts'],
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions'],
    ]);
    register_taxonomy('hth_water_type', ['post', 'hth_field_note', 'hth_gear_verdict'], [
        'labels' => ['name' => __('Water Types', 'hook-content')],
        'public' => true,
        'show_in_rest' => true,
        'hierarchical' => true,
    ]);
});
