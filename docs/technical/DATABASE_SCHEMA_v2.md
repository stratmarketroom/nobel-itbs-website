# Database Schema v2

Product: Nobel ITBS Website and Credential Registry
Status: Release 1 implementation baseline

## 1. Purpose

This document defines the corrected Release 1 database model after product-owner alignment.

It supersedes the v1 schema where conflicting.

## 2. Global Principles

- PostgreSQL / Supabase.
- UUID primary keys for main entities.
- `created_at` and `updated_at` on mutable tables.
- No service role in browser.
- Public verification is server-mediated.
- Private credential PDFs are stored in private Supabase Storage.
- Critical actions are audited.
- Public content is multilingual with English fallback.

## 3. Language Model

Table: `languages`

Seed:

- `en`;
- `ua`;
- `cz`.

English has no URL prefix.

Ukrainian prefix: `/ua`.

Czech prefix: `/cz`.

Translation-capable entities should support translation status:

- `missing`;
- `draft`;
- `published`.

## 4. Roles and Users

### Enums

`app_role`:

- `owner`;
- `super_admin`;
- `content_manager`;
- `credential_manager`.

Do not model user role as a single enum field.

### `user_profiles`

Stores application profile for Supabase users.

Recommended fields:

- `id uuid primary key references auth.users(id)`;
- `full_name text`;
- `is_active boolean not null default true`;
- `is_owner boolean not null default false`;
- `mfa_required boolean not null default false`;
- timestamps.

Constraint:

- only one active owner.

### `user_roles`

Many-to-many roles.

Fields:

- `user_id uuid references user_profiles(id)`;
- `role app_role`;
- `assigned_by uuid`;
- `assigned_at timestamptz`;
- primary key `(user_id, role)`.

Rules:

- Owner role/flag is unique and Owner-only managed.
- Only Owner can create/change Super Admins.
- Users may have multiple roles.

## 5. Content Pages

Use structured content, not a free-form page builder.

### `content_pages`

Fields:

- `id uuid`;
- `page_key text unique`;
- `page_type text`;
- `status record_status`;
- `created_at`;
- `updated_at`.

Examples:

- `home`;
- `about`;
- `partnerships`;
- `for_organisations`;
- legal page keys.

### `content_page_translations`

Fields:

- `page_id uuid`;
- `language_code text`;
- `translation_status translation_status`;
- `seo_title text`;
- `seo_description text`;
- `h1 text`;
- `sections jsonb`;
- timestamps.

Unique:

- `(page_id, language_code)`.

## 6. Programmes

### `programme_areas`

Fields:

- `id uuid`;
- `slug text unique`;
- `status record_status`;
- `sort_order int`;
- timestamps.

Seed:

- `business-management`;
- `technology-innovation`;
- `psychology-human`.

### `programme_area_translations`

Fields:

- `area_id uuid`;
- `language_code text`;
- `translation_status translation_status`;
- `title text`;
- `short_description text`;
- `intro_content text`;
- `sections jsonb`; fixed About, Audience, Outcomes, Listing, and Closing CTA blocks;
- `seo_title text`;
- `seo_description text`;
- `og_title text`;
- `og_description text`.

### `programme_types`

Fields:

- `id uuid`;
- `slug text unique`;
- `status record_status`;
- `sort_order int`;
- timestamps.

Seed:

- `certificate-programme`;
- `mini-mba`;
- `professional-development-course`.

### `programme_type_translations`

Same translation pattern as areas.

### `programmes`

Fields:

- `id uuid`;
- `area_id uuid references programme_areas(id)`;
- `type_id uuid references programme_types(id)`;
- `slug text unique`;
- `publication_status programme_publication_status`;
- `format programme_format`;
- `application_provider programme_application_provider` (`leeloo` or `partner_site`);
- `application_url text null`;
- `enrolment_badge_override text null`; allowed keys: `open`, `ongoing`, `coming_soon`, `inactive`;
- `featured boolean`;
- `catalogue_sort_order int`;
- `instruction_language_codes text[]`; ISO 639-1 codes, independent from the website locale;
- timestamps.

