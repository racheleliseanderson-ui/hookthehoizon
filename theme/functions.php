<?php
/** Hook the Horizon presentation theme. */
declare(strict_types=1);
defined('ABSPATH') || exit;

add_action('after_setup_theme', static function (): void {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('responsive-embeds');
    add_theme_support('editor-styles');
    add_theme_support('wp-block-styles');
    add_theme_support('align-wide');
    add_editor_style('style.css');
    register_nav_menus([
        'primary' => __('Primary', 'hook-the-horizon'),
        'utility' => __('Utility', 'hook-the-horizon'),
        'footer' => __('Footer', 'hook-the-horizon'),
    ]);
});

add_action('wp_enqueue_scripts', static function (): void {
    $theme = wp_get_theme();
    wp_enqueue_style('hook-the-horizon', get_stylesheet_uri(), [], (string) $theme->get('Version'));
});

add_action('init', static function (): void {
    register_block_pattern_category('hook-the-horizon', ['label' => __('Hook the Horizon', 'hook-the-horizon')]);
});
