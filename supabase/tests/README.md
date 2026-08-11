# Supabase Database Tests

This directory is reserved for Supabase database tests.

Supabase CLI database tests should live under `supabase/tests/database` and run with:

```sh
npm run supabase:test
```

DBF-001 only verifies the local project foundation. Future tickets should add focused database tests alongside their migrations, including RLS and privacy checks where relevant.

When a ticket adds SQL objects, tests should cover the highest-risk behavior introduced by that ticket. For security-sensitive objects, include both allowed and denied access paths where practical.

See `docs/development/MIGRATION_STANDARDS.md` for the migration checklist and test expectations.

Current database tests:

- `database/dbf_003_foundation.test.sql`
- `database/dbf_004_audit_foundation.test.sql`
- `database/auth_001_user_profiles.test.sql`
- `database/auth_002_multi_role_model.test.sql`
- `database/auth_003_owner_rules.test.sql`
- `database/auth_004_role_helpers.test.sql`
- `database/auth_006_mfa_enforcement.test.sql`
- `database/cnt_001_languages.test.sql`
- `database/prg_001_programme_areas.test.sql`
- `database/prg_002_programme_types.test.sql`
- `database/prg_003_programme_core.test.sql`
- `database/prg_004_programme_runs.test.sql`
- `database/prg_005_pricing_options.test.sql`
- `database/prg_006_programme_catalogue.test.sql`
- `database/prg_007_seo_landing_pages.test.sql`
- `database/prg_008_slug_redirects.test.sql`
- `database/prg_009_programme_question_form.test.sql`
- `database/pce_001_partners.test.sql`
- `database/pce_002_experts.test.sql`
- `database/pce_004_contact_submissions.test.sql`
