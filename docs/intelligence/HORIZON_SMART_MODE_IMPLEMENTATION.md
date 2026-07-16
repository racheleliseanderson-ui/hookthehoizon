# Hook the Horizon — Smart Mode and Engagement Implementation Map

**Status:** Active implementation record  
**Source input:** 20 marketability, personalization, retention, PWA, community, and future-technology ideas supplied for Hook the Horizon.

## Implemented now

### 1. Explainable personalization engine

Implemented as `HTH-SM-001 Horizon Smart Mode`.

- Uses broad conditions, profile preferences, owned inventory, System Compatibility state, source state, evidence state, and bounded personal history.
- Returns best-supported, contrast, and fallback plans.
- Shows factor-level adjustments.
- Caps outcome-history influence so raw popularity or reporting volume cannot control rank.
- Runs locally without an LLM, account, exact location, purchase, or external API.

This replaces the proposed opaque “Today’s Perfect Rig” probability model with an evidence-aware, no-guarantee planning system.

### 2. Local knowledge graph

Implemented shared nodes and edges connecting presentations, conditions, species, sources, equipment, outcomes, and later insects or devices.

The graph is local and versioned. User submissions do not automatically become universal claims. New records must retain evidence state, source IDs, privacy classification, and conflicts.

### 3. Private feedback and mastery loop

Implemented local recommendation history, positive, negative, and inconclusive outcomes, variables tested, and milestone summaries.

The system does not claim an invented percentage improvement. It reports observable counts and controlled experiments.

### 4. Public-safe sharing

Implemented a downloadable branded SVG card containing only the public-safe presentation label, role, action, depth, cadence, publication name, and an explicit no-location statement.

Profile, inventory, precise location, waterbody, private notes, and outcomes are excluded.

### 5. Offline-first PWA preview

Implemented a bounded manifest and service worker for the Presentation Planner preview.

- Caches only the application shell and deterministic modules.
- Does not intercept the WordPress site.
- Keeps profile, inventory, history, and outcomes on the device.
- Supports print and offline planning.

### 6. Unified hub pathways

Implemented Living Fly Bench and Presentation Lab WordPress block patterns. The shared knowledge graph provides the technical foundation for future cross-hub routing among System Compatibility, Hatch Match, Presentation Planner, Rig Signal, and Honey Hole Intelligence.

### 7. Local intelligence brief

Implemented an on-device brief summarizing controlled tests, latest result, and recommendation-history count. It creates a return path without requiring email, SMS, push, or account infrastructure.

### 8. Proportional experimentation evidence

Implemented bounded personal-history weighting and explicit negative or inconclusive outcomes. A universal A/B-testing platform is not required for the first useful increment.

## Prepared but not activated

### External data adapters

USGS, NOAA, iNaturalist, regulation, weather, and observation sources may be added under the active Tier 2 envelope after each adapter implements:

- source identity and precedence;
- timeout and bounded retry;
- cache and invalidation;
- freshness and stale labels;
- outage and partial-response behavior;
- schema or endpoint migration;
- exact-location redaction;
- disable switch and rollback.

No external API is required for Smart Mode to remain useful.

### Cross-device synchronization

The contracts allow future approved-server persistence, but the current preview deliberately avoids Firebase, Supabase, or account coupling. Cross-device sync should be added only when repeat-use evidence justifies account, privacy, support, and maintenance costs.

### AI-generated explanations

An LLM may later turn a deterministic result into clearer prose. It may not change scores, evidence, source state, or privacy classification. The deterministic explanation already works without model cost or network dependence.

### Notifications

Consent-based briefs may later use email, web push, or reminders. They require a specific reader job, preference controls, deep-link destination, quiet hours, and unsubscribe or disable behavior. Push is not used merely to create artificial habit.

### Device imports

Rig Signal now has a sensor-agnostic event contract. Manufacturer-specific imports remain optional and must not imply validated bite detection, species identification, fight classification, or improved catch outcomes without controlled evidence.

## Rejected or materially reframed

### Precise “next 48-hour bite forecast”

Rejected as a product promise. It creates false precision, encourages location exposure, and is difficult to support across species, waters, access conditions, and changing data quality. The approved alternative is a factor-explained field-test plan with visible uncertainty.

### Global heatmaps and exact-location popularity engines

Rejected. They conflict with private-by-default operation, conservation controls, and sensitive-water protection.

### Automatic user reports changing universal recommendations

Rejected. User observations may update private history or enter a moderated evidence queue. They cannot silently modify biological or universal recommendation records.

### Gamified catch leaderboards

Rejected as a default retention mechanism. They can reward pressure, location disclosure, trophy distortion, and reporting bias. Mastery is measured through controlled learning, observation quality, conservation-aware behavior, and useful contributions.

### Unqualified “98% confidence” display

Rejected. Confidence bands remain evidence- and source-dependent. The interface does not manufacture probability precision.

### Automatic affiliate weighting

Rejected from recommendation logic. Affiliate value, sponsorship, popularity, and commercial relationship do not alter fit ranking.

### WebGPU, AR glasses, and camera gestures as near-term requirements

Deferred. They are not necessary to validate the reader job and would increase maintenance, device variance, privacy complexity, and delivery risk before the core workflow proves repeat value.

## Next autonomous increments

1. Run the proportional changed-path checks and repair any failures.
2. Mark the implementation PR ready when checks pass.
3. Merge source changes automatically if no Tier 3 exception exists.
4. Build the first small `approved_preview` Hatch Match seed set through AI source review.
5. Add a source-state adapter harness before any live external source.
6. Connect the preview application to the canonical WordPress theme or content plugin through a reversible route after source merge.
