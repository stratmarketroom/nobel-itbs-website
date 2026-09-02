# ADM-E2E-ROLE-MATRIX Browser QA

Date: 2026-09-01

Branch: `codex/adm-e2e-role-matrix`

Status: merged through PR #84 as `e9f1779`; 30/30 local browser scenarios passed

## Summary

The admin shell now has a repeatable Playwright browser matrix for the four
Release 1 roles on desktop and mobile Chromium. The suite checks the exact
role-aware navigation, direct access to every allowed admin route, forbidden
states, MFA/AAL1 behavior, signed-out behavior, active navigation state, and
horizontal overflow.

The tests do not add a production login bypass. They seed an expiring fake
Supabase session only inside the isolated browser context and intercept only
that test page's `/api/v1/admin/*` calls with privacy-safe empty fixtures. This
makes the UI authorization contract deterministic without storing passwords,
TOTP secrets, access tokens, or hosted test-account data.

## Covered Role Contract

| Role | Allowed shell modules | AAL1 result |
| --- | --- | --- |
| Owner | all 15 admin routes | MFA required; protected module API is not loaded |
| Super Admin | all 15 admin routes | MFA required; protected module API is not loaded |
| Content Manager | Dashboard plus six content/programme/partner/expert routes | Allowed when the profile does not independently require MFA |
| Credential Manager | Dashboard plus Contact Submissions, Learners, Credentials, and Email Templates | MFA required; protected module API is not loaded |

The Content Manager and Credential Manager suites also navigate directly to
every route outside their role scope. Each route renders `Access not available`,
states that protected data was not loaded, and makes only the role-context
request to `/api/v1/admin/me`.

## Files Changed

- `playwright.config.ts` — desktop/mobile Chromium projects and isolated local web server configuration;
- `tests/e2e/admin-role-matrix.spec.ts` — role, route, MFA, signed-out, responsive-navigation, and forbidden-state coverage;
- `scripts/verify-adm-e2e-role-matrix.mjs` — static ticket contract and secret-safety verifier;
- `package.json`, `package-lock.json` — Playwright dependency and focused commands;
- `.gitignore` — generated Playwright reports/results excluded;
- documentation index, project checklist, implementation status, and this QA record.

## Database Objects Changed

None. No migration, schema, RLS policy, grant, function, trigger, Storage object,
or hosted data row changed.

## Tests / Verification

Passed:

- `npm run verify:adm-e2e-role-matrix`;
- `npm run test:e2e:admin-role-matrix` — 30/30 scenarios;
- `npm run verify:admin-shell`;
- `npm run verify:auth-006`;
- `npm run verify:auth-007`;
- `npm run verify:qa-003`;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build` — 60/60 static pages generated and all dynamic admin routes compiled;
- `git diff --check`;
- desktop Chromium at 1440 × 900;
- mobile Chromium using the Pixel 7 device profile;
- all four role-specific navigation sets;
- all allowed route guards;
- all forbidden Content Manager and Credential Manager route guards;
- Owner, Super Admin, and Credential Manager AAL1 MFA-required states;
- Content Manager MFA-optional AAL1 state;
- signed-out state with zero protected admin API requests;
- active Dashboard link and no document-level horizontal overflow.

The first sandboxed build attempt could not reach Google Fonts; the same build
passed with the required network access. No source change was needed.

## Security Notes

- No real password, TOTP secret/code, Supabase access token, refresh token, or service-role key is read or committed.
- Fake browser tokens use the reserved `.invalid` email domain and exist only in an isolated Playwright page.
- The server-only value in Playwright configuration is a non-secret placeholder used solely to allow the local Next.js process to boot; intercepted browser calls never use it.
- Forbidden and unsatisfied-MFA pages prove that module-specific admin API calls do not start before the shell authorizes the route.
- Existing server authorization, MFA/AAL2 enforcement, RLS, and live QA remain the authority for backend protection; this suite adds deterministic browser-layer regression coverage and does not replace them.

## Deviations / Open Questions

The deterministic suite does not automate a real hosted TOTP challenge because
that would require handling a live account secret. Existing Owner/AAL2 and
four-role live evidence remains documented in the earlier auth/RLS QA records.

## Next Dependency

Completed. Any future change to admin role routing or MFA policy must update
both the source-of-truth specification and this matrix in the same separately
approved ticket.
