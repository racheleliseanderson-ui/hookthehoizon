<?php
/** Publication wrapper for the shared Rachel Editorial Core trust-page installer. */
if (!defined('ABSPATH') || !class_exists('WP_CLI')) {
    fwrite(STDERR, "Run this file with WP-CLI eval-file.\n");
    exit(1);
}
$installer = WP_PLUGIN_DIR . '/rachel-editorial-core/includes/trust-page-installer.php';
if (!is_readable($installer)) WP_CLI::error('Rachel Editorial Core trust-page installer is not installed.');
require_once $installer;
if (!function_exists('re_core_run_trust_page_installer')) WP_CLI::error('Shared trust-page installer function is unavailable.');
re_core_run_trust_page_installer(dirname(__DIR__) . '/docs/trust-pages');
