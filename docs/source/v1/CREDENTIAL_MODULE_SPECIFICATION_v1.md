# **CREDENTIAL MODULE SPECIFICATION v1**

## **Система реєстрації та перевірки документів Nobel ITBS**

**Версія:** 1.0  
**Статус:** робочий документ для технічного затвердження  
**Продукт:** nobel-itbs.eu  
**Модуль:** Credential Registry and Verification  
**Власник продукту:** Nobel ITBS s.r.o.  
**Product Owner:** Ольга Дашевська

---

# **1\. Мета документа**

Документ визначає повну бізнесову й технічну логіку credential-модуля:

* типи документів;  
* credential groups;  
* формат номерів;  
* verification token;  
* QR-коди;  
* створення credential;  
* snapshot;  
* активацію;  
* статуси та переходи;  
* скасування;  
* анулювання;  
* завершення строку дії;  
* перевидачу;  
* публічну перевірку;  
* ручний пошук;  
* адміністративні workflow;  
* ролі та права;  
* security controls;  
* rate limiting;  
* error codes;  
* audit events;  
* acceptance criteria;  
* test cases.

Модуль не генерує навчальні результати і не визначає право користувача на отримання документа. Він реєструє вже ухвалене адміністративне рішення про видачу документа та забезпечує перевірку його справжності.

---

# **2\. Межі модуля**

## **2.1. До Release 1 входять**

* створення Credential Group;  
* створення одного або кількох credentials у групі;  
* створення learner;  
* вибір programme і programme run;  
* вибір Credential Type;  
* вибір Credential Issuer;  
* автоматична генерація document number;  
* генерація verification token;  
* генерація QR;  
* створення snapshot;  
* статус Pending;  
* активація як Valid;  
* публічна перевірка;  
* ручна перевірка;  
* Revoked;  
* Reissued;  
* Expired;  
* Cancelled;  
* status history;  
* audit log;  
* role-based access;  
* idempotency;  
* rate limiting;  
* CAPTCHA після підозрілої активності.

## **2.2. До Release 1 не входять**

* автоматичне створення документа після завершення Moodle;  
* автоматична генерація PDF диплома;  
* автоматичне надсилання документа випускнику;  
* qualified electronic signature;  
* European Digital Credentials;  
* Europass;  
* blockchain;  
* student cabinet;  
* масовий XLSX/CSV import;  
* bulk credential issuance;  
* публічний PDF;  
* verification через зовнішній державний реєстр;  
* автоматичне визначення ECTS;  
* автоматичне підтвердження права на професійну практику.

---

# **3\. Основні сутності**

## **3.1. Learner**

Внутрішня особа, якій видається документ.

Містить:

* original full name;  
* Latin full name;  
* email — опційно;  
* country — опційно;  
* internal note.

Learner не є публічною сутністю.

## **3.2. Credential Group**

Об’єднує документи, видані за одним завершенням програми.

Приклад групи:

* Professional Development Diploma;  
* Certificate Supplement;  
* CPD Certificate.

Credential Group містить:

* learner;  
* programme;  
* programme run — опційно;  
* completion date;  
* status.

Кожен окремий документ у групі має:

* власний Credential Type;  
* власний document number;  
* власний verification token;  
* власний QR;  
* власний статус;  
* власну verification page.

Credential Group не має публічного QR і не перевіряється як окремий документ.

## **3.3. Credential**

Окремий виданий документ.

Приклади:

* Certificate;  
* Professional Development Diploma;  
* Certificate Supplement;  
* Transcript;  
* CPD Certificate.

## **3.4. Credential Type**

Контрольований системний тип документа.

Визначає:

* системний код;  
* публічну назву;  
* формат номера;  
* default issuer;  
* наявність строку дії;  
* шаблон документа — у майбутньому;  
* правила обов’язкових полів у application code.

## **3.5. Credential Issuer**

Організація, яка формально видає конкретний документ.

Початковий issuer:

* Nobel ITBS s.r.o.

Partners не є частиною credential verification, не повертаються verification API і не копіюються в snapshot.

## **3.6. Credential Snapshot**

Незмінний набір публічних і друкованих даних документа.

Після активації snapshot не може редагуватися. Зміна публічних даних потребує Reissue.

---

# **4\. Credential Group**

## **4.1. Статуси групи**

Використовуються:

* `draft`;  
* `issued`;  
* `cancelled`.

## **4.2. Draft**

Група створена, але жоден credential ще не активований.

Дозволено:

* змінювати learner;  
* programme;  
* programme run;  
* completion date;  
* додавати й скасовувати Pending credentials.

## **4.3. Issued**

Група автоматично стає Issued після активації першого credential.

Після цього не можна змінювати:

