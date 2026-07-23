import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const manifest = read('applications/hatch-match/application.yaml');
const runtime = JSON.parse(read('governance/runtime/hatch-match-runtime-2026-07-22.json'));

if (!manifest.includes('lifecycle: installed-preview-under-p1-acceptance')) {
  throw new Error('Hatch Match lifecycle is not reconciled to the installed preview state.');
}
if (!manifest.includes('application_version: 0.1.1-preview')) {
  throw new Error('Hatch Match application version is not reconciled to 0.1.1-preview.');
}
if (manifest.includes('maintenance and seed activation remain in PR 85')) {
  throw new Error('Hatch Match manifest still delegates current authority to stale PR 85.');
}
if (runtime.active_components?.hatch_match_preview !== '0.1.1-preview') {
  throw new Error('Runtime record does not match the installed Hatch Match plugin version.');
}
for (const relative of [
  'applications/hatch-match/maintenance-policy.json',
  'next-generation/plugins/hatch-match-preview/hatch-match-preview.php',
  'next-generation/plugins/hatch-match-preview/tools/runtime-readback.php'
]) {
  if (!exists(relative)) throw new Error(`Missing Hatch Match authority or package file: ${relative}`);
}
if (runtime.production_change_authorized !== false) {
  throw new Error('Runtime evidence must not authorize production changes.');
}

console.log('PASS Hatch Match P1 source and runtime record reconciliation.');
