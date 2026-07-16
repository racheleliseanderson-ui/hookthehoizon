import assert from 'node:assert/strict';
import { evaluatePresentationPlanner } from '../evaluate.mjs';
import { seedPresentations } from '../data/seed-presentations.mjs';

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
  method: 'freshwater_spinning',
  waterType: 'reservoir',
  tripGoal: 'test_a_hypothesis',
  structureBand: 'rock',
  depthBand: 'bottom',
  conditions: ['clear', 'bright', 'calm'],
  inventoryOnly: true,
  inventoryIds: ['owned-moving-contrast', 'owned-bottom-compact', 'owned-suspending-pause'],
  candidates: seedPresentations,
  systemCompatibility: {
    'preview-moving-contrast': { applicationId: 'HTH-SC-001', tier: 'compatible' },
    'preview-bottom-compact': { applicationId: 'HTH-SC-001', tier: 'compatible' },
    'preview-suspending-pause': { applicationId: 'HTH-SC-001', tier: 'conditional' }
  }
};

test('uses method, water, structure, depth, conditions, and trip goal in ranking', () => {
  const result = evaluatePresentationPlanner(base, now);
  assert.equal(result.status, 'evaluated');
  assert.equal(result.plans[0].id, 'preview-bottom-compact');
  assert.equal(result.plans[0].role, 'best_supported');
});

test('returns contrast and fallback roles when distinct candidates exist', () => {
  const result = evaluatePresentationPlanner(base, now);
  assert.ok(result.plans.some((plan) => plan.role === 'contrast_experiment'));
  assert.ok(result.plans.some((plan) => plan.role === 'fallback'));
});

test('hard-excludes System Compatibility mismatch', () => {
  const result = evaluatePresentationPlanner({
    ...base,
    systemCompatibility: { ...base.systemCompatibility, 'preview-bottom-compact': { applicationId: 'HTH-SC-001', tier: 'mismatch' } }
  }, now);
  assert.ok(result.excluded.some((item) => item.id === 'preview-bottom-compact' && item.reason === 'equipment_mismatch'));
  assert.ok(!result.plans.some((plan) => plan.id === 'preview-bottom-compact'));
});

test('excludes non-owned items in inventory-only mode', () => {
  const result = evaluatePresentationPlanner({ ...base, inventoryIds: ['owned-bottom-compact'] }, now);
  assert.ok(result.excluded.some((item) => item.reason === 'not_in_owned_inventory'));
});

test('rejects nested coordinates and map links', () => {
  const result = evaluatePresentationPlanner({ ...base, notes: { route: '39.12345, -104.12345' } }, now);
  assert.equal(result.status, 'invalid');
  assert.ok(result.privacyFindings.length);
});

test('requires source-ledger references', () => {
  const unsourced = { ...seedPresentations[0], id: 'unsourced', sourceIds: [] };
  const result = evaluatePresentationPlanner({ ...base, candidates: [unsourced] }, now);
  assert.ok(result.excluded.some((item) => item.reason === 'missing_source_ledger_reference'));
});

test('does not let raw popularity volume determine rank', () => {
  const boosted = seedPresentations.map((item) => ({ ...item }));
  boosted[0] = { ...boosted[0], outcomeSummary: { exposures: 10000, positive: 5100, negative: 4900 } };
  const result = evaluatePresentationPlanner({ ...base, candidates: boosted }, now);
  assert.equal(result.plans[0].id, 'preview-bottom-compact');
});

console.log('All Presentation Planner tests passed.');
