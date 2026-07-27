# **DATABASE SCHEMA v1.1**

## **Новий сайт і система перевірки документів Nobel ITBS**

**Версія:** 1.1  
**Статус:** робочий документ для технічного затвердження  
**Продукт:** nobel-itbs.eu  
**База даних:** PostgreSQL / Supabase  
**Власник продукту:** Nobel ITBS s.r.o.  
**Product Owner:** Ольга Дашевська

---

# **1\. Мета документа**

Цей документ визначає структуру бази даних Release 1:

* tables;  
* fields;  
* data types;  
* relations;  
* enums;  
* constraints;  
* indexes;  
* credential snapshot;  
* credential grouping;  
* reissue logic;  
* verification model;  
* RLS;  
* audit events;  
* archive and deletion rules.

Документ є основою для:

* SQL migrations;  
* Supabase configuration;  
* backend implementation;  
* admin panel;  
* Credential Module Specification;  
* API specification;  
* backlog і tickets для Codex.  
  ---

  # **2\. Архітектурні принципи**

  ## **2.1. UUID**

Усі основні сутності використовують:

`uuid primary key default gen_random_uuid()`

Numeric ID не використовуються у публічних URL або бізнес-логіці.

## **2.2. Часові поля**

Основні таблиці мають:

* `created_at timestamptz not null default now()`;  
* `updated_at timestamptz not null default now()`.

Для архівованих сутностей:

* `archived_at timestamptz null`.

  ## **2.3. Видалення**

Фізично не видаляються:

* credentials;  
* credential snapshots;  
* credential groups із виданими документами;  
* credential status history;  
* audit log;  
* learners із credentials;  
* programmes із credentials;  
* credential types, що вже використовувалися;  
* issuers, які використані у credentials.

Для них застосовуються:

* archive;  
* deactivate;  
* revoke;  
* cancel;  
* soft delete — тільки для Pending drafts.

  ## **2.4. Мови**

Багатомовний контент зберігається в окремих translation tables.

JSONB використовується лише для вкладених контентних блоків:

* modules;  
* learning outcomes;  
* competencies;  
* additional public fields.

  ## **2.5. Public verification**

Публічний frontend не має direct SELECT до:

* learners;  
* credentials;  
* credential snapshots;  
* audit log;  
* private files.

Verification виконується лише через server-side function/API.

## **2.6. Partners**

Partners:

* використовуються для trust-page;  
* пов’язуються з programmes;  
* можуть показуватися на programme pages;  
* не використовуються як verification entity;  
* не входять у credential snapshot;  
* не впливають на verification result;  
* не є автоматично credential issuer.  
  ---

  # **3\. Enums**

  ## **3.1. `app_role`**

* `super_admin`  
* `content_manager`  
* `credential_manager`

  ## **3.2. `record_status`**

* `draft`  
* `published`  
* `archived`

  ## **3.3. `programme_publication_status`**

* `draft`  
* `published`  
* `archived`

  ## **3.4. `programme_run_status`**

* `draft`  
* `upcoming`  
* `enrolment_open`  
* `closed`  
* `completed`  
* `cancelled`

  ## **3.5. `programme_format`**

* `self_paced_online`  
* `cohort_online`  
* `blended_online`  
* `hybrid`  
* `in_person`

  ## **3.6. `duration_unit`**

* `hours`  
* `days`  
* `weeks`  
* `months`

  ## **3.7. `credential_status`**

* `pending`  
* `valid`  
* `revoked`  
* `reissued`  
* `expired`  
* `cancelled`

`cancelled` використовується тільки для Pending credentials, які не були активовані.

## **3.8. `credential_group_status`**

* `draft`  
* `active`  
* `completed`  
* `cancelled`

  ## **3.9. `audit_action`**

* `create`  
* `update`  
* `publish`  
* `unpublish`  
* `archive`  
* `restore`  
* `activate`  
* `cancel`  
* `revoke`  
* `reissue`  
* `role_change`  
* `login`  
* `login_failed`  
* `password_reset`  
* `mfa_enabled`  
* `mfa_disabled`  
* `file_upload`  
* `file_delete`  
* `number_override`

  ## **3.10. `organisation_type`**

* `university`  
* `higher_education_institution`  
* `professional_body`  
* `cpd_provider`  
* `training_provider`  
* `company`  
* `ngo`  
* `government_body`  
* `clinic`  
* `research_organisation`  
* `other`

  ## **3.11. `contact_submission_type`**

