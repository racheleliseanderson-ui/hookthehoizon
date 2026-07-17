import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const doc = JSON.parse(await readFile(new URL('../data/current-region-condition-packets.v0.1.json', import.meta.url), 'utf8'));
assert.equal(doc.applicationId, 'HHI-001');
assert.equal(doc.packets.length, 3);
assert.match(doc.publicationBoundary, /same-day official verification/i);
for (const packet of doc.packets) {
  assert.match(packet.id, /^HHI-COND-/);
  assert.match(packet.officialSourceUrl, /^https:\/\//);
  assert.ok(Date.parse(packet.retrievedAt));
  assert.ok(Date.parse(packet.nextReviewAt));
  assert.ok(packet.effectiveWindow.start && packet.effectiveWindow.end);
  assert.ok(packet.facts.length > 0);
  assert.ok(packet.criticalUnknowns.length >= 4);
  assert.equal(packet.privacy.classification, 'public_region_only');
  assert.equal(packet.privacy.preciseLocationIncluded, false);
  assert.equal(packet.publicationEligibility, 'eligible_until_review');
  for (const fact of packet.facts) {
    assert.equal(fact.status, 'verified_current');
    assert.match(fact.sourceUrl, /^https:\/\//);
  }
}
assert.ok(doc.packets.some((packet) => packet.status.includes('volatile')));
console.log('Current broad-region condition packets passed bounded validation.');