import assert from 'node:assert/strict';
import { evaluatePresentationPlanner } from '../evaluate.mjs';

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
  method: 'freshwater_spinning',
  waterType: 'reservoir',
  tripGoal: 'test_a_hypothesis',
  structureBand: 'rock_and_dropoff',
  depthBand: 'mid_depth',
  conditions: ['stained_water', 'windy', 'low_light'],
  inventoryOnly: true,
  candidates: [
    {
      id: 'owned-compatible',
      label: 'Owned compatible presentation',
      owned: true,
      equipmentFit: 'compatible',
      evidenceScore: 60,
      sourceFreshness: 'current',
      conditionMatches: ['stained_water', 'windy', 'low_light'],
      sizeBand: 'medium',
      colorFamily: 'high_contrast',
      targetDepth: 'mid_depth',
      cadence: 'steady_with_pauses',
      noPurchaseAlternative: 'Use the closest owned profile and shorten the pause.'
    },
    {
      id: 'popular-not-owned',
      label: 'Popular but not owned',
      owned: false,
      equipmentFit: 'compatible',
      evidenceScore: 95,
      sourceFreshness: 'current',
      conditionMatches: ['stained_water', 'windy', 'low_light']
    },
    {
      id: 'owned-mismatch',
      label: 'Owned equipment mismatch',
      owned: true,
      equipmentFit: 'mismatch',
      evidenceScore: 99,
      sourceFreshness: 'current',
      conditionMatches: ['stained_water', 'windy', 'low_light']
    }
  ]
};

test('returns an owned compatible presentation first', () => {
  const result = evaluatePresentationPlanner(base);
  assert.equal(result.status, 'evaluated');
  assert.equal(result.plans[0].id, 'owned-compatible');
  assert.equal(result.noPurchaseFirst, true);
});

test('excludes non-owned candidates in inventory-only mode', () => {
  const result = evaluatePresentationPlanner(base);
  assert.ok(result.excluded.some((item) => item.id === 'popular-not-owned' && item.reason === 'not_in_owned_inventory'));
});

test('hard-excludes equipment mismatches regardless of evidence score', () => {
  const result = evaluatePresentationPlanner(base);
  assert.ok(result.excluded.some((item) => item.id === 'owned-mismatch' && item.reason === 'equipment_mismatch'));
  assert.ok(!result.plans.some((plan) => plan.id === 'owned-mismatch'));
});

test('rejects exact location data', () => {
  const result = evaluatePresentationPlanner({ ...base, exactLocation: 'private coordinates' });
  assert.equal(result.status, 'invalid');
  assert.ok(result.errors.includes('exact location data is prohibited'));
});

test('states that the result is not a catch guarantee', () => {
  const result = evaluatePresentationPlanner(base);
  assert.match(result.interpretation, /not a catch/i);
});

console.log('All Presentation Planner tests passed.');
