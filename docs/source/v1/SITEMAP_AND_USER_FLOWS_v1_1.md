# **SITEMAP \+ USER FLOWS v1.1**

## **Новий сайт і система перевірки документів Nobel ITBS**

**Версія:** 1.1  
**Статус:** робочий документ для затвердження  
**Продукт:** nobel-itbs.eu  
**Власник продукту:** Nobel ITBS s.r.o.  
**Product Owner:** Ольга Дашевська

---

# **1\. Мета документа**

Цей документ визначає:

* структуру публічного сайту;  
* структуру адміністративної панелі;  
* URL-архітектуру;  
* головну й допоміжну навігацію;  
* основні користувацькі маршрути;  
* системні стани;  
* правила переходу в Leeloo;  
* маршрути перевірки документів;  
* правила редагування та перевидачі credentials;  
* mobile-навігацію;  
* матрицю доступів;  
* аналітичні події;  
* перелік wireframes;  
* межі UX-проєктування Release 1\.

Документ є основою для:

* wireframes;  
* UI-дизайну;  
* Database Schema v1;  
* Credential Module Specification;  
* Leeloo Integration Specification;  
* backlog для Codex.  
  ---

  # **2\. Принципи інформаційної архітектури**

  ## **2.1. Основний пріоритет**

Головний користувацький сценарій:

> Користувач знаходить програму, переходить на її сторінку та натискає CTA для переходу у відповідну воронку Leeloo.

## **2.2. Другий пріоритет**

Другий ключовий сценарій:

> Користувач перевіряє диплом або сертифікат через QR-код, document number або verification code.

## **2.3. Навігаційні принципи**

* каталог програм доступний за один клік;  
* Verify Credential доступний за один клік;  
* напрями не дублюються окремими пунктами головного меню;  
* напрями розміщуються всередині Programmes;  
* кожна сторінка має один основний CTA;  
* службові й юридичні сторінки розміщуються у footer;  
* адміністративна частина відокремлена від публічного сайту;  
* URL не залежать від внутрішніх numeric ID;  
* мовні версії мають однакову структуру;  
* QR URL є стабільним і не залежить від мови;  
* публічні сторінки не розкривають приватні поля.  
  ---

  # **3\. Загальна карта продукту**

Продукт складається з двох зон.

## **3.1. Публічна зона**

Доступна без авторизації:

* корпоративні сторінки;  
* каталог програм;  
* SEO landing pages напрямів і типів програм;  
* сторінки програм;  
* інформація про документи;  
* перевірка документів;  
* партнери;  
* корпоративні пропозиції;  
* контактні та юридичні сторінки.

  ## **3.2. Адміністративна зона**

Доступна після авторизації:

* programmes;  
* programme runs;  
* learners;  
* credentials;  
* credential types;  
* partners;  
* experts;  
* FAQ;  
* users and roles;  
* audit log.  
  ---

  # **4\. URL-архітектура**

  ## **4.1. Мовна структура**

Фіксується така модель:

* English — без мовного префікса;  
* Ukrainian — `/uk`.

Приклади:

* `nobel-itbs.eu/programmes`  
* `nobel-itbs.eu/uk/programmes`

Модель `/en` і `/uk` не використовується.

## **4.2. Загальні правила URL**

* тільки lowercase;  
* слова розділяються дефісами;  
* без дат у URL;  
* без назв технологій;  
* без numeric ID у публічних URL;  
* slug програми не змінюється після публікації без redirect;  
* admin URL використовує UUID;  
* verification URL використовує непередбачуваний token;  
* старі URL перенаправляються через 301 redirect.

  ## **4.3. QR URL**

QR-код завжди веде на стабільний language-neutral URL:

`/verify/[verification-token]`

Приклад:

`https://nobel-itbs.eu/verify/7kp9mq2xv4`

Після відкриття система:

