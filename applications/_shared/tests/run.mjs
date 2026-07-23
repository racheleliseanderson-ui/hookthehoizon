import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKnowledgeGraph, graphFromPresentationCandidates, traverseKnowledgeGraph } from '../knowledge-graph.mjs';
import { generatePersonalizedPlan, summarizeMastery } from '../personalization.mjs';
import { classifyPrivacy, rejectSensitiveLocation, sanitizePublicPayload } from '../privacy.mjs';
import { seedPresentations } from '../../presentation-planner/data/seed-presentations.mjs';

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

const profile = {
  profileId: 'local-preview',
  preferredSpecies: ['bass'],
  skillBand: 'developing',
  tripGoals: ['test_a_hypothesis'],
  preferredMethods: ['freshwater_spinning'],
  privacy: { classification: 'local_only', retention: 'local_device', shareAllowed: false, analyticsAllowed: false }
};

const inventory = seedPresentations.slice(0, 3).map((item) => ({
  itemId: item.inventoryId,
  itemType: 'lure',
  label: item.label,
  privacy: { classification: 'local_only', retention: 'local_device', shareAllowed: false, analyticsAllowed: false }
}));

const conditions = {
  method: 'freshwater_spinning',
  waterType: 'reservoir',
  tripGoal: 'test_a_hypothesis',
  structureBand: 'rock',
  depthBand: 'bottom',
  conditionBands: ['clear', 'bright', 'calm']
};

test('shared contract parses and exposes a version', () => {
  const contract = JSON.parse(fs.readFileSync(path.join(here, '..', 'contracts.v1.json'), 'utf8'));
  assert.equal(contract.version, '1.0.0');
  assert.ok(contract.$defs.userProfile);
  assert.ok(contract.$defs.deviceEvent);
});

test('recursive privacy inspection rejects nested coordinates and map links', () => {
  const result = rejectSensitiveLocation({ notes: { pin: '39.12345, -104.12345', map: 'https://maps.google.com/private' } });
  assert.equal(result.ok, false);
  assert.ok(result.findings.length >= 2);
});

test('public sanitizer removes sensitive keys and redacts sensitive strings', () => {
  const result = sanitizePublicPayload({ private_water_name: 'secret', notes: 'lat: 39.12345' });
  assert.equal(result.sanitized.private_water_name, undefined);
  assert.equal(result.sanitized.notes, '[redacted-sensitive]');
});

test('public sanitizer removes private access and contributor-sensitive fields', () => {
  const result = sanitizePublicPayload({ privateAccessInstructions: 'Gate code 4812', contributorEmail: 'private@example.test' });
  assert.equal(result.sanitized.privateAccessInstructions, undefined);
  assert.equal(result.sanitized.contributorEmail, undefined);
  assert.ok(result.findings.some((item) => item.reason === 'private_access_instruction'));
  assert.ok(result.findings.some((item) => item.reason === 'contributor_sensitive'));
});

test('unknown privacy classes fail closed', () => {
  assert.equal(classifyPrivacy('publik').disposition, 'reject');
  assert.equal(classifyPrivacy('public_safe').disposition, 'public');
  assert.equal(classifyPrivacy('local_only').disposition, 'local');
});

test('Smart Mode ranks the declared method, water, structure, depth, and inventory', () => {
  const result = generatePersonalizedPlan({ profile, inventory, conditions, candidates: seedPresentations, now: new Date('2026-07-16T12:00:00Z') });
  assert.equal(result.status, 'evaluated');
  assert.equal(result.plans[0].id, 'bottom-compact');
  assert.equal(result.plans[0].role, 'best_supported');
});

test('Smart Mode returns contrast and fallback roles', () => {
  const result = generatePersonalizedPlan({ profile, inventory, conditions, candidates: seedPresentations, now: new Date('2026-07-16T12:00:00Z') });
  assert.ok(result.plans.some((plan) => plan.role === 'contrast_experiment'));
  assert.ok(result.plans.some((plan) => plan.role === 'fallback'));
});

test('Smart Mode does not let raw history volume overwhelm current fit', () => {
  const outcomes = [];
  for (let index = 0; index < 200; index += 1) {
    outcomes.push({ outcomeId: `outcome-${index}`, candidateId: 'moving-contrast', result: index % 2 ? 'positive' : 'negative', recordedAt: '2026-07-01T00:00:00Z', exposure: 1, changedVariable: 'pause' });
  }
  const result = generatePersonalizedPlan({ profile, inventory, conditions, candidates: seedPresentations, outcomes, now: new Date('2026-07-16T12:00:00Z') });
  assert.equal(result.plans[0].id, 'bottom-compact');
});

test('Smart Mode rejects location-sensitive profile input', () => {
  const result = generatePersonalizedPlan({ profile: { ...profile, home_waterbody_ids: ['private-water'] }, inventory, conditions, candidates: seedPresentations });
  assert.equal(result.status, 'invalid');
});

test('mastery summary counts negative and inconclusive tests', () => {
  const summary = summarizeMastery([
    { candidateId: 'a', result: 'positive', changedVariable: 'depth' },
    { candidateId: 'a', result: 'negative', changedVariable: 'cadence' },
    { candidateId: 'b', result: 'inconclusive', changedVariable: 'depth' }
  ]);
  assert.equal(summary.experiments, 3);
  assert.equal(summary.negative, 1);
  assert.equal(summary.inconclusive, 1);
  assert.equal(summary.variablesTested, 2);
});

test('knowledge graph connects presentations to conditions and species', () => {
  const graph = graphFromPresentationCandidates(seedPresentations);
  assert.equal(graph.status, 'ready');
  const traversal = traverseKnowledgeGraph(graph, 'presentation:bottom-compact', { relations: ['fits', 'supports'], maxDepth: 1 });
  assert.equal(traversal.status, 'traversed');
  assert.ok(traversal.paths.some((pathItem) => pathItem.edge.to === 'condition:clear'));
  assert.ok(traversal.paths.some((pathItem) => pathItem.edge.to === 'species:bass'));
});

test('knowledge graph rejects missing-node edges', () => {
  const graph = buildKnowledgeGraph({
    nodes: [{ nodeId: 'condition:clear', kind: 'condition', label: 'clear', privacy: { classification: 'public_safe', retention: 'none' } }],
    edges: [{ edgeId: 'bad-edge', from: 'condition:clear', to: 'missing', relation: 'supports', evidenceState: 'unknown' }]
  });
  assert.equal(graph.status, 'ready');
  assert.equal(graph.rejectedEdges[0].reason, 'missing_node');
});

console.log('All Horizon shared intelligence tests passed.');
