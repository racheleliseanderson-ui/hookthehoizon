import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true, reducedMotion: 'reduce' });
const page = await context.newPage();

try {
  await page.goto('http://localhost:8899/presentation-planner-preview/', { waitUntil: 'networkidle' });
  const frameElement = page.locator('iframe.hth-application-embed__frame');
  await frameElement.waitFor({ state: 'visible' });
  const frame = page.frames().find((candidate) => candidate.url().includes('/assets/presentation-planner/preview/index.html'));
  assert.ok(frame, 'Presentation Planner iframe did not load the packaged runtime.');

  await frame.locator('h1').waitFor();
  assert.match(await frame.locator('h1').innerText(), /smarter field test/i);
  assert.equal(await frame.locator('#inventory input[type="checkbox"]').count() > 0, true, 'Owned-inventory fixtures were not rendered.');

  await frame.locator('#inventory input[type="checkbox"]').first().check();
  await frame.locator('#conditions input[value="clear"]').check();
  await frame.locator('#planner-form button[type="submit"]').click();
  await frame.locator('#results .plan').first().waitFor();

  assert.equal(await frame.locator('#print-plan').isEnabled(), true, 'Print action stayed disabled after an evaluated result.');
  assert.equal(await frame.locator('#share-plan').isEnabled(), true, 'Share-card action stayed disabled after an evaluated result.');
  assert.match(await frame.locator('#status').innerText(), /created locally/i);

  const localKeys = await frame.evaluate(() => Object.keys(localStorage));
  assert.ok(localKeys.includes('hth-smart-mode-state-v1'));
  assert.ok(localKeys.includes('hth-smart-mode-recommendations-v1'));
  assert.equal(localKeys.some((key) => /location|coordinate|gps/i.test(key)), false, 'Sensitive-location key was written to local storage.');

  const downloadPromise = page.waitForEvent('download');
  await frame.locator('#share-plan').click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /^hook-the-horizon-.*\.svg$/);

  await frame.locator('[data-outcome="inconclusive"]').first().click();
  assert.match(await frame.locator('#status').innerText(), /recorded inconclusive locally/i);

  await frame.locator('#clear-data').click();
  const clearedKeys = await frame.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('hth-smart-mode-')));
  assert.deepEqual(clearedKeys, [], 'Clear-local-data did not remove Smart Mode records.');

  await page.screenshot({ path: 'preview-evidence/presentation-planner-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: 'preview-evidence/presentation-planner-mobile.png', fullPage: true });
} finally {
  await browser.close();
}