* `general`  
* `partner_enquiry`  
* `organisation_enquiry`

  ## **3.12. `contact_submission_status`**

* `new`  
* `processed`  
* `spam`  
* `archived`  
  ---

  # **4\. Reference tables**

  ## **4.1. `languages`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `code` | varchar(10) PK | no |
| `name_en` | varchar(100) | no |
| `name_native` | varchar(100) | no |
| `is_interface_enabled` | boolean | no |
| `is_content_enabled` | boolean | no |
| `created_at` | timestamptz | no |

Seed:

* `en`;  
* `uk`;  
* `cs` disabled.

  ## **4.2. `countries`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `code` | char(2) PK | no |
| `name_en` | varchar(150) | no |
| `is_active` | boolean | no |

Uses ISO 3166-1 alpha-2.

## **4.3. `currencies`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `code` | char(3) PK | no |
| `name` | varchar(100) | no |
| `symbol` | varchar(10) | yes |
| `is_active` | boolean | no |

Initial values:

* EUR;  
* CZK;  
* USD;  
* UAH;  
* GBP.  
  ---

  # **5\. User profiles**

  ## **5.1. `user_profiles`**

Extends `auth.users`.

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK/FK → auth.users | no |
| `full_name` | varchar(200) | no |
| `role` | app\_role | no |
| `is_active` | boolean | no |
| `mfa_required` | boolean | no |
| `last_login_at` | timestamptz | yes |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Rules:

* MFA required for Super Admin;  
* MFA required for Credential Manager;  
* direct role update is forbidden;  
* role changes only through controlled Super Admin function.  
  ---

  # **6\. Programme dictionaries**

  ## **6.1. `programme_fields`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `code` | varchar(60) unique | no |
| `slug` | varchar(120) unique | no |
| `display_order` | integer | no |
| `status` | record\_status | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Seed:

* Human & Behavioral Sciences;  
* Business & Management;  
* Technology & Innovation.

  ## **6.2. `programme_field_translations`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `programme_field_id` | uuid FK | no |
| `language_code` | varchar(10) FK | no |
| `title` | varchar(200) | no |
| `short_description` | text | yes |
| `intro_content` | text | yes |
| `seo_title` | varchar(255) | yes |
| `seo_description` | varchar(320) | yes |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Constraint:

`unique(programme_field_id, language_code)`

## **6.3. `programme_types`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `code` | varchar(80) unique | no |
| `slug` | varchar(120) unique | no |
| `display_order` | integer | no |
| `status` | record\_status | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

## **6.4. `programme_type_translations`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `programme_type_id` | uuid FK | no |
| `language_code` | varchar(10) FK | no |
| `title` | varchar(200) | no |
| `short_description` | text | yes |
| `seo_title` | varchar(255) | yes |
| `seo_description` | varchar(320) | yes |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Constraint:

`unique(programme_type_id, language_code)`

---

# **7\. Programmes**

## **7.1. `programmes`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `slug` | varchar(180) unique | no |
| `programme_field_id` | uuid FK | no |
| `programme_type_id` | uuid FK | no |
| `publication_status` | programme\_publication\_status | no |
| `format` | programme\_format | no |
| `duration_value` | numeric(8,2) | yes |
| `duration_unit` | duration\_unit | yes |
| `learning_hours` | integer | yes |
| `ects` | numeric(5,2) | yes |
| `base_price` | numeric(12,2) | yes |
| `currency_code` | char(3) FK | yes |
| `default_leeloo_url` | text | yes |
| `is_featured` | boolean | no |
| `featured_order` | integer | yes |
| `published_at` | timestamptz | yes |
| `archived_at` | timestamptz | yes |
| `created_by` | uuid FK | no |
| `updated_by` | uuid FK | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Constraints:

* `learning_hours > 0`, якщо задано;  
* `ects > 0`, якщо задано;  
* `base_price >= 0`, якщо задано;  
* currency required if price exists;  
* `featured_order` only when featured;  
* archived programme cannot be featured;  
* publish requires EN and UA translation;  
* programme with credentials cannot be physically deleted.

Indexes:

* slug;  
* field;  
* type;  
* publication status;  
* featured;  
* composite `(publication_status, programme_field_id, programme_type_id)`.

  ## **7.2. `programme_translations`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `programme_id` | uuid FK | no |
