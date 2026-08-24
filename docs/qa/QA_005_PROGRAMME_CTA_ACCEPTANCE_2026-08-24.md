# QA-005 Programme CTA Acceptance — 2026-08-24

Ticket: `QA-005-CTA-001`

## Summary

The Owner-approved application destinations are assigned to the two psychology
programmes through one forward-only data migration:

- General Psychology: `https://event.duan.edu.ua/ie80iq`;
- Child Psychology: `https://event.duan.edu.ua/830uga`.

AI Production remains on the on-site question fallback because no approved
partner destination exists yet. The public hierarchy remains pricing option,
active run, programme URL, then question fallback. No pricing-option or
active-run URL override was added.

## Files Changed

- `supabase/migrations/20260824093000_qa_005_programme_cta_urls.sql`;
- `supabase/tests/database/qa_005_programme_cta_urls.test.sql`;
- `scripts/verify-qa-005-cta.mjs`;
- `package.json`;
- directly related QA, status, checklist, and documentation-index records;
- this report.

## Database Objects

No schema object, function, policy, grant, trigger, or Storage object changed.
The migration changes only three existing `public.programmes` rows:

- `general-psychology`: provider `leeloo`, approved URL assigned;
- `child-psychology`: provider `leeloo`, approved URL assigned;
- `ai-production`: provider `partner_site`, URL explicitly retained as `NULL`.

## Tests / Verification

Pre-migration read-only Production evidence confirmed:

- all three programme-level URLs were `NULL`;
- the two psychology providers were already `leeloo`;
- AI Production was already `partner_site` with `NULL` URL;
- their active runs had no URL overrides;
- no pricing-option overrides existed.

External destination inspection confirmed that the first URL renders General
Psychology and the second renders Child Psychology on Leeloo. No checkout or
form submission was performed.

Migration and database evidence:

- dev dry-run listed exactly
  `20260824093000_qa_005_programme_cta_urls.sql` before application;
- the migration applied successfully to dev and a second dry-run reported the
  database up to date;
- Production dry-run listed exactly the same migration before application;
- the migration applied successfully to Production and a second dry-run
  reported the database up to date;
- anonymous read-back in both environments returned the exact two approved
  URLs and `NULL` for AI Production;
- the Supabase CLI was relinked to dev after Production work.

Repository verification passed:

- all 67 non-live `verify:*` package scripts: 67 passed, 0 failed;
- `npm run verify:qa-005:cta`;
- `npm run lint`;
- `npx tsc --noEmit`;
- `CONTENT_DATA_SOURCE=seed npm run build` (46/46 static pages generated).

The pre-deployment Production browser still served the previous cached page
payload and therefore showed the question fallback for all three programmes.
The Vercel Preview created from PR #17 then proved that a fresh deployment reads
the migrated values across the complete EN/UA/CZ matrix:

- General Psychology: two exact external CTA links per locale to
  `https://event.duan.edu.ua/ie80iq`;
- Child Psychology: two exact external CTA links per locale to
  `https://event.duan.edu.ua/830uga`;
- every approved external CTA has `target="_blank"` and `rel="noreferrer"`;
- both psychology programmes retain two on-site question links per locale;
- AI Production has no `event.duan.edu.ua` link and retains two on-site question
  links per locale.

PR #17 was merged into `main` as `f8b6267`, and the corresponding Vercel
Production deployment reached `Ready`. Post-merge Production browser acceptance
repeated the same nine-route matrix with the same results: two exact safe
external links plus two question links per psychology programme and locale, and
two question links with no external event URL for AI Production. No external CTA
was clicked. The ticket is accepted at this scope.

## Security Notes

- Both destinations use HTTPS and contain no query-string PII or secret.
- No secret, service-role key, or learner data is stored in the migration,
  verifier, report, or browser URL.
- External navigation does not alter the server-mediated verification or private
  credential-PDF boundary.
- AI Production does not receive an invented or unapproved partner URL.

## Deviations / Open Questions

- Seed/offline mode intentionally retains its question fallbacks. Production and
  clean database environments receive the approved destinations through the
  ordered migration, avoiding edits to an already-applied seed migration.
- Space Business and the For Organisations destination are outside this ticket
  because the Owner supplied no final URL for them.

## Next Dependency

After this ticket is accepted, continue with the next single QA-005 operational
launch-readiness ticket. AI Production can receive a partner-site URL later only
after explicit Owner approval.