* learner;  
* programme;  
* programme run;  
* completion date.

Можна:

* додавати додатковий Pending credential до тієї самої групи;  
* активувати додаткові документи;  
* перевидавати документи в межах групи.

## **4.4. Cancelled**

Дозволено лише якщо:

* у групі немає Valid, Revoked, Reissued або Expired credentials;  
* усі credentials мають Pending або Cancelled.

Cancelled group не може приймати нові credentials без окремого відновлення Super Admin.

## **4.5. Reissue і група**

Перевиданий credential завжди залишається в тій самій Credential Group.

Нова група створюється тільки для нового completion event.

---

# **5\. Credential Types**

## **5.1. Початкові типи**

* Certificate;  
* Professional Development Certificate;  
* Professional Development Diploma;  
* MINI-MBA Diploma;  
* CPD Certificate;  
* Certificate Supplement;  
* Transcript;  
* Attendance Certificate.

## **5.2. Credential Type Translations**

Створюється таблиця:

`credential_type_translations`

Поля:

* `credential_type_id`;  
* `language_code`;  
* `display_name`;  
* `public_description` — опційно;  
* `created_at`;  
* `updated_at`.

Constraint:

`unique(credential_type_id, language_code)`

Публічна verification page показує назву типу документа відповідно до обраної мови.

Snapshot зберігає назву Credential Type у мові документа.

## **5.3. Управління типами**

Створювати, редагувати й деактивувати Credential Type може тільки Super Admin.

Credential Manager може:

* переглядати активні типи;  
* обирати тип документа;  
* бачити правила заповнення.

Credential Type, що вже використовувався, не видаляється.

---

# **6\. Формат document number**

## **6.1. Загальний формат**

Базовий формат:

`NITBS-{TYPE}-{YEAR}-{SEQUENCE}`

Приклад:

`NITBS-MBA-2026-000127`

## **6.2. Компоненти**

### **`NITBS`**

Фіксований issuer prefix для Nobel ITBS.

### **`TYPE`**

Код Credential Type.

Початкові коди:

| Credential Type | Code |
| ----- | ----- |
| Certificate | CERT |
| Professional Development Certificate | PDC |
| Professional Development Diploma | PDD |
| MINI-MBA Diploma | MBA |
| CPD Certificate | CPD |
| Certificate Supplement | SUP |
| Transcript | TRN |
| Attendance Certificate | ATT |

### **`YEAR`**

Рік issue date у форматі `YYYY`.

### **`SEQUENCE`**

Шестизначний послідовний номер:

`000001`–`999999`

Послідовність ведеться окремо для кожного Credential Type і року.

## **6.3. Правила**

* document number унікальний глобально;  
* генерується server-side;  
* генерується атомарно;  
* не змінюється після створення;  
* не використовується повторно;  
* скасований Pending credential не звільняє номер;  
* номер не містить ПІБ, programme ID або інших персональних даних;  
* ручне введення дозволено лише Super Admin до активації;  
* ручна зміна обов’язково логуються;  
* після Valid ручна зміна неможлива.

## **6.4. Programme code**

Programme code не використовується у стандартному Release 1 format.

Це:

* спрощує numbering;  
* запобігає зміні формату після перейменування програми;  
* зменшує довжину номера;  
* дозволяє єдину модель для всіх programmes.

---

# **7\. Verification Token**

## **7.1. Вимоги**

Token:

* має мінімум 128 bits entropy;  
* генерується криптографічно безпечним генератором;  
* є URL-safe;  
* не містить document number;  
* не містить UUID;  
* не містить ПІБ або інших персональних даних;  
* не є послідовним;  
* є унікальним;  
* не змінюється після активації.

## **7.2. Формат**

Використовується Base64URL без padding.

Рекомендована довжина:

* 22 символи для 128-bit token;  
* допускається 24–32 символи.

Приклад:

`Q5k7nX2pL9vM4cR8tW1zAa`

## **7.3. Нормалізація**

Перед lookup:

* видаляються пробіли на початку й наприкінці;  
* token обробляється case-sensitive;  
* URL decoding виконується один раз;  
* token із недопустимими символами відхиляється до database lookup;  
* максимальна довжина input обмежується.

## **7.4. Lookup hash**

Використовується:

`HMAC-SHA-256(secret_pepper, normalized_token)`

У базі поле називається:

`verification_token_lookup_hash`

Hash:

* deterministic;  
* globally unique через unique constraint;  
* не повертається frontend;  
* не логуються;  
* обчислюється лише server-side.

## **7.5. Encryption**

Raw token шифрується тільки в application layer.

База зберігає:

* `verification_token_lookup_hash`;  
* `verification_token_encrypted`.

Encryption key:

