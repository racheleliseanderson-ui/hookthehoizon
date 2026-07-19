# Hook the Horizon Workflow Operator Runbook

## Purpose

This runbook explains how the owner previews, approves, generates, monitors, and closes Hook the Horizon workflow tasks.

The workflow is intentionally manual at the approval boundary. Preview mode is non-writing. Generate mode requires an explicit phrase and creates only missing task IDs.

## Prerequisite

The workflow file must be present on the repository default branch. Until pull request #62 is merged, the workflow will not appear as a runnable workflow under the normal Actions interface for `main`.

## One-time repository setup

1. Open the Hook the Horizon repository.
2. Open **Settings**.
3. Select **Actions > General**.
4. Under **Actions permissions**, allow actions and reusable workflows required by the repository.
5. Under **Workflow permissions**, select **Read and write permissions** or otherwise ensure the workflow can write Issues.
6. Save the settings.
7. Confirm Issues are enabled under **Settings > General > Features**.

The workflow requests only:

- `contents: read`
- `issues: write`

It does not request deployment, package, secret, WordPress, or repository-content write permission.

## Merge the workflow package

1. Open pull request #62: **Add complete Hook the Horizon ecosystem integration and workflow guard**.
2. Review the four governed additions:
   - ecosystem integration contract
   - integration guard
   - workflow control
   - this operator runbook
3. Confirm required checks pass.
4. Merge the pull request into `main`.

Merging makes the manual workflow available from the Actions tab. It does not generate tasks by itself and does not modify WordPress.

## Preview the task package

1. Open the repository.
2. Select **Actions**.
3. Select **Hook the Horizon Workflow Control** from the left navigation.
4. Select **Run workflow**.
5. Choose branch `main`.
6. Set **mode** to `preview`.
7. Choose a priority.
8. Enter the target cycle or date.
9. Leave the approval phrase blank.
10. Select the green **Run workflow** button.
11. Open the new run and review **Display proposed work items** and the run summary.

Preview mode creates no issues and is the required first step when the task package or priority is uncertain.

## Approve and generate tasks

After reviewing preview output:

1. Return to **Actions > Hook the Horizon Workflow Control**.
2. Select **Run workflow**.
3. Choose branch `main`.
4. Set **mode** to `generate`.
5. Choose the approved priority.
6. Enter the approved target cycle or date.
7. In **approval_phrase**, enter exactly:

   `APPROVE HOOK WORK`

8. Select **Run workflow**.
9. Open the run and confirm `validate-request` passed.
10. Confirm `generate-issues` passed.
11. Open the repository **Issues** tab and verify the generated `HTH-WF-001` through `HTH-WF-006` records.

The workflow is idempotent by task ID. Re-running it skips an issue when that task ID already exists.

## Generated task set

- `HTH-WF-001` — Evidence, preservation, and product inventory
- `HTH-WF-002` — Monthly source freshness and safety review
- `HTH-WF-003` — Cross-system workflow parity
- `HTH-WF-004` — Mobile, offline, and field-use assessment
- `HTH-WF-005` — Application and evidence ownership reconciliation
- `HTH-WF-006` — Workflow acceptance and runtime evidence

## Approval model

### Owner approval required

Owner approval is required before:

- generating the initial task package;
- materially changing task scope or priority;
- production activation or publication;
- exact or sensitive location handling;
- unsupported regulation, safety, legal, medical, or professional claims;
- credentials, payments, contracts, sponsorships, or destructive actions.

### Routine work may proceed

Once tasks are generated, ordinary reversible work may proceed under the ecosystem autonomy standard when checks pass. This includes research, documentation, branches, commits, tests, previews, evidence updates, and bounded corrections.

### Completion approval

A task is not complete merely because code or documentation exists. Close it only after the issue contains:

- governing source links;
- work performed;
- tests or validation evidence;
- preservation impact;
- open exceptions;
- runtime or publication status;
- next review date;
- rollback or recovery path where applicable.

## Notion operating mirror

The Notion Ecosystem Research Work Queue is the operating status mirror. It should show ownership, priority, status, due date, evidence confidence, review trigger, and source URL.

GitHub remains the implementation and technical evidence system. Google Drive remains the governing substantial-document authority. Notion does not replace either source.

## n8n handoff

The generated GitHub issues are the recommended trigger records for n8n.

A bounded n8n workflow should:

1. detect new issues whose titles contain `[HTH-WF-`;
2. parse the task ID, priority, title, and target cycle;
3. create or update the corresponding Notion work-queue record;
4. write the GitHub issue URL into Notion;
5. avoid creating duplicates by using the task ID as the external key;
6. notify only when a task is blocked, overdue, requires owner approval, or reaches an exception threshold;
7. never publish to WordPress or expose sensitive location information.

Until that n8n workflow is connected and validated, GitHub issue generation and Notion updates remain separate controlled steps.

## Troubleshooting

### Workflow is not visible

The workflow has not yet been merged into the default branch, Actions are disabled, or the current account cannot run workflows.

### Generate job fails at approval

Enter the approval phrase exactly: `APPROVE HOOK WORK`.

### Issues are not created

Confirm repository workflow permissions permit issue writes and that Issues are enabled.

### Some task IDs are skipped

The workflow found an existing issue containing that task ID. This is expected duplicate protection.

### Workflow passes but no WordPress work occurs

This workflow generates and governs tasks only. It intentionally does not publish, deploy, activate, or modify WordPress.

## Current approval sequence

`Review PR #62` → `Merge to main` → `Run preview` → `Review proposed tasks` → `Run generate with APPROVE HOOK WORK` → `Confirm issues` → `Assign owners and execute` → `Attach evidence` → `Close or schedule next review`
