# QA-005 Automation Baseline — 2026-08-24

Ticket: `QA-005-AUTOMATION-001`

## Summary

The current `origin/main` baseline was clean at `36ad7ed`, but the worktree was
detached and `docs/development/IMPLEMENTATION_STATUS.md` still named the already
merged PCE-005 branch as current. A dedicated
`codex/qa-005-automation-001` branch was created from the current remote baseline.

`verify:cnt-003` produced a false navigation failure because it expected all
public route strings in `components/managed-content-page.tsx`. The current
architecture renders secondary-page navigation from the localized `homeCopy`
source in `lib/i18n.ts`, while Home uses `components/content-managed-home.tsx`
and exposes Verify as a separate utility action.

The verifier now checks:

- the current managed-page integration with shared localized navigation;
- all required EN, UA, and CZ navigation destinations;
- Home navigation and its separate Verify utility action;
- the Release 1 prohibition on News in both active navigation sources;
- the existing CNT-003 migrations, database tests, routes, and Home payload
  invariants.

No runtime application or business-logic behavior changed.

## Files Changed

- `scripts/verify-cnt-003.mjs`
- `docs/development/IMPLEMENTATION_STATUS.md`
- `docs/planning/PROJECT_MASTER_CHECKLIST.md`
- `docs/README.md`
- `docs/qa/QA_005_AUTOMATION_BASELINE_2026-08-24.md`

## Database Objects

None. No migration, remote database, Storage, or environment configuration was
changed.

## Tests / Verification

Passed on 2026-08-24:

- `npm run verify:cnt-003`;
- all 63 non-live `verify:*` package scripts: 63 passed, 0 failed;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build` with page-data generation completed successfully (`45/45`);
- `git diff --check`.

Live scripts, browser acceptance, remote Supabase mutation checks, and the full
Docker-dependent pgTAP suite were not rerun because this ticket changes only a
static verifier and status documentation.

## Security Notes

The ticket does not change authentication, authorization, RLS, credential data,
public verification, secrets, external services, or production configuration.
The updated verifier preserves the explicit Release 1 check that News is absent
from public navigation.

## Deviations / Open Questions

- `npm ci` reported deprecation warnings in transitive dependencies; dependency
  remediation is outside this ticket and should be handled in a separate scoped
  maintenance ticket.
- The full pgTAP run still requires a compatible Docker/PostgreSQL test runner.

## Next Dependency

Proceed with the next single QA-005 launch-hardening ticket only after review of
this automation baseline. The recommended next ticket is the scoped SEO
publication layer: robots, sitemap, canonical/hreflang, and required redirects.
