import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assessOfficialFacts, assessOfficialFact, summarizeConfidence } from '../freshness.mjs';
import { inspectSensitiveLocation, rejectSensitiveLocation, sanitizePublicPayload } from '../privacy.mjs';

const fixture = JSON.parse(fs.readFileSync(new URL('../../fixtures/official-source-freshness.json', import.meta.url), 'utf8'));
const evaluationTime = new Date(fixture.effectiveDate);

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}

test('official-source fixtures name an owner, current-check path, reviewed date, and next review date', () => {
  for (const [key, fact] of Object.entries(fixture.facts)) {
    assert.ok(fact.sourceOwner, `${key} source owner`);
    assert.match(fact.currentCheckUrl, /^https:\/\//, `${key} current check URL`);
    assert.ok(Number.isFinite(Date.parse(fact.reviewedAt)), `${key} reviewedAt`);
    assert.ok(Number.isFinite(Date.parse(fact.nextReviewAt)), `${key} nextReviewAt`);
  }
  const confidence = summarizeConfidence(assessOfficialFacts(fixture.facts, evaluationTime));
  assert.equal(confidence.level, 'supported');
});

test('stale critical evidence blocks the affected result', () => {
  const stale = assessOfficialFact('regulation', {
    ...fixture.facts.regulation,
    reviewedAt: '2026-06-01T08:00:00Z',
    nextReviewAt: '2026-06-08T08:00:00Z'
  }, evaluationTime);
  assert.equal(stale.stale, true);
  assert.equal(stale.blocked, true);
  assert.equal(stale.confidenceImpact, 'blocked');
});

test('unavailable critical evidence blocks while unavailable noncritical evidence reduces confidence', () => {
  const closure = assessOfficialFact('closure', { ...fixture.facts.closure, status: 'source_unavailable' }, evaluationTime);
  const weather = assessOfficialFact('weather', { ...fixture.facts.weather, status: 'source_unavailable' }, evaluationTime);
  assert.equal(closure.blocked, true);
  assert.equal(weather.blocked, false);
  assert.equal(weather.confidenceImpact, 'reduced');
});

test('recursive inspection finds coordinates, private access, vulnerable-water IDs, and contributor-sensitive keys', () => {
  const payload = {
    renderedPage: { summary: 'Meet at 39.7392, -104.9903', contributorEmail: 'private@example.test' },
    restResponse: { privateAccessInstructions: 'Use the private road and gate code 4812' },
    analytics: { values: { vulnerableWaterId: 'VULNERABLE-WATER-17' } },
    logs: ['Latitude: 39.7392; longitude=-104.9903'],
    export: { waypoint: 'secret-waypoint' },
    shareState: { link: 'https://maps.google.com/example' }
  };
  const findings = inspectSensitiveLocation(payload);
  const reasons = new Set(findings.map((item) => item.reason));
  assert.ok(reasons.has('coordinate_pair') || reasons.has('coordinate_label'));
  assert.ok(reasons.has('private_access_instruction'));
  assert.ok(reasons.has('vulnerable_water_identifier'));
  assert.ok(reasons.has('contributor_sensitive'));
  assert.ok(reasons.has('sensitive_location_key'));
});

test('sanitization prevents leakage through rendered pages, REST, analytics, logs, exports, and share states', () => {
  const secretTokens = ['39.7392', '-104.9903', '4812', 'VULNERABLE-WATER-17', 'private@example.test', 'secret-waypoint', 'maps.google.com'];
  const surfaces = {
    renderedPages: { html: 'Location 39.7392, -104.9903', contributorEmail: 'private@example.test' },
    restResponses: { privateAccessInstructions: 'Gate code 4812' },
    analyticsPayloads: { vulnerableWaterId: 'VULNERABLE-WATER-17' },
    logs: { message: 'Latitude: 39.7392; longitude=-104.9903' },
    exports: { waypoint: 'secret-waypoint' },
    shareStates: { url: 'https://maps.google.com/example' }
  };
  const sanitized = sanitizePublicPayload(surfaces);
  assert.equal(sanitized.ok, false);
  const serialized = JSON.stringify(sanitized.sanitized);
  for (const token of secretTokens) assert.equal(serialized.includes(token), false, `leaked ${token}`);
});

test('input rejection fails closed before evaluation', () => {
  const rejected = rejectSensitiveLocation({ publicRegion: 'Broad public region', notes: 'Use the private road and gate code 4812' });
  assert.equal(rejected.ok, false);
  assert.ok(rejected.findings.some((item) => item.reason === 'private_access_instruction'));
});

console.log('All freshness and sensitive-location tests passed.');
