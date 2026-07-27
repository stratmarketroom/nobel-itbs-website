# **SQL MIGRATION PLAN v1**

## **Nobel ITBS Website and Credential Registry**

**Версія:** 1.0  
**Статус:** робочий документ для технічного затвердження  
**Продукт:** nobel-itbs.eu  
**База даних:** PostgreSQL / Supabase  
**Власник продукту:** Nobel ITBS s.r.o.  
**Product Owner:** Ольга Дашевська

---

# **1\. Мета документа**

SQL Migration Plan визначає порядок створення й оновлення бази даних для Release 1\.

Документ фіксує:

* структуру migration files;  
* порядок виконання;  
* залежності;  
* transactional boundaries;  
* extensions;  
* enums;  
* tables;  
* foreign keys;  
* indexes;  
* functions;  
* triggers;  
* views;  
* RLS policies;  
* Storage policies;  
* seed data;  
* automated tests;  
* rollback strategy;  
* deployment procedure;  
* migration acceptance criteria.

Документ не містить повний SQL-код. Він є технічною картою для створення SQL migrations і tickets для Codex.

---

# **2\. Джерела істини**

Migration implementation повинна відповідати:

1. Product Brief and Release 1 Scope;  
2. Sitemap and User Flows;  
3. Database Schema v1.2;  
4. Credential Module Specification v1;  
5. API Specification — після її затвердження;  
6. RLS and Permissions Specification — після її затвердження.

У разі конфлікту:

* Database Schema визначає структуру даних;  
* Credential Module Specification визначає credential lifecycle;  
* RLS Specification визначає доступи;  
* SQL Migration Plan визначає порядок імплементації.

---

# **3\. Принципи migrations**

## **3.1. Immutable migration history**

Після застосування migration до production:

* файл не редагується;  
* migration не перейменовується;  
* зміни вносяться новою migration;  
* не допускається переписування production history.

## **3.2. Один логічний крок — одна migration**

Migration повинна мати одну зрозумілу відповідальність.

Не рекомендується створювати один великий файл, який одночасно:

* створює таблиці;  
* додає RLS;  
* додає functions;  
* заповнює seed;  
* створює tests.

## **3.3. Transactional migrations**

DDL migrations виконуються в transaction, якщо PostgreSQL operation це дозволяє.

Необхідно окремо перевірити операції, які можуть:

* блокувати таблицю;  
* виконуватися довго;  
* не підтримувати transaction;  
* змінювати enum у production;  
* перебудовувати великий index.

## **3.4. Forward-only strategy**

Основна production-стратегія:

* виправлення через нову forward migration;  
* rollback використовується лише до внесення production data або в межах deployment window.

Для credentials, audit log і status history destructive rollback не допускається.

## **3.5. Environment parity**

Однаковий migration chain використовується для:

* local;  
* CI;  
* staging;  
* production.

Не допускаються ручні production-only зміни через Supabase UI без migration file.

## **3.6. Naming convention**

Рекомендований формат:

`YYYYMMDDHHMMSS_description.sql`

Приклад:

`20260723120000_enable_extensions.sql`

Назва:

* lowercase;  
* snake\_case;  
* одна логічна дія;  
* без загальних назв на кшталт `update.sql`.

---

# **4\. Migration directories**

Рекомендована структура:

supabase/  
  migrations/  
  seed.sql  
  tests/  
    database/  
    rls/  
    credential/  
  functions/  
  config.toml

Додатково:

docs/  
  database/  
    SQL\_MIGRATION\_PLAN.md  
    DATABASE\_SCHEMA.md  
    RLS\_SPECIFICATION.md

---

# **5\. Загальний порядок migrations**

## **Phase 0\. Foundation**

1. Extensions  
2. Shared helper functions  
3. Enums  
4. Reference tables

## **Phase 1\. Authentication and users**

5. User profiles  
6. User role functions  
7. User profile RLS

## **Phase 2\. Public content model**

8. Programme dictionaries  
9. Programmes  
10. Programme translations  
11. Programme languages  
12. Programme Runs  
13. Experts  
14. Partners  
15. FAQ  
16. Contact submissions

