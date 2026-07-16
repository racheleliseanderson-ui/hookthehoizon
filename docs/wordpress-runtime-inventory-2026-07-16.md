# Hook the Horizon — WordPress Runtime Inventory

**Date:** 2026-07-16  
**Status:** Verified read-only inventory; remediation remains preview-only  
**Tracking:** Issue #18 and draft PR #19  
**Canonical site:** `https://hookthehorizon.blog`  
**Canonical repository:** `racheleliseanderson-ui/hookthehorizon`

## Authorization boundary

This inventory records the connected WordPress runtime and compares it with the repository. It does not authorize publication, deployment, theme or plugin activation, deletion, production data migration, live navigation changes, or exposure of sensitive fishing locations.

## Verified runtime

| Control | Verified value |
|---|---|
| WordPress | 7.0.1 |
| PHP | 8.4.23 |
| Active theme | Hook the Horizon Preliminary Editorial System 0.2.0 (`hook-the-horizon`) |
| Active content plugin | Hook the Horizon Content 0.2.0 |
| Shared core | Rachel Editorial Core 0.2.0 |
| Front-page mode | Latest posts (`show_on_front=posts`) |
| Static front page | None (`page_on_front=0`) |
| Posts page | None (`page_for_posts=0`) |
| Stored `home` and `siteurl` | `http://hookthehorizon.blog/` |
| Public canonical route | `https://hookthehorizon.blog/` |
| Permalink structure | `/%year%/%monthnum%/%day%/%postname%/` |

## Installed content and navigation

- One published page exists: **About**.
- The About page still contains the default WordPress example-page copy and is not governed Hook the Horizon content.
- One published post exists: **Hello World!**.
- Two published Navigation entities exist. Both contain only an automatic page list, which currently exposes only About.
- The saved footer template part references one of those duplicate navigation entities and contains empty text fields.
- No media attachments were present in the post-type count reviewed during this inventory.

## Critical saved-template contamination

The saved WordPress `Front Page` template override contains material from another publication:

- imports header and footer template parts from `room-for-drama-alpha4`;
- uses the sentence `Sharp, useful room intelligence for spaces that need more function, atmosphere, and nerve.`;
- includes Hook CTA labels without destinations;
- uses generic post-grid output rather than the governed Hook reader journey.

This is a confirmed cross-brand contamination defect. It must be corrected in preview or draft only. The saved production override must not be silently edited or deleted.

## Registered Hook content model

The active Hook content plugin exposes these public custom post types:

- `field_report`
- `gear_review`
- `species_profile`
- `technique`
- `water_profile`

The status taxonomy `hth_status` is registered for these types. No published or draft records for these custom post types were present in the reviewed database counts.

The runtime theme exposes block templates for core and specialized routes, including search, 404, generic page/single/archive, custom-type singles and archives, About, Privacy, Disclosure, Safety and Stewardship, Start Here, Compatibility Builder, and other planned routes. Template availability does not mean that corresponding pages, content, evidence, destinations, or acceptance testing exist.

## Repository/runtime divergence

### Theme version and path

- Repository `theme/style.css` identifies version **0.1.0**.
- Connected WordPress reports active theme version **0.2.0**.
- Repository README describes `theme/` and `content-plugin/` as canonical package directories.
- Draft PR #19 changes `wordpress-theme/`, not `theme/`.

The installed package, repository main branch, and prototype branch are therefore not demonstrably identical.

### Prototype workflow path defect

PR #19 adds a workflow that validates and packages:

- `theme/`
- `content-plugin/`

However, the PR's prototype theme changes are under `wordpress-theme/`. As written, the workflow can package the old `theme/` directory while omitting the new prototype files. The workflow must use one canonical source directory and fail when duplicate theme roots exist.

No pull-request workflow run was returned for the reviewed PR head commit at inventory time.

### Missing repository parity

The connected runtime exposes many block templates that are not represented by the minimal `theme/templates/index.html` foundation currently visible on the main branch. Before any package is accepted, the repository must become the complete auditable source for the intended preview package, or the runtime-only material must be explicitly classified and migrated.

## Preview-only remediation gates

### Gate 1 — Canonical package source

- Select one theme source directory: `theme/` or `wordpress-theme/`.
- Remove ambiguity from documentation, CI, packaging, and install instructions.
- Record installed and repository version checksums.
- Do not package from one directory while reviewing another.

### Gate 2 — Clean Hook front page

- Create a Hook-owned preview front-page template with no Room for Drama references.
- Use real Hook template parts.
- Replace room language with approved Hook language.
- Give every CTA a real, approved destination or an honest unavailable state.
- Do not overwrite the saved runtime template until preview acceptance and explicit authorization.

### Gate 3 — Controlled page foundation

Prepare draft or preview representations for:

- Homepage
- Honey Hole Intelligence
- About
- Methodology
- Conservation and Location Protection
- Disclosure
- Privacy Policy matched to actual data flows

The live About placeholder and Hello World post remain defects until removal or replacement is explicitly authorized.

### Gate 4 — Navigation and utility behavior

- Replace duplicate automatic page-list navigation with governed primary, utility, and footer structures in preview.
- Include search, correction, disclosure, privacy, accessibility, and conservation routes only when destinations are real.
- Add honest empty and no-result states.
- Verify 404, search, archive, and custom-type routing.

### Gate 5 — URL and environment review

- Determine why WordPress stores `home` and `siteurl` as HTTP while the public site resolves over HTTPS.
- Confirm WordPress.com or proxy requirements before changing either option.
- Test canonical URLs, redirects, REST output, feeds, sitemaps, and mixed-content behavior in a safe environment.

### Gate 6 — Content-model acceptance

- Confirm each custom post type's reader purpose, fields, archive behavior, privacy classification, evidence requirements, and maintenance owner.
- Do not publish empty archives as substantive hubs.
- Keep exact coordinates, private access paths, and unnecessary sensitive-location data out of fields, analytics, URLs, exports, and fixtures.

### Gate 7 — Accessibility, performance, and rollback

Required preview evidence includes:

- desktop and mobile screenshots;
- keyboard and focus-order notes;
- screen-reader and landmark review;
- reduced-motion behavior;
- no-JavaScript reading paths where required;
- image dimensions, alt text, licensing, and responsive loading;
- page-weight and Core Web Vitals baseline;
- link and destination test results;
- installable staging-only packages and checksums;
- rollback instructions and a verified previous package.

## Immediate repository actions

1. Keep PR #19 in draft.
2. Correct the theme-directory and packaging mismatch.
3. Add a preview front-page template owned entirely by Hook the Horizon.
4. Add or verify Hook header and footer template parts.
5. Add runtime-version and package-manifest validation to CI.
6. Produce preview evidence before requesting review.
7. Keep all WordPress content and configuration changes in draft, staging, or an explicitly approved preview environment.

## Items unchanged

- No WordPress content was edited.
- No theme or plugin was activated, deactivated, uploaded, or deleted.
- No URL option was changed.
- No navigation was changed.
- No sensitive location information was collected or exposed.
- No pull request was merged.
