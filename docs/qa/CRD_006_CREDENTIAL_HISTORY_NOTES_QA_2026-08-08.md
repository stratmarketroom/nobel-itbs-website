# CRD-006 Credential History and Notes QA — 2026-08-08

## Summary

CRD-006 is implemented and accepted in the linked Supabase dev project. It completes the Stage 6 database/security foundation for a private credential timeline and internal credential comments without implementing the later credential workflow API or credential-detail admin UI.

## Files and Database Objects

- Migration: `supabase/migrations/20260808130000_crd_006_credential_history_notes.sql`.
- Database test: `supabase/tests/database/crd_006_credential_history_notes.test.sql`.
- Static verifier: `scripts/verify-crd-006.mjs` and `npm run verify:crd-006`.
- Tables:
  - `public.credential_history`;
  - `public.credential_notes`.
- Controlled functions:
  - `internal.write_credential_history(uuid, text, text, jsonb, jsonb)`;
  - `public.add_credential_note(uuid, text)`;
  - `public.update_credential_note(uuid, text)`;
  - `public.delete_credential_note(uuid)`.
- History hooks:
  - pending credential creation;
  - credential set moves;
  - credential status changes;
  - linked document-number issuance/voiding;
  - PDF attach/replace/update/delete;
  - note create/edit/delete.

## History and Note Rules

- credential history is append-only and cannot be updated, deleted, or truncated;
- history stores minimal event context and never stores raw/encrypted token material, lookup hashes, private file paths/content, email, phone, or note body;
- notes are private current-text records with soft deletion;
- authenticated users receive no direct insert/update/delete table privileges;
- note author is always derived from `auth.uid()`;
- an author can edit and soft-delete their own active note;
- another Credential Manager cannot edit or delete that note;
- Owner/Super Admin can soft-delete another author's note;
- deleted notes cannot be edited or restored;
- note create/edit/delete produces both credential-history and global-audit events without copying note text;
- full note-text version history is intentionally not retained.

## Permission and Security Verification

The transactional live dev QA passed all 22 checks:

- anonymous direct history access is denied;
- Content Manager sees no credential history;
- Credential Manager at AAL1 sees no credential history;
- Credential Manager at AAL2 can read the private timeline and notes;
- an AAL2 Credential Manager can add and edit their own note;
- a second Credential Manager cannot edit or delete another author's note;
- Super Admin can soft-delete another author's note;
- a deleted note is immutable;
- direct authenticated note insertion is denied;
- history update and delete are denied even through privileged test SQL;
- pending creation, set move, status, number, PDF, and note events are recorded;
- three note operations create exactly three history and three audit events;
- note text is absent from History and Audit payloads;
- private Storage paths are absent from History payloads;
- all learner, set, credential, number, file, note, history, role, profile, and audit QA records were transactionally rolled back;
- temporary Auth users were deleted.

The automatic document-number sequence remained untouched before and after QA:

```text
last_value = 1
is_called = false
```

## Automated Verification

Passed:

- `npm run verify:crd-006`;
- migration dry-run and application to the linked dev project;
- live RLS/MFA, authorship, edit/delete, append-only, privacy, event-hook, and rollback checks;
- final lint, TypeScript, production build, migration parity, and whitespace checks recorded at ticket closure.

The pgTAP specification contains 64 assertions covering schema, constraints, indexes, triggers, append-only behavior, soft-delete structure, functions, grants, forced RLS, MFA, roles, and absence of direct mutations.

## Limitation

The full local pgTAP runner was not executed because Supabase CLI database tests require Docker and no compatible runtime is available. The SQL test remains committed for a compatible database-test environment.

## Deviations and Open Questions

- The v2 documents do not explicitly state whether an author may delete their own note. CRD-006 applies the standard and least-surprising rule: an author may soft-delete their own note, while Owner/Super Admin may also delete another author's note. Only the author may edit its text.
- The current note body remains stored after soft deletion because the approved schema explicitly uses `deleted_at`/`deleted_by` and says full version history is not required. Admin UI must render deleted notes as deleted and must not offer further editing.
- History records are ready for the future credential-detail History tab. The credential-detail admin UI and workflow HTTP routes are not part of this database ticket.
- Public-data update events with mandatory reasons and email send/resend events will be written by WF-007 and WF-003/WF-004 respectively; CRD-006 does not implement those later workflows.
- No external provider, Google Workspace, Telegram, or CAPTCHA configuration is required.

## Result and Next Dependency

CRD-006 is complete and Stage 6 Credential Core is complete at the database/security-foundation level. The next ticket is WF-001 Create Pending Credential: controlled set creation, number reservation, and verification-token generation.
