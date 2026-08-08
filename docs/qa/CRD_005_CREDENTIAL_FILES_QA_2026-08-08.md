# CRD-005 Credential Files QA — 2026-08-08

## Summary

CRD-005 is implemented and accepted in the linked Supabase dev project. It introduces the private Storage and database foundation for current credential PDFs without implementing the WF-002 upload/replace/delete HTTP workflow or credential activation.

## Files and Database Objects

- Migration: `supabase/migrations/20260808120000_crd_005_credential_files.sql`.
- Database test: `supabase/tests/database/crd_005_credential_files.test.sql`.
- Static verifier: `scripts/verify-crd-005.mjs` and `npm run verify:crd-005`.
- Private Storage bucket: `private-credentials`.
- Tables:
  - `public.credential_file_types`;
  - `public.credential_files`.
- Seeded configurable file types:
  - `main_certificate`;
  - `supplement`;
  - `transcript`.
- Supporting objects: canonical-path/PDF/size/label constraints, one-primary partial unique index, lookup indexes, immutable object-identity trigger, attach/replace/update/delete audit trigger, grants, and forced RLS.

## Storage and Metadata Rules

- bucket is private and has no browser `storage.objects` policy;
- only `application/pdf` is accepted;
- maximum object size is 20 MB (`20971520` bytes);
- object metadata uses the fixed bucket `private-credentials`;
- canonical path is `{credential_id}/{file_id}.pdf` and is immutable;
- one credential may have multiple current files;
- at most one file can be primary;
- activation will later require one primary file;
- file language is inherited from its credential, so separate mismatching file-language metadata cannot be stored;
- replacement overwrites the same canonical object and metadata row;
- no old-version or file-version table is introduced;
- admin labels are separate from private object paths.

## Permission and Security Verification

Live database and Storage checks confirmed:

- bucket is `public = false`, PDF-only, and limited to 20 MB;
- server-side service access can upload and download a small valid technical PDF;
- anonymous download of that object is denied;
- a `text/plain` upload is rejected by bucket MIME restrictions;
- the technical PDF was removed after the check;
- anonymous direct metadata read fails with PostgreSQL `42501`;
- Content Manager at AAL2 receives zero file rows;
- Credential Manager at AAL1 receives zero file rows;
- Credential Manager at AAL2 can read file metadata and the three configured types;
- Credential Manager direct metadata insert fails with `42501`;
- service role has no direct metadata mutation grant;
- a second primary file for one credential is rejected;
- replacement updates the existing row/path rather than creating a version;
- storage-path rewrite is rejected;
- attach, replacement, and deletion produced four audit events without private path or file content;
- all learner, set, credential, number, file metadata, and audit QA records were transactionally rolled back;
- temporary Auth users were deleted.

The automatic number sequence remained untouched before and after QA:

```text
last_value = 1
is_called = false
```

## Automated Verification

Passed:

- `npm run verify:crd-005`;
- migration dry-run and application to the linked dev project;
- live RLS/MFA, bucket privacy, PDF MIME, service/anonymous download, canonical metadata, primary uniqueness, replacement, audit, and cleanup checks;
- lint, TypeScript, production build, and whitespace verification as recorded at ticket closure.

The pgTAP specification contains 55 assertions covering bucket privacy/configuration, file types, metadata schema, uniqueness, constraints, indexes, triggers, RLS, grants, MFA, roles, and absence of direct browser Storage policy.

## Limitation

The full local pgTAP runner was not executed because Supabase CLI database tests require Docker and no compatible runtime is available. The SQL test remains committed for a compatible database-test environment.

## Deviations and Open Questions

- The Owner-approved technical size limit is 20 MB per PDF and can be changed later by migration.
- File types are configurable; the three v2 examples are seeded and can be deactivated rather than deleted.
- Metadata mutations and physical object changes are deliberately not exposed as public database functions in CRD-005. WF-002 will coordinate actor authorization, Storage mutation, metadata, cleanup, and errors through server routes.
- A primary PDF is not required while a credential is pending. WF-003 activation will enforce its existence before changing the credential to valid.
- Signed URLs are not created here; controlled admin preview/download and Gmail attachments remain server-side workflow work.
- No external provider, Gmail, Telegram, or CAPTCHA configuration is required.

## Result and Next Dependency

CRD-005 is complete. The next ticket is CRD-006 Credential History and Notes: private lifecycle/history records, internal comments, and controlled note edit/delete rules.
