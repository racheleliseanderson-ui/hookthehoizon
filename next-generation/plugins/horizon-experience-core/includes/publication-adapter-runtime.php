<?php
/** Load and expose the governed publication adapter for theme, template and application consumers. */
declare(strict_types=1);

if (! defined('ABSPATH')) { exit; }

if (! function_exists('nlh_register_publication_adapter_runtime')) {
    function nlh_register_publication_adapter_runtime(string $namespace, string $adapter_path, string $script_handle, string $publication_key): void {
        $load_adapter = static function () use ($adapter_path, $publication_key): array {
            if (! is_readable($adapter_path)) {
                return ['code' => 'publication_adapter_missing', 'publicationKey' => $publication_key];
            }
            $decoded = json_decode((string) file_get_contents($adapter_path), true);
            if (! is_array($decoded) || json_last_error() !== JSON_ERROR_NONE) {
                return ['code' => 'publication_adapter_invalid_json', 'publicationKey' => $publication_key];
            }
            if (($decoded['publicationKey'] ?? '') !== $publication_key) {
                return ['code' => 'publication_adapter_identity_mismatch', 'publicationKey' => $publication_key];
            }
            return $decoded;
        };

        add_action('rest_api_init', static function () use ($namespace, $load_adapter): void {
            register_rest_route($namespace, '/publication-adapter', [
                'methods' => WP_REST_Server::READABLE,
                'permission_callback' => '__return_true',
                'callback' => static function () use ($load_adapter): WP_REST_Response {
                    $adapter = $load_adapter();
                    return new WP_REST_Response($adapter, isset($adapter['code']) ? 500 : 200);
                },
            ]);
        });

        add_action('wp_enqueue_scripts', static function () use ($script_handle, $publication_key, $load_adapter): void {
            $adapter = $load_adapter();
            if (isset($adapter['code']) || ! wp_script_is($script_handle, 'enqueued')) { return; }
            $object_name = 'NLHPublicationAdapter_' . str_replace('-', '_', sanitize_key($publication_key));
            wp_localize_script($script_handle, $object_name, $adapter);
        }, 20);
    }
}
