# Hook the Horizon — WordPress Release Contract

**Status:** Infrastructure-only implementation; no live deployment authorization  
**Effective:** 2026-07-20  
**Site:** https://hookthehorizon.blog  
**Repository:** `racheleliseanderson-ui/hookthehorizon`

## Authority and branch roles

- `main` is the authoritative development and integrated staging source.
- `production` is a deployment-only `/wp-content/` mirror containing approved runtime files only.
- Feature branches contain active work and must never deploy directly.
- WordPress is the runtime destination, not the source of truth for custom theme or plugin code.

## Canonical payload

| Source | Production destination |
|---|---|
| `wordpress-theme/` | `themes/hook-the-horizon/` |
| `wordpress-plugin/hook-content/` | `plugins/hook-the-horizon-content/` |

`rachel-editorial-core` remains a separate governed component. It is not silently copied into this repository by the release lane.

## Supported release modes

### Package-only

Every qualifying pull request and `main` push runs the governed Hook release builder, validates PHP and required runtime files, checks canonical slugs and the production tree, and publishes theme/plugin ZIP files, checksums, and a release manifest as GitHub Actions artifacts.

This is the immediate path when WordPress.com GitHub Deployments and SSH are unavailable: download the exact artifact ZIP and use the WordPress plugin/theme uploader to replace the installed component.

### Production-branch promotion

Manual workflow dispatch can promote the validated payload to `production`. A rollback tag is created before replacing an existing production branch. Promotion alone is not proof that WordPress changed.

When WordPress.com GitHub Deployments becomes available, connect:

- branch: `production`
- repository path: `/`
- destination directory: `/wp-content`
- production deployment mode: manual unless a separately approved staging arrangement exists

### SSH/WP-CLI installation

Manual workflow dispatch can install the exact validated theme and plugin ZIP files through the protected `production` GitHub environment when all required variables and secrets are configured.

Required variables:

- `WP_SSH_HOST`
- `WP_SSH_PORT`
- `WP_SSH_USER`
- `WP_PATH`

Required secrets:

- `WP_SSH_PRIVATE_KEY`
- `WP_SSH_KNOWN_HOSTS`

The workflow preserves the prior activation state. It does not activate a newly introduced theme or plugin automatically.

## Prohibited actions

- Do not connect `main` directly to production WordPress.
- Do not include documentation, tests, governance records, source notes, or unfinished applications in `production`.
- Do not treat a successful package build or branch promotion as live deployment evidence.
- Do not embed credentials in repository files, workflow parameters, logs, issues, or artifacts.
- Do not deploy while a governing production-freeze or site-specific approval gate remains open.

## Required release evidence

Before any live installation, confirm:

1. Current restorable backup.
2. Correct site, plan capability, active theme, and active plugin inventory.
3. Exact artifact version and source commit.
4. Rollback method.
5. Representative public and REST routes.
6. Explicit site-specific production authorization.
