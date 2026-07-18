# Hook the Horizon Industrial Article Pipeline

Status: Active proposed standard
Canonical site: https://hookthehorizon.blog
Repository: `racheleliseanderson-ui/hookthehorizon`
Article prefix: `HTH-CB-`

## Operating model

- Produce 25–50 complete articles per cohort.
- Keep one canonical Markdown file per article in `content/articles/`.
- Mirror cohorts to Google Drive for editorial review and track them in Notion.
- Reconcile accepted Drive edits into GitHub before transfer.
- Transfer only 5–10 `transfer-ready` articles at a time.
- WordPress operations are draft-only; publishing, scheduling, email, and social distribution are prohibited.

## Required gates

Editorial completeness, brand voice, evidence, regulations, conservation and sensitive-location review, field-safety review, accessibility, visual brief, internal links, SEO, disclosure, and WordPress verification. A gate may be `not-applicable` but may not be omitted.

## States

`planned`, `drafting`, `github-draft`, `drive-review`, `revision-required`, `transfer-ready`, `wordpress-draft`, `publication-qa`, `approved-for-scheduling`, `published`, `retired`.
