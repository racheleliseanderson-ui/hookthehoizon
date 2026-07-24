<?php
/** Hook the Horizon Next theme bootstrap. */
declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

function horizon_next_setup(): void {
    add_theme_support('wp-block-styles');
    add_theme_support('responsive-embeds');
    add_editor_style(['style.css', 'experience.css', 'assets/navigation.css']);
}
add_action('after_setup_theme', 'horizon_next_setup');

function horizon_next_assets(): void {
    $style_path = get_theme_file_path('style.css');
    $experience_path = get_theme_file_path('experience.css');
    $navigation_path = get_theme_file_path('assets/navigation.css');
    $style_version = is_file($style_path) ? (string) filemtime($style_path) : (string) wp_get_theme()->get('Version');
    $experience_version = is_file($experience_path) ? (string) filemtime($experience_path) : $style_version;
    $navigation_version = is_file($navigation_path) ? (string) filemtime($navigation_path) : $experience_version;

    wp_enqueue_style('horizon-next-style', get_theme_file_uri('style.css'), [], $style_version);
    wp_enqueue_style('horizon-next-experience', get_theme_file_uri('experience.css'), ['horizon-next-style'], $experience_version);
    wp_enqueue_style('horizon-next-navigation', get_theme_file_uri('assets/navigation.css'), ['horizon-next-experience'], $navigation_version);
}
add_action('enqueue_block_assets', 'horizon_next_assets');
