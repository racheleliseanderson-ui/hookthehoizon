<?php
/** Hook the Horizon presentation theme. Durable content models live in the Hook content plugin. */
declare(strict_types=1);
defined('ABSPATH') || exit;

add_action('after_setup_theme', static function (): void {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('responsive-embeds');
    add_theme_support('editor-styles');
    add_theme_support('wp-block-styles');
    add_theme_support('align-wide');
    add_editor_style(['assets/tokens.css', 'style.css']);
    register_nav_menus([
        'primary' => __('Primary', 'hook-the-horizon'),
        'utility' => __('Utility', 'hook-the-horizon'),
        'footer' => __('Footer', 'hook-the-horizon'),
    ]);
    add_image_size('hth-home-hero', 1920, 1200, true);
    add_image_size('hth-card-landscape', 960, 640, true);
});

add_action('wp_enqueue_scripts', static function (): void {
    $theme = wp_get_theme();
    $tokens = get_theme_file_path('assets/tokens.css');
    if (is_readable($tokens)) {
        wp_enqueue_style('hook-the-horizon-tokens', get_theme_file_uri('assets/tokens.css'), [], (string) filemtime($tokens));
    }
    wp_enqueue_style('hook-the-horizon', get_stylesheet_uri(), wp_style_is('hook-the-horizon-tokens', 'registered') ? ['hook-the-horizon-tokens'] : [], (string) $theme->get('Version'));

    if (is_page('honey-hole-intelligence')) {
        $appStyle = get_theme_file_path('assets/honey-hole-intelligence/styles.css');
        $appScript = get_theme_file_path('assets/honey-hole-intelligence/app.mjs');
        if (is_readable($appStyle)) {
            wp_enqueue_style('hook-honey-hole-intelligence', get_theme_file_uri('assets/honey-hole-intelligence/styles.css'), ['hook-the-horizon'], (string) filemtime($appStyle));
        }
        if (is_readable($appScript)) {
            wp_enqueue_script_module('hook-honey-hole-intelligence', get_theme_file_uri('assets/honey-hole-intelligence/app.mjs'), [], (string) filemtime($appScript));
        }
    }
});

add_action('init', static function (): void {
    register_block_pattern_category('hook-the-horizon', ['label' => __('Hook the Horizon', 'hook-the-horizon')]);
});

/**
 * Homepage media fails closed. An attachment must carry affirmative approval after
 * a person verifies that it contains no people, no sensitive location evidence,
 * and is suitable for the public homepage.
 */
add_filter('post_thumbnail_html', static function (string $html, int $post_id, int $thumbnail_id): string {
    if (!is_front_page() && !is_home()) {
        return $html;
    }
    return get_post_meta($thumbnail_id, '_re_homepage_safe', true) === '1' ? $html : '';
}, 10, 3);

add_filter('attachment_fields_to_edit', static function (array $fields, WP_Post $post): array {
    $fields['re_homepage_safe'] = [
        'label' => __('Homepage-safe image', 'hook-the-horizon'),
        'input' => 'html',
        'html' => sprintf(
            '<label><input type="checkbox" name="attachments[%1$d][re_homepage_safe]" value="1" %2$s> %3$s</label>',
            $post->ID,
            checked(get_post_meta($post->ID, '_re_homepage_safe', true), '1', false),
            esc_html__('Verified: no people, no sensitive location evidence, and suitable for homepage use.', 'hook-the-horizon')
        ),
    ];
    return $fields;
}, 10, 2);

add_filter('attachment_fields_to_save', static function (array $post, array $attachment): array {
    update_post_meta((int) $post['ID'], '_re_homepage_safe', isset($attachment['re_homepage_safe']) ? '1' : '0');
    return $post;
}, 10, 2);

$systemCompatibilityBridge = get_theme_file_path('inc/system-compatibility.php');
if (is_readable($systemCompatibilityBridge)) {
    require_once $systemCompatibilityBridge;
}