* показує English за замовчуванням;  
* може визначити мову браузера;  
* дозволяє перейти на `/uk/verify/[verification-token]`;  
* не змінює сам token.

QR-код не генерується з мовним префіксом.

---

# **5\. Публічний sitemap**

## **5.1. Home**

**EN:** `/`  
**UA:** `/uk`

Основна мета:

* пояснити, хто така Nobel ITBS;  
* показати ключові напрями й програми;  
* сформувати довіру;  
* привести користувача до каталогу або конкретної програми.

Primary CTA:

**Explore Programmes / Переглянути програми**

Secondary utility action:

**Verify Credential / Перевірити документ**

Verify Credential не вважається основною маркетинговою конверсією Home.

---

## **5.2. Programmes Catalogue**

**EN:** `/programmes`  
**UA:** `/uk/programmes`

Основна мета:

* показати всі опубліковані програми;  
* дозволити фільтрацію;  
* перевести користувача на сторінку програми.

Основний CTA:

**View Programme / Переглянути програму**

Фільтри Must have:

* field;  
* programme type;  
* enrolment status.

Фільтри Should have:

* instruction language;  
* format.

  ## **5.3. SEO landing pages програм**

Фіксується єдина модель:

* `/programmes/human-behavioral-sciences`  
* `/programmes/business-management`  
* `/programmes/technology-innovation`  
* `/programmes/mini-mba-executive`  
* `/programmes/cpd`

Українські версії:

* `/uk/programmes/human-behavioral-sciences`  
* `/uk/programmes/business-management`  
* `/uk/programmes/technology-innovation`  
* `/uk/programmes/mini-mba-executive`  
* `/uk/programmes/cpd`

Це окремі SEO landing pages, які:

* використовують той самий компонент каталогу;  
* мають preset filter;  
* мають власні title, description, H1 і intro content;  
* можуть індексуватися окремо.

Query parameters використовуються тільки для додаткової фільтрації:

* `?status=open`  
* `?language=uk`  
* `?format=online`  
  ---

  ## **5.4. Programme Page**

**EN:** `/programmes/[programme-slug]`  
**UA:** `/uk/programmes/[programme-slug]`

Приклад:

* `/programmes/space-business`  
* `/uk/programmes/space-business`

Основна мета:

* пояснити цінність програми;  
* показати зміст, формат і документи;  
* перевести користувача у Leeloo.

Основний CTA:

**Apply Now / Подати заявку**

Логіка CTA:

1. активний Programme Run `leeloo_url`;  
2. Programme `default_leeloo_url`;  
3. fallback contact CTA.

Основні секції:

1. Hero.  
2. Короткі характеристики.  
3. Для кого програма.  
4. Результати навчання.  
5. Структура програми.  
6. Формат і тривалість.  
7. Автори та викладачі.  
8. Документи після завершення.  
9. Партнери.  
10. Поточний запуск.  
11. CTA.  
12. FAQ програми.

Умовні секції:

* Authors and Instructors;  
* Partners;  
* Current Run;  
* Programme Structure;  
* Programme FAQ.

Вони показуються лише за наявності даних.

---

## **5.5. Credentials**

**EN:** `/credentials`  
**UA:** `/uk/credentials`

Основна мета:

* пояснити систему документів;  
* показати типи credentials;  
* пояснити QR verification;  
* сформувати довіру.

Основний CTA:

**Verify Credential / Перевірити документ**

Секції:

1. Що таке Nobel ITBS credentials.  
2. Типи документів.  
3. Що містить документ.  
4. Роль issuer і partner.  
5. Learning hours та ECTS.  
6. Як працює QR-код.  
7. Як перевірити документ.  
8. FAQ.  
   ---

   ## **5.6. Verify Credential**

   ### **Search page**

**EN:** `/verify`  
**UA:** `/uk/verify`

Елементи:

* одне поле `Document number or verification code`;  
* кнопка Verify;  
* коротке пояснення;  
* посилання на Credentials.

