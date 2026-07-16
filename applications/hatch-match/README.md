# Hatch Match

Application ID: `HTH-HM-001`  
Adapter key: `horizon.hatch-match`  
Status: draft MVP scaffold (`0.1.0-planning`)

Canonical authority: Google Drive — **Hook the Horizon — Three Intelligence Hubs and Web Applications — Build Extension Specification — v1.0 — 2026-07-16**.

## Reader job

Use declared region, date, water type, observable conditions, forage observations, and optional locally stored tying inventory to identify plausible hatch or forage classes, candidate fly patterns, confirmation cues, material coverage, and visible uncertainty.

## Boundaries

- No exact private-water coordinates are required, stored, logged, or shared.
- A forecast is not represented as a verified hatch.
- The application does not invent field experience, guarantee fish activity, or treat community volume as proof.
- Pattern and insect claims require source, evidence class, review date, and freshness state.
- Image recognition is not part of the first deterministic MVP.

## First result contract

- plausible hatch or forage classes with confidence bands
- observable confirmation cues
- linked candidate pattern categories
- inventory coverage: tie now / almost / unavailable
- material substitutions with property trade-offs
- why the recommendation may fit and why it may fail
- evidence needed to improve confidence
- compact print-safe tying and field-test card

## Planned implementation

1. Define controlled insect, life-stage, observation, material-property, and evidence vocabularies.
2. Add a versioned input/result contract.
3. Add a deterministic evaluator that ranks supplied evidence-backed candidates without embedding biological claims in code.
4. Add complete, incomplete, conflicting, stale, and exact-location boundary fixtures.
5. Add privacy and deterministic-rule tests.
6. Build an accessible mobile-first preview.

The application consumes shared evidence, confidence, provenance, saved-state, print/share, analytics, and privacy behavior from `@editorial-ecosystem/intelligence-core` where useful.