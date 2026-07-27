# **RLS AND PERMISSIONS SPECIFICATION v1**

## **Nobel ITBS Website and Credential Registry**

**Версія:** 1.0  
**Статус:** робочий документ для технічного затвердження  
**Продукт:** nobel-itbs.eu  
**Платформа:** PostgreSQL / Supabase  
**Власник продукту:** Nobel ITBS s.r.o.  
**Product Owner:** Ольга Дашевська

---

# **1\. Мета документа**

Документ визначає модель доступу до бази даних Nobel ITBS Release 1:

* application roles;  
* PostgreSQL/Supabase roles;  
* Row Level Security;  
* table permissions;  
* operation-level policies;  
* RPC permissions;  
* Storage policies;  
* public access;  
* authenticated admin access;  
* service role;  
* internal schema;  
* function security;  
* grants and revokes;  
* MFA requirements;  
* access logging;  
* permission-denied behavior;  
* automated security tests.

Документ є джерелом істини для:

* RLS migrations;  
* SQL grants;  
* function permissions;  
* Storage policies;  
* backend authorization;  
* admin route protection;  
* RLS test suite;  
* Codex security tickets.

---

# **2\. Основні принципи**

## **2.1. Deny by default**

За замовчуванням:

* public access заборонений;  
* authenticated access заборонений;  
* direct table mutations заборонені;  
* function execution заборонене;  
* Storage access заборонений.

Доступ надається лише явно визначеними policies і grants.

## **2.2. Least privilege**

Кожна роль отримує тільки ті права, які потрібні для її роботи.

Роль не отримує доступ:

* «про всяк випадок»;  
* до сусіднього модуля;  
* до таблиці, якщо достатньо view або RPC;  
* до service role;  
* до internal functions.

## **2.3. RLS plus grants**

Безпека будується на кількох рівнях:

1. PostgreSQL grants;  
2. Row Level Security;  
3. controlled RPC functions;  
4. internal schema isolation;  
5. backend authorization;  
6. MFA;  
7. audit logging;  
8. trigger-based integrity controls.

RLS не замінює grants, а grants не замінюють RLS.

## **2.4. No frontend service role**

Service role key:

* не передається browser;  
* не включається у client bundle;  
* не використовується у frontend Supabase client;  
* зберігається тільки в server environment;  
* використовується тільки для визначених server workflows.

## **2.5. No direct credential lifecycle updates**

Жодна application role не змінює напряму:

* credential status;  
* activated\_at;  
* revoked\_at;  
* expired\_at;  
* predecessor/successor links;  
* document number;  
* token fields;  
* immutable snapshot.

Такі зміни виконуються лише через controlled functions.

## **2.6. Public verification is server-mediated**

Public користувач не має direct SELECT до:

* credentials;  
* credential groups;  
* learners;  
* snapshots;  
* token fields;  
* history;  
* audit.

Public verification проходить через:

1. Next.js server route;  
2. application-side token HMAC;  
3. trusted internal lookup;  
4. curated response.

## **2.7. Partners are outside credential verification**

Partners:

* доступні як публічний контент;  
* не беруть участі в credential verification;  
* не є credential issuers;  
* не входять у snapshots;  
* не повертаються verification API.

---

# **3\. Supabase і application roles**

## **3.1. Supabase roles**

### **`anon`**

Неавторизований public користувач.

### **`authenticated`**

Авторизований Supabase user.

Application role визначається через `user_profiles.role`.

### **`service_role`**

Server-only privileged role, яка обходить RLS.

Не є application user role.

## **3.2. Application roles**

### **`super_admin`**

Повний контроль application-level системи з незмінними обмеженнями для audit, activated credentials і immutable snapshots.

### **`content_manager`**

Керує публічним контентом:

* programmes;  
* translations;  
* runs;  
* experts;  
* partners;  
* FAQ;  
* public media.

Не має доступу до learner і credential-модуля.

### **`credential_manager`**

Керує:

* learners;  
* credential groups;  
* Pending credentials;  
* activation;  
* cancel;  
* revoke;  
* reissue;  
* QR;  
* private credential files.

Не змінює programmes, Credential Types, issuers або users.

---

# **4\. Role resolution**

## **4.1. Source of truth**

Application role зберігається в:

`public.user_profiles.role`

Не використовувати user-editable JWT metadata як єдине джерело істини.

## **4.2. Helper functions**

Створюються internal helpers:

* `internal.current_user_role()`;  
* `internal.is_super_admin()`;  
* `internal.is_content_manager()`;  
* `internal.is_credential_manager()`;  
* `internal.is_active_admin()`;  
* `internal.has_required_mfa()`.

## **4.3. Required behavior**

Role helper:

