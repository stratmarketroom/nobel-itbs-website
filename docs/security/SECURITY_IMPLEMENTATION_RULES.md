# Security Implementation Rules

Product: Nobel ITBS Website and Credential Registry
Status: mandatory security rules for implementation agents

## 1. Non-Negotiable Rules

- Never expose Supabase service role in browser/client code.
- Never commit secrets or private keys.
- Never log raw verification tokens.
- Never expose private credential PDFs publicly.
- Never expose learner contact details publicly.
- Never expose internal UUIDs in public verification.
- Never include partners in credential verification.
- Use RLS deny-by-default.
- Use server-mediated credential verification.

## 2. Authentication and Roles

Auth source:

- Supabase Auth.

Application role source:

- `user_profiles`;
- `user_roles`.

Do not use user-editable JWT metadata as the only source of truth.

Roles:

- Owner;
- Super Admin;
- Content Manager;
- Credential Manager.

Users may have multiple roles.

There must be only one active Owner.

Only Owner can create/change Super Admins.

## 3. MFA

MFA required for:

- Owner;
- Super Admin;
- Credential Manager.

Sensitive actions must check MFA/AAL:

- user management;
- role changes;
- credential creation;
- credential activation;
- credential public data edits;
- PDF upload/replacement;
- revoke;
- void;
- resend;
- email template edits;
- site settings edits.

## 4. Public Verification Privacy

Public verification supports:

- QR token;
- document number.

No name/surname search in Release 1.

Valid result shows only:

- status;
- document number;
- holder name;
- programme title;
- credential type;
- issue date.

Revoked result shows only:

- status `Відкликаний`.

Pending and voided credentials behave as not found.

Wrong number/token returns:

`За цим кодом/номером документ не знайдено.`

Never show publicly:

- partner;
- PDF link;
- email;
- phone;
- learner ID;
- credential UUID;
- credential set ID;
- private file path;
- audit/history;
- revoke reason;
- internal notes.

## 5. Verification Token Security

Token rules:

- generate random non-guessable token;
- store lookup hash using HMAC-SHA-256;
- encrypt token if raw retrieval is required for QR regeneration;
- keep HMAC pepper separate from encryption key;
- do not log raw token;
- do not return raw token separately in API responses.

Document number is separate from token and may be manually entered by users.

## 6. Credential PDF Security

Private PDFs:

- stored in private Supabase Storage bucket;
- never public;
- never downloadable by public verification users;
- accessed by admins only through controlled routes;
- sent to learners server-side through VEDOS SMTP.

Old PDF versions are not retained by Release 1 requirement.

PDF replacement must be audited.

## 7. Credential Lifecycle Security

Allowed internal statuses:

- `pending`;
- `valid`;
- `revoked`;
- `voided`.

Do not add Release 1 statuses:

- `expired`;
- `cancelled`;
- public/internal lifecycle `reissued`.

Rules:

- valid cannot return to pending;
- revoked is irreversible in standard workflow;
- voided number is never reused;
- void requires reason;
- revoke requires reason;
- updating valid public data requires reason and history;
- activation requires primary/main PDF.

Activation must not fail solely because email sending failed.

## 8. RLS Rules

All sensitive tables must have RLS enabled.

Public direct access is forbidden for:

- learners;
- learner emails;
- learner phones;
- credential sets;
- credentials;
- credential files;
- document number log;
- credential history;
- credential notes;
- email send history;
- audit log.

Content Manager must not access:

- learners;
- credentials;
- contact submissions;
- credential files.

Credential Manager must not mutate:

- programmes;
- content pages;
- partner/expert content.

Credential Manager may read programme reference data needed for credential creation.

## 9. Service Role

Service role may be used only server-side for controlled workflows:

- public verification lookup;
- private file operations;
- email sending workflow;
- scheduled/internal jobs if later added.

Even server-side service role code must validate:

- route context;
- actor role for admin actions;
- active user;
- MFA where required.

Service role bypassing RLS is not permission to skip authorization.

## 10. Contact Forms

Contact submissions must use:

- validation;
- rate limiting;
- CAPTCHA where required;
- no raw database errors in public responses.

Contact submissions are visible to:

- Owner;
- Super Admin;
- Credential Manager.

Content Manager has no access.

## 11. Audit and History

Audit/history required for:

- role changes;
- user activation/deactivation;
- credential creation;
- document number reservation;
- activation;
- email send/resend;
- PDF replacement;
- public data change;
- revoke;
- void;
- credential set move;
- note edit/delete;
- email template change;
- site setting change.

Audit must not store:

- raw tokens;
- passwords;
- MFA secrets;
- private file contents;
- unnecessary PII.

## 12. External Services

Approved Release 1 integrations:

- VEDOS SMTP for credential delivery;
- Leeloo outbound URLs;
- CAPTCHA provider, implementation should be provider-replaceable;
- analytics, without PII.

Do not add new vendors without approval.
