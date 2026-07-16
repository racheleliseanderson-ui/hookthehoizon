# Hook the Horizon three-hub release gate

Status: active draft gate  
Scope: Hatch Match, Presentation Planner, Rig Signal, shared contracts, and external data adapters.

## Current authorized order

1. Shared contracts, vocabularies, source and claim ledgers, privacy sanitizer, and source-state utilities.
2. Correct evaluator defects and expand complete, incomplete, stale, conflicting, negative, mismatch, and location-leakage fixtures.
3. Complete Presentation Planner as the first browser vertical slice.
4. Advance Hatch Match only with reviewed biological seed records and an explicit review standard.
5. Build The Living Fly Bench and Presentation Lab editorial hub patterns in parallel.
6. Advance Rig Signal after device-profile and device-event contracts are stable.
7. Add external APIs only after adapter-state controls exist.
8. Run application-specific preview QA before merge or WordPress integration.

## External data adapter gate

No external source adapter may be added until it implements and tests:

- canonical source ID and contract version;
- source-reviewed timestamp and freshness policy;
- `fresh`, `aging`, `stale`, `unknown`, `outage`, `unavailable`, and `migrating` states;
- cache key, cache duration, and cache invalidation behavior;
- timeout, retry, and backoff limits;
- last-known-good behavior and visible stale labeling;
- outage and partial-response behavior;
- schema-change and endpoint-migration handling;
- official-source precedence and conflict handling;
- analytics redaction and exact-location rejection;
- print, URL, share, error, and log payload sanitization;
- adapter disable switch and rollback instructions.

An outage must never silently become a fresh recommendation. A cached record must show its source date and state. No adapter may depend on a retiring endpoint without a documented migration and disable path.

## Presentation Planner preview QA

The vertical slice must be tested before PR #25 is considered for merge.

### Functional

- Required fields, invalid fields, empty inventory, mismatch, stale, conflicting, and no-result states.
- Best-supported, contrast, and fallback roles are distinct and explained.
- Method, water type, trip goal, structure, depth, and conditions affect the result.
- System Compatibility mismatch is a hard exclusion.
- No-purchase route and single-variable experiment are present.
- Local save, restore, clear, print, and safe-copy behavior work.

### Privacy and security

- No exact-location field exists in the interface.
- Nested coordinates, map URLs, coordinate strings, private-water names, and access points are rejected or redacted.
- Local storage contains only broad selections and inventory IDs.
- Print, clipboard, errors, URLs, analytics, and logs contain no protected location or private notes.
- Unknown privacy classes fail closed.

### Accessibility and mobile

- Keyboard-only completion.
- Visible focus.
- Programmatic labels and useful error messages.
- Screen-reader result announcement.
- 320px, 375px, and 768px completion.
- Reduced-motion behavior.
- 44px minimum interactive targets.
- Print layout remains readable.

### Performance and recovery

- No framework or external runtime dependency for the preview.
- No network requirement for the deterministic flow.
- Clear recovery after invalid input or corrupted local storage.
- Preview remains usable with JavaScript module errors clearly surfaced during QA.

## Hatch Match preview gate

No public biological seed is eligible until the biological review standard is complete for that record. Synthetic fixtures may validate logic but may not appear as public advice.

## Rig Signal preview gate

Integration readiness, maturity, capability credibility, field accuracy, and recommendation suitability remain separate. Unknown privacy classes and prohibited location fields fail closed. Public event previews include schema version, source, unit, quality, calibration state, privacy classification, and `locationIncluded: false`.

## Merge and WordPress boundary

Passing deterministic CI is necessary but not sufficient. PR #25 remains draft until:

- required contracts and ledgers exist;
- shared and application tests pass;
- Presentation Planner preview QA evidence is recorded;
- Hatch Match biological records remain blocked or reviewed;
- Rig Signal contract defects are corrected;
- external APIs remain absent or pass the adapter gate;
- the Drive QA Matrix and implementation index are updated;
- human review authorizes merge.

No live WordPress page, route, recommendation, telemetry intake, account system, or public exact-location feature is authorized by this document.