* використовує `auth.uid()`;  
* читає `user_profiles`;  
* перевіряє `is_active`;  
* повертає null/false при відсутньому profile;  
* не приймає user ID від frontend;  
* не дозволяє impersonation.

## **4.4. Disabled users**

Якщо `user_profiles.is_active = false`:

* усі admin table policies повертають false;  
* admin RPC повертають permission denied;  
* admin routes блокуються backend;  
* активна сесія не дає доступу до application data.

---

# **5\. MFA model**

## **5.1. Обов’язковий MFA**

MFA required для:

* Super Admin;  
* Credential Manager.

Content Manager може мати optional MFA у Release 1, але recommended — також увімкнути.

## **5.2. MFA enforcement**

MFA перевіряється для sensitive operations:

* create Pending Credential;  
* activate;  
* cancel;  
* revoke;  
* reissue;  
* issuer management;  
* Credential Type management;  
* role change;  
* private credential file access;  
* audit log access.

## **5.3. Enforcement levels**

MFA має перевірятися:

1. в admin backend route;  
2. у controlled RPC, якщо Supabase session claims дають достатній AAL context;  
3. у UI route guard.

Frontend-only MFA check недостатній.

## **5.4. AAL requirement**

Для sensitive mutation рекомендовано вимагати:

`aal2`

Якщо session має нижчий assurance level:

* mutation не виконується;  
* повертається `AUTH_MFA_REQUIRED`;  
* UI пропонує пройти MFA challenge.

---

# **6\. Database schemas**

## **6.1. `public`**

Містить application tables і browser-callable RPC.

Наявність об’єкта в `public` не означає public access.

## **6.2. `internal`**

Містить:

* role helpers;  
* audit writer;  
* number generator;  
* payload hash helpers;  
* verification lookup;  
* integrity functions.

Для `anon` і `authenticated`:

* USAGE заборонений;  
* EXECUTE заборонений;  
* SELECT заборонений.

## **6.3. Default privileges**

Для database owner:

* `REVOKE ALL ON TABLES FROM PUBLIC`;  
* `REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`;  
* `REVOKE USAGE ON SCHEMA internal FROM PUBLIC`;  
* future functions не отримують автоматичний PUBLIC EXECUTE.

Explicit grants надаються окремими migrations.

---

# **7\. Public access model**

## **7.1. Public може**

* читати published programme content;  
* читати available programme runs;  
* читати published experts;  
* читати published partners;  
* читати published FAQ;  
* надсилати contact form через server endpoint;  
* перевіряти credential через public server route.

## **7.2. Public не може**

* читати base credential tables;  
* читати learners;  
* читати admin profiles;  
* читати drafts;  
* читати archived content;  
* читати private files;  
* виконувати admin RPC;  
* читати audit;  
* викликати internal functions;  
* робити direct contact table insert.

---

# **8\. Public content views**

## **8.1. Views**

Рекомендовані curated views:

* `public.v_public_programmes`;  
* `public.v_public_programme_translations`;  
* `public.v_public_programme_runs`;  
* `public.v_public_experts`;  
* `public.v_public_partners`;  
* `public.v_public_faq`.

## **8.2. View conditions**

### **Programmes**

Повертаються тільки:

* `publication_status = published`;  
* `archived_at is null`.

### **Programme translations**

Повертаються тільки translations published programme.

### **Runs**

Повертаються тільки runs:

* programme published;  
* run status `upcoming` або `enrolment_open`;  
* optionally selected historical display rules.

### **Experts**

Тільки `publication_status = published`.

### **Partners**

Тільки `publication_status = published`.

### **FAQ**

Тільки `publication_status = published`.

## **8.3. Security**

* anon має SELECT на views;  
* anon не має SELECT на base tables;  
* views не містять internal IDs, які не потрібні frontend;  
* views не повертають `created_by`, `updated_by`, internal notes;  
* view security перевіряється automated tests;  
* використовувати `security_invoker = true`, якщо це відповідає реалізації і версії PostgreSQL.

---

# **9\. User profiles permissions**

## **9.1. Public**

No access.

## **9.2. Content Manager**

Може:

* SELECT власного profile;  
* бачити власне ім’я, роль, active status, MFA requirement.

Не може:

* змінювати role;  
* змінювати active status;  
* змінювати MFA requirement;  
* читати profiles інших users.

## **9.3. Credential Manager**

Ті самі self-profile права.

Не може читати profiles інших users.

## **9.4. Super Admin**

Може:

* SELECT all profiles;  
* змінювати role через `change_user_role()`;  
* змінювати active status через controlled function;  
* переглядати admin account state.

Не може:

* змінювати role direct UPDATE;  
* видаляти auth/audit history через profile workflow.

## **9.5. Policies**

