import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const themeRoot = path.join(root, 'theme');
const authority = JSON.parse(fs.readFileSync(path.join(themeRoot, 'theme-tokens.json'), 'utf8'));
const themePath = path.join(themeRoot, 'theme.json');
const theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));

const label = (slug) => slug.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
theme.settings ??= {};
theme.settings.color ??= {};
theme.settings.color.custom = false;
theme.settings.color.palette = Object.entries(authority.palette).map(([slug, color]) => ({ slug, name: label(slug), color }));
fs.writeFileSync(themePath, `${JSON.stringify(theme, null, 2)}\n`);

const lines = [':root {'];
for (const [slug, value] of Object.entries(authority.palette)) lines.push(`  --hth-${slug}: ${value};`);
for (const [slug, value] of Object.entries(authority.semantic.light)) lines.push(`  --re-${slug}: ${value};`);
lines.push('  color-scheme: light;','}','','[data-theme="dark"] {');
for (const [slug, value] of Object.entries(authority.semantic.dark)) lines.push(`  --re-${slug}: ${value};`);
lines.push('  color-scheme: dark;','}','','@media (prefers-color-scheme: dark) {','  :root:not([data-theme="light"]) {');
for (const [slug, value] of Object.entries(authority.semantic.dark)) lines.push(`    --re-${slug}: ${value};`);
lines.push('    color-scheme: dark;','  }','}','');
fs.mkdirSync(path.join(themeRoot, 'assets'), { recursive: true });
fs.writeFileSync(path.join(themeRoot, 'assets', 'tokens.css'), `${lines.join('\n')}\n`);
