<?php
/**
 * Plugin Name: Hook the Horizon Honey Hole Condition Route
 * Description: Read-only public destination, access, freshness, and trip-readiness data for Honey Hole Intelligence.
 * Version: 0.3.0
 * Requires PHP: 8.1
 */
declare(strict_types=1);
defined('ABSPATH') || exit;

const HTH_HHI_ROUTE_VERSION = '0.3.0';
const HTH_HHI_DATA_FILE = __DIR__ . '/data/public-destination-records.v0.2.json';

/** @return array<string,mixed>|WP_Error */
function hth_hhi_load_destination_data(): array|WP_Error {
    if (!is_readable(HTH_HHI_DATA_FILE)) {
        return new WP_Error('hhi_data_unavailable', 'Honey Hole Intelligence destination data is unavailable.', ['status' => 503]);
    }
    $raw = file_get_contents(HTH_HHI_DATA_FILE);
    if ($raw === false) {
        return new WP_Error('hhi_data_read_failed', 'Honey Hole Intelligence destination data could not be read.', ['status' => 503]);
    }
    try {
        $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        return new WP_Error('hhi_data_invalid', 'Honey Hole Intelligence destination data is invalid.', ['status' => 500]);
    }
    if (!is_array($data) || ($data['applicationId'] ?? null) !== 'HHI-001' || !isset($data['destinations']) || !is_array($data['destinations'])) {
        return new WP_Error('hhi_data_contract_failed', 'Honey Hole Intelligence destination data failed its runtime contract.', ['status' => 500]);
    }
    return $data;
}

/** @param array<int,array<string,mixed>> $destinations @return array<int,array<string,mixed>> */
function hth_hhi_filter_destinations(array $destinations, string $state, string $waterbody): array {
    return array_values(array_filter($destinations, static function (array $destination) use ($state, $waterbody): bool {
        if ($state !== '' && strcasecmp((string) ($destination['state'] ?? ''), $state) !== 0) return false;
        if ($waterbody !== '' && stripos((string) ($destination['waterbody'] ?? ''), $waterbody) === false) return false;
        return true;
    }));
}

