# PDFGEN-TEMPLATE-A11Y — Template Workspace Accessibility

Date: 2026-09-01
Branch: `codex/pdfgen-template-a11y`
Status: implementation and local verification complete; Preview review pending

## Summary

The protected Template Package workspace now follows the shared Nobel ITBS
admin structure and exposes complete accessible names for package, source-PDF,
page, and placement controls. Version and source-document selectors use real
tab semantics with Arrow, Home, and End navigation. Draft placements may be
moved by pointer or keyboard, while exact point values remain available in
labelled form controls.

The fictional `verification_url` preview now uses the shared Production
canonical origin and the approved token route:
`https://nobel-itbs.eu/verify/sample-token-not-for-production`. The retired
sample host and document-number URL were removed.

## Files Changed

- `components/admin-credential-templates.tsx`;
- `app/admin.css`;
- `scripts/verify-pdfgen-003.mjs`;
- `scripts/verify-pdfgen-template-a11y.mjs`;
- `package.json`;
- ticket documentation and status indexes.

## Database Objects

None.

## Tests / Verification

Passed:

- `npm run verify:pdfgen-template-a11y`;
- `npm run verify:pdfgen-003`;
- `npm run verify:adm-dirty-guard`;
- `npm run verify:pdfgen-001`;
- `npm run verify:pdfgen-002`;
- `npm run verify:pdfgen-005`;
- `npm run verify:pdfgen-006`;
- `npm run verify:pdfgen-007`;
- `npm run verify:pdfgen-008`;
- `npm run verify:pdfgen-lint-001`;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build`;
- `git diff --check`.

The historical `npm run verify:pdfgen-004` remains red on unchanged
`origin/main`: its static rule rejects every `console.error`, while the current
renderer already contains the privacy-safe
`credential_template_pdf_validation_failed` diagnostic. No PDFGEN-004 file is
changed by this ticket.

## Security Notes

- The workspace remains available only through the authenticated Owner/Super
  Admin AAL2 shell.
- All existing private, no-store Template Package and preview API calls remain
  unchanged.
- No Storage path, signed URL, source hash, PDF bytes, raw verification token,
  or service-role credential is added to browser state or UI.
- The sample URL is explicitly fictional and contains no real token.
- Admin metadata remains `noindex, nofollow` and intentionally emits no public
  canonical tag.

## Deviations / Open Questions

Authenticated visual and assistive-technology acceptance remains a Preview
review step because the local workspace has no reusable Owner/AAL2 browser
session. There is no product-rule deviation.

## Next Dependency

Review the Vercel Preview at desktop and mobile widths with an Owner/Super Admin
AAL2 session, then merge this ticket before starting another admin issue.