## **Phase 3\. Credential core**

17. Credential issuers  
18. Learners  
19. Credential Types  
20. Credential Type translations  
21. Credential Groups  
22. Credential number sequences  
23. Credentials  
24. Credential snapshots  
25. Credential status history  
26. Audit log

## **Phase 4\. Credential functions**

27. Number generation  
28. Group creation  
29. Pending credential creation  
30. Snapshot replacement  
31. Activation  
32. Cancellation  
33. Revocation  
34. Expiration  
35. Reissue  
36. Verification  
37. Manual identifier resolution

## **Phase 5\. Integrity and security**

38. Triggers  
39. Public-safe views  
40. RLS policies  
41. Grants and revokes  
42. Storage buckets and policies

## **Phase 6\. Data and validation**

43. Seed data  
44. Database tests  
45. RLS tests  
46. Credential lifecycle tests  
47. Performance and concurrency tests

---

# **6\. Phase 0 — Foundation**

## **Migration 001: Enable PostgreSQL extensions**

### **File**

`*_enable_extensions.sql`

### **Extensions**

* `pgcrypto`  
* `citext`  
* `pg_trgm`

### **Requirements**

Use:

create extension if not exists ...

### **Acceptance**

* extensions exist;  
* migration is idempotent;  
* local and staging environments support extensions.

### **Rollback**

Не потрібен у production.

Extensions не видаляються після створення залежних objects.

---

## **Migration 002: Shared timestamp function**

### **File**

`*_create_set_updated_at_function.sql`

### **Function**

`set_updated_at()`

Purpose:

* automatically assign `updated_at = now()`.

### **Security**

* no dynamic SQL;  
* `security invoker`;  
* fixed `search_path`.

### **Rollback**

Можливий лише до створення dependent triggers.

---

## **Migration 003: Create enums**

### **File**

`*_create_core_enums.sql`

### **Enums**

* `app_role`  
* `record_status`  
* `programme_publication_status`  
* `programme_run_status`  
* `programme_format`  
* `duration_unit`  
* `credential_status`  
* `credential_group_status`  
* `audit_action`  
* `organisation_type`  
* `contact_submission_type`  
* `contact_submission_status`

### **Critical values**

`credential_status`:

* pending  
* valid  
* revoked  
* reissued  
* expired  
* cancelled

`credential_group_status`:

* draft  
* issued  
* cancelled

### **Rule**

Enum values мають повністю відповідати Database Schema v1.2.

### **Production warning**

PostgreSQL enum changes складніше відкочувати.

Перед production необхідно остаточно затвердити values.

### **Rollback**

Дозволений тільки якщо enum не використовується таблицями.

---

## **Migration 004: Reference tables**

### **File**

`*_create_reference_tables.sql`

### **Tables**

* `languages`  
* `countries`  
* `currencies`

### **Foreign key strategy**

Reference tables створюються до application tables.

### **Indexes**

Primary keys на:

* language code;  
* country code;  
* currency code.

### **Rollback**

Дозволений лише до створення dependent tables.

---

# **7\. Phase 1 — Authentication and users**

## **Migration 005: User profiles**

### **Table**

`user_profiles`

### **Dependencies**

* `auth.users`  
* `app_role`  
* `set_updated_at()`

### **Constraints**

* PK/FK на `auth.users.id`;  
* role not null;  
* is\_active not null;  
* MFA flags.

### **Trigger**

* updated\_at.

### **Special rule**

Не створювати RLS policy, що дозволяє користувачу змінювати власний role.

---

## **Migration 006: User role functions**

### **Functions**

* `change_user_role()`  
* `set_user_active_status()`

### **Access**

Only Super Admin.

### **Security**

* `security definer`;  
* fixed `search_path`;  
* explicit role validation;  
* audit event.

### **Rollback**

Functions можуть бути replaced новою migration.

---

# **8\. Phase 2 — Public content model**

## **Migration 007: Programme dictionaries**

### **Tables**

* `programme_fields`  
* `programme_field_translations`  
* `programme_types`  
* `programme_type_translations`

### **Constraints**

* unique codes;  
* unique slugs;  
* unique translation per language;  
* display order non-negative.