add_action('rest_api_init', static function (): void {
    register_rest_route('horizon-intelligence/v1', '/honey-hole-conditions', [
        'methods' => WP_REST_Server::READABLE,
        'permission_callback' => '__return_true',
        'args' => [
            'state' => ['required' => false, 'sanitize_callback' => 'sanitize_text_field'],
            'waterbody' => ['required' => false, 'sanitize_callback' => 'sanitize_text_field'],
        ],
        'callback' => static function (WP_REST_Request $request): WP_REST_Response|WP_Error {
            $data = hth_hhi_load_destination_data();
            if (is_wp_error($data)) return $data;
            $state = trim((string) $request->get_param('state'));
            $waterbody = trim((string) $request->get_param('waterbody'));
            $destinations = hth_hhi_filter_destinations($data['destinations'], $state, $waterbody);
            return rest_ensure_response([
                'applicationId' => 'HHI-001',
                'schemaVersion' => (string) ($data['schemaVersion'] ?? '0.3.0'),
                'pluginVersion' => HTH_HHI_ROUTE_VERSION,
                'generatedAt' => $data['generatedAt'] ?? null,
                'coverage' => $data['coverage'] ?? [],
                'destinationCount' => count($destinations),
                'filters' => ['state' => $state !== '' ? $state : null, 'waterbody' => $waterbody !== '' ? $waterbody : null],
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

add_shortcode('hth_honey_hole', static function (): string {
    $data = hth_hhi_load_destination_data();
    if (is_wp_error($data)) return '<div role="alert">Honey Hole Intelligence is temporarily unavailable. Check official sources directly before travel.</div>';
    $state = isset($_GET['hhi_state']) ? sanitize_text_field(wp_unslash($_GET['hhi_state'])) : '';
    $waterbody = isset($_GET['hhi_waterbody']) ? sanitize_text_field(wp_unslash($_GET['hhi_waterbody'])) : '';
    $destinations = hth_hhi_filter_destinations($data['destinations'], $state, $waterbody);
    $states = array_values(array_unique(array_map(static fn(array $d): string => (string) $d['state'], $data['destinations'])));
    sort($states);
    ob_start();
    ?>
    <section class="hth-hhi" aria-labelledby="hth-hhi-title">
      <style>
        .hth-hhi{max-width:76rem;margin:auto}.hth-hhi__filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:1rem;align-items:end}.hth-hhi label{display:block;font-weight:700}.hth-hhi input,.hth-hhi select,.hth-hhi button{font:inherit;min-height:44px;width:100%}.hth-hhi__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(18rem,1fr));gap:1rem;margin-top:1.5rem}.hth-hhi__card{border:1px solid currentColor;padding:1rem;border-radius:.5rem;break-inside:avoid}.hth-hhi__status{font-weight:700}.hth-hhi a:focus,.hth-hhi button:focus,.hth-hhi input:focus,.hth-hhi select:focus{outline:3px solid currentColor;outline-offset:3px}@media print{.hth-hhi__filters,.hth-hhi button{display:none!important}.hth-hhi__grid{display:block}.hth-hhi__card{margin:0 0 1rem;page-break-inside:avoid}.hth-hhi a[href]::after{content:" (" attr(href) ")";font-size:.8em}}
      </style>
      <h2 id="hth-hhi-title">Honey Hole Intelligence</h2>
      <p>Choose a named public destination. Verify regulations, closures, hazards, access, weather, and water conditions with the linked authority before leaving.</p>
      <form class="hth-hhi__filters" method="get" action="">
        <div><label for="hhi-state">State</label><select id="hhi-state" name="hhi_state"><option value="">All states</option><?php foreach ($states as $option): ?><option value="<?php echo esc_attr($option); ?>" <?php selected($state, $option); ?>><?php echo esc_html($option); ?></option><?php endforeach; ?></select></div>
        <div><label for="hhi-waterbody">Waterbody</label><input id="hhi-waterbody" name="hhi_waterbody" value="<?php echo esc_attr($waterbody); ?>" autocomplete="off"></div>
        <div><button type="submit">Find public destinations</button></div>
      </form>
      <p aria-live="polite"><?php echo esc_html((string) count($destinations)); ?> destination<?php echo count($destinations) === 1 ? '' : 's'; ?> shown.</p>
      <div class="hth-hhi__grid">
      <?php foreach ($destinations as $destination): ?>
        <article class="hth-hhi__card">
          <h3><?php echo esc_html((string) $destination['waterbody']); ?><?php if (!empty($destination['accessSite'])) echo ' — ' . esc_html((string) $destination['accessSite']); ?></h3>
          <p><strong><?php echo esc_html((string) $destination['state']); ?></strong> · <?php echo esc_html((string) $destination['region']); ?> · <?php echo esc_html((string) $destination['waterType']); ?></p>
          <p class="hth-hhi__status">Status: <?php echo esc_html(str_replace('_', ' ', (string) $destination['status'])); ?></p>
          <p>Checked: <?php echo esc_html((string) $destination['checkedAt']); ?> · Review by: <?php echo esc_html((string) $destination['nextReviewAt']); ?></p>
          <h4>Public access</h4><ul><?php foreach ($destination['publicAccess'] as $access): ?><li><?php echo esc_html((string) $access['name']); ?> — <?php echo esc_html(str_replace('_', ' ', (string) $access['type'])); ?><?php if (!empty($access['status'])) echo ' (' . esc_html(str_replace('_', ' ', (string) $access['status'])) . ')'; ?></li><?php endforeach; ?></ul>
          <h4>Current notices</h4><ul><?php foreach ($destination['currentNotices'] as $notice): ?><li><?php echo esc_html((string) $notice); ?></li><?php endforeach; ?></ul>
          <h4>Verify before travel</h4><ul><?php foreach ($destination['directVerification'] as $action): ?><li><?php echo esc_html((string) $action); ?></li><?php endforeach; ?></ul>
          <p><a href="<?php echo esc_url((string) $destination['officialSourceUrl']); ?>">Open official destination source</a></p>
        </article>
      <?php endforeach; ?>
      </div>
      <?php if (!$destinations): ?><p role="status">No matching public destination is currently in the dataset. Try a broader search and verify directly with the relevant fish-and-wildlife authority.</p><?php endif; ?>
    </section>
    <?php
    return (string) ob_get_clean();
});
