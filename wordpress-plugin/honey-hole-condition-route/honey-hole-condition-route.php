<?php
/**
 * Plugin Name: Hook the Horizon Honey Hole Condition Route
 * Description: Read-only public-region freshness, ownership, and expiry contract for Honey Hole Intelligence.
 * Version: 0.2.0
 * Requires PHP: 8.1
 */
declare(strict_types=1);
defined('ABSPATH') || exit;

add_action('rest_api_init', static function (): void {
    register_rest_route('horizon-intelligence/v1', '/honey-hole-conditions', [
        'methods' => WP_REST_Server::READABLE,
        'permission_callback' => '__return_true',
        'callback' => static function (): WP_REST_Response {
            $response = rest_ensure_response([
                'applicationId' => 'HHI-001',
                'schemaVersion' => '0.2.0',
                'pluginVersion' => '0.2.0',
                'packetCount' => 3,
                'refreshPolicy' => 'field_level_expiry_with_issue_on_failure',
                'sameDayOfficialVerificationRequired' => true,
                'requiredEvidenceFields' => ['sourceOwner', 'currentCheckUrl', 'reviewedAt', 'nextReviewAt', 'status'],
                'sourceOwnership' => [
                    'regulation' => 'jurisdictional fish and wildlife authority',
                    'closure' => 'jurisdictional closure-issuing authority',
                    'access' => 'responsible land manager or access authority',
                    'hazard' => 'responsible emergency, fire, road, or land-management authority',
                    'weather' => 'national or jurisdictional weather authority',
                    'waterCondition' => 'responsible hydrology, water-management, or monitoring authority',
                    'conservation' => 'responsible fisheries or conservation authority',
                ],
                'staleBehavior' => [
                    'critical' => 'block result pending current official verification',
                    'noncritical' => 'reduce confidence and name the affected field',
                    'sourceUnavailable' => 'preserve unavailable state; never substitute a favorable assumption',
                ],
                'preciseLocationIncluded' => false,
                'protectedOutputClasses' => ['coordinates', 'private-access-instructions', 'vulnerable-water-identifiers', 'contributor-sensitive-information'],
                'boundaries' => [
                    'This route does not authorize a trip or guarantee access or safety.',
                    'Waterbody, species, emergency rule, park alert, access, weather, fire, and hazard checks remain required.',
                    'No precise or sensitive fishing location is exposed.',
                ],
            ]);
            $response->header('Cache-Control', 'no-store, max-age=0');
            return $response;
        },
    ]);
});
