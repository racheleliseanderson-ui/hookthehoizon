# Hook the Horizon Exact Artifact QA — 2026-07-20

Validated WordPress release artifact: workflow run `29746836226`.

Plugin package: `hook-the-horizon-content-0.3.1.zip`  
SHA-256: `0eeaa5a601a17c7ec861deccb514c21b2e1ec455940ba00c7920101c57ca1624`

The package contains the corrected Presentation Planner primary button rule:

```css
button.primary { background: var(--signal); color: var(--depth); }
```

Compatibility browser gate: workflow run `29743058848`, conclusion `success`.

Browser matrix:

- Compatibility Builder desktop 1440 x 1000
- Compatibility Builder mobile 390 x 844
- Compatibility Result desktop 1440 x 1000
- Compatibility Result mobile 390 x 844

Results:

- browser-gate summary: `[]`
- axe violations: 0 in all four runs
- keyboard focus: solid 3px outline in all four runs
- no recorded page or iframe horizontal-overflow failure
- reduced-motion mode exercised
- print PDF generated for both routes
- Lighthouse performance: 0.96
- Lighthouse accessibility: 1.00

The disposable WordPress job also completed successfully, including package activation, seeded routes, lifecycle checks, privacy checks, and rollback-surface checks.

The deterministic compatibility matrix remains passing in commit `cf63b50ca4c064d04d9d32e1edf0fc91cc52cd65`.

The live WordPress site still reports Hook Content `0.2.2`; exact live `0.3.1` propagation is not claimed. The active theme remains `hook-the-horizon-canonical-parity` `0.3.0-remediation`.