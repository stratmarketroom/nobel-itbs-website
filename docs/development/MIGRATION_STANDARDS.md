# Migration Standards

Status: mandatory for all Supabase/PostgreSQL migrations after DBF-002.

These standards implement the v2 SQL migration plan and security rules. They are intentionally conservative because later tickets will add sensitive admin, learner, and credential data.

## Naming Convention

Migration files must use:

```text
YYYYMMDDHHMMSS_ticket_id_short_description.sql
```

Examples:

```text
20260727120000_dbf_003_internal_schema_and_extensions.sql
20260727121500_auth_001_user_profiles.sql
```

Rules:

- Use UTC timestamp ordering.
- Use lowercase snake_case.
- Include the ticket ID immediately after the timestamp.
- Keep the description short and specific.
- Do not combine unrelated ticket work in one migration.

## SQL Rules

- One logical step per migration.
- Forward-only after production.
- Schema-qualified names for tables, views, types, policies, triggers, and functions.
- Fixed search_path for every function, preferably `set search_path = internal, public, pg_temp` or a narrower list.
- No secrets, service role keys, private tokens, or production credentials in SQL.
- No PUBLIC EXECUTE on sensitive functions.
- Revoke unsafe defaults when a migration creates sensitive functions or schemas.
- Use explicit grants instead of relying on broad defaults.
- Use comments on non-obvious database objects.

## RLS Rules

- RLS deny-by-default for sensitive tables.
- Enable RLS in the same ticket that creates a sensitive table unless the ticket explicitly says otherwise.
- Public direct access is forbidden for learner, credential, credential file, document number, audit, history, note, and email-send data.
- Policies must be role-specific and must not depend only on user-editable JWT metadata.
- Service-role workflows must still validate actor role, active status, and MFA where required.

## Function Rules

Every database function must:

- live in an explicit schema;
- set a fixed `search_path`;
- use clear volatility (`stable`, `immutable`, or `volatile`);
- avoid dynamic SQL unless strictly necessary;
- avoid logging raw tokens, secrets, MFA values, or private file paths;
- revoke `execute` from `public` if the function is not explicitly public-safe.

Sensitive functions must additionally:

- validate the actor;
- validate active admin status;
- validate role permissions;
- validate MFA/AAL where the security rules require it;
- write audit or history records where applicable.

## Migration Checklist

Use this checklist before opening a PR for any migration:

- [ ] Ticket ID is in the filename.
- [ ] Migration contains one logical step.
- [ ] File is forward-only and ordered after existing migrations.
- [ ] Object names are schema-qualified.
- [ ] Functions set fixed `search_path`.
- [ ] Sensitive functions do not allow PUBLIC EXECUTE.
- [ ] Sensitive tables have RLS enabled.
- [ ] RLS policies deny by default and grant only intended access.
- [ ] No Release 1 scope expansion is included.
- [ ] No programme, learner, credential, or integration objects are added outside their assigned tickets.
- [ ] No secrets or private keys are committed.
- [ ] Focused database tests or verification notes are included.
- [ ] Rollback / Remediation Note is added to the PR or ticket report.

## Rollback / Remediation Note

Migrations are forward-only once production exists. Every migration PR must describe how to remediate a failed deployment. Acceptable remediation notes include:

- a follow-up migration that corrects the issue;
- a manual database operation for local/staging only;
- a clear reason why no rollback is required because the migration only adds unused objects.

Do not delete or rewrite a migration after it has been shared or applied outside the local branch.

## Test Expectations

Early foundation tickets may use verification scripts when no SQL objects exist yet. Once migrations create database objects, add database tests where practical:

- clean migration chain;
- enum values and constraints;
- RLS access and denial cases;
- role helper behavior;
- privacy checks for public verification;
- lifecycle constraints for credentials.

Run the strongest available local verification before commit and report any missing tools honestly.
