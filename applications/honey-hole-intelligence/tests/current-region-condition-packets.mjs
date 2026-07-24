import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const doc = JSON.parse(await readFile(new URL('../data/current-region-condition-packets.v0.1.json', import.meta.url), 'utf8'));
assert.equal(doc.applicationId, 'HHI-001');
assert.equal(doc.schemaVersion, '0.2.0');
assert.equal(doc.packets.length, 3);
assert.match(doc.publicationBoundary, /same-day official verification/i);
assert.equal(doc.operations.recordCarrierId, 'HHI-DATA-001');
assert.equal(doc.operations.maintenanceOwner, 'Hook the Horizon field intelligence operations');
assert.equal(doc.operations.accountableOwner, 'Rachel Anderson');
assert.equal(doc.operations.fieldVolatilityDays.closure, 1);
assert.equal(doc.operations.fieldVolatilityDays.regulation, 7);
assert.equal(doc.operations.fieldVolatilityDays.access, 30);
assert.equal(doc.operations.fieldVolatilityDays.conservation, 90);
assert.match(doc.operations.expiryBehavior, /withheld/i);
assert.match(doc.operations.conflictPreservation, /conflicting official statement/i);
assert.ok(doc.operations.correctionHistory.length >= 1);

for (const packet of doc.packets) {
  assert.match(packet.id, /^HHI-COND-/);
  assert.match(packet.officialSourceUrl, /^https:\/\//);
  assert.ok(packet.sourceAuthority.length >= 5);
  assert.ok(Date.parse(packet.retrievedAt));
  assert.ok(Date.parse(packet.effectiveAt));
  assert.ok(Date.parse(packet.reviewedAt));
  assert.ok(Date.parse(packet.nextReviewAt));
  assert.ok(packet.effectiveWindow.start && packet.effectiveWindow.end);
  assert.ok(packet.fieldVolatilityClass.length >= 5);
  assert.equal(packet.freshnessState, 'expired_requires_official_refresh');
  assert.ok(packet.facts.length > 0);
  assert.ok(packet.criticalUnknowns.length >= 4);
  assert.ok(Array.isArray(packet.conflicts));
  assert.ok(Array.isArray(packet.correctionHistory));
  assert.equal(packet.privacy.classification, 'public_region_only');
  assert.equal(packet.privacy.preciseLocationIncluded, false);
  assert.equal(packet.publicationEligibility, 'withheld_pending_refresh');
  for (const fact of packet.facts) {
    assert.equal(fact.status, 'verified_at_retrieval');
    assert.match(fact.sourceUrl, /^https:\/\//);
    assert.match(fact.claim, /recorded retrieval time/i);
  }
}
assert.ok(doc.packets.some((packet) => packet.status.includes('volatile')));
console.log('Current broad-region condition packets passed maintained, expired-state validation.');
