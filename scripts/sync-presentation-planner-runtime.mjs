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
  ['applications/presentation-planner/preview/water-column-decision-map.svg', 'preview/water-column-decision-map.svg'],
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

const runtimeApp = path.join(destination, 'preview', 'app.mjs');
const original = fs.readFileSync(runtimeApp, 'utf8');
const corrected = original.split("../../_shared/personalization.mjs").join("../_shared/personalization.mjs");
if (corrected === original) throw new Error('Presentation Planner shared-module path was not found.');
const mediaPlacement = `
const mediaHeader = document.querySelector('body > header');
if (mediaHeader && !document.querySelector('[data-presentation-media]')) {
  const figure = document.createElement('figure');
  figure.dataset.presentationMedia = 'water-column-decision-map';
  figure.style.margin = 'clamp(1.5rem,4vw,2.5rem) 0 0';
  const image = document.createElement('img');
  image.src = './water-column-decision-map.svg';
  image.alt = 'Field diagram connecting surface, middle, and bottom water zones to observation, presentation choice, and the next test.';
  image.width = 1440;
  image.height = 720;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.style.cssText = 'display:block;width:100%;height:auto;border-radius:1rem;box-shadow:0 1.25rem 3rem rgb(9 37 50 / .2)';
  const caption = document.createElement('figcaption');
  caption.textContent = 'The water column is not a leaderboard. Start with the zone you can observe, choose one presentation variable, and record what the test actually told you.';
  caption.style.cssText = 'max-width:52rem;margin:.7rem 0 0;color:#244a5a;font-size:.92rem';
  figure.append(image, caption);
  mediaHeader.append(figure);
}
`;
fs.writeFileSync(runtimeApp, `${corrected}\n${mediaPlacement}`);

const manifest = {
  schemaVersion: 2,
  applicationId: 'HTH-PP-001',
  personalizationLayer: 'HTH-SM-001',
  source: 'applications/presentation-planner',
  generatedAt: new Date().toISOString(),
  runtimeImportAdjustment: 'preview/app.mjs uses ../_shared inside the packaged plugin',
  representativeMedia: {
    id: 'hth-water-column-decision-map-001',
    runtime: 'preview/water-column-decision-map.svg',
    ownership: 'project-owned-original',
    provenance: 'Original project SVG; no third-party image or protected interface copied.',
    alt: 'Field diagram connecting surface, middle, and bottom water zones to observation, presentation choice, and the next test.',
    responsiveTreatment: 'Complete 2:1 diagram scales within the application width without a destructive crop.',
    performance: 'Inline-free SVG, lazy loaded, async decoded, no external dependency.'
  },
  files: files.map(([source, runtime]) => ({ source, runtime }))
};
fs.writeFileSync(path.join(destination, 'runtime-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Synced Presentation Planner runtime to ${path.relative(root, destination)}`);
