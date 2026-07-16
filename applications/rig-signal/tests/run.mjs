import assert from 'node:assert/strict';
import { evaluateRigSignal } from '../evaluate.mjs';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const base = {
  deviceCategory: 'rod_button_module',
  identityEvidence: 'primary_documentation',
  exportMethod: 'documented_json_export',
  offlineBehavior: 'buffers_events',
  powerProfile: 'replaceable_battery',
  environmentalRating: 'manufacturer_documented',
  capabilities: [
    {
      key: 'manual_catch_log',
      maturity: 'commercial',
      evidenceState: 'primary_documentation'
    },
    {
      key: 'bite_detection',
      maturity: 'prototype',
      evidenceState: 'contributor_recollection'
    }
  ],
  dataFields: [
    { key: 'event_timestamp', privacyClass: 'public_safe', unit: 'iso8601' },
    { key: 'water_temperature', privacyClass: 'local_only', unit: 'celsius' },
    { key: 'latitude', privacyClass: 'private', unit: 'degrees' }
  ]
};

test('returns importable for documented identity, export, and public-safe fields', () => {
  const result = evaluateRigSignal(base);
  assert.equal(result.status, 'evaluated');
  assert.equal(result.integrationReadiness, 'importable');
});

test('keeps private telemetry local only', () => {
  const result = evaluateRigSignal(base);
  assert.ok(result.dataHandling.localOnlyFields.some((field) => field.key === 'water_temperature'));
});

test('rejects coordinate fields from normalized output', () => {
  const result = evaluateRigSignal(base);
  assert.ok(result.dataHandling.rejectedFields.some((field) => field.key === 'latitude'));
  assert.ok(result.normalizedEventPreview.every((event) => event.locationIncluded === false));
});

test('does not upgrade unsupported high-risk bite claims', () => {
  const result = evaluateRigSignal(base);
  const bite = result.capabilities.find((capability) => capability.key === 'bite_detection');
  assert.equal(bite.status, 'prototype_only');
});

test('rejects exact location input', () => {
  const result = evaluateRigSignal({ ...base, coordinates: { lat: 1, lng: 2 } });
  assert.equal(result.status, 'invalid');
  assert.ok(result.errors.includes('exact location data is prohibited'));
});

console.log('All Rig Signal tests passed.');