* зберігається у secure environment/secret manager;  
* не зберігається в PostgreSQL;  
* не передається frontend;  
* відокремлена від HMAC pepper;  
* має key version;  
* допускає key rotation.

До credentials додається поле:

* `token_encryption_key_version`.

## **7.6. QR regeneration**

Для повторної генерації QR:

1. авторизований backend отримує encrypted token;  
2. розшифровує його application-layer key;  
3. формує verification URL;  
4. генерує QR;  
5. raw token не записується в logs.

## **7.7. Token after cancellation**

Для Cancelled credential:

* token залишається зарезервованим;  
* не використовується повторно;  
* public verification повертає generic inactive/not found result;  
* QR не вважається активним.

---

# **8\. Verification URL і QR**

## **8.1. Verification URL**

Canonical URL:

`https://nobel-itbs.eu/verify/{token}`

QR завжди веде на English canonical URL без мовного префікса.

Українська версія:

`https://nobel-itbs.eu/uk/verify/{token}`

Token однаковий для обох URL.

## **8.2. QR content**

QR містить тільки canonical HTTPS URL.

Не містить:

* ПІБ;  
* document number;  
* JSON;  
* internal UUID;  
* programme data;  
* issuer data.

## **8.3. QR format**

Підтримується:

* SVG — основний формат для друку;  
* PNG — допоміжний формат;  
* рекомендований error correction level: M або Q;  
* quiet zone не менше 4 modules;  
* QR має тестуватися на фактичному розмірі диплома.

## **8.4. QR generation**

QR генерується:

* після створення Pending credential;  
* повторно на вимогу адміністратора;  
* server-side;  
* без збереження окремого QR-файлу як обов’язкової сутності.

Джерелом істини є encrypted token і canonical URL.

---

# **9\. Snapshot Structure**

## **9.1. Обов’язкові поля**

* printed full name;  
* programme title;  
* Credential Type display name;  
* document number;  
* credential languages;  
* issuer official name;  
* issue date.

## **9.2. Умовно обов’язкові**

* completion date;  
* learning hours;  
* ECTS;  
* instruction languages;  
* expiry date;  
* issuer country.

Вони залежать від Credential Type і programme.

## **9.3. Additional public data**

`additional_public_data` допускає лише заздалегідь визначені поля.

Для Release 1 whitelist може включати:

* qualification level reference;  
* delivery format;  
* distinction;  
* grade;  
* certificate supplement reference.

Заборонено:

* email;  
* phone;  
* address;  
* private notes;  
* payment data;  
* PDF path;  
* token;  
* internal IDs;  
* partner data.

## **9.4. Snapshot lifecycle**

### **Pending**

Snapshot можна створювати, замінювати й редагувати через controlled function.

### **Valid**

Snapshot immutable.

### **Revoked / Reissued / Expired**

Snapshot залишається immutable.

### **Cancelled**

Snapshot може залишатися в базі для audit, але не повертається публічно.

## **9.5. Operational consistency**

Під час activation система перевіряє відповідність:

* document number;  
* issue date;  
* completion date;  
* expiry date;  
* issuer.

Після activation operational public fields також блокуються від прямої зміни.

---

# **10\. Credential Status Machine**

## **10.1. Статуси**

* Pending;  
* Valid;  
* Revoked;  
* Reissued;  
* Expired;  
* Cancelled.

## **10.2. Дозволені переходи**

| From | To | Allowed |
| ----- | ----- | ----- |
| Pending | Valid | yes |
| Pending | Cancelled | yes |
| Pending | Revoked | no |
| Pending | Reissued | no |
| Pending | Expired | no |
| Valid | Revoked | yes |
| Valid | Reissued | only via successor activation |
| Valid | Expired | yes, manually or scheduled |
| Valid | Cancelled | no |
| Revoked | Valid | no standard flow |
| Revoked | Reissued | no standard flow |
| Reissued | Valid | no |
| Expired | Valid | only Super Admin procedure if policy allows |
| Cancelled | any | no |

## **10.3. Controlled transitions**

Статус не змінюється через звичайний table update.

Використовуються functions:

* `activate_credential`;  
* `cancel_pending_credential`;  
* `revoke_credential`;  
* `activate_reissued_credential`;  
* `expire_credential`.

## **10.4. Initial status**

Кожен новий credential створюється як Pending.

---

# **11\. Створення Credential Group**

## **11.1. Actor**

* Credential Manager;  
* Super Admin.

## **11.2. Input**

* idempotency key;  
* learner ID або new learner data;  
* programme ID;  
* programme run ID — optional;  
* completion date.

## **11.3. Validation**

* learner існує або успішно створений;  
* programme існує;  
* programme run належить programme;  
* completion date не пізніше поточної дати, якщо інше явно не дозволено;  
* idempotency key не використовувався.

