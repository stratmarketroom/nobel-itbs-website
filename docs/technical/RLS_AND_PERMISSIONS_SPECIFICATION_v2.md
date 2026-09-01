# RLS and Permissions Specification v2

Product: Nobel ITBS Website and Credential Registry
Status: Release 1 implementation baseline

## 1. Principles

- Deny by default.
- Least privilege.
- RLS plus grants plus server authorization.
- No service role in browser.
- Public verification is server-mediated.
- Sensitive admin actions require MFA.
- Roles are multi-role.
- Owner is a special unique role/flag.

## 2. Roles

### Owner

Exactly one active Owner.

Owner can:

- perform all system actions;
- create/change Super Admins;
- manage all users and roles;
- manage content, programmes, credentials, settings.

Owner requires MFA.

### Super Admin

Can:

- manage content;
- manage programmes;
- manage credentials;
- manage learners;
- manage most users;
- access contact submissions;
- manage settings;
- revoke/update credentials.

Cannot:

- create/change Owner;
- perform Owner-only Super Admin governance if restricted by implementation.

Requires MFA.

### Content Manager

Can:

- manage public content pages;
- manage programmes;
- manage programme areas/types;
- manage partners;
- manage experts;
- manage legal content.

Cannot:

- access learners;
- access credentials;
- access credential files;
- access contact submissions;
- manage users;
- manage email templates unless explicitly granted later.

MFA optional.

### Credential Manager

Can:

- manage learners;
- manage credentials;
- manage credential files;
- activate/resend/revoke/void credentials;
- edit valid credential public data with reason;
- move credentials between sets;
- access contact submissions;
- edit credential email templates.

Cannot:

- edit programmes;
- edit public content;
- manage users;
- create/change Super Admin;
- access Content Manager-only editing tools.

Can read programme/programme run reference data for credential creation.

Requires MFA.

## 3. Role Resolution

Role source:

- `user_profiles`;
- `user_roles`.

Do not rely on user-editable JWT metadata as source of truth.

Helper functions should answer:

- is active admin;
- is owner;
- has role;
- has any role;
- has MFA/AAL requirement satisfied.

Helpers must use `auth.uid()` and not accept actor ID from client input.

## 4. Public Access

Public can read only curated public content and public verification responses.

Public cannot directly read:

- learners;
- credentials;
- credential sets;
- credential files;
- document number log;
- credential history;
- audit log;
- contact submissions.

## 5. Content Permissions

Content Manager, Super Admin, Owner can manage:

- content pages;
- page translations;
- programme areas/types;
- programmes;
- programme translations;
- programme runs;
- partners;
- experts;
- legal pages.

Credential Manager can read limited programme reference data only.

## 6. Contact Submission Permissions

Public can create submissions through server route only.

Owner, Super Admin, Credential Manager can read/update statuses.

Content Manager has no access.

## 7. Learner Permissions

Owner, Super Admin, Credential Manager:

- create/update learners;
- manage learner emails/phones;
- preview and atomically import a learner list;
- view learner credential list.

Content Manager:

- no access.

Duplicate contact checks must not leak data publicly, only in admin context.

The application preview uses the acting administrator's RLS-scoped request client. Final persistence is available only through `public.import_learners(jsonb)`, which is `SECURITY DEFINER`, uses a fixed `search_path`, and invokes the shared role/MFA sensitive-action guard before any write. `anon`, Content Manager, and unauthenticated callers cannot execute the workflow.

## 8. Credential Permissions

Owner, Super Admin, Credential Manager can:

- create pending credentials;
- use published Template Packages for single/batch generation;
- read their authorized private generation batches and generated-file provenance;
- privately review generated credential files;
- upload/manage PDF files;
- activate;
- resend;
- revoke;
- void pending;
- edit current public data with reason;
- move credentials between sets;
- add notes/comments.

Content Manager:

- no access.

Public:

- no direct table access;
- verification only through curated server route.

## 9. Credential Files / Storage

Bucket `private-credentials`:

- no public access;
- no Content Manager access;
- Owner/Super Admin/Credential Manager through controlled routes;
- signed URLs only when needed;
- VEDOS SMTP sending is server-side.