Основний CTA:

**Verify / Перевірити**

### **Result page**

**EN:** `/verify/[verification-token]`  
**UA:** `/uk/verify/[verification-token]`

Публічні стани:

* Valid;  
* Revoked;  
* Reissued;  
* Expired;  
* Pending;  
* Not Found;  
* Invalid Code;  
* Temporary Error;  
* Rate Limited;  
* Maintenance.  
  ---

  ## **5.7. For Organisations**

**EN:** `/for-organisations`  
**UA:** `/uk/for-organisations`

Основна мета:

* показати корпоративні програми;  
* запропонувати розробку навчальних рішень;  
* залучити B2B-запит.

Основний CTA:

**Discuss a Programme / Обговорити програму**

Секції:

1. Корпоративне навчання.  
2. Custom programmes.  
3. Executive education.  
4. Формати співпраці.  
5. Процес розробки програми.  
6. Корпоративні рішення.  
7. Форма звернення.

Розмежування:

* For Organisations — B2B services і lead generation;  
* Partners — перелік партнерів, ролі та формування довіри.  
  ---

  ## **5.8. About**

**EN:** `/about`  
**UA:** `/uk/about`

Основна мета:

* пояснити, хто така Nobel ITBS;  
* показати модель роботи;  
* сформувати довіру.

Основний CTA:

**Explore Programmes / Переглянути програми**

Секції:

1. Хто ми.  
2. Що ми робимо.  
3. Освітня модель.  
4. Напрями.  
5. Контроль якості.  
6. Команда та експертиза.  
7. Партнерства.  
8. Зв’язок з Alfred Nobel University.  
9. Реквізити.  
   ---

   ## **5.9. How It Works**

**EN:** `/how-it-works`  
**UA:** `/uk/how-it-works`

Основна мета:

* пояснити шлях слухача;  
* зняти заперечення щодо формату навчання.

Основний CTA:

**Choose a Programme / Обрати програму**

Секції:

1. Choose.  
2. Apply through Leeloo.  
3. Enrol.  
4. Learn.  
5. Complete assessment.  
6. Receive credential.  
7. Verify credential.  
   ---

   ## **5.10. Partners**

**EN:** `/partners`  
**UA:** `/uk/partners`

Тип сторінки:

**Trust-page**

Основна мета:

* показати підтверджених партнерів;  
* пояснити їхню роль;  
* сформувати довіру до Nobel ITBS.

Основний CTA:

**Discuss Partnership / Обговорити співпрацю**

Для кожного партнера показуються:

* назва;  
* країна;  
* тип організації;  
* логотип;  
* короткий опис;  
* роль;  
* пов’язані програми;  
* документи або функції партнера;  
* зовнішнє посилання — за потреби.

Не показуються:

* непідтверджені партнери;  
* потенційні переговори;  
* внутрішні договори;  
* приватні умови співпраці.  
  ---

  ## **5.11. Contact**

**EN:** `/contact`  
**UA:** `/uk/contact`

Основна мета:

* дати прямий канал звернення.

Основний CTA:

**Send Message / Надіслати повідомлення**

Секції:

* контактна форма;  
* email;  
* юридичні реквізити;  
* адреса;  
* соціальні мережі;  
* типи звернень.  
  ---

  ## **5.12. FAQ**

**EN:** `/faq`  
**UA:** `/uk/faq`

Категорії:

* Programmes;  
* Learning Format;  
* Payments and Enrolment;  
* Credentials;  
* ECTS and CPD;  
* Verification;  
* Partnerships.

Основний CTA:

**Contact Us / Зв’язатися з нами**

---

# **6\. Юридичні сторінки**

EN:

* `/privacy-policy`  
* `/terms-and-conditions`  
* `/refund-policy`  
* `/cookie-policy`

UA:

* `/uk/privacy-policy`  
* `/uk/terms-and-conditions`  
* `/uk/refund-policy`  
* `/uk/cookie-policy`

Сторінки зберігаються в коді.

---

# **7\. Системні сторінки**

## **7.1. 404**

Містить:

* Page not found;  
* CTA до Home;  
* CTA до Programmes;  
* utility CTA Verify Credential.

  ## **7.2. 500 / Temporary Error**

Містить:

* нейтральне повідомлення;  
* Retry;  
* перехід на Home;  
* contact channel;  
* timestamp або incident reference — за потреби.

  ## **7.3. Verification Maintenance**

Обов’язковий fallback стан для verification module.

Містить:

* повідомлення про тимчасову недоступність;  
* Retry;  
* contact;  
* timestamp.

  ## **7.4. Rate Limit**

Повідомлення:

> Too many verification attempts. Please try again later.

Технічний threshold користувачу не показується.

---

# **8\. Головна навігація**

## **8.1. Desktop header**

Ліворуч:

* логотип.

Основна навігація:

* Programmes;  
* Credentials;  
* For Organisations;  
* About.

Акцентна кнопка:

* Verify Credential.

Додатково:

* Language switcher.

  ## **8.2. Dropdown Programmes**

  ### **Explore**

* All Programmes;  
* Featured Programmes.

  ### **By Field**

* Human & Behavioral Sciences;  
* Business & Management;  
* Technology & Innovation.

  ### **By Type**

* MINI-MBA & Executive Programmes;  
* CPD Courses.

Максимум 7–8 основних посилань.

---

# **9\. Mobile-навігація**

## **9.1. Mobile header**

* логотип;  
* language switcher;  
* hamburger menu.

  ## **9.2. Mobile menu**

Primary section:

1. Programmes.  
2. Credentials.  
3. For Organisations.  
4. About.

Окрема акцентна кнопка:

**Verify Credential**

Secondary section:

* How It Works;  
* Partners;  
* Contact;  
* FAQ.

  ## **9.3. Programmes submenu**

Accordion:

* All Programmes;  
* Human & Behavioral Sciences;  
* Business & Management;  
* Technology & Innovation;  
* MINI-MBA & Executive;  
* CPD Courses.

  ## **9.4. Mobile CTA behaviour**

На Programme Page використовується sticky CTA:

**Apply Now**

Sticky CTA з’являється після прокручування першого екрана.

---

# **10\. Footer architecture**

## **Programmes**

* All Programmes;  
* Human & Behavioral Sciences;  
* Business & Management;  
* Technology & Innovation;  
* MINI-MBA & Executive;  
* CPD Courses.

  ## **Nobel ITBS**

* About;  
* How It Works;  
* Partners;  
* For Organisations;  
* Contact.

  ## **Credentials**

* Credentials;  
* Verify Credential;  
* FAQ.

  ## **Legal**

* Privacy Policy;  
* Terms and Conditions;  
* Refund Policy;  
* Cookie Policy.

Нижня зона:

* Nobel ITBS s.r.o.;  
* IČO;  
* адреса;  
* email;  
* copyright;  
* соціальні мережі.  
  ---

  # **11\. Адміністративний sitemap**

Основний URL:

`/admin`

Адмінпанель не індексується.

Admin entity URLs використовують UUID.

## **11.1. Login**

`/admin/login`

Release 1 auth method:

* email/password;  
* password reset;  
* session expiration;  
* MFA для Super Admin і Credential Manager.

Magic link не входить у Release 1\.

## **11.2. Dashboard**

`/admin`

Мінімальний dashboard:

* total programmes;  
* active programme runs;  
* total credentials;  
* valid credentials;  
* revoked credentials;  
* latest credentials;  
* latest critical actions.

  ## **11.3. Programmes**

`/admin/programmes`

* `/admin/programmes/new`  
* `/admin/programmes/[uuid]`  
* `/admin/programmes/[uuid]/edit`

