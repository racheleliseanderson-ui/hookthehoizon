import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const themeRoot = path.join(root, 'wordpress-theme');
const authority = JSON.parse(fs.readFileSync(path.join(themeRoot, 'theme-tokens.json'), 'utf8'));
const themePath = path.join(themeRoot, 'theme.json');
const theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
const label = (slug) => slug.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');

theme.settings ??= {};
theme.settings.color ??= {};
theme.settings.typography ??= {};
theme.settings.color.custom = false;
theme.settings.color.defaultPalette = false;
theme.settings.color.palette = Object.entries(authority.palette).map(([slug, color]) => ({ slug, name: label(slug), color }));
theme.settings.typography.fontFamilies = [
  { slug: 'display', name: 'Bebas Neue Display', fontFamily: authority.typography.display.family },
  { slug: 'body', name: 'Montserrat Body and Interface', fontFamily: authority.typography.body.family },
  { slug: 'data', name: 'Montserrat Data', fontFamily: authority.typography.data.family },
];
fs.writeFileSync(themePath, `${JSON.stringify(theme, null, 2)}\n`);

const lines = [':root {'];
for (const [slug, value] of Object.entries(authority.palette)) lines.push(`  --hth-${slug}: ${value};`);
for (const [slug, value] of Object.entries(authority.semantic.light)) lines.push(`  --re-${slug}: ${value};`);
lines.push(`  --hth-font-display: ${authority.typography.display.family};`);
lines.push(`  --hth-font-body: ${authority.typography.body.family};`);
lines.push(`  --hth-font-data: ${authority.typography.data.family};`);
for (const [oldSlug, newSlug] of Object.entries(authority.deprecatedAliases ?? {})) {
  lines.push(`  --hth-${oldSlug}: var(--hth-${newSlug}); /* deprecated compatibility alias */`);
}
lines.push('  color-scheme: light;', '}', '', '[data-theme="dark"] {');
for (const [slug, value] of Object.entries(authority.semantic.dark)) lines.push(`  --re-${slug}: ${value};`);
lines.push('  color-scheme: dark;', '}', '', '@media (prefers-color-scheme: dark) {', '  :root:not([data-theme="light"]) {');
for (const [slug, value] of Object.entries(authority.semantic.dark)) lines.push(`    --re-${slug}: ${value};`);
lines.push('    color-scheme: dark;', '  }', '}', '');
fs.mkdirSync(path.join(themeRoot, 'assets'), { recursive: true });
fs.writeFileSync(path.join(themeRoot, 'assets', 'tokens.css'), `${lines.join('\n')}\n`);