### **Delete behavior**

Recommended:

* reference row deletion restricted;  
* archive through status.

---

## **Migration 008: Programmes**

### **Table**

`programmes`

### **Dependencies**

* fields;  
* types;  
* currencies;  
* user profiles;  
* enums.

### **Constraints**

* slug unique;  
* learning hours positive;  
* ECTS positive;  
* price non-negative;  
* currency required with price;  
* featured order only if featured;  
* archived programme cannot be featured.

### **Important**

EN/UA translation requirement не реалізується простим CHECK.

Вона реалізується publish function.

---

## **Migration 009: Programme translations and languages**

### **Tables**

* `programme_translations`  
* `programme_instruction_languages`  
* `programme_credential_languages`

### **JSON validation**

CHECK constraints:

* `jsonb_typeof(learning_outcomes) = 'array'`;  
* competencies array if not null;  
* modules array if not null.

### **Unique constraints**

* one translation per language;  
* one language relation per programme.

---

## **Migration 010: Programme Runs**

### **Table**

`programme_runs`

### **Constraints**

* end date ≥ start date;  
* deadline ≤ start date;  
* price ≥ 0;  
* currency required with price;  
* capacity \> 0;  
* completed/cancelled not primary.

### **Partial unique index**

One primary run per programme:

create unique index ...  
on programme\_runs(programme\_id)  
where is\_primary \= true;

### **Controlled validation**

Function `select_primary_programme_run()` added later.

---

## **Migration 011: Experts**

### **Tables**

* `experts`  
* `expert_translations`  
* `programme_experts`

### **Constraints**

* unique slug;  
* unique translation;  
* composite PK relation.

### **Release scope**

`programme_run_experts` не створюється у mandatory Release 1 migration.

---

## **Migration 012: Partners**

### **Tables**

* `partners`  
* `partner_translations`  
* `programme_partners`

### **Critical rule**

Жодного FK з partners до:

* credentials;  
* snapshots;  
* issuers.

### **Acceptance**

Database graph не містить relation Partners → Credential.

---

## **Migration 013: FAQ**

### **Tables**

* `faq_items`  
* `faq_translations`

### **Constraints**

* unique language translation;  
* display order non-negative.

---

## **Migration 014: Contact submissions**

### **Table**

`contact_submissions`

### **RLS**

Public direct insert поки не надається.

Insert буде тільки через protected server API або RPC.

### **Privacy**

Contact message не включається в generic audit logging.

---

# **9\. Phase 3 — Credential core**

## **Migration 015: Credential issuers**

### **Table**

`credential_issuers`

### **Constraints**

* unique code;  
* country FK;  
* active status;  
* issuer with credentials cannot be deleted.

### **Seed later**

Nobel ITBS s.r.o.

---

## **Migration 016: Learners**

### **Table**

`learners`

### **Extensions**

* citext;  
* pg\_trgm.

### **Indexes**

* trigram full\_name\_original;  
* trigram full\_name\_latin;  
* lower(email);  
* deleted\_at partial index if needed.

### **Delete strategy**

* soft delete only if no Credential Group;  
* physical delete prohibited after relation exists.

---

## **Migration 017: Credential Types**

### **Table**

`credential_types`

### **Dependencies**

* credential issuers;  
* user profiles.

### **Constraints**

* code unique;  
* active flag;  
* default issuer;  
* used type cannot be deleted.

### **Note**

`number_prefix` is not globally unique.

---

## **Migration 018: Credential Type translations**

### **Table**

`credential_type_translations`

### **Constraints**

* unique type/language;  
* display name required;  
* language FK.

### **Publish/activation rule**

Credential activation requires at least one available display name matching credential language set.

---

## **Migration 019: Credential Groups**

### **Table**

`credential_groups`

### **Fields**

* learner;  
* programme;  
* run;  
* completion date;  
* status;  
* idempotency key;  
* cancellation timestamp;  
* audit fields.

### **Constraints**

* programme run belongs to programme;  
* cancelled\_at required for cancelled status;  
* issued group core data immutable;  
* idempotency key unique.

### **Indexes**

