# Honey Hole Intelligence

Application ID: `HHI-001`  
Status: **privacy-enforced public-region trip-readiness prototype (`0.1.0`)**

Owner: Hook the Horizon  
Canonical repository path: `racheleliseanderson-ui/hookthehorizon/applications/honey-hole-intelligence`

## Purpose

Honey Hole Intelligence supports public-region trip preparation using current official regulation, closure, access, weather, water, hazard, permit, ownership, and conservation facts. It is designed to protect location privacy while making critical unknowns visible.

## Implemented slice

- uses Hook's recursive location-privacy inspection and public-output sanitization;
- rejects precise or inference-enabling location input before evaluation;
- field-specific freshness windows for all critical trip facts;
- visible unknown, stale, contradicted, and missing-source fields;
- scoped stop, verify, preparation-incomplete, and ready-with-controls states;
- public-safe backup planning and official-source questions;
- accessible local preview with invalid, privacy-rejection, stop, unknown, stale, source, backup, print, mobile, forced-colors, reduced-motion, and no-JavaScript states;
- canonical outcome events: `official_regulation_opened`, `trip_safety_check_complete`, `conservation_controls_acknowledged`, and `public_safe_location_used`;
- analytics events exclude region text, source URLs, and free-form location details;
- deterministic tests and CI.

## Boundaries

- No precise or private location disclosure.
- No fabricated visit, catch, regulation, closure, condition, ownership, access, or personal experience.
- No guarantee of legality, access, conditions, safety, or catch.
- Critical facts must be checked against the current official authority before departure.
- A narrow access, closure, hazard, or conservation stop does not block unrelated work.

## Run tests

```bash
node --check applications/honey-hole-intelligence/evaluate.mjs
node applications/honey-hole-intelligence/tests/run.mjs
node --check applications/honey-hole-intelligence/preview/app.mjs
node applications/honey-hole-intelligence/preview/tests/run.mjs
```

## Next implementation slice

Attach a bounded official-source fixture set using broad public geography; integrate the exact approved Intelligence Core evidence, result, provenance, and analytics services; package the preview through Hook's governed WordPress route; and complete scoped conservation/access, browser, assistive-technology, installed-artifact, and rollback evidence before production activation.
