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
