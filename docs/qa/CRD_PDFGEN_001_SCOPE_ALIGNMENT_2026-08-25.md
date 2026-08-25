# CRD-PDFGEN-001 Automatic Credential Document Generation Scope Alignment — 2026-08-25

## Summary

The Owner rejected the implemented manual-only per-learner PDF composition
workflow as operationally unsuitable and approved automatic credential document
generation as a mandatory Release 1 capability.

The aligned model uses a reusable, private, versioned Template Package selected
by programme, optional programme run, credential type, language, and explicit
variant. One package may produce a primary Certificate or Diploma plus optional
Supplement/Transcript PDFs, and every output PDF may contain multiple pages.

Single and controlled full-cohort batch generation without a fixed
product-facing cap, automatic bounded chunk processing, private review,
explicit reviewed-item batch activation, and delivery of all current PDFs
through VEDOS are required. The approved workflow must handle groups of 200,
540, 1000, or more under one aggregate batch/progress view. Manual per-learner
PDF composition is no longer an acceptable Release 1 completion path for a
configured template package.

The canonical specification is
`docs/product/CREDENTIAL_DOCUMENT_GENERATION_SPECIFICATION_v2.md`.

## Files Changed

- new canonical credential document-generation specification;
- active v2 product scope, decisions, credential module, and user flows;
- database, API, RLS/permissions, migration, and security baselines;
- implementation plan, ticket pack, execution sequence, status, and master checklist;
- agent/documentation source-of-truth indexes.

No application code or runtime configuration changed.

## Database Objects

None. The approved future object boundaries are documented for `PDFGEN-001`,
but no migration or live database change was made in this scope-alignment
ticket.

## Tests / Verification

Passed:

- `git diff --check`;
- `npm run lint`;
- all 70 non-live `verify:*` scripts;
- active-document search confirming that automatic PDF generation is no longer
  listed as a Release 1 exclusion or post-launch candidate;
- cross-document review of multi-document, multi-page, batch, privacy,
  permission, numbering, activation, and delivery rules.

## Security Notes

- Template sources and generated PDFs remain private.
- Template management/publication is Owner/Super Admin only with MFA.
- Credential Manager may generate from published templates but cannot mutate
  template definitions.
- QR/token material is used server-side and raw tokens must not be logged.
- Generation failure never releases or reuses a reserved document number.
- Batch generation and activation must be bounded, resumable, idempotent, and
  review-gated.
- No new external document-generation vendor is approved or introduced.
- No credential lifecycle or public verification privacy rule changes.

## Deviations / Open Questions

The explicit Owner decision expands Release 1 beyond the previous v2 baseline,
which had placed automatic PDF generation in the post-launch backlog. The
active v2 documents now consistently supersede that earlier exclusion.

No unresolved product decision blocks `PDFGEN-001`. Real Template Package
assets are not required for the database-foundation ticket and will be needed
before template-editor/generation acceptance.

## Next Dependency

Proceed with `PDFGEN-001 Template and Generation Database Foundation` as one
ticket. Do not implement storage, admin placement UI, rendering, batch
processing, or activation in the same ticket.

Per Owner decision, live backup activation/restore and real VEDOS delivery
acceptance remain deferred until real learners and credentials exist, but both
remain required before operational issuance.
