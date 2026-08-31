# QA-005 Production Owner, MFA, and Protected Admin

Date: 2026-08-12

Ticket: QA-005 production Auth/Owner/MFA and protected-admin acceptance

Environment: `https://nobel-itbs-website.vercel.app/`

## Summary

Production authentication is configured and the single approved production
Owner has been bootstrapped. The Owner completed TOTP enrolment and reached an
MFA-verified (`aal2`) session. All 11 protected administration modules then
passed a non-mutating browser smoke test without authentication, authorization,
or page-load errors.

## Files Changed

- this QA record;
- the project Master Checklist;
- the implementation status and documentation index.

No application source file changed in this ticket.

## Database Objects Changed

No schema object changed.

Production data bootstrap:

- one Supabase Auth user was created and auto-confirmed for the approved Owner;
- `public.user_profiles` received the active Owner profile with
  `mfa_required = true`;
- `public.user_roles` received the single `owner` role assignment.

The existing AUTH-001..005 constraints, Owner uniqueness guard, audit triggers,
and RLS model were used without modification.

## Tests / Verification

- production Supabase Auth Site URL:
  `https://nobel-itbs-website.vercel.app`;
- allowed redirect URL:
  `https://nobel-itbs-website.vercel.app/admin/login`;
- Owner profile verified as active, unique, and MFA-required;
- Owner role assignment verified after bootstrap;
- production admin login redirected successfully to `/admin/users`;
- the authenticated shell displayed `Owner` and `MFA verified`;
- the Users and Roles screen showed one active Owner and enforced the immutable
  active/MFA-required Owner controls;
- read-only browser smoke passed for all 11 protected modules:
  - Content pages;
  - Programmes;
  - Programme areas;
  - Programme types;
  - Partners;
  - Experts;
  - Contact submissions;
  - Learners;
  - Credentials;
  - Site settings;
  - Users and roles.

No content, programme, learner, credential, contact, or settings record was
mutated during protected-admin acceptance.

## Security Notes

- the service-role key remained server-side and was not printed, committed, or
  exposed to browser code;
- the Owner password, TOTP secret, QR enrolment value, and verification code
  were entered only by the Owner and were not inspected or stored by the agent;
- Owner creation followed the existing first-Owner bootstrap guards;
- production admin access requires an active profile, the Owner role, and an
  MFA-verified session;
- the existing one-active-Owner and one-Owner-role constraints remain intact.

## Deviations / Open Questions

- this acceptance verifies the successful AAL2 Owner path; the signed-out and
  AAL1 denial boundaries remain covered by the accepted QA-003 matrix and were
  not repeated with destructive production session manipulation;
- admin acceptance used the connected Chromium browser, not Safari, Firefox,
  or a physical mobile device;
- no admin mutation workflow was repeated in production because those workflows
  already have dev-level role/RLS acceptance and production data must remain
  clean until operational launch testing requires an approved record.

## Next Dependency

Continue QA-005 operational launch work: align and acceptance-test VEDOS
credential delivery, configure final CTA destinations and Telegram contact
alerts, define database/private-PDF backup coverage, attach and verify the
canonical domain, configure analytics/consent, and complete physical-device,
accessibility, and cross-browser acceptance before the final release decision.
Status update 2026-08-31: CTA/Telegram, the canonical domain, and consent-gated
GA4 page views are complete; the real VEDOS, deferred backup/restore, and final
broad device/accessibility items remain.
