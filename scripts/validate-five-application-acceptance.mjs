import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const ownershipPath = 'applications/application-ownership.json';
const matrixPath = 'applications/acceptance-matrix.json';
const ownership = readJson(ownershipPath);
const matrix = readJson(matrixPath);

const expectedIds = ['HTH-SC-001', 'HTH-HM-001', 'HTH-PP-001', 'HTH-RS-001', 'HHI-001'];
const requiredStates = [
  'initial', 'ordinary-success', 'incomplete', 'conflicting', 'stale', 'unsupported',
  'no-result', 'source-failure', 'hard-stop', 'no-javascript', 'reset', 'recovery',
  'save-delete-when-supported', 'print-export', 'return-path'
];
const requiredModalities = [
  'desktop', 'mobile', 'keyboard-only', 'screen-reader', 'zoom-reflow',
  'reduced-motion', 'forced-colors', 'print'
];

function fail(message) {
  console.error(`acceptance validation failed: ${message}`);
  process.exitCode = 1;
}

function assertEqualSet(actual, expected, label) {
  const a = [...new Set(actual)].sort();
  const e = [...new Set(expected)].sort();
  if (JSON.stringify(a) !== JSON.stringify(e)) fail(`${label} mismatch: ${JSON.stringify(a)} != ${JSON.stringify(e)}`);
}

function assertOwner(component, label) {
  if (!component || typeof component.owner !== 'string' || component.owner.trim() === '') {
    fail(`${label} has no canonical owner`);
    return;
  }
  if (component.owner !== 'not-applicable' && !fs.existsSync(path.join(root, component.owner))) {
    fail(`${label} owner path does not exist: ${component.owner}`);
  }
}

assertEqualSet(ownership.applications.map((app) => app.applicationId), expectedIds, 'ownership application IDs');
assertEqualSet(matrix.applications.map((app) => app.applicationId), expectedIds, 'acceptance matrix application IDs');
assertEqualSet(matrix.requiredStates, requiredStates, 'required states');
assertEqualSet(matrix.requiredModalities, requiredModalities, 'required modalities');

for (const app of ownership.applications) {
  if (!app.route?.identifier?.startsWith('/')) fail(`${app.applicationId} route is not canonical`);
  assertOwner(app.route, `${app.applicationId} route`);
  assertOwner(app.shortcode, `${app.applicationId} shortcode`);
  assertOwner(app.evaluator, `${app.applicationId} evaluator`);
  assertOwner(app.restContract, `${app.applicationId} REST contract`);
  assertOwner(app.maintenancePolicy, `${app.applicationId} maintenance policy`);
  if (!Array.isArray(app.packages) || app.packages.length === 0) fail(`${app.applicationId} has no package owner`);
  for (const packageRecord of app.packages ?? []) assertOwner(packageRecord, `${app.applicationId} package ${packageRecord.identifier}`);
}

const runtimeParity = fs.readFileSync(path.join(root, 'wordpress-plugin/hook-content/runtime-parity.txt'), 'utf8');
if (!runtimeParity.includes('Installed plugin version observed: 0.3.1')) fail('runtime parity does not record installed Hook Content 0.3.1');
if (!runtimeParity.includes('Compatibility Builder runtime: renders')) fail('runtime parity does not record rendered Compatibility Builder');

const hatchApplication = fs.readFileSync(path.join(root, 'applications/hatch-match/application.yaml'), 'utf8');
if (!hatchApplication.includes('current_version: 0.1.1-preview')) fail('Hatch Match version is not reconciled to 0.1.1-preview');
if (!hatchApplication.includes('maintenance_branch: main')) fail('Hatch Match maintenance authority is not reconciled to main');
if (!hatchApplication.includes('delivery: verified-live-wordpress-page-bridge')) fail('Hatch Match live bridge state is not recorded');

if (process.exitCode) process.exit(process.exitCode);
console.log('Five-application ownership and acceptance contracts are coherent.');