* learner;  
* programme;  
* run;  
* status;  
* created\_at.

---

## **Migration 020: Credential number sequences**

### **Table**

`credential_number_sequences`

### **Unique**

`credential_type_id + year`

### **Concurrency**

Generation function later uses:

* `SELECT ... FOR UPDATE`;  
* insert if absent;  
* increment in one transaction.

---

## **Migration 021: Credentials**

### **Table**

`credentials`

### **Dependencies**

* groups;  
* types;  
* issuers;  
* credential\_status.

### **Critical fields**

* document number;  
* token lookup hash;  
* encrypted token;  
* encryption key version;  
* status;  
* issue and validity dates;  
* predecessor/successor;  
* idempotency;  
* lifecycle timestamps.

### **Removed fields**

Do not add:

* learner\_id;  
* programme\_id;  
* programme\_run\_id;  
* completion\_date;  
* partner\_id;  
* token prefix.

### **Constraints**

* unique document number;  
* unique lookup hash;  
* unique idempotency key;  
* expiry ≥ valid\_from;  
* no self-reference;  
* status timestamp consistency;  
* terminal status protection later by trigger/function.

### **Foreign key behavior**

Recommended:

* group: `ON DELETE RESTRICT`;  
* type: `ON DELETE RESTRICT`;  
* issuer: `ON DELETE RESTRICT`;  
* predecessor/successor: `ON DELETE RESTRICT`.

---

## **Migration 022: Credential snapshots**

### **Table**

`credential_snapshots`

### **PK**

`credential_id`

### **Critical field**

`credential_type_display_names jsonb`

### **JSON constraints**

* object, not array;  
* not empty;  
* string values only;  
* keys limited to valid language codes through function validation.

### **Immutability**

Implemented later via trigger.

### **No partner fields**

Snapshot must not contain:

* partner name;  
* partner role;  
* partner ID.

---

## **Migration 023: Credential status history**

### **Table**

`credential_status_history`

### **Rules**

* append-only;  
* no update/delete;  
* status transitions recorded by functions;  
* reason required for revoke and cancel.

### **Indexes**

* credential \+ changed\_at;  
* new status;  
* changed\_by.

---

## **Migration 024: Audit log**

### **Table**

`audit_log`

### **Rules**

* append-only;  
* whitelist changed fields;  
* no full-row automatic capture;  
* no token or PII.

### **Indexes**

* entity type \+ entity ID;  
* actor \+ created\_at;  
* action \+ created\_at;  
* created\_at.

---

# **10\. Phase 4 — Credential functions**

## **General function requirements**

Усі credential mutation functions:

* execute in one database transaction;  
* validate actor role;  
* use fixed `search_path`;  
* return typed result;  
* do not expose raw database errors;  
* write status history where applicable;  
* write audit entry;  
* reject direct status manipulation;  
* support idempotency where required.

---

## **Migration 025: Document number generation**

### **Function**

`generate_document_number(credential_type_id, issue_year)`

### **Behavior**

1. Lock sequence row.  
2. Create sequence row if missing.  
3. Increment value.  
4. Generate:  
   `NITBS-{TYPE}-{YEAR}-{SEQUENCE}`  
5. Verify global uniqueness.  
6. Return number.

### **Concurrency tests required**

At least 50 parallel calls.

### **Failure**

Rollback entire transaction.

---

## **Migration 026: Create Credential Group**

### **Function**

`create_credential_group(...)`

### **Inputs**

* idempotency key;  
* learner/new learner data;  
* programme;  
* programme run;  
* completion date.

### **Behavior**

* same key \+ same payload returns existing group;  
* same key \+ different payload returns conflict;  
* group created as draft;  
* audit logged.

### **Important**

Payload fingerprint may be stored or calculated to distinguish conflict.

---

## **Migration 027: Create Pending Credential**

### **Function**

`create_pending_credential(...)`

### **Backend supplies**

* idempotency key;  
* group ID;  
* type ID;  
* issuer ID;  
* issue dates;  
* encrypted token;  
* lookup hash;  
* key version;  
* snapshot data.

### **Database handles**

