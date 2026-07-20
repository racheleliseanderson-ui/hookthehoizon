<?php
/**
 * WP-CLI runtime readback for Hatch Match package parity.
 * Run with: wp eval-file wp-content/plugins/hatch-match-preview/tools/runtime-readback.php
 */

defined('ABSPATH') || exit;

$seed = hth_hatch_match_read_data('seed-records.json');
$policy = hth_hatch_match_read_data('maintenance-policy.json');
$log = hth_hatch_match_read_data('maintenance-log.json');
$manifest = hth_hatch_match_read_data('runtime-manifest.json');

global $shortcode_tags;

$result = [
    'applicationId' => 'HTH-HM-001',
    'pluginVersion' => defined('HTH_HATCH_MATCH_PREVIEW_VERSION') ? HTH_HATCH_MATCH_PREVIEW_VERSION : null,
    'pluginActive' => function_exists('is_plugin_active') ? is_plugin_active('hatch-match-preview/hatch-match-preview.php') : null,
    'shortcodeRegistered' => isset($shortcode_tags['hth_hatch_match']),
    'seedSchemaVersion' => $seed['schemaVersion'] ?? null,
    'publicationState' => $seed['publicationState'] ?? null,
    'maintenanceState' => $seed['maintenanceState'] ?? null,
    'recordCount' => isset($seed['records']) && is_array($seed['records']) ? count($seed['records']) : 0,
    'sourceCount' => isset($seed['sources']) && is_array($seed['sources']) ? count($seed['sources']) : 0,
    'stableRecordIds' => isset($seed['records']) && is_array($seed['records']) ? array_values(array_map(static fn(array $record): string => (string) ($record['id'] ?? ''), $seed['records'])) : [],
    'reviewedDate' => $seed['reviewedDate'] ?? null,
    'nextReviewDate' => $seed['nextReviewDate'] ?? null,
    'expiresDate' => $seed['expiresDate'] ?? null,
    'policyId' => $policy['policyId'] ?? null,
    'policySchemaVersion' => $policy['schemaVersion'] ?? null,
    'policyStatus' => $policy['status'] ?? null,
    'primaryOwner' => is_array($policy['primaryOwner'] ?? null) ? ($policy['primaryOwner']['name'] ?? null) : ($policy['primaryOwner'] ?? null),
    'secondaryOperationalOwner' => is_array($policy['secondaryOperationalOwner'] ?? null) ? ($policy['secondaryOperationalOwner']['role'] ?? null) : ($policy['secondaryOperationalOwner'] ?? null),
    'maintenanceEntryCount' => isset($log['entries']) && is_array($log['entries']) ? count($log['entries']) : 0,
    'runtimeManifestSchemaVersion' => $manifest['schemaVersion'] ?? null,
    'runtimeArtifacts' => array_keys(is_array($manifest['artifacts'] ?? null) ? $manifest['artifacts'] : []),
    'migrationCount' => 0,
    'customDatabaseSchema' => false,
    'productionAuthorized' => false,
];

echo wp_json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
