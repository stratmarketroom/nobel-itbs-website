# QA-SEMANTIC-001 Managed Content Structure

Date: 2026-09-02

Ticket: QA-SEMANTIC-001 restore semantic managed-page content

Environment: local branch `codex/public-design-remediation`

## Summary

The About, Partnerships, and For Organisations templates now render structured
content with appropriate HTML semantics:

- ordinary lists use `ul` and `li`;
- ordered cooperation steps use `ol` and `li`;
- paired labels and explanations use `dl`, `dt`, and `dd`;
- headings and paired field values are no longer repeated as loose paragraphs;
- long prose is capped at 70 characters per line for easier reading.

The content generator now preserves Markdown lists as JSON item arrays, keeps
terminal cards and final sections, and excludes internal editorial or schema
instructions. No approved public paragraph or business claim was rewritten.

Production is unchanged until the branch is pushed, reviewed, merged, and the
new migration is deployed.

## Files Changed

- `components/managed-content-page.tsx`;
- `app/public.css`;
- `scripts/generate-cnt-003.mjs`;
- `scripts/verify-qa-semantic-001.mjs`;
- `supabase/migrations/20260902180000_qa_semantic_001_managed_content_structure.sql`;
- `supabase/tests/database/cnt_003_public_layout_navigation.test.sql`;
- the UA/CZ About master copies and Czech For Organisations formatting source;
- `package.json`;
- this QA record.

The applied CNT-003 migration was not edited.

## Database Objects Changed

- data-only replacement of the structured `sections` JSON for nine existing
  translations:
  - About EN, UA, and CZ;
  - Partnerships EN, UA, and CZ;
  - For Organisations EN, UA, and CZ;
- no schema object, function, trigger, index, grant, or RLS policy changed.

The forward-only migration is generated directly from the approved master-copy
files and aborts unless exactly nine target rows match their expected pre-change
sections. Expected JSONB snapshots come from immutable CNT-003 plus the guarded
heading-localization step. CMS drift or a missing row rolls back the entire
transaction. The nine desired output payloads are unchanged by the review fix.

The [PR #91 review-fix report](QA_PUBLIC_DESIGN_PR_91_REVIEW_FIXES_2026-09-02.md)
records the explicit user exception for the two unapplied migrations, Czech
numbered-field pairing, working final CTAs, renderer and SQL regression tests,
and isolated Chrome desktop/mobile checks. Deployed acceptance remains pending.

## Content Restored

- the fourth partnership model;
- the third For Organisations audience;
- the fifth infrastructure service;
- the fourth FAQ item;
- terminal About proof content and final CTA blocks;
- all equivalent terminal content in EN, UA, and CZ.

Internal editorial guardrails, publication dependencies, and partner/expert
schema instructions are excluded from the generated public JSON.

## Tests / Verification

- `npm run verify:qa-semantic-001` passed;
  - regenerates the migration into a temporary file and compares it byte for
    byte with the committed migration;
  - verifies nine structured list collections;
  - verifies restored terminal cards and final CTA blocks;
  - rejects internal editorial and schema instructions;
  - verifies semantic renderer elements and styling hooks;
- `npm run verify:qa-i18n-001` passed;
- `npm run verify:cnt-003` passed;
- targeted ESLint passed;
- `npm run lint` passed;
- `git diff --check` passed.

The full local Supabase/pgTAP run remains unavailable because the local Docker
daemon is not running. The database test now includes focused assertions for
structured lists, terminal content, localization, and internal-instruction
exclusion.

The repository-wide TypeScript command remains blocked by the pre-existing
stale `.next` declarations and missing optional PDF, SMTP, and Playwright
packages recorded in QA-I18N-001. No lint or focused verification error points
to the changed renderer.

## Security Notes

- the public renderer continues to consume only published RLS-protected data;
- no service-role value, authentication behavior, grant, or RLS policy changed;
- internal editorial instructions are now explicitly prevented from entering
  generated public content;
- credential verification and private document handling are unaffected.

## Deviations / Open Questions

- Czech wording remains subject to the existing native-language review gate;
- browser acceptance against migrated data is deferred until steps 1 through 3
  are pushed and deployed together;
- no broader visual redesign, programme-page imagery, or programme-title
  overflow correction was included in this ticket.

If this migration later requires correction, add another forward-only migration;
do not rewrite the applied migrations.

## Next Dependency

Steps 1 through 3 are now ready for the combined pre-push review. After the
local commits are confirmed, push the branch, open or update the review, deploy
the migrations, and run EN/UA/CZ desktop and mobile browser acceptance.
