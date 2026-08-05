# Verify Document: UA Master Copy

Product: Nobel ITBS Website and Credential Registry  
Page: Verify Document  
Locale: Ukrainian  
URL: `/ua/verify`  
Status: product-owner approved UA master copy  
Updated: 2026-07-31

## 1. Editorial Role

Сторінка дозволяє перевірити документ Nobel ITBS за номером. QR-код веде до
окремої сторінки результату через захищений токен. Пошук за ім’ям, email або
телефоном не підтримується.

## 2. SEO

`seo_title`: Перевірити документ | Nobel ITBS

`seo_description`: Перевірте дійсність документа Nobel ITBS за номером або
відкрийте сторінку перевірки через QR-код на документі.

`og_title`: Перевірка документа Nobel ITBS

`og_description`: Перевірте статус документа за його номером або QR-кодом.

## 3. Hero And Instructions

`eyebrow`: Document Verification

`h1`: Перевірка документа

`lead`: Введіть номер документа, щоб перевірити його статус у реєстрі Nobel
ITBS.

`instruction`: Використовуйте номер у тому форматі, у якому він зазначений на
документі. Якщо на документі є QR-код, відскануйте його камерою телефона, щоб
відкрити сторінку перевірки без ручного введення.

## 4. Manual Verification Form

`field_label`: Номер документа

`field_placeholder`: Наприклад, NITBS-C-2026-000123

`field_helper`: Перевірка доступна лише за повним номером документа.

`submit_button`: Перевірити

`submitting_button`: Перевіряємо…

`required_error`: Введіть номер документа.

`format_error`: Перевірте номер документа та спробуйте ще раз.

## 5. Valid Result

`status_label`: Дійсний

`heading`: Документ підтверджено

`body`: Документ знайдено в реєстрі Nobel ITBS і він має дійсний статус.

Visible fields:

- `Номер документа`;
- `Власник документа`;
- `Програма`;
- `Тип документа`;
- `Дата видачі`.

`verification_note`: Сторінка підтверджує статус документа на момент перевірки.

Do not show:

- PDF or download link;
- partner information;
- email or phone;
- internal IDs, notes, history, or storage paths.

## 6. Revoked Result

`status_label`: Відкликаний

`heading`: Документ відкликано

`body`: Цей документ має статус «Відкликаний». Деталі документа не
відображаються.

No document details are shown for this state.

## 7. Not Found Result

`heading`: Документ не знайдено

`body`: За цим кодом/номером документ не знайдено.

`helper`: Перевірте правильність номера. Якщо номер введено правильно,
зверніться до організації, яка надала документ.

Pending, voided, invalid-token, and non-existing records use this same public
state and reveal no additional information.

## 8. Rate Limit State

`heading`: Забагато спроб перевірки

`body`: Ми тимчасово обмежили нові запити. Зачекайте трохи та спробуйте ще раз.

`button`: Спробувати пізніше

Do not display an exact internal threshold or security-rule details.

## 9. Temporary Error State

`heading`: Не вдалося виконати перевірку

`body`: Сервіс перевірки тимчасово недоступний. Спробуйте ще раз пізніше.

`retry_button`: Повторити

## 10. Connection Error State

`heading`: Немає зв’язку із сервісом перевірки

`body`: Перевірте інтернет-з’єднання та повторіть запит.

`retry_button`: Повторити

## 11. Privacy And Indexing Rules

- manual verification page is indexable;
- QR-token and all result pages are `noindex`;
- never include result details in SEO or Open Graph metadata;
- do not offer search by name, surname, email, phone, learner ID, or partner;
- valid is the only state that shows document details;
- revoked shows status only;
- pending and voided behave as not found publicly.
