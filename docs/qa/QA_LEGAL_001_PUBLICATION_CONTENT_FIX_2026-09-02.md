# QA-LEGAL-001 Publication Content Fix

Date: 2026-09-02

Ticket: QA-LEGAL-001 remove unpublished privacy content

Environment: local branch `codex/public-design-remediation`

## Summary

The Ukrainian privacy-policy publication pipeline no longer includes the
internal Release 1 editorial note or raw Markdown emphasis around
`номер телефону`. A forward-only data migration corrects the already-published
Ukrainian privacy-policy row, while the content generator and database tests
prevent the same defect from being reintroduced.

The supplied English and Czech privacy-policy documents were compared with the
Ukrainian working source. Neither supplied document contains the Ukrainian
editorial note. No substantive legal wording was changed.

Production is unchanged until this branch is pushed, reviewed, merged, and the
new migration is deployed.

## Files Changed

- `scripts/generate-cnt-005.mjs`;
- `scripts/verify-cnt-005.mjs`;
- `supabase/migrations/20260902160000_qa_legal_001_publication_content_fix.sql`;
- `supabase/tests/database/cnt_005_legal_pages.test.sql`;
- this QA record.

The applied baseline migration
`supabase/migrations/20260805140000_cnt_005_legal_pages.sql` was not edited.

## Database Objects Changed

- data-only update to the single published `content_page_translations` row for
  `privacy_policy` and language `ua`;
- no tables, columns, functions, triggers, indexes, grants, or RLS policies are
  added or changed.

The correction removes the exact unpublished block and converts the exact raw
Markdown token `**номер телефону**` to plain text. The migration aborts unless
exactly one target row is updated.

## Tests / Verification

- `npm run verify:cnt-005` passed;
  - executes the content generator into a temporary file;
  - confirms the unpublished heading is absent;
  - confirms raw Markdown emphasis is absent;
  - confirms the published phone-number wording remains present;
- `npm run verify:cnt-002` passed as a content-model regression check;
- `npx eslint scripts/generate-cnt-005.mjs scripts/verify-cnt-005.mjs` passed;
- `git diff --check` passed;
- the database pgTAP suite now asserts that published legal content contains no
  raw Markdown emphasis or unpublished editorial instructions, and retains the
  plain Ukrainian phone-number wording.

The full local Supabase/pgTAP execution could not be run because the local
Docker daemon was not running. Static verification and generator execution
passed; database-runtime verification remains required when Docker is
available.

## Security Notes

- the migration is narrowly scoped by page key and language and enforces a
  one-row update invariant;
- no browser-side secret, service-role value, authorization behavior, grant, or
  RLS policy changed;
- no public credential-verification behavior changed.

## Deviations / Open Questions

- the Ukrainian working Markdown retains the editorial note as source metadata;
  the publication generator now excludes it explicitly;
- legal list semantics remain unchanged and are reserved for remediation step 3;
- final legal approval of substantive wording remains outside this technical
  correction;
- production browser verification is deferred until the migration is deployed.

If this migration later requires correction, add another forward-only migration;
do not rewrite either applied migration.

## Next Dependency

Proceed to remediation step 2, then run the combined browser and database
acceptance after steps 1–3 are complete and deployed.