## **11.4. Result**

Створюється Draft Credential Group.

Повторний запит із тим самим idempotency key повертає ту саму group.

Для цього до `credential_groups` додається:

* `idempotency_key uuid unique not null`.

---

# **12\. Створення Pending Credential**

## **12.1. Actor**

* Credential Manager;  
* Super Admin.

## **12.2. Input**

* idempotency key, переданий клієнтом;  
* credential group ID;  
* Credential Type ID;  
* issuer ID — default із type або explicit allowed issuer;  
* issue date;  
* valid from — optional;  
* expiry date — optional;  
* printed full name;  
* credential language;  
* public fields;  
* internal note — optional.

## **12.3. Idempotency**

Idempotency key:

* генерується frontend або backend caller;  
* передається в кожний create request;  
* не генерується всередині database function;  
* повторний request повертає той самий credential;  
* не створює новий document number.

## **12.4. Validation**

* group не Cancelled;  
* learner, programme і run беруться тільки з group;  
* Credential Type active;  
* issuer active;  
* issue date коректна;  
* expiry заповнена, якщо type має expiry;  
* у snapshot немає заборонених полів;  
* credential language дозволена programme;  
* document type ще не існує в group, якщо дублювання не дозволене.

## **12.5. Transaction**

У межах однієї transaction:

1. перевіряється idempotency key;  
2. генерується document number;  
3. генерується raw token;  
4. обчислюється HMAC lookup hash;  
5. token шифрується application layer до database call або через secure backend transaction flow;  
6. створюється credential Pending;  
7. створюється editable snapshot;  
8. записується status history;  
9. записується audit event.

## **12.6. Result**

Backend повертає:

* credential UUID;  
* document number;  
* status Pending;  
* public verification URL;  
* QR SVG/PNG або endpoint для генерації;  
* snapshot preview.

Raw token не повертається окремим полем у звичайній UI-відповіді, крім захищеного QR-generation response.

---

# **13\. Activation**

## **13.1. Actor**

* Credential Manager;  
* Super Admin.

## **13.2. Preconditions**

Credential:

* має Pending;  
* має complete snapshot;  
* має valid issuer;  
* має document number;  
* має token hash і encrypted token;  
* не має duplicate type conflict у group;  
* issue date не передує completion date;  
* group не Cancelled.

## **13.3. Confirmation**

Admin UI показує final preview:

* printed name;  
* programme;  
* type;  
* number;  
* issue date;  
* hours;  
* ECTS;  
* language;  
* issuer;  
* QR.

Адміністратор підтверджує:

> I confirm that the public and printed credential data are correct.

## **13.4. Transaction**

1. Повторна validation.  
2. Snapshot блокується як immutable.  
3. Credential стає Valid.  
4. `activated_at = now()`.  
5. Group стає Issued, якщо це перший Valid credential.  
6. Створюється status history.  
7. Створюється audit record.

## **13.5. Result**

Credential:

* доступний через verification;  
* не може редагувати public snapshot;  
* може бути Revoked, Expired або Reissued.

---

# **14\. Cancel Pending Credential**

## **14.1. Conditions**

* status Pending;  
* credential ще не активувався;  
* actor Credential Manager або Super Admin.

## **14.2. Required input**

* reason;  
* confirmation.

## **14.3. Result**

* status Cancelled;  
* `cancelled_at = now()`;  
* token стає неактивним;  
* document number не звільняється;  
* credential не видаляється фізично;  
* snapshot не повертається публічно;  
* audit record створюється.

---

# **15\. Revoke Credential**

## **15.1. Meaning**

Revoked означає, що раніше дійсний документ був анульований Nobel ITBS.

## **15.2. Actor**

* Credential Manager;  
* Super Admin.

## **15.3. Preconditions**

* status Valid;  
* reason обов’язкова;  
* окреме confirmation modal.

## **15.4. Input**

* reason;  
* internal reason code — optional;  
* public message override — не використовується в Release 1\.

## **15.5. Transaction**

1. Перевірка status Valid.  
2. Status → Revoked.  
3. `revoked_at = now()`.  
4. Зберігається reason.  
5. Status history.  
6. Audit log.

## **15.6. Public result**

Показуються:

* Revoked;  
* document number;  
* printed full name;  
* programme title;  
* Credential Type;  
* issue date;  
* issuer.

Не показуються:

* внутрішня reason;  
* administrator;  
* audit history.

Публічне повідомлення:

> This credential has been revoked and is no longer valid.

---

# **16\. Expire Credential**

## **16.1. Meaning**

Expired використовується лише для Credential Types, які мають строк дії.

## **16.2. Automatic expiration**

