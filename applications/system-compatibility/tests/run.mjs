import assert from 'node:assert/strict';
import { evaluateSystemCompatibility } from '../evaluate.mjs';

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}

const base = {
  useClass: 'freshwater_spinning',
  rod: { lineMinLb: 6, lineMaxLb: 14, lureMinOz: 0.125, lureMaxOz: 0.625, action: 'fast' },
  reel: { capacityYards: 140 },
  mainLine: { material: 'braid', strengthLb: 10 },
  leader: { material: 'fluorocarbon', strengthLb: 8 },
  terminal: { weightOz: 0.25 },
  requiredLineYards: 100,
  connectionType: 'double_uni',
  identityEvidence: 'primary_evidence',
  fieldConditions: { cover: 'moderate', current: 'moderate', wind: 'light' },
  handlingGoal: 'mixed'
};

test('returns a compatible system for known in-range properties', () => {
  const result = evaluateSystemCompatibility(base);
  assert.equal(result.tier, 'compatible');
  assert.equal(result.locationData, 'not_collected');
});

test('hard rating mismatch is not averaged away', () => {
  const result = evaluateSystemCompatibility({
    ...base,
    terminal: { weightOz: 1.25 }
  });
  assert.equal(result.tier, 'mismatch');
  assert.ok(result.failures.includes('terminal_weight_outside_rod_rating'));
});

test('recollection does not authorize exact model specifications', () => {
  const result = evaluateSystemCompatibility({
    ...base,
    identityEvidence: 'contributor_recollection'
  });
  assert.equal(result.identity.useExactModelSpecifications, false);
  assert.ok(result.unknowns.includes('exact_product_identity_not_primary_verified'));
  assert.notEqual(result.tier, 'compatible');
});

test('missing properties produce insufficient information', () => {
  const result = evaluateSystemCompatibility({
    useClass: 'freshwater_spinning',
    rod: {},
    reel: {},
    mainLine: {},
    terminal: {},
    identityEvidence: 'unknown'
  });
  assert.equal(result.tier, 'insufficient_information');
});

test('exact location data is rejected', () => {
  const result = evaluateSystemCompatibility({
    ...base,
    exactLocation: 'private water coordinates'
  });
  assert.equal(result.status, 'invalid');
  assert.ok(result.errors.includes('exact location data is prohibited'));
});

console.log('All System Compatibility tests passed.');