Old generated credential PDF versions are not retained by product requirement.
Immutable published template versions are retained separately.

Bucket `credential-templates`:

- private and deny-by-default;
- no public, anonymous, or Content Manager access;
- Owner/Super Admin may manage draft sources through controlled routes with MFA;
- Credential Manager may read only published template material through the
  controlled server generation workflow and receives no unrestricted bucket
  access;
- published version objects are immutable;
- sample previews and generated credential outputs are never public.

Template package/version/document/placement mutations and publication are
Owner/Super Admin only. Credential Manager may use published packages for
single/batch generation, private review, and activation. Generation-batch and
item rows are private and readable only by Owner/Super Admin/Credential Manager
with MFA through the approved scope.

## 10. Document Number Log

Owner, Super Admin, Credential Manager can read.

Only controlled functions can create/change number log statuses.

Public and Content Manager cannot access.

## 10A. Global Audit / History

- `audit_log` remains append-only and forced-RLS;
- Owner and Super Admin may read the global cross-module log only with MFA/AAL2;
- Content Manager, Credential Manager, anonymous, and public roles cannot read it;
- authenticated readers receive no insert, update, delete, or truncate capability;
- audit actor lookup grants only `user_profiles.id` and `user_profiles.full_name` to the
  same Owner/Super Admin AAL2 boundary;
- the application applies an additional privacy projection before metadata reaches the browser.

## 11. Email Templates and Sending

Email templates:

- Owner, Super Admin, Credential Manager can edit;
- Content Manager cannot.

Credential email sends:

- Owner, Super Admin, Credential Manager can create/read for credentials they can access;
- no public access;
- Content Manager no access.

## 12. User Management

Owner:

- manage all roles;
- create/change Super Admin;
- enforce Owner uniqueness.

Super Admin:

- manage non-Owner users according to policy;
- cannot create/change Owner;
- cannot bypass Owner-only restrictions.

Combined profile/role saves must use the controlled atomic workflow. It checks
the actor from `auth.uid()`, active role and MFA/AAL2 before mutation, locks the
target profile, and replaces the requested role set in the same transaction as
the profile update and audit triggers.

Content Manager and Credential Manager:

- no user management.

## 13. MFA Enforcement

MFA required for:

- Owner;
- Super Admin;
- Credential Manager.

Sensitive actions requiring MFA:

- user/role changes;
- credential creation;
- credential activation;
- credential public data changes;
- PDF upload/replacement;
- template source upload, field placement, publication, and retirement;
- single/batch document generation, retry, review, and batch activation;
- revoke;
- void;
- resend;
- email template edits;
- site settings edits.

## 14. Public Verification Security

Verification by token:

- backend normalizes token;
- backend computes HMAC lookup;
- raw token not logged;
- curated response only.

Verification by document number:

- backend resolves number;
- pending/voided behave as not found;
- revoked returns status only;
- valid returns minimal data only.

No partner data.

No PDF links.

No internal IDs.

## 15. Audit Requirements

Audit or history required for:

- login/security events where available;
- role changes;
- credential creation;
- number reservation;
- void;
- activation;
- email send/resend;
- PDF replacement;
- template creation/update/publication/retirement;
- document generation/regeneration and batch processing outcomes;
- batch activation request and per-credential result;
- public data change;
- revoke;
- credential set move;
- note edit/delete;
- email template change;
- site setting change.

Audit must not store:

- raw token;
- MFA secret;
- private file content;
- unnecessary PII.

## 16. Acceptance Criteria

RLS/permissions are accepted when:

- all tables deny by default;
- Content Manager cannot access contacts/learners/credentials;
- Credential Manager cannot mutate programme/content tables;
- Owner uniqueness is enforced;
- multi-role users work;
- MFA blocks sensitive actions when missing;
- public verification leaks no private data;
- private Storage is not public;
- private template sources and generation-batch records are inaccessible to public/Content Manager;
- Credential Manager can generate from published templates but cannot mutate or publish them;
- service role is server-only.
