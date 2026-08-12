# QA-005 Production Public Acceptance

Date: 2026-08-12

Ticket: QA-005 public Production acceptance

Environment: `https://nobel-itbs-website.vercel.app/`

Accepted baseline: merged `main` at `ee0d040`

## Summary

The merged CNT-003 Home baseline, localized public shell, Czech SEO metadata,
and mobile touch-target correction are deployed and accepted on Vercel
Production. The public EN/UA/CZ layer passed responsive, metadata, localization,
error-state, and verification-privacy browser checks without a launch-blocking
defect.

This acceptance covers the public website only. It does not close production
authentication, Owner/MFA, protected admin, cross-browser, external integration,
backup, custom-domain, or final release acceptance.

## Files Changed

- this QA record;
- the related mobile QA record;
- the project Master Checklist and documentation index.

No application source file changed in this ticket.

## Database Objects Changed

None.

## Tests / Verification

- confirmed GitHub merge and Vercel Production deployment from `main`;
- Chromium mobile matrix at `390 x 844` across 27 EN/UA/CZ Release 1 routes:
  - correct document language (`en`, `uk`, or `cs`);
  - zero measured interactive targets below `44 x 44` CSS pixels;
  - zero horizontal overflow;
  - H1, title, description, and canonical metadata present;
  - localized managed header and footer copy present;
- Chromium desktop matrix at `1280 x 900` across 18 primary EN/UA/CZ routes:
  - exactly one H1 per page;
  - canonical metadata present;
  - localized public shell present;
  - zero horizontal overflow;
- invalid document-number verification tested in EN, UA, and CZ:
  - all three return the localized not-found state;
  - no holder, programme, document, or private-reason data is exposed;
- unknown route returns the not-found page with `noindex` and no horizontal
  overflow;
- mobile visual inspection of the Ukrainian programme catalogue passed;
- the restored Home design and Supabase-managed content remain visible in the
  Production deployment.

## Security Notes

- public verification remains server-mediated;
- invalid verification does not expose credential or learner details;
- no authentication, authorization, RLS, secret, database, or Storage mutation
  was performed by this ticket;
- no service-role value was exposed to browser output or committed files.

## Deviations / Open Questions

- browser acceptance used the in-app Chromium runtime, not Safari, Firefox, or
  physical mobile devices;
- this was targeted responsive/semantic browser QA, not a complete automated
  WCAG contrast or assistive-technology audit;
- custom-domain canonical verification remains open until the final domain is
  attached;
- production authentication, Owner/MFA enrolment, and the protected admin
  acceptance have not yet been performed.

## Next Dependency

Configure production Supabase Auth URLs, bootstrap the single production Owner,
enrol and verify MFA, then run signed-out, AAL1, AAL2, role, and protected-admin
acceptance against Vercel Production.