Scheduled backend job може переводити Valid → Expired, якщо:

* `expires_at < current_date`;  
* type has expiry;  
* credential досі Valid.

## **16.3. Manual expiration**

Super Admin може виконати manual expiration у винятковому випадку.

## **16.4. Public result**

Показуються:

* Expired;  
* public snapshot;  
* expiry date.

Повідомлення:

> This credential has expired.

---

# **17\. Reissue Credential**

## **17.1. Meaning**

Reissue створює новий документ замість чинного, коли потрібно змінити публічні або друковані дані.

## **17.2. Typical reasons**

* виправлення імені;  
* виправлення programme title;  
* виправлення дат;  
* зміна Credential Type;  
* технічна помилка в документі;  
* заміна пошкодженого документа;  
* адміністративне перевидання.

## **17.3. Actor**

* Credential Manager;  
* Super Admin.

Зміна Credential Type потребує Super Admin.

## **17.4. Preconditions**

* predecessor має Valid;  
* немає іншого active Pending successor;  
* credential належить існуючій group.

## **17.5. Draft successor**

1. Admin натискає Reissue.  
2. Вказує reason.  
3. Frontend передає idempotency key.  
4. Створюється новий Pending credential у тій самій group.  
5. Копіюється snapshot predecessor як editable draft.  
6. Генерується новий document number.  
7. Генерується новий token і QR.  
8. Predecessor залишається Valid.  
9. Створюється predecessor link.  
10. Audit log.

## **17.6. Successor activation**

У єдиній transaction:

1. successor Pending;  
2. predecessor Valid;  
3. snapshot successor complete;  
4. successor → Valid;  
5. predecessor → Reissued;  
6. predecessor.successor\_id встановлюється;  
7. successor.predecessor\_id підтверджується;  
8. status history обох документів;  
9. audit records.

## **17.7. Cancellation**

Якщо successor ще Pending:

* status → Cancelled;  
* predecessor лишається Valid;  
* number і token не використовуються повторно;  
* successor link не активується.

## **17.8. Public predecessor result**

Показуються:

* Reissued;  
* основні дані predecessor;  
* повідомлення про заміну;  
* посилання на successor verification page.

Повідомлення:

> This credential has been reissued. Please refer to the replacement credential.

## **17.9. Restrictions**

* один active successor;  
* той самий learner;  
* та сама Credential Group;  
* revoked credential не перевидається standard flow;  
* successor не може посилатися сам на себе;  
* ланцюжок reissue може містити кілька послідовних документів, але кожен має максимум одного immediate successor.

---

# **18\. Manual Verification**

## **18.1. Input field**

Одне поле:

**Document number or verification code**

## **18.2. Input classification**

Backend визначає:

### **Document number**

Відповідає затвердженому pattern, наприклад:

`NITBS-MBA-2026-000127`

### **Verification token**

Відповідає Base64URL format і допустимій довжині.

### **Invalid**

Не відповідає жодному формату.

## **18.3. Document number flow**

1. Backend знаходить credential за exact document number.  
2. Перевіряє, що credential не Cancelled.  
3. Розшифровує token server-side.  
4. Формує canonical verification URL.  
5. Повертає server-side redirect.  
6. Frontend не отримує raw credential row.

## **18.4. Token flow**

1. Нормалізація.  
2. HMAC hash.  
3. Lookup.  
4. Відображення result page.

## **18.5. Generic responses**

Не повідомляється:

* чи існує learner;  
* чи правильна частина номера;  
* чи token мав правильний prefix;  
* внутрішній UUID.

---

# **19\. Public Verification API**

## **19.1. Endpoint**

`GET /api/public/credentials/verify/{token}`

Або server route:

`/verify/{token}`

що викликає внутрішній service.

## **19.2. Success response**

HTTP 200:

{  
  "result": "valid",  
  "credential": {  
    "status": "valid",  
    "documentNumber": "NITBS-MBA-2026-000127",  
    "printedFullName": "Example Name",  
    "programmeTitle": "MINI-MBA in Marketing",  
    "credentialType": "MINI-MBA Diploma",  
    "issueDate": "2026-07-20",  
    "completionDate": "2026-07-15",  
    "learningHours": 180,  
    "ects": 6,  
    "credentialLanguages": \["en"\],  
    "issuer": {  
      "officialName": "Nobel ITBS s.r.o.",  
      "countryCode": "CZ"  
    }  
  },  
  "verifiedAt": "2026-07-23T12:00:00Z"  
}

## **19.3. Status responses**

### **Valid**

`result = valid`

### **Revoked**

`result = revoked`

### **Reissued**

`result = reissued`

Може містити:

* `replacementUrl`.

### **Expired**

`result = expired`

### **Pending**

Не повертає credential data:

{  
  "result": "pending",  
  "credential": null  
}

### **Cancelled / Not Found / invalid token**

Повертається generic:

{  
  "result": "not\_found",  
  "credential": null  
}

## **19.4. HTTP status policy**

* Valid business result, включно Revoked/Reissued/Expired/Pending: `200`;  
* invalid token format: `400`;  
* not found: `404`;  
* rate limited: `429`;  
* maintenance: `503`;  
* unexpected server error: `500`.

## **19.5. Cache policy**

Verification responses:

* не кешуються публічним CDN надовго;  
* можуть мати short private/server cache;  
* status changes мають відображатися практично одразу;  
* recommended `Cache-Control: no-store` для Release 1\.

---

# **20\. Public Verification UI**

## **20.1. Valid**

Візуально:

* чіткий status badge;  
* назва документа;  
* основні поля;  
* issuer;  
* verification timestamp.

## **20.2. Revoked**

* червоний або критичний статус;  
* однозначне повідомлення;  
* без внутрішньої reason.

## **20.3. Reissued**

* warning/information status;  
* replacement link;  
* не показувати predecessor як чинний.

## **20.4. Expired**

* нейтральний warning;  
* expiry date.

## **20.5. Pending**

Показується тільки:

> This credential is not yet active.

## **20.6. Not Found**

> Credential not found.

Не показувати, чи input був document number або token.

---

# **21\. Rate Limiting**

## **21.1. QR direct verification**

Орієнтовна політика:

* до 60 requests на IP hash за 10 хвилин;  
* adaptive limits для підозрілих патернів;  
* legitimate repeated QR checks не повинні блокуватися надто швидко.

## **21.2. Manual verification**

Строгіший limit:

* до 10 searches за 10 хвилин на IP hash;  
* до 5 failed searches підряд;  
* після threshold — CAPTCHA;  
* після подальшого перевищення — temporary block.

## **21.3. Distributed protection**

Додатково:

* WAF/platform rate limiting;  
* application-level counters;  
* generic responses;  
* monitoring repeated document-number enumeration.

## **21.4. Privacy**

У логах зберігається:

* salted/peppered IP hash;  
* timestamp;  
* result category;  
* route.

Не зберігається:

* raw token;  
* повний document number у security logs;  
* full user agent;  
* персональні дані credential.

---

# **22\. CAPTCHA**

CAPTCHA застосовується:

* не для першого normal verification;  
* після suspicious activity;  
* після failed search threshold;  
* для partner/contact forms;  
* при manual verification abuse.

CAPTCHA provider обирається під час technical implementation.

Failure message:

> Please complete the verification step and try again.

---

# **23\. Roles and Permissions**

## **23.1. Credential Manager**

Може:

* створювати learner;  
* створювати group;  
* створювати Pending credential;  
* редагувати Pending;  
* активувати;  
* скасовувати Pending;  
* revoke Valid;  
* initiate reissue;  
* activate successor;  
* переглядати status history;  
* генерувати QR;  
* працювати з private PDF, якщо функція включена.

Не може:

* змінювати Credential Type;  
* створювати issuer;  
* змінювати document number вручну;  
* відновлювати Revoked;  
* змінювати snapshot Valid credential;  
* видаляти audit history.

## **23.2. Super Admin**

Має всі права Credential Manager, а також:

* управляє Credential Types;  
* управляє issuers;  
* manual number override до activation;  
* затверджує Credential Type change при Reissue;  
* виконує exception procedures;  
* управляє admin roles;  
* читає audit log.

Навіть Super Admin не може:

* повторно використати document number;  
* редагувати activated snapshot через звичайний workflow;  
* видаляти audit log;  
* видаляти activated credential.

---

# **24\. Admin Screens**

## **24.1. Credential Groups List**

Поля:

* learner;  
* programme;  
* run;  
* completion date;  
* group status;  
* number of credentials;  
* updated date.

## **24.2. Credential Group Detail**

Показує:

* learner;  
* programme;  
* run;  
* completion date;  
* credentials list;  
* Create Credential;  
* group status;  
* audit summary.

## **24.3. Create Credential**

Кроки:

1. Select group.  
2. Select Credential Type.  
3. Select issuer.  
4. Enter issue and validity dates.  
5. Prepare snapshot.  
6. Preview.  
7. Save Pending.

## **24.4. Credential Detail Pending**

Дії:

* Edit;  
* Preview;  
* Generate QR;  
* Activate;  
* Cancel.

## **24.5. Credential Detail Valid**

Дії:

* View public page;  
* Download QR;  
* Add private PDF;  
* Revoke;  
* Reissue.

Public snapshot fields read-only.

## **24.6. Credential Detail Revoked**

Дії:

