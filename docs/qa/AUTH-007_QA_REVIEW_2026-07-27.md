# AUTH-007 QA Review

Date: 2026-07-27

Branch:

- `codex/auth-007-mfa-login-ui`

## Current Alignment Note

This file preserves the browser result observed on 2026-07-27, when successful
authentication navigated to `/admin/users`. Since the role-aware Dashboard was
introduced, the current post-login contract is `/admin`, which is accessible to
every Release 1 admin role and then exposes only the modules allowed by that
role. `AUTH-007-QA-FIX` aligned the static verifier with that current contract on
2026-09-01; authentication, MFA, role checks, and protected-data loading were
not changed.

Scope:

- Admin login route.
- Supabase Auth password sign-in.
- TOTP MFA enrollment and challenge UI.
- Browser-safe Supabase client.
- AAL1/AAL2-sensitive admin access behavior.

## Result

Status: Passed with no open blocking findings.

## Manual Browser Smoke

Completed through the in-app browser:

- Opened `/admin/login`.
- Signed in as the dev Owner.
- Completed TOTP MFA enrollment through QR code.
- Verified the TOTP code.
- Confirmed redirect to `/admin/users`.

Observed result:

- `/admin/login` reached MFA setup.
- QR code rendered successfully after the data-SVG rendering fix.
- At the time of this review, the flow completed and navigated to
  `/admin/users`. The current role-safe landing is `/admin`; see the alignment
  note above.

## Remote Auth Edge Checks

Executed against the Supabase dev project using local `.env.local` values without printing secrets.

Results:

- Wrong password: blocked with `Invalid login credentials`.
- Fresh Owner sign-in: succeeds with session token.
- Fresh session assurance: `current=aal1`, `next=aal2`.
- TOTP factors: `total=1`, `verified=1`, `unverified=0`.
- Fresh AAL1 session calling `/api/v1/admin/users`: blocked with HTTP `403`.
- Wrong TOTP code: blocked with `Invalid TOTP code entered`.

## Automated Verification

Passed:

- `npm run verify:auth-007`
- `npm run verify:auth-005`
- `npm run verify:auth-003`
- `npm run lint`
- `npm run build`
- `npm audit --omit=dev`

## Security Notes

- Browser code uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- No service role, Supabase access token, database password, or development password is referenced in browser code.
- Admin user management remains blocked for fresh AAL1 sessions.
- Unfinished TOTP enrollment factors are cleaned up before retrying enrollment for the same admin factor name.

## Residual Risks

- Full browser automation with a live TOTP code was not automated because the one-time code is generated outside the test runner.
- Current `/admin/users` page is still a foundational/static admin surface, not the final interactive user-management UI.
- The visual language is functional only. Product and design context should be formalized before broader public-site or admin UI design work.

## Next Step

Proceed tomorrow with:

- `PRODUCT.md`
- `DESIGN.md`
- initial design-system direction for public site and admin UI.
