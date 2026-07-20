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

test('returns compatible for known in-range properties', () => {
  const result = evaluateSystemCompatibility(base);
  assert.equal(result.tier, 'compatible');
  assert.equal(result.privacy.locationData, 'not_collected');
  assert.equal(result.ruleVersion, '0.2.0');
});

test('rating boundaries are inclusive', () => {
  const lower = evaluateSystemCompatibility({ ...base, terminal: { weightOz: base.rod.lureMinOz } });
  const upper = evaluateSystemCompatibility({ ...base, terminal: { weightOz: base.rod.lureMaxOz } });
  assert.equal(lower.tier, 'compatible');
  assert.equal(upper.tier, 'compatible');
});

test('terminal hard mismatch is not averaged away', () => {
  const result = evaluateSystemCompatibility({ ...base, terminal: { weightOz: 1.25 } });
  assert.equal(result.tier, 'mismatch');
  assert.ok(result.failures.includes('terminal_weight_outside_rod_rating'));
  assert.equal(result.checks.find((check) => check.key === 'rod_lure_rating').consequence, 'stop');
});

test('main-line hard mismatch is not averaged away', () => {
  const result = evaluateSystemCompatibility({ ...base, mainLine: { material: 'braid', strengthLb: 20 } });
  assert.equal(result.tier, 'mismatch');
  assert.ok(result.failures.includes('main_line_outside_rod_rating'));
});

test('reel-capacity hard mismatch is not averaged away', () => {
  const result = evaluateSystemCompatibility({ ...base, reel: { capacityYards: 50 } });
  assert.equal(result.tier, 'mismatch');
  assert.ok(result.failures.includes('reel_capacity_insufficient'));
});

test('recollection produces test-before-use and forbids exact model assumptions', () => {
  const result = evaluateSystemCompatibility({ ...base, identityEvidence: 'contributor_recollection' });
  assert.equal(result.tier, 'test_before_use');
  assert.equal(result.identity.useExactModelSpecifications, false);
  assert.ok(result.unknowns.includes('exact_product_identity_not_primary_verified'));
});

test('missing properties produce insufficient information', () => {
  const result = evaluateSystemCompatibility({
    useClass: 'freshwater_spinning',
    rod: {}, reel: {}, mainLine: {}, terminal: {}, identityEvidence: 'unknown'
  });
  assert.equal(result.tier, 'insufficient_information');
});

test('one material condition produces compatible-with-conditions', () => {
  const result = evaluateSystemCompatibility({
    ...base,
    terminal: { weightOz: 0.125 },
    fieldConditions: { ...base.fieldConditions, current: 'strong' }
  });
  assert.equal(result.tier, 'compatible_with_conditions');
  assert.ok(result.conditions.includes('terminal_weight_may_not_control_depth_or_presentation_in_strong_current'));
});

test('multiple material conditions produce test-before-use', () => {
  const result = evaluateSystemCompatibility({
    ...base,
    mainLine: { material: 'monofilament', strengthLb: 10 },
    terminal: { weightOz: 0.125 },
    fieldConditions: { cover: 'heavy', current: 'strong', wind: 'light' }
  });
  assert.equal(result.tier, 'test_before_use');
  assert.equal(result.conditions.length, 2);
});

test('non-object input is invalid', () => {
  assert.equal(evaluateSystemCompatibility(null).status, 'invalid');
});

test('invalid rating ranges stop evaluation', () => {
  const result = evaluateSystemCompatibility({
    ...base,
    rod: { ...base.rod, lureMinOz: 1, lureMaxOz: 0.25 }
  });
  assert.equal(result.status, 'invalid');
  assert.ok(result.errors.includes('rod lure rating minimum cannot exceed maximum'));
});

test('negative values stop evaluation', () => {
  const result = evaluateSystemCompatibility({ ...base, requiredLineYards: -1 });
  assert.equal(result.status, 'invalid');
  assert.ok(result.errors.includes('required line must be a non-negative number'));
});

test('nested exact location data is rejected', () => {
  const result = evaluateSystemCompatibility({
    ...base,
    privateNotes: { coordinates: '39.0000,-105.0000' }
  });
  assert.equal(result.status, 'invalid');
  assert.ok(result.errors.some((error) => error.includes('exact location data is prohibited')));
});

test('deeply nested access codes are rejected', () => {
  const result = evaluateSystemCompatibility({
    ...base,
    metadata: { trip: { gateCode: '1234' } }
  });
  assert.equal(result.status, 'invalid');
  assert.ok(result.errors.some((error) => error.includes('metadata.trip.gateCode')));
});

test('deterministic inputs return deterministic results', () => {
  assert.deepEqual(evaluateSystemCompatibility(base), evaluateSystemCompatibility(base));
});

test('public-output privacy contract is stable', () => {
  assert.deepEqual(evaluateSystemCompatibility(base).privacy, {
    locationData: 'not_collected',
    protectedFieldsRejected: true,
    publicOutput: 'broad conditions and equipment facts only'
  });
});

console.log('All expanded System Compatibility state tests passed.');
