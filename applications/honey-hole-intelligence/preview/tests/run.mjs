import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', base), 'utf8');
const script = await readFile(new URL('app.mjs', base), 'utf8');
const css = await readFile(new URL('styles.css', base), 'utf8');

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}

test('asks for broad public-region facts and rejects sensitive input by contract', () => {
  assert.match(html, /name="publicRegion"/);
  assert.match(html, /Do not enter coordinates, map links, private access points/);
  assert.match(script, /sensitive_location_rejected/);
  assert.match(html, /<noscript>/);
});

test('exposes invalid, hard-stop, unknown, stale, source, and backup states', () => {
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(script, /output\.status === 'invalid'/);
  assert.match(script, /output\.hardStops/);
  assert.match(script, /output\.unknownFields/);
  assert.match(script, /output\.staleFields/);
  assert.match(script, /output\.backupPlan/);
});

test('implements canonical Honey Hole outcome events without location payloads', () => {
  for (const eventName of ['official_regulation_opened', 'trip_safety_check_complete', 'conservation_controls_acknowledged', 'public_safe_location_used']) {
    assert.match(script, new RegExp(eventName));
  }
  assert.doesNotMatch(script, /emit\([^\n]+publicRegion|emit\([^\n]+sourceUrl|coordinates.*emit/);
});

test('supports focus, mobile, reduced-motion, forced-colors, and print behavior', () => {
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(max-width/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /forced-colors/);
  assert.match(css, /@media print/);
});

console.log('All Honey Hole Intelligence preview tests passed.');
