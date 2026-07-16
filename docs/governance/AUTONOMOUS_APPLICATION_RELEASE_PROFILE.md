# Hook the Horizon — Autonomous Application Release Profile

**Status:** Active application-specific implementation authority  
**Effective date:** 2026-07-16  
**Parent authority:** Editorial Ecosystem AI Autonomy and Exception Governance Standard v1.2

## Decision

Hook the Horizon applications use proportional validation and exception-only human review. Exhaustive QA matrices, universal manual reviews, duplicate Drive approvals, and generic “human approval required” gates are superseded.

The operating sequence is:

1. implement the bounded increment;
2. run checks that cover the changed risk surface;
3. repair failures and rerun;
4. record the result and rollback reference;
5. merge or release automatically when no Tier 3 exception exists.

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
- preview or staging releases;
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
- materially unresolved critical risk that cannot be reduced through source research, automated testing, simulation, staging, or rollback.

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

Source merge does not itself prove or activate production runtime. Preview and staging may proceed automatically. Production promotion may proceed automatically only when the exact artifact, checksum, backup or rollback package, critical routes, repository-to-runtime parity, and monitoring pass. A narrow Tier 3 exception blocks only the affected promotion.

## Current application decisions

- `HTH-SM-001 Horizon Smart Mode`: Tier 1 local-first preview; automatic progression after shared tests and preview syntax checks.
- `HTH-PP-001 Presentation Planner`: Tier 1 deterministic application; automatic progression after affected rule, persistence, share, and accessibility-critical checks.
- `HTH-HM-001 Hatch Match`: taxonomy and preview work are Tier 0/1; individual records escalate only when a defined Tier 3 biological, conservation, safety, or location risk exists.
- `HTH-RS-001 Rig Signal`: contracts and preview work are Tier 0/1; credentials, protected telemetry, unsupported high-risk capability claims, and binding manufacturer commitments are Tier 3.

## Final rule

Proceed, test what changed, repair failures, record the result, and continue. Do not require exhaustive QA or a person merely because the work is visible or multi-step.
