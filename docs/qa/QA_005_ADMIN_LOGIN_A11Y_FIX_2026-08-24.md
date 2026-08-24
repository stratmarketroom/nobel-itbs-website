# QA-005 Admin Login Accessibility Fix — 2026-08-24

Ticket: `QA-005-A11Y-FIX-001`

Environment: local repository and production build

## Summary

The missing Admin Login presentation layer is implemented. `/admin/login` now
uses the same restrained operational visual language as the protected admin
workspace, with a bounded responsive panel, explicit field and button states,
48 CSS-pixel minimum interactive targets, mobile-safe 16-pixel input text,
visible keyboard focus, responsive MFA enrollment content, and reduced-motion
handling.

The existing Supabase password, TOTP enrollment/challenge, AAL2 check, admin
context load, sign-out, and redirect workflow was preserved. The only component
semantic change is an alert role on the existing error message.

Code-level acceptance and the PR #25 Vercel Preview deployment check are
complete. The Preview URL is protected by Vercel SSO and redirected the
available signed-out browser to Vercel Login, so visual acceptance is deferred
to the public post-merge Production deployment. Local in-app browser navigation
to the placeholder-backed dev server was separately blocked by the Browser URL
policy; no visual result is inferred from either unavailable path.

## Files Changed

- `app/globals.css` — scoped Admin Login layout, control, state, responsive,
  focus, and reduced-motion styles;
- `components/admin-mfa-login.tsx` — alert semantics for the existing error
  message;
- `scripts/verify-qa-005-a11y-fix.mjs` — focused presentation, target-size,
  auth-contract, and secret-boundary regression guard;
- `package.json` — `verify:qa-005:a11y-fix` command;
- this report and directly related implementation-status, checklist,
  execution-sequence, and documentation-index records.

## Database Objects Changed

None. No migration, table, function, policy, grant, row, Auth user, Storage
object, secret, Supabase project setting, or Production configuration changed.

## Tests / Verification

Passed locally:

- `npm run verify:qa-005:a11y-fix`;
- `npm run verify:auth-007`;
- `npm run verify:admin-shell`;
- all 70 non-live `verify:*` package scripts;
- `npm run lint`;
- `npx tsc --noEmit`;
- `CONTENT_DATA_SOURCE=seed npm run build`, including 46/46 generated static
  pages;
- `git diff --check`.

Deployment evidence:

- PR #25 is open and reported clean/mergeable before the documentation update;
- the Vercel commit status completed with `success` for commit `67f72ae`;
- the Preview deployment completed with `success`;
- unauthenticated Preview navigation redirected to Vercel Login because the
  deployment is protected by Vercel SSO, so it is not represented as visual
  page acceptance.

The focused guard confirms that the password sign-in, authenticator assurance
level, TOTP challenge/verification, and `/admin/users` redirect contracts remain
present. It also guards the scoped CSS selectors, 48-pixel input/button minimums,
16-pixel input text, mobile breakpoint, reduced-motion rule, alert semantics,
and absence of server-only Supabase secret references in the client component.

Local browser acceptance was not completed: after the local page was made
renderable with non-secret placeholder public Supabase values, the in-app
Browser URL policy blocked navigation/reload. The browser viewport was reset and
the local server was stopped. No form was submitted.

## Security Notes

- no real email, password, TOTP code, session, or browser storage was used or
  inspected;
- no authentication, MFA, role, RLS, API, redirect, or session business logic
  was changed;
- no service-role or other server-only secret was added to browser code;
- the styles are scoped to the existing `auth-*` surface and do not alter public
  forms or protected admin modules;
- error output retains the existing safe application behavior and now announces
  dynamically to assistive technology through `role="alert"`.

## Deviations / Open Questions

- the Browser URL policy prevented local visual/reflow inspection; this is
  recorded as unavailable evidence, not a pass;
- Production Chromium measurements at desktop, 390-pixel, and 320-pixel widths
  are still required after merge; the SSO-protected Preview cannot provide the
  anonymous visual evidence;
- Safari, physical-device, full manual keyboard, and assistive-technology
  acceptance remain part of the broader QA-005 launch checklist and were not
  expanded into this focused correction ticket.

## Next Dependency

Update and merge PR #25 after its repeated Vercel check passes, then repeat the
focused `/admin/login` browser acceptance on the public Production deployment
without submitting credentials. Broader Safari, physical-device, keyboard, and
assistive-technology acceptance remains a later launch-readiness dependency.
