# SQL Migration Plan v2

Product: Nobel ITBS Website and Credential Registry
Status: Release 1 implementation baseline

## 1. Principles

- One logical step per migration.
- Forward-only after production.
- Schema-qualified names.
- Fixed `search_path` in functions.
- No PUBLIC EXECUTE on sensitive functions.
- No service role in browser.
- Tests after each major phase.

## 2. Phase 0 - Foundation

Migrations:

1. Enable extensions:
   - `pgcrypto`;
   - `citext`;
   - `pg_trgm`.
2. Create internal schema.
3. Create shared timestamp helpers.
4. Create audit foundation.
5. Revoke unsafe default privileges.

## 3. Phase 1 - Auth, Roles, MFA

Migrations:

1. Create `app_role` enum.
2. Create `user_profiles`.
3. Create `user_roles`.
4. Add one-active-owner constraint.
5. Create role helper functions.
6. Create user management controlled functions.
7. Add RLS for user profile/role tables.
8. Add seed/admin bootstrap strategy.

Important change from v1:

- roles are many-to-many, not one `role` field.
- Owner is explicit and unique.

## 4. Phase 2 - Languages and Content

Migrations:

1. Create language/reference tables.
2. Seed `en`, `ua`, `cz`.
3. Create translation status enum.
4. Create content pages.
5. Create content page translations.
6. Create site settings.
7. Create legal page/content records.

## 5. Phase 3 - Programmes

Migrations:

1. Programme Areas and translations.
2. Programme Types and translations.
3. Programmes.
4. Programme translations with structured sections.
5. Programme Runs.
6. Programme Pricing Options.
7. Shared `/programmes/[slug]` registry or uniqueness mechanism.
8. Programme slug redirects.
9. Programme public views.

Seed:

- Business & Management;
- Technology & Innovation;
- Psychology & Human;
- Certificate programme;
- Mini-MBA;
- Professional development course.

## 6. Phase 4 - Partners, Experts, Contact

Migrations:

1. Partners and translations.
2. Experts and translations.
3. Programme-partner relation.
4. Programme-expert relation.
5. Contact submission enums.
6. Contact submissions.
7. Contact submission RLS.

Contact statuses:

- `new`;
- `processed`;
- `archived`.

## 7. Phase 5 - Learners

Migrations:

1. Learners.
2. Learner emails.
3. Learner phones.
4. Primary email/phone constraints.
5. Duplicate contact indexes.
6. Learner RLS.
7. Controlled atomic learner-list import workflow and privacy-minimal audit.

## 8. Phase 6 - Credential Core

Migrations:

1. Credential status enum:
   - `pending`;
   - `valid`;
   - `revoked`;
   - `voided`.
2. Document number status enum:
   - `reserved`;
   - `issued`;
   - `voided`.
3. Credential Types.
4. Credential Type translations.
5. Credential Sets.
6. Credentials.
7. Credential File Types.
8. Credential Files.
9. Document Number Log.
10. Credential History.
11. Credential Notes.

Removed from v1:

- complex Credential Group lifecycle;
- credential_group_status enum;
- expired/cancelled/reissued credential statuses;
- immutable snapshots as public source of truth.

## 9. Phase 7 - Credential Functions

Controlled functions:

1. Generate/reserve document number.
2. Generate verification token lookup.
3. Create pending credential.
4. Attach/replace credential file metadata.
5. Activate credential.
6. Record email send result.
7. Resend credential.
8. Void pending credential.
9. Revoke credential.
10. Update current public credential data.
11. Move credential between sets.
12. Public verification by HMAC token.
13. Public verification by document number.

All sensitive functions:

- validate actor role;
- validate active user;
- validate MFA/AAL where required;
- write history/audit.

## 10. Phase 8 - Storage

Migrations/config:

1. Create `public-media` bucket.
2. Create `private-credentials` bucket.
3. Public media policies.
4. Private credential policies.

Private credential files:

- no public access;
- controlled admin/server access only.

## 11. Phase 9 - Email Templates

Migrations:

1. Email templates.
2. Credential email send history.
3. Seed EN/UA credential email templates.
4. RLS for templates/send history.

## 12. Phase 10 - RLS and Grants

Apply RLS by module:

1. User tables.
2. Content tables.
3. Programme tables.
4. Contact submissions.
5. Learners.
6. Credential sets/credentials/files.
7. Document number log.
8. Email templates/sends.
9. Audit/history.

## 13. Phase 11 - Tests

Database tests:

- clean migration chain;
- enum values;
- Owner uniqueness;
- multi-role user access;
- language seed;
- slug uniqueness;
- learner email/phone uniqueness;
- document number sequence;
- voided number not reused;
- credential status transitions;
- public verification privacy;
- private Storage policies;
- Content Manager denial;
- Credential Manager programme read-only;
- MFA-required functions.

## 14. Acceptance Criteria

Migration plan is complete when:

- clean database can migrate from zero;
- v2 role model works;
- v2 credential model works;
- public verification follows v2 privacy rules;
- private PDFs are protected;
- tests cover critical security and lifecycle flows.
