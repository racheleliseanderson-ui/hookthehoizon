# Hook the Horizon Applications — Design Authority

**Canonical publication platform:** PUB-HTH-001  
**Representative applications:** HTH-PP-001 Presentation Planner; HTH-SM-001 Horizon Smart Mode; HTH-HM-001 Hatch Match; HTH-SC-001 System Compatibility; HHI-001 Honey Hole Intelligence  
**Publication:** Hook the Horizon  
**Repository:** racheleliseanderson-ui/hookthehorizon  
**Active branch:** `rebuild/2026-07-clean-luxury-worlds`  
**Status:** preview-operational; production replacement not authorized  
**Last reviewed:** 2026-07-20

## Purpose and audience

Hook the Horizon applications help readers interpret water, conditions, gear systems, presentation choices, trip readiness, biological cues, uncertainty, safety, access, and stewardship without pretending to predict catches or reveal sensitive locations. They serve observant anglers and field learners who want useful decisions rather than bravado or generic tips.

The applications must feel like part of a capable field publication. They must not resemble a generic outdoor dashboard, fishing game, location service, corporate field app, macho gear interface, or opaque prediction engine.

## Principal journey

1. Arrive through a field question, water observation, gear conflict, trip constraint, or presentation decision.
2. Record only the information needed for the bounded task.
3. Separate observation, source-backed fact, inference, unknown, stale information, and current verification requirements.
4. Respect safety, access, regulation, conservation, and sensitive-location stops.
5. Produce a useful presentation plan, compatibility result, biological cue comparison, packing record, or verification question set.
6. Continue into the relevant field file, system guide, stewardship resource, or official-source verification path.

## Publication-specific visual direction

The interface should feel observant, water-led, tactile, precise, capable, and naturally engaging. It should combine field-notebook intelligence, weathered material cues, open horizon, moving-water structure, and crisp decision instruments.

Use depth navy, horizon blue, current teal, foam and fog neutrals, kelp, restrained vermilion, brass, and sky metal. Use linework, flow, contour, knot, current seam, rig chain, and field-card geometry where they communicate real relationships. Avoid camouflage clichés, game-like meters, macho black-and-red dashboards, generic mountain imagery, or decorative fishing icons.

### Typography

- Use the active Hook hierarchy for display, editorial, interface, numeric, and fallback roles.
- Display type may establish field character; regulations, source dates, conditions, errors, and controls must remain immediately legible.
- Measurements, line classes, weights, dates, ranges, and compatibility values require stable alignment and units.
- Field explanations use readable measures and direct language.

### Color and surfaces

Working palette:

- Depth Navy `#071827`
- Horizon Blue `#2E6F95`
- Current Teal `#176F78`
- Foam `#F6F3EA`
- Fog `#D9D7CE`
- Kelp `#4C604A`
- Vermilion `#E45E3B`
- Brass `#C7A257`
- Sky `#AEBCC0`

Color must distinguish water, evidence, compatibility, caution, stop, and action. It must not become a fishing-game heat map. Compatible, conditional, conflict, unknown, stale, verify-now, safety-stop, access-stop, regulation-stop, and privacy-stop states require text and non-color cues.

### Layout, spacing, and geometry

- Prefer field sequences, rig chains, water-reading diagrams, packing systems, cue comparisons, source panels, and decision records over dashboard grids.
- Keep observation, evidence, limitation, stop, and next action visibly related.
- Avoid repeated equal gear cards and generic score tiles.
- Desktop may juxtapose field context and instrument detail; mobile must sequence them without losing causal relationships.
- Tables and comparisons must preserve labels, units, source dates, uncertainty, and verification needs.

### Imagery, diagrams, and data visualization

- Field photography must have a clear editorial job and pass rights, location-privacy, metadata, and stewardship review.
- Useful graphics include moving-water maps, presentation chains, rig compatibility diagrams, packing systems, stop gates, cue comparisons, and privacy-safe region context.
- Generated or illustrative imagery may not imply a documented catch, exact location, current condition, access permission, regulation, or field test.
- No coordinates, private access routes, identifiable sensitive structure, or hidden location metadata may appear in public assets.

### Motion

- Use motion to explain current direction, presentation sequence, rig relationship, condition change, or decision consequence.
- Do not use animated catch predictions, pulsing location markers, or urgency theater.
- Reduced-motion mode replaces transitions with immediate state changes.
- Motion must not obscure source dates, stops, or verification requirements.

## Component anatomy

Material components include field-question arrival, observation and condition inputs, source and freshness panel, presentation inventory, compatibility chain, biological cue comparison, uncertainty and disconfirming cues, safety/access/regulation/privacy stops, packing or field record, result explanation, clear local-data control, print/export, and contextual onward routes.

