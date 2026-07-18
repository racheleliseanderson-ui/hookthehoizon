import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const output = 'evidence/browser';
const failures = [];
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();

for (const route of ['compatibility-builder', 'compatibility-result']) {
  for (const viewport of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 1000 },
  ]) {
    const label = `${route}-${viewport.name}`;
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    try {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const response = await page.goto(`http://localhost:8888/${route}/`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      if (!response?.ok()) throw new Error(`HTTP ${response?.status()}`);

      const axe = await new AxeBuilder({ page }).analyze();
      await fs.writeFile(`${output}/${label}-axe.json`, JSON.stringify(axe, null, 2));
      if (axe.violations.length) failures.push({ phase: 'axe', label, violations: axe.violations.map((item) => item.id) });

      const unnamed = await page.locator('a,button,input,select,textarea,iframe,[tabindex]:not([tabindex="-1"])').evaluateAll((nodes) => nodes
        .map((node) => ({
          tag: node.tagName,
          name: node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent?.trim() || '',
        }))
        .filter((item) => !item.name));
      if (unnamed.length) failures.push({ phase: 'accessible-name', label, unnamed });

      await page.keyboard.press('Tab');
      const focus = await page.evaluate(() => {
        const element = document.activeElement;
        const style = element ? getComputedStyle(element) : null;
        return { tag: element?.tagName || null, outlineStyle: style?.outlineStyle || null, outlineWidth: style?.outlineWidth || null };
      });
      await fs.writeFile(`${output}/${label}-keyboard.json`, JSON.stringify(focus, null, 2));
      if (!focus.tag || focus.tag === 'BODY') failures.push({ phase: 'keyboard-focus', label, focus });

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      if (overflow) failures.push({ phase: 'reflow-overflow', label });

      if (route === 'compatibility-builder') {
        const frameElement = page.locator('iframe[title*="Compatibility Builder"]');
        if (await frameElement.count() !== 1) {
          failures.push({ phase: 'application-frame', label, error: 'Expected one Compatibility Builder iframe.' });
        } else {
          const frame = page.frames().find((candidate) => candidate.url().includes('/assets/system-compatibility/preview/index.html'));
          if (!frame) {
            failures.push({ phase: 'application-frame', label, error: 'Compatibility iframe did not load.' });
          } else {
            await frame.locator('#compatibility-form').waitFor({ state: 'visible' });
            await frame.locator('button[type="submit"]').click();
            await frame.locator('#result:not([hidden])').waitFor({ state: 'visible' });
            const resultText = await frame.locator('#result-heading').textContent();
            if (!resultText?.trim()) failures.push({ phase: 'deterministic-result', label, error: 'No result heading after submit.' });
            const appOverflow = await frame.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
            if (appOverflow) failures.push({ phase: 'application-reflow', label });
          }
        }
      }

      await page.screenshot({ path: `${output}/${label}.png`, fullPage: true });
      if (viewport.name === 'desktop') {
        await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
        await page.pdf({ path: `${output}/${route}.pdf`, format: 'Letter', printBackground: true });
      }
    } catch (error) {
      failures.push({ phase: 'runtime', label, error: String(error?.stack || error) });
    } finally {
      await context.close();
    }
  }
}

await browser.close();
await fs.writeFile(`${output}/browser-gate-summary.json`, JSON.stringify(failures, null, 2));
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
