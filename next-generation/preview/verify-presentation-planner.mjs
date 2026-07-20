import fs from 'node:fs';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const evidence = { applicationId: 'HTH-PP-001', smartModeId: 'HTH-SM-001', checkpoints: [] };
const mark = (name, details = {}) => {
  evidence.checkpoints.push({ name, ...details });
  fs.writeFileSync('preview-evidence/presentation-planner-verification.json', JSON.stringify(evidence, null, 2));
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true, reducedMotion: 'reduce' });
const page = await context.newPage();

try {
  await page.goto('http://localhost:8899/presentation-planner-preview/', { waitUntil: 'networkidle' });
  await page.locator('iframe.hth-application-embed__frame').waitFor({ state: 'visible' });
  const frame = page.frames().find((candidate) => candidate.url().includes('/assets/presentation-planner/preview/index.html'));
  assert.ok(frame, 'Presentation Planner iframe did not load the packaged runtime.');
  await frame.locator('h1').waitFor();
  assert.match(await frame.locator('h1').innerText(), /smarter field test/i);
  mark('runtime-loaded');

  assert.ok((await frame.locator('#inventory input[type="checkbox"]').count()) >= 2, 'Owned-inventory fixtures were not rendered.');
  await frame.locator('select[name="preferredSpecies"]').selectOption('bass');
  await frame.locator('select[name="method"]').selectOption('freshwater_spinning');
  await frame.locator('select[name="waterType"]').selectOption('reservoir');
  await frame.locator('select[name="tripGoal"]').selectOption('test_a_hypothesis');
  await frame.locator('select[name="structureBand"]').selectOption('rock');
  await frame.locator('select[name="depthBand"]').selectOption('bottom');
  await frame.locator('#inventory input[value="owned-bottom-compact"]').check();
  await frame.locator('#conditions input[value="clear"]').check();
  await frame.locator('#planner-form button[type="submit"]').click();
  await frame.locator('#results .plan').first().waitFor();
  assert.match(await frame.locator('#status').innerText(), /created locally/i);
  mark('plan-created', { planCount: await frame.locator('#results .plan').count() });

  assert.equal(await frame.locator('#print-plan').isEnabled(), true, 'Print action stayed disabled after an evaluated result.');
  assert.equal(await frame.locator('#share-plan').isEnabled(), true, 'Share-card action stayed disabled after an evaluated result.');
  const localKeys = await frame.evaluate(() => Object.keys(localStorage));
  assert.ok(localKeys.includes('hth-smart-mode-state-v1'), 'Smart Mode form state was not saved locally.');
  assert.ok(localKeys.includes('hth-smart-mode-recommendations-v1'), 'Recommendation history was not saved locally.');
  assert.equal(localKeys.some((key) => /location|coordinate|gps/i.test(key)), false, 'Sensitive-location key was written to local storage.');
  mark('local-state-verified', { localKeys });

  await frame.locator('[data-outcome="inconclusive"]').first().click();
  const outcomes = await frame.evaluate(() => JSON.parse(localStorage.getItem('hth-smart-mode-outcomes-v1') || '[]'));
  assert.equal(outcomes[0]?.result, 'inconclusive', 'Inconclusive outcome was not recorded locally.');
  mark('inconclusive-outcome-recorded');

  await frame.locator('#clear-data').click();
  const clearedKeys = await frame.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('hth-smart-mode-')));
  assert.deepEqual(clearedKeys, [], 'Clear-local-data did not remove Smart Mode records.');
  mark('local-data-cleared');

  await page.screenshot({ path: 'preview-evidence/presentation-planner-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: 'preview-evidence/presentation-planner-mobile.png', fullPage: true });
  mark('responsive-evidence-captured');
} catch (error) {
  evidence.error = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
  fs.writeFileSync('preview-evidence/presentation-planner-verification.json', JSON.stringify(evidence, null, 2));
  throw error;
} finally {
  await browser.close();
}
