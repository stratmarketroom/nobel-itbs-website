# **CODEX TICKET PACK v1**

## **Database Foundation**

**Версія:** 1.0  
**Статус:** Ready for Implementation  
**Продукт:** nobel-itbs.eu  
**Проєкт:** Nobel ITBS Website and Credential Registry  
**Технології:** Next.js / TypeScript / Supabase / PostgreSQL  
**Власник продукту:** Nobel ITBS s.r.o.  
**Product Owner:** Ольга Дашевська

---

# **1\. Мета документа**

Цей документ перетворює затверджену технічну архітектуру на послідовний пакет задач для Codex.

Пакет охоплює перший технічний етап:

> **Database Foundation**

До нього входять:

* Supabase project structure;  
* migration conventions;  
* PostgreSQL extensions;  
* database schemas;  
* enums;  
* reference tables;  
* user profiles;  
* audit foundation;  
* default grants;  
* helper functions;  
* production reference data;  
* database test infrastructure;  
* CI checks;  
* documentation.

Пакет не включає:

* programme content tables;  
* Credential Registry tables;  
* credential lifecycle functions;  
* RLS policies для бізнесових таблиць;  
* public API;  
* admin UI;  
* frontend;  
* QR generation;  
* token encryption;  
* Leeloo integration.

Ці частини реалізуються наступними ticket packs.

---

# **2\. Джерела істини**

Codex повинен працювати відповідно до:

1. Product Brief and Release 1 Scope;  
2. Sitemap and User Flows;  
3. Database Schema v1.2;  
4. Credential Module Specification v1;  
5. SQL Migration Plan v1.1;  
6. RLS and Permissions Specification v1;  
7. API Specification v1.1.

У разі конфлікту:

* Database Schema визначає структуру даних;  
* SQL Migration Plan визначає порядок migrations;  
* RLS Specification визначає доступ;  
* API Specification визначає зовнішній контракт;  
* цей Ticket Pack визначає поточний implementation scope.

Codex не повинен самостійно змінювати бізнес-правила.

---

# **3\. Загальні правила виконання**

## **3.1. Працювати по одному ticket**

Codex не повинен одночасно реалізовувати весь пакет.

Кожен ticket:

1. реалізується окремо;  
2. проходить tests;  
3. перевіряється;  
4. фіксується commit;  
5. лише після цього починається наступний ticket.

## **3.2. Не змінювати scope**

Codex не повинен без окремого ticket:

* створювати додаткові таблиці;  
* змінювати enum values;  
* перейменовувати затверджені поля;  
* додавати ORM;  
* додавати CMS;  
* створювати frontend;  
* реалізовувати credential lifecycle;  
* створювати універсальні admin permissions;  
* використовувати service role у browser;  
* додавати сторонні сервіси.

## **3.3. Migration history**

До першого production deployment migration files можна коригувати в межах feature branch.

Після production:

* migrations immutable;  
* зміни лише новою migration;  
* застосовані файли не перейменовуються.

## **3.4. SQL quality**

SQL повинен:

* бути idempotent там, де це передбачено;  
* використовувати schema-qualified names;  
* уникати dynamic SQL;  
* мати explicit constraints;  
* мати fixed `search_path` у functions;  
* не надавати PUBLIC EXECUTE;  
* не використовувати destructive CASCADE без approval;  
* не містити secrets або production PII.

## **3.5. Definition of Done**

Ticket завершений, коли:

* implementation відповідає scope;  
* migrations запускаються на clean database;  
* tests проходять;  
* lint проходить;  
* документація оновлена;  
* немає schema drift;  
* acceptance criteria виконані;  
* Codex надає короткий implementation report.

---

# **4\. Repository baseline**

Очікувана структура:

/  
├── app/  
├── components/  
├── lib/  
├── docs/  
│   └── database/  
├── scripts/  
│   └── database/  
├── supabase/  
│   ├── migrations/  
│   ├── tests/  
│   │   ├── database/  
│   │   ├── rls/  
│   │   ├── credential/  
│   │   └── concurrency/  
│   ├── seed.sql  
│   └── config.toml  
├── package.json  
└── README.md

Якщо частини структури відсутні, вони створюються лише в межах відповідного ticket.

---

# **5\. Ticket dependencies**