| `language_code` | varchar(10) FK | no |
| `title` | varchar(255) | no |
| `short_description` | text | no |
| `full_description` | text | yes |
| `target_audience` | text | no |
| `learning_outcomes` | jsonb | no |
| `competencies` | jsonb | yes |
| `modules` | jsonb | yes |
| `assessment` | text | yes |
| `admission_requirements` | text | yes |
| `credential_description` | text | no |
| `cta_label` | varchar(100) | yes |
| `seo_title` | varchar(255) | yes |
| `seo_description` | varchar(320) | yes |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Constraint:

`unique(programme_id, language_code)`

JSONB rules:

* `learning_outcomes` must be array;  
* `competencies` must be array if present;  
* `modules` must be array if present.

  ## **7.3. `programme_instruction_languages`**

PK:

`(programme_id, language_code)`

## **7.4. `programme_credential_languages`**

PK:

`(programme_id, language_code)`

---

# **8\. Programme Runs**

## **8.1. `programme_runs`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `programme_id` | uuid FK | no |
| `status` | programme\_run\_status | no |
| `is_primary` | boolean | no |
| `start_date` | date | yes |
| `end_date` | date | yes |
| `application_deadline` | timestamptz | yes |
| `price` | numeric(12,2) | yes |
| `currency_code` | char(3) FK | yes |
| `capacity` | integer | yes |
| `leeloo_url` | text | yes |
| `created_by` | uuid FK | no |
| `updated_by` | uuid FK | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Constraints:

* end date cannot precede start date;  
* application deadline cannot exceed start date;  
* price cannot be negative;  
* currency required with price;  
* capacity \> 0;  
* cancelled/completed runs cannot be primary;  
* one primary run per programme.

Partial unique index:

`unique(programme_id) where is_primary = true`

Controlled function rules:

* primary run must be upcoming or enrolment\_open;  
* archived programme cannot have a primary run;  
* primary run must belong to a published programme.  
  ---

  # **9\. Experts**

  ## **9.1. `experts`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `slug` | varchar(180) unique | no |
| `photo_path` | text | yes |
| `publication_status` | record\_status | no |
| `created_by` | uuid FK | no |
| `updated_by` | uuid FK | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

  ## **9.2. `expert_translations`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `expert_id` | uuid FK | no |
| `language_code` | varchar(10) FK | no |
| `full_name` | varchar(255) | no |
| `position` | varchar(255) | yes |
| `academic_degree` | varchar(255) | yes |
| `professional_qualification` | text | yes |
| `biography` | text | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Constraint:

`unique(expert_id, language_code)`

## **9.3. `programme_experts`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `programme_id` | uuid FK | no |
| `expert_id` | uuid FK | no |
| `role_code` | varchar(80) | no |
| `display_order` | integer | no |
| `is_public` | boolean | no |
| `created_at` | timestamptz | no |

Primary key:

`(programme_id, expert_id, role_code)`

Programme-level roles:

* author;  
* lead\_expert;  
* academic\_reviewer;  
* programme\_curator.

  ## **9.4. `programme_run_experts`**

Опційна Release 1.1 таблиця.

| Field | Type | Null |
| ----- | ----- | ----- |
| `programme_run_id` | uuid FK | no |
| `expert_id` | uuid FK | no |
| `role_code` | varchar(80) | no |
| `display_order` | integer | no |

Run-level roles:

* instructor;  
* guest\_expert;  
* facilitator.

Display rule:

1. authors and reviewers come from Programme;  
2. instructors come from Programme Run;  
3. if run-specific instructors are absent, Programme instructors may be used as fallback.  
   ---

   # **10\. Partners**

   ## **10.1. `partners`**

Partners are public content entities only.

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `slug` | varchar(180) unique | no |
| `official_name` | varchar(255) | no |
| `country_code` | char(2) FK | no |
| `organisation_type` | organisation\_type | no |
| `website_url` | text | yes |
| `logo_path` | text | yes |
| `publication_status` | record\_status | no |
| `display_order` | integer | no |
| `created_by` | uuid FK | no |
| `updated_by` | uuid FK | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Partners:

* are shown on trust-page;  
* may be related to programmes;  
* are not used in credential verification;  
* are not credential issuers;  
* are not copied to credential snapshots.

  ## **10.2. `partner_translations`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `partner_id` | uuid FK | no |