* View public page;  
* view history.

## **24.7. Credential Detail Reissued**

Дії:

* View predecessor public page;  
* open successor;  
* view history.

---

# **25\. Error Codes**

## **Public**

| Code | Meaning |
| ----- | ----- |
| `CRED_INVALID_INPUT` | Invalid identifier format |
| `CRED_NOT_FOUND` | Credential not found |
| `CRED_PENDING` | Not yet active |
| `CRED_RATE_LIMITED` | Too many attempts |
| `CRED_MAINTENANCE` | Verification unavailable |
| `CRED_INTERNAL_ERROR` | Unexpected server error |

## **Admin**

| Code | Meaning |
| ----- | ----- |
| `CRED_GROUP_NOT_FOUND` | Group missing |
| `CRED_TYPE_INACTIVE` | Type unavailable |
| `CRED_ISSUER_INACTIVE` | Issuer unavailable |
| `CRED_DUPLICATE_TYPE_IN_GROUP` | Duplicate document type |
| `CRED_IDEMPOTENCY_CONFLICT` | Key used for different input |
| `CRED_SNAPSHOT_INCOMPLETE` | Required public data missing |
| `CRED_INVALID_STATUS_TRANSITION` | Status transition forbidden |
| `CRED_ALREADY_ACTIVATED` | Credential already Valid |
| `CRED_REVOKE_REASON_REQUIRED` | Missing reason |
| `CRED_SUCCESSOR_EXISTS` | Active successor exists |
| `CRED_REISSUE_TYPE_APPROVAL_REQUIRED` | Super Admin required |
| `CRED_NUMBER_COLLISION` | Number generation collision |
| `CRED_TOKEN_GENERATION_FAILED` | Token creation failed |
| `CRED_PERMISSION_DENIED` | Role insufficient |
| `CRED_GROUP_CANCELLED` | Group cannot accept credentials |

Error responses do not include stack traces or database details.

---

# **26\. Audit Events**

Обов’язково логуються:

* group created;  
* group cancelled;  
* Pending credential created;  
* Pending edited — лише критичні fields;  
* snapshot prepared;  
* credential activated;  
* Pending cancelled;  
* credential revoked;  
* reissue initiated;  
* successor activated;  
* document number manually overridden;  
* issuer changed before activation;  
* QR regenerated;  
* private PDF uploaded/deleted;  
* Credential Type changed;  
* role permission failure — за потреби.

Whitelist fields:

* credential ID;  
* group ID;  
* type ID;  
* issuer ID;  
* old/new status;  
* action reason;  
* timestamp;  
* actor ID;  
* non-sensitive changed field names.

Не логуються:

* raw token;  
* encrypted token;  
* token hash;  
* printed full name;  
* learner email;  
* document PDF path;  
* signed URL;  
* full snapshot.

---

# **27\. Monitoring**

Відстежуються:

* verification availability;  
* p95 response time;  
* verification errors;  
* rate-limit events;  
* token lookup failures;  
* activation failures;  
* number generation collisions;  
* reissue failures;  
* unauthorized admin attempts;  
* issuer/type configuration errors.

Alerts:

* verification availability нижче threshold;  
* різке зростання Not Found;  
* repeated activation failure;  
* number generation collision;  
* unauthorized access spike.

---

# **28\. Performance Targets**

## **Public verification**

* p50 response time: до 500 ms;  
* p95 response time: до 2 seconds;  
* availability: не менше 99.5%;  
* valid token error rate: менше 1%.

## **Admin**

* creation Pending: до 2 seconds за нормальних умов;  
* activation: до 2 seconds;  
* QR generation: до 2 seconds;  
* search credential: до 1 second для стандартного обсягу Release 1\.

---

# **29\. Security Requirements**

* TLS only;  
* service role only server-side;  
* RLS on all application tables;  
* no direct public credential SELECT;  
* HMAC lookup;  
* application-layer token encryption;  
* separate encryption key and HMAC pepper;  
* MFA for Credential Manager and Super Admin;  
* immutable activated snapshot;  
* controlled status functions;  
* rate limiting;  
* CAPTCHA;  
* append-only audit;  
* private file bucket;  
* no PII in analytics;  
* no secrets in frontend;  
* CSRF protection for admin mutations;  
* secure session expiry;  
* confirmation for destructive actions.

---

# **30\. Test Cases**

## **30.1. Number generation**

1. Two simultaneous credentials receive different numbers.  
2. Sequence increments correctly.  
3. Cancelled number is not reused.  
4. Manual override requires Super Admin.  
5. Duplicate number is rejected.

## **30.2. Token**

