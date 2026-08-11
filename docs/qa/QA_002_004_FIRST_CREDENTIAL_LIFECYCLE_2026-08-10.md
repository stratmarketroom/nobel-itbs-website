# QA-002 / QA-004 First Credential Lifecycle — 2026-08-10

## Summary

The first Owner-approved retained dev credential completed the real learner → pending credential → private PDF → activation → valid public verification → irreversible revoke → revoked public verification path. The credential is `revoked`, its permanent document number remains `issued`, and both document-number and QR-token verification now return revoked status only.

QA-002 and QA-004 are complete at the current dev acceptance level.

## Approved Test Record

- learner: Ivan Levchenkov;
- programme: Neuroplastic Reconstruction;
- document number: `NITBS-C-2027-123450`;
- issue date: 2027-01-05;
- document type: Certificate;
- language: English;
- one primary private PDF attached.

The number was manually reserved with an Owner-approved QA reason. It is permanently consumed and must never be reused.

## Database Objects Changed

Migration `20260810181500_qa_004_fix_activation_manifest_keys.sql` replaces `public.activate_credential(...)` without changing its signature or grants.

The original WF-003 manifest guard searched serialized JSON with a broad `bytes` expression. That expression also matched the approved `size_bytes` field, so a real activation manifest was rejected. The replacement checks exact JSON object keys and continues to reject `storage_path`, `storage_bucket`, `file_content`, and `bytes`, while allowing the approved `size_bytes` metadata.

The migration was applied to the linked dev database after confirming that it was the only pending migration.

## End-to-End Evidence

Passed:

- Owner/AAL2 protected admin access;
- retained learner and primary email record;
- pending credential creation with a manually approved permanent number;
- real verification token generation without exposing the token in documentation;
- primary PDF upload to private credential Storage;
- pending → valid activation;
- reserved → issued number transition with the credential link preserved;
- append-only history events for creation, reservation, PDF attachment, number issuance, activation, and delivery outcome;
- manual document-number verification rendered `VALID` with the approved public fields;
- QR-token verification rendered the same valid result;
- Owner-authorized valid → revoked irreversible transition with the mandatory private reason;
- the document number remained `issued` and linked to the revoked credential;
- the private History stored the reason and the Audit row stored only the `valid` → `revoked` status transition;
- manual document-number verification rendered `REVOKED` without the document number or document details;
- QR-token verification rendered the same status-only revoked result;
- an unknown well-formed number rendered not found without leaking the retained learner or programme;
- revoked verification exposed no holder, programme, document type, issue date, revocation reason, PDF access, partner data, internal IDs, private paths, history, notes, or raw verification token.

## Delivery Result

Google Workspace is intentionally not configured, so no email was sent. The activation form retained its default learner email during this automated submission and the private immutable delivery row therefore ended as `not_configured`, not `skipped_empty_recipient`.

This does not affect activation, number issuance, public verification, or privacy. The explicit empty-recipient path remains implemented and statically verified, but was not the retained record's live outcome. No delivery-history row was edited or deleted.

## Automated Verification

Passed:

- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run verify:qa-001`;
- `npm run verify:qa-001:live` — 18 public reads, 18 private denials, and two service-only RPC denials;
- `npm run verify:qa-003`;
- `npm run verify:qa-003:live` — verified TOTP enrollment and 11 AAL1 admin-route denials;
- `npm run verify:wf-003`;
- `npm run verify:qa-004:activation-fix`;
- migration-history comparison before push: all earlier migrations matched and only `20260810181500` was pending;
- linked dev migration push.

## Security Notes

- The QR raw token, token hash, encryption material, service-role key, and private Storage path are not recorded in this report.
- Public verification remains server-mediated and returns no public PDF.
- The exact-key activation guard preserves the private-file boundary while accepting the approved safe manifest.
- The delivery record is private and immutable; no external message was sent.
- The retained credential is permanently revoked and cannot be restored through the standard workflow.

## Deviations and Open Questions

- Real credential email delivery remains a QA-005 launch dependency if Google Workspace is later connected.
- The generated QR targets the canonical production domain. It is externally scannable after that domain and route are deployed; the same token passed local dev verification.

## Next Dependency

Proceed with `QA-005 Launch Checklist`: production environment and secrets, external integrations selected for launch, canonical-domain verification, backups, analytics/consent, responsive/accessibility/browser acceptance, and final release decision. Google Workspace delivery remains separate from activation correctness and should be acceptance-tested only if it is enabled for launch.
