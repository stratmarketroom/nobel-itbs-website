# ADM-DSH-001 Admin Dashboard QA

Date: 2026-08-29  
Ticket: `ADM-DSH-001`  
Implementation PR: [#52](https://github.com/stratmarketroom/nobel-itbs-website/pull/52)  
Merge commit: `8ce0078fbd52e6b4465cb044fdf2c1831b3c757f`

## Scope

This ticket adds the Release 1 protected Dashboard only:

- `/admin` as the shared role-safe landing route;
- `GET /api/v1/admin/dashboard` as a read-only role-aware aggregate;
- content readiness for Owner, Super Admin, and Content Manager;
- contact/learner/credential operations for Owner, Super Admin, and Credential Manager;
- responsive desktop/mobile operational UI;
- successful login/MFA redirects to `/admin` instead of the Owner/Super Admin-only users module.

Global Audit/History is explicitly outside this ticket and remains separate.

## Source Alignment

The v2 sitemap and Release 1 checklist require a Dashboard route, role-aware summary,
and authenticated smoke, but do not prescribe its exact metrics. The implementation
therefore uses the smallest useful aggregate of existing Release 1 states:

- programme publication and missing/draft translation counts;
- new contact submissions;
- active/archived learners;
- `pending`, `valid`, `revoked`, and `voided` credential counts.

No new business state, workflow, or adjacent module was added.

## Files Changed

- `app/admin/page.tsx`
- `app/api/v1/admin/dashboard/route.ts`
- `components/admin-dashboard.tsx`
- `components/admin-shell.tsx`
- `components/admin-mfa-login.tsx`
- `lib/dashboard/admin.ts`
- `lib/dashboard/types.ts`
- `app/globals.css`
- `scripts/verify-adm-dsh-001.mjs`
- `package.json`
- focused v2 API/status/checklist documentation

## Database Objects

None. No migration was created or applied. The Dashboard performs count-only reads
against existing tables with the caller JWT and existing RLS.

## Security Acceptance

- The summary service uses `getSupabaseRequestClient(context.accessToken)`.
- It does not use the service role or expose it to browser code.
- Content Manager receives only content/programme aggregates.
- Credential Manager receives only contact/learner/credential aggregates.
- Owner and Super Admin receive both sections.
- Any account holding an MFA-required role must have an AAL2 session.
- The response contains counts only: no learner names, contact details/messages,
  credential holder data, document numbers, tokens, storage paths, email content,
  notes, reasons, or audit payloads.
- Unauthenticated Preview UI loaded only the sign-in-required state and no aggregate.
- Unauthenticated local dashboard API returned `401` with `Bearer session is required.`
- Production Owner/AAL2 acceptance was read-only; refresh caused no data mutation.

## Verification

Passed locally:

- `npm run verify:adm-dsh-001`
- `npm run verify:admin-shell`
- `npx tsc --noEmit`
- `npm run lint` — 0 errors; one pre-existing `window.location.assign()` warning observed
  only with the transient local Next.js 16.3.3 installation
- `npm run build` — success; `/admin` and `/api/v1/admin/dashboard` included
- `git diff --check`

Vercel/GitHub:

- PR #52 was clean and mergeable.
- Vercel Preview deployment `FKwnbGsiutASLVNEAuDZ6uDTYbvA` reached Ready.
- Merge commit Production deployment `GJNkk4Tuxf82zsuNttzZb8MziMyz` completed successfully.

Authenticated Production Owner/AAL2 smoke on
`https://nobel-itbs-website.vercel.app/admin`:

- Dashboard route and active navigation loaded successfully;
- Owner and `MFA verified` account context remained visible;
- live totals loaded: 5 programmes, all 5 published, 0 draft, 0 archived;
- content-page and programme translations needing attention both returned 0;
- new submissions, learners, and all credential lifecycle counts returned 0;
- manual `Refresh summary` completed and returned the same live totals;
- no error alert and no browser console/network diagnostic entries;
- 390 px and 320 px viewports had exact viewport/body/document width parity and no
  page-level horizontal overflow;
- refresh action measured 48 px high and every Dashboard quick action measured at
  least 44 px high.

The browser had automatic translation enabled during part of visual QA; stored product
copy and implementation remain English, and the first unmodified DOM snapshot confirmed
the expected English labels.

## Deviations And Open Questions

- No product deviation.
- The exact metric set was not enumerated by v2; the count-only set above is an
  intentionally minimal interpretation of the documented role-aware summary.
- Separate Content Manager and Credential Manager live browser accounts were not used
  in Production. Their response split is enforced in server code, existing table RLS,
  shared route access, and the focused static gate; Owner/AAL2 exercised both branches.

## Next Dependency

Global Audit/History remains the next separate Release 1 admin ticket. Real credential
activation/VEDOS delivery and backup/restore remain deferred by the Owner until real
learners and documents exist.
