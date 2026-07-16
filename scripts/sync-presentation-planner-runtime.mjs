import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'wordpress-plugin', 'hook-content', 'assets', 'presentation-planner');

const files = [
  ['applications/presentation-planner/preview/index.html', 'preview/index.html'],
  ['applications/presentation-planner/preview/app.mjs', 'preview/app.mjs'],
  ['applications/presentation-planner/preview/sw.js', 'preview/sw.js'],
  ['applications/presentation-planner/preview/manifest.webmanifest', 'preview/manifest.webmanifest'],
  ['applications/presentation-planner/data/seed-presentations.mjs', 'data/seed-presentations.mjs'],
  ['applications/_shared/personalization.mjs', '_shared/personalization.mjs'],
  ['applications/_shared/privacy.mjs', '_shared/privacy.mjs']
];

fs.rmSync(destination, { recursive: true, force: true });
for (const [sourceRelative, destinationRelative] of files) {
  const source = path.join(root, sourceRelative);
  const target = path.join(destination, destinationRelative);
  if (!fs.existsSync(source)) throw new Error(`Missing Presentation Planner source: ${sourceRelative}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

const manifest = {
  schemaVersion: 1,
  applicationId: 'HTH-PP-001',
  personalizationLayer: 'HTH-SM-001',
  source: 'applications/presentation-planner',
  generatedAt: new Date().toISOString(),
  files: files.map(([source, runtime]) => ({ source, runtime }))
};
fs.writeFileSync(path.join(destination, 'runtime-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Synced Presentation Planner runtime to ${path.relative(root, destination)}`);
