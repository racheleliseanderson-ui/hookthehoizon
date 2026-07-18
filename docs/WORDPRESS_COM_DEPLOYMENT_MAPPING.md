# Hook the Horizon WordPress.com deployment mapping

Status: Repository workflow prepared; WordPress.com connection pending owner-side confirmation.

## Site package

- Canonical site: `https://hookthehorizon.blog`
- Repository: `racheleliseanderson-ui/hookthehorizon`
- Branch: `main`
- Workflow: `.github/workflows/wpcom-site-package.yml`
- WordPress.com destination: `/wp-content`
- Automatic deployments: `off`

The `wpcom` artifact contains:

- `themes/hook-the-horizon/` from `wordpress-theme/`
- `plugins/hook-the-horizon-content/` from `wordpress-plugin/hook-content/`
- `plugins/honey-hole-condition-route/` from `wordpress-plugin/honey-hole-condition-route/`

Honey Hole Intelligence and Hook applications remain under Hook ownership and are not mapped to another publication repository.

## Shared dependencies

- Rachel Editorial Core is deployed separately from `racheleliseanderson-ui/Master-of-The-Universe-` to `/wp-content/plugins/rachel-editorial-core`.
- `racheleliseanderson-ui/intelligence-core` remains a declared shared dependency rather than a publication-theme deployment.

## Control boundary

Creating this workflow does not deploy, install, activate, publish, or change the live site. The WordPress.com connection must remain manual for production, and the first deployment requires a current backup, exact artifact review, immediate verification, and rollback readiness.
