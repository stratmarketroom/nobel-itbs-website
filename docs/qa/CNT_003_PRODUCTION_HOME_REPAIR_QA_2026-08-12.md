# CNT-003 Production Home Repair QA

Date: 2026-08-12  
Ticket: CNT-003 production Home repair  
Migration: `20260812100000_cnt_003_restore_production_home_sections.sql`

## Summary

The production audit confirmed that the deployed Vercel Home was built from the
`nobel-itbs-prod` Supabase data, but that database still contained the stale
Home payload with two programme areas and three trust items. A forward-only,
data-only migration now restores the approved three programme-area cards and
four trust cards for EN, UA, and CZ.

The Vercel Production HTML remains the pre-repair static build until this branch
is merged into `main` and a new Production deployment completes.

## Production Connection Evidence

- the configured production project ref is `szratzjodgiacvnhqmhx`, the
  `nobel-itbs-prod` project;
- the pre-repair rows read from that project matched the stale Vercel Home
  output exactly;
- the application Production build therefore used the intended production
  project, not the former development project;
- no secret value was printed or committed.

## Files Changed

- `supabase/migrations/20260812100000_cnt_003_restore_production_home_sections.sql`
- `supabase/tests/database/cnt_003_home_content_correction.test.sql`
- `scripts/verify-cnt-003.mjs`
- directly related CNT-003 QA and planning records

## Database Objects Changed

No schema, function, grant, policy, or RLS object changed.

Data changed only in the three existing `public.content_page_translations`
rows for `content_pages.page_key = 'home'`:

- `programme_areas.cards`: restored to three approved cards;
- `why_nobel_itbs.cards`: restored to four approved cards.

The rest of every Home translation JSON object was preserved.

## Migration History Finding

The production migration history did not contain
`20260811130000_cnt_003_correct_home_content.sql`, despite the earlier QA record
stating that it had been pushed. Its data was also absent. Before applying this
repair, that historical version was marked `applied` so a future `db push`
cannot unexpectedly replace the complete Home payload. A subsequent dry-run
listed only the new scoped migration.

## Backup

A read-only pre-change snapshot of all three production Home translations was
saved outside the repository at:

`/private/tmp/nobel-itbs-prod-home-before-20260812.json`

## Tests / Verification

- `npm run verify:cnt-003`: passed;
- `npm run lint`: passed;
- `npx tsc --noEmit`: passed;
- `git diff --check`: passed;
- production dry-run: only the new repair migration;
- production `db push`: passed;
- post-migration REST verification:
  - EN: 3 programme areas, 4 trust cards;
  - UA: 3 programme areas, 4 trust cards;
  - CZ: 3 programme areas, 4 trust cards;
- live Vercel DOM before redeployment still shows the prior static 2/3 payload,
  as expected.

The updated pgTAP assertion is committed for the full database suite. It was
not run locally in this ticket because the production migration self-check and
post-migration read already verified the same 3-by-4 invariant.

## Security Notes

- no production secret is present in code, documentation, logs, or Git;
- no RLS or privilege boundary changed;
- no service-role key was exposed to browser code;
- the migration touches only approved public editorial content.

## Deviations / Open Questions

- The database repair is complete.
- Public visual acceptance remains open until the branch is merged and Vercel
  finishes the new Production deployment.

## Next Dependency

Merge the repair branch into `main`, wait for the Vercel Production deployment,
then verify three programme areas and four trust items on EN, UA, and CZ Home.
