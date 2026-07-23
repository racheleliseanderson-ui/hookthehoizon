import assert from 'node:assert/strict';
import { evaluateHoneyHole } from '../evaluate.mjs';

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}

const reviewedAt = '2026-07-16T06:00:00Z';
const nextReviewAt = '2026-07-17T06:00:00Z';
const sourceUrl = 'https://official.example.invalid/current';
const fact = (value, status = 'official_current', date = reviewedAt, owner = 'Responsible official authority', next = nextReviewAt) => ({
  value,
  status,
  reviewedAt: date,
  verifiedAt: date,
  nextReviewAt: next,
  sourceOwner: owner,
  currentCheckUrl: sourceUrl,
  sourceUrl
});
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
    regulation: fact('reviewed', 'official_current', reviewedAt, 'Jurisdictional fish and wildlife authority', '2026-07-23T06:00:00Z'),
    permit: fact('not_required', 'official_current', reviewedAt, 'Responsible permitting authority', '2026-07-23T06:00:00Z'),
    access: fact('public_access_confirmed', 'official_current', reviewedAt, 'Responsible land manager', '2026-08-15T06:00:00Z'),
    ownership: fact('public', 'official_current', reviewedAt, 'Responsible land records authority', '2026-08-15T06:00:00Z'),
    conservation: fact('standard_controls', 'official_current', reviewedAt, 'Responsible conservation authority', '2026-10-14T06:00:00Z')
  }
};
const now = new Date('2026-07-16T12:00:00Z');

test('returns public-region readiness with owned and current official facts', () => {
  const result = evaluateHoneyHole(base, now);
  assert.equal(result.status, 'trip_readiness');
  assert.equal(result.decisionState, 'ready_with_controls');
  assert.equal(result.confidence.level, 'supported');
  assert.equal(result.hardStops.length, 0);
  assert.match(result.boundary, /not a guarantee/i);
  assert.ok(result.evidence.every((item) => item.sourceOwner && item.reviewedAt && item.nextReviewAt && item.currentCheckUrl));
});

test('rejects coordinates, map links, private access, and contributor-sensitive input before evaluation', () => {
  assert.equal(evaluateHoneyHole({ ...base, publicRegion: '39.7392, -104.9903' }, now).status, 'sensitive_location_rejected');
  assert.equal(evaluateHoneyHole({ ...base, notes: 'https://maps.google.com/example' }, now).status, 'sensitive_location_rejected');
  assert.equal(evaluateHoneyHole({ ...base, notes: 'Use the private road and gate code 4812' }, now).status, 'sensitive_location_rejected');
  assert.equal(evaluateHoneyHole({ ...base, contributorEmail: 'private@example.test', facts: { ...base.facts, closure: { ...base.facts.closure, contributorEmail: 'private@example.test' } } }, now).status, 'sensitive_location_rejected');
});

test('stops a trip affected by closure or access evidence', () => {
  const result = evaluateHoneyHole({
    ...base,
    facts: { ...base.facts, closure: fact('closed'), access: fact('not_permitted', 'official_current', reviewedAt, 'Responsible land manager', '2026-08-15T06:00:00Z') }
  }, now);
  assert.equal(result.decisionState, 'do_not_proceed');
  assert.equal(result.resultBlocked, true);
  assert.ok(result.hardStops.length >= 2);
});

test('blocks reliance when a critical official fact is stale', () => {
  const result = evaluateHoneyHole({
    ...base,
    facts: { ...base.facts, regulation: fact('reviewed', 'official_current', '2026-06-01T12:00:00Z', 'Jurisdictional fish and wildlife authority', '2026-06-08T12:00:00Z') }
  }, now);
  assert.equal(result.decisionState, 'verify_before_trip');
  assert.equal(result.confidence.level, 'blocked');
  assert.ok(result.staleFields.includes('regulation'));
  assert.ok(result.officialQuestions.some((item) => /regulations/i.test(item)));
});

test('reduces confidence when a noncritical source is unavailable', () => {
  const result = evaluateHoneyHole({
    ...base,
    facts: { ...base.facts, weather: fact('reviewed', 'source_unavailable') }
  }, now);
  assert.equal(result.decisionState, 'ready_with_reduced_confidence');
  assert.equal(result.confidence.level, 'reduced');
  assert.ok(result.unavailableFields.includes('weather'));
});

test('blocks reliance when critical evidence lacks ownership or a review contract', () => {
  const result = evaluateHoneyHole({
    ...base,
    facts: { ...base.facts, access: { value: 'public_access_confirmed', status: 'official_current' } }
  }, now);
  assert.equal(result.decisionState, 'verify_before_trip');
  assert.ok(result.unsupportedFields.includes('access'));
  assert.ok(result.officialQuestions.some((item) => /owns the current access source/i.test(item)));
});

test('does not include protected location fields in public output', () => {
  const result = evaluateHoneyHole(base, now);
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /latitude|longitude|coordinates|waypoint|access_point|gate_code|vulnerable_water|contributor_email/i);
});

console.log('All Honey Hole Intelligence tests passed.');