| `language_code` | varchar(10) FK | no |
| `display_name` | varchar(255) | no |
| `short_description` | text | no |
| `role_description` | text | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Constraint:

`unique(partner_id, language_code)`

## **10.3. `programme_partners`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `programme_id` | uuid FK | no |
| `partner_id` | uuid FK | no |
| `role_code` | varchar(80) | no |
| `display_order` | integer | no |
| `is_public` | boolean | no |
| `created_at` | timestamptz | no |

Partner programme roles:

* academic\_partner;  
* content\_partner;  
* cpd\_partner;  
* delivery\_partner;  
* technology\_partner.

No relation from partners to credentials.

---

# **11\. Credential Issuers**

## **11.1. `credential_issuers`**

Internal controlled dictionary of organisations that can formally issue credentials.

This table is separate from Partners.

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `code` | varchar(80) unique | no |
| `official_name` | varchar(255) | no |
| `country_code` | char(2) FK | yes |
| `registration_number` | varchar(100) | yes |
| `is_active` | boolean | no |
| `created_by` | uuid FK | no |
| `updated_by` | uuid FK | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Initial issuer:

* Nobel ITBS s.r.o.

Rules:

* issuer is not public partner by default;  
* issuer is used in credential creation;  
* verification can show issuer name;  
* verification does not show partners;  
* issuer cannot be deleted if used by credentials.  
  ---

  # **12\. Learners**

  ## **12.1. `learners`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `full_name_original` | varchar(255) | no |
| `full_name_latin` | varchar(255) | yes |
| `email` | citext | yes |
| `country_code` | char(2) FK | yes |
| `internal_note` | text | yes |
| `created_by` | uuid FK | no |
| `updated_by` | uuid FK | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Indexes:

* trigram `full_name_original`;  
* trigram `full_name_latin`;  
* lower(email).

Email is not unique.

Deletion:

* no physical delete if credentials exist;  
* learner without credentials may be soft-deleted by Super Admin.  
  ---

  # **13\. Credential Types**

  ## **13.1. `credential_types`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `code` | varchar(80) unique | no |
| `name` | varchar(255) | no |
| `number_prefix` | varchar(30) | no |
| `number_pattern` | varchar(255) | no |
| `default_issuer_id` | uuid FK → credential\_issuers | no |
| `has_expiry` | boolean | no |
| `template_reference` | text | yes |
| `is_active` | boolean | no |
| `created_by` | uuid FK | no |
| `updated_by` | uuid FK | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Removed:

* configurable `public_fields`;  
* configurable `required_fields`;  
* configurable `allowed_statuses`;  
* partner issuer relation.

Required and public fields are defined in application code and Credential Module Specification.

Only Super Admin can create or change Credential Types.

---

# **14\. Credential Groups**

## **14.1. `credential_groups`**

Represents one completion event or one set of related documents.

Example group:

* Professional Development Diploma;  
* Certificate Supplement;  
* CPD Certificate.

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `learner_id` | uuid FK | no |
| `programme_id` | uuid FK | no |
| `programme_run_id` | uuid FK | yes |
| `completion_date` | date | yes |
| `status` | credential\_group\_status | no |
| `created_by` | uuid FK | no |
| `updated_by` | uuid FK | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Rules:

* group may contain one or several credentials;  
* each credential has its own number and token;  
* group is not publicly verified;  
* QR always verifies one specific credential;  
* partner data are not stored in group.  
  ---

  # **15\. Credential Number Sequences**

  ## **15.1. `credential_number_sequences`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `credential_type_id` | uuid FK | no |
| `year` | integer | no |
| `last_value` | integer | no |
| `updated_at` | timestamptz | no |

Constraint:

`unique(credential_type_id, year)`

Generation:

* transactional;  
* row lock;  
* no reuse;  
* cancelled Pending number is not released.  
  ---

  # **16\. Credentials**

  ## **16.1. `credentials`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `credential_group_id` | uuid FK | no |
