# PCE-004 Contact Operations QA Report

Date: 2026-08-06
Scope: public contact entry points, protected contact processing, rate limiting, CAPTCHA contract, RLS, audit, and cleanup

## Summary

PCE-004 is complete at the implementation and dev-QA level. The website now has manager-oriented public enquiry forms for general questions, partnership proposals, and organisation enquiries in EN, UA, and CZ, in addition to the existing programme-question flow.

The live dev pass verified creation through the public API, database-backed rate limiting, protected manager visibility, MFA enforcement, status processing, audit privacy, negative validation, and cleanup. Per the 2026-08-07 channel decision, contact alerts will use Telegram rather than Google Workspace and are deferred to pre-launch PCE-005. CAPTCHA is a conditional control and is intentionally not connected at this stage.

## Public Entry Points

| Page | Submission type | Result |
| --- | --- | --- |
| About (`#contact`) | `general` | Passed in EN/UA/CZ UI and live API smoke |
| Partnerships (`#contact`) | `partner_enquiry` | Passed in EN/UA/CZ UI and live API smoke |
| For Organisations (`#contact`) | `organisation_enquiry` | Passed in EN/UA/CZ UI and live API smoke |
| Programme page question form | `programme_question` | Existing flow preserved |

The For Organisations primary CTA continues to prefer the configured external destination when it exists. The on-site form remains the fallback contact path.

## Live API and Database Results

- Valid general, partnership, and organisation submissions returned `201` and created private `contact_submissions` records.
- Invalid public input returned `400 validation_error`.
- A filled honeypot returned a neutral success response without storing a record.
- Six requests from one rate key produced `[201, 201, 201, 201, 201, 429]`, confirming the atomic five-per-15-minute database limit.
- Stored metadata contained only the expected source, path, locale, and privacy acknowledgement fields.
- A partially configured CAPTCHA environment failed closed with `400 captcha_required` and created no record.

## Role, MFA, Status, and Audit

A temporary Credential Manager was created through the real Owner interface and tested through authenticated sessions:

- AAL1 contact listing returned `403`.
- AAL2 contact listing returned `200`.
- `new → processed` returned `200`.
- `processed → archived` returned `200`.
- an unsupported status returned `400`.
- both valid status changes created audit records;
- audit details did not copy the submitter's name, email, phone, or message.

The existing Stage 2–4 matrix already confirms that Content Manager cannot read contacts, while Super Admin and Credential Manager can read them only after MFA.

## Database Change

Migration `20260806170000_pce_004_public_contact_entry_points.sql` adds the service-only `public.create_public_contact_submission(...)` RPC. It accepts only `general`, `partner_enquiry`, and `organisation_enquiry`, performs the database-backed rate-limit check and insert atomically, has a fixed `search_path`, and is denied to `PUBLIC`, `anon`, and `authenticated`.

## Cleanup

All temporary contact records and the temporary Credential Manager were removed after QA. The dev project returned to one Owner account with no remaining PCE-004 QA contacts.

## External Production Dependencies and Deferred Controls

- `BLOCKED`: configure a production contact rate-limit secret of at least 32 characters.
- `DEFERRED BY PRODUCT DECISION (2026-08-07)`: implement a one-way, privacy-minimised Telegram manager notification under PCE-005 before launch. Google Workspace is not required for contact alerts.
- `DEFERRED BY PRODUCT DECISION (2026-08-07)`: do not connect CAPTCHA now. Honeypot and database-backed rate limiting remain the active controls. A replaceable CAPTCHA provider may be added later only as a conditional check for suspicious or abusive traffic.

The production-secret item blocks its production check, but it does not block the next implementation ticket, LRN-001 Learner Core. Deferred Telegram notification and CAPTCHA configuration are not Stage 5 blockers.

## Result

PCE-004 and the code-level portion of Stage 8 are accepted in dev. Telegram notification acceptance is deferred to PCE-005 before launch; CAPTCHA configuration is intentionally outside the current required work.