Self-select policy:

auth.uid() \= id  
AND internal.is\_active\_admin()

Super Admin select policy:

internal.is\_super\_admin()

Direct UPDATE policy для role-sensitive fields не створюється.

---

# **10\. Reference table permissions**

Tables:

* languages;  
* countries;  
* currencies.

## **Public**

SELECT active/public reference values через views або limited table select.

## **Content Manager**

SELECT.

## **Credential Manager**

SELECT.

## **Super Admin**

SELECT.

Reference-data modification:

* лише через production migrations;  
* не через ordinary admin UI у Release 1\.

No INSERT/UPDATE/DELETE grants для application roles.

---

# **11\. Programme dictionary permissions**

Tables:

* programme\_fields;  
* programme\_field\_translations;  
* programme\_types;  
* programme\_type\_translations.

## **Public**

SELECT published/active values через public views.

## **Content Manager**

Може:

* SELECT;  
* INSERT;  
* UPDATE;  
* archive via status.

Не може:

* physical delete used dictionary;  
* змінювати audit/system fields довільно.

## **Credential Manager**

Read-only limited SELECT, потрібний для credential group creation.

## **Super Admin**

CRUD із delete restrictions.

## **RLS rules**

Content Manager і Super Admin policies require:

* active admin profile;  
* role match.

Credential Manager SELECT returns only active records needed by credential workflow.

---

# **12\. Programmes permissions**

## **12.1. Public**

SELECT published records тільки через curated views.

No base table SELECT.

## **12.2. Content Manager**

Може:

* SELECT all programmes;  
* INSERT Draft;  
* UPDATE Draft;  
* UPDATE content fields;  
* publish через `publish_programme()`;  
* unpublish через `unpublish_programme()`;  
* archive через `archive_programme()`.

Не може:

* physical delete programme with related group/run/history;  
* direct set publication status;  
* bypass EN/UA validation.

## **12.3. Credential Manager**

Може:

* SELECT limited programme reference fields:  
  * id;  
  * title through translations;  
  * active/publication state;  
  * learning hours;  
  * ECTS;  
  * credential languages.

Не може:

* INSERT;  
* UPDATE;  
* DELETE;  
* publish/archive.

## **12.4. Super Admin**

Має Content Manager rights плюс exceptional configuration access.

Still uses controlled lifecycle functions.

## **12.5. Policies**

Direct INSERT:

* Content Manager;  
* Super Admin;  
* only Draft initial state.

Direct UPDATE:

* Content Manager/Super Admin;  
* cannot directly modify protected lifecycle fields:  
  * publication\_status;  
  * published\_at;  
  * archived\_at.

Protected fields змінюються RPC.

---

# **13\. Programme translations permissions**

## **Public**

Published programme translations через view.

## **Content Manager**

SELECT/INSERT/UPDATE/DELETE Draft translations.

Delete translation забороняється, якщо:

* programme Published;  
* видалення порушить required EN/UA state.

Рекомендовано замість direct DELETE:

* controlled delete function;  
* або policy/trigger validation.

## **Credential Manager**

Read-only translations для вибору programme та snapshot preparation.

## **Super Admin**

Controlled full access.

---

# **14\. Programme language relations**

Tables:

* programme\_instruction\_languages;  
* programme\_credential\_languages.

## **Content Manager**

SELECT/INSERT/DELETE для Draft programme.

Для Published programme зміни:

* або спочатку Unpublish;  
* або через controlled workflow із validation.

## **Credential Manager**

SELECT only.

## **Public**

Через curated views.

## **Super Admin**

Controlled full access.

---

# **15\. Programme Runs permissions**

## **Public**

SELECT only public/available runs through view.

## **Content Manager**

Може:

* SELECT;  
* INSERT;  
* UPDATE;  
* change status;  
* set Leeloo URL;  
* manage dates and price;  
* select primary run through RPC.

Не може:

* direct set `is_primary = true`;  
* зробити cancelled/completed run primary;  
* physical delete run used by Credential Group.

## **Credential Manager**

Read-only limited SELECT.

## **Super Admin**

Controlled full access.

## **Protected fields**

`is_primary` змінюється тільки через:

`select_primary_programme_run()`

---

# **16\. Experts permissions**

Tables:

* experts;  
* expert\_translations;  
* programme\_experts.

## **Public**

Published experts and public programme relations through views.

## **Content Manager**

SELECT/INSERT/UPDATE/DELETE Draft/unlinked data.

Used/published experts архівуються, а не видаляються.

## **Credential Manager**

No access, крім випадку, якщо expert data потрібні credential snapshot. У Release 1 не потрібні.

## **Super Admin**

Controlled full access.

---

# **17\. Partners permissions**

Tables:

* partners;  
* partner\_translations;  
* programme\_partners.

## **Public**

SELECT published partners through views.

## **Content Manager**

SELECT/INSERT/UPDATE/archive.

Manage programme relations.

## **Credential Manager**

No access.

## **Super Admin**

Controlled full access.

## **Credential isolation**

RLS і views не створюють joins Partners → Credentials.

Partner data ніколи не повертаються credential functions.

---

# **18\. FAQ permissions**

## **Public**

SELECT published FAQ through view.

## **Content Manager**

CRUD.

## **Credential Manager**

No access required.

## **Super Admin**

CRUD.

Physical delete published FAQ рекомендовано замінити archive/unpublish workflow.

---

# **19\. Contact submissions permissions**

## **Public**

No direct table access.

Submission відбувається через:

* Next.js server endpoint;  
* CAPTCHA validation;  
* rate limiting;  
* trusted backend insert.

## **Content Manager**

No access in Release 1\.

## **Credential Manager**

No access.

## **Super Admin**

Може:

* SELECT;  
* change status;  
* archive;  
* mark spam.

Не може:

* змінювати original name/email/message;  
* delete records через standard workflow.

## **Service role**

Може INSERT із server endpoint.

## **Sensitive data**

Contact submissions не доступні через public/admin generic views.

---

# **20\. Learners permissions**

## **Public**

No access.

## **Content Manager**

No access.

## **Credential Manager**

Може:

* SELECT;  
* INSERT;  
* UPDATE;  
* search;  
* soft-delete тільки якщо немає Credential Groups.

Не може:

* physical DELETE;  
* бачити learners поза admin authenticated context;  
* bulk export у Release 1 без окремого permission.

## **Super Admin**

Може:

* SELECT;  
* INSERT;  
* UPDATE;  
* soft-delete за правилами.

## **Protected behavior**

Soft delete:

* через controlled function;  
* перевіряє відсутність Credential Groups;  
* встановлює `deleted_at`;  
* записує audit event.

Direct DELETE policy відсутня.

---

# **21\. Credential Issuers permissions**

## **Public**

Issuer official name доступна тільки через verification response.

No direct table SELECT.

## **Content Manager**

No access.

## **Credential Manager**

SELECT active issuers.

Не може:

* INSERT;  
* UPDATE;  
* deactivate;  
* delete.

## **Super Admin**

Може:

* SELECT;  
* INSERT;  
* UPDATE;  
* deactivate.

Не може:

* delete issuer used by Credential;  
* змінити issuer snapshot already activated credential.

## **Mutation policy**

Issuer management бажано виконувати controlled RPC із audit logging.

---

# **22\. Credential Types permissions**

Tables:

* credential\_types;  
* credential\_type\_translations.

## **Public**

Type display name доступна тільки через verification response.

## **Content Manager**

No access.

## **Credential Manager**

SELECT active Credential Types і translations.

Не може змінювати:

* code;  
* number pattern;  
* issuer;  
* expiry policy;  
* translations.

## **Super Admin**

Може:

* create;  
* update;  
* deactivate;  
* manage translations.

Used Credential Type cannot be physically deleted.

Changes do not alter existing snapshots.

---

# **23\. Credential Groups permissions**

## **Public**

No access.

## **Content Manager**

No access.

## **Credential Manager**

Може:

* SELECT;  
* create через `create_credential_group()`;  
* limited UPDATE while status Draft;  
* cancel group через controlled function, якщо немає issued credentials.

Не може:

* direct INSERT;  
* direct status change;  
* change core fields after Issued;  
* delete.

## **Super Admin**

Має ті самі lifecycle constraints.

Exception bypass для issued group core fields не надається через ordinary UI.

## **Direct UPDATE fields while Draft**

Дозволені:

* learner\_id;  
* programme\_id;  
* programme\_run\_id;  
* completion\_date;  
* updated\_by.

Недозволені:

* status;  
* idempotency key;  
* payload hash;  
* created\_by;  
* cancelled\_at.

Рекомендовано виконувати Draft update через controlled RPC, а не direct UPDATE.

---

# **24\. Credential Number Sequences permissions**

Table:

`credential_number_sequences`

## **All application roles**

No SELECT.  
No INSERT.  
No UPDATE.  
No DELETE.

## **Access**

Тільки:

* `internal.generate_document_number()`;  
* controlled database owner function chain.

Service role не повинна напряму маніпулювати sequences в ordinary application code.

No manual sequence reset.

---

# **25\. Credentials permissions**

## **25.1. Public**

No direct access.

## **25.2. Content Manager**

No access.

## **25.3. Credential Manager**

Може:

* SELECT credentials;  
* створювати Pending через RPC;  
* activate через RPC;  
* cancel через RPC;  
* revoke через RPC;  
* create reissue successor через RPC;  
* activate reissue через RPC;  
* view lifecycle fields;  
* regenerate QR through server workflow;  
* attach private PDF if enabled.

Не може:

* direct INSERT;  
* direct DELETE;  
* direct status UPDATE;  
* change document number;  
* change token fields;  
* change idempotency fields;  
* change predecessor/successor directly;  
* change activated public fields;  
* restore terminal status.

## **25.4. Super Admin**

Має всі controlled credential workflows.

Може:

* approve Credential Type change on reissue;  
* perform number override before activation through dedicated RPC;  
* inspect audit.

Не може:

* reuse document number;  
* edit Valid snapshot;  
* restore Revoked/Reissued/Expired/Cancelled to Valid;  
* delete activated credential;  
* direct sequence manipulation.

## **25.5. Direct SELECT**

Credential Manager і Super Admin можуть читати credential row, але token fields повинні бути приховані.

### **Preferred implementation**

Не давати SELECT на raw `credentials` table через browser.

Створити admin-safe view:

`v_admin_credentials`

Вона не повертає:

* encrypted token;  
* lookup hash;  
* idempotency payload hash;  
* private PDF storage internals, якщо не потрібно.

Raw token fields доступні тільки trusted backend.

---

# **26\. Credential Snapshots permissions**

## **Public**

No direct SELECT.

Public data повертаються verification service.

## **Content Manager**

No access.

## **Credential Manager**

Може:

* SELECT snapshot через admin-safe view;  
* create/replace snapshot while credential Pending через RPC;  
* preview final public fields.

Не може:

* UPDATE після activation;  
* DELETE;  
* insert snapshot independent від Credential.

## **Super Admin**

Такі самі immutability restrictions.

## **Snapshot RLS**

Direct table mutations заборонені.

Controlled RPC:

* validates credential Pending;  
* validates actor role;  
* validates field whitelist;  
* validates language data;  
* writes audit.

---

# **27\. Credential Status History permissions**

## **Public**

No access.

## **Content Manager**

No access.

## **Credential Manager**

SELECT history for accessible credentials.

No INSERT/UPDATE/DELETE.

## **Super Admin**

SELECT all.

No direct INSERT/UPDATE/DELETE.

History records створюються тільки lifecycle functions.

---

# **28\. Audit Log permissions**

## **Public**

No access.

## **Content Manager**

No access.

## **Credential Manager**

No direct audit table access.

Credential Manager може бачити limited lifecycle history через `credential_status_history`, а не global audit.

## **Super Admin**

SELECT only.

No INSERT through client.  
No UPDATE.  
No DELETE.

Audit insert виконується тільки `internal.write_audit_log()`.

## **Audit privacy**

Audit view for Super Admin не повертає:

* raw token;  
* encrypted token;  
* learner email;  
* full snapshot;  
* private file path;  
* secrets.

---

# **29\. RPC permissions matrix**

| RPC / Function | Public | Content Manager | Credential Manager | Super Admin | Trusted Backend |
| ----- | ----- | ----- | ----- | ----- | ----- |
| `publish_programme` | no | yes | no | yes | optional |
| `unpublish_programme` | no | yes | no | yes | optional |
| `archive_programme` | no | yes | no | yes | optional |
| `select_primary_programme_run` | no | yes | no | yes | optional |
| `change_user_role` | no | no | no | yes | no |
| `set_user_active_status` | no | no | no | yes | no |
| `create_credential_group` | no | no | yes | yes | yes |
| `create_pending_credential` | no | no | yes | yes | yes |
| `replace_pending_snapshot` | no | no | yes | yes | yes |
| `activate_credential` | no | no | yes | yes | yes |
| `cancel_pending_credential` | no | no | yes | yes | yes |
| `revoke_credential` | no | no | yes | yes | yes |
| `create_reissue_successor` | no | no | yes | yes | yes |
| `activate_reissued_credential` | no | no | yes | yes | yes |
| `cancel_pending_reissue` | no | no | yes | yes | yes |
| `manual_number_override` | no | no | no | yes | no |
| `soft_delete_learner` | no | no | yes | yes | optional |
| `internal.generate_document_number` | no | no | no | no | function chain only |
| `internal.write_audit_log` | no | no | no | no | function chain only |
| `internal.expire_credential` | no | no | no | no | scheduled backend |
| `internal.get_credential_verification_result` | no | no | no | no | yes |
| `internal.get_verification_result_by_document_number` | no | no | no | no | yes |

---

# **30\. Function security**

## **30.1. `SECURITY DEFINER`**

Використовується тільки там, де function має виконати операцію, заборонену direct role grants.

Кожна `SECURITY DEFINER` function:

* має fixed `search_path`;  
* fully qualifies table names;  
* не використовує untrusted dynamic SQL;  
* перевіряє `auth.uid()`;  
* перевіряє application role;  
* перевіряє active status;  
* перевіряє MFA/AAL для sensitive action;  
* має explicit EXECUTE grants;  
* не довіряє role або actor ID із input.

## **30.2. Search path**

Рекомендований pattern:

SET search\_path \= public, internal, pg\_temp

Але всі critical objects бажано schema-qualify.

Не включати user-controlled schemas.

## **30.3. Ownership**

Function owner:

* спеціальна controlled database owner role;  
* не `anon`;  
* не `authenticated`;  
* не ordinary admin user.

## **30.4. Error handling**

Functions повертають controlled error codes.

Не повертають:

* SQL text;  
* table names;  
* stack traces;  
* constraint internals;  
* secret values.

---

# **31\. Service role permissions**

## **31.1. Allowed uses**

* public verification backend;  
* manual document-number verification;  
* contact form insert;  
* scheduled expiration;  
* protected QR regeneration;  
* optional email notification processing;  
* deployment/bootstrap scripts.

## **31.2. Prohibited uses**

* browser Supabase client;  
* general admin UI CRUD без user-context checks;  
* client-side React components;  
* public JavaScript bundles;  
* logs;  
* analytics metadata.

## **31.3. Backend authorization**

Навіть при використанні service role backend повинен:

* перевірити authenticated user;  
* перевірити application role;  
* перевірити MFA;  
* validate input;  
* return only curated output.

Service role bypass RLS не є дозволом ігнорувати authorization.

---

# **32\. Storage permissions**

## **32.1. `public-media`**

### **Public**

Може:

* read files;  
* access public URLs.

Не може:

* upload;  
* update;  
* delete;  
* list private/unapproved paths.

### **Content Manager**

Може:

* upload programme images;  
* upload expert photos;  
* upload partner logos;  
* update/delete controlled paths.

### **Credential Manager**

No write access.

### **Super Admin**

Controlled full access.

### **Path conventions**

* `programmes/{programme_id}/...`  
* `experts/{expert_id}/...`  
* `partners/{partner_id}/...`

Policies validate path ownership/entity relation.

## **32.2. `private-credentials`**

### **Public**

No access.  
No list.  
No download.

### **Content Manager**

No access.

### **Credential Manager**

Може:

* upload files linked to accessible credential;  
* request short-lived signed URL;  
* replace/delete Pending/internal files according to workflow.

### **Super Admin**

Controlled access.

### **Security**

* bucket private;  
* signed URLs server-generated;  
* expiry short;  
* signed URL not stored;  
* path not returned in public API;  
* file name sanitized;  
* MIME and size validation required.

### **Path convention**

`credentials/{credential_id}/{file_id}.{ext}`

---

# **33\. Admin route permissions**

Database RLS не замінює route protection.

## **Content routes**

Allowed:

* Content Manager;  
* Super Admin.

## **Credential routes**

Allowed:

* Credential Manager;  
* Super Admin;  
* MFA/AAL2 required for mutations.

## **User management routes**

Allowed:

* Super Admin;  
* MFA/AAL2 required.

## **Audit routes**

Allowed:

* Super Admin;  
* MFA/AAL2 required.

## **Access denied behavior**

* unauthenticated → login;  
* authenticated without role → 403;  
* inactive admin → 403/session termination;  
* MFA insufficient → MFA challenge;  
* hidden internal resource → 404 or generic denial, where appropriate.

---

# **34\. Permission error codes**

| Code | Meaning |
| ----- | ----- |
| `AUTH_UNAUTHENTICATED` | No valid session |
| `AUTH_PROFILE_MISSING` | User profile missing |
| `AUTH_USER_INACTIVE` | Admin account inactive |
| `AUTH_ROLE_FORBIDDEN` | Role does not allow operation |
| `AUTH_MFA_REQUIRED` | MFA/AAL2 required |
| `AUTH_INTERNAL_ONLY` | Function restricted to backend |
| `AUTH_DIRECT_MUTATION_FORBIDDEN` | Operation must use controlled RPC |
| `AUTH_RESOURCE_NOT_ACCESSIBLE` | Resource unavailable to actor |
| `AUTH_STORAGE_FORBIDDEN` | Storage operation denied |
| `AUTH_AUDIT_READ_FORBIDDEN` | Audit log restricted |
| `AUTH_SERVICE_ROLE_MISUSE` | Invalid service-role execution context |

Public responses не розкривають internal policy names.

---

# **35\. Audit requirements for permissions**

Обов’язково логуються:

