# Hook the Horizon Theme Directory Authority

**Status:** ACTIVE  
**Effective:** 2026-07-20

## Canonical source

`wordpress-theme/` is the sole authoritative deployable Hook the Horizon theme source.

`theme/` is a retained legacy/source-history snapshot. It is not a release source, synchronization target, runtime-parity signal, or valid destination for new production work.

This resolves the duplicate directory ambiguity without deleting recoverable history.

## Evidence

- Root `README.md` identifies `wordpress-theme/` as the authoritative deployable theme and `theme/` as legacy.
- `wordpress-theme/style.css` identifies version `0.3.0-remediation` and contains the governed semantic tokens, responsive layouts, visible focus treatment, reduced-motion behavior, forced-colors handling, and print behavior.
- `theme/style.css` identifies version `0.1.0` and is a materially smaller legacy implementation.
- Connected WordPress runtime inspection on 2026-07-20 reports active theme `Hook the Horizon Preliminary Editorial System`, stylesheet `hook-the-horizon`, version `0.2.0`.

## Runtime parity finding

The active WordPress runtime version does not match the canonical repository theme version. This is a material parity dependency, not permission to activate or deploy the repository theme.

Required before any readiness claim:

1. identify the exact installed runtime artifact and checksum;
2. compare it with the canonical `wordpress-theme/` build artifact;
3. run rendered desktop/mobile, keyboard, focus, contrast, tap-target, application-state, and critical-route QA against the exact installed candidate;
4. preserve rollback evidence;
5. obtain any authorization required for activation or production promotion.

## Operating rule

New theme work belongs only in `wordpress-theme/`. Any reference that identifies `theme/` as deployable or current must be corrected to this authority. Live WordPress remains runtime truth and is never inferred from repository labels alone.
