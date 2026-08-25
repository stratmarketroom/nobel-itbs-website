# PDFGEN-003 Template Package Admin and Field Placement Editor QA

Date: 2026-08-25
Status: dev acceptance complete; immutable v1 published and read-only verification passed; release promotion pending

## Scope

This ticket adds the Owner/Super Admin workspace for private Template Packages: package and draft-version creation, multiple PDF documents, page selection, constrained field placement, fictional non-production preview, structural validation, immutable publication, and retirement. It does not generate credential PDFs or implement batch generation, activation, or delivery.

## Implemented

- `/admin/credential-templates` is visible only to Owner/Super Admin and remains behind the shared MFA/AAL2 shell.
- Package context is programme, optional run, credential type, language, and variant.
- Each version can contain one primary and additional multi-page PDFs using the PDFGEN-002 private upload boundary.
- The editor renders one private PDF page server-side as a no-store PNG and overlays only fictional sample values. Text size follows the measured canvas-to-PDF point scale rather than a fixed browser multiplier.
- Allowed placements remain the ten database-enforced field keys. Draft fields can be added, dragged, removed, and edited using exact point geometry plus font/minimum size, weight, alignment, fit mode, colour, and date-format controls.
- Placement replacement is atomic and limited to 250 items per document; page bounds and rendering constraints are enforced in PostgreSQL.
- Publication validation requires documents, exactly one primary, complete page metadata/private objects, active file types, required holder/number/QR fields, in-page geometry, and approved `noto_sans` dynamic-text metadata.
- Published versions remain immutable; published versions may only be retired for future use.

## Verification

Passed locally: focused static verifier, ESLint with zero warnings, TypeScript `--noEmit`, Next.js production build, and diff checks.

Authenticated Owner/AAL2 browser acceptance in linked dev passed with the approved Neuroplastic Reconstruction certificate source:

- created `Neuroplastic Reconstruction — Certificate — EN`, variant `standard`, with draft v1;
- replaced the marker-only PDF with the clean private one-page A4 source and confirmed private no-store page rendering;
- saved required holder name, programme title, document number, issue date, and verification QR placements using exact point geometry;
- structural validation returned `Validation passed`; API interactions produced no application errors. The dev server separately recorded one hydration warning caused by browser translator/Grammarly DOM mutations (`lang`, translation class, and extension attributes), not by template application state;
- kept v1 in `draft`; publication was intentionally not exercised because it makes the version immutable and requires separate Owner approval.

The first Owner visual review reopened the acceptance: the boxes used approximate coordinates, text had default left alignment, the programme title had only a single-line region, and the preview applied a fixed `fontSize * 0.72` CSS conversion plus button padding. That made the clean source look displaced even though the marker and clean PDF were both `842.25 x 595.5 pt`.

The first correction still failed the second Owner visual review: the holder and programme regions were too tall, the holder region started above the marker baseline, the programme region reached the fixed `delivered by` line, the document-number value started inside its static label, and the long `QR SAMPLE` editor label clipped inside the QR region.

The third Owner screenshot showed that the extracted PDF text-box top coordinates remained about `8 pt` above the actual visible glyph rows in the browser raster. That kept the issue date between rows and the document number on `Place of Issue` even though their stored coordinates matched PDF.js text-box metadata. The third correction now:

- measures the live canvas width with `ResizeObserver` and scales PDF-point typography accordingly;
- removes preview button padding/line-height displacement and renders alignment/weight/wrap from persisted placement metadata;
- uses the selected package's programme/type labels instead of an unrelated General Psychology sample;
- derives geometry from the actual marker/source page (`842.25 x 595.5 pt`) and applies the observed `8 pt` visible-glyph correction: holder `y=194.2`, programme region `y=242, h=40`, issue date `x=130, y=430.9`, document number `x=161, y=463.9`, and QR `x=714, y=320`;
- removes border-box displacement, vertically centres overlay content, keeps wrapped text on its own line height, and uses a short `QR` editor label that cannot clip;
- calibrates holder and programme title as centred blue fields, gives the programme title a bounded two-line wrap region, and aligns regular-weight issue date/document number plus the QR to the source geometry;
- supplies PDF.js with its installed local standard-font data for preview rasterization, with no public font download;
- survives save/reload with all five third-pass placements and returns `Validation passed` in the authenticated dev workspace.

The Canva-derived source was then cleaned as a vector PDF: only the eight `_NUMBER]` glyph objects after `Certificate No.:` were removed, while the static label and all other page content remained unchanged. The result remains an unencrypted one-page A4 PDF (`842.25 x 595.5 pt`) with no JavaScript; a 300 dpi comparison limited the changed pixel area to the former placeholder region. The cleaned source passed the actual PDFGEN-002 upload validator, replaced the prior private dev document, retained the primary-document role, and rendered through the private no-store preview. All five placements were restored with the third-pass geometry, saved, and returned `Validation passed` again.

The Owner then approved the corrected clean-source preview and explicitly authorized publication. Draft v1 published successfully in the authenticated Owner/AAL2 dev workspace. The workspace now reports `v1 published`; upload, delete, add-field, and save controls are absent; all persisted placement controls are disabled; and a post-publication validation again returned `Validation passed`. The source document and placements are therefore read-only through the accepted admin workflow.

The real Canva-derived raster source exposed a false positive in PDFGEN-002's raw forbidden-name scan: compressed image bytes happened to contain `/JS` while both `pdfinfo` and parsed-document checks reported no JavaScript. The scanner now ignores comments, literal/hex strings, and stream payloads while retaining parsed action/form/annotation/attachment checks and forbidden dictionary-name rejection. Regression tests cover harmless `/JS`/`URI` bytes in a stream and actual forbidden names outside streams.

Committed pgTAP: `pdfgen_003_template_package_editor.test.sql` with 16 assertions. It is not claimed as executed locally because this workstation has no Docker-compatible Supabase runtime.

Applied and accepted in linked dev:

- migration `20260825140000` was applied and recorded transactionally;
- all four new editor/validation/audit functions exist;
- anonymous validation execution is denied while authenticated execution reaches the database role/MFA guard;
- one approved published Template Package v1 now exists with one private primary source document, one page, and five placements; no learner, credential, generated credential file, or permanent document number was created.

Remaining before release promotion and final ticket closure:

- merge the accepted implementation, deploy it, apply migration `20260825140000` to Production, and run the documented Production read-only acceptance before starting PDFGEN-004.

## Security Notes

- Anonymous users, Content Manager, and Credential Manager cannot use template-definition routes.
- The service role remains server-only and is used solely to download validated private source bytes for page rasterization.
- No source Storage path, SHA-256, signed URL, sample holder value, or PDF byte content enters API metadata or audit logs.
- Preview responses are `private, no-store`; the sample QR is deliberately non-production.
- Credential statuses remain `pending`, `valid`, `revoked`, and `voided`.

## Next Dependency

Promote the accepted PDFGEN-003 implementation through merge/deploy and Production migration/read-only acceptance. After PDFGEN-003 is closed, continue with `PDFGEN-004 Single Credential Package Generation`.