* role change;  
* user activation/deactivation;  
* failed sensitive permission check;  
* credential activation;  
* revoke;  
* reissue;  
* manual number override;  
* issuer/type configuration change;  
* private file upload/delete;  
* repeated unauthorized access pattern.

Не потрібно логувати кожен звичайний public SELECT.

Audit event містить:

* actor ID;  
* actor role;  
* action;  
* entity type;  
* entity ID;  
* timestamp;  
* reason/error category;  
* safe metadata.

Не містить:

* password;  
* MFA secret;  
* token;  
* lookup hash;  
* encrypted token;  
* learner email;  
* full snapshot;  
* private file path.

---

# **36\. RLS policy naming**

Формат:

`{table}_{operation}_{role_or_context}`

Приклади:

* `programmes_select_content_manager`;  
* `programmes_insert_content_manager`;  
* `programmes_select_credential_manager`;  
* `learners_select_credential_manager`;  
* `audit_log_select_super_admin`;  
* `credentials_deny_direct_mutation`;  
* `storage_objects_insert_public_media_content_manager`.

Policy names мають бути:

* stable;  
* descriptive;  
* unique;  
* reflected in tests.

---

# **37\. Policy implementation patterns**

## **37.1. Role check**

internal.is\_active\_admin()  
AND internal.current\_user\_role() \= 'content\_manager'

Super Admin policies можуть використовувати:

internal.is\_super\_admin()

## **37.2. Combined role access**

Для Content Manager або Super Admin:

internal.current\_user\_role() IN ('content\_manager', 'super\_admin')  
AND internal.is\_active\_admin()

## **37.3. No actor input**

Policy/function не приймає як trusted input:

* actor user ID;  
* actor role;  
* is\_admin;  
* MFA status.

Вони визначаються із session/auth context.

## **37.4. `WITH CHECK`**

INSERT/UPDATE policies повинні мати окремий `WITH CHECK`.

Наприклад, Content Manager може INSERT programme тільки якщо:

* initial status Draft;  
* `created_by = auth.uid()`;  
* `updated_by = auth.uid()`.

## **37.5. Protected columns**

RLS не забезпечує column-level restrictions самостійно.

Для protected columns використовуються:

* revoked direct UPDATE grants;  
* column-level grants where practical;  
* controlled functions;  
* validation triggers.

---

# **38\. Table operation matrix**

Legend:

* `V` — via public view;  
* `S` — direct SELECT;  
* `I` — direct INSERT;  
* `U` — direct UPDATE;  
* `D` — direct DELETE;  
* `F` — controlled function;  
* `—` — no access.

| Resource | Public | Content Manager | Credential Manager | Super Admin |
| ----- | ----- | ----- | ----- | ----- |
| Reference data | V | S | S | S |
| Programme dictionaries | V | S/I/U | S limited | S/I/U/D restricted |
| Programmes | V | S/I/U \+ F lifecycle | S limited | S/I/U \+ F |
| Programme translations | V | S/I/U/D restricted | S | S/I/U/D restricted |
| Programme languages | V | S/I/D restricted | S | S/I/D |
| Programme Runs | V | S/I/U \+ F primary | S limited | S/I/U \+ F |
| Experts | V | S/I/U/D restricted | — | S/I/U/D restricted |
| Partners | V | S/I/U/D restricted | — | S/I/U/D restricted |
| FAQ | V | S/I/U/D | — | S/I/U/D |
| Contact submissions | F/server | — | — | S/U |
| Learners | — | — | S/I/U \+ F soft-delete | S/I/U \+ F |
| Issuers | verification only | — | S active | S/I/U/F |
| Credential Types | verification only | — | S active | S/I/U/F |
| Credential Groups | — | — | S \+ F | S \+ F |
| Number Sequences | — | — | — | — |
| Credentials raw table | — | — | — | — |
| Admin credential view | — | — | S | S |
| Snapshots raw table | — | — | — | — |
| Admin snapshot view | — | — | S | S |
| Status History | — | — | S | S |
| Audit Log | — | — | — | S |
| Public Media | read | write | — | write |
| Private Credentials | — | — | controlled | controlled |

---

# **39\. RLS test specification**

## **39.1. Public tests**

Verify anon:

* reads published programme view;  
* cannot read Draft programme;  
* cannot read base programme table;  
* cannot read learners;  
* cannot read credentials;  
* cannot read snapshots;  
* cannot execute credential RPC;  
* cannot list private bucket;  
* cannot execute internal functions.

## **39.2. Content Manager tests**

Verify:

* can create Draft programme;  
* cannot directly publish;  
* can publish through RPC;  
* cannot access learner;  
* cannot access credential;  
* cannot access audit;  
* cannot write private credential bucket;  
* cannot change own role.

## **39.3. Credential Manager tests**

