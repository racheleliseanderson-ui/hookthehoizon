import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const json = (path) => JSON.parse(read(path));
const ownership = json('applications/application-ownership.json');
const continuations = json('applications/result-continuations.json');
const primary = json('next-generation/migration/primary-sections.json');

const primaryRoutes = new Set(primary.pages.map((page) => page.slug === 'home' ? '/' : `/${page.slug}/`));
const applicationRoutes = new Set(ownership.applications.map((application) => application.route.identifier));
const knownRoutes = new Set([...primaryRoutes, ...applicationRoutes]);
const expectedApplications = new Set(['HTH-SC-001', 'HTH-HM-001', 'HTH-PP-001', 'HTH-RS-001', 'HHI-001']);
const surfacePaths = {
  'HTH-SC-001': ['wordpress-theme/templates/page-compatibility-builder.html'],
  'HTH-HM-001': ['next-generation/plugins/hatch-match-preview/hatch-match-preview.php'],
  'HTH-PP-001': ['wordpress-plugin/hook-content/hook-content.php'],
  'HTH-RS-001': ['next-generation/plugins/rig-signal-preview/rig-signal-preview.php'],
  'HHI-001': ['wordpress-theme/templates/page-honey-hole-intelligence.html']
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(continuations.schemaVersion === 1, 'unsupported result-continuation schema');
assert(continuations.applications.length === expectedApplications.size, 'all five application continuation records are required');

for (const application of continuations.applications) {
  assert(expectedApplications.delete(application.applicationId), `unexpected or duplicate application: ${application.applicationId}`);
  assert(application.resultPrompt && application.resultPrompt.length > 20, `${application.applicationId} needs a specific result prompt`);
  assert(Array.isArray(application.continuations) && application.continuations.length >= 4, `${application.applicationId} needs at least four continuations`);
  assert(application.continuations.some((item) => item.kind === 'return' && item.href === '/start-here/'), `${application.applicationId} needs a Start Here return route`);
  assert(application.continuations.some((item) => item.kind !== 'return'), `${application.applicationId} needs a substantive next decision`);
  for (const item of application.continuations) {
    assert(/^\/[a-z0-9-]*\/$/.test(item.href), `${application.applicationId} has a malformed route: ${item.href}`);
    assert(knownRoutes.has(item.href), `${application.applicationId} points to an uncontrolled route: ${item.href}`);
    assert(!/placeholder|coming soon|learn more|dashboard/i.test(`${item.label} ${item.kind}`), `${application.applicationId} contains generic or placeholder continuation copy`);
  }
  const surfaces = surfacePaths[application.applicationId] || [];
  assert(surfaces.length, `${application.applicationId} has no rendered result surface registered`);
  for (const path of surfaces) {
    const source = read(path);
    for (const item of application.continuations) assert(source.includes(item.href), `${path} is missing ${item.href}`);
    assert(/After the result/i.test(source), `${path} does not identify the post-result route`);
  }
}
assert(expectedApplications.size === 0, `missing application continuation records: ${[...expectedApplications].join(', ')}`);

const startHere = read('next-generation/theme/templates/page-start-here.html');
for (const route of applicationRoutes) assert(startHere.includes(route), `Start Here is missing application route ${route}`);
for (const route of ['/field-files/', '/resources/', '/tools/', '/research-and-standards/']) assert(startHere.includes(route), `Start Here is missing editorial route ${route}`);
assert(!/dashboard|coming soon|placeholder/i.test(startHere), 'Start Here contains generic dashboard or placeholder language');

const frontPage = read('next-generation/theme/templates/front-page.html');
assert(frontPage.includes('/start-here/'), 'homepage must expose Start Here');
assert(frontPage.includes('/honey-hole-intelligence/'), 'homepage must expose trip-readiness routing');
assert(frontPage.includes('/compatibility-builder/'), 'homepage must expose setup routing');
assert(frontPage.includes('/presentation-planner/'), 'homepage must expose presentation routing');

const header = read('next-generation/theme/parts/header.html');
for (const route of ['/start-here/', '/field-files/', '/tools/', '/research-and-standards/']) assert(header.includes(route), `header is missing ${route}`);

const tools = read('next-generation/theme/templates/page-tools.html');
for (const route of applicationRoutes) assert(tools.includes(route), `tools page is missing application route ${route}`);
assert(!/coming soon|placeholder/i.test(tools), 'tools page contains placeholder destinations');

console.log('Reader journey and result-continuation contracts are complete.');