| `learner_id` | uuid FK | no |
| `programme_id` | uuid FK | no |
| `programme_run_id` | uuid FK | yes |
| `credential_type_id` | uuid FK | no |
| `issuer_id` | uuid FK → credential\_issuers | no |
| `document_number` | varchar(100) unique | no |
| `verification_token_hash` | text unique | no |
| `verification_token_encrypted` | text | no |
| `status` | credential\_status | no |
| `issue_date` | date | no |
| `completion_date` | date | yes |
| `valid_from` | date | yes |
| `expires_at` | date | yes |
| `predecessor_credential_id` | uuid FK | yes |
| `successor_credential_id` | uuid FK | yes |
| `private_pdf_path` | text | yes |
| `internal_note` | text | yes |
| `idempotency_key` | uuid unique | no |
| `activated_at` | timestamptz | yes |
| `revoked_at` | timestamptz | yes |
| `revoked_reason` | text | yes |
| `cancelled_at` | timestamptz | yes |
| `created_by` | uuid FK | no |
| `updated_by` | uuid FK | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

Removed:

* token prefix;  
* direct Partner fields;  
* partner snapshot;  
* snapshot version.

  ## **16.2. Token model**

Stored:

* encrypted token for QR regeneration;  
* deterministic HMAC/SHA-256 hash for lookup.

Lookup process:

1. receive raw token;  
2. normalize;  
3. calculate hash;  
4. query unique hash index;  
5. never query encrypted token directly.

Raw token:

* never logged;  
* never returned in analytics;  
* never exposed after authenticated QR generation workflow except through protected server operation.

  ## **16.3. Constraints**

* document number unique;  
* token hash unique;  
* idempotency key unique;  
* issue date cannot precede completion date;  
* expiry cannot precede valid\_from;  
* programme run must belong to programme;  
* issuer must be active before activation;  
* Valid requires activated\_at;  
* Revoked requires revoked\_at and reason;  
* Reissued requires successor;  
* Cancelled only allowed from Pending;  
* successor/predecessor cannot reference itself;  
* successor belongs to same learner and credential group or approved replacement group;  
* one active successor maximum;  
* credentials are never physically deleted after activation.  
  ---

  # **17\. Credential Snapshot**

  ## **17.1. `credential_snapshots`**

One immutable snapshot per credential.

| Field | Type | Null |
| ----- | ----- | ----- |
| `credential_id` | uuid PK/FK | no |
| `printed_full_name` | varchar(255) | no |
| `programme_title` | varchar(255) | no |
| `credential_type_name` | varchar(255) | no |
| `document_number` | varchar(100) | no |
| `learning_hours` | integer | yes |
| `ects` | numeric(5,2) | yes |
| `instruction_languages` | varchar(10)\[\] | yes |
| `credential_languages` | varchar(10)\[\] | no |
| `issuer_name` | varchar(255) | no |
| `issuer_country_code` | char(2) | yes |
| `completion_date` | date | yes |
| `issue_date` | date | no |
| `expiry_date` | date | yes |
| `additional_public_data` | jsonb | yes |
| `created_at` | timestamptz | no |

Snapshot does not contain:

* partner name;  
* partner role;  
* programme partner;  
* email;  
* phone;  
* address;  
* internal note;  
* PDF path;  
* token.

  ## **17.2. Source of truth**

Operational dates remain in `credentials`.

Snapshot copies public printed values at activation.

Activation function checks:

* snapshot issue date equals credential issue date;  
* snapshot completion date equals credential completion date;  
* snapshot expiry date equals credential expires\_at;  
* snapshot document number equals credential document number;  
* snapshot issuer equals selected issuer.

After activation:

* snapshot immutable;  
* operational public date changes prohibited;  
* changes require Reissue.  
  ---

  # **18\. Credential Status History**

  ## **18.1. `credential_status_history`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `credential_id` | uuid FK | no |
| `previous_status` | credential\_status | yes |
| `new_status` | credential\_status | no |
| `reason` | text | yes |
| `changed_by` | uuid FK | no |
| `changed_at` | timestamptz | no |

Rules:

* immutable;  
* append-only;  
* status change only via controlled functions;  
* revoke requires reason;  
* cancel reason recommended.  
  ---

  # **19\. Credential Events**

`credential_events` is removed from Release 1\.

Credential history is covered by:

* `credential_status_history`;  
* `audit_log`.

A separate event stream may be added later if needed.

---

# **20\. FAQ**

## **20.1. `faq_items`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `category_code` | varchar(80) | no |
| `display_order` | integer | no |
| `publication_status` | record\_status | no |
| `created_by` | uuid FK | no |
| `updated_by` | uuid FK | no |
| `created_at` | timestamptz | no |
| `updated_at` | timestamptz | no |

## **20.2. `faq_translations`**

Constraint:

`unique(faq_item_id, language_code)`

---

# **21\. Contact Submissions**

## **21.1. `contact_submissions`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `submission_type` | contact\_submission\_type | no |
| `name` | varchar(255) | no |
| `organisation` | varchar(255) | yes |
| `email` | citext | no |
| `country_code` | char(2) FK | yes |
| `interest_code` | varchar(100) | yes |
| `message` | text | no |
| `language_code` | varchar(10) FK | no |
| `consent_given` | boolean | no |
| `source_page` | text | yes |
| `utm_data` | jsonb | yes |
| `status` | contact\_submission\_status | no |
| `created_at` | timestamptz | no |

Process:

* stored in Supabase;  
* email notification sent;  
* public insert only through protected API/function;  
* spam protection and rate limiting required.  
  ---

  # **22\. Audit Log**

  ## **22.1. `audit_log`**

| Field | Type | Null |
| ----- | ----- | ----- |
| `id` | uuid PK | no |
| `actor_user_id` | uuid FK | yes |
| `actor_role` | app\_role | yes |
| `action` | audit\_action | no |
| `entity_type` | varchar(100) | no |
| `entity_id` | uuid | yes |
| `changed_fields` | jsonb | yes |
| `metadata` | jsonb | yes |
| `ip_hash` | text | yes |
| `user_agent_summary` | text | yes |
| `created_at` | timestamptz | no |

Audit uses whitelist logging.

It does not automatically store full rows.

Allowed examples:

* status;  
* publication status;  
* role;  
* credential type ID;  
* programme ID;  
* timestamp;  
* action reason.

Never logged:

* raw token;  
* encrypted token;  
* token hash;  
* learner email;  
* full contact message;  
* PDF path;  
* signed URL;  
* password;  
* access token;  
* MFA secret.

Rules:

* append-only;  
* no update;  
* no delete;  
* read only for Super Admin.  
  ---

  # **23\. Reissue Logic**

  ## **23.1. Draft successor**

Conditions:

* predecessor is Valid;  
* no active successor;  
* actor is Credential Manager or Super Admin.

System:

1. creates new Pending credential;  
2. creates new idempotency key;  
3. copies previous snapshot as editable draft data;  
4. generates new document number;  
5. generates new token;  
6. assigns predecessor;  
7. predecessor remains Valid.

   ## **23.2. Activation**

Transactional function:

1. validates successor Pending;  
2. validates predecessor Valid;  
3. validates immutable snapshot completeness;  
4. activates successor;  
5. changes predecessor to Reissued;  
6. links predecessor and successor;  
7. writes status history;  
8. writes audit log.

   ## **23.3. Cancellation**

If successor is Pending:

* set status Cancelled;  
* predecessor remains Valid;  
* number is not reused;  
* token is disabled from public verification;  
* audit log created.

  ## **23.4. Restrictions**

* one active successor;  
* same learner;  
* default same credential group;  
* Credential Type change requires Super Admin approval;  
* revoked credential cannot be reissued through standard flow;  
* old verification URL remains active and shows Reissued.  
  ---

  # **24\. Document Number Generation**

Generated through database function.

Inputs:

* credential type;  
* year;  
* optional programme code.

Example:

`NITBS-MBA-2026-000127`

Requirements:

* atomic;  
* transaction locked;  
* unique;  
* irreversible;  
* never reused;  
* manual override only by Super Admin before activation;  
* override audit logged.  
  ---

  # **25\. Verification Token**

Requirements:

* minimum 128 bits entropy;  
* URL-safe;  
* random;  
* no personal data;  
* no document number;  
* immutable after activation;  
* unique.

Recommended format:

* base64url;  
* 22–32 characters.

Storage:

* encrypted token;  
* token hash;  
* no prefix.  
  ---

  # **26\. Public Verification Function**

Function:

`verify_credential(input_token text, requested_language text)`

Process:

1. normalize input;  
2. calculate deterministic hash;  
3. search by `verification_token_hash`;  
4. verify status;  
5. return public-safe response.

Returns:

* status;  
* document number;  
* snapshot public fields;  
* verification timestamp;  
* successor URL if Reissued and allowed.

Does not return:

* learner ID;  
* programme ID;  
* credential UUID;  
* token;  
* token hash;  
* encrypted token;  
* internal notes;  
* private PDF;  
* audit data;  
* partner data.

Pending:

* returns only status;  
* no personal data.

