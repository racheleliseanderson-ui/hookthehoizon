# Hook the Horizon Automation Setup

## Current automation boundary

The repository now contains executable GitHub Actions for:

1. validating all canonical Markdown articles;
2. creating missing Google Docs mirrors for articles marked `complete_for_editorial_mirror`;
3. preparing a WordPress draft batch as a dry run;
4. creating 5–10 WordPress drafts and immediately verifying each remains `draft`.

The workflow never publishes or schedules a post.

## Required GitHub environments

Create two protected environments in repository settings:

- `editorial-mirror`
- `wordpress-draft-staging`

Recommended protection: require manual approval before either environment can run. This keeps external writes human-authorized even when validation is automated.

## Required secrets

### editorial-mirror

- `GOOGLE_SERVICE_ACCOUNT_JSON`: complete Google service-account JSON credential.
- `GOOGLE_DRIVE_FOLDER_ID`: destination folder ID for article mirrors.

Share the destination Drive folder with the service-account email as Editor. Enable the Google Drive API and Google Docs API in the service account's Google Cloud project.

### wordpress-draft-staging

- `WORDPRESS_BASE_URL`: site origin, such as `https://hookthehorizon.blog`.
- `WORDPRESS_USERNAME`: WordPress account used for draft creation.
- `WORDPRESS_APPLICATION_PASSWORD`: application password created for that account.

Use an account restricted to creating and editing posts. Do not grant plugin, theme, user, or site-administration access solely for this workflow.

## Running the workflow

Open **Actions → Industrial Content Pipeline → Run workflow**.

Available actions:

- `validate`: validates front matter, required article sections, word count, placeholder language, duplicate slugs, and Draft-only metadata.
- `drive-mirror`: validates first, then creates missing Google Docs for eligible articles.
- `wordpress-dry-run`: validates first and generates the exact proposed 5–10 article import plan without writing to WordPress.
- `wordpress-create-drafts`: validates first, creates the selected batch, and reads every post back to verify `status=draft`.

The default WordPress batch size is 8. Values below 5 or above 10 are rejected.

## Article status gates

- Drive mirroring accepts only `complete_for_editorial_mirror`.
- WordPress accepts only `wordpress_ready`.
- A WordPress execution with fewer than five ready articles stops without creating anything.
- Any post that cannot be read back as Draft stops the workflow.

## Files

- `.github/workflows/industrial-content-pipeline.yml`
- `scripts/content_pipeline/validate_articles.py`
- `scripts/content_pipeline/mirror_to_drive.py`
- `scripts/content_pipeline/push_wordpress_drafts.py`
- `scripts/content_pipeline/requirements.txt`

## Deliberately not automated yet

- Generating article topics or prose without an approved batch manifest.
- Pulling editorial changes from Google Docs back into GitHub.
- Updating Notion records.
- Publishing or scheduling WordPress posts.

Those functions require additional reconciliation rules and credentials. They should be added only after the validation, Drive mirror, and Draft-only WordPress stages pass a controlled test batch.
