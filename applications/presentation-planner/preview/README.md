# Presentation Planner preview

This is the first complete browser vertical slice for `HTH-PP-001`.

## Run locally

Serve the repository root through any static HTTP server and open:

`/applications/presentation-planner/preview/`

The preview:

- runs entirely in the browser;
- uses the deterministic evaluator and repository seed records;
- stores only selected inventory and broad condition bands in local storage;
- requests no exact location;
- provides print and public-safe copy output;
- exposes unknown, freshness, compatibility, and no-purchase states;
- remains explicitly preview-only.

## Blocked work

Do not connect external APIs, WordPress, analytics, accounts, telemetry, or production recommendation routes until the release-gate document and application-specific QA matrix are complete.