Cancelled:

* returns generic Not Found or inactive response according to Credential Module Specification.  
  ---

  # **27\. Manual Verification**

Function:

`resolve_credential_identifier(input_value text)`

Accepts:

* document number;  
* verification token.

Document number flow:

1. find credential;  
2. resolve token internally;  
3. server-side redirect to public verification URL;  
4. raw credential data not returned to frontend.

Security:

* rate limiting;  
* CAPTCHA after suspicious activity;  
* generic errors;  
* no raw input stored in logs.  
  ---

  # **28\. Indexes**

  ## **Programmes**

* slug unique;  
* publication status;  
* field;  
* type;  
* featured;  
* primary active run.

  ## **Learners**

* trigram original name;  
* trigram Latin name;  
* lower(email).

  ## **Credentials**

* document number unique;  
* token hash unique;  
* idempotency key unique;  
* learner;  
* programme;  
* programme run;  
* group;  
* issuer;  
* type;  
* status;  
* issue date;  
* predecessor;  
* successor.

  ## **Contact**

* status;  
* created\_at;  
* submission type.

  ## **Audit**

* entity and entity ID;  
* actor and created\_at;  
* action and created\_at.  
  ---

  # **29\. RLS Operation Matrix**

  ## **29.1. Core access**

| Table | Public | Content Manager | Credential Manager | Super Admin |
| ----- | ----- | ----- | ----- | ----- |
| programmes | published view | CRUD | no | CRUD |
| programme translations | published view | CRUD | no | CRUD |
| programme runs | published view | CRUD | read limited | CRUD |
| partners | published view | CRUD | no | CRUD |
| experts | published view | CRUD | no | CRUD |
| FAQ | published view | CRUD | no | CRUD |
| learners | no | no | CRUD | CRUD |
| credential groups | no | no | CRUD | CRUD |
| credentials | function only | no | controlled CRUD | controlled CRUD |
| snapshots | function only | no | create before activation/read | controlled |
| status history | no | no | read | read |
| issuers | public name through verification only | no | read | CRUD |
| credential types | no | no | read | CRUD |
| contact submissions | insert function | no | no | read/update |
| users | no | no | no | CRUD |
| audit log | no | no | no | read |

  ## **29.2. Delete rules**

Content Manager:

* may delete Draft programme without linked runs or credentials;  
* otherwise archive.

Credential Manager:

* may cancel Pending credential;  
* cannot delete active credential;  
* may soft-delete learner only if no credentials.

Super Admin:

* cannot delete audit log;  
* cannot delete activated credentials;  
* cannot delete immutable snapshots;  
* cannot reuse numbers.  
  ---

  # **30\. Storage**

  ## **`public-media`**

Contains:

* partner logos;  
* expert photos;  
* programme images.

Access:

* public read;  
* Content Manager write;  
* Super Admin write.

  ## **`private-credentials`**

Should-have for Release 1\.

Contains:

* credential PDF;  
* internal files.

Access:

* Credential Manager;  
* Super Admin;  
* short-lived signed URLs.

Not allowed:

* permanent public URL;  
* signed URL stored in database;  
* file path in audit logs.  
  ---

  # **31\. Audit Events**

  ## **Authentication**

* successful login;  
* failed login;  
* password reset;  
* MFA enabled/disabled;  
* role change;  
* user activation/deactivation.

  ## **Programme**

* create;  
* publish;  
* archive;  
* restore;  
* Leeloo URL change;  
* primary run change.

  ## **Credential**

* Pending created;  
* activated;  
* cancelled;  
* status changed;  
* revoked;  
* reissue initiated;  
* successor activated;  
* number override;  
* PDF upload/delete.

  ## **Credential Type**

* create;  
* update;  
* deactivate;  
* numbering rule change.

  ## **Issuer**

* create;  
* update;  
* deactivate.

  ## **Partner**

* publish;  
* unpublish;  
* programme relation change.  
  ---

  # **32\. Required Database Functions**

1. `set_updated_at()`  
2. `generate_document_number()`  
3. `generate_verification_token()`  
4. `create_credential_group()`  
5. `create_pending_credential()`  
6. `activate_credential()`  
7. `cancel_pending_credential()`  
8. `change_credential_status()`  
9. `reissue_credential()`  
10. `cancel_pending_reissue()`  
11. `verify_credential()`  
12. `resolve_credential_identifier()`  
13. `archive_programme()`  
14. `select_primary_programme_run()`  
15. `change_user_role()`  
16. `write_audit_log()`  
    ---

    # **33\. Required Triggers**