No public visible filters in Release 1, but fields are present for future filters.

### `programme_translations`

Fields:

- `programme_id uuid`;
- `language_code text`;
- `translation_status translation_status`;
- `title text`;
- `summary text`;
- `hero_copy text`;
- `catalogue_description text`;
- `catalogue_facts text`;
- `catalogue_document_summary text`;
- `sections jsonb`;
- `seo_title text`;
- `seo_description text`;
- timestamps.

`sections` contains structured sales blocks, not arbitrary page-builder content.

### `programme_runs`

`programme_run_status`:

- `upcoming`;
- `open`;
- `ongoing`;
- `closed`.

Fields:

- `id uuid`;
- `programme_id uuid`;
- `status programme_run_status`;
- `starts_at date null`;
- `ends_at date null`;
- `application_url text null`;
- timestamps.

Used to calculate enrolment badge.

Badge mapping:

- `open` run -> `open`;
- `ongoing` run -> `ongoing`;
- `upcoming` run -> `coming_soon`;
- only closed/expired runs or no run -> `inactive`;
- `enrolment_badge_override`, when set, takes precedence.

`open` and `ongoing` are two labels within the active-enrolment public state.
`starts_at` is the learning start date and does not by itself mean that
enrolment is closed before that date.

### `programme_pricing_options`

Fields:

- `id uuid`;
- `programme_id uuid`;
- `price numeric null`;
- `currency_code text null`;
- `application_url text null`;
- `sort_order int`;
- `is_active boolean`;
- timestamps.

### `programme_pricing_option_translations`

Fields:

- `pricing_option_id uuid`;
- `language_code text`;
- `translation_status translation_status`;
- `title text`;
- `description text`;
- `cta_label text`;
- timestamps.

If no active pricing options exist, pricing block is hidden. Pricing-option and
run URLs are vendor-neutral external application URLs. The programme-level
`application_provider` identifies whether the destination is Leeloo or a partner
website.

The model renders a variable number of tariff cards; programmes may use one,
two, or three options without schema or layout-data changes. No pricing record
is required for publication. Partner-managed prices are not duplicated unless
the product owner explicitly changes the sales model.

### `programme_slug_redirects`

Fields:

- `old_slug text primary key`;
- `new_slug text not null`;
- `entity_type text`;
- `entity_id uuid`;
- `created_at`.

Slug namespace under `/programmes/[slug]` must be unique across programmes, areas, and types.

Cross-entity uniqueness is enforced by database triggers on `programmes`,
`programme_areas`, and `programme_types`. Individual table unique constraints
remain in place as a second layer.

## 7. Partners and Experts

### `partners`

Public content only.

No relation to credential verification.

### `partner_translations`

Multilingual content for partner cards.

### `experts`

Public card entity, no individual public page in Release 1.

### `expert_translations`

Multilingual expert card content.

### Relations

Optional:

- `programme_partners`;
- `programme_experts`.

## 8. Contact Submissions

`contact_submission_type`:

- `general`;
- `programme_question`;
- `partner_enquiry`;
- `organisation_enquiry`.

`contact_submission_status`:

- `new`;
- `processed`;
- `archived`.

### `contact_submissions`

Fields:

- `id uuid`;
- `type contact_submission_type`;
- `status contact_submission_status`;
- `programme_id uuid null`;
- `name text`;
- `email text`;
- `phone text null`;
- `message text`;
- `language_code text`;
- `metadata jsonb`;
- timestamps.

## 9. Learners

### `learners`

Fields:

- `id uuid`;
- `latin_first_name text`;
- `latin_last_name text`;
- `ukrainian_full_name text`;
- `internal_note text null`;
- `archived_at timestamptz null`;
- timestamps.

### `learner_emails`

