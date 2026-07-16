import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyPrivacyField,
  rejectLocationSensitiveInput,
  resolveSourceState,
  sanitizePublicPayload
} from '../governance.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test('rejects nested coordinates and map URLs', () => {
  const result = rejectLocationSensitiveInput({
    session: { notes: 'Meet at 39.12345, -104.12345', map: 'https://maps.google.com/example' }
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.length >= 2);
});

test('redacts location-bearing strings and removes sensitive keys', () => {
  const result = sanitizePublicPayload({ label: 'safe', private_water_name: 'secret', notes: 'lat: 39.12345' });
  assert.equal(result.sanitized.private_water_name, undefined);
  assert.equal(result.sanitized.notes, '[redacted-location]');
});

test('fails closed for unknown privacy classes', () => {
  assert.equal(classifyPrivacyField({ privacyClass: 'publik' }).disposition, 'rejected');
  assert.equal(classifyPrivacyField({ privacyClass: 'public_safe' }).disposition, 'accepted');
  assert.equal(classifyPrivacyField({ privacyClass: 'local_only' }).disposition, 'local_only');
});

test('computes fresh, aging, stale, and outage states', () => {
  const now = new Date('2026-07-16T00:00:00Z');
  assert.equal(resolveSourceState({ reviewedAt: '2026-07-10T00:00:00Z', freshForDays: 30 }, now).state, 'fresh');
  assert.equal(resolveSourceState({ reviewedAt: '2026-06-20T00:00:00Z', freshForDays: 30, agingAfterDays: 20 }, now).state, 'aging');
  assert.equal(resolveSourceState({ reviewedAt: '2026-05-01T00:00:00Z', freshForDays: 30 }, now).state, 'stale');
  assert.equal(resolveSourceState({ availability: 'outage' }, now).state, 'outage');
});

test('shared contract and vocabulary files are valid JSON with versions', () => {
  for (const filename of ['shared-contracts.v1.json', 'vocabularies.v1.json']) {
    const content = JSON.parse(fs.readFileSync(path.join(here, '..', filename), 'utf8'));
    assert.match(content.version, /^1\./);
  }
});

console.log('All shared governance tests passed.');
