import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const doc = JSON.parse(await readFile(new URL('../data/source-records.v0.1.json', import.meta.url), 'utf8'));
assert.equal(doc.schemaVersion, '0.1.0');
assert.equal(doc.applicationId, 'HHI-001');
assert.ok(doc.records.length >= 2);
for (const r of doc.records) {
  assert.match(r.sourceUrl, /^https:\/\//);
  assert.ok(r.sourceAuthority);
  assert.ok(Date.parse(r.retrievedAt));
  assert.ok(r.freshness.reviewWindowDays > 0);
  assert.ok(Date.parse(r.freshness.nextReviewAt));
  assert.ok(r.evidence.length > 0);
  assert.ok(r.unknowns.length > 0);
  assert.equal(r.publicationEligibility, 'eligible_with_limits');
  assert.equal(r.preciseLocationIncluded, false);
}
console.log('Reference records passed validation.');
