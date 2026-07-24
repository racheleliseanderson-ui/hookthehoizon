<?php
/**
 * Plugin Name: Hook the Horizon Honey Hole Condition Route
 * Description: Read-only public destination, access, freshness, and trip-readiness data for Honey Hole Intelligence.
 * Version: 0.2.0
 * Requires PHP: 8.1
 */
declare(strict_types=1);
defined('ABSPATH') || exit;

const HTH_HHI_ROUTE_VERSION = '0.2.0';
const HTH_HHI_DATA_FILE = __DIR__ . '/data/public-destination-records.v0.2.json';

/**
 * @return array<string,mixed>|WP_Error
 */
function hth_hhi_load_destination_data(): array|WP_Error {
    if (!is_readable(HTH_HHI_DATA_FILE)) {
        return new WP_Error(
            'hhi_data_unavailable',
            'Honey Hole Intelligence destination data is unavailable.',
            ['status' => 503]
        );
    }

    $raw = file_get_contents(HTH_HHI_DATA_FILE);
    if ($raw === false) {
        return new WP_Error(
            'hhi_data_read_failed',
            'Honey Hole Intelligence destination data could not be read.',
            ['status' => 503]
        );
    }

    try {
        $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        return new WP_Error(
            'hhi_data_invalid',
            'Honey Hole Intelligence destination data is invalid.',
            ['status' => 500]
        );
    }

    if (!is_array($data) || ($data['applicationId'] ?? null) !== 'HHI-001' || !isset($data['destinations']) || !is_array($data['destinations'])) {
        return new WP_Error(
            'hhi_data_contract_failed',
            'Honey Hole Intelligence destination data failed its runtime contract.',
            ['status' => 500]
        );
    }

    return $data;
}

add_action('rest_api_init', static function (): void {
    register_rest_route('horizon-intelligence/v1', '/honey-hole-conditions', [
        'methods' => WP_REST_Server::READABLE,
        'permission_callback' => '__return_true',
        'args' => [
            'state' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'waterbody' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field',
            ],
        ],
        'callback' => static function (WP_REST_Request $request): WP_REST_Response|WP_Error {
            $data = hth_hhi_load_destination_data();
            if (is_wp_error($data)) {
                return $data;
            }

            $state = trim((string) $request->get_param('state'));
            $waterbody = trim((string) $request->get_param('waterbody'));
            $destinations = array_values(array_filter(
                $data['destinations'],
                static function (array $destination) use ($state, $waterbody): bool {
                    if ($state !== '' && strcasecmp((string) ($destination['state'] ?? ''), $state) !== 0) {
                        return false;
                    }
                    if ($waterbody !== '' && stripos((string) ($destination['waterbody'] ?? ''), $waterbody) === false) {
                        return false;
                    }
                    return true;
                }
            ));

            return rest_ensure_response([
                'applicationId' => 'HHI-001',
                'schemaVersion' => (string) ($data['schemaVersion'] ?? '0.2.0'),
                'pluginVersion' => HTH_HHI_ROUTE_VERSION,
                'generatedAt' => $data['generatedAt'] ?? null,
                'coverage' => $data['coverage'] ?? [],
                'destinationCount' => count($destinations),
                'filters' => [
                    'state' => $state !== '' ? $state : null,
                    'waterbody' => $waterbody !== '' ? $waterbody : null,
                ],
                'sameDayOfficialVerificationRequired' => true,
                'publicLocationIncluded' => true,
                'sensitiveLocationIncluded' => false,
                'destinations' => $destinations,
                'boundaries' => [
                    'Named public waters and officially documented public access facilities may be displayed.',
                    'Private, user-supplied secret, unauthorized, or conservation-sensitive locations are excluded.',
                    'Current regulations, closures, hazards, access, weather, water, and jurisdiction must be verified before travel.'
                ]
            ]);
        },
    ]);
});