| Ticket | Назва | Залежить від |
| ----- | ----- | ----- |
| DBF-001 | Supabase Foundation | — |
| DBF-002 | Migration Standards | DBF-001 |
| DBF-003 | Internal Schema Security | DBF-002 |
| DBF-004 | PostgreSQL Extensions | DBF-002 |
| DBF-005 | Core Enums | DBF-004 |
| DBF-006 | Reference Tables | DBF-005 |
| DBF-007 | Shared Helper Functions | DBF-003, DBF-004 |
| DBF-008 | User Profiles | DBF-005, DBF-007 |
| DBF-009 | Audit Foundation | DBF-007, DBF-008 |
| DBF-010 | User Administration RPC | DBF-009 |
| DBF-011 | Default Privileges | DBF-003, DBF-009 |
| DBF-012 | Production Reference Data | DBF-006 |
| DBF-013 | Local Seed Fixtures | DBF-008, DBF-012 |
| DBF-014 | Database Test Harness | DBF-001 |
| DBF-015 | Foundation Tests | DBF-003–DBF-013 |
| DBF-016 | CI Database Gates | DBF-014, DBF-015 |
| DBF-017 | Drift Detection | DBF-016 |
| DBF-018 | Foundation Documentation | DBF-001–DBF-017 |

Tickets виконуються в зазначеній послідовності.

---

# **6\. DBF-001 — Supabase Foundation**

## **Мета**

Створити базову локальну структуру Supabase без application tables.

## **Scope**

* ініціалізувати Supabase directory;  
* створити або перевірити `supabase/config.toml`;  
* створити directories для migrations і tests;  
* додати scripts для local start, stop, reset і test;  
* перевірити локальне підключення PostgreSQL;  
* не створювати бізнесові таблиці.

## **Файли**

Можуть бути створені або змінені:

supabase/config.toml  
supabase/migrations/  
supabase/tests/  
package.json  
README.md  
.gitignore

## **Package scripts**

Додати зрозумілі scripts, наприклад:

db:start  
db:stop  
db:reset  
db:migrate  
db:test  
db:status

Назви можуть відрізнятися, але мають бути послідовними.

## **Обмеження**

Не:

* створювати production Supabase project;  
* записувати keys;  
* змінювати frontend;  
* створювати application tables;  
* додавати ORM.

## **Acceptance criteria**

* `supabase start` або еквівалент запускається;  
* local database доступна;  
* reset виконується без помилок;  
* directories створені;  
* secrets не потрапили в repository;  
* README містить команди локального запуску.

## **Required tests**

* local Supabase start;  
* local reset;  
* migration status command.

## **Codex report**

Після виконання надати:

* список створених файлів;  
* доступні scripts;  
* результат local reset;  
* відомі обмеження environment.

---

# **7\. DBF-002 — Migration Standards**

## **Мета**

Зафіксувати технічний стандарт migrations і створити перший migration header pattern.

## **Scope**

Створити документ:

`docs/database/MIGRATION_CONVENTIONS.md`

Він має містити:

* timestamp filename format;  
* one logical responsibility;  
* transaction rules;  
* forward-only production strategy;  
* immutable production history;  
* `lock_timeout`;  
* `statement_timeout`;  
* destructive SQL controls;  
* schema qualification;  
* function security rules;  
* comments/header format;  
* rollback notes;  
* migration acceptance checklist.

## **Migration header template**

Кожен migration file має починатися коментарем:

\-- Migration:  
\-- Purpose:  
\-- Dependencies:  
\-- Transaction:  
\-- Lock risk:  
\-- Rollback:  
\-- Source documents:

## **Timeout defaults**

Зафіксувати стартові production defaults:

lock\_timeout \= 5s  
statement\_timeout \= 60s

Для migration із довшими операціями потрібне окреме обґрунтування.

## **Обмеження**

Не створювати application schema objects.

## **Acceptance criteria**

* conventions documented;  
* filename rules однозначні;  
* destructive operations мають approval path;  
* timeout policy визначена;  
* conventions відповідають SQL Migration Plan v1.1.

---

# **8\. DBF-003 — Internal Schema Security**

## **Мета**

Створити `internal` schema та заблокувати browser roles.

## **Migration**

Створити migration:

`*_create_internal_schema.sql`

## **Scope**

