import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'applications', 'hatch-match', 'data', 'approved-preview-seed-records.json');
const targetRoot = path.join(root, 'next-generation', 'plugins', 'hatch-match-preview', 'data');
const target = path.join(targetRoot, 'seed-records.json');

fs.mkdirSync(targetRoot, { recursive: true });
const bytes = fs.readFileSync(source);
fs.writeFileSync(target, bytes);
const manifest = {
  schemaVersion: 1,
  applicationId: 'HTH-HM-001',
  sourcePath: 'applications/hatch-match/data/approved-preview-seed-records.json',
  runtimePath: 'data/seed-records.json',
  sha256: crypto.createHash('sha256').update(bytes).digest('hex')
};
fs.writeFileSync(path.join(targetRoot, 'runtime-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
