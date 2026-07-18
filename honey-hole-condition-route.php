<?php
/**
 * Plugin Name: Hook the Horizon Honey Hole Condition Route
 * Description: Read-only public-region freshness and expiry status for Honey Hole Intelligence.
 * Version: 0.1.0
 * Requires PHP: 8.1
 */
declare(strict_types=1);
defined('ABSPATH') || exit;

add_action('rest_api_init', static function (): void {
    register_rest_route('horizon-intelligence/v1', '/honey-hole-conditions', [
        'methods' => WP_REST_Server::READABLE,
        'permission_callback' => '__return_true',
        'callback' => static function (): WP_REST_Response {
            return rest_ensure_response([
                'applicationId' => 'HHI-001',
                'schemaVersion' => '0.1.0',
                'pluginVersion' => '0.1.0',
                'packetCount' => 3,
                'refreshPolicy' => 'daily_1217_utc_with_issue_on_expiry',
                'sameDayOfficialVerificationRequired' => true,
                'preciseLocationIncluded' => false,
                'boundaries' => [
                    'This route does not authorize a trip or guarantee access or safety.',
                    'Waterbody, species, emergency rule, park alert, access, weather, fire, and hazard checks remain required.',
                    'No precise or sensitive fishing location is exposed.'
                ]
            ]);
        },
    ]);
});
