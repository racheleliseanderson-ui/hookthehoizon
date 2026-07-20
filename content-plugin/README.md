# Retired Hook Content Plugin Source Path

This directory is retained only as a historical locator.

The executable legacy entry point formerly stored at `content-plugin/hook-content.php` was version 0.1.2 and duplicated the active plugin identity, constants, post-type registrations, taxonomy registration, and rewrite lifecycle owned by the canonical plugin.

## Canonical release source

`wordpress-plugin/hook-content/hook-content.php`

Current governed source version: `0.3.1`

## Rules

- Do not add an executable WordPress plugin bootstrap to this directory.
- Do not package this directory as a plugin.
- Do not register `Hook the Horizon Content`, `HTH_CONTENT_VERSION`, `hth_field_report`, `hth_gear_verdict`, `hth_water_type`, application routes, shortcodes, or rewrite lifecycle handlers from this directory.
- Preserve history through Git rather than by retaining a second executable provider.
- Runtime replacement of the currently installed 0.2.2 package remains a separate readiness-gated action. This source correction does not deploy, activate, deactivate, uninstall, or modify WordPress.
