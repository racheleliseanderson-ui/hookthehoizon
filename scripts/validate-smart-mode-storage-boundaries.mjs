import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const contract = JSON.parse(await readFile(new URL('../governance/applications/smart-mode-storage-consent-boundaries.v1.json', import.meta.url), 'utf8'));
const app = await readFile(new URL('../applications/presentation-planner/preview/app.mjs', import.meta.url), 'utf8');
const html = await readFile(new URL('../applications/presentation-planner/preview/index.html', import.meta.url), 'utf8');

assert.equal(contract.applicationId, 'HTH-SM-001');
assert.equal(contract.accountableOwner, 'Rachel Anderson');
assert.equal(contract.currentConsumers.length, 1);
assert.equal(contract.currentConsumers[0].applicationId, 'HTH-PP-001');
assert.deepEqual(contract.notCurrentConsumers.sort(), ['HHI-001', 'HTH-HM-001', 'HTH-RS-001', 'HTH-SC-001'].sort());
assert.equal(contract.storage.default, 'session_only_no_persistence');
assert.equal(contract.storage.consentRequired, true);
assert.equal(contract.storage.consentMayBeWithdrawn, true);
assert.equal(contract.storage.retention.recommendationHistoryMaximum, 50);
assert.equal(contract.storage.retention.outcomeHistoryMaximum, 200);
assert.equal(contract.storage.retention.remoteBackup, false);
assert.match(contract.analytics.rule, /named product decision/i);
assert.match(contract.deferredArchitecture.accounts, /Deferred/i);
assert.match(contract.deferredArchitecture.crossProductIdentity, /Deferred/i);
assert.match(contract.deferredArchitecture.remoteSavedWorkspace, /Deferred/i);
assert.match(contract.deferredArchitecture.nativeWrapper, /tested native utility/i);

const expectedKeys = contract.currentConsumers[0].storageKeys;
for (const key of expectedKeys) assert.ok(app.includes(`'${key}'`), `Missing Smart Mode key ${key}`);
assert.match(app, /function hasStorageConsent\(\)/);
assert.match(app, /if \(!hasStorageConsent\(\)\) return;/);
assert.match(app, /clearPersistentSmartModeData\(\)/);
assert.match(app, /session_only/);
assert.match(app, /local_device_by_explicit_consent/);
assert.match(app, /publicPlanExport/);
assert.match(app, /copyPlanSummary/);
assert.match(app, /downloadJson/);
assert.match(html, /id="save-consent"/);
assert.match(html, /Nothing is stored until selected/i);
assert.match(html, /id="copy-plan"/);
assert.match(html, /id="export-plan"/);
assert.match(html, /Print \/ PDF/);
assert.match(html, /<noscript>/);
assert.match(html, /field worksheet/i);
assert.match(html, /Presentation Planner only/i);

for (const prohibited of ['exact location', 'coordinates', 'private access instructions']) {
  assert.ok(contract.storage.prohibitedFields.includes(prohibited));
}
for (const evidence of ['no persistence before consent', 'persistence after consent', 'withdrawal deletes all keys', 'clear data deletes all keys and consent']) {
  assert.ok(contract.releaseEvidence.includes(evidence));
}

console.log('Smart Mode storage, consent, deletion, output, and consumer boundaries passed validation.');
