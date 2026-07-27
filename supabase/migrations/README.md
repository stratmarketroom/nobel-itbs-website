# Supabase Migrations

This directory is reserved for forward-only SQL migrations.

DBF-001 intentionally does not create database objects. Future migrations must follow the v2 migration plan:

- one logical step per migration;
- naming format: `YYYYMMDDHHMMSS_ticket_id_short_description.sql`;
- schema-qualified names;
- fixed `search_path` for functions;
- RLS deny-by-default for sensitive tables;
- no programme, learner, credential, or integration tables before their assigned tickets.

See `docs/development/MIGRATION_STANDARDS.md` before adding any `.sql` file.

Current foundation migrations:

- `20260727104215_dbf_003_internal_schema_and_extensions.sql`
- `20260727105232_dbf_004_audit_foundation.sql`
- `20260727111852_auth_001_user_profiles.sql`
- `20260727112603_auth_002_multi_role_model.sql`
- `20260727114756_auth_003_owner_rules.sql`
- `20260727145222_auth_004_role_helpers.sql`
