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
node "$ROOT/scripts/sync-presentation-planner-runtime.mjs"
node "$ROOT/scripts/sync-system-compatibility-runtime.mjs"
node "$ROOT/applications/system-compatibility/tests/run.mjs"
php -l "$THEME_SRC/functions.php" >/dev/null
php -l "$PLUGIN_SRC/hook-content.php" >/dev/null
php -l "$THEME_SRC/patterns/living-fly-bench-hub.php" >/dev/null
php -l "$THEME_SRC/patterns/presentation-lab-hub.php" >/dev/null
php -l "$THEME_SRC/patterns/presentation-planner-application.php" >/dev/null
php -l "$THEME_SRC/patterns/system-compatibility-application.php" >/dev/null
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$THEME_SRC/theme.json"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$THEME_SRC/theme-tokens.json"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$THEME_SRC/styles/dark.json"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$THEME_SRC/styles/field-serif.json"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$PLUGIN_SRC/assets/presentation-planner/runtime-manifest.json"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$PLUGIN_SRC/assets/system-compatibility/runtime-manifest.json"
node --check "$PLUGIN_SRC/assets/presentation-planner/preview/app.mjs"
node --check "$PLUGIN_SRC/assets/presentation-planner/preview/sw.js"
node --check "$PLUGIN_SRC/assets/system-compatibility/evaluate.mjs"
node --check "$PLUGIN_SRC/assets/system-compatibility/preview/app.mjs"

required=(
  style.css theme.json functions.php theme-tokens.json assets/tokens.css
  templates/index.html templates/front-page.html templates/page.html templates/single.html
  templates/archive.html templates/search.html templates/404.html
  templates/page-compatibility-builder.html templates/page-compatibility-result.html
  parts/header.html parts/footer.html
  styles/dark.json styles/field-serif.json
  patterns/living-fly-bench-hub.php patterns/presentation-lab-hub.php
  patterns/presentation-planner-application.php patterns/system-compatibility-application.php
  patterns/prototype-field-home.php
)
for relative in "${required[@]}"; do
  if [[ ! -f "$THEME_SRC/$relative" ]]; then
    printf 'Missing required Hook theme file: %s\n' "$relative" >&2
    exit 1
  fi
done

plugin_required=(
  hook-content.php
  assets/presentation-planner/runtime-manifest.json
  assets/presentation-planner/preview/index.html
  assets/presentation-planner/preview/app.mjs
  assets/presentation-planner/preview/sw.js
  assets/presentation-planner/preview/manifest.webmanifest
  assets/presentation-planner/data/seed-presentations.mjs
  assets/presentation-planner/_shared/personalization.mjs
  assets/presentation-planner/_shared/privacy.mjs
  assets/system-compatibility/runtime-manifest.json
  assets/system-compatibility/evaluate.mjs
  assets/system-compatibility/preview/index.html
  assets/system-compatibility/preview/app.mjs
)
for relative in "${plugin_required[@]}"; do
  if [[ ! -f "$PLUGIN_SRC/$relative" ]]; then
    printf 'Missing required Hook plugin file: %s\n' "$relative" >&2
    exit 1
  fi
done

# Documentation may name retired spellings when recording the correction. Deployable
# theme and plugin source may not contain them.
if grep -RInE 'Hook the Forizon|hookthehoizon' "$THEME_SRC" "$PLUGIN_SRC"; then
  printf 'Retired or misspelled Hook identifier found in deployable source.\n' >&2
  exit 1
fi

# The compatibility runtime must not contain protected location collection fields.
if grep -RInE 'name="(exact.?location|coordinates?|latitude|longitude|private.?water|access.?code|gate.?code)"' "$PLUGIN_SRC/assets/system-compatibility"; then
  printf 'Protected location input found in compatibility runtime.\n' >&2
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

for relative in "${plugin_required[@]}"; do
  unzip -Z1 "$DIST/$PLUGIN_SLUG-$PLUGIN_VERSION.zip" | grep -Fxq "$PLUGIN_SLUG/$relative" || {
    printf 'Hook plugin release ZIP omitted required file: %s\n' "$relative" >&2
    exit 1
  }
done

printf 'Built validated Hook the Horizon release artifacts in %s\n' "$DIST"