1. Token has required entropy and format.  
2. Same token cannot be inserted twice.  
3. Invalid characters rejected.  
4. Raw token absent from logs.  
5. Hash lookup returns correct credential.  
6. Wrong token returns Not Found.  
7. QR can be regenerated from encrypted token.

## **30.3. Creation**

1. Same idempotency key returns same credential.  
2. Different payload with same key returns conflict.  
3. Inactive type rejected.  
4. Inactive issuer rejected.  
5. Cancelled group rejected.  
6. Programme/run data come from group.  
7. Duplicate disallowed type in group rejected.

## **30.4. Activation**

1. Complete Pending activates successfully.  
2. Incomplete snapshot rejected.  
3. Issue date mismatch rejected.  
4. Issuer mismatch rejected.  
5. Second activation is idempotent or rejected safely.  
6. Snapshot becomes immutable.  
7. Group becomes Issued.

## **30.5. Public verification**

1. Valid returns allowed data.  
2. Pending returns no personal data.  
3. Cancelled returns Not Found/inactive.  
4. Revoked returns revoked result.  
5. Reissued returns successor link.  
6. Expired returns expiry.  
7. API never returns UUID, token or internal note.  
8. Partners never appear in verification response.

## **30.6. Revoke**

1. Valid can be revoked with reason.  
2. Missing reason rejected.  
3. Pending cannot be revoked.  
4. Public page updates immediately.  
5. Internal reason not public.

## **30.7. Reissue**

1. Pending successor created in same group.  
2. Predecessor remains Valid before activation.  
3. Second active successor rejected.  
4. Cancelling successor leaves predecessor Valid.  
5. Activating successor makes predecessor Reissued.  
6. Links work both ways.  
7. Type change requires Super Admin.

## **30.8. RLS**

1. Public cannot read learners.  
2. Public cannot select credentials.  
3. Content Manager cannot access credentials.  
4. Credential Manager cannot edit programmes.  
5. Credential Manager cannot edit Credential Types.  
6. Super Admin cannot delete audit log.  
7. Snapshot update after activation rejected.

## **30.9. Rate limiting**

1. Normal QR checks succeed.  
2. Repeated failed manual searches trigger CAPTCHA.  
3. Limit returns 429\.  
4. No raw token stored in rate-limit logs.

---

# **31\. Acceptance Criteria**

Credential Module v1 вважається готовим, якщо:

* group model реалізована;  
* group має тільки Draft, Issued, Cancelled;  
* reissue завжди залишається в тій самій group;  
* Credential Type translations працюють;  
* numbering format затверджений;  
* number generation atomic;  
* idempotency реалізована правильно;  
* token має не менше 128 bits entropy;  
* lookup використовує HMAC-SHA-256;  
* token encryption виконується application layer;  
* encryption key відокремлений від HMAC pepper;  
* QR canonical URL стабільний;  
* snapshot immutable після activation;  
* Partners не входять у verification;  
* issuer повертається коректно;  
* статусні переходи контролюються functions;  
* Pending не повертає персональних даних;  
* Cancelled не є публічним;  
* Revoked має reason;  
* Reissued створює successor;  
* predecessor лишається Valid до successor activation;  
* manual verification працює за номером і token;  
* public API не повертає internal IDs;  
* rate limiting і CAPTCHA працюють;  
* ролі та RLS відповідають специфікації;  
* audit не містить token або PII;  
* automated tests покривають критичні сценарії.

---

# **32\. Зміни до Database Schema v1.1**

Перед SQL implementation у Database Schema потрібно внести:

1. У `credential_group_status` залишити:  
   * `draft`;  
   * `issued`;  
   * `cancelled`.  
2. Додати в `credential_groups`:  
   * `idempotency_key uuid unique not null`.  
3. Прибрати з `credentials`:  
   * `learner_id`;  
   * `programme_id`;  
   * `programme_run_id`;  
   * `completion_date`.  
4. Ці дані отримуються через Credential Group.  
5. Перевиданий credential завжди використовує ту саму Credential Group.  
6. Перейменувати:  
   * `verification_token_hash`  
     на  
   * `verification_token_lookup_hash`.  
7. Додати:  
   * `token_encryption_key_version`.  
8. Зафіксувати:  
   * HMAC-SHA-256 для lookup;  
   * application-layer encryption.  
9. `idempotency_key` завжди передається caller, а не генерується database function.  
10. Додати `credential_type_translations`.  
11. Прибрати `programme_run_experts` з обов’язкового Release 1 migration; залишити як optional migration.  
12. Уточнити RLS для credentials:  
* INSERT Pending через function;  
* limited internal UPDATE;  
* status changes через functions;  
* no DELETE.  
12. Уточнити RLS для snapshot:  
* create/replace while Pending;  
* read by Credential Manager;  
* no UPDATE/DELETE after activation.

