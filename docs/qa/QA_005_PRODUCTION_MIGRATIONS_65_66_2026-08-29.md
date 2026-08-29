# QA-005-PROD-MIG-002 Production Migration Promotion 65–66

Date: 2026-08-29
Status: complete in Production

## Summary

The two forward-only migrations already accepted in hosted Development were
promoted in order to `nobel-itbs-prod` (`szratzjodgiacvnhqmhx`). Repository,
Development, and Production now have exact 66/66 migration parity. The
post-push dry run reports no pending migration and hosted schema lint reports no
error.

Production contained no learner, credential, template, generation, activation,
or credential-email rows before the promotion and still contains none. The
release installed the controlled token-rotation boundary without rotating token
material, and installed the synthetic-QA activation guard without locking a
Production batch or writing a lock audit event.

PR #48 had already merged the matching application code into `main` as
`e0e5843`; its automatic Vercel Production deployment
`DUnxwq9cEb8NwtnkmG8iJdC8Pkk2` completed before this schema promotion. This
ticket restored exact application/database schema parity without another
application change.

## Scope

Promoted, in order:

1. `20260829100000_sec_001_credential_token_rotation.sql`;
2. `20260829120000_pdfgen_008_qa_cohort_activation_guard.sql`.

Out of scope:

- rotating Production credential-token or Supabase API keys;
- creating a learner, credential, number, template, batch, PDF, activation, or
  email row;
- creating a synthetic QA cohort in Production;
- real credential activation or VEDOS delivery;
- changing Production environment variables;
- backup activation or a restore drill.

## Files Changed

- this acceptance report;
- `docs/README.md`;
- `docs/development/IMPLEMENTATION_STATUS.md`;
- `docs/planning/AGENT_EXECUTION_SEQUENCE.md`;
- `docs/planning/PROJECT_MASTER_CHECKLIST.md`.

No application, migration, test, script, or configuration file changed in this
promotion ticket.

## Database Objects Changed

Migration 65:

- replaces `internal.enforce_credential_lifecycle()` with the controlled,
  strictly advancing token-key-version guard;
- adds service-only
  `public.rotate_credential_token_material_batch(integer, integer, jsonb)`;
- preserves denial for `public`, `anon`, and `authenticated` execution.

No credential row existed, so no token hash, ciphertext, key version, document
number, lifecycle status, QR URL, or audit row was changed.

Migration 66:

- adds `credential_generation_batches.activation_blocked boolean not null
  default false` and `activation_block_reason text null` with paired-state
  consistency;
- replaces the generation-batch identity and audit functions to make a block
  irreversible and audit only its machine reason;
- adds synthetic-cohort marking and fail-closed activation/delivery trigger
  functions;
- adds triggers at batch-item insertion, activation-request insertion,
  activation-item processing, credential activation, and email-send insertion.

Production contained no generation batches or synthetic Development markers, so
the migration backfill updated zero operational rows.

## Tests / Verification

Preflight:

- Production identity guard matched project `szratzjodgiacvnhqmhx`;
- learners, credentials, Template Packages, generation batches/items,
  activation requests/items, and credential email sends were all zero;
- the exact dry run listed only migrations 65 and 66 in order;
- the migration-65 and migration-66 static verifiers passed.

Promotion and post-deploy:

- both migrations applied successfully;
- the expected PostgreSQL identifier-truncation notice for the long
  activation-request trigger name matched Development and did not prevent
  creation;
- migration ledger reports exact local/remote matches for all 66 versions,
  ending at `20260829120000`;
- the second dry run reports `Remote database is up to date`;
- hosted `db lint --level error` reports `No schema errors found`;
- PostgREST can read the two new batch-lock columns;
- all preflight-zero table counts remain zero;
- Production Home returned HTTP `200`;
- Production Admin Login returned HTTP `200`;
- unauthenticated batch-generation API access returned the expected HTTP `401`;
- PR #48 passed 2/2 checks, merged without conflict, and merge commit `e0e5843`
  passed its 1/1 Vercel Production deployment check.

## Security Notes

- Production secrets were read only from the ignored
  `.env.production.local`; no value was printed, copied into the repository, or
  committed.
- Every remote command verified the exact Production project ref before
  connecting through the Frankfurt TLS pooler.
- Migration 65 does not rotate data by itself; its mutation function remains
  service-only, bounded, version-advancing, and count-only audited.
- Migration 66 is database-enforced and does not rely on UI hiding.
- No raw verification token, ciphertext, HMAC, private path, PDF byte, learner
  identity, contact detail, SMTP credential, or service-role key entered the
  evidence.
- Production environment variables and API keys were not changed.

## Deviations / Open Questions

- The optional independent schema dump could not run because the local
  Supabase CLI requires an available Docker Desktop for that command. Its empty
  temporary output file was removed. Exact 66/66 ledger parity, a no-pending
  dry run, hosted lint, successful migration execution, PostgREST column
  access, unchanged row counts, and HTTP smoke provide the acceptance evidence.
- The organisation remains on the documented Supabase Free/no-daily-backup
  state. This promotion was accepted because all affected Production registries
  are empty and both migrations are forward-only. Backup activation and a
  restore drill remain mandatory before operational issuance.
- Production credential-token and Supabase API-key rotation was not required:
  Production has zero credentials and this ticket promoted the controlled
  rotation capability, not Development secret values.

## Next Dependency

The next credential operational gate is one explicitly approved real
complete-package activation and VEDOS delivery acceptance with an authorized
MFA actor. Production backup/restore readiness must be activated before real
credential issuance.