* create schema `internal`;  
* revoke access from PUBLIC;  
* revoke USAGE from `anon`;  
* revoke USAGE from `authenticated`;  
* document owner;  
* prepare default privilege restrictions;  
* verify schema inaccessible через browser roles.

## **Required SQL behavior**

create schema if not exists internal;

revoke all on schema internal from public;  
revoke all on schema internal from anon;  
revoke all on schema internal from authenticated;

Actual statements мають враховувати доступні Supabase roles.

## **Обмеження**

Не:

* надавати anon або authenticated USAGE;  
* створювати verification functions;  
* створювати credential helpers;  
* створювати public wrappers.

## **Acceptance criteria**

* schema існує;  
* anon не має USAGE;  
* authenticated не має USAGE;  
* database owner може створювати objects;  
* grants перевірені SQL tests.

## **Tests**

* anon access fails;  
* authenticated access fails;  
* owner access succeeds.

---

# **9\. DBF-004 — PostgreSQL Extensions**

## **Мета**

Увімкнути extensions, необхідні затвердженій schema.

## **Migration**

`*_enable_extensions.sql`

## **Extensions**

* `citext`;  
* `pg_trgm`;  
* `pgcrypto` — тільки якщо використовується конкретною функцією або UUID support у вибраній Supabase/PostgreSQL version.

## **Scope**

* використовувати `CREATE EXTENSION IF NOT EXISTS`;  
* schema-qualified extension placement where needed;  
* додати comments про призначення.

## **Security rule**

`pgcrypto` не використовується для:

* verification token encryption;  
* HMAC token lookup;  
* збереження application secrets.

Ця crypto logic залишається в application layer.

## **Acceptance criteria**

* migration idempotent;  
* extensions доступні local;  
* clean reset проходить;  
* немає duplicate extension errors.

## **Tests**

Перевірити наявність extensions через system catalogue.

---

# **10\. DBF-005 — Core Enums**

## **Мета**

Створити затверджені PostgreSQL enum types.

## **Migration**

`*_create_core_enums.sql`

## **Enums**

### **`app_role`**

* `super_admin`  
* `content_manager`  
* `credential_manager`

### **`record_status`**

* `draft`  
* `published`  
* `archived`

### **`programme_publication_status`**

* `draft`  
* `published`  
* `archived`

### **`programme_run_status`**

* `draft`  
* `upcoming`  
* `enrolment_open`  
* `closed`  
* `completed`  
* `cancelled`

### **`programme_format`**

* `self_paced_online`  
* `cohort_online`  
* `blended_online`  
* `hybrid`  
* `in_person`

### **`duration_unit`**

* `hours`  
* `days`  
* `weeks`  
* `months`

### **`credential_status`**

* `pending`  
* `valid`  
* `revoked`  
* `reissued`  
* `expired`  
* `cancelled`

### **`credential_group_status`**

* `draft`  
* `issued`  
* `cancelled`

### **`audit_action`**

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
* `expire`  
* `role_change`  
* `login`  
* `login_failed`  
* `password_reset`  
* `mfa_enabled`  
* `mfa_disabled`  
* `file_upload`  
* `file_delete`  
* `number_override`  
* `issuer_change`

### **`organisation_type`**

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

### **`contact_submission_type`**

* `general`  
* `partner_enquiry`  
* `organisation_enquiry`

### **`contact_submission_status`**

* `new`  
* `processed`  
* `spam`  
* `archived`

## **Обмеження**

* не додавати значення;  
* не використовувати text замість enum;  
* не перейменовувати enum;  
* не створювати status restore values.

## **Acceptance criteria**

* всі enums створені;  
* порядок значень задокументований;  
* values точно відповідають Database Schema;  
* clean reset проходить.

## **Tests**

SQL assertions для кожного enum і value.

---

# **11\. DBF-006 — Reference Tables**

## **Мета**

Створити базові довідники мов, країн і валют.

## **Migration**

`*_create_reference_tables.sql`

## **Table: `public.languages`**

Fields:

* `code varchar(10) primary key`;  
* `name_en varchar(100) not null`;  
* `name_native varchar(100) not null`;  
* `is_interface_enabled boolean not null default false`;  
* `is_content_enabled boolean not null default false`;  
* `created_at timestamptz not null default now()`.

## **Table: `public.countries`**

Fields:

* `code char(2) primary key`;  
* `name_en varchar(150) not null`;  
* `is_active boolean not null default true`.

## **Table: `public.currencies`**

Fields:

* `code char(3) primary key`;  
* `name varchar(100) not null`;  
* `symbol varchar(10) null`;  
* `is_active boolean not null default true`.

## **Constraints**

* trim/non-empty names;  
* uppercase country and currency codes;  
* lowercase language codes;  
* valid code lengths.

## **RLS**

RLS can be enabled in later security migration.

У цьому ticket application mutation grants не надаються.

## **Acceptance criteria**

* tables exist;  
* PK constraints exist;  
* invalid code lengths rejected;  
* no production data inserted yet;  
* reset works.

---

# **12\. DBF-007 — Shared Helper Functions**

## **Мета**

Створити низькоризикові shared database helpers.

## **Migrations**

* `*_create_set_updated_at_function.sql`  
* `*_create_canonical_json_hash_function.sql`

## **Function: `public.set_updated_at()`**

Behavior:

NEW.updated\_at \= now()

Requirements:

* trigger function;  
* `security invoker`;  
* fixed search path;  
* no dynamic SQL.

## **Function: `internal.canonical_json_hash(payload jsonb)`**

Мета:

* deterministic payload hash для idempotency.

Requirements:

* same normalized JSONB → same hash;  
* property order не впливає;  
* null/omitted-field policy задокументована;  
* transient fields виключаються caller до виклику;  
* result type text;  
* function не приймає raw secrets.

## **Security**

* no EXECUTE for anon;  
* no EXECUTE for authenticated;  
* helper використовується controlled function chain.

## **Обмеження**

Не створювати:

* role helpers;  
* credential functions;  
* token HMAC;  
* application encryption.

## **Acceptance criteria**

* `set_updated_at()` працює;  
* JSON hash deterministic;  
* internal helper недоступний browser roles;  
* tests проходять.

---

# **13\. DBF-008 — User Profiles**

## **Мета**

Створити application profile поверх `auth.users`.

## **Migration**

`*_create_user_profiles.sql`

## **Table: `public.user_profiles`**

Fields:

* `id uuid primary key references auth.users(id) on delete cascade`;  
* `full_name varchar(200) not null`;  
* `role app_role not null`;  
* `is_active boolean not null default true`;  
* `mfa_required boolean not null default false`;  
* `last_login_at timestamptz null`;  
* `created_at timestamptz not null default now()`;  
* `updated_at timestamptz not null default now()`.

## **Constraints**

* full name non-empty;  
* Super Admin and Credential Manager must have `mfa_required = true`.

Через CHECK або controlled function має бути забезпечено:

role in (super\_admin, credential\_manager)  
→ mfa\_required \= true

## **Trigger**

Apply `set_updated_at()`.

## **Access**

На цьому етапі:

* RLS увімкнути;  
* deny-by-default;  
* не створювати permissive admin policies до RLS ticket pack;  
* service/bootstrap access documented.

## **Обмеження**

Не:

* створювати public signup profile automatically без окремого рішення;  
* дозволяти user self-role update;  
* зберігати email duplicate із auth.users.

## **Acceptance criteria**

* profile links to auth.users;  
* invalid auth user rejected;  
* MFA constraint works;  
* RLS enabled;  
* anon cannot read;  
* authenticated без policy не може read.

---

# **14\. DBF-009 — Audit Foundation**

## **Мета**

Створити append-only audit infrastructure до privileged RPC.

## **Migration**

`*_create_audit_log.sql`

## **Table: `public.audit_log`**

Fields:

* `id uuid primary key default gen_random_uuid()`;  
* `actor_user_id uuid null references auth.users(id)`;  
* `actor_role app_role null`;  
* `action audit_action not null`;  
* `entity_type varchar(100) not null`;  
* `entity_id uuid null`;  
* `changed_fields jsonb null`;  
* `metadata jsonb null`;  
* `ip_hash text null`;  
* `user_agent_summary text null`;  
* `created_at timestamptz not null default now()`.

## **Constraints**

* entity type non-empty;  
* changed fields object if present;  
* metadata object if present;  
* no `updated_at`;  
* no soft delete.

## **Indexes**

* `(entity_type, entity_id)`;  
* `(actor_user_id, created_at desc)`;  
* `(action, created_at desc)`;  
* `created_at desc`.

