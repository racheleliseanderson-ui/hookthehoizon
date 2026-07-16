# System Compatibility

Application ID: `HTH-SC-001`  
Status: bounded MVP scaffold (`0.1.0`)

Canonical authority: Google Drive — **Editorial Ecosystem — Five Parent Signature Applications — Build Specification Pack — v1.0 — 2026-07-15**.

Current repository: `racheleliseanderson-ui/hookthehorizon`.

## Reader job

Evaluate whether the known rod, reel, main line, leader, terminal/lure, target-use, and field-condition facts form a compatible system; identify the weakest supported link; and provide a field-test sequence.

## Boundary

The tool does not invent product identity, guarantee performance or catch results, replace manufacturer ratings, expose sensitive fishing locations, or treat contributor preference as universal proof. Exact model specifications are used only when supported by a primary label, manual, receipt, or equivalent record.

Exact coordinates and private water details are not accepted, saved, shared, or sent to analytics.

## Result

- compatible / compatible-with-conditions / test-before-use / mismatch / insufficient-information tier
- identity and evidence statement
- rating/capacity/weight/connection checks
- weakest link and field-condition trade-offs
- evidence needed to raise confidence
- print-ready rig card without location data

## Shared contracts

Designed to consume `@editorial-ecosystem/intelligence-core`. Shared state, evidence, confidence, print/share, provenance, disclosure, analytics, accessibility, and release behavior remain in the core.

## Run tests

```bash
node applications/system-compatibility/tests/run.mjs
```

Production integration remains blocked pending preview, location-privacy review, and the Drive QA Matrix.
