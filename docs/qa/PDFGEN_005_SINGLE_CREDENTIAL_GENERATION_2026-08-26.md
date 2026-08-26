# PDFGEN-005 Single Credential Generation and Regeneration

Date: 2026-08-26

Status: complete in dev and Production

## Summary

PDFGEN-005 connects the accepted PDFGEN-004 renderer to one existing pending
credential. An authorized Owner, Super Admin, or Credential Manager with MFA
may select an exact matching published Template Package, generate every
configured PDF in one operation, privately review each current file, and
regenerate the same immutable template version while the credential remains
pending.

The ticket does not create cohort batches, activate credentials, send email, or
add a public PDF route. Those boundaries remain assigned to PDFGEN-006 and
PDFGEN-007 or to the existing explicit single-credential activation workflow.

## Implemented Contract

- `GET|POST /api/v1/admin/credentials/{id}/generate` loads the private
  generation state or starts one guarded generation/regeneration operation.
- First generation requires a published package matching programme, optional
  run, credential type, and language.
- Regeneration is pending-only and fixed to the exact immutable version already
  recorded in current-file provenance; a retired provenance version remains
  usable for that regeneration but cannot be selected for a new credential.
- One operation renders and persists the complete package: exactly one primary
  PDF plus all configured additional multi-page PDFs.
- First generation creates canonical private `credential_files`. Regeneration
  replaces those same current file identities in place and appends a new
  `credential_file_generations` attempt.
- Manual or mixed-provenance current PDFs block first template generation so an
  automatic package cannot silently overwrite an independently managed file.
- A private 15-minute database lease prevents concurrent in-place generation
  for one credential. An expired lease is reclaimed with a privacy-minimal
  failure event.
- Database completion is atomic. Storage failure rolls back newly written
  objects; regeneration failure restores the previous private bytes before the
  lease is released.
- Admin review provides separate 60-second inline Preview and attachment
  Download actions through the existing MFA-protected server route.

## Database Objects

Migration `20260826100000_pdfgen_005_single_generation.sql` adds:

- `internal.credential_single_generation_locks`;
- `internal.assert_single_generation_actor()`;
- `public.begin_single_credential_generation(uuid, uuid, uuid)`;
- `public.refresh_single_credential_generation(uuid, uuid)`;
- `public.complete_single_credential_generation(uuid, uuid, jsonb)`;
- `public.fail_single_credential_generation(uuid, uuid, text)`.

The lock table has forced RLS, no browser/service-role table privileges, and no
policies. The controlled functions require the existing MFA/AAL2 helper and
the Owner, Super Admin, or Credential Manager role. No Storage policy or new
credential lifecycle status is added.

## Tests / Verification

Passed locally:

- `npm run verify:pdfgen-001`;
- `npm run verify:pdfgen-002`;
- `npm run verify:pdfgen-003`;
- `npm run verify:pdfgen-004`;
- `npm run verify:pdfgen-005`;
- `npm run verify:wf-002`;
- `npm run verify:qa-001`;
- `npm run verify:qa-003`;
- `npm run test:pdfgen-004:generation`;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build`;
- `git diff --check`.

The fictional PDF test produced one primary page and a two-page Supplement,
decoded exact QR values on normal and rotated pages, and passed a Poppler PNG
review of all three pages. The temporary PDFs and PNGs were removed after QA.

Authenticated local browser QA loaded the retained revoked QA credential without
mutation, confirmed the generation panel, matching package summary, explicit
pending-only block, private Preview/Download controls, desktop and 390-pixel
responsive layout, and zero application console errors. The package selector
is disabled whenever generation is ineligible.

## Publication and Environment Acceptance

- implementation commit `fa34d6240e7003a5db3a65600f3ba088f4252b1c` was
  pushed to `codex/pdfgen-005-single-generation`;
- PR #37 was created and passed 2/2 GitHub checks with no merge conflict;
- Vercel Preview deployment `FBqgT3eNTTctwDrvg8woXFpi35oN` reached `Ready`;
- the Preview root loaded without an application console error and retained the
  public programme and verification surface;
- dev migration dry-run listed only
  `20260826100000_pdfgen_005_single_generation.sql`; the migration then applied
  and was recorded as the 58th dev migration;
- an independent read-only dev audit confirmed forced RLS on the private lease,
  zero lease policies, zero anon/authenticated/service-role table grants, four
  guarded security-definer functions with fixed search paths, zero anonymous
  and four authenticated function grants, unchanged credential statuses, zero
  active leases, zero generated provenance rows, and zero private credential
  Storage policies;
- authenticated Owner/AAL2 dev acceptance loaded the retained revoked QA
  credential and the PDFGEN-005 panel with the pending-only block, disabled
  package selector, private Preview/Download controls, and no application
  console errors;
- no pending credential, permanent number, generated PDF, Storage object,
  provenance row, or delivery was created during acceptance.

Production publication then completed without fixture data:

- PR #37 was merged into `main` as
  `159916c4f8bb26e22f39707967cfd66897a0cc83`;
- the merge commit's 1/1 Vercel check passed and Production deployment
  `2FXVz7Xrz5jegFXnMrRvTwiv3Y5D` reached `Ready` as the latest `main`
  deployment;
- the canonical Production root at `https://nobel-itbs-website.vercel.app/`
  loaded to `document.readyState = complete` with the expected programme and
  verification surfaces;
- migration `20260826100000_pdfgen_005_single_generation.sql` applied and was
  recorded as Production migration 58;
- an independent read-only Production audit confirmed forced RLS on the lease
  table, zero lease policies and browser/service-role table grants, all four
  guarded functions with fixed search paths, zero anonymous and four
  authenticated function grants, unchanged `pending`/`valid`/`revoked`/`voided`
  statuses, and zero active leases, packages, credentials, generated
  provenance rows, generation batches, or direct private-credential Storage
  policies;
- the deployed generation endpoint returned application-level `401` with no
  Bearer session;
- no Production credential, permanent number, template package, PDF, Storage
  object, provenance row, batch, or delivery was created.

A focused 20-assertion pgTAP suite is committed at
`supabase/tests/database/pdfgen_005_single_generation.test.sql`. It was not
executed because Docker or another compatible local PostgreSQL/pgTAP runner is
not available.

## Security Notes

- Raw verification tokens, token hashes/ciphertext, encryption keys, PDF bytes,
  and private Storage paths never enter browser responses, History, or Audit.
- Token decryption, private template loading, rendering, hashing, Storage
  persistence, and rollback run only in server code.
- Browser roles receive no direct access to either private Storage bucket.
- Generation and private review require the existing credential-management
  role boundary and MFA/AAL2.
- Every History/Audit event contains only bounded identifiers, attempt/count
  metadata, and safe failure codes; no learner contact data is recorded.
- Activation remains a separate explicit action and succeeds or fails under
  its existing rules. PDFGEN-005 does not send email.

## Deviations / Open Questions

- The migration is applied and read-only accepted in dev and Production. A
  true first-generation/regeneration mutation would require creating a pending
  credential and irreversibly consuming a permanent document number. That was
  intentionally not done without an explicitly approved non-production
  credential; complete mutation/rollback/provenance acceptance remains open.
- The stale `.agents/context/PRODUCT.md` statement that automatic PDF
  generation is out of scope conflicts with the approved v2 generation
  specification dated 2026-08-25. Per `AGENTS.md`, the v2 specification was
  used and that context file was not changed in this ticket.

## Next Dependency

`PDFGEN-006 Batch Generation and Review` is now unblocked but has not started.
It must reuse this accepted single-item generation boundary without adding a
fixed cohort-size cap.
