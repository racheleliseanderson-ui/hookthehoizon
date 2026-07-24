# HHI-SCL-001 — State Conservation & Licensing Intelligence

**Status:** Active investigation and build out  
**Owner:** Hook the Horizon  
**Parent product:** HHI-001 Honey Hole Intelligence  
**Classification:** Intelligence/data product expansion  
**Controlling issue:** [#100](https://github.com/racheleliseanderson-ui/hookthehorizon/issues/100)

## Canonical authorities

- Living product specification: https://docs.google.com/document/d/1jVD5iLjedl2MQ9IzOgWycAUQu3mmX7338KCVtefGe1Y/edit
- Canonical Intelligence folder: https://drive.google.com/drive/folders/1mnjR4HB-nvjK1Y1StVnyU3G_ADBcDbSb
- Master Intelligence portfolio tracker: https://docs.google.com/spreadsheets/d/1unf3odQEKm0tDPcfnPLxqgJ39fkJPCj2-uo9sdMDi7o/edit
- Portfolio Intelligence root: https://drive.google.com/drive/folders/1ohZ4Qn7UKmKisypn7_DQbwDQLfLsOltc

Google Drive is the human-readable authority. GitHub is the durable implementation, schema, validation, dataset, and change-history system. The WordPress runtime must eventually consume governed GitHub artifacts rather than maintain a separate truth source.

## Governing decision

HHI-SCL-001 is a bounded expansion of Honey Hole Intelligence. It must not become a competing public conditions authority, duplicate state tracker, disconnected research system, or second source of truth for regulations, closures, access, conservation, or trip readiness.

The product will cover all 50 U.S. states and the District of Columbia where materially applicable. Territory coverage is a controlled later expansion. Federal, tribal, interstate, and reciprocal-water overlays must be represented only within their actual jurisdiction and authority.

## Reader job

Help an angler determine:

- which state license, endorsement, stamp, permit, registration, reporting instrument, or access credential may apply;
- where the official purchase and current regulations channels are;
- which rules are stable, annual, seasonal, in-season, emergency, or transactional;
- which conservation, invasive-species, handling, transport, access, and vulnerable-fishery obligations change the trip decision;
- what remains unknown, conflicting, stale, or dependent on immediate official verification.

The product may provide bounded decision support. It may not guarantee compliance, replace official rules, authorize a trip from stale evidence, or expose sensitive waters and private access.

## Product relationships

HHI-SCL-001 inherits:

- evidence, freshness, uncertainty, correction, accessibility, export, and monitoring primitives from Shared Intelligence Core;
- regulation, closure, access, hazard, conservation, and authoritative-source ownership from HHI-001;
- public-region and sensitive-location protections from existing Honey Hole Intelligence controls;
- restrained Hook the Horizon voice and visual authority for reader-facing interfaces.

Related records:

- `HHI-001` — Honey Hole Intelligence
- `HHI-DATA-001` — Honey Hole Conditions & Source Records
- `CORE-001` — Shared Intelligence Core
- GitHub issues `#17`, `#35`, `#73`, and `#96`

## Required repository structure

This directory is the durable documentation anchor. Add implementation records beneath it without creating parallel authorities:

```text
docs/intelligence/state-conservation-licensing/
├── README.md
├── architecture.md
├── source-precedence.md
├── freshness-and-expiry.md
├── normalization-rules.md
├── reader-experience.md
├── monitoring.md
├── validation-report.md
└── pilot/
    ├── README.md
    ├── washington.md
    ├── colorado.md
    ├── montana.md
    ├── florida.md
    ├── texas.md
    ├── michigan.md
    ├── maine.md
    ├── alaska.md
    └── california.md

schemas/intelligence/state-conservation-licensing/
data/intelligence/state-conservation-licensing/
tests/intelligence/state-conservation-licensing/
```

Do not create empty placeholder files merely to satisfy this map. Add each file when it contains substantive, source-backed content.

## Required record model

Each jurisdiction record must preserve state-specific terminology and include, where applicable:

- primary and secondary authorities;
- official licensing portal;
- current regulations source;
- emergency-rule and closure channel;
- resident and nonresident eligibility;
- annual, short-term, youth, senior, military, veteran, disability, lifetime, and reciprocal products;
- freshwater, saltwater, combination, species, gear, waterbody, habitat, conservation, and invasive-species endorsements;
- license-year and expiration behavior;
- digital and physical display requirements;
- seasons, zones, methods, gear, bait, hooks, possession, size, slot, tagging, reporting, quotas, lotteries, and reservations;
- public access, launch, parking, vessel, federal, tribal, municipal, and private-access overlays;
- habitat, invasive species, fish handling, transport, disease, thermal refuge, and vulnerable-fishery requirements;
- exact source, authority, effective date, retrieval date, supported claim, volatility class, review date, hard expiry, conflicts, unknowns, and change history.

## Source precedence

Use the following default ranking, documenting exceptions:

1. Current statute, administrative code, emergency order, or official regulatory notice.
2. Official state fish and wildlife, marine, natural resources, environmental, parks, or licensing publication.
3. Official state transaction portal or agency FAQ.
4. Official federal or tribal authority for the jurisdiction it controls.
5. Official interstate commission, compact, or regional authority.
6. Reputable secondary sources for discovery only, never as the sole support for a consequential claim.

Conflicting official statements must remain visible until resolved. Never silently choose the simpler or more convenient statement.

## Freshness and failure behavior

Every material value must carry a volatility class and review behavior:

- `stable`
- `annual`
- `seasonal`
- `in-season`
- `emergency`
- `transactional`

Stale data must fail safely. The interface may show a dated known baseline, but it must suppress definitive trip authorization and route the reader to the appropriate official source. Prices and currently available license products must be verified against the official transaction channel before being described as current.

## Initial pilot

The first research cohort is:

- Washington
- Colorado
- Montana
- Florida
- Texas
- Michigan
- Maine
- Alaska
- California

This cohort tests materially different inland, coastal, Great Lakes, anadromous, public-land, marine, invasive-species, and emergency-rule systems. It is not a state-priority ranking.

## Implementation sequence

1. Inventory current Hook and shared-intelligence contracts, schemas, routes, packages, and validators.
2. Create the jurisdiction and agency registry.
3. Finalize source classes, record schema, normalization rules, volatility classes, and hard-expiry behavior.
4. Research the pilot states from authoritative sources.
5. Build evidence-backed records with review and expiry dates.
6. Validate conflicts, unknowns, stale behavior, official handoffs, and sensitive-location controls.
7. Define state overview, comparison, license-finder, save, print, export, and trip-checklist contracts.
8. Add monitoring and change-detection specifications.
9. Open an implementation pull request only after the schema and pilot evidence are coherent.

## Completion standard

A row for every state is not completion. Completion requires authoritative evidence, state-specific distinctions, visible conflicts and unknowns, working stale and emergency behavior, valid official handoffs, conservation content that changes decisions, sensitive-water protection, auditable corrections, and alignment across Drive, GitHub, and the eventual WordPress runtime.
