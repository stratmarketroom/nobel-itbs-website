# PR #91 Public Design Review Fixes

Date: 2026-09-02

Ticket: targeted correction of the three PR #91 review findings

Environment: local branch `codex/public-design-remediation`

## Summary

- Both content migrations now fail closed on CMS drift or missing translations.
  Every target must match its expected full `sections` JSONB snapshot; otherwise
  the transaction rolls back instead of overwriting editorial changes.
- Czech About `title_1` / `body_1` fields render as adjacent definition pairs,
  without duplicated paragraphs and with numeric ordering independent of JSONB
  key order. Existing `step_1_title` / `step_1_body` pairs remain supported.
- Final CTA blocks now render working actions. About links use the selected
  locale exactly once, including when source paths contain Markdown backticks.
  For Organisations and Partnerships reuse the existing configured primary
  destination or `#contact`; identical contact actions are not duplicated.
  Secondary actions remain plain underlined links using the existing design.

## Files Changed

- `components/managed-content-page.tsx`, `app/public.css`;
- `scripts/generate-cnt-003.mjs`;
- `scripts/lib/managed-content-migrations.mjs` and
  `scripts/lib/managed-headings-localization.json`;
- `scripts/lib/managed-content-test-fixtures.mjs`;
- `scripts/verify-qa-i18n-001.mjs`, `scripts/verify-qa-semantic-001.mjs`;
- `scripts/test-qa-semantic-001.mjs`,
  `scripts/test-qa-managed-migrations.mjs`, `package.json`;
- the two unapplied migrations listed below;
- this report and the QA-I18N-001 / QA-SEMANTIC-001 reports.

## Database Objects Changed

No hosted database was contacted or changed. No schema, function, trigger,
grant, or RLS policy changes are included. The existing data-only migrations
still target six localized translations followed by nine semantic translations.
Home, metadata, and other translations are outside their update scope.

The user explicitly authorized an exception to the shared-migration immutability
rule for these two **unapplied** PR #91 files only:

- `20260902170000_qa_i18n_001_localized_managed_headings.sql`;
- `20260902180000_qa_semantic_001_managed_content_structure.sql`.

No applied migration was modified. The 17:00 expected snapshots are taken from
immutable `20260805120000_cnt_003_public_layout_navigation.sql`. The 18:00
snapshots include the exact output of the 17:00 localization step. Guards are
needed in both stages so the first stage cannot erase drift before the second
stage checks it. All nine desired 18:00 payloads match the pre-fix PR payloads.

## Tests / Verification

- `npm run test:qa-semantic-001`: 9 passing renderer tests covering all nine
  generated translations, Czech pairs, numeric ordering, locale/fallback URLs,
  unsafe managed paths, configured B2B targets, contact anchors, and list
  semantics.
- `npm run test:qa-managed-migrations`: 20 passing in-memory PostgreSQL tests
  using PGlite 0.5.8 and the real baseline and remediation SQL. Checks exact
  outputs, unchanged Home and metadata, complete rollback for drift in each of
  six stage-one and nine stage-two targets, and missing-row rollback per stage.
- Both migration verifiers regenerate their SQL byte for byte and check drift
  guards. Public-content checks inspect desired JSON, not historical editorial
  text retained solely in expected snapshots.
- `verify:cnt-005`, `verify:cnt-002`, `verify:cnt-003`, `verify:qa-i18n-001`,
  `verify:qa-semantic-001`, and `verify:admin-content-fields` passed;
  `npm run lint` and `git diff --check` passed.
- External Chrome: all nine isolated fixture routes checked at 390 × 844 and
  1440 × 900 (18 viewport checks); no horizontal page overflow, and final CTA
  destinations are localized correctly. Primary targets measure over 54 px in
  height and secondary links 44 px.
- Visual checks: Czech About definition pairs in desktop and mobile layouts,
  plus mobile final actions. Keyboard check: Tab focuses the final Czech
  organisation CTA with a visible 3 px outline; Enter reaches `#contact`.

The browser fixtures render the real component, generated content, and public
CSS. Header, footer, dynamic directories, and contact form are test doubles.
These checks are not full-site or post-deployment acceptance; no form was sent.

To reproduce the optional SQL tests, install `@electric-sql/pglite@0.5.8` in a
disposable directory outside the repository, then run:

```sh
NOBEL_QA_PGLITE_MODULE=/absolute/path/to/temp/node_modules/@electric-sql/pglite/dist/index.js npm run test:qa-managed-migrations
```

No dependency or lockfile change is needed. The test only creates an in-memory
fixture database and does not load application environment files.

Full Supabase/pgTAP acceptance remains unavailable while the local Docker daemon
is stopped. Re-running `npx tsc --noEmit --incremental false` failed on the
pre-existing stale `.next` route declarations and absent PDF, SMTP, and
Playwright dependencies, including consequent implicit-any diagnostics. No
diagnostic pointed to the changed renderer. Isolated renderer checks do not
replace a full build.

## Security Notes

- No authentication, RLS, grants, credential lifecycle, or private-document
  handling changed; no secrets or service-role values were used.
- Managed About CTA paths reject external, protocol-relative, backslash, and
  whitespace/control-character targets and fall back to known localized paths.
- CMS drift is never automatically reconciled or silently overwritten.

## Deviations / Open Questions

- The migration-edit exception is limited to the two unapplied files above;
  normal immutability rules still apply to every other migration.
- Hosted content was not inspected. If it differs from the expected snapshots,
  deployment will deliberately stop and require an approved reconciliation.
- Czech native-language review and deployed EN/UA/CZ acceptance remain pending.
- No push, merge, or remote migration was performed for these review fixes.

## Next Dependency

Review the local diff, then commit and push the approved fixes to update PR #91.
Before deployment, confirm the two corrected migrations remain unapplied and
complete the database and deployed desktop/mobile acceptance gates.
