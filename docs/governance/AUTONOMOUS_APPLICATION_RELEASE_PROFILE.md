# Hook the Horizon — Autonomous Application Release Profile

**Status:** Active application-specific implementation authority  
**Effective date:** 2026-07-16  
**Last updated:** 2026-07-17  
**Parent authority:** Editorial Ecosystem AI Autonomy and Exception Governance Standard v1.2

## Decision

Hook the Horizon applications use proportional validation and exception-only human review. Exhaustive QA matrices, universal manual reviews, duplicate Drive approvals, generic “human approval required” gates, and mandatory paid staging subscriptions are superseded.

The operating sequence is:

1. implement the bounded increment;
2. run checks that cover the changed risk surface;
3. repair failures and rerun;
4. confirm the current owner-managed backup and record the rollback reference;
5. deploy the exact reversible artifact through the connected WordPress write surface;
6. verify installed versions, critical routes, and rendered behavior immediately;
7. roll back from the existing backup or deactivate the affected artifact if verification fails;
8. record the result.

## Application risk profile

### Tier 0 — automatic

- documentation, taxonomy, source ledgers, controlled vocabularies, fixtures, tests, issue and registry updates;
- local-only prototypes and preview interfaces;
- reversible refactors and metadata corrections;
- synthetic seed records;
- accessibility, performance, privacy, and error-handling improvements;
- editorial hub patterns and ordinary application copy.

### Tier 1 — automatic after applicable checks

- deterministic rule changes;
- local persistence and offline behavior;
- source merges;
- preview releases and disposable-runtime validation;
- nonbreaking schema additions;
- public-safe export formats;
- reversible WordPress theme or content-plugin integration;
- ordinary public application updates within approved evidence and privacy boundaries.

A completion record is required. A person does not need to inspect every line.

### Tier 2 — automatic inside a defined envelope

- external APIs using approved source categories and no new protected-data handling;
- additive, reversible storage migrations;
- opt-in notifications using approved audiences and content rules;
- bounded public experiments and traffic allocation;
- AI-generated explanations that cannot alter evidence, scoring rules, or source state.

Tier 2 requires explicit acceptance criteria, monitoring, and rollback. It does not require generic human approval.

### Tier 3 — narrow exception only

Stop only the affected action for:

- credentials, authentication privileges, or security-policy changes;
- new collection or transmission of precise location, protected personal data, payment data, or confidential information;
- binding legal, privacy, sponsorship, partnership, advertising, or financial commitments outside an approved envelope;
- unsupported regulation, safety, conservation, biological, hardware-performance, or professional claims with plausible material harm;
- irreversible deletion, destructive migration, domain or DNS ownership change, or an action without a recovery path;
- materially unresolved critical risk that cannot be reduced through source research, automated testing, simulation, disposable-runtime validation, direct readback, or rollback.

The exception must name the exact risk, affected record or action, threshold, and smallest decision needed. Unrelated work continues.

## Proportional checks

Checks are chosen by changed behavior, not by a universal checklist.

| Changed behavior | Minimum applicable check |
|---|---|
| Deterministic scoring | rule fixtures, exclusion fixtures, stale and unknown states |
| Local persistence | save, restore, corrupt-state recovery, clear/delete |
| Public export or sharing | public-safe allowlist and location-leakage test |
| Offline/PWA | install/cache check, offline core flow, update recovery |
| WordPress pattern or template | PHP parse, block markup presence, theme build |
| Accessibility-critical interaction | keyboard completion, visible focus, labels, result announcement |
| External API | timeout, retry, cache, freshness, outage, schema migration, disable and rollback |
| Device data | unit, quality, calibration, uncertainty, privacy, location-free output |
| Biological recommendation | source, scope, confirmation, disconfirmation, freshness, conservation state |

Not every application increment needs every row.

## Merge rule

A source change may merge automatically when:

- the affected automated checks pass;
- no unresolved critical defect remains in the changed path;
- the change is reversible or has a tested recovery path;
- protected paths and Tier 3 conditions are absent;
- the completion record identifies objective, authority, result, and rollback.

Draft status is a development state, not a permanent permission gate. Pull requests should be marked ready when the applicable criteria are satisfied.

## WordPress boundary

Source merge does not itself prove or activate production runtime. A separate paid staging environment is not required and is not planned for the near future.

The accepted WordPress release model is **backup-backed, reversible direct production promotion**:

- use the owner’s existing backups as the recovery control;
- confirm that a current backup exists before the write;
- record the exact artifact version and SHA-256 checksum;
- make only the bounded, reversible change;
- preserve the active theme unless the authorized change specifically concerns it;
- verify installed plugin/theme versions, critical URLs, rendered output, privacy boundaries, and error states immediately after the write;
- deactivate the affected plugin, revert the page, or restore the existing backup if verification fails;
- record the runtime evidence and rollback path in the repository-to-live register.

The absence of a separate staging subscription must not be recorded as a blocker, missing dependency, or incomplete owner input. Disposable WordPress and browser validation remain the pre-production test layer. Production parity is established only by direct installed-runtime verification after the controlled write.

## Current application decisions

- `HTH-SM-001 Horizon Smart Mode`: Tier 1 local-first application; automatic progression after shared tests, disposable-runtime validation, backup confirmation, controlled installation, and direct route verification.
- `HTH-PP-001 Presentation Planner`: Tier 1 deterministic application; automatic progression after affected rule, persistence, share, accessibility-critical checks, backup confirmation, and direct runtime verification.
- `HTH-HM-001 Hatch Match`: taxonomy and preview work are Tier 0/1; individual records escalate only when a defined Tier 3 biological, conservation, safety, or location risk exists.
- `HTH-RS-001 Rig Signal`: contracts and preview work are Tier 0/1; credentials, protected telemetry, unsupported high-risk capability claims, and binding manufacturer commitments are Tier 3.

## Final rule

Proceed, test what changed, confirm the available backup, make the smallest reversible production change, verify immediately, repair or roll back on failure, record the result, and continue. Do not require a paid staging environment that the owner has explicitly rejected.