* idempotency;  
* number generation;  
* group validation;  
* type validation;  
* issuer validation;  
* duplicate type policy;  
* credential insert;  
* snapshot insert;  
* initial history;  
* audit.

### **Atomicity**

All operations occur in one transaction.

---

## **Migration 028: Replace Pending Snapshot**

### **Function**

`replace_pending_snapshot(...)`

### **Conditions**

* credential status Pending;  
* actor Credential Manager or Super Admin;  
* snapshot validation passes.

### **Restriction**

Cannot change:

* document number independently;  
* group;  
* token;  
* status.

---

## **Migration 029: Activate Credential**

### **Function**

`activate_credential(credential_id, confirmation_payload)`

### **Validation**

* status Pending;  
* snapshot complete;  
* issuer active;  
* group not cancelled;  
* date consistency;  
* type display names available;  
* no active duplicate type;  
* token fields present.

### **Transaction**

* status → Valid;  
* activated\_at;  
* group → Issued if first activation;  
* history;  
* audit.

---

## **Migration 030: Cancel Pending Credential**

### **Function**

`cancel_pending_credential(credential_id, reason)`

### **Validation**

* Pending only;  
* reason required.

### **Transaction**

* status Cancelled;  
* cancelled\_at;  
* history;  
* audit.

---

## **Migration 031: Revoke Credential**

### **Function**

`revoke_credential(credential_id, reason)`

### **Validation**

* Valid only;  
* reason required.

### **Result**

* Revoked terminal;  
* revoked\_at;  
* history;  
* audit.

---

## **Migration 032: Expire Credential**

### **Function**

`expire_credential(credential_id)`

### **Validation**

* Valid only;  
* type has expiry;  
* expiry date reached or Super Admin exception explicitly allowed.

### **Release 1 policy**

Expired is terminal.

### **Scheduled execution**

Cron/Edge Function may call this function.

---

## **Migration 033: Create Reissue Successor**

### **Function**

`create_reissue_successor(...)`

### **Validation**

* predecessor Valid;  
* same group;  
* no active Pending successor;  
* caller idempotency;  
* type change only Super Admin.

### **Behavior**

* new number;  
* new token data supplied by backend;  
* copied editable snapshot;  
* predecessor remains Valid.

---

## **Migration 034: Activate Reissued Credential**

### **Function**

`activate_reissued_credential(successor_id)`

### **Transaction**

* validate successor Pending;  
* validate predecessor Valid;  
* same group;  
* successor Valid;  
* predecessor Reissued;  
* link both;  
* history both;  
* audit both.

---

## **Migration 035: Cancel Pending Reissue**

### **Function**

`cancel_pending_reissue(successor_id, reason)`

### **Behavior**

* successor Cancelled;  
* predecessor stays Valid;  
* links preserved or marked inactive according to implementation;  
* number/token retained;  
* audit.

Recommended:

* successor keeps predecessor reference for history;  
* predecessor successor\_id remains null until activation.

---

## **Migration 036: Public verification function**

### **Function**

`verify_credential(input_token_hash, requested_language)`

Important:

Public database function should receive lookup hash from trusted backend, not raw token, if HMAC is application-side.

Alternative internal naming:

`get_public_credential_by_lookup_hash(...)`

### **Returns**

Public-safe structured record only.

### **Must not return**

* UUIDs;  
* internal notes;  
* token fields;  
* private file path;  
* partner data;  
* audit data.

### **Status behavior**

* pending: no PII;  
* cancelled: not found;  
* valid/revoked/reissued/expired: public snapshot according to policy.

---

## **Migration 037: Manual identifier resolution**

### **Function**

`resolve_credential_identifier(...)`

Recommended separation:

* document number lookup in database;  
* token lookup hash calculated by backend.

Do not decrypt token in PostgreSQL.

For document number flow:

* database returns internal credential reference to backend;  
* backend fetches encrypted token through privileged service;  
* backend decrypts and creates redirect URL.

Public client never receives raw token row directly.

---

# **11\. Phase 5 — Triggers and integrity**

## **Migration 038: Updated-at triggers**

Apply to mutable tables:

* user\_profiles;  
* dictionaries;  
* programmes;  
* translations;  
* runs;  
* experts;  
* partners;  
* issuers;  
* learners;  
* credential types;  
* groups;  
* credentials.

Do not apply to append-only:

* audit\_log;  
* credential\_status\_history.

---

## **Migration 039: Snapshot immutability trigger**

Rules:

* Pending credential: snapshot insert/update allowed through controlled function;  
* after activation: update/delete rejected;  
* terminal states remain immutable.

Direct table writes should be blocked by RLS and trigger.

---

## **Migration 040: Terminal status protection**

Prevents:

* Revoked → any;  
* Reissued → any;  
* Expired → any;  
* Cancelled → any.

Allows status transition only when expected session/function context is present.

Preferred approach:

* deny direct update via RLS;  
* functions own transitions;  
* trigger as defense-in-depth.

---

## **Migration 041: Group consistency trigger**

Prevents:

* changing learner/programme/run/completion date after group Issued;  
* adding credentials to Cancelled group;  
* run/programme mismatch.

---

## **Migration 042: Delete restriction triggers**

Protect:

* programmes with groups;  
* learners with groups;  
* issuers with credentials;  
* types with credentials;  
* groups with credentials;  
* credentials;  
* snapshots;  
* status history;  
* audit log.

Prefer FK `RESTRICT` where sufficient.

Use triggers only for rules FK cannot express.

---

## **Migration 043: Duplicate active type protection**

Requirement:

One active credential per type per group, excluding Reissue transition.

Because lifecycle is complex, enforce in controlled functions and optional trigger.

Active statuses for conflict:

* pending;  
* valid.

Exception:

* Pending successor linked to Valid predecessor of same type.

---

# **12\. Public views**

## **Migration 044: Public programme views**

Views:

* published programmes;  
* published programme translations;  
* public runs;  
* public experts;  
* public partners;  
* public FAQ.

Views return only public fields.

## **Migration 045: Public credential response type/view**

Recommended:

* no direct public view on credentials;  
* verification through RPC/service only.

If view exists:

* restricted to service role;  
* contains no token fields;  
* contains no private IDs.

---

# **13\. RLS migrations**

## **Migration 046: Enable RLS**

Enable on all application tables.

Do not rely only on frontend or API authorization.

## **Migration 047: Public content policies**

Public:

* SELECT published content through views;  
* no direct table mutations.

## **Migration 048: Content Manager policies**

Allow:

* content tables;  
* translations;  
* runs;  
* experts;  
* partners;  
* FAQ.

Deny:

* learners;  
* credential tables;  
* audit;  
* users.

## **Migration 049: Credential Manager policies**

Allow:

* learner SELECT/INSERT/UPDATE;  
* group SELECT;  
* credential SELECT;  
* snapshot SELECT;  
* status history SELECT;  
* active issuer/type SELECT.

Mutations:

* only through approved functions;  
* no direct status update;  
* no delete.

## **Migration 050: Super Admin policies**

Allow controlled full application access.

Still deny:

* audit update/delete;  
* activated credential delete;  
* activated snapshot update/delete;  
* direct reuse of number.

## **Migration 051: Service role model**

Document and test:

* service role bypasses RLS by design;  
* only server environment may use it;  
* never exposed to browser;  
* public verification service returns filtered response.

---

# **14\. Storage migrations**

## **Migration 052: Storage buckets**

Buckets:

* `public-media`;  
* `private-credentials`.

## **Migration 053: Public media policies**

Public:

* read.

Content Manager / Super Admin:

* upload;  
* update;  
* delete according to path policy.

## **Migration 054: Private credential policies**

Credential Manager / Super Admin:

* authenticated controlled access.

Public:

* no read;  
* no list.

Use short-lived signed URLs generated server-side.

---

# **15\. Seed data plan**

## **Migration 055 or `seed.sql`**

Seed must be environment-safe.

## **15.1. Languages**

* en;  
* uk;  
* cs disabled.

## **15.2. Countries**

ISO list or required subset for Release 1\.

Recommended:

Full ISO list to avoid future migration.

## **15.3. Currencies**

* EUR;  
* CZK;  
* USD;  
* UAH;  
* GBP.

