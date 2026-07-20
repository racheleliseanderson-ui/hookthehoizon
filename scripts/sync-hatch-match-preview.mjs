import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetRoot = path.join(root, 'next-generation', 'plugins', 'hatch-match-preview', 'data');
const files = [
  {
    key: 'seed',
    sourcePath: 'applications/hatch-match/data/approved-preview-seed-records.json',
    runtimePath: 'data/seed-records.json',
    targetName: 'seed-records.json'
  },
  {
    key: 'maintenancePolicy',
    sourcePath: 'applications/hatch-match/maintenance-policy.json',
    runtimePath: 'data/maintenance-policy.json',
    targetName: 'maintenance-policy.json'
  },
  {
    key: 'maintenanceLog',
    sourcePath: 'applications/hatch-match/maintenance-log.json',
    runtimePath: 'data/maintenance-log.json',
    targetName: 'maintenance-log.json'
  }
];

fs.mkdirSync(targetRoot, { recursive: true });
const artifacts = {};
for (const entry of files) {
  const source = path.join(root, ...entry.sourcePath.split('/'));
  const target = path.join(targetRoot, entry.targetName);
  const bytes = fs.readFileSync(source);
  fs.writeFileSync(target, bytes);
  artifacts[entry.key] = {
    sourcePath: entry.sourcePath,
    runtimePath: entry.runtimePath,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex')
  };
}

const manifest = {
  schemaVersion: 2,
  applicationId: 'HTH-HM-001',
  artifacts,
  productionAuthorized: false
};
fs.writeFileSync(path.join(targetRoot, 'runtime-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
