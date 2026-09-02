# ADM-DIRTY-GUARD — Unsaved Admin Changes Protection

Date: 2026-09-01
Branch: `codex/adm-dirty-guard`
Status: merged through PR #82 as `695cf14`; local verification complete

## Summary

Protected admin editors now share one unsaved-changes boundary. The boundary
warns before an admin leaves an edited view through module navigation, browser
refresh/close, browser history, or sign out. It also guards local record,
language, tab, and workflow changes where those actions replace draft state.

The guard covers controlled CMS and catalogue editors, user/site/email settings,
learner and credential forms, batch selections, and credential-template forms
and placements. A compact persistent status announces that a draft is unsaved.

## Files Changed

- shared guard: `components/admin-dirty-guard.tsx`;
- protected shell integration: `components/admin-shell.tsx`;
- protected admin styling: `app/admin.css`;
- admin editors under `components/admin-*.tsx` that can hold unsaved input;
- focused static verifier and package script.

## Database Objects

None.

## Tests / Verification

- `npm run verify:adm-dirty-guard`;
- `npm run lint`;
- `npx tsc --noEmit`;
- production build and focused existing admin verifiers before review.

## Security Notes

- The guard is mounted only inside the authenticated admin shell.
- It does not persist, transmit, log, or inspect field values.
- No API, role, MFA, RLS, audit, credential lifecycle, or public route changed.
- Successful and failed mutations keep their existing authorization and audit
  behavior; the guard only protects browser-local draft state.

## Deviations / Open Questions

Browser refresh/close uses the browser-native before-unload prompt because
browsers intentionally do not permit custom text there. Internal navigation
uses the same concise discard decision. No product-rule deviation exists.

## Next Dependency

Completed. `PDFGEN-TEMPLATE-A11Y` followed as a separate ticket and merged
through PR #83.
