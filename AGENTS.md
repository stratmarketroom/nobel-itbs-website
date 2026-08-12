# AGENTS.md

Project: Nobel ITBS Website and Credential Registry

This file must be read first by every agent working in this repository.

## 1. Source of Truth

Implementation baseline is the v2 documentation:

- `docs/README.md`
- `docs/product/PRODUCT_DECISIONS_SPEC_ALIGNMENT_v2.md`
- `docs/product/RELEASE_1_SCOPE_v2.md`
- `docs/product/SITEMAP_AND_USER_FLOWS_v2.md`
- `docs/product/CREDENTIAL_MODULE_SPECIFICATION_v2.md`
- `docs/technical/DATABASE_SCHEMA_v2.md`
- `docs/technical/API_SPECIFICATION_v2.md`
- `docs/technical/RLS_AND_PERMISSIONS_SPECIFICATION_v2.md`
- `docs/technical/SQL_MIGRATION_PLAN_v2.md`
- `docs/planning/IMPLEMENTATION_PLAN_RELEASE_1.md`
- `docs/planning/CODEX_TICKET_PACK_v2.md`

Original v1 documents in `docs/source/v1/` are archived references only. Do not implement from v1 when v2 exists.

If v1 and v2 conflict, v2 wins.

If docs and code conflict, report the conflict before changing business logic.

## 2. Required Agent Instructions

Read these before implementation work:

- `docs/planning/AGENT_OPERATING_MANUAL.md`
- `docs/planning/AGENT_PROMPT_TEMPLATE.md`
- `docs/planning/AGENT_EXECUTION_SEQUENCE.md`
- `docs/design/DESIGN_GUIDELINES.md`
- `docs/design/HOME_VISUAL_BASELINE.md`
- `docs/security/SECURITY_IMPLEMENTATION_RULES.md`

## 3. Work Method

Work one ticket at a time.

Do not implement adjacent modules "while already there".

Do not expand Release 1 scope.

Do not modify `docs/source/v1/` except to add archival notes if explicitly requested.

Each ticket must end with:

- summary;
- files changed;
- database objects changed, if any;
- tests/verification;
- security notes;
- deviations or open questions;
- next dependency.

## 4. Technical Baseline

Expected stack:

- Next.js;
- TypeScript;
- Supabase;
- PostgreSQL;
- Supabase Storage;
- Gmail / Google Workspace for credential email sending.

Use migrations for database changes.

Use RLS deny-by-default.

Never expose service role to browser code.

## 5. Product Rules That Must Not Be Broken

- Languages: English no prefix, Ukrainian `/ua`, Czech `/cz`.
- News/Blog is out of Release 1.
- Public programme catalogue launches without visible filters.
- Programmes are sales-oriented pages.
- Public verification supports document number and QR token only.
- No name/surname public verification in Release 1.
- No public PDF download in Release 1.
- Partners never appear in credential verification.
- Credential statuses are `pending`, `valid`, `revoked`, `voided`.
- No Release 1 credential `expired`, `cancelled`, or public `reissued` lifecycle.
- Public verification shows document details only for `valid`.
- `revoked` shows status only.
- `pending` and `voided` behave as not found publicly.
- Credential numbers are never reused.
- Activation succeeds even if email sending fails.
