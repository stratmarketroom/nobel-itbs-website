# Programmes Catalogue: UA Master Copy

Product: Nobel ITBS Website and Credential Registry  
Page: Programmes Catalogue  
Locale: Ukrainian  
URL: `/ua/programmes`  
Status: product-owner approved UA master copy  
Updated: 2026-07-31

## 1. Editorial Role

Каталог допомагає порівняти всі опубліковані програми Nobel ITBS і перейти до
детальної сторінки потрібної програми. У Release 1 каталог не використовує
видимі фільтри й не показує ціни.

Primary action: open a programme detail page.

## 2. SEO

`seo_title`: Професійні програми | Nobel ITBS

`seo_description`: Обирайте професійні програми Nobel ITBS у бізнесі,
технологіях та психології: дистанційні курси, сертифікатні програми й Mini-MBA.

`og_title`: Професійні програми Nobel ITBS

`og_description`: Знайдіть програму для розвитку компетентностей, нового
професійного напряму або систематизації досвіду.

## 3. Page Introduction

`eyebrow`: Programmes

`h1`: Професійні програми

`lead`: Обирайте навчання відповідно до професійної мети, потрібних
компетентностей і формату.

`intro`: Nobel ITBS представляє власні та партнерські програми у бізнесі,
технологіях, інноваціях і психології. Порівняйте тематику, тривалість, мову
навчання та документ, передбачений конкретною програмою.

## 4. Programme Card Content Model

Кожна картка використовує такі поля:

- enrolment status badge;
- Programme Area;
- Programme Type;
- programme name;
- short value description;
- duration and learning volume;
- format;
- instruction language;
- document summary;
- `Переглянути програму` CTA.

Programme Area and Programme Type are links to their respective SEO landing
pages. The card itself leads to the programme detail page.

## 5. Enrolment Status Labels

Proposed public labels:

- `Постійний набір` — continuously available programme;
- `Набір відкрито` — enrolment is open for a specific cohort;
- `Незабаром` — programme is published before enrolment opens;
- `Набір завершено` — programme remains visible but does not currently accept
  applications.

Status rules:

- status is not inferred from the page locale;
- `Незабаром` is not used because a programme is taught in another language;
- time-sensitive status and start-date text must come from the current programme
  run or an admin-approved override;
- status is never communicated by colour alone.

## 6. Programme Cards

### AI Production

`status_badge`: Набір відкрито

`area`: Business & Management

`type`: Mini-MBA

`description`: Створюйте, запускайте й масштабуйте експертні та освітні продукти
за допомогою продуктової стратегії, маркетингу, продажів, управління й AI.

`facts`: 6 місяців · 360 годин / 12 ECTS · дистанційне навчання · українська

`document`: Університетський сертифікат після 3 місяців і міжнародний диплом
Mini-MBA з Diploma Supplement після завершення програми.

`cta`: Переглянути програму

### General Psychology

`status_badge`: Постійний набір

`area`: Psychology & Human

`type`: Програма професійного підвищення кваліфікації

`description`: Сформуйте системну основу знань про психіку, особистість,
мотивацію, емоції та пізнавальні процеси.

`facts`: 90 годин / 3 ECTS · дистанційно в Moodle · доступ на 1 рік · українська

`document`: Сертифікат про підвищення кваліфікації від Університету імені
Альфреда Нобеля.

`cta`: Переглянути програму

### Child Psychology

`status_badge`: Постійний набір

`area`: Psychology & Human

`type`: Програма професійного підвищення кваліфікації

`description`: Поглибте розуміння психологічного розвитку дитини, вікових
особливостей і відповідального психологічного супроводу.

`facts`: 90 годин / 3 ECTS · дистанційно в Moodle · доступ на 6 місяців ·
українська

`document`: Сертифікат про підвищення кваліфікації від Університету імені
Альфреда Нобеля.

`cta`: Переглянути програму

### Neuroplastic Reconstruction

`status_badge`: Набір відкрито

`status_detail`: Старт поточного набору — 5 жовтня

`area`: Psychology & Human

`type`: Програма професійного підвищення кваліфікації

`description`: Досліджуйте нейропластичність, саморегуляцію та поведінкові
патерни у структурованій 12-модульній програмі.

`facts`: 3 місяці · 180 годин / 6 ECTS · змішане дистанційне навчання ·
українська

`document`: Документи та професійний статус залежать від обраного тарифу.

`cta`: Переглянути програму

### Space Business

`status_badge`: Постійний набір

`area`: Technology & Innovation

`type`: Сертифікатна програма

`description`: Зрозумійте космічний ринок, технології, стартапи, економіку,
право та моделі міжнародної співпраці.

`facts`: 90 годин · дистанційно в Moodle · українська та англійська

`document`: Сертифікат.

`cta`: Переглянути програму

## 7. Empty State

`heading`: Програми готуються до публікації

`body`: Зараз у каталозі немає доступних програм. Залиште запитання, щоб
дізнатися про наступні можливості навчання.

`cta`: Поставити запитання

## 8. Catalogue Rules

- no visible filters in Release 1;
- no prices or previous prices on catalogue cards;
- no `Coming soon` status based only on presentation or instruction language;
- programme facts come from the approved programme record and localized master
  copy, not from independent catalogue-only text;
- hidden or unpublished programmes do not appear in the public catalogue;
- all cards use equivalent factual content in EN, UA, and CZ;
- cards must not imply that EN or CZ page localization means instruction in that
  language.

## 9. Publication Dependencies

- keep programme-run statuses and Neuroplastic Reconstruction start date current;
- approve EN and CZ localization;
- prepare programme-specific card and Open Graph visuals with approved alt text.
