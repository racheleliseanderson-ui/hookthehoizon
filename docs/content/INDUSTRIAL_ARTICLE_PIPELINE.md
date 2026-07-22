# Hook the Horizon Industrial Article Pipeline

Status: Active operating standard
Effective: 2026-07-16

## Operating decision

Hook the Horizon will no longer create a large undifferentiated group of lightweight WordPress drafts. Production runs will create 25–50 complete, source-ready articles as repository-controlled Markdown, mirror them into Google Drive for editorial work, and import them into WordPress in batches of 5–10. Every WordPress post remains Draft until a separate publication decision is made.

## Source-of-truth hierarchy

1. GitHub Markdown is the canonical article source.
2. Google Drive is the collaborative editorial mirror.
3. Notion is the production-control and status layer.
4. WordPress is the draft staging destination, not the authoring authority.

Edits made in Drive or WordPress must be reconciled back into the canonical GitHub Markdown before an article can be considered release-ready.

## Production unit

A production run contains 25–50 complete articles. Each article must include:

- front matter with stable article ID, title, slug, pillar, article family, status, batch ID, source state, evidence tier, last reviewed date, and WordPress ID when assigned;
- complete reader-facing body, not an outline or placeholder draft;
- explicit reader decision or problem;
- original analysis and useful non-purchase path;
- source notes and claim inventory;
- limitations, uncertainty, and alternatives;
- visual and diagram requirements;
- internal-link targets;
- privacy, safety, regulation, conservation, and disclosure flags where relevant;
- editorial QA checklist.

## Repository layout

```text
content/
  articles/
    <pillar>/
      <article-id>--<slug>.md
  batches/
    <batch-id>/
      manifest.yml
      drive-mirror.csv
      wordpress-import.csv
      qa-report.md
  templates/
    article-template.md
    batch-manifest-template.yml
```

## Workflow

### 1. Plan

Create a batch manifest with 25–50 approved article records. Check duplication, pillar balance, search intent, reader need, evidence availability, and cross-publication routing.

### 2. Produce complete Markdown

Write and QA every article in GitHub. A file cannot enter the Drive mirror until its status is `complete_for_editorial_mirror`.

### 3. Mirror to Google Drive

Create one editable Google Doc per article or a clearly indexed batch folder. Preserve the stable article ID and canonical GitHub path in the document header. Drive is used for comments, copyediting, and stakeholder review.

### 4. Reconcile edits

Approved Drive edits are applied to the GitHub Markdown. GitHub remains canonical. The manifest records the reconciliation commit SHA.

### 5. Push to WordPress

Import only articles marked `wordpress_ready`. Push in batches of 5–10. Each imported record must preserve title, slug, category, body, excerpt, metadata, and canonical article ID. Set `status=draft` explicitly on every request.

### 6. Verify each WordPress batch

After every 5–10 post push, verify:

- exact number created;
- every status is Draft;
- no duplicate slug or title;
- category and metadata mapping;
- body completeness;
- no accidental scheduling, publishing, Jetpack distribution, or newsletter delivery;
- WordPress IDs written back to the batch manifest and article front matter.

### 7. Stop on failure

A partial or malformed batch stops the pipeline. Correct and reconcile before the next batch. Do not compensate by pushing a larger subsequent batch.

## Required statuses

- planned
- researching
- drafting
- complete_for_editorial_mirror
- drive_editing
- reconciliation_required
- wordpress_ready
- wordpress_draft
- release_review
- published
- held

Only `wordpress_ready` may be sent to WordPress. The import operation changes it to `wordpress_draft` after verification.

## Batch controls

- Minimum WordPress batch: 5
- Maximum WordPress batch: 10
- Default WordPress batch: 8
- Maximum production run: 50 complete articles
- No automatic publish or schedule action
- No WordPress status other than Draft during pipeline import
- No exact/private location data in public article files
- No unsupported current regulation, safety, product, access, price, or availability claims

## Completion definition

A run is complete only when all intended Markdown files exist in GitHub, Drive mirrors exist, Notion records match the manifest, WordPress batches have been verified, and every imported post remains Draft.