Fields:

- `id uuid`;
- `learner_id uuid references learners(id)`;
- `email citext unique not null`;
- `is_primary boolean not null default false`;
- timestamps.

Constraint:

- one primary email per learner.

### `learner_phones`

Fields:

- `id uuid`;
- `learner_id uuid references learners(id)`;
- `phone text unique not null`;
- `has_telegram boolean not null default false`;
- `telegram_username text null`;
- `has_viber boolean not null default false`;
- `has_whatsapp boolean not null default false`;
- `is_primary boolean not null default false`;
- timestamps.

Constraint:

- one primary phone per learner.

### Learner import workflow

`public.import_learners(jsonb)` is a controlled, atomic persistence workflow rather than a new data table. It accepts 1–500 normalized rows, repeats critical value and duplicate checks, creates learner/contact records in one transaction, and rejects the full batch if any submitted row conflicts. Existing learner records are never overwritten. Its Audit Log event is `learners.imported` with the imported count only and no learner personal data.

## 10. Credentials

### Enums

`credential_status`:

- `pending`;
- `valid`;
- `revoked`;
- `voided`.

`document_number_status`:

- `reserved`;
- `issued`;
- `voided`.

`credential_file_type`:

- configurable reference table is preferred over enum.

### `credential_sets`

Fields:

- `id uuid`;
- `learner_id uuid references learners(id)`;
- `programme_id uuid references programmes(id)`;
- `programme_run_id uuid null references programme_runs(id)`;
- `completion_date date null`;
- timestamps.

No status.

No public verification.

### `credential_types`

Reference table for document identity type.

Fields:

- `id uuid`;
- `code text unique`;
- `document_letter text not null`;
- `is_active boolean`;
- timestamps.

Examples:

- Certificate -> `C`;
- Diploma -> `D`.

### `credential_type_translations`

Fields:

- `credential_type_id uuid`;
- `language_code text`;
- `display_name text`;
- timestamps.

### `credentials`

Fields:

- `id uuid`;
- `credential_set_id uuid references credential_sets(id)`;
- `learner_id uuid references learners(id)`;
- `programme_id uuid references programmes(id)`;
- `programme_run_id uuid null references programme_runs(id)`;
- `credential_type_id uuid references credential_types(id)`;
- `language_code text`;
- `status credential_status`;
- `issue_date date not null`;
- `document_number text unique not null`;
- `verification_token_lookup_hash text unique not null`;
- `verification_token_encrypted text not null`;
- `token_encryption_key_version int not null`;
- `public_holder_name text not null`;
- `public_programme_title text not null`;
- `public_credential_type text not null`;
- `activated_at timestamptz null`;
- `revoked_at timestamptz null`;
- `revoked_by uuid null`;
- `revocation_reason text null`;
- `voided_at timestamptz null`;
- `voided_by uuid null`;
- `void_reason text null`;
- timestamps.

Partners are not stored on credentials for verification.

### `credential_files`

Fields:

- `id uuid`;
- `credential_id uuid references credentials(id)`;
- `file_type_id uuid`;
- `admin_label text`;
- `storage_bucket text`;
- `storage_path text`;
- `mime_type text`;
- `size_bytes bigint`;
- `is_primary boolean not null default false`;
- `uploaded_by uuid`;
- timestamps.

Constraint:

- one primary file per credential.

### `credential_file_types`

Fields:

- `id uuid`;
- `code text unique`;
- `default_label text`;
- `is_active boolean`;
- timestamps.

Examples:

- `main_certificate`;
- `supplement`;
- `transcript`.

### `document_number_log`

Fields:

- `id uuid`;
- `document_number text unique`;
- `credential_id uuid null`;
- `credential_type_id uuid`;
- `status document_number_status`;
- `created_by uuid`;
- `voided_by uuid null`;
- `void_reason text null`;
- timestamps.

### Credential Document Template and Generation Objects

Release 1 adds private, RLS-protected objects for the automatic document
generation requirement:

- `credential_template_packages` — programme, optional run, credential type,
  language, and explicit variant identity;
- `credential_template_versions` — version records with draft/published/retired
  state and immutable published rendering content;
- `credential_template_documents` — one or more source PDFs per version, with
  file type, administrative label, output filename, sort order, private source
  metadata, page count, and exactly one primary output per published version;
- `credential_template_document_pages` — contiguous per-page dimensions for
  multi-page documents and placement-bound enforcement;
- `credential_template_field_placements` — constrained field/page geometry and
  text/QR rendering rules;
- `credential_generation_batches` — private shared issuing context and
  aggregate processing state;
- `credential_generation_batch_items` — one learner/credential result per
  batch item, including retry-safe processing state;
- `credential_file_generations` — generated-file provenance linked to the
  exact template version without raw token, source bytes, generated bytes, or
  private storage paths in audit metadata.

One Template Package may generate a primary Certificate/Diploma PDF plus one or
more additional Supplement/Transcript PDFs. Every source and generated PDF may
contain multiple pages.

Published template versions are immutable. Batch processing is resumable and
idempotent. A batch item that has reserved a number but failed generation keeps
its pending credential and permanent reserved number for retry; the number is
never reused.

Template version states are `draft`, `published`, and `retired`. Generation
batch/item states are private workflow states only. They do not alter the
credential lifecycle, and internal `processing_chunk_size` is a bounded worker
control rather than a cohort-size limit.

No new credential lifecycle statuses are introduced. Exact fields, constraints,
indexes, enum/check states, and grants are defined by the forward-only
`PDFGEN-001` migration ticket and must follow
`docs/product/CREDENTIAL_DOCUMENT_GENERATION_SPECIFICATION_v2.md`.

## 11. Credential Email

### `email_templates`

Fields:

- `id uuid`;
- `template_key text`;
- `language_code text`;
- `subject text`;
- `body text`;
- `updated_by uuid`;
- timestamps.

Unique:

- `(template_key, language_code)`.

### `credential_email_sends`

Fields:

- `id uuid`;
- `credential_id uuid`;
- `recipient_email text null`;
- `subject text`;
- `body text`;
- `status text`;
- `technical_error text null`;
- `sent_by uuid`;
- `sent_at timestamptz`;
- `files jsonb`.

`files` stores file names/types sent, not PDF copies.

## 12. History and Audit

### `credential_history`

Fields:

- `id uuid`;
- `credential_id uuid`;
- `event_type text`;
- `actor_id uuid`;
- `reason text null`;
- `before_data jsonb null`;
- `after_data jsonb null`;
- `created_at timestamptz`.

Events include:

- status changes;
- public data changes;
- PDF replacements;
- email sends;
- number events;
- set moves;
- notes.

### `credential_notes`

Fields:

- `id uuid`;
- `credential_id uuid`;
- `author_id uuid`;
- `body text`;
- `deleted_at timestamptz null`;
- `deleted_by uuid null`;
- timestamps.

### `audit_log`

Append-only global audit for sensitive/admin actions.

Must not store raw token, MFA secret, private file content, or unnecessary PII.

## 13. Storage

Buckets:

- `public-media`;
- `credential-templates`;
- `private-credentials`.

Public cannot access `credential-templates` or `private-credentials`.

Template sources and generated credential PDFs are accessed through controlled
server routes. Generated credential PDFs use short-lived admin URLs where
needed and server-side VEDOS SMTP sending. Published template objects are
immutable; source and generated paths are never exposed publicly.

## 14. Removed/Replaced From v1

Remove or replace:

- complex `credential_group_status`;
- `expired`;
- `cancelled`;
- public/internal `reissued` lifecycle;
- immutable credential snapshots as public source of truth;
- partner fields in credential verification;
- single `user_profiles.role`;
- `/uk` and `/cs` language assumptions.