* automatic updated\_at;  
* snapshot immutability;  
* status history;  
* audit whitelist;  
* programme deletion restriction;  
* learner deletion restriction;  
* credential deletion restriction;  
* credential type deletion restriction;  
* issuer deletion restriction;  
* primary run validation;  
* credential group consistency;  
* operational/snapshot date consistency.  
  ---

  # **34\. Seed Data**

  ## **Languages**

* en;  
* uk;  
* cs disabled.

  ## **Countries**

ISO country list.

## **Currencies**

* EUR;  
* CZK;  
* USD;  
* UAH;  
* GBP.

  ## **Roles**

* Super Admin;  
* Content Manager;  
* Credential Manager.

  ## **Programme Fields**

* Human & Behavioral Sciences;  
* Business & Management;  
* Technology & Innovation.

  ## **Programme Types**

* Course;  
* Professional Development Programme;  
* CPD Course;  
* MINI-MBA;  
* Executive Programme;  
* Certificate Programme.

  ## **Credential Issuers**

* Nobel ITBS s.r.o.

  ## **Credential Types**

* Certificate;  
* Professional Development Certificate;  
* Professional Development Diploma;  
* MINI-MBA Diploma;  
* CPD Certificate;  
* Certificate Supplement;  
* Transcript;  
* Attendance Certificate.  
  ---

  # **35\. Migration Order**

1. Extensions:  
   * pgcrypto;  
   * citext;  
   * pg\_trgm.  
2. Enums.  
3. Languages.  
4. Countries.  
5. Currencies.  
6. User profiles.  
7. Programme dictionaries.  
8. Programmes and translations.  
9. Programme Runs.  
10. Experts.  
11. Partners.  
12. Programme relations.  
13. Credential issuers.  
14. Learners.  
15. Credential Types.  
16. Credential Groups.  
17. Number Sequences.  
18. Credentials.  
19. Credential Snapshots.  
20. Status History.  
21. FAQ.  
22. Contact Submissions.  
23. Audit Log.  
24. Functions.  
25. Triggers.  
26. Public Views.  
27. RLS.  
28. Storage Policies.  
29. Seed Data.  
30. Automated Tests.  
    ---

    # **36\. Acceptance Criteria**

Schema is approved when:

* all migrations run successfully;  
* all FKs work;  
* UUIDs are primary keys;  
* programme publish requires EN and UA;  
* one primary run per programme;  
* primary run has valid status;  
* Partner data are not used in verification;  
* Partner data are not copied into snapshot;  
* credential issuer comes from credential\_issuers;  
* one credential group can contain several credentials;  
* each credential has its own number and QR;  
* document number is unique;  
* token hash is unique;  
* token can be securely regenerated from encrypted value;  
* idempotent creation prevents duplicates;  
* Pending can be edited;  
* Valid snapshot is immutable;  
* operational dates match snapshot dates;  
* Reissue creates a new credential;  
* predecessor remains Valid until successor activation;  
* predecessor becomes Reissued only after activation;  
* Revoked requires reason;  
* Cancelled credential is never public;  
* Pending does not expose personal data;  
* verification does not return private IDs;  
* Content Manager cannot access learners or credentials;  
* Credential Manager cannot modify programmes;  
* Credential Manager cannot modify Credential Types;  
* audit log is append-only;  
* private PDFs are not publicly accessible;  
* critical functions have automated tests.  
  ---

  # **37\. Final Technical Decisions**

For Release 1:

1. Verification token is stored encrypted plus hashed.  
2. Token prefix is not stored.  
3. Document numbering is configured per Credential Type.  
4. Partners are not used for credential verification.  
5. Partners are not credential issuers.  
6. Credential issuers use a separate controlled table.  
7. Partners are not stored in credential snapshots.  
8. Each document is a separate Credential.  
9. Related documents are grouped through Credential Group.  
10. Snapshot version is removed.  
11. Modules, outcomes and competencies remain JSONB.  
12. Contact submissions are stored and emailed.  
13. MFA is mandatory for Super Admin and Credential Manager.  
14. Private PDF is Should-have and does not block launch.  
15. Credential events table is removed from Release 1\.  
16. Audit log uses field whitelist, not full-row logging.

