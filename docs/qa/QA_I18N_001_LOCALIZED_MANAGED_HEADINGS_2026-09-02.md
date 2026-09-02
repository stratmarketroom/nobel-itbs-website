# QA-I18N-001 Localized Managed-Page Headings

Date: 2026-09-02

Ticket: QA-I18N-001 remove mixed-language managed-page headings

Environment: local branch `codex/public-design-remediation`

## Summary

The Ukrainian and Czech About, Partnerships, and For Organisations content now
provides localized display headings and card titles instead of exposing the
English structural labels used by the CMS model. The dynamic partner directory
heading is also localized in EN, UA, and CZ.

Stable block keys and English canonical programme-area names remain unchanged.
Paragraph wording and business claims were not rewritten.

Production is unchanged until this branch is pushed, reviewed, merged, and the
new migration is deployed.

## Files Changed

- `components/managed-content-page.tsx`;
- six UA/CZ managed-page master-copy files under `docs/preparation/pages/`;
- `scripts/generate-cnt-003.mjs`;
- `scripts/verify-qa-i18n-001.mjs`;
- `supabase/migrations/20260902170000_qa_i18n_001_localized_managed_headings.sql`;
- `supabase/tests/database/cnt_003_public_layout_navigation.test.sql`;
- `package.json`;
- this QA record.

The applied baseline migration
`supabase/migrations/20260805120000_cnt_003_public_layout_navigation.sql` was not
edited.

## Database Objects Changed

- data-only updates to six existing `content_page_translations` rows:
  - About UA and CZ;
  - Partnerships UA and CZ;
  - For Organisations UA and CZ;
- no tables, columns, functions, triggers, indexes, grants, or RLS policies are
  added or changed.

The migration merges localized display fields into the existing JSON blocks and
cards. It retains the current block order, content, structural keys, and all
unrelated fields. The transaction aborts unless exactly six translations are
updated.

## Tests / Verification

- `npm run verify:qa-i18n-001` passed;
  - executes the managed-content generator into a temporary file;
  - verifies required UA and CZ display labels;
  - verifies migration scope and row-count invariant;
  - verifies localized dynamic partner-directory copy;
- `npm run verify:cnt-003` passed;
- `npm run lint` passed;
- targeted ESLint for the changed scripts and component passed;
- `git diff --check` passed.

The full TypeScript command is currently blocked by pre-existing workspace
conditions: stale `.next` route declarations reference the former route layout,
and several optional PDF, SMTP, and Playwright packages are absent from the
installed `node_modules`. No TypeScript error pointed to the changed component.

The full local Supabase/pgTAP execution remains unavailable because the local
Docker daemon is not running. The pgTAP suite now contains focused assertions
for all six section translations and the four translations containing cards.

## Generator Correction

The CNT-003 parser used `\Z` as if it were a JavaScript end-of-input token. In
JavaScript it instead behaves as a literal `Z`, truncating a section before
Czech text beginning with that letter and omitting terminal cards or sections.
The generator now uses an actual end-of-input assertion and supports a temporary
output path for regression verification.

## Security Notes

- the browser continues to read only published RLS-protected content;
- no secret, service-role value, authentication flow, grant, or RLS policy
  changed;
- the migration changes public editorial fields only and is constrained by page
  key and language.

## Deviations / Open Questions

- Czech wording remains subject to the existing native-language review gate;
- semantic list rendering and duplicate field presentation remain assigned to
  remediation step 3;
- the corrected generator now preserves terminal cards, but this ticket does
  not backfill terminal cards omitted by the historical applied migration;
- production browser verification is deferred until steps 1 through 3 are
  deployed together.

If this migration later requires correction, add another forward-only migration;
do not rewrite the applied migrations.

## Next Dependency

Proceed to remediation step 3: normalize managed-content semantics and rendered
hierarchy, then run the combined EN/UA/CZ browser and database acceptance before
push or deployment.
