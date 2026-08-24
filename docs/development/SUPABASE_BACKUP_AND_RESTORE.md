# Supabase Backup and Restore Runbook

Project: Nobel ITBS Website and Credential Registry  
Ticket: `QA-005-BACKUP-001`  
Status: launch-blocking operational baseline  
Last reviewed: 2026-08-24

## 1. Purpose and scope

This runbook covers disaster recovery for the Release 1 production data held in:

- the `nobel-itbs-prod` PostgreSQL database, including Auth data and Storage
  metadata;
- the private `private-credentials` Supabase Storage bucket containing current
  credential PDFs;
- the deployment secrets and provider settings required to make a restored
  database usable without exposing private data.

It does not create a public PDF path, retain old credential PDF versions, add a
new credential lifecycle, or replace the forward-only migration history.

## 2. Current production finding

The read-only Dashboard audit on 2026-08-24 found:

- project: `nobel-itbs-prod` (`szratzjodgiacvnhqmhx`), Frankfurt;
- project health: healthy;
- organisation plan: Free;
- scheduled database backups: none;
- `private-credentials`: private, PDF-only, 20 MB per object, no browser Storage
  policies, and currently empty.

The Free plan is not an accepted launch state. Supabase documents automatic
daily backups for Pro, Team, and Enterprise projects. Pro retains seven daily
backups. Database backups contain Storage metadata but do not contain Storage
object bytes, so the database and private PDFs need separate, timestamp-aligned
backup paths.

Primary references:

- <https://supabase.com/docs/guides/platform/backups>
- <https://supabase.com/docs/guides/platform/clone-project>
- <https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore>
- <https://supabase.com/docs/guides/storage/management/download-objects>
- <https://supabase.com/docs/guides/storage/s3/compatibility>

## 3. Launch gate and recovery objectives

Production credential issuance must not begin until all launch-gate items below
are satisfied:

1. Upgrade the Nobel ITBS Supabase organisation to at least Pro.
2. Confirm that the Production Backups page shows a successful daily backup.
3. Approve an independent encrypted destination for private PDF exports.
4. Configure a daily export of `private-credentials` and retain its integrity
   manifest with the object copy.
5. Complete a restore drill into a new non-production project.
6. Record evidence without secrets, PDF bytes, learner contact data, raw QR
   tokens, or private Storage paths.

Provisional Release 1 objectives, pending Owner approval:

- database RPO: at most 24 hours;
- private-PDF RPO: at most 24 hours and no newer than the selected database
  recovery point;
- database-only RTO target: 8 hours;
- full database plus private-PDF RTO target: 24 hours.

The provider does not guarantee these internal RTO targets. A restore drill must
measure and replace the estimates with observed times.

## 4. Ownership and access

- Business approval and billing: Owner.
- Backup configuration and daily evidence review: Owner or Super Admin.
- Restore execution: two-person operation involving the Owner and one Super
  Admin or explicitly appointed infrastructure operator.
- Credential Manager and Content Manager do not receive database credentials,
  Storage-wide credentials, or backup archives.

Backup credentials are production secrets. Keep them only in the approved
secret manager or password manager. Never place connection strings, database
passwords, Supabase access tokens, service-role keys, S3 keys, Vercel secrets,
or backup archives in Git, CI logs, tickets, or screenshots.

## 5. Backup policy

### 5.1 PostgreSQL

Required primary control:

- Supabase Pro daily physical backup;
- minimum retention: the seven daily restore points included with Pro;
- daily check that the newest backup is successful and less than 24 hours old;
- alert/escalate if the newest successful backup is older than 24 hours.

Required portable recovery control:

- before a high-risk production migration or bulk import, create an encrypted
  logical export with the Supabase CLI using the official `roles.sql`,
  `schema.sql`, and `data.sql` sequence;
- keep the export outside the repository under an access-controlled backup
  location;
- preserve `supabase_migrations` history when the recovery target is a new
  project;
- compute SHA-256 checksums for every export and store them in a signed or
  access-controlled manifest.

The local `backups/` path remains Git-ignored. A local copy is working material,
not the independent retained backup.

### 5.2 Private credential PDFs

Required control:

- export `private-credentials` at least daily to an Owner-approved encrypted
  destination independent of the source project;
- preserve exact object keys, byte size, MIME type, SHA-256 checksum, export
  time, and source project ref in an encrypted/access-controlled manifest;
- restrict the export identity to server-side operations; never expose a
  service-role or S3 key to browser code;
