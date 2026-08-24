# QA-005 Admin Login Accessibility Fix — 2026-08-24

Ticket: `QA-005-A11Y-FIX-001`

Environment: local repository, PR #25 Vercel Preview, and Vercel Production

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

Code-level and deployed acceptance are complete. PR #25 passed its repeated
Vercel Preview deployment check, was merged as `083b045`, and its Production
deployment completed successfully. The public Production `/admin/login` passed
the focused desktop, 390-pixel, and 320-pixel browser checks without submitting
the form or using credentials.

The Preview URL is protected by Vercel SSO and redirected the available
signed-out browser to Vercel Login, so no visual pass is inferred from Preview.
Local in-app browser navigation to the placeholder-backed dev server was
separately blocked by the Browser URL policy. The public Production evidence is
the final deployed acceptance source for this correction.

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

- PR #25 reported clean/mergeable and both of its Vercel deployments completed
  with `success` for implementation commit `67f72ae` and documentation commit
  `a055ff4`;
- PR #25 was merged as `083b045d27a81535b90466c096c3241779bcf584`;
- the merge commit's Vercel Production deployment completed with `success`;
- unauthenticated Preview navigation redirected to Vercel Login because the
  deployment is protected by Vercel SSO, so it is not represented as visual
  page acceptance;
- public Production `/admin/login` rendered the scoped visual layer with one
  `main`, one H1, one named region, and accessible Email, Password, and Sign in
  controls;
- at 1280 CSS pixels, the panel was 496 pixels wide, both inputs and the submit
  button were 48 pixels high, input text was 16 pixels, and document width
  equalled viewport width;
- at 390 CSS pixels, the panel was 358 pixels wide, controls were 316 by 48
  pixels, input text was 16 pixels, and document width equalled viewport width;
- at 320 CSS pixels, the panel was 288 pixels wide, controls were 246 by 48
  pixels, input text was 16 pixels, and document width equalled viewport width;
- Email, Password, and Sign in each exposed a visible 3-pixel solid focus
  outline with a 3-pixel offset;
- a fresh Production browser tab produced no application console warnings or
  errors at the checked widths;
- the temporary viewport override was reset after acceptance.

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
- Safari, physical-device, full manual keyboard, and assistive-technology
  acceptance remain part of the broader QA-005 launch checklist and were not
  expanded into this focused correction ticket.

## Next Dependency

The focused correction ticket is closed. Broader Safari, physical-device,
complete manual keyboard traversal, and assistive-technology acceptance remains
a later QA-005 launch-readiness dependency. The next one-ticket operational item
should be the setup-time Telegram group invitation-link rotation unless the
Owner chooses to resume the deferred real VEDOS credential-delivery acceptance.
