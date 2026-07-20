import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRigSignalEvent } from '../validate.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const fixtureSet = JSON.parse(fs.readFileSync(path.join(directory, '..', 'fixtures', 'device-events.v1.json'), 'utf8'));

for (const fixture of fixtureSet.fixtures) {
  const result = validateRigSignalEvent(fixture.event);
  assert.equal(result.applicationId, 'HTH-RS-001', fixture.fixtureId);
  assert.equal(result.disposition, fixture.expectedDisposition, fixture.fixtureId);
  assert.equal(result.recommendationEligibility === 'not_eligible' || result.recommendationEligibility === 'bounded_observation_only', true);
  assert.equal(result.event?.locationIncluded ?? false, false);
}

const accepted = validateRigSignalEvent(fixtureSet.fixtures[0].event);
assert.equal(accepted.disposition, 'accepted');
assert.equal(accepted.recommendationEligibility, 'bounded_observation_only');
assert.equal(accepted.errors.length, 0);

const prototype = validateRigSignalEvent(fixtureSet.fixtures[1].event);
assert.equal(prototype.disposition, 'review_required');
assert.ok(prototype.warnings.some((item) => item.includes('Calibration state')));
assert.equal(prototype.recommendationEligibility, 'not_eligible');

const privateRecord = validateRigSignalEvent(fixtureSet.fixtures[2].event);
assert.equal(privateRecord.disposition, 'rejected');
assert.ok(privateRecord.errors.some((item) => item.includes('privacyClass prohibited')));

const unsupportedPrediction = validateRigSignalEvent(fixtureSet.fixtures[3].event);
assert.equal(unsupportedPrediction.disposition, 'rejected');
assert.ok(unsupportedPrediction.errors.some((item) => item.includes('independently_validated')));

const exactLocation = validateRigSignalEvent({
  ...fixtureSet.fixtures[0].event,
  eventId: 'rs-event-location-failure',
  locationIncluded: true
});
assert.equal(exactLocation.disposition, 'rejected');
assert.ok(exactLocation.errors.some((item) => item.includes('locationIncluded must be false')));

const extraField = validateRigSignalEvent({
  ...fixtureSet.fixtures[0].event,
  eventId: 'rs-event-extra-field',
  catchOutcome: 'caught fish'
});
assert.equal(extraField.disposition, 'rejected');
assert.ok(extraField.errors.some((item) => item.includes('catchOutcome is not allowed')));

console.log('PASS Rig Signal contract, representative events, privacy rejection, evidence separation, calibration states, and unsupported catch-prediction stops.');
