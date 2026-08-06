# Stage 2–4 E2E and RLS QA Report

Date: 2026-08-06
Scope: Auth/Admin Shell, structured content, programmes, partners, experts, current contact visibility, and site settings
Base commit: `5c2723e` (`STAB-012: enforce content MFA at API boundary`)

## Summary

The authenticated manager layer for Stages 2–4 passed its live dev QA. The final clean run completed 62 of 62 checks through real Supabase Auth sessions, protected Next.js admin APIs, direct role-bound Supabase queries, and the Owner user-management interface.

Temporary records were created only as drafts and removed during the same run. Temporary users were removed after their privileged roles were downgraded through the Owner UI. The dev database returned to its approved baseline.

## Role Coverage

| Role/session | Verified behaviour |
| --- | --- |
| Unauthenticated | Admin API returns `401`. |
| Owner/AAL2 | Created test users, assigned roles, deactivated/reactivated a user, changed a Super Admin role before deletion, and retained the single-Owner rule. |
| Content Manager | Managed structured content, taxonomy, programmes, runs, pricing, partners, and experts; could not access contacts, users, settings, or the audit log directly. |
| Super Admin/AAL1 | Blocked from MFA-protected content and programme operations. |
| Super Admin/AAL2 | Read content/settings/contacts and mutated the temporary programme; direct RLS mutation succeeded. |
| Credential Manager/AAL1 | Blocked from programme reference access until MFA was satisfied. |
| Credential Manager/AAL2 | Read published programme references and contacts; content/user access and programme mutations were denied. |
| Anonymous | Programme mutation was denied by grants/RLS. |

The earlier role pass also covered the combined Content Manager + Credential Manager account and confirmed that permissions are additive while MFA remains mandatory for the sensitive role.

## CRUD Coverage

The clean E2E run created, updated, read, and deleted:

- one draft programme area and EN draft translation;
- one draft programme type and EN draft translation;
- one draft programme and EN draft translation;
- one programme run, including status update;
- three pricing options and one pricing translation;
- one draft partner and EN draft translation;
- one draft expert and EN draft translation.

The approved About EN structured content was saved without changing its approved values, confirming the controlled-field update path. The current site-setting value was saved unchanged through a Super Admin AAL2 session, confirming authorization and audit behaviour without changing the configured business value.

## Negative and Boundary Checks

Passed checks included:

- duplicate taxonomy slug rejection;
- record/translation mixed-mutation rejection;
- invalid run date-range rejection;
- fourth pricing option rejection after the allowed three;
- invalid partner asset-path rejection;
- Content Manager denial for contacts, users, settings, and direct audit writes;
- Credential Manager denial for content, users, and programme mutation;
- Super Admin and Credential Manager AAL1 denial before MFA;
- anonymous programme-write denial.

## RLS and Audit

Direct Supabase queries confirmed:

- Content Manager can mutate programme data;
- Super Admin at AAL2 can mutate programme data;
- Credential Manager can read published programme reference data but cannot mutate it;
- Content Manager cannot see a protected contact fixture;
- Super Admin and Credential Manager at AAL2 can see the protected contact fixture;
- direct Content Manager writes to `audit_log` are rejected;
- admin mutations generated audit records.

## pgTAP Runner Limitation

All current SQL test files are transaction-wrapped and end with `ROLLBACK`. A linked `supabase test db` run was attempted, but the installed Supabase CLI still requires Docker to launch its pgTAP runner. Docker and `psql` are not installed in this workspace.

This report therefore closes the Stage 2–4 authenticated manager/RLS pass using live role sessions and direct RLS queries. The full automated SQL suite remains an infrastructure follow-up and must be run when a Docker- or pgTAP-capable runner is available.

## Cleanup Verification

Final dev state:

- auth users: 1 Owner;
- programmes: 5;
- programme areas: 3;
- programme types: 3;
- programme runs: 5;
- pricing options: 0;
- partners: 5;
- experts: 3;
- content pages: 7;
- remaining `qa-*` entity slugs: 0.

Audit records intentionally remain append-only and contain no passwords, MFA secrets, or raw tokens.

## Result

Stages 2–4 manager operations and current RLS boundaries are accepted at the dev level. Remaining blockers are operational values and integrations: final application URLs, contact-form scope, production CAPTCHA/rate limiting, and Google Workspace notification delivery.
