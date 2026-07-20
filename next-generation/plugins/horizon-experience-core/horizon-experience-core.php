<?php
/**
 * Plugin Name: Hook the Horizon Experience Core
 * Description: Publication-owned field files, condition states, and decision metadata for the Hook the Horizon clean rebuild.
 * Version: 0.1.0
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Author: Rachel Anderson
 * Text Domain: horizon-experience-core
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

const HTH_EXPERIENCE_CORE_VERSION = '0.1.0';

function hth_experience_core_register_types(): void
{
    register_post_type(
        'hth_field_file',
        [
            'labels' => [
                'name' => __('Field Files', 'horizon-experience-core'),
                'singular_name' => __('Field File', 'horizon-experience-core'),
                'add_new_item' => __('Add Field File', 'horizon-experience-core'),
                'edit_item' => __('Edit Field File', 'horizon-experience-core'),
                'view_item' => __('View Field File', 'horizon-experience-core'),
                'search_items' => __('Search Field Files', 'horizon-experience-core'),
                'not_found' => __('No field files found.', 'horizon-experience-core'),
            ],
            'public' => true,
            'show_in_rest' => true,
            'has_archive' => true,
            'rewrite' => ['slug' => 'field-files', 'with_front' => false],
            'menu_icon' => 'dashicons-location-alt',
            'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'custom-fields'],
        ]
    );

    register_taxonomy(
        'hth_file_type',
        ['hth_field_file'],
        [
            'labels' => [
                'name' => __('Field File Types', 'horizon-experience-core'),
                'singular_name' => __('Field File Type', 'horizon-experience-core'),
            ],
            'public' => true,
            'show_in_rest' => true,
            'hierarchical' => true,
            'rewrite' => ['slug' => 'field-file-type', 'with_front' => false],
        ]
    );
}
add_action('init', 'hth_experience_core_register_types');

function hth_experience_core_register_meta(): void
{
    $string_fields = [
        'hth_reader_job',
        'hth_observed_conditions',
        'hth_source_time',
        'hth_confidence_state',
        'hth_uncertainty',
        'hth_regulation_state',
        'hth_location_privacy_state',
        'hth_next_adjustment',
        'hth_stop_condition',
        'hth_image_state',
    ];

    foreach ($string_fields as $field) {
        register_post_meta(
            'hth_field_file',
            $field,
            [
                'type' => 'string',
                'single' => true,
                'default' => '',
                'sanitize_callback' => 'sanitize_textarea_field',
                'auth_callback' => static fn (): bool => current_user_can('edit_posts'),
                'show_in_rest' => [
                    'schema' => [
                        'type' => 'string',
                        'context' => ['view', 'edit'],
                    ],
                ],
            ]
        );
    }
}
add_action('init', 'hth_experience_core_register_meta');

function hth_experience_core_admin_notice(): void
{
    if (! current_user_can('manage_options')) {
        return;
    }

    echo '<div class="notice notice-warning"><p>';
    echo esc_html__('Hook the Horizon Experience Core is a clean-rebuild candidate. Activation does not authorize migration, publication, deployment, or replacement of the current production package.', 'horizon-experience-core');
    echo '</p></div>';
}
add_action('admin_notices', 'hth_experience_core_admin_notice');
