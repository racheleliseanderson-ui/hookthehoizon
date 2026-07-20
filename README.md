# Hook the Horizon

**Domain:** https://hookthehorizon.blog  
**Repository:** `racheleliseanderson-ui/hookthehorizon`

Fishing, gear, and field stories from the water ahead.

Hook the Horizon is the fifth independent publication in the Five-Brand Editorial Ecosystem. It receives the same neutral-platform contracts, autonomous operating model, release evidence, accessibility, staging, deployment, and rollback standards as Tangled Thistle, Room for Drama, Salty and Clever, and Vanity or Vice. It does not inherit another publication's presentation.

## Canonical structure

- `wordpress-theme/` — authoritative deployable block theme, brand tokens, templates, parts, responsive and accessible presentation
- `wordpress-plugin/hook-content/` — authoritative deployable content plugin and durable fishing content models
- `applications/` — bounded Hook intelligence applications
- `theme/` — retained legacy/source-history theme path; it is not the release authority
- `content-plugin/` — retired historical locator only; it must not contain an executable WordPress plugin bootstrap or enter release artifacts
- `docs/` — design, editorial, governance, evidence, and technical authorities

Public brand text must always spell **Hook the Horizon** correctly. The repository locator is `hookthehorizon`; retired spellings such as `Hook the Forizon` and `hookthehoizon` are invalid in active source, governance, packaging, and deployment records.

## Neutral-platform boundary

`Master-of-The-Universe-` and Rachel Editorial Core provide brand-neutral contracts, schemas, accessibility primitives, evidence behavior, and release controls. They are not a WordPress parent theme and do not own Hook the Horizon's palette, typography, homepage composition, field modules, fishing logic, imagery, or editorial voice.

## Autonomous operating model

Routine governed work proceeds automatically under the Editorial Ecosystem AI Autonomy and Exception Governance Standard.

Automatic work includes research, documentation, branches, commits, tests, token synchronization, package builds, preview deployment, reversible corrections, ordinary content operations, and source merges after applicable checks pass. Failed checks trigger repair and retry rather than a generic approval request.

Human exception review is limited to A3 conditions, including:

- contributor identity, image, voice, exact age, routine, or minor-safety exposure;
- exact or sensitive location disclosure and protected conservation data;
- unsupported regulation, safety, medical, legal, or professional claims;
- credentials, account authority, privacy-policy changes, or protected data handling;
- contracts, sponsorships, advertising, payments, or spending outside an approved envelope;
- destructive, irreversible, domain/DNS ownership, or unrecoverable production actions;
- materially unresolved risk that cannot be reduced through research, testing, staging, or rollback.

A narrow A3 exception does not pause unrelated work.

Application delivery uses the repository-specific profile in `docs/governance/AUTONOMOUS_APPLICATION_RELEASE_PROFILE.md`. Validation is proportional to the changed risk surface; exhaustive universal QA and generic manual review are not required.

## Intelligence applications

Current governed application paths include:

- `applications/system-compatibility/` — equipment-system compatibility
- `applications/honey-hole-intelligence/` — privacy-aware water, access, regulation, condition, and conservation intelligence
- `applications/hatch-match/` — reviewed hatch, forage, pattern, and material intelligence
- `applications/presentation-planner/` — owned-inventory presentation planning
- `applications/rig-signal/` — device evidence and sensor-agnostic event contracts
- `applications/_shared/` — local-first contracts, privacy controls, explainable personalization, and the shared intelligence graph

`HTH-SM-001 Horizon Smart Mode` is the local-first personalization layer for Presentation Planner. It combines broad declared conditions, owned inventory, system compatibility, reviewed evidence, source state, and bounded personal outcome history. It does not collect exact location, promise catches, or let popularity, affiliate value, or raw reporting volume determine rank.

The first preview supports:

- best-supported, contrast, and fallback plans;
- factor-level explanations;
- private local profile, inventory, history, and outcomes;
- negative and inconclusive field-test records;
- local mastery summaries and an intelligence brief;
- public-safe share-card export;
- print and bounded offline PWA behavior.

## WordPress application route

The canonical content plugin exposes Presentation Planner through:

```text
[hth_presentation_planner]
```

The `hook-the-horizon/presentation-planner-application` block pattern includes the shortcode and its editorial introduction. During the release build, `scripts/sync-presentation-planner-runtime.mjs` copies the canonical application source into the plugin artifact at `assets/presentation-planner/` and writes a runtime manifest.

The shortcode renders the application in a sandboxed same-origin iframe with no WordPress user identity, post content, precise location, or server-side recommendation state passed into the application. The current implementation remains local-first inside the browser. The route is reversible by removing the shortcode block or restoring the previous plugin artifact.

## Release authority and automatic progression

The release source is `wordpress-theme/` plus `wordpress-plugin/hook-content/`.

`Hook Theme Release Guard` automatically:

1. synchronizes the canonical `theme-tokens.json` authority into runtime CSS and `theme.json`;
2. synchronizes the Presentation Planner runtime into the content plugin artifact;
3. validates PHP, application modules, JSON contracts, and runtime manifests;
4. rejects missing theme, plugin, and application-runtime files and retired Hook spellings;
5. builds exact theme and plugin ZIPs;
6. produces SHA-256 checksums and a file-level release manifest;
7. retains the artifacts for staging, parity, deployment, and rollback evidence.

`Horizon Intelligence Applications CI` validates the application risk surface: deterministic behavior, privacy controls, local history, knowledge-graph integrity, PWA module syntax, JSON contracts, and WordPress pattern PHP.

A passing source build may merge automatically when no A3 exception exists. Preview and staging deployment may proceed automatically. Production promotion may proceed automatically only when the exact artifact is installed, backup or rollback is verified, repository-to-runtime parity passes, critical routes and accessibility checks pass, monitoring is active, and no A3 condition exists.

Source merge does not itself publish or activate the WordPress site.

## Homepage safety

The public homepage is field-led and people-free by default. Homepage featured media fails closed unless the attachment is affirmatively marked `_re_homepage_safe` after verification that it contains no people, no sensitive location evidence, and is suitable for homepage use.

## Current implementation

The normalized Hook theme includes its canonical field palette, independent light and dark semantic mappings, Hook-owned template parts, a water-intelligence homepage, governed article/archive/search/error routes, accessible focus and target behavior, reduced-motion and forced-colors handling, print behavior, package validation, checksums, manifests, and automated release evidence.

The intelligence application layer includes shared local-first contracts, recursive sensitive-location controls, explainable Smart Mode ranking, a local knowledge graph, outcome and mastery records, a Presentation Planner PWA preview, Hatch Match record-level evidence governance, Rig Signal device-event contracts, editorial hub patterns for The Living Fly Bench and Presentation Lab, and a packaged WordPress shortcode route for Presentation Planner.

Live WordPress parity remains a runtime fact to verify from the exact installed artifact; it is not inferred from a matching version label.
