# System Compatibility Builder

Application ID: `HTH-SC-001`  
Schema and rule version: `0.2.0`  
Status: usable local-first application module; WordPress package candidate

Canonical authority: Google Drive — **Editorial Ecosystem — Five Parent Signature Applications — Build Specification Pack — v1.0 — 2026-07-15**.

Current repository: `racheleliseanderson-ui/hookthehorizon`.

## Reader job

Evaluate whether the declared rod, reel, main line, leader, terminal or lure, target-use, and broad field-condition facts form a compatible system; identify hard rating conflicts and the weakest supported link; and produce a printable field-test card.

## Current implementation

- deterministic evaluator in `evaluate.mjs`
- expanded fixtures in `tests/run.mjs`
- responsive, keyboard-complete browser application in `preview/`
- local save/resume in the browser
- JSON download and print-friendly setup card
- WordPress shortcode packaging through the Hook content plugin
- no account, server profile, external provider, or live API dependency

## Boundary

The tool does not invent product identity, guarantee performance or catch results, replace manufacturer ratings, establish legal access, guarantee safety, expose sensitive fishing locations, or treat contributor preference as universal proof. Exact model specifications are used only when supported by a label, manual, manufacturer record, receipt, or equivalent primary evidence.

Exact coordinates, private-water details, access codes, gate combinations, and restricted notes are not accepted, saved, shared, exported, or sent to analytics. Nested protected-location fields fail validation.

## Result states

- `compatible`
- `compatible_with_conditions`
- `test_before_use`
- `mismatch`
- `insufficient_information`

The result includes:

- identity and evidence qualification
- rating, capacity, weight, and connection checks
- hard stops that cannot be averaged away
- weakest supported links and field-condition trade-offs
- unknowns and evidence needed to raise confidence
- field-test sequence
- print and JSON export without location data
- schema, rule, privacy, and limitation record

## Run locally

```bash
node applications/system-compatibility/tests/run.mjs
python3 -m http.server 8080 --directory applications/system-compatibility
```

Open `http://localhost:8080/preview/`.

## WordPress packaging

The release build copies the canonical evaluator and preview files into `wordpress-plugin/hook-content/assets/system-compatibility/`. The shortcode is:

```text
[hth_system_compatibility]
```

The application runs inside a sandboxed iframe. It does not receive WordPress cookies, user identity, exact location, post content, or server-side state.

## Release boundary

This branch creates a package candidate and review surface. It does not install, activate, publish, or promote the application to production. Production promotion remains a separately authorized, backup-backed, reversible action.
