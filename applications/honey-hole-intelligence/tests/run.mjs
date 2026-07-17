import assert from 'node:assert/strict';
import { evaluateHoneyHole } from '../evaluate.mjs';

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}

const verifiedAt = '2026-07-16T06:00:00Z';
const sourceUrl = 'https://example.invalid/official';
const fact = (value, status = 'official_current', date = verifiedAt) => ({ value, status, verifiedAt: date, sourceUrl });
const base = {
  publicRegion: 'Upper Colorado public-water region',
  tripType: 'day trip',
  gearReady: true,
  backupPlanReady: true,
  facts: {
    closure: fact('open'),
    hazard: fact('normal'),
    weather: fact('reviewed'),
    waterCondition: fact('reviewed'),
    regulation: fact('reviewed'),
    permit: fact('not_required'),
    access: fact('public_access_confirmed'),
    ownership: fact('public'),
    conservation: fact('standard_controls')
  }
};

test('returns public-region readiness with current official facts', () => {
  const result = evaluateHoneyHole(base, new Date('2026-07-16T12:00:00Z'));
  assert.equal(result.status, 'trip_readiness');
  assert.equal(result.decisionState, 'ready_with_controls');
  assert.equal(result.hardStops.length, 0);
  assert.match(result.boundary, /not a guarantee/i);
});

test('rejects coordinate and map-link input before evaluation', () => {
  const coordinate = evaluateHoneyHole({ ...base, publicRegion: '39.7392, -104.9903' });
  assert.equal(coordinate.status, 'sensitive_location_rejected');
  const map = evaluateHoneyHole({ ...base, notes: 'https://maps.google.com/example' });
  assert.equal(map.status, 'sensitive_location_rejected');
});

test('stops a trip affected by closure or access evidence', () => {
  const result = evaluateHoneyHole({
    ...base,
    facts: { ...base.facts, closure: fact('closed'), access: fact('not_permitted') }
  });
  assert.equal(result.decisionState, 'do_not_proceed');
  assert.ok(result.hardStops.length >= 2);
});

test('requires verification when critical official facts are stale', () => {
  const result = evaluateHoneyHole({
    ...base,
    facts: { ...base.facts, regulation: fact('reviewed', 'official_current', '2026-06-01T12:00:00Z') }
  }, new Date('2026-07-16T12:00:00Z'));
  assert.equal(result.decisionState, 'verify_before_trip');
  assert.ok(result.staleFields.includes('regulation'));
  assert.ok(result.officialQuestions.some((item) => /regulations/i.test(item)));
});

test('does not include exact-location fields in public output', () => {
  const result = evaluateHoneyHole(base);
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /latitude|longitude|coordinates|waypoint|access_point/i);
});

console.log('All Honey Hole Intelligence tests passed.');