Функції:

* list;  
* search;  
* filter;  
* create;  
* edit;  
* publish;  
* archive;  
* duplicate — optional.

  ## **11.4. Programme Runs**

`/admin/programme-runs`

* `/admin/programme-runs/new`  
* `/admin/programme-runs/[uuid]`  
* `/admin/programme-runs/[uuid]/edit`

  ## **11.5. Learners**

`/admin/learners`

* `/admin/learners/new`  
* `/admin/learners/[uuid]`  
* `/admin/learners/[uuid]/edit`

Learner detail:

* основні дані;  
* список credentials;  
* історія критичних дій.

  ## **11.6. Credentials**

`/admin/credentials`

* `/admin/credentials/new`  
* `/admin/credentials/[uuid]`  
* `/admin/credentials/[uuid]/edit`  
* `/admin/credentials/[uuid]/reissue`

Credential detail:

* основні дані;  
* snapshot;  
* status;  
* QR preview;  
* public verification URL;  
* status history;  
* linked replacement;  
* audit history.

  ## **11.7. Credential Types**

`/admin/credential-types`

Доступ:

* Super Admin — create/edit;  
* Credential Manager — read only.

Routes:

* `/admin/credential-types/new`  
* `/admin/credential-types/[uuid]`  
* `/admin/credential-types/[uuid]/edit`

  ## **11.8. Partners**

`/admin/partners`

* `/admin/partners/new`  
* `/admin/partners/[uuid]`  
* `/admin/partners/[uuid]/edit`

  ## **11.9. Experts**

`/admin/experts`

* `/admin/experts/new`  
* `/admin/experts/[uuid]`  
* `/admin/experts/[uuid]/edit`

  ## **11.10. FAQ**

`/admin/faq`

Функції:

* create;  
* edit;  
* reorder;  
* category;  
* publish/unpublish.

  ## **11.11. Users and Roles**

`/admin/users`

Доступ:

* тільки Super Admin.

Routes:

* `/admin/users/new`  
* `/admin/users/[uuid]`  
* `/admin/users/[uuid]/edit`

  ## **11.12. Audit Log**

`/admin/audit-log`

Доступ:

* Super Admin;  
* read only.

Фільтри:

* user;  
* action;  
* entity;  
* date;  
* credential.  
  ---

  # **12\. Route Access Matrix**

| Route | Public | Content Manager | Credential Manager | Super Admin |
| ----- | ----- | ----- | ----- | ----- |
| `/admin` | ні | так | так | так |
| `/admin/programmes` | ні | так | ні | так |
| `/admin/programme-runs` | ні | так | ні | так |
| `/admin/learners` | ні | ні | так | так |
| `/admin/credentials` | ні | ні | так | так |
| `/admin/credential-types` | ні | ні | read only | так |
| `/admin/credential-types/new` | ні | ні | ні | так |
| `/admin/partners` | ні | так | ні | так |
| `/admin/experts` | ні | так | ні | так |
| `/admin/faq` | ні | так | ні | так |
| `/admin/users` | ні | ні | ні | так |
| `/admin/audit-log` | ні | ні | ні | так |

Unauthorized access:

* unauthenticated → redirect `/admin/login`;  
* authenticated without permission → `403 Permission Denied`.  
  ---

  # **13\. User Flow 1 — вибір програми**

  ## **Entry points**

* Home;  
* search engine;  
* social media;  
* advertisement;  
* direct Programme URL;  
* Programmes dropdown;  
* SEO landing page.

  ## **Flow**

1. Користувач відкриває Home, Programmes або SEO landing page.  
2. Переглядає featured programmes або застосовує фільтри.  
3. Відкриває Programme Page.  
4. Переглядає:  
   * audience;  
   * outcomes;  
   * format;  
   * credentials;  
   * experts;  
   * current run.  
