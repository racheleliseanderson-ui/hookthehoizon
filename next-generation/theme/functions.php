<?php
/** Hook the Horizon Next theme bootstrap. */
declare(strict_types=1);
if (! defined('ABSPATH')) { exit; }
function horizon_next_setup(): void { add_theme_support('wp-block-styles'); add_theme_support('responsive-embeds'); add_editor_style('style.css'); }
add_action('after_setup_theme', 'horizon_next_setup');
function horizon_next_assets(): void { wp_enqueue_style('horizon-next-style', get_stylesheet_uri(), [], (string) wp_get_theme()->get('Version')); }
add_action('wp_enqueue_scripts', 'horizon_next_assets');
