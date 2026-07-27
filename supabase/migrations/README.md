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
