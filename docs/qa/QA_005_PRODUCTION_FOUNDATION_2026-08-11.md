# QA-005 Production Foundation — 2026-08-11

## Summary

The separate `nobel-itbs-prod` Supabase project is initialized in the Frankfurt region and now has the complete ordered migration chain. Production and dev each match all 47 local migrations through `20260811120000_qa_005_restore_partnership_service_grants.sql`.

Production is not launch-ready yet. This checkpoint accepts only the Supabase production foundation, initial data, anonymous RLS boundary, and server access required by the existing application. Vercel configuration, production Auth bootstrap/MFA, external integrations, domain, backups, and final browser acceptance remain open QA-005 work.

## Files Changed

- `supabase/migrations/20260811120000_qa_005_restore_partnership_service_grants.sql`
- `scripts/verify-qa-005-production-grants.mjs`
- `scripts/verify-qa-005-production-grants-live.mjs`
- `package.json`
- this QA report and the current planning/status documents

No environment file or secret is committed.

## Database Objects

The migration adds explicit `select`, `insert`, `update`, and `delete` table privileges for `postgres` and `service_role` on:

- `public.partners`;
- `public.partner_translations`;
- `public.experts`;
- `public.expert_translations`.

PCE-001 and PCE-002 already provided anonymous published reads, authenticated role-scoped manager policies, enabled/forced RLS, and approved seed data. They omitted the explicit table privileges required by a Supabase server key. The new forward-only migration corrects only that omission. It changes no RLS policy, public grant, authenticated grant, schema, or stored data.

## Tests / Verification

Passed locally:

- ESLint;
- TypeScript `--noEmit`;
- PCE-001 and PCE-002 focused verifiers;
- QA-001 aggregate static verifier;
- QA-005 production-grant static verifier;
- whitespace/diff validation.

Passed against production:

- dry-run listed exactly one pending migration before deployment;
- migration applied successfully;
- local/remote migration parity is 47/47;
- second dry-run reported the remote database up to date;
- anonymous QA-001 boundary: 18 public reads, 18 private-table denials, and two service-only RPC denials;
- server-key read smoke passed for all four partnership tables;
- approved initial counts were observed: 3 languages, 3 programme areas, 3 programme types, 5 programmes, 5 runs, 5 partners, 3 experts, and 7 content pages;
- private learner, credential, document-number, and production user-profile registries remain empty.

The same migration and server-key smoke test passed against dev. The local Supabase CLI was relinked to dev after the production work.

## Security Notes

- The service key remains server-only and is absent from public loaders and committed files.
- Public partner/expert loaders continue to use the browser-safe publishable key and existing RLS policies.
- The migration does not grant new rights to `public`, `anon`, or `authenticated`.
- No credential, learner, document-number, Auth user, or private Storage record was created.
- Production secrets are stored only in ignored local environment storage pending entry into Vercel's encrypted environment settings.

## Deviations / Open Questions

- The Owner approved VEDOS SMTP for credential delivery instead of Google Workspace. Current v2 baseline and WF-003 code still specify Google Workspace. This is an explicit documentation/code alignment ticket before real delivery testing; it was not changed inside this database-foundation correction.
- CAPTCHA remains conditionally disabled by Owner decision and is not a blocker unless abuse signals require it.
- The Supabase Free plan currently has no production backup retention shown in the project dashboard. The approved launch baseline is Supabase Pro daily backups with seven-day retention; private Storage PDFs require a separate backup/export procedure because database backups do not contain Storage objects.
- Final Leeloo/partner URLs, Telegram manager notification, analytics, and the canonical domain are still external launch inputs.

## Remediation Note

The migration is forward-only and additive. If a privilege defect is found, correct it with a new forward-only migration. Rewriting the applied migration or broadly revoking server access would make production history diverge or restore the original server-operability failure.

## Next Dependency

Configure the existing Vercel project with production-only Supabase and application secrets, deploy a preview/production build, then configure production Supabase Auth URLs and bootstrap the single production Owner with MFA. Do not connect the public domain until that deployment passes protected-admin, public-content, verification, and responsive browser smoke tests.
