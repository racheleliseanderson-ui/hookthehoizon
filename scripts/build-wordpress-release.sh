#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"
THEME_SRC="$ROOT/wordpress-theme"
PLUGIN_SRC="$ROOT/wordpress-plugin/hook-content"
THEME_SLUG="hook-the-horizon"
PLUGIN_SLUG="hook-the-horizon-content"
THEME_VERSION="$(awk -F': ' '/^Version:/{print $2; exit}' "$THEME_SRC/style.css")"
PLUGIN_VERSION="$(awk -F': ' '/^ \* Version:/{print $2; exit}' "$PLUGIN_SRC/hook-content.php")"
COMMIT_SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || printf 'unknown')"

node "$ROOT/scripts/sync-wordpress-tokens.mjs"
php -l "$THEME_SRC/functions.php" >/dev/null
php -l "$PLUGIN_SRC/hook-content.php" >/dev/null
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$THEME_SRC/theme.json"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$THEME_SRC/theme-tokens.json"

required=(
  style.css theme.json functions.php theme-tokens.json assets/tokens.css
  templates/index.html templates/front-page.html templates/page.html templates/single.html
  templates/archive.html templates/search.html templates/404.html
  parts/header.html parts/footer.html
)
for relative in "${required[@]}"; do
  if [[ ! -f "$THEME_SRC/$relative" ]]; then
    printf 'Missing required Hook theme file: %s\n' "$relative" >&2
    exit 1
  fi
done

if grep -RInE 'Hook the Forizon|hookthehoizon' "$THEME_SRC" "$ROOT/scripts" "$ROOT/README.md"; then
  printf 'Retired or misspelled Hook identifier found in active source.\n' >&2
  exit 1
fi

rm -rf "$DIST"
mkdir -p "$DIST/$THEME_SLUG" "$DIST/$PLUGIN_SLUG"
cp -R "$THEME_SRC"/. "$DIST/$THEME_SLUG/"
cp -R "$PLUGIN_SRC"/. "$DIST/$PLUGIN_SLUG/"
find "$DIST" -name '.DS_Store' -delete

node - "$DIST/$THEME_SLUG" "$THEME_VERSION" "$COMMIT_SHA" <<'NODE'
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const [themeRoot, version, commit] = process.argv.slice(2);
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const absolute = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(absolute) : [absolute];
});
const files = walk(themeRoot)
  .filter((file) => path.basename(file) !== 'release-manifest.json')
  .map((file) => ({
    path: path.relative(themeRoot, file).replaceAll(path.sep, '/'),
    sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  }))
  .sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(path.join(themeRoot, 'release-manifest.json'), `${JSON.stringify({
  schemaVersion: 1,
  publication: 'Hook the Horizon',
  domain: 'hookthehorizon.blog',
  repository: 'racheleliseanderson-ui/hookthehorizon',
  themeSlug: 'hook-the-horizon',
  themeVersion: version,
  commit,
  builtAt: new Date().toISOString(),
  files,
}, null, 2)}\n`);
NODE

(
  cd "$DIST"
  zip -qr "$THEME_SLUG-$THEME_VERSION.zip" "$THEME_SLUG"
  zip -qr "$PLUGIN_SLUG-$PLUGIN_VERSION.zip" "$PLUGIN_SLUG"
  sha256sum ./*.zip > SHA256SUMS
)

for relative in "${required[@]}" release-manifest.json; do
  unzip -Z1 "$DIST/$THEME_SLUG-$THEME_VERSION.zip" | grep -Fxq "$THEME_SLUG/$relative" || {
    printf 'Hook release ZIP omitted required file: %s\n' "$relative" >&2
    exit 1
  }
done

printf 'Built validated Hook the Horizon release artifacts in %s\n' "$DIST"
