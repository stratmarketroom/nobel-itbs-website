# QA-005 Space Business and B2B CTA Acceptance — 2026-08-24

Ticket: `QA-005-CTA-002`

## Summary

The Owner-approved Space Business application destination is assigned through a
guarded forward-only migration:

- Space Business: `https://event.duan.edu.ua/et6naw`.

For Organisations remains on the on-site organisation enquiry form. Its public
site setting stays `NULL`, so the page primary CTA targets `#contact` and the
existing `organisation_enquiry` form remains the submission path.

## Files Changed

- `supabase/migrations/20260824113000_qa_005_space_business_and_b2b_ctas.sql`;
- `supabase/tests/database/qa_005_space_business_and_b2b_ctas.test.sql`;
- `scripts/verify-qa-005-cta-002.mjs`;
- `package.json`;
- directly related QA, status, checklist, and documentation-index records;
- this report.

## Database Objects

No schema object, function, policy, grant, trigger, or Storage object changes.
The migration updates only the existing `public.programmes` row for
`space-business`. It asserts, but does not mutate, the existing public
`for_organisations_application_url` setting with its `NULL` value.

## Tests / Verification

Pre-migration read-only dev and Production evidence confirmed:

- Space Business provider was already `leeloo` and its URL was `NULL`;
- its ongoing run had no application URL override;
- it had no pricing options or pricing URL override;
- the For Organisations public site setting existed with `NULL` value;
- the Production Space Business page used the question fallback;
- the Production For Organisations CTA targeted `#contact`, and the on-site form
  was present.

The supplied destination was inspected in the browser and identifies the online
course as Space Business. No form or checkout submission was performed.

Migration and database evidence:

- dev dry-run listed exactly
  `20260824113000_qa_005_space_business_and_b2b_ctas.sql` before application;
- the migration applied successfully to dev, and a second dry-run reported the
  database up to date;
- Production dry-run listed exactly the same migration before application;
- the migration applied successfully to Production, and a second dry-run
  reported the database up to date;
- anonymous read-back in both environments returned the exact Space Business
  URL and the public For Organisations setting with `NULL` value;
- the Supabase CLI was relinked to dev after Production work.

Repository verification passed:

- all 68 non-live `verify:*` package scripts: 68 passed, 0 failed;
- `npm run verify:qa-005:cta-002`;
- `npm run lint`;
- `npx tsc --noEmit`;
- `CONTENT_DATA_SOURCE=seed npm run build` (46/46 static pages generated).

The existing Production deployment still serves the pre-migration static page
payload for Space Business. Preview and post-merge Production browser acceptance
remain before closure.

## Security Notes

- The destination uses HTTPS and contains no query-string PII or secret.
- No secret, service-role key, or learner data is stored in the migration,
  verifier, report, or browser URL.
- For Organisations continues to use the existing validated, rate-limited,
  privacy-consented public contact flow.
- No external form was submitted during inspection.

## Deviations / Open Questions

- AI Production intentionally remains on its question fallback until an approved
  partner destination is supplied.
- Seed/offline mode retains question and contact fallbacks; database-backed
  environments receive the Space Business URL through the ordered migration.

## Next Dependency

After this ticket is accepted, continue with the next single operational
launch-readiness ticket.
