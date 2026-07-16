import assert from 'node:assert/strict';
import { evaluateHatchMatch } from '../evaluate.mjs';

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
const reviewedFixture = {
  id: 'synthetic-reviewed-profile',
  label: 'Synthetic reviewed test profile',
  reviewState: 'test_fixture_only',
  sourceIds: ['TEST-SOURCE-001'],
  evidenceState: 'reviewed_secondary',
  evidenceScore: 62,
  sourceFreshness: { reviewedAt: '2026-07-15T00:00:00Z', freshForDays: 90, agingAfterDays: 60, availability: 'available' },
  regionBands: ['rocky_mountain_west'],
  dateBands: ['late_spring'],
  waterTypes: ['freestone_river'],
  temperatureRangeC: { minC: 9, maxC: 13 },
  observationMatches: ['small_olive_body', 'surface_emergence'],
  disconfirmingObservations: ['large_dark_body'],
  confirmationCues: ['Confirm body size and wing posture.'],
  disconfirmationCues: ['A large dark body conflicts with this synthetic fixture.'],
  patterns: [{
    id: 'synthetic-pattern',
    label: 'Synthetic pattern fixture',
    requiredMaterials: [{ materialId: 'cdc' }, { materialId: 'olive_dubbing' }, { materialId: 'fine_thread' }],
    historyState: 'test_fixture_only',
    fieldEvidenceState: 'unknown'
  }]
};

const base = {
  regionBand: 'rocky_mountain_west',
  dateBand: 'late_spring',
  waterType: 'freestone_river',
  waterTempC: 11,
  observations: ['small_olive_body', 'surface_emergence'],
  negativeObservations: [],
  inventory: [{ materialId: 'cdc' }, { materialId: 'olive_dubbing' }, { materialId: 'fine_thread' }],
  candidates: [reviewedFixture]
};

test('uses region, date, water type, temperature, and observations', () => {
  const result = evaluateHatchMatch(base, now);
  assert.equal(result.status, 'evaluated');
  assert.equal(result.rankedCandidates[0].id, 'synthetic-reviewed-profile');
  assert.ok(result.rankedCandidates[0].score > 60);
});

test('reports full inventory coverage as tie_now', () => {
  const result = evaluateHatchMatch(base, now);
  assert.equal(result.rankedCandidates[0].patterns[0].coverage.state, 'tie_now');
});

test('excludes pending biological records', () => {
  const result = evaluateHatchMatch({ ...base, candidates: [{ ...reviewedFixture, id: 'pending', reviewState: 'pending_review' }] }, now);
  assert.ok(result.excluded.some((item) => item.reason === 'biological_review_not_complete'));
  assert.equal(result.rankedCandidates.length, 0);
});

test('disconfirming evidence materially lowers score', () => {
  const positive = evaluateHatchMatch(base, now).rankedCandidates[0].score;
  const negative = evaluateHatchMatch({ ...base, observations: [...base.observations, 'large_dark_body'] }, now).rankedCandidates[0].score;
  assert.ok(negative < positive);
});

test('stale source lowers confidence and score', () => {
  const staleCandidate = { ...reviewedFixture, sourceFreshness: { reviewedAt: '2025-01-01T00:00:00Z', freshForDays: 30, availability: 'available' } };
  const result = evaluateHatchMatch({ ...base, candidates: [staleCandidate] }, now);
  assert.equal(result.rankedCandidates[0].sourceFreshness.state, 'stale');
  assert.notEqual(result.rankedCandidates[0].confidence, 'strong');
});

test('rejects nested exact-location data', () => {
  const result = evaluateHatchMatch({ ...base, observationMetadata: { map: 'https://maps.google.com/private' } }, now);
  assert.equal(result.status, 'invalid');
  assert.ok(result.privacyFindings.length);
});

console.log('All Hatch Match tests passed.');