- compare exported object counts with database `credential_files` metadata;
- fail the backup when an expected current object is missing or its checksum
  cannot be produced.

Supabase Storage does not support object versioning. Deleted objects are
permanent in the source project, and database restore alone cannot recreate
their bytes. The backup destination must therefore provide its own retention or
immutable-snapshot capability. The destination and its retention period require
Owner/legal approval before the first real credential PDF is stored.

### 5.3 Secret and configuration inventory

Record variable names and recovery ownership, never values. The recovery
inventory must include at least:

- Supabase project URL and server-side keys;
- credential token HMAC pepper and encryption key;
- contact and verification rate-limit secrets;
- VEDOS SMTP configuration;
- Telegram configuration if enabled;
- Vercel project/environment configuration;
- Supabase Auth URLs, MFA policy, Storage bucket settings, Realtime settings,
  extensions, and any network restrictions.

A database clone does not recreate all platform or deployment configuration.

## 6. Daily and pre-change checklist

Daily:

1. Confirm Production health.
2. Confirm the newest database backup is successful and less than 24 hours old.
3. Confirm the latest private-PDF export is successful and less than 24 hours
   old.
4. Confirm database metadata count, exported-object count, and manifest count
   agree.
5. Record timestamp, operator, backup identifiers, counts, and result. Do not
   record sensitive values or object paths.

Before a high-risk migration, bulk learner import, credential activation batch,
or Storage maintenance:

1. Confirm the most recent daily controls passed.
2. Create a fresh portable database export.
3. Create a fresh private-PDF export.
4. Verify checksums and timestamp alignment.
5. Record the recovery point and obtain change approval.

## 7. Safe restore procedure

Never use Production as the target of a drill.

1. Declare the incident or scheduled drill, assign incident lead and recorder,
   and freeze production writes if an actual incident requires a cutover.
2. Select the newest clean database recovery point and the matching or newer
   private-PDF export.
3. Create a new Supabase project in the same region. Review the displayed cost
   before confirming creation.
4. Restore the database to the new project using Supabase **Restore to a New
   Project** when eligible, or the official CLI restore procedure.
5. Disable external side effects in the target before application testing:
   credential email, Telegram notifications, scheduled jobs, webhooks, and any
   public production callback URLs.
6. Recreate required platform configuration that is not copied automatically:
   Auth URLs/settings, API keys, Realtime settings, extensions/settings, Storage
   settings, network restrictions, and deployment environment variables.
7. Restore `private-credentials` only after the bucket is confirmed private and
   PDF-only. Do not create public policies or public signed URLs.
8. Verify every restored PDF by object key, byte size, and SHA-256 checksum.
9. Compare restored Storage objects with `credential_files`; investigate every
   missing or orphan object before proceeding.
10. Run migration parity, RLS/privacy, Owner/MFA, public content, verification,
    private-PDF admin access, and outbound-integration-disabled smoke tests.
11. Document recovery point, elapsed times, counts, failures, and approvals.
12. For a real incident only, update Vercel to the recovered project after Owner
    approval, then re-enable integrations one at a time and monitor.
13. Delete the drill project and encrypted drill material only after evidence is
    accepted and the deletion target is independently verified.

An in-place Production restore is a last-resort incident action, not the normal
drill path. It requires a separate explicit Owner confirmation because it can
overwrite live database state and does not restore deleted Storage objects.

## 8. Restore acceptance checklist

The drill passes only when:

- the target is not the Production project ref;
- migration history matches the selected recovery point;
- required `public`, `auth`, and Storage metadata are present;
- all application tables retain RLS and expected grants;
- the single active Owner and MFA controls work;
- no service-role key or private PDF is exposed publicly;
- `private-credentials` is private and has no browser object policy;
- Storage/database reconciliation reports zero missing and zero orphan PDFs;
- valid verification exposes only the approved fields;
- revoked verification remains status-only;
- pending/voided remain not found;
- outbound email and Telegram stay disabled throughout the drill;
- observed RPO/RTO and all deviations are recorded.

## 9. Current blockers

- The Supabase organisation is Free and has no scheduled database backups.
- No billing method is configured for the organisation.
- No independent encrypted private-PDF backup destination or retention period
  has been approved.
- Docker/PostgreSQL restore tooling is not available in this workspace.
- No paid, isolated restore target exists for a non-destructive drill.

Until these are resolved, backup readiness is documented but not accepted for
launch.
