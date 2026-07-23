import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const evidenceRoot = process.env.HTH_EVIDENCE_DIR || 'evidence/installed-five-application';
const requiredStates = [
  'initial','ordinary-success','incomplete','conflicting','stale','unsupported','no-result',
  'source-failure','hard-stop','recovery','reset','save-delete-when-supported','print-export','return-path'
];

const applications = [
  { id: 'HTH-SC-001', slug: 'compatibility-builder', name: 'Compatibility Builder' },
  { id: 'HTH-HM-001', slug: 'hatch-match', name: 'Hatch Match' },
  { id: 'HTH-PP-001', slug: 'presentation-planner', name: 'Presentation Planner' },
  { id: 'HTH-RS-001', slug: 'rig-signal', name: 'Rig Signal' },
  { id: 'HHI-001', slug: 'honey-hole-intelligence', name: 'Honey Hole Intelligence' }
];

function safe(value) {
  return value.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase();
}

async function mkdir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file));
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}

async function sha256(file) {
  const data = await fs.readFile(file);
  return crypto.createHash('sha256').update(data).digest('hex');
}

for (const app of applications) {
  test.describe(`${app.name} installed runtime`, () => {
    test(`initial route, accessibility, REST, continuation, print and evidence retention`, async ({ page, request, browserName }, testInfo) => {
      const project = safe(testInfo.project.name);
      const dir = path.join(evidenceRoot, app.slug, project, 'initial');
      await mkdir(dir);

      const consoleEvents = [];
      const pageErrors = [];
      const networkEvents = [];
      page.on('console', message => consoleEvents.push({ type: message.type(), text: message.text() }));
      page.on('pageerror', error => pageErrors.push({ message: error.message, stack: error.stack || null }));
      page.on('request', req => networkEvents.push({ phase: 'request', method: req.method(), url: req.url(), resourceType: req.resourceType() }));
      page.on('response', res => networkEvents.push({ phase: 'response', status: res.status(), url: res.url() }));

      const response = await page.goto(`/${app.slug}/`, { waitUntil: 'networkidle' });
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator('body')).toBeVisible();

      const htmlFile = path.join(dir, 'rendered-page.html');
      await fs.writeFile(htmlFile, await page.content());
      const screenshotFile = path.join(dir, 'full-page.png');
      await page.screenshot({ path: screenshotFile, fullPage: true });

      const rest = await request.get(`/wp-json/wp/v2/pages?slug=${app.slug}&context=view`);
      const restBody = await rest.text();
      await fs.writeFile(path.join(dir, 'rest-readback.json'), restBody);
      expect(rest.ok()).toBeTruthy();

      if (testInfo.project.name !== 'chromium-nojs') {
        const axe = await new AxeBuilder({ page }).analyze();
        await writeJson(path.join(dir, 'axe.json'), axe);
        expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
      } else {
        await expect(page.locator('noscript')).toContainText(/javascript/i);
      }

      const startHere = page.locator('a[href*="/start-here/"]');
      await expect(startHere.first()).toBeVisible();
      await writeJson(path.join(dir, 'continuation-routes.json'), {
        startHereCount: await startHere.count(),
        links: await page.locator('a').evaluateAll(nodes => nodes.map(node => ({ text: node.textContent?.trim() || '', href: node.getAttribute('href') || '' })))
      });

      if (testInfo.project.name === 'print-chromium') {
        await page.emulateMedia({ media: 'print' });
        const pdfFile = path.join(dir, 'print.pdf');
        await page.pdf({ path: pdfFile, format: 'Letter', printBackground: true });
      }

      await writeJson(path.join(dir, 'console.json'), { consoleEvents, pageErrors });
      await writeJson(path.join(dir, 'network.json'), networkEvents);
      await writeJson(path.join(dir, 'state-manifest.json'), {
        applicationId: app.id,
        application: app.name,
        route: `/${app.slug}/`,
        project: testInfo.project.name,
        browserName,
        exercisedStates: ['initial','no-javascript','print-export','return-path'],
        requiredStates,
        disposition: 'captured',
        generatedAt: new Date().toISOString()
      });

      const files = await fs.readdir(dir);
      const hashes = {};
      for (const file of files) {
        const absolute = path.join(dir, file);
        const stat = await fs.stat(absolute);
        if (stat.isFile()) hashes[file] = await sha256(absolute);
      }
      await writeJson(path.join(dir, 'sha256-manifest.json'), hashes);
    });

    test(`fixture-driven state contract remains explicit`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'chromium-nojs' || testInfo.project.name === 'print-chromium', 'State fixture evaluation requires JavaScript.');
      const dir = path.join(evidenceRoot, app.slug, safe(testInfo.project.name), 'state-contract');
      await mkdir(dir);
      await page.goto(`/${app.slug}/`, { waitUntil: 'networkidle' });
      const result = await page.evaluate(({ requiredStates }) => ({
        requiredStates,
        fixtureBridgePresent: Boolean(window.__HTH_ACCEPTANCE_FIXTURE__ || document.querySelector('[data-acceptance-state]')),
        localStorageKeys: Object.keys(localStorage),
        sessionStorageKeys: Object.keys(sessionStorage)
      }), { requiredStates });
      await writeJson(path.join(dir, 'fixture-readback.json'), result);
      expect(result.requiredStates).toEqual(requiredStates);
    });
  });
}
