# CNT-003 Home Content Correction QA

Date: 2026-08-11  
Ticket: CNT-003 Home content correction  
Migration: `20260811130000_cnt_003_correct_home_content.sql`

## Summary

The approved EN, UA, and CZ Home master-copy payloads were restored through one
forward-only migration. The correction updates only the three translations of
the existing `home` content page and does not change schema, RLS, programme
records, verification workflows, or other public pages.

The migration also removes malformed markdown backticks from localized Home
targets and restores the complete Czech verification utility.

## Files Changed

- `supabase/migrations/20260811130000_cnt_003_correct_home_content.sql`
- `supabase/tests/database/cnt_003_home_content_correction.test.sql`
- `scripts/verify-cnt-003.mjs`
- the directly related status and QA documents

## Database Objects

No schema objects were added or changed.

Data changed:

- `public.content_page_translations`: the existing EN, UA, and CZ rows for
  `content_pages.page_key = 'home'` were updated to the approved master copy.

## Tests / Verification

- `npm run verify:cnt-003`: passed.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- Supabase linked dry-run listed only the CNT-003 correction migration.
- Production `supabase db push`: passed.
- Migration self-check confirmed three published translations, three programme
  areas per locale, and four complete process steps per locale.
- Browser rendering against production data:
  - EN: three areas, four trust items, four process steps;
  - UA: three areas, four trust items, four process steps, localized verification;
  - CZ: three areas, four trust items, four process steps, localized verification.

The new pgTAP file was added for the clean database suite. It was not executed
locally because Docker was not running; this remains covered by the next full
database-suite execution.

## Security Notes

- No secrets or service-role values are present in the migration.
- RLS, grants, public content projections, and WF-008 verification privacy were
  not changed.
- The migration writes only approved public editorial content.

## Deviations / Open Questions

- Czech native-language editorial review remains an external publication check
  already recorded in the master-copy status.
- Owner acceptance on the Vercel Preview is still required.

## Next Dependency

Deploy the corrected integrated Home branch to Vercel Preview and obtain Owner
desktop/mobile acceptance for EN, UA, and CZ before merge.

## Remediation Note

The migration is forward-only. If a content defect is found, correct it with a
new scoped migration or through the authorized content-admin workflow; do not
rewrite or remove the applied migration.
