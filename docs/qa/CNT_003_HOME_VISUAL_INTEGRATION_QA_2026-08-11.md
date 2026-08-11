# CNT-003 Home Visual Integration QA

Date: 2026-08-11  
Ticket: CNT-003 Home visual integration  
Implementation branch: `codex/cnt-003-home-visual-integration`  
Visual baseline: commit `24f728b`

## Outcome

The Owner-approved Home composition has been ported into the current structured,
Supabase-backed public architecture. The implementation does not restore the old
static `HomeCopy` business content.

The Home page now reads:

- Hero, verification utility, programme-area, trust, process, organisation,
  institutional, and final CTA copy from the published `content_pages` record;
- programme cards and their facts from the published programme catalogue;
- localized navigation and interface labels from a presentation-only UI map;
- document-number verification through the existing WF-008 public endpoint.

## Verification Completed

- ESLint: passed.
- TypeScript (`npx tsc --noEmit`): passed.
- `npm run verify:cnt-003`: passed.
- `npm run verify:wf-008`: passed.
- `git diff --check`: passed.
- Production compilation: passed.
- Full production prerender: stopped on the pre-existing external Supabase
  dependency for `/for-organisations` (`Site settings could not be loaded from
  Supabase`); the Home implementation compiled successfully before that failure.
- Desktop visual comparison against the approved local baseline: passed after
  correcting a legacy global `h1 span` colour collision.
- Mobile 390 × 844: no horizontal overflow; mobile menu, localized navigation,
  Hero, CTA, and verification card passed.
- Tablet 834 × 1112: UA Hero, content hierarchy, menu, and verification card
  passed without horizontal overflow.
- Verification tabs: pointer selection and ArrowLeft/ArrowRight keyboard
  switching passed.
- WF-008 handoff: a Czech document number submitted from Home navigated to
  `/cz/verify?documentNumber=...` and returned the localized not-found state.
- Dynamic catalogue projection: five published programme cards rendered in EN,
  UA, and CZ.

## Data Conflict Resolution

The historical production Supabase `home` content did not match the approved
master-copy documents:

- EN and UA `programme_areas` contain two cards instead of the approved three;
- CZ `programme_areas` lacks its `h2`, intro, and all three cards;
- CZ `how_the_model_works` contains two of the approved four steps.

The malformed values reproduce the output of historical migration
`20260805120000_cnt_003_public_layout_navigation.sql`. They are not introduced by
the visual integration.

No fallback business copy was embedded in React to hide this discrepancy.
Forward-only migration `20260811130000_cnt_003_correct_home_content.sql` was
applied to production on 2026-08-11. Live local rendering against production
data now shows three programme areas, four trust items, four process steps, and
complete localized verification fields in EN, UA, and CZ.

## Security Notes

- The browser continues to use only the publishable Supabase key and RLS-backed
  public projections.
- No service-role value is exposed to the Home component.
- Home verification delegates to WF-008; public state and field disclosure rules
  remain unchanged.
- QR mode provides instructions and routes to the verification page; it does not
  create a second credential lookup path.

## Remaining Acceptance

1. Deploy this branch to Vercel Preview with the production-like environment.
2. Obtain Owner desktop/mobile acceptance on the corrected three-language
   Preview.
3. Merge only after those checks; PR #3 remains rejected.