5. Натискає CTA.  
6. Система визначає URL:  
   * Programme Run URL;  
   * Programme fallback URL;  
   * contact fallback.  
7. Фіксує analytics event.  
8. Додає UTM.  
9. Перенаправляє в Leeloo.

Success:

* відкрито правильну Leeloo funnel.

Failure:

* missing URL;  
* invalid URL;  
* external service unavailable.

Fallback:

* contact form;  
* email;  
* alternative CTA.  
  ---

  # **14\. User Flow 2 — QR verification**

1. Користувач сканує QR.  
2. Відкривається `/verify/[token]`.  
3. Система перевіряє token format.  
4. Шукає credential.  
5. Перевіряє status.  
6. Показує відповідний результат.

   ## **Status outcomes**

   ### **Valid**

Показуються дозволені public fields.

### **Revoked**

Показуються:

* status;  
* document number;  
* базові public fields;  
* status date — за потреби.

  ### **Reissued**

Показуються:

* Reissued;  
* повідомлення про заміну;  
* link to successor — якщо дозволено.

  ### **Expired**

Показуються:

* Expired;  
* public fields;  
* expiry date — якщо застосовується.

  ### **Pending**

Показується лише:

> This credential is not yet active.

### **Not Found**

> Credential not found.

### **Rate Limited**

> Too many verification attempts. Please try again later.

### **Temporary Error**

> Credential verification is temporarily unavailable.

---

# **15\. User Flow 3 — manual verification**

1. Користувач відкриває `/verify`.  
2. Вводить document number або verification code.  
3. Frontend виконує базову валідацію.  
4. Backend визначає формат.  
5. Якщо введено verification code:  
   * шукає credential за token.  
6. Якщо введено document number:  
   * шукає credential за номером;  
   * визначає verification token;  
   * робить server-side redirect на `/verify/[token]`.  
7. Token не повертається у відкритій API-відповіді до redirect.  
8. Показується result page.

Validation states:

* empty;  
* invalid format;  
* not found;  
* rate limited;  
* temporary error.  
  ---

  # **16\. User Flow 4 — створення credential**

1. Авторизація.  
2. Credentials.  
3. New Credential.  
4. Пошук або створення Learner.  
5. Вибір Programme.  
6. Programme Run — optional.  
7. Credential Type.  
8. Система підтягує рекомендовані поля.  
9. Адміністратор перевіряє snapshot.  
10. Вказує issue date і completion date.  
11. Save as Pending.  
12. Система генерує:  
    * UUID;  
    * document number;  
    * token;  
    * public URL;  
    * QR.  
13. Preview.  
14. Activate as Valid.  
15. Credential стає публічним.

Critical rule:

* snapshot не змінюється автоматично після активації.  
  ---

  # **17\. User Flow 5 — редагування credential**

  ## **Pending**

До активації можна редагувати всі поля.

## **Valid**

Після активації можна редагувати:

* internal note;  
* private PDF;  
* technical metadata.

Не можна редагувати напряму:

* printed name;  
* programme title;  
* document number;  
* issue date;  
* completion date;  
* hours;  
* ECTS;  
* issuer;  
* partner;  
* credential type.

Для зміни public snapshot fields використовується Reissue.

## **Revoked / Reissued / Expired**

Public snapshot fields не редагуються.

---

# **18\. User Flow 6 — revoke credential**

1. Відкрити credential.  
2. Change Status.  
3. Revoked.  
4. Вказати reason.  
5. Confirmation modal.  
6. Confirm.  
7. Система:  
   * змінює status;  
   * записує history;  
   * створює audit log;  
   * оновлює public page.

   ---

   # **19\. User Flow 7 — reissue credential**

1. Відкрити старий Valid credential.  
2. Reissue.  
3. Створюється новий Pending draft на основі snapshot.  
4. Старий credential залишається Valid.  
5. Адміністратор редагує новий draft.  
6. Генеруються нові:  
   * document number;  
   * token;  
   * QR.  