## **15.4. Programme Fields**

* Human & Behavioral Sciences;  
* Business & Management;  
* Technology & Innovation.

## **15.5. Programme Types**

* Course;  
* Professional Development Programme;  
* CPD Course;  
* MINI-MBA;  
* Executive Programme;  
* Certificate Programme.

## **15.6. Credential issuer**

* Nobel ITBS s.r.o.;  
* country CZ;  
* registration number after legal confirmation.

## **15.7. Credential Types and codes**

| Type | Code |
| ----- | ----- |
| Certificate | CERT |
| Professional Development Certificate | PDC |
| Professional Development Diploma | PDD |
| MINI-MBA Diploma | MBA |
| CPD Certificate | CPD |
| Certificate Supplement | SUP |
| Transcript | TRN |
| Attendance Certificate | ATT |

Each type receives:

* EN translation;  
* UA translation;  
* default issuer;  
* number pattern;  
* has\_expiry.

## **15.8. Admin user**

Production Super Admin should not be hard-coded in public repository seed.

Recommended:

* create auth user manually through secure procedure;  
* run protected bootstrap function once;  
* remove or disable bootstrap route.

---

# **16\. Automated database test plan**

## **16.1. Migration integrity**

Test:

* clean database can run all migrations;  
* running reset \+ migrate succeeds;  
* no missing dependencies;  
* seed succeeds;  
* all constraints exist.

## **16.2. Foreign keys**

Test invalid relations:

* run with wrong programme;  
* credential with missing group;  
* type with missing issuer;  
* snapshot without credential.

## **16.3. Number concurrency**

Test:

* parallel generation;  
* unique numbers;  
* sequence order;  
* cancellation does not reuse number.

## **16.4. Idempotency**

Test:

* same key \+ same payload returns same entity;  
* same key \+ different payload gives conflict;  
* concurrent duplicate requests create one record.

## **16.5. Status machine**

Test all allowed and forbidden transitions.

## **16.6. Snapshot immutability**

Test:

* Pending editable;  
* Valid immutable;  
* terminal immutable;  
* direct delete denied.

## **16.7. Reissue**

Test:

* same group;  
* predecessor stays Valid;  
* successor activation atomic;  
* second active successor denied;  
* cancelled successor leaves predecessor Valid.

## **16.8. Verification privacy**

Test response excludes:

* IDs;  
* tokens;  
* internal notes;  
* PDF paths;  
* partners;  
* audit.

## **16.9. RLS**

Test each role per table and operation.

## **16.10. Audit**

Test:

* required events written;  
* sensitive fields absent;  
* update/delete denied.

---

# **17\. Rollback strategy**

## **17.1. Pre-production**

Before production data:

* migrations may be reverted;  
* schema may be reset;  
* migration files may be reorganized before approval.

## **17.2. Production**

After production launch:

* no destructive rollback for credentials;  
* no dropping status history;  
* no dropping audit;  
* no sequence reset;  
* no document number reuse;  
* no token regeneration for existing Valid credentials.

## **17.3. Failed deployment**

Preferred response:

1. stop application traffic if necessary;  
2. rollback application release;  
3. assess applied migrations;  
4. apply corrective forward migration;  
5. verify credential integrity;  
6. run smoke tests.

## **17.4. Expand-and-contract strategy**

For breaking changes:

1. add new column/table;  
2. deploy code supporting both versions;  
3. backfill;  
4. switch reads/writes;  
5. validate;  
6. remove old structure in later migration.

---

# **18\. Data backup and recovery**

Before production migration:

* create database backup;  
* confirm restore procedure;  
* verify Supabase PITR availability for selected plan;  
* export critical configuration;  
* record migration version.

For credential tables:

* backup credentials;  
* snapshots;  
* groups;  
* status history;  
* audit;  
* issuers;  
* credential types.

Recovery test should be performed before launch.

---

# **19\. Staging deployment procedure**

1. Pull latest approved migration branch.  
2. Reset staging database if appropriate.  
3. Run all migrations.  
4. Apply seed.  
5. Create test admin accounts.  
6. Run automated DB tests.  
7. Run RLS tests.  
8. Run credential lifecycle tests.  
9. Run manual smoke tests.  
10. Record migration version.  
11. Approve production deployment.