## **RLS and grants**

* RLS enabled;  
* no anon/authenticated INSERT;  
* no UPDATE;  
* no DELETE;  
* Super Admin SELECT policy додається в later RLS pack;  
* insert only through internal writer.

## **Acceptance criteria**

* table append-only by grants;  
* update/delete rejected;  
* required indexes exist;  
* no PII-specific fields added.

---

# **15\. DBF-010 — User Administration RPC**

## **Мета**

Створити controlled functions для role і active-state management.

## **Migration**

`*_create_user_admin_functions.sql`

## **Functions**

* `public.change_user_role(target_user_id uuid, new_role app_role)`;  
* `public.set_user_active_status(target_user_id uuid, new_is_active boolean)`.

## **Role helper prerequisites**

У межах ticket дозволено створити:

* `internal.current_user_role()`;  
* `internal.is_active_admin()`;  
* `internal.is_super_admin()`.

## **Required checks**

Functions:

* derive actor from `auth.uid()`;  
* do not accept actor ID;  
* require actor Super Admin;  
* require actor active;  
* require MFA/AAL2 if session context supports it;  
* reject missing target profile;  
* prevent invalid role;  
* preserve MFA requirement rule;  
* write audit event.

## **`SECURITY DEFINER`**

Functions may use `SECURITY DEFINER`, але повинні:

* have fixed search path;  
* schema-qualify objects;  
* avoid dynamic SQL;  
* have explicit grants;  
* not be executable by anon;  
* only authenticated Super Admin may succeed.

## **Self-deactivation rule**

Super Admin cannot deactivate their own account if this would leave zero active Super Admin users.

## **Last Super Admin rule**

System must reject:

* demotion of final active Super Admin;  
* deactivation of final active Super Admin.

## **Acceptance criteria**

* Content Manager denied;  
* Credential Manager denied;  
* inactive Super Admin denied;  
* active Super Admin succeeds;  
* audit row written;  
* final active Super Admin protected;  
* role change preserves MFA rules.

---

# **16\. DBF-011 — Default Privileges and Security Baseline**

## **Мета**

Заборонити небезпечні implicit grants.

## **Migration**

`*_configure_default_privileges.sql`

## **Scope**

* revoke table access from PUBLIC;  
* revoke function EXECUTE from PUBLIC;  
* revoke internal schema access;  
* define default privileges for migration owner;  
* restrict future sequences;  
* document service role behavior.

## **Required rules**

For correct owner role:

alter default privileges revoke execute on functions from public;  
alter default privileges revoke all on tables from public;  
alter default privileges revoke all on sequences from public;

Actual commands мають враховувати Supabase ownership.

## **Existing objects**

Explicitly revoke unnecessary rights on:

* reference tables;  
* user\_profiles;  
* audit\_log;  
* helper functions;  
* internal schema.

## **Acceptance criteria**

* no PUBLIC EXECUTE on custom functions;  
* anon cannot query application tables;  
* authenticated cannot query tables without policy;  
* internal schema inaccessible;  
* grants documented.

---

# **17\. DBF-012 — Production Reference Data**

## **Мета**

Додати production-safe базові довідники як migrations, а не local seed.

## **Migrations**

* `*_seed_languages.sql`  
* `*_seed_countries.sql`  
* `*_seed_currencies.sql`

## **Languages**

Seed:

* `en` — interface/content enabled;  
* `uk` — interface/content enabled;  
* `cs` — interface/content disabled.

## **Currencies**

Seed:

* EUR;  
* CZK;  
* USD;  
* UAH;  
* GBP.

## **Countries**

Використати versioned ISO 3166-1 alpha-2 derived dataset.

Документувати:

* source;  
* dataset version/retrieval date;  
* deprecated-code policy;  
* licence/usage terms where relevant.

## **Idempotency**

Use:

* `INSERT ... ON CONFLICT DO UPDATE`;  
* stable codes;  
* no duplicate records.

## **Обмеження**

Не:

* створювати Programme Fields;  
* створювати Credential Types;  
* створювати issuer;  
* додавати test fixtures.

Вони належать наступним batches.

## **Acceptance criteria**

* data applied repeatedly without duplicates;  
* language flags correct;  
* currency codes correct;  
* country source documented;  
* production reset/migrate includes reference data.

