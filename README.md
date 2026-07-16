# Hook the Horizon

**Domain:** https://hookthehorizon.blog  
**Repository:** `racheleliseanderson-ui/hookthehorizon`

Fishing, gear, and field stories from the water ahead.

Hook the Horizon is the fifth independent publication in the Five-Brand Editorial Ecosystem. It receives the same neutral-platform contracts, autonomous operating model, release evidence, accessibility, staging, deployment, and rollback standards as Tangled Thistle, Room for Drama, Salty and Clever, and Vanity or Vice. It does not inherit another publication's presentation.

## Canonical structure

- `wordpress-theme/` — authoritative deployable block theme, brand tokens, templates, parts, responsive and accessible presentation
- `wordpress-plugin/hook-content/` — authoritative deployable content plugin and durable fishing content models
- `applications/` — bounded Hook intelligence applications
- `theme/` and `content-plugin/` — retained legacy/source-history paths until fully reconciled; they are not the release authority
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

## Release authority and automatic progression

The release source is `wordpress-theme/` plus `wordpress-plugin/hook-content/`.

`Hook Theme Release Guard` automatically:

1. synchronizes the canonical `theme-tokens.json` authority into runtime CSS and `theme.json`;
2. validates PHP and JSON;
3. rejects missing theme files and retired Hook spellings;
4. builds exact theme and plugin ZIPs;
5. produces SHA-256 checksums and a file-level release manifest;
6. retains the artifacts for staging, parity, deployment, and rollback evidence.

A passing source build may merge automatically when no A3 exception exists. Preview and staging deployment may proceed automatically. Production promotion may proceed automatically only when the exact artifact is installed, backup or rollback is verified, repository-to-runtime parity passes, critical routes and accessibility checks pass, monitoring is active, and no A3 condition exists.

Source merge does not itself publish or activate the WordPress site.

## Homepage safety

The public homepage is field-led and people-free by default. Homepage featured media fails closed unless the attachment is affirmatively marked `_re_homepage_safe` after verification that it contains no people, no sensitive location evidence, and is suitable for homepage use.

## Current implementation

The normalized Hook theme now includes its canonical field palette, independent light and dark semantic mappings, Hook-owned template parts, a water-intelligence homepage, governed article/archive/search/error routes, accessible focus and target behavior, reduced-motion and forced-colors handling, print behavior, package validation, checksums, manifests, and automated release evidence.

Live WordPress parity remains a runtime fact to verify from the exact installed artifact; it is not inferred from a matching version label.
