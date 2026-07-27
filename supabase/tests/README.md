# Supabase Database Tests

This directory is reserved for Supabase database tests.

DBF-001 only verifies the local project foundation. Future tickets should add focused database tests alongside their migrations, including RLS and privacy checks where relevant.

When a ticket adds SQL objects, tests should cover the highest-risk behavior introduced by that ticket. For security-sensitive objects, include both allowed and denied access paths where practical.

See `docs/development/MIGRATION_STANDARDS.md` for the migration checklist and test expectations.