---

# **18\. DBF-013 — Local Seed Fixtures**

## **Мета**

Створити безпечний local/test seed, відокремлений від production reference migrations.

## **File**

`supabase/seed.sql`

## **Scope**

Можна додати:

* test auth users, якщо local tooling це підтримує;  
* corresponding test user profiles;  
* deterministic role fixtures;  
* minimal audit fixtures only if needed.

## **Required local roles**

* one Super Admin;  
* one Content Manager;  
* one Credential Manager;  
* one inactive admin;  
* one authenticated user without profile.

## **Security**

Seed must not contain:

* production email/password;  
* real names;  
* real learner data;  
* HMAC secrets;  
* encryption keys;  
* production tokens;  
* production issuer registration details.

## **Determinism**

Fixtures must use stable documented identifiers where tests need them.

## **Acceptance criteria**

* `db reset` creates fixtures;  
* all test roles available;  
* no production data;  
* seed repeatable;  
* README documents local credentials safely.

---

# **19\. DBF-014 — Database Test Harness**

## **Мета**

Створити інфраструктуру для SQL і RLS tests.

## **Scope**

Визначити test runner, сумісний із Supabase/PostgreSQL.

Допустимі варіанти:

* pgTAP;  
* SQL assertion scripts;  
* integration tests через Node/TypeScript.

Рекомендована модель:

* pgTAP для schema/functions;  
* TypeScript integration tests для auth/RLS;  
* окремі concurrency tests.

## **Structure**

supabase/tests/database/  
supabase/tests/rls/  
supabase/tests/concurrency/  
scripts/database/run\_database\_tests.sh

## **Required commands**

Одна команда повинна:

1. reset database;  
2. run migrations;  
3. apply seed;  
4. run SQL tests;  
5. run RLS tests;  
6. return non-zero on failure.

## **Обмеження**

Не писати credential lifecycle tests до відповідних tables/functions.

## **Acceptance criteria**

* test command documented;  
* failure stops pipeline;  
* local execution works;  
* results readable;  
* environment cleanup handled.

---

# **20\. DBF-015 — Foundation Test Suite**

## **Мета**

Покрити реалізовану foundation schema автоматизованими tests.

## **Required test groups**

### **Extensions**

* citext exists;  
* pg\_trgm exists;  
* pgcrypto decision matches config.

### **Internal schema**

* exists;  
* anon denied;  
* authenticated denied.

### **Enums**

* every enum exists;  
* values exactly match specification.

### **Reference tables**

* tables exist;  
* PK and code constraints work;  
* production reference rows exist.

### **Helpers**

* updated\_at changes;  
* canonical JSON hash deterministic;  
* internal helper access denied.

### **User profiles**

* FK to auth.users;  
* MFA role constraint;  
* RLS enabled;  
* public access denied.

### **Audit**

* insert via internal writer succeeds;  
* direct client insert denied;  
* update/delete denied;  
* indexes exist.

### **User admin RPC**

* Super Admin succeeds;  
* other roles denied;  
* inactive actor denied;  
* last active Super Admin protected;  
* audit event written.

### **Default privileges**

* no PUBLIC EXECUTE;  
* no unexpected table grants;  
* internal schema inaccessible.

## **Acceptance criteria**

* all tests pass;  
* each security requirement has at least one negative test;  
* tests run after clean reset;  
* no tests depend on execution order beyond fixtures.

---

# **21\. DBF-016 — CI Database Gates**

## **Мета**

Заблокувати merge migrations, які порушують schema або security.

## **Scope**

Додати CI workflow, що виконує:

1. dependency install;  
2. Supabase start;  
3. database reset;  
4. full migration chain;  
5. production reference data;  
6. local fixtures;  
7. SQL tests;  
8. RLS tests;  
9. migration filename validation;  
10. destructive SQL scan;  
11. generated types check, якщо types generation налаштована.

## **Destructive SQL patterns**

CI має flag:

* `DROP TABLE`;  
* `DROP COLUMN`;  
* `TRUNCATE`;  
* unqualified `DELETE`;  
* `CASCADE`;  
* sequence reset;  
* unexpected `ALTER TYPE`.

Не кожне співпадіння автоматично блокує назавжди, але вимагає explicit approval marker.

## **Secrets**