Verify:

* can read learner;  
* can create group through RPC;  
* can create Pending through RPC;  
* cannot direct INSERT credential;  
* cannot direct UPDATE status;  
* cannot read token fields;  
* can read admin-safe credential view;  
* cannot modify programme;  
* cannot modify issuer/type;  
* cannot read audit;  
* cannot use sensitive mutation without MFA.

## **39.4. Super Admin tests**

Verify:

* can manage users through RPC;  
* can manage issuers/types;  
* can read audit;  
* cannot update/delete audit;  
* cannot direct reverse terminal status;  
* cannot delete activated credential;  
* cannot update activated snapshot;  
* cannot reset number sequence.

## **39.5. Service role tests**

Verify:

* internal verification works;  
* public output filtered;  
* service key absent from browser bundle;  
* server route validates user role before admin mutation;  
* manual verification does not expose token.

## **39.6. Storage tests**

Verify:

* public reads public-media;  
* public cannot write public-media;  
* Content Manager writes allowed path;  
* Content Manager cannot access private bucket;  
* Credential Manager accesses linked private file;  
* unrelated credential path denied;  
* signed URL expires.

---

# **40\. Security acceptance criteria**

RLS and Permissions Specification реалізована, якщо:

* RLS enabled on all application tables;  
* default access denied;  
* internal schema inaccessible to browser roles;  
* PUBLIC function EXECUTE revoked;  
* role comes from user\_profiles;  
* inactive user loses admin access;  
* MFA/AAL2 enforced for credential and user-management mutations;  
* public reads only curated views;  
* anon cannot read base tables;  
* Content Manager cannot access learner/credential data;  
* Credential Manager cannot mutate programme/type/issuer configuration;  
* credential lifecycle uses controlled functions;  
* number sequences inaccessible to application roles;  
* raw credential/token fields inaccessible to browser;  
* snapshot direct mutation denied;  
* terminal statuses cannot be reversed;  
* audit is Super Admin SELECT-only;  
* Partners remain isolated from verification;  
* service role remains server-only;  
* private Storage is not publicly accessible;  
* policy names and grants are documented;  
* RLS tests cover every role and operation;  
* no critical policy relies only on frontend checks.

---

# **41\. Implementation order**

1. Create internal role helper functions.  
2. Revoke default privileges.  
3. Enable RLS.  
4. Create public-content views.  
5. Add public view grants.  
6. Add Content Manager policies.  
7. Add Credential Manager policies.  
8. Add Super Admin policies.  
9. Add RPC EXECUTE grants.  
10. Add internal function restrictions.  
11. Add admin-safe credential views.  
12. Add Storage policies.  
13. Add MFA checks.  
14. Run full RLS tests.  
15. Run view-leak tests.  
16. Run service-role misuse tests.  
17. Approve staging.

---

# **42\. Codex ticket groups**

## **Group 1 — Role foundation**

* internal role helpers;  
* active-user checks;  
* MFA/AAL checks;  
* default privilege revocation.

## **Group 2 — Public content**

* public views;  
* anon grants;  
* draft/archive leak tests.

## **Group 3 — Content Manager**

* programme/content policies;  
* lifecycle RPC grants;  
* public-media Storage policies.

## **Group 4 — Credential Manager**

* learner access;  
* admin-safe views;  
* credential RPC grants;  
* private Storage access;  
* MFA enforcement.

## **Group 5 — Super Admin**

* user management;  
* type/issuer management;  
* audit read;  
* immutable-system restrictions.

## **Group 6 — Service and internal security**

* internal schema grants;  
* verification backend access;  
* manual verification;  
* expiration job;  
* service-role tests.

## **Group 7 — RLS test suite**

* table matrix;  
* RPC matrix;  
* Storage;  
* view leakage;  
* inactive user;  
* missing profile;  
* MFA failure.

---

# **43\. Open implementation confirmations**

Перед написанням final SQL policies потрібно підтвердити:

1. Чи Content Manager також обов’язково використовує MFA.  
2. Чи Credential Manager бачить email learner у list view або тільки detail view.  
3. Чи Super Admin може переглядати повний contact message в admin.  
4. Який максимальний строк signed URL для private credential PDF.  
5. Чи private PDF входить у Release 1 або активується пізніше feature flag.  
6. Чи admin-safe views викликаються browser Supabase client або тільки Next.js server.

Рекомендовані default-рішення:

1. MFA required для всіх admin roles.  
2. Learner email тільки в detail view.  
3. Super Admin бачить full contact submission.  
4. Signed URL — 5 хвилин.  
5. Private PDF — feature flag, Should-have.  
6. Admin-safe views можна використовувати через authenticated browser client із RLS, але sensitive mutations — тільки server/RPC.

