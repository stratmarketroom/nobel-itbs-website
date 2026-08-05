# Verify Document: EN Master Copy

Product: Nobel ITBS Website and Credential Registry  
Page: Verify Document  
Locale: English  
URL: `/verify`  
Status: localized from product-owner-approved UA master copy; parity QA pending  
Updated: 2026-07-31

## 1. Editorial Role

This page allows users to verify a Nobel ITBS document by number. A QR code
opens a separate result page using a secure token. Searching by name, email or
phone number is not supported.

## 2. SEO

`seo_title`: Verify a Document | Nobel ITBS

`seo_description`: Verify a Nobel ITBS document by number or open its
verification page using the QR code printed on the document.

`og_title`: Nobel ITBS Document Verification

`og_description`: Check a document's status using its number or QR code.

## 3. Hero And Instructions

`eyebrow`: Document Verification

`h1`: Verify a document

`lead`: Enter the document number to check its status in the Nobel ITBS
registry.

`instruction`: Use the number exactly as it appears on the document. If the
document has a QR code, scan it with your phone camera to open the verification
page without entering the number manually.

## 4. Manual Verification Form

`field_label`: Document number

`field_placeholder`: For example, NITBS-C-2026-000123

`field_helper`: Verification is available only with the complete document
number.

`submit_button`: Verify

`submitting_button`: Verifying…

`required_error`: Enter the document number.

`format_error`: Check the document number and try again.

## 5. Valid Result

`status_label`: Valid

`heading`: Document verified

`body`: The document was found in the Nobel ITBS registry and has valid status.

Visible fields:

- `Document number`;
- `Document holder`;
- `Programme`;
- `Document type`;
- `Issue date`.

`verification_note`: This page confirms the document's status at the time of
verification.

Do not show:

- PDF or download link;
- partner information;
- email or phone;
- internal IDs, notes, history, or storage paths.

## 6. Revoked Result

`status_label`: Revoked

`heading`: Document revoked

`body`: This document has `Revoked` status. Document details are not displayed.

No document details are shown for this state.

## 7. Not Found Result

`heading`: Document not found

`body`: No document was found for this code or number.

`helper`: Check that the number is correct. If it has been entered correctly,
contact the organisation that provided the document.

Pending, voided, invalid-token, and non-existing records use this same public
state and reveal no additional information.

## 8. Rate Limit State

`heading`: Too many verification attempts

`body`: We have temporarily limited new requests. Wait a moment and try again.

`button`: Try again later

Do not display an exact internal threshold or security-rule details.

## 9. Temporary Error State

`heading`: Verification could not be completed

`body`: The verification service is temporarily unavailable. Please try again
later.

`retry_button`: Try again

## 10. Connection Error State

`heading`: Cannot connect to the verification service

`body`: Check your internet connection and submit the request again.

`retry_button`: Try again

## 11. Privacy And Indexing Rules

- manual verification page is indexable;
- QR-token and all result pages are `noindex`;
- never include result details in SEO or Open Graph metadata;
- do not offer search by name, surname, email, phone, learner ID, or partner;
- valid is the only state that shows document details;
- revoked shows status only;
- pending and voided behave as not found publicly.