CI використовує лише test/local secrets.

## **Acceptance criteria**

* CI запускається на pull request;  
* failed DB test blocks merge;  
* failed reset blocks merge;  
* destructive SQL detected;  
* logs do not contain credentials/secrets.

---

# **22\. DBF-017 — Schema Drift Detection**

## **Мета**

Виявляти ручні зміни Supabase schema.

## **Script**

`./scripts/database/verify_schema_drift.sh`

## **Scope**

Script:

* перевіряє migration history;  
* викликає Supabase migration list;  
* генерує schema diff;  
* завершується помилкою при unexplained drift;  
* не змінює database automatically.

## **Environments**

* local;  
* staging;  
* production pre-deploy.

## **Output**

* migration status;  
* detected drift;  
* affected objects;  
* recommended remediation.

## **Обмеження**

Script не повинен:

* автоматично створювати migration із production;  
* автоматично видаляти objects;  
* показувати secrets.

## **Acceptance criteria**

* clean schema passes;  
* manual test change is detected;  
* non-zero exit code on drift;  
* process documented.

---

# **23\. DBF-018 — Foundation Documentation**

## **Мета**

Оновити технічну документацію після реалізації foundation.

## **Required documents**

### **`docs/database/DATABASE_FOUNDATION_IMPLEMENTATION.md`**

Містить:

* implemented migrations;  
* actual object names;  
* schemas;  
* extensions;  
* enums;  
* reference data;  
* functions;  
* grants;  
* test commands;  
* known deviations.

### **README updates**

Додати:

* local setup;  
* database reset;  
* test execution;  
* migration creation;  
* drift check;  
* troubleshooting.

### **Migration inventory**

Створити таблицю:

| Migration | Purpose | Dependencies | Tests |
| :---: | :---: | :---: | :---: |

## **Rule**

Документація описує фактичну implementation, а не заплановану.

## **Acceptance criteria**

* commands verified;  
* migration inventory complete;  
* deviations explicitly listed;  
* no secrets;  
* next batch prerequisites identified.

---

# **24\. Cross-ticket acceptance criteria**

Database Foundation batch завершений, якщо:

* Supabase local environment працює;  
* migration conventions затверджені;  
* `internal` schema захищена;  
* required extensions enabled;  
* all core enums created;  
* languages, countries and currencies exist;  
* user\_profiles implemented;  
* MFA role constraint implemented;  
* audit\_log append-only;  
* controlled user role functions work;  
* last active Super Admin protected;  
* PUBLIC access revoked;  
* production reference data separated from local seed;  
* local role fixtures available;  
* database test harness works;  
* foundation tests pass;  
* CI blocks invalid migrations;  
* schema drift detection works;  
* implementation documentation complete.

---

# **25\. Out-of-scope reminders**

Під час виконання цього pack Codex не повинен реалізовувати:

* Programme tables;  
* Programme translations;  
* Programme Runs;  
* Experts;  
* Partners;  
* FAQ;  
* Contact Submissions;  
* Learners;  
* Credential Issuers;  
* Credential Types;  
* Credential Groups;  
* Credentials;  
* Snapshots;  
* number sequences;  
* QR;  
* verification API;  
* token HMAC/encryption;  
* lifecycle functions;  
* Storage buckets;  
* frontend pages.

Вони входять у наступні ticket packs.

---

# **26\. Required Codex response format**

Після кожного ticket Codex повинен надати:

## **Summary**

Що реалізовано.

## **Files changed**

Повний список файлів.

## **Database objects**

Створені або змінені objects.

## **Tests**

* які tests запущені;  
* результат;  
* що не вдалося запустити.

## **Security notes**

* grants;  
* RLS;  
* SECURITY DEFINER;  
* secrets handling.

## **Deviations**

Будь-які відхилення від ticket.

## **Next dependency**

Який ticket тепер можна починати.

Codex не повинен повідомляти «готово», якщо tests не запускалися або завершилися помилкою.

---

# **27\. Review checklist**

Перед approval кожного ticket перевірити:

* scope не розширено;  
* migrations мають правильні dependencies;  
* names відповідають schema;  
* no PUBLIC EXECUTE;  
* no frontend service key;  
* fixed search path;  
* security-negative tests існують;  
* no production PII;  
* reset проходить;  
* documentation updated.

