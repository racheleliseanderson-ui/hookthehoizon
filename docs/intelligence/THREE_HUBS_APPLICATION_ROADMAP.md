# Hook the Horizon Three-Hub Intelligence Roadmap

**Status:** Draft implementation authority mirror  
**Date:** 2026-07-16  
**Canonical Drive authority:** `Hook the Horizon — Three Intelligence Hubs and Web Applications — Build Extension Specification — v1.0 — 2026-07-16`  
**Drive document:** https://docs.google.com/document/d/12XhROLpkfAmMA8CwbojKzO374jSaJdOVVnmqbHs4lqE/edit

## Decision

Hook the Horizon will develop three interconnected intelligence hubs and corresponding bounded web applications:

1. **The Living Fly Bench** → `HTH-HM-001 Hatch Match`
2. **Presentation Lab** → `HTH-PP-001 Presentation Planner`
3. **Rig Signal Lab** → `HTH-RS-001 Rig Signal`

These extend the existing `HTH-SC-001 System Compatibility` application and the governed `HHI-001 Honey Hole Intelligence` path. They do not replace either system.

## Product position

The market already has strong products for maps, catch logs, fishing forecasts, regulations, community, waypoints, and device-assisted trip recording. Hook the Horizon should differentiate through explainable reasoning, inventory-first guidance, private-by-default records, explicit evidence and uncertainty, no-purchase alternatives, field-learning loops, and sensor-agnostic interoperability.

## Shared constraints

- No exact private-water coordinates in public results, analytics, print output, URLs, or share payloads.
- No catch, access, safety, regulation, or hardware-performance guarantee.
- Deterministic rules and visible evidence precede model-generated explanations.
- Manual operation remains fully supported; devices and external APIs are optional enrichment.
- User inventory, observations, device events, and outcomes remain local by default.
- Official-source freshness and stale-state behavior are mandatory for time-sensitive data.
- Do not build against retiring USGS WaterServices endpoints; use the current Water Data API migration path.
- Every application must support mobile, keyboard, screen reader, reduced motion, print, safe sharing, and recovery.

## Initial repository paths

- `applications/hatch-match/`
- `applications/presentation-planner/`
- `applications/rig-signal/`

Each path begins as a draft scaffold. Production integration remains blocked until application-specific preview and QA evidence exist.

## Delivery sequence

1. Controlled vocabulary, source ledger, evidence rules, and privacy classification.
2. Versioned contracts and deterministic evaluators.
3. Complete, incomplete, conflicting, stale, and boundary fixtures.
4. Automated rule and privacy tests.
5. Mobile-first preview interfaces.
6. External source adapters with caching, freshness, outage, and migration behavior.
7. Optional local personalization and later consented synchronization.
8. Optional hardware and coarse-grained community adapters.

## Visual direction

Use field photography, water light, macro material and insect detail, graphite equipment, and warm technical plates. Keep mood imagery separate from factual diagrams. Generated pseudo-text, decorative charts, and unverified labels are prohibited in production assets.

## Current release posture

Build is authorized for draft documentation, contracts, deterministic code, fixtures, tests, and previews. Do not merge or publish public recommendations, exact-location features, or hardware-effectiveness claims without the recorded review gates.