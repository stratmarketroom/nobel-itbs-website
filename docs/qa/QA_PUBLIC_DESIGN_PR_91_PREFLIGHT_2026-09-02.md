# PR #91 Public Design Prerelease Check

Date: 2026-09-02

Ticket: QA-PUBLIC-DESIGN-PR91-PREFLIGHT

Reviewed commit: `71fd3740d852c57283290acf70f98c15d05a6a35`

Base: `9004d9f798a2bc12689ee8cba8abac6df45349b5`

## Summary

**Do not treat this check as unconditional release approval.** The application
passes a clean production build, TypeScript, lint, and focused regression checks.
Hosted content has no drift from the migration expectations. One pre-existing
database-test defect was reproduced and subsequently corrected with user
approval: two CNT-003 assertions counted legal-page translations while
expecting the core-page total only.

No application defect requiring another implementation change was found within
the reviewed scope. Complete the review gate and approved
Development migration/browser acceptance before Production promotion.

## Files Changed

- This report, including the authorized follow-up test correction.
- `supabase/tests/database/cnt_003_public_layout_navigation.test.sql`: only the
  two count assertions now join `content_pages` and filter the four core pages;
  the expected 12 and the 14-test plan remain unchanged.

Application code, dependencies, lockfile, and migrations are unchanged by the
prerelease check and follow-up correction. Temporary build and diagnostic files
were created outside the repository; they contain no copied environment files
or credentials.

## Database Objects

None. No migration was applied and no hosted row was written.

Read-only checks verified both project identities and found:

| Environment | Applied versions matching repository | Pending versions | CMS baseline matches |
| --- | --- | --- | --- |
| Development | 69 | `20260902160000`, `20260902170000`, `20260902180000` | 9/9 |
| Production | 69 | `20260902160000`, `20260902170000`, `20260902180000` | 9/9 |

There are no remote-only versions. Both heading and semantic correction files
remain unapplied. All nine affected translations are published and their full
`sections` objects match immutable CNT-003. The Ukrainian privacy translation
still contains the one targeted unpublished block and raw phone-number Markdown;
none of its current blocks lacks a heading.

This is a point-in-time check, not a lock: repeat the guards at deployment.

The [Supabase Management read-only query endpoint](https://supabase.com/docs/reference/api/v1-read-only-query)
returned HTTP 401 with the locally configured management token. Ledger checks
were successfully completed with the existing database credentials through
`supabase migration list`, using `default_transaction_read_only=on` and TLS.
Published content was read through the anonymous public content API. No new
token, privilege, policy, or connection configuration was created.

## Tests / Verification

### Clean application verification

An exact Git archive of the reviewed commit was extracted into a disposable
directory. `npm ci --no-audit --no-fund` installed the committed lockfile there;
no `.env` files were copied and no hosted configuration was needed for the build.

Passed:

- `npm run build`: compilation, TypeScript, and generation of 60 static build
  entries completed successfully;
- separate `npx tsc --noEmit --incremental false`;
- `npm run lint`;
- `test:qa-semantic-001`: 9/9 renderer tests;
- `verify:cnt-005`, `verify:cnt-002`, `verify:cnt-003`;
- `verify:qa-i18n-001`, `verify:qa-semantic-001`;
- `verify:admin-content-fields`;
- `test:qa-managed-migrations`: 20/20 isolated PGlite SQL cases;
- `git diff --check` before the report was added.

The earlier TypeScript/build limitation is resolved as a verification question:
the code builds in a clean installation. The user's original `node_modules` and
stale `.next` directory were not repaired or removed.

### Content SQL assertion reproduction

A separate in-memory PGlite fixture loaded the actual immutable CNT-003 and
CNT-005 content SQL followed by all three PR migrations. It then executed the
exact SELECT expressions from both content pgTAP files and compared their
results with the committed expected values:

- CNT-003: 12 passed, 2 failed;
- CNT-005: 13 passed, 0 failed.

After the authorized test-scoping correction:

- CNT-003: 14 passed, 0 failed;
- CNT-005: 13 passed, 0 failed;
- two additional in-memory negative checks remove one core translation and
  confirm both corrected counts return 11 despite the nine legal translations,
  so the expected-12 assertions still detect missing core content;
- all 20 managed-migration SQL regression cases passed again;
- `verify:cnt-003`, `verify:cnt-005`, `verify:qa-i18n-001`, and
  `verify:qa-semantic-001` passed again.

This is execution of the assertion predicates on a minimal content schema,
**not** a full Supabase/pgTAP run or a full 72-migration-chain test. The local
Docker daemon remains unavailable.

### GitHub / deployment

- PR #91 is open at the reviewed commit; no merge performed.
- Vercel deployment and Vercel Preview Comments checks are successful.
- The GitHub review and inline-review-comment collections are empty. The
  existing Vercel bot comment is deployment evidence, not code-review approval.
- Preview inspected:
  [PR #91 preview](https://nobel-itbs-website-git-codex-p-6bea6a-stratmarketrooms-projects.vercel.app).

### External Chrome acceptance before migrations

Twelve routes were checked at 390 × 844 and 1440 × 900: About, Partnerships,
For Organisations, and Privacy Policy in EN/UA/CZ. All 24 viewport checks had
one `h1`, one `main`, and no horizontal document overflow. Mobile locale tags
were `en`, `uk`, and `cs` as appropriate.

- Czech About mobile hero was visually inspected in the original Czech text.
- Czech numbered fields render as definition pairs with the existing content.
- Existing final actions use localized About destinations or the contact
  anchor. Desktop primary action height is 54.39 px; secondary height is 44 px.
- Keyboard navigation from the Ukrainian About final primary action reaches
  the secondary action with a visible 3 px outline. Enter on the primary action
  navigates to the live `/ua/programmes` catalogue.
- Browser automatic translation was observed after page load; translated text
  was not used as localization evidence. Original-language snapshots immediately
  after navigation and the public API supplied the copy evidence.

The preview still serves pre-migration data: Czech About and Czech For
Organisations have no final actions, some localized pages retain English
structural headings, and editorial remnants are still visible. These are the
data defects already targeted by the unapplied migrations, not evidence that
post-migration acceptance passed. No form, credential lookup, or cookie-consent
action was submitted during this check.

## Detailed Finding

### [P2, resolved] CNT-003 count assertions include unrelated legal translations

Location: `supabase/tests/database/cnt_003_public_layout_navigation.test.sql`,
original lines 4 and 10 in reviewed commit `71fd374`.

Both SELECTs count all `content_page_translations` and expect 12. CNT-005 adds
nine legal translations, producing 21 with the actual content migrations.
The same defective predicates already exist in base `9004d9f`.

Impact: a correct database produces two false test failures, preventing a
trustworthy green content-test gate. This is a test-scoping defect, not a
reason to delete or alter content rows.

Resolution: the user approved a follow-up correction. Both counts now join
`content_pages` and restrict the scope to `home`, `about`, `partnerships`, and
`for_organisations`, retaining the expected 12. The combined 27 content
predicates now pass. The total was not changed to 21, which would remain coupled
to unrelated content. Full pgTAP still requires a compatible runner.

## Focused Impeccable Audit

Anti-pattern verdict: no new decorative pattern or competing CTA treatment was
introduced by the reviewed changes. Existing brand surfaces and repeated-content
cards remain; this is not approval of a broader redesign.

Scores are provisional and restricted to the reviewed UI, not WCAG certification
or measured performance budgets:

| Dimension | Score | Evidence / limitation |
| --- | --- | --- |
| Accessibility | 3/4 | Semantic pairs, landmarks, keyboard CTA and focus verified; full contrast/assistive-technology audit pending |
| Performance | 3/4 | Server-rendered additions and successful optimized build; no runtime performance benchmark |
| Responsive design | 3/4 | 24 live viewport checks without overflow; post-migration content still needs live acceptance |
| Theming | 2/4 | Existing hard-coded light-surface colors coexist with OKLCH additions; no new theme-switching scope |
| Anti-patterns | 3/4 | Existing composition retained and secondary actions remain understated |
| Total | 14/20 | Good within the checked scope, not a release-gate override |

No new UI fix is recommended from these measurements. With the test-scoping
defect resolved, perform post-migration acceptance and use `impeccable
polish` only for any then-confirmed UI issue rather than expanding this PR.

## Security Notes

- Hosted checks were read-only and restricted to migration metadata and public
  content; no learners, credentials, private PDFs, or operational records read.
- No secret values were printed, copied into build artifacts, or committed.
- No authentication, RLS, grants, publication status, or environment settings
  changed. No merge, push, or deployment was performed during this check.

## Deviations / Open Questions

- The identified test defect is resolved; full Supabase/pgTAP execution remains
  unavailable while Docker is stopped.
- Formal GitHub review approval and the existing Czech native-language gate
  remain unrecorded.
- Managed content must be checked again after the three migrations are applied
  to the approved Development target. Current live screenshots cannot prove the
  restored terminal content or localized headings are accepted.

## Next Dependency

Update PR #91 with the approved test correction and this report. Then complete
review and separately approve Development promotion and live acceptance.
Production merge/promotion remains a subsequent explicit gate.
