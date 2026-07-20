# Hook the Horizon Workflow Operator Runbook

## Current authority

This runbook follows:

- Google Drive: `MASTER — Current Operating Synchronization Contract — 2026-07-19`
- GitHub: `racheleliseanderson-ui/Master-of-The-Universe-/docs/governance/current-operating-synchronization-2026-07-19.md`
- Local pointer: `docs/governance/CURRENT_OPERATING_CONTRACT.md`

Google Drive governs human-readable authority. GitHub governs implementation and execution history. WordPress is runtime. Notion is historical archive only and is not an active mirror, approval, parity, or status dependency.

## Purpose

This runbook explains how Hook the Horizon workflow tasks are generated, executed, validated, and closed. The workflow creates missing task records and protects against duplicate task IDs. It does not itself publish to WordPress.

## Repository setup

1. Confirm GitHub Actions and Issues are enabled.
2. Permit the workflow to read repository content and write Issues.
3. Confirm the workflow package is present on the default branch.
4. Run the workflow from **Actions > Hook the Horizon Workflow Control**.

## Preview and generation

Preview mode remains available when the task package or priority is uncertain. It is not a universal gate.

Generate mode may proceed for clear, reversible task creation using the workflow's required input phrase. The phrase is an execution control for that workflow, not portfolio-wide owner approval.

The workflow is idempotent by task ID and skips existing records.

## Generated task set

- `HTH-WF-001` — Evidence, preservation, and product inventory
- `HTH-WF-002` — Monthly source freshness and safety review
- `HTH-WF-003` — Cross-system workflow reconciliation
- `HTH-WF-004` — Mobile, offline, and field-use assessment
- `HTH-WF-005` — Application and evidence ownership reconciliation
- `HTH-WF-006` — Workflow acceptance and runtime evidence

## Authorization model

Routine reversible work proceeds directly when the task is clear and applicable checks pass. This includes research, documentation, branches, commits, tests, previews, evidence updates, issue creation, bounded corrections, Google draft updates, and WordPress draft updates.

Separate approval is required only for the actual elevated action involved, including consequential publication, sensitive or exact location exposure, unsupported legal/medical/safety claims, credentials, spending, contracts, sponsorship commitments, permanent deletion of the sole recoverable source, or another irreversible action.

## Completion standard

A task is complete only when the issue records:

- governing source links;
- work performed;
- tests or observable validation evidence;
- preservation impact;
- bounded unresolved exceptions;
- runtime or publication status;
- recovery route where materially applicable.

Documentation without applied implementation is not completion.

## Automation handoff

GitHub issues are the durable automation trigger and status records. Any n8n workflow should use GitHub task IDs as external keys, avoid duplicates, and write results back to GitHub. It must not create or require a Notion record.

Automation may update reversible drafts and internal records directly. It must not expose sensitive fishing locations, invent field experience, or make unauthorized consequential live changes.

## Reader-facing firewall

Internal workflow, governance, queue, issue, PR, staging, QA, source-of-truth, prompt, model, task-ID, approval, blocker, and implementation language must remain out of reader-facing WordPress content, metadata, applications, captions, alt text, and downloads unless the reader genuinely needs the information.

## Troubleshooting

- **Workflow is not visible:** confirm the workflow is on the default branch and Actions are enabled.
- **Generate validation fails:** use the exact input required by the workflow definition.
- **Issues are not created:** confirm Issues and workflow issue-write permissions are enabled.
- **Some IDs are skipped:** an existing issue already contains the task ID; this is expected duplicate protection.
- **No WordPress work occurs:** the workflow creates task records only. WordPress draft work is performed by the relevant execution task or connected automation.
