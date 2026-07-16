# Rig Signal

Application ID: `HTH-RS-001`  
Adapter key: `horizon.rig-signal`  
Status: draft MVP scaffold (`0.1.0-planning`)

Canonical authority: Google Drive — **Hook the Horizon — Three Intelligence Hubs and Web Applications — Build Extension Specification — v1.0 — 2026-07-16**.

## Reader job

Evaluate what a connected fishing device or proposed sensor system can actually measure, what its evidence does not establish, which data fields can safely enter Hook the Horizon, and what verification is required before relying on the integration.

## Boundaries

- Sensor-agnostic and manual-first.
- Device telemetry and exact locations remain private by default.
- Exact coordinates are rejected from public, analytics, print, and share payloads.
- Bite detection, species identification, fight classification, and catch prediction require controlled evidence and visible error limitations.
- Commercial, prototype, research, patent, and concept maturity states remain separate.
- Manufacturer claims are not converted into verified field performance without supporting evidence.
- No automated feature replaces legal, ethical, or fair-chase judgment.

## First result contract

- verified capability matrix
- identity and evidence statement
- supported, unsupported, and ambiguous claims
- accepted, rejected, and local-only data fields
- normalized device-event preview
- privacy, power, durability, false-positive, and vendor-lock-in warnings
- validation and field-test checklist
- integration readiness tier: documented / importable / manual bridge / prototype-only / unsupported
- compatibility route to `HTH-SC-001 System Compatibility`

## Planned implementation

1. Define device, capability, sensor, event, unit, maturity, evidence, and privacy vocabularies.
2. Add versioned device-profile and device-event contracts.
3. Add deterministic evidence and field-acceptance rules.
4. Add high-risk claim handling for bite, species, and outcome inference.
5. Add fixtures for documented, ambiguous, prototype, unsupported, stale, and exact-location inputs.
6. Add privacy, claim, normalization, and recovery tests.
7. Build an accessible mobile-first capability explorer.

The application consumes shared evidence, confidence, provenance, saved-state, print/share, analytics, and privacy behavior from `@editorial-ecosystem/intelligence-core` where useful.