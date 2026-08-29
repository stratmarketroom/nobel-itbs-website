# ADM-EML-001 Email Template Admin Management

Date: 2026-08-29
Status: implementation complete; migration accepted in Development and Production; application deployment pending

## Summary

ADM-EML-001 adds the protected Release 1 manager surface for the existing
`credential_delivery` email templates in English and Ukrainian. Owner, Super
Admin, and Credential Manager can load and update the templates only with an
MFA/AAL2 session. Content Manager, anonymous users, and direct browser table
mutation remain denied.

The stored templates continue to be the defaults used by credential activation
and resend. Per-send subject/body editing remains available and does not mutate
the stored template. Dashboard and global Audit/History UI were not changed.

## Files Changed

- `app/admin/email-templates/page.tsx`;
- `app/api/v1/admin/email-templates/route.ts`;
- `app/api/v1/admin/email-templates/[id]/route.ts`;
- `components/admin-email-templates.tsx`;
- `components/admin-shell.tsx`;
- `lib/email-templates/admin.ts`;
- `lib/email-templates/input.ts`;
- `lib/email-templates/types.ts`;
- `lib/supabase/server.ts`;
- `app/globals.css`;
- `supabase/migrations/20260829140000_adm_eml_001_email_template_management.sql`;
- `supabase/tests/database/adm_eml_001_email_template_management.test.sql`;
- `scripts/verify-adm-eml-001.mjs` and directly related aggregate verifiers;
- `package.json`.

The stale WF-003 static expectation was aligned with the already accepted
versioned encryption-key lookup. Credential delivery business logic was not
changed.

## Database Objects Changed

Migration 67 adds:

- `public.update_email_template(uuid, text, text)`, a fixed-search-path
  `SECURITY DEFINER` workflow guarded by the shared role and MFA assertion;
- `internal.audit_email_template_change()`, which writes no message content;
- trigger `email_templates_audit_change` on `public.email_templates`.

No table, lifecycle state, template row, credential, learner, email-send row,
or public-verification behavior was added or changed.

## Development Acceptance

- exact identity guard matched `nobel-itbs-dev`
  (`flswzhgjbpagohbwehcz`);
- the pre-push dry run listed only migration
  `20260829140000_adm_eml_001_email_template_management.sql`;
- migration 67 applied successfully;
- repository and Development reached 67/67 migration parity;
- the second dry run reported the remote database up to date;
- hosted schema lint reported no errors;
- focused pgTAP passed 19/19 assertions, including Credential Manager AAL2
  success, Content Manager denial, AAL1 denial, idempotency, and audit privacy;
- the test-created pgTAP extension, Auth fixtures, template mutation, and audit
  row were all rolled back; post-test counts were zero and both release
  templates remained present.

## Production Acceptance

- exact identity guard matched `nobel-itbs-prod`
  (`szratzjodgiacvnhqmhx`);
- preflight confirmed 66 migrations ending at `20260829120000`, two existing
  release email templates, and zero learners, credentials, credential email
  sends, or prior `email_template.updated` events;
- the dry run listed only migration 67;
- migration 67 applied successfully and Production reached 67/67 parity;
- the second dry run was empty and hosted schema lint reported no errors;
- independent catalog checks confirmed fixed search path, `SECURITY DEFINER`,
  authenticated execute, anonymous/PUBLIC denial, no authenticated direct
  table update, and exactly one audit trigger;
- focused pgTAP passed 19/19 assertions inside a complete rollback;
- post-test checks confirmed no pgTAP extension, fixture user, fixture audit,
  test template content, or persisted template-update audit event;
- Production remained at two email templates and zero learners, credentials,
  and credential email sends.

## Local Verification

Passed:

- `npm run verify:adm-eml-001`;
- `npm run verify:wf-003` and `npm run verify:wf-004`;
- `npm run verify:qa-001` and `npm run verify:qa-003`;
- `npm run verify:admin-shell`;
- the focused PDFGEN/content-policy/security-rotation regressions;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build`;
- `git diff --check`.

The production build includes `/admin/email-templates`,
`/api/v1/admin/email-templates`, and
`/api/v1/admin/email-templates/[id]`.

## Security Notes

- The browser receives no service-role secret and uses the caller JWT.
- The API and database both enforce Owner/Super Admin/Credential Manager plus
  MFA/AAL2.
- Authenticated users retain read-only table access; mutation is possible only
  through the controlled function.
- Audit metadata contains only `template_key`, `language_code`,
  `subject_changed`, and `body_changed`; it excludes subject, body, recipients,
  tokens, storage paths, and rendered delivery content.
- Production secrets were read only from the ignored environment file and were
  not printed, copied, or committed.

## Deviations / Open Questions

- The Supabase CLI test runner still requires Docker even with `--db-url`.
  Hosted pgTAP was therefore executed through a transient PostgreSQL client.
  The normally local-only pgTAP extension was created inside the same
  transaction and rolled back in both environments; cleanup was verified.
- The Development CLI access token is stale, so the documented direct TLS
  pooler fallback was used with exact project identity guards.
- Application code has not yet been committed, reviewed in Preview, merged, or
  deployed. The Production database change is additive and remains compatible
  with the currently deployed application.

## Next Dependency

Open the ADM-EML-001 application PR, complete authenticated Owner/AAL2 Preview
UI/API acceptance at desktop and mobile widths, merge, and confirm the Vercel
Production deployment. Dashboard and global Audit/History must remain separate
tickets.
