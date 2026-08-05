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
- `20260727145835_auth_006_mfa_enforcement.sql`
- `20260803100000_cnt_001_languages.sql`
- `20260803110000_prg_001_programme_areas.sql`
- `20260804100000_prg_002_programme_types.sql`
- `20260804110000_prg_003_programme_core.sql`
- `20260804120000_prg_004_programme_runs.sql`
- `20260804130000_prg_005_pricing_options.sql`
- `20260804140000_prg_006_programme_catalogue.sql`
- `20260804150000_prg_007_seo_landing_pages.sql`
- `20260804160000_prg_008_slug_redirects.sql`
- `20260804170000_prg_009_programme_question_form.sql`
- `20260804180000_pce_001_partners.sql`
- `20260804200000_pce_002_experts.sql`
- `20260805090000_pce_004_contact_submissions.sql`
