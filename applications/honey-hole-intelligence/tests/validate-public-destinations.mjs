import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dataPath = new URL('../data/public-destination-records.v0.2.json', import.meta.url);
const pluginPath = new URL('../../../wordpress-plugin/honey-hole-condition-route/honey-hole-condition-route.php', import.meta.url);
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const plugin = readFileSync(pluginPath, 'utf8');
const today = new Date(process.env.HHI_TEST_DATE || new Date().toISOString().slice(0, 10));

assert.equal(data.applicationId, 'HHI-001');
assert.match(data.schemaVersion, /^0\.[3-9]\./);
assert.equal(data.coverage.destinationCount, data.destinations.length);
assert.ok(data.destinations.length >= 10, 'dataset must contain at least 10 destinations');

const ids = new Set();
const accessKeys = new Set();
const waterTypes = new Set();
const states = new Set();
const forbiddenKeys = /secret|privateLocation|gateCombination|landowner|userCoordinates|sensitiveCoordinates/i;

for (const destination of data.destinations) {
  for (const key of Object.keys(destination)) assert.ok(!forbiddenKeys.test(key), `forbidden field ${key}`);
  assert.match(destination.id, /^HHI-DEST-\d{3}$/);
  assert.ok(!ids.has(destination.id), `duplicate id ${destination.id}`);
  ids.add(destination.id);
  assert.ok(destination.state && destination.region && destination.waterbody && destination.waterType);
  assert.match(destination.officialSourceUrl, /^https:\/\//);
  assert.ok(Array.isArray(destination.publicAccess) && destination.publicAccess.length > 0);
  assert.ok(Array.isArray(destination.currentNotices) && destination.currentNotices.length > 0);
  assert.ok(Array.isArray(destination.directVerification) && destination.directVerification.length > 0);
  assert.deepEqual(destination.privacy, {
    classification: 'public_destination',
    publicLocationIncluded: true,
    sensitiveLocationIncluded: false,
  });
  const review = new Date(`${destination.nextReviewAt}T23:59:59Z`);
  assert.ok(review >= today || /restricted|closure|hazard|limited/.test(destination.status), `expired unqualified record ${destination.id}`);
  for (const access of destination.publicAccess) {
    assert.equal(access.officiallyPublished, true);
    const key = `${destination.id}|${access.name.toLowerCase()}|${access.type}`;
    assert.ok(!accessKeys.has(key), `duplicate access record ${key}`);
    accessKeys.add(key);
  }
  waterTypes.add(destination.waterType);
  states.add(destination.state);
}

for (const type of ['lake', 'reservoir', 'river', 'stream', 'marine']) assert.ok(waterTypes.has(type), `missing ${type}`);
assert.ok(states.size >= 4, 'insufficient geographic coverage');

const filter = (state = '', waterbody = '') => data.destinations.filter((d) =>
  (!state || d.state.toLowerCase() === state.toLowerCase()) &&
  (!waterbody || d.waterbody.toLowerCase().includes(waterbody.toLowerCase()))
);
assert.ok(filter('Colorado').length >= 3);
assert.equal(filter('', 'Madison River').length, 1);
assert.equal(filter('Florida', 'Florida tidal').length, 1);
assert.equal(filter('Nevada').length, 0);

assert.match(plugin, /Version:\s*0\.3\.0/);
assert.match(plugin, /publicLocationIncluded/);
assert.match(plugin, /sensitiveLocationIncluded/);
assert.match(plugin, /hth_honey_hole/);
assert.match(plugin, /@media print/);
assert.match(plugin, /aria-live/);
assert.match(plugin, /state/);
assert.match(plugin, /waterbody/);

console.log(`Honey Hole acceptance passed: ${data.destinations.length} destinations, ${states.size} states, ${waterTypes.size} water types.`);