7. Новий credential активується як Valid.  
8. Тільки після цього старий автоматично стає Reissued.  
9. Створюється successor link.  
10. Записується audit log.

Правила:

* якщо Pending draft видалено або скасовано, старий лишається Valid;  
* один credential може мати лише одного активного successor;  
* successor повинен належати тому самому learner;  
* новий credential може мати інший Credential Type лише за рішенням Super Admin.  
  ---

  # **20\. User Flow 8 — створення програми**

1. Авторизація.  
2. Programmes.  
3. New Programme.  
4. Обов’язкові поля.  
5. UA та EN content.  
6. Optional blocks.  
7. Experts.  
8. Partners.  
9. Default Leeloo URL.  
10. Preview.  
11. Publish.

Publication states:

* Draft;  
* Published;  
* Archived.

Programme publication status і enrolment status — різні поля.

---

# **21\. User Flow 9 — archive programme**

1. Content Manager відкриває Programme.  
2. Обирає Archive.  
3. Confirmation.  
4. Система перевіряє linked credentials.  
5. Programme отримує Archived.

Public behaviour:

* programme не показується в основному каталозі;  
* programme URL не повертає 404;  
* сторінка залишається доступною;  
* показується Archived / Programme completed;  
* CTA Leeloo приховується;  
* може показуватися fallback CTA;  
* credentials продовжують працювати.

Deletion rule:

* Programme не можна фізично видалити, якщо є linked credentials;  
* використовується archive, а не delete.  
  ---

  # **22\. User Flow 10 — створення Programme Run**

1. Відкрити Programme.  
2. Create Programme Run.  
3. Вказати:  
   * dates;  
   * deadline;  
   * status;  
   * price;  
   * instructor;  
   * Leeloo URL.  
4. Save.  
5. Programme Page показує актуальний run.  
6. CTA використовує Programme Run URL.  
   ---

   # **23\. User Flow 11 — no active Programme Run**

Якщо active run відсутній:

1. Система шукає наступний Upcoming run.  
2. Якщо є Upcoming:  
   * показує дату старту;  
   * CTA може вести у Programme default Leeloo URL.  
3. Якщо run немає:  
   * показує `No active enrolment`;  
   * Leeloo CTA приховується;  
   * показується fallback CTA:  
     **Get notified / Contact us**.

Closed run:

* не використовується для primary CTA;  
* залишається в admin history.  
  ---

  # **24\. User Flow 12 — partner enquiry**

1. Entry:  
   * Partners;  
   * For Organisations;  
   * About.  
2. Discuss Partnership.  
3. Форма:  
   * name;  
   * organisation;  
   * email;  
   * country;  
   * cooperation interest;  
   * message.  
4. Consent.  
5. Submit.  
6. Success або Error.  
7. Nobel ITBS отримує повідомлення.  
   ---

   # **25\. User Flow 13 — language switching**

* зберігається поточна сторінка;  
* зберігається token;  
* зберігаються query parameters;  
* Programme slug однаковий;  
* якщо translation відсутній:  
  * показується fallback language;  
  * не робиться автоматичний redirect на Home без повідомлення.

  ---

  # **26\. Page-State Matrix**

  ## **Programme Page**

| State | Public behaviour |
| ----- | ----- |
| Draft | 404 або unavailable для public |
| Published \+ Active Run | CTA веде на Run Leeloo URL |
| Published \+ Upcoming Run | показати дату, CTA через fallback URL |
| Published \+ No Run | показати no active enrolment \+ fallback CTA |
| Closed | CTA приховано або fallback |
| Archived | сторінка доступна, Archived label, без primary CTA |

  ## **Verification**

