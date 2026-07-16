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

const now = new Date('2026-07-16T12:00:00Z');
const base = {
  deviceProfileId: 'test-device',
  deviceCategory: 'rod_button_module',
  deviceMaturity: 'commercial',
  identityEvidence: 'primary_documentation',
  sourceIds: ['TEST-MANUFACTURER-DOC'],
  sourceFreshness: { reviewedAt: '2026-07-15T00:00:00Z', freshForDays: 90, availability: 'available' },
  exportMethod: 'documented_json_export',
  offlineBehavior: 'buffers_events',
  powerProfile: 'replaceable_battery',
  environmentalRating: 'manufacturer_documented',
  capabilities: [
    { key: 'manual_catch_log', maturity: 'commercial', evidenceState: 'manufacturer_documented' },
    { key: 'bite_detection', maturity: 'prototype', evidenceState: 'recollected' }
  ],
  dataFields: [
    { key: 'event_timestamp', privacyClass: 'public_safe', unit: 'iso8601', quality: 'documented' },
    { key: 'water_temperature', privacyClass: 'local_only', unit: 'celsius', quality: 'unknown' },
    { key: 'latitude', privacyClass: 'private', unit: 'degrees', quality: 'documented' }
  ]
};

test('keeps capability maturity separate from evidence credibility', () => {
  const result = evaluateRigSignal(base, now);
  const bite = result.capabilityCredibility.find((item) => item.key === 'bite_detection');
  assert.equal(bite.maturity, 'prototype');
  assert.equal(bite.credibility, 'unsupported_high_risk_claim');
});

test('manufacturer documentation does not prove field accuracy', () => {
  const result = evaluateRigSignal(base, now);
  const manual = result.capabilityCredibility.find((item) => item.key === 'manual_catch_log');
  assert.equal(manual.credibility, 'documented_claim');
});

test('fails closed for unknown privacy classes', () => {
  const result = evaluateRigSignal({
    ...base,
    dataFields: [{ key: 'mystery', privacyClass: 'publik', unit: null }]
  }, now);
  assert.equal(result.dataHandling.acceptedFields.length, 0);
  assert.equal(result.dataHandling.rejectedFields[0].reason, 'unknown_privacy_class');
});

test('keeps local telemetry out of normalized public events', () => {
  const result = evaluateRigSignal(base, now);
  assert.ok(result.dataHandling.localOnlyFields.some((field) => field.key === 'water_temperature'));
  assert.ok(result.normalizedEventPreview.every((event) => event.eventType !== 'device.water_temperature'));
});

test('rejects coordinate fields and nested location strings', () => {
  const direct = evaluateRigSignal(base, now);
  assert.ok(direct.dataHandling.rejectedFields.some((field) => field.key === 'latitude'));
  const nested = evaluateRigSignal({ ...base, notes: { point: '39.12345, -104.12345' } }, now);
  assert.equal(nested.status, 'invalid');
});

test('separates importability from capability credibility', () => {
  const result = evaluateRigSignal(base, now);
  assert.equal(result.integrationReadiness, 'importable');
  assert.ok(result.capabilityCredibility.some((item) => item.credibility === 'unsupported_high_risk_claim'));
});

test('normalized events are versioned, unit-aware, and location-free', () => {
  const result = evaluateRigSignal(base, now);
  assert.equal(result.normalizedEventPreview[0].schemaVersion, '1.0.0');
  assert.equal(result.normalizedEventPreview[0].locationIncluded, false);
  assert.equal(result.normalizedEventPreview[0].unit, 'iso8601');
});

console.log('All Rig Signal tests passed.');
