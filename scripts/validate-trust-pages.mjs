import fs from "node:fs";

const site = JSON.parse(fs.readFileSync("docs/trust-pages/site.json"));
const pages = JSON.parse(fs.readFileSync("docs/trust-pages/pages.json"));
const routes = JSON.parse(fs.readFileSync("docs/trust-pages/routes.json"));
const copy = fs.readFileSync("docs/trust-pages/copy.md", "utf8");
const required = ["about","contact","editorial_standards","disclosure","ai_disclosure","corrections","privacy","terms","accessibility"];
const errors = [];
const check = (ok, text) => { if (!ok) errors.push(text); };

check(site.contract_version === "1.1.0", "invalid contract version");
check(site.governance_mode === "risk_tiered_autonomous", "invalid governance mode");
check(site.wordpress?.draft_install_status === "queued_until_staging_connected", "staging state missing");
check(site.source_authorities?.length >= 6, "source authorities incomplete");
check(pages.length === 9, "nine pages required");
check(!/TODO|TBD|FIXME|LOREM IPSUM|PENDING APPROVAL/i.test(copy), "placeholder copy found");
check(new Set(pages.map(p => p.key)).size === 9, "duplicate page key");
check(new Set(pages.map(p => p.slug)).size === 9, "duplicate slug");
for (const key of required) check(pages.some(p => p.key === key), `missing ${key}`);
for (const page of pages) {
  const start = copy.indexOf(`## ${page.key}`);
  const next = start < 0 ? -1 : copy.indexOf("\n## ", start + 4);
  const body = start < 0 ? "" : copy.slice(start, next < 0 ? copy.length : next);
  check(body.length >= 300, `${page.key}: copy too short`);
  check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug), `${page.key}: bad slug`);
  check(page.seo_title.length <= 70, `${page.key}: long SEO title`);
  check(page.meta_description.length >= 40 && page.meta_description.length <= 170, `${page.key}: bad meta length`);
  check(page.risk_tier >= 0 && page.risk_tier <= 3, `${page.key}: bad risk tier`);
  check(/^\/contact\//.test(page.correction_route), `${page.key}: bad correction route`);
  check(page.contextual_disclosures?.length > 0, `${page.key}: missing disclosure`);
  check(page.required_checks?.length >= 3, `${page.key}: checks incomplete`);
  if (page.release_status === "configuration_required") check(page.required_configuration?.length > 0, `${page.key}: configuration list missing`);
}
for (const group of routes.footer.groups) for (const link of group.links) check(/^(\/|https:\/\/)/.test(link[1]), `bad footer link ${link[1]}`);
for (const item of routes.navigation.planned_primary) check(item.path.startsWith("/"), `bad nav path ${item.path}`);
check(site.automatic_stop_conditions?.length >= 5, "stop conditions incomplete");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Passed: ${site.publication}, ${pages.length} trust pages.`);
