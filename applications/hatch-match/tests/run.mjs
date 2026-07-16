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

const base = {
  regionBand: 'rocky_mountain_west',
  dateBand: 'late_spring',
  waterType: 'freestone_river',
  waterTempC: 11,
  observations: ['small olive mayfly', 'surface emergence'],
  inventory: ['cdc', 'olive dubbing', 'fine thread', 'dry fly hook'],
  candidates: [
    {
      id: 'candidate-a',
      label: 'Evidence-backed candidate A',
      evidenceScore: 62,
      sourceFreshness: 'current',
      observationMatches: ['small olive mayfly', 'surface emergence'],
      confirmationCues: ['Confirm body size and wing posture.'],
      patterns: [
        {
          id: 'pattern-a',
          label: 'Pattern A',
          evidenceScore: 70,
          requiredMaterials: ['cdc', 'olive dubbing', 'fine thread', 'dry fly hook']
        }
      ]
    },
    {
      id: 'candidate-b',
      label: 'Evidence-backed candidate B',
      evidenceScore: 74,
      sourceFreshness: 'stale',
      observationMatches: ['large caddis'],
      patterns: []
    }
  ]
};

test('ranks direct observation matches without verifying a hatch', () => {
  const result = evaluateHatchMatch(base);
  assert.equal(result.status, 'evaluated');
  assert.equal(result.rankedCandidates[0].id, 'candidate-a');
  assert.match(result.interpretation, /does not verify/i);
});

test('reports full inventory coverage as tie_now', () => {
  const result = evaluateHatchMatch(base);
  assert.equal(result.rankedCandidates[0].patterns[0].coverage.state, 'tie_now');
});

test('penalizes stale sources', () => {
  const result = evaluateHatchMatch(base);
  const stale = result.rankedCandidates.find((candidate) => candidate.id === 'candidate-b');
  assert.ok(stale.score < 74);
});

test('rejects exact location data', () => {
  const result = evaluateHatchMatch({ ...base, coordinates: { lat: 1, lng: 2 } });
  assert.equal(result.status, 'invalid');
  assert.ok(result.errors.includes('exact location data is prohibited'));
});

test('preserves missing observations as an unknown', () => {
  const result = evaluateHatchMatch({ ...base, observations: [] });
  assert.ok(result.unknowns.includes('no direct forage or insect observations supplied'));
});

console.log('All Hatch Match tests passed.');
