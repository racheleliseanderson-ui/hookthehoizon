# Hook the Horizon Autonomous Workflow Runbook

## Operating principle

Hook the Horizon uses a self-approving, AI-overseen workflow for routine governed work. Research, inventory, documentation, task generation, prioritization, source checks, branches, commits, tests, previews, evidence updates, retries, bounded corrections, and cross-system synchronization proceed automatically when policy checks pass.

Human review is not a normal stage. It is reserved for defined A3 exceptions.

## How work begins

The orchestrator runs automatically when:

- governed files change on `main`;
- the daily scheduled review runs;
- an authorized operator manually dispatches an extra cycle.

The workflow automatically creates only missing governed task IDs and retains existing records. No approval phrase is required.

## Canonical task set

- `HTH-WF-001` — Evidence, preservation, and product inventory
- `HTH-WF-002` — Source freshness, regulation, access, safety, and conservation review
- `HTH-WF-003` — GitHub, Drive, Notion, n8n, and WordPress parity
- `HTH-WF-004` — Mobile, offline, and field-use implementation
- `HTH-WF-005` — Application, route, evaluator, and evidence ownership
- `HTH-WF-006` — Workflow acceptance and runtime evidence

Stable task IDs are the duplicate-control keys across GitHub, Notion, Drive records, and n8n.

## Self-approval boundary

The AI may approve and execute routine reversible work when:

- the work is within an existing governed scope;
- evidence and source state are recorded;
- changes can be tested or previewed;
- rollback or recovery is available;
- no protected identity, sensitive-location, credential, payment, contract, destructive, or unsupported high-risk claim is involved.

A failed test triggers diagnosis, repair, and retry. It does not automatically create a human approval request.

## A3 exception boundary

Pause only the affected action and create an exception record when work involves:

- contributor identity, image, voice, exact age, routine, or minor-safety exposure;
- exact or sensitive fishing-location disclosure or protected conservation data;
- unsupported regulation, safety, medical, legal, or professional claims;
- credentials, account authority, protected data, or privacy-policy changes;
- contracts, sponsorships, advertising, payments, or spending outside an approved envelope;
- destructive, irreversible, domain/DNS ownership, or unrecoverable production actions;
- materially unresolved risk that cannot be reduced through research, testing, staging, or rollback.

Unrelated work continues while an exception is pending.

## Execution loop

1. Detect new or changed governed work.
2. Classify publication, reader job, workstream, authority state, risk tier, and dependencies.
3. Create or refresh the stable GitHub task record.
4. Synchronize the operating mirror in Notion.
5. Gather or refresh evidence from governing sources.
6. Produce the smallest useful reversible implementation.
7. Run proportional tests and accessibility checks.
8. Repair and retry ordinary failures automatically.
9. Update evidence, preservation impact, runtime state, and next review date.
10. Close completed work or retain it for the next scheduled review.
11. Route only A3 exceptions for owner decision.

## Systems of record

- Google Drive: governing standards, substantial research, evidence files, and controlled archives.
- GitHub: implementation, issues, schemas, tests, CI, release artifacts, and technical evidence.
- Notion: operating status, ownership, due dates, exception visibility, and review queues.
- n8n: orchestration, synchronization, scheduled checks, notifications, and exception routing.
- WordPress: runtime publication state; never inferred from repository state alone.

## Required n8n behavior

The n8n workflow should:

- detect new or updated `[HTH-WF-` GitHub issues;
- use the stable task ID as the external deduplication key;
- create or update the corresponding Notion record;
- synchronize priority, status, source URL, evidence confidence, due cycle, and review trigger;
- schedule source-freshness and overdue checks;
- return ordinary failures to the AI repair queue;
- notify the owner only for A3 exceptions, materially blocked work, or unrecoverable automation failure;
- never publish to WordPress or expose sensitive-location information without the separate governed release conditions.

## Completion rule

A task can be closed automatically when it contains:

- governing source links and authority state;
- completed work and validation evidence;
- preservation impact;
- evidence confidence;
- runtime or publication status;
- open exceptions, if any;
- next review date;
- rollback or recovery path where applicable.

## Implementation compression

AI oversight should reduce elapsed time by removing approval queues, duplicate transcription, serial handoffs, repeated inventory work, and manual retry cycles. The largest gains come from parallel research, continuous validation, stable identifiers, automated source synchronization, and exception-only human involvement.

The system must not claim a fixed completion date before repository state, connector access, WordPress parity, evidence gaps, and A3 exceptions are measured. Cycle-time reduction is tracked from actual workflow data rather than assumed.