Presentation Planner orchestrates distinct domain owners; it does not absorb every application’s data ledger. Smart Mode remains local-first and explainable. Hatch Match owns a bounded biological cue set, not current conditions, regulations, access, or precise location.

## Application states

Required states where applicable:

- editorial arrival and orientation;
- blank field or gear record;
- partial input;
- offline or interrupted state;
- missing, stale, conflicting, or unverifiable source state;
- validation error and correction;
- incompatible, conditional, conflict, and unknown gear result;
- insufficient biological cues or disconfirming evidence;
- safety, access, regulation, wildlife, weather, conservation, or privacy stop;
- completed presentation, packing, or compatibility result;
- local save, clear, export, and recovery states;
- disabled action with a visible reason.

No output may guarantee a catch, current condition, access, regulation, safety, compatibility beyond supported inputs, or a location-specific biological event without current evidence.

## Responsive behavior

The principal journey must work at 360px, tablet, desktop, and wide desktop. Rig chains, flow diagrams, cue comparisons, source panels, and field records must reflow without losing units, labels, dates, or stops. Controls require adequate target size and outdoor-usable contrast. Print output must preserve assumptions, source dates, unknowns, stops, and verification actions.

## Accessibility

- Semantic headings, landmarks, fieldsets, labels, units, and ordered decision flow.
- Logical keyboard order, visible focus, escape behavior, and skip links.
- Programmatic errors, grouped controls, live result announcements, and accessible comparisons.
- Textual alternatives for water, rig, cue, and packing diagrams.
- Contrast, forced colors, non-color cues, target size, zoom, text resizing, reduced motion, and print-safe output.

## Hatch Match maintenance authority

HTH-HM-001 requires a named operational owner, reviewed source hierarchy, record-level source IDs, review cadence, freshness class, change log, publication state, correction and retirement process, and explicit sensitive-location exclusion.

The approved preview seed set is not a permanent operational dataset. Records must be reviewed at least seasonally and whenever a material source, taxonomy, biological interpretation, or publication limitation changes. Current conditions, regulations, access, closures, and exact location remain owned by their respective sources and applications.

## Data, privacy, consent, permissions, and security

Collect the minimum information required for the result. Do not request exact catch coordinates, private access details, credentials, payment data, or unnecessary identities. Local or session processing is preferred for field plans, inventories, and Smart Mode history.

Any server persistence requires explicit ownership, authorization, retention, deletion, consent, and monitoring. Inputs, imports, exports, and logs must be checked for sensitive location data. Public routes must not expose internal notes, hidden rules, administrative metadata, or private field records.

## Performance and monitoring

Field media, diagrams, and offline-capable application assets must remain responsive on mobile hardware. Reserve image dimensions, optimize derivatives, avoid oversized animation and mapping libraries, and preserve useful failure behavior under weak connectivity. Analytics and monitoring remain disabled unless authorized, consent-aware, and verified in the deployed runtime.

## Production data and migration

Production acceptance requires exact Hook Content package identity, exclusion of the legacy duplicate plugin generation, installed version parity, preserved application and field-record IDs, route compatibility, idempotent migration counts, representative production-shaped data, sensitive-location checks, and a practical managed restoration path.

## Prohibited patterns

- Generic outdoor or fishing dashboard styling.
- Fishing-game meters, catch probabilities, leaderboards, or gamified location maps.
- Macho black-and-red gear interfaces.
- Repeated rounded gear cards with palette-only identity.
- Exact or inferable sensitive locations.
- Unsupported current-condition, access, regulation, safety, or catch claims.
- Decorative field imagery with no reader job.
- Hidden unknowns or disabled actions without reasons.
- Internal repository, workflow, schema, queue, or production language on reader-facing surfaces.

## Rendered acceptance examples

Review Presentation Planner and Smart Mode arrival, plan generation, inconclusive outcome, local history and clear-data behavior; Hatch Match cue comparison, disconfirming evidence, insufficient-cue and privacy states; System Compatibility compatible, conditional, conflict, and unknown results; field source and freshness panels; offline/recovery; print/export; and onward routes at desktop, tablet, mobile, keyboard, screen reader, reduced motion, forced colors, and print.

## Current evidence and residual work

Presentation Planner with Smart Mode and Hatch Match pass isolated installed-preview validation. Production acceptance remains open for exact live package and data parity, representative rights-cleared and location-safe media, managed restoration, live privacy/consent/permission/monitoring readback, Hatch Match maintenance operations, current official-source ownership, and replacement of orientation-only live application pages.
