import assert from 'node:assert/strict';
import { evaluateHoneyHole } from '../evaluate.mjs';
import { createTripReadinessAnalyticsEvent, createTripReadinessEnvelope } from '../core-integration.mjs';

const now = new Date('2026-07-16T21:00:00Z');
const facts = Object.fromEntries(['closure','hazard','weather','waterCondition','regulation','permit','access','ownership','conservation'].map((key) => [key, {
  value: key === 'closure' ? 'open' : key === 'access' ? 'permitted' : key === 'hazard' ? 'normal' : true,
  status: 'official_current',
  verifiedAt: '2026-07-16',
  sourceUrl: `https://example.gov/${key}`
}]));
const domain = evaluateHoneyHole({
  publicRegion: 'Broad public region',
  tripType: 'day_trip',
  facts,
  gearReady: true,
  backupPlanReady: true
}, now);
const envelope = createTripReadinessEnvelope(domain, { resultId: 'hhi-test-result', generatedAt: now.toISOString() });

assert.equal(envelope.core.commitPin, '83e2d80efa8125aed986be5317b3b43a06884bbc');
assert.equal(envelope.answer.code, domain.decisionState);
assert.equal(envelope.evidenceAssessment.hardStopCount, 0);
assert.equal(envelope.privacy.class, 'high');
assert.doesNotThrow(() => createTripReadinessAnalyticsEvent('trip_safety_check_complete', { unknownCount: 0, hardStopCount: 0 }));
assert.throws(() => createTripReadinessAnalyticsEvent('trip_safety_check_complete', { coordinates: 'redacted' }), /Prohibited analytics field/);
assert.throws(() => createTripReadinessAnalyticsEvent('invented_event', {}), /Unsupported/);
console.log('Honey Hole Intelligence exact-pinned Core integration tests passed.');
