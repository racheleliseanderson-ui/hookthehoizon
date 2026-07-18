import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'wordpress-plugin', 'hook-content', 'assets', 'system-compatibility');

const files = [
  ['applications/system-compatibility/evaluate.mjs', 'evaluate.mjs'],
  ['applications/system-compatibility/preview/index.html', 'preview/index.html'],
  ['applications/system-compatibility/preview/app.mjs', 'preview/app.mjs']
];

fs.rmSync(destination, { recursive: true, force: true });
for (const [sourceRelative, destinationRelative] of files) {
  const source = path.join(root, sourceRelative);
  const target = path.join(destination, destinationRelative);
  if (!fs.existsSync(source)) throw new Error(`Missing System Compatibility source: ${sourceRelative}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

const manifest = {
  schemaVersion: 1,
  applicationId: 'HTH-SC-001',
  applicationSchemaVersion: '0.2.0',
  ruleVersion: '0.2.0',
  source: 'applications/system-compatibility',
  generatedAt: new Date().toISOString(),
  privacy: 'no_exact_location_collection',
  files: files.map(([source, runtime]) => ({ source, runtime }))
};

fs.writeFileSync(path.join(destination, 'runtime-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Synced System Compatibility runtime to ${path.relative(root, destination)}`);
