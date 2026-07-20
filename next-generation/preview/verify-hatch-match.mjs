import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();

try {
  await page.goto('http://localhost:8899/hatch-match-preview/', { waitUntil: 'networkidle' });
  const frame = page.frames().find((candidate) => candidate.url().includes('/hatch-match-preview/assets/preview/index.html'));
  assert.ok(frame, 'Hatch Match iframe did not load.');
  await frame.locator('h1').waitFor();
  assert.match(await frame.locator('h1').innerText(), /actually see/i);
  assert.equal(await frame.locator('input[name="cue"]').count(), 5);

  await frame.locator('select[name="waterType"]').selectOption('stream');
  await frame.locator('select[name="lifeStage"]').selectOption('larva');
  await frame.locator('input[value="portable-case"]').check();
  await frame.locator('#hatch-form button[type="submit"]').click();
  await frame.locator('.match').first().waitFor();
  assert.match(await frame.locator('.match h2').first().innerText(), /caddisfly/i);
  assert.match(await frame.locator('#status').innerText(), /compared locally/i);
  assert.equal(await frame.evaluate(() => Object.keys(localStorage).length), 0, 'Hatch Match persisted reader data.');
  assert.equal(await frame.locator('input[name*="location"], input[name*="coordinate"], input[name*="gps"]').count(), 0, 'Sensitive-location input exists.');

  await page.screenshot({ path: 'preview-evidence/hatch-match-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: 'preview-evidence/hatch-match-mobile.png', fullPage: true });
} finally {
  await browser.close();
}