---

# **20\. Production deployment procedure**

1. Freeze schema changes.  
2. Confirm backup.  
3. Confirm rollback application version.  
4. Confirm environment secrets:  
   * Supabase keys;  
   * HMAC pepper;  
   * token encryption key;  
   * encryption key version.  
5. Run migrations in order.  
6. Verify migration status.  
7. Apply production-safe seed.  
8. Bootstrap Super Admin securely.  
9. Deploy backend.  
10. Deploy frontend.  
11. Run smoke tests.  
12. Verify QR and public verification.  
13. Verify RLS.  
14. Monitor logs and errors.  
15. Close deployment window.

---

# **21\. Production smoke tests**

Mandatory:

* public programmes load;  
* UA and EN translations work;  
* primary run resolves;  
* Content Manager permissions work;  
* Credential Manager cannot edit programmes;  
* learner can be created;  
* group can be created;  
* Pending credential can be created;  
* number generated;  
* QR generated;  
* Pending verification reveals no PII;  
* activation works;  
* Valid verification works;  
* revoke works;  
* reissue works;  
* audit written;  
* private PDF remains private;  
* public cannot query credential tables.

---

# **22\. Migration observability**

Log:

* migration version;  
* execution start/end;  
* success/failure;  
* environment;  
* database project;  
* deployment commit.

Do not log:

* secrets;  
* token values;  
* credential payload;  
* learner data.

---

# **23\. Migration ownership**

Recommended ownership:

## **Product Owner**

Approves:

* scope;  
* business rules;  
* credential types;  
* numbering format;  
* verification fields.

## **Solution Architect / Technical Lead**

Approves:

* migration architecture;  
* SQL structure;  
* functions;  
* RLS;  
* rollback strategy.

## **Developer / Codex**

Implements:

* migrations;  
* tests;  
* seed scripts;  
* documentation updates.

## **QA**

Validates:

* migrations;  
* RLS;  
* status machine;  
* verification;  
* regression.

---

# **24\. Codex implementation batches**

## **Batch 1 — Foundation**

* extensions;  
* enums;  
* reference tables;  
* users;  
* helper functions.

## **Batch 2 — Public content**

* programmes;  
* runs;  
* experts;  
* partners;  
* FAQ;  
* forms.

## **Batch 3 — Credential tables**

* issuers;  
* learners;  
* types;  
* groups;  
* credentials;  
* snapshots;  
* history;  
* audit.

## **Batch 4 — Credential functions**

* number generation;  
* create;  
* activate;  
* cancel;  
* revoke;  
* expire;  
* reissue;  
* verify.

## **Batch 5 — Security**

* RLS;  
* grants;  
* Storage;  
* tests.

## **Batch 6 — Seed and validation**

* seed;  
* concurrency tests;  
* lifecycle tests;  
* deployment scripts.

---

# **25\. Migration acceptance criteria**

SQL Migration Plan вважається реалізованим, якщо:

* усі migrations мають чіткий порядок;  
* clean database розгортається без ручних виправлень;  
* staging і production використовують один chain;  
* schema відповідає Database Schema v1.2;  
* credential lifecycle відповідає Credential Module Specification;  
* Partners не пов’язані з verification;  
* token encryption не виконується в PostgreSQL;  
* document number generation atomic;  
* idempotency працює;  
* snapshot immutable після activation;  
* terminal statuses захищені;  
* RLS увімкнено;  
* service role не використовується frontend;  
* audit append-only;  
* private Storage захищений;  
* seed є повторюваним;  
* automated tests проходять;  
* rollback і recovery documented;  
* production smoke tests визначені.

---

# **26\. Наступні документи**

Після SQL Migration Plan необхідно підготувати:

1. **RLS and Permissions Specification**  
2. **API Specification**  
3. **Codex Ticket Pack — Database Foundation**  
4. **Automated Database Test Specification**  
5. **Deployment and Release Plan**

Рекомендований наступний крок:

> **RLS and Permissions Specification v1**

