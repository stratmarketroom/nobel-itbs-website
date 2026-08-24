# QA-005 Backup and Restore Readiness — 2026-08-24

Ticket: `QA-005-BACKUP-001`

## Summary

The production database and private credential Storage backup boundary is now
documented as an explicit launch gate. The runbook separates PostgreSQL recovery
from private-PDF object recovery, defines provisional RPO/RTO targets, limits
backup access, and requires every restore drill to use a new non-production
project with outbound integrations disabled.

The live read-only audit did not accept Production for launch. The Nobel ITBS
Supabase organisation remains on Free, has no scheduled database backups, and
has no payment method. The private `private-credentials` bucket is correctly
configured and currently empty, but no independent encrypted object-backup
destination has been approved.

## Files Changed

- `docs/development/SUPABASE_BACKUP_AND_RESTORE.md`;
- `scripts/verify-qa-005-backup-readiness.mjs`;
- `package.json`;
- directly related documentation index, implementation status, and master
  checklist records;
- this QA report.

## Database Objects

None. No migration, policy, grant, database row, Auth user, Storage bucket,
Storage object, secret, billing setting, or production configuration was
changed.

## Tests / Verification

Read-only Supabase Dashboard evidence:

- project `nobel-itbs-prod` (`szratzjodgiacvnhqmhx`) is healthy in Frankfurt;
- organisation plan is Free;
- Production overview reports no backups;
- Database > Backups reports that Free includes no project backups and Pro
  provides scheduled backups retained for seven days;
- the Pro plan displayed by the organisation starts at USD 25 per month;
- the organisation currently has no payment method;
- `private-credentials` remains private, PDF-only, limited to 20 MB, has zero
  browser policies, and contains no objects.

Repository verification:

- `npm run verify:qa-005:backup-readiness`;
- `backups/` remains Git-ignored;
- the focused verifier enforces the documented database/Storage split,
  production-target guard, private-PDF privacy, access limits, RPO/RTO, restore
  reconciliation, secret handling, and explicit launch blockers.

Passed after the ticket changes:

- all 66 non-live `verify:*` package scripts: 66 passed, 0 failed;
- `npm run lint`;
- `npx tsc --noEmit`;
- `CONTENT_DATA_SOURCE=seed npm run build` (46/46 static pages generated).

## Security Notes

- Supabase database backups include Storage metadata but not Storage object
  bytes. A database-only recovery can therefore leave credential metadata
  pointing to missing PDFs.
- Supabase Storage does not provide object versioning; a deleted source object
  cannot be recovered without an independent object copy.
- Backup archives contain Auth data, learner/contact data, credentials, audit
  records, and potentially private PDFs. Access is limited to Owner/Super Admin
  operations and secrets/archives must never enter Git or logs.
- Restore drills must keep email, Telegram, webhooks, callbacks, and public
  traffic disabled to prevent messages or actions from replayed data.
- The restored application also requires the existing external secret set,
  including credential token HMAC/encryption material; secret values are not
  part of this report.

## Deviations / Open Questions

- The previously approved launch baseline of Supabase Pro daily backups with
  seven-day retention cannot be activated without adding a payment method and
  explicitly approving a plan starting at USD 25 per month.
- The private-PDF destination and retention period affect cost, data protection,
  and subprocessors. They require Owner/legal approval; this ticket does not
  invent or activate a vendor.
- Database RPO <= 24 hours, private-PDF RPO <= 24 hours, database-only RTO of
  8 hours, and full recovery RTO of 24 hours are provisional internal targets
  pending Owner approval and measurement in a restore drill.
- Docker, `psql`, `rclone`, and AWS CLI are not available in this workspace, so
  no local logical restore or S3-compatible object-copy drill was represented as
  completed.
- A safe Supabase **Restore to a New Project** drill requires Pro physical
  backups and creates a separately billed project. It was not started without
  billing approval.

## Next Dependency

The Owner must add a billing method and approve upgrading the Nobel ITBS
Supabase organisation to at least Pro. After the first successful daily backup,
approve an encrypted independent private-PDF destination and retention, then
run the documented restore drill into a new non-production project. Backup
readiness remains a launch blocker until that evidence passes.