| State | Public data |
| ----- | ----- |
| Valid | усі дозволені public fields |
| Revoked | status \+ базові public fields |
| Reissued | status \+ successor message/link |
| Expired | status \+ public fields |
| Pending | без персональних даних |
| Not Found | generic message |
| Invalid Code | generic validation message |
| Rate Limited | retry later |
| Temporary Error | unavailable message |
| Maintenance | maintenance message |

  ---

  # **27\. Analytics Events Map**

| Event | Trigger | Key properties |
| ----- | ----- | ----- |
| `programme_view` | відкриття Programme Page | programme\_id, slug, language |
| `programme_filter_used` | застосування фільтра | field, type, status |
| `leeloo_cta_click` | натискання CTA | programme\_id, run\_id, source, utm |
| `verify_search_submitted` | submit manual verification | input\_type |
| `verify_success` | знайдений credential | status, credential\_type |
| `verify_not_found` | не знайдено | input\_type |
| `verify_rate_limited` | rate limit | route |
| `partner_form_submitted` | успішна форма | country, interest |
| `partner_form_error` | помилка форми | error\_type |
| `language_switched` | перемикання мови | from, to, route |
| `programme_archived_view` | перегляд archived programme | programme\_id |
| `fallback_cta_click` | fallback CTA | page, reason |

Не передавати в analytics:

* full name;  
* email;  
* document number;  
* verification token;  
* private credential data.  
  ---

  # **28\. Перелік wireframes**

  ## **Public**

1. Home.  
2. Programmes Catalogue.  
3. SEO Programme Landing.  
4. Programme Page — Active Run.  
5. Programme Page — No Active Run.  
6. Programme Page — Archived.  
7. Credentials.  
8. Verify Search.  
9. Verify Valid.  
10. Verify Revoked.  
11. Verify Reissued.  
12. Verify Expired.  
13. Verify Pending.  
14. Verify Not Found.  
15. Verify Invalid Code.  
16. Verify Rate Limited.  
17. Verify Temporary Error.  
18. Verification Maintenance.  
19. About.  
20. How It Works.  
21. For Organisations.  
22. Partners.  
23. Contact.  
24. Partner Enquiry Success.  
25. Partner Enquiry Error.  
26. FAQ.  
27. Legal Page.  
    404.   
28. 500 / Temporary Error.  
29. Leeloo Fallback.

    ## **Admin**

1. Login.  
2. Reset Password.  
3. MFA.  
4. Dashboard.  
5. Programmes List.  
6. Programme Create/Edit.  
7. Programme Archive Confirmation.  
8. Programme Run Create/Edit.  
9. Learners List.  
10. Learner Detail.  
11. Credential List.  
12. Credential Create.  
13. Credential Detail — Pending.  
14. Credential Detail — Valid.  
15. Credential Reissue.  
16. Revoke Confirmation.  
17. Credential Type List.  
18. Credential Type Edit.  
19. Partners List/Edit.  
20. Experts List/Edit.  
21. FAQ.  
22. Users.  
23. Audit Log.  
24. Permission Denied 403\.  
25. Session Expired.  
    ---

    # **29\. Acceptance Criteria**

Документ вважається затвердженим, якщо:

* зафіксовано всі public pages;  
* зафіксовано всі admin modules;  
* кожна сторінка має основну мету;  
* кожна сторінка має primary CTA;  
* URL structure не містить відкритих альтернатив;  
* programme landing pages мають єдину модель;  
* QR URL є language-neutral;  
* Programmes і fields не дублюються;  
* Verify Credential оформлено як окрема button;  
* Leeloo flow має fallback;  
* QR і manual verification описані окремо;  
* document number redirect описаний;  
* усі credential statuses мають UX state;  
* Pending не показує personal data;  
* Valid credential edit rules зафіксовані;  
* Reissue lifecycle зафіксований;  
* archive programme flow зафіксований;  
* no active run flow зафіксований;  
* mobile navigation визначена;  
* auth method визначений;  
* route access matrix визначена;  
* page-state matrix визначена;  
* analytics events визначені;  
* wireframes перелічені повністю.


