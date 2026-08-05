# System And Form Copy

Product: Nobel ITBS Website and Credential Registry  
Scope: Release 1 public forms and required system states  
Locales: EN, UA, CZ  
Status: content master copy; implementation QA pending  
Updated: 2026-07-31

## 1. Form Model

Release 1 uses four contact-submission types:

- `general`;
- `programme_question`;
- `organisation_enquiry`;
- `partner_enquiry`.

Shared stored fields are name, email, optional phone, message, locale, and
submission type. `programme_question` also stores the source programme context
automatically. The user must not be asked to reselect the programme.

All forms:

- show required fields explicitly;
- validate inline and on submit;
- use an unchecked privacy acknowledgement;
- do not include marketing consent in Release 1;
- use rate limiting and CAPTCHA where configured;
- return no raw API, database, CAPTCHA, or security errors;
- preserve entered values after a recoverable error;
- disable duplicate submit while sending.

## 2. Shared Form Fields

| Key | EN | UA | CZ |
| --- | --- | --- | --- |
| `name_label` | Name | Ім'я | Jméno |
| `name_placeholder` | Your name | Ваше ім'я | Vaše jméno |
| `email_label` | Email | Email | E-mail |
| `email_placeholder` | name@example.com | name@example.com | name@example.com |
| `phone_label` | Phone | Телефон | Telefon |
| `phone_optional` | Optional | Необов'язково | Nepovinné |
| `phone_placeholder` | Include country code | Вкажіть код країни | Uveďte předvolbu země |
| `message_label` | Message | Повідомлення | Zpráva |
| `message_placeholder` | Tell us how we can help | Розкажіть, чим ми можемо допомогти | Napište nám, jak vám můžeme pomoci |
| `required_hint` | Required fields | Обов'язкові поля | Povinná pole |

## 3. Privacy Acknowledgement

Use one unchecked required checkbox. `Privacy Policy` is an inline link to the
current locale page. This is an acknowledgement of the notice, not optional
marketing consent.

`EN`: I have read the Privacy Policy and understand how my data will be used to
respond to this enquiry.

`UA`: Я ознайомився / ознайомилася з Політикою конфіденційності та розумію, як
мої дані використовуватимуться для відповіді на це звернення.

`CZ`: Seznámil/a jsem se se Zásadami ochrany osobních údajů a rozumím tomu, jak
budou mé údaje použity k vyřízení tohoto dotazu.

Validation:

| Key | EN | UA | CZ |
| --- | --- | --- | --- |
| `privacy_required` | Confirm that you have read the Privacy Policy. | Підтвердьте, що ви ознайомилися з Політикою конфіденційності. | Potvrďte, že jste se seznámil/a se Zásadami ochrany osobních údajů. |

## 4. General Contact Form

| Key | EN | UA | CZ |
| --- | --- | --- | --- |
| `title` | Contact Nobel ITBS | Зв'язатися з Nobel ITBS | Kontaktovat Nobel ITBS |
| `intro` | Send us your question and we will direct it to the right person. | Надішліть запитання, і ми передамо його відповідальній людині. | Pošlete nám svůj dotaz a my jej předáme správné osobě. |
| `submit` | Send message | Надіслати повідомлення | Odeslat zprávu |
| `submitting` | Sending… | Надсилаємо… | Odesíláme… |
| `success_title` | Message received | Повідомлення отримано | Zprávu jsme přijali |
| `success_body` | Thank you. We will respond using the contact details you provided. | Дякуємо. Ми відповімо за вказаними вами контактними даними. | Děkujeme. Odpovíme vám prostřednictvím uvedených kontaktních údajů. |

## 5. Programme Question Form

The title interpolates the approved display title. The source programme is
stored server-side from page context.

| Key | EN | UA | CZ |
| --- | --- | --- | --- |
| `title` | Ask about {programme} | Запитання про {programme} | Dotaz k programu {programme} |
| `intro` | Ask about the programme, learning format, documents, or participation conditions. | Поставте запитання про програму, формат навчання, документи або умови участі. | Zeptejte se na program, formát výuky, dokumenty nebo podmínky účasti. |
| `programme_label` | Programme | Програма | Program |
| `submit` | Send question | Надіслати запитання | Odeslat dotaz |
| `submitting` | Sending… | Надсилаємо… | Odesíláme… |
| `success_title` | Question received | Запитання отримано | Dotaz jsme přijali |
| `success_body` | Thank you. We will contact you about this programme. | Дякуємо. Ми зв'яжемося з вами щодо цієї програми. | Děkujeme. Ozveme se vám ohledně tohoto programu. |

## 6. Organisation Enquiry Form

| Key | EN | UA | CZ |
| --- | --- | --- | --- |
| `title` | Discuss your project | Обговорити проєкт | Projednat projekt |
| `intro` | Tell us about your educational project, current learning model, and the documents you plan to issue. | Розкажіть про освітній проєкт, поточну модель навчання та документи, які плануєте видавати. | Popište svůj vzdělávací projekt, současný model výuky a dokumenty, které plánujete vydávat. |
| `organisation_label` | Organisation or project | Організація або проєкт | Organizace nebo projekt |
| `organisation_placeholder` | Name of your organisation or project | Назва організації або проєкту | Název organizace nebo projektu |
| `submit` | Send project enquiry | Надіслати запит про проєкт | Odeslat poptávku projektu |
| `submitting` | Sending… | Надсилаємо… | Odesíláme… |
| `success_title` | Project enquiry received | Запит про проєкт отримано | Poptávku jsme přijali |
| `success_body` | Thank you. We will review the information and contact you about the next step. | Дякуємо. Ми розглянемо інформацію та зв'яжемося з вами щодо наступного кроку. | Děkujeme. Informace posoudíme a ozveme se vám ohledně dalšího kroku. |

The organisation/project value may be stored in `metadata` until a dedicated
database field is approved. Do not silently add a schema field in the copy
ticket.

## 7. Partnership Enquiry Form

| Key | EN | UA | CZ |
| --- | --- | --- | --- |
| `title` | Propose a partnership | Запропонувати партнерство | Navrhnout partnerství |
| `intro` | Tell us about your role, expertise, programme, and the cooperation model you have in mind. | Розкажіть про свою роль, експертизу, програму та бажану модель співпраці. | Popište svou roli, expertizu, program a zamýšlený model spolupráce. |
| `role_label` | Your role | Ваша роль | Vaše role |
| `role_placeholder` | Organisation, expert, author, or other role | Організація, експерт, автор або інша роль | Organizace, expert, autor nebo jiná role |
| `submit` | Send partnership enquiry | Надіслати пропозицію | Odeslat návrh partnerství |
| `submitting` | Sending… | Надсилаємо… | Odesíláme… |
| `success_title` | Partnership enquiry received | Пропозицію отримано | Návrh jsme přijali |
| `success_body` | Thank you. We will review your proposal and contact you if the model fits Nobel ITBS. | Дякуємо. Ми розглянемо пропозицію та зв'яжемося з вами, якщо модель відповідає напряму Nobel ITBS. | Děkujeme. Návrh posoudíme a ozveme se vám, pokud model odpovídá zaměření Nobel ITBS. |

The role value may be stored in `metadata` until a dedicated database field is
approved.

## 8. Shared Validation And Submission States

| Key | EN | UA | CZ |
| --- | --- | --- | --- |
| `name_required` | Enter your name. | Введіть ім'я. | Zadejte své jméno. |
| `email_required` | Enter your email address. | Введіть email. | Zadejte e-mailovou adresu. |
| `email_invalid` | Enter a valid email address. | Введіть коректний email. | Zadejte platnou e-mailovou adresu. |
| `phone_invalid` | Enter a valid phone number with country code. | Введіть коректний номер телефону з кодом країни. | Zadejte platné telefonní číslo s předvolbou země. |
| `message_required` | Enter your message. | Введіть повідомлення. | Napište zprávu. |
| `message_too_short` | Add a little more detail so we can respond accurately. | Додайте трохи більше деталей, щоб ми могли точно відповісти. | Doplňte prosím více informací, abychom mohli přesně odpovědět. |
| `message_too_long` | Shorten the message and try again. | Скоротіть повідомлення та спробуйте ще раз. | Zkraťte zprávu a zkuste to znovu. |
| `captcha_required` | Complete the security check. | Пройдіть перевірку безпеки. | Dokončete bezpečnostní kontrolu. |
| `captcha_failed` | The security check could not be completed. Try again. | Не вдалося пройти перевірку безпеки. Спробуйте ще раз. | Bezpečnostní kontrolu se nepodařilo dokončit. Zkuste to znovu. |
| `rate_limit_title` | Too many requests | Забагато запитів | Příliš mnoho požadavků |
| `rate_limit_body` | Please wait a moment before sending another message. | Зачекайте трохи перед повторним надсиланням. | Chvíli počkejte, než odešlete další zprávu. |
| `temporary_error` | We could not send your message. Please try again later. | Не вдалося надіслати повідомлення. Спробуйте пізніше. | Zprávu se nepodařilo odeslat. Zkuste to později. |
| `connection_error` | Check your internet connection and try again. | Перевірте інтернет-з'єднання та спробуйте ще раз. | Zkontrolujte připojení k internetu a zkuste to znovu. |
| `retry` | Try again | Повторити | Zkusit znovu |
| `close` | Close | Закрити | Zavřít |

## 9. Public System Pages

All system pages below are `noindex, nofollow` and excluded from the XML
sitemap. They use no Open Graph campaign metadata.

### 404

| Key | EN | UA | CZ |
| --- | --- | --- | --- |
| `seo_title` | Page Not Found | Сторінку не знайдено | Stránka nenalezena |
| `eyebrow` | 404 | 404 | 404 |
| `heading` | Page not found | Сторінку не знайдено | Stránka nebyla nalezena |
| `body` | The page may have moved, changed its address, or no longer be available. | Можливо, сторінку переміщено, її адресу змінено або вона більше недоступна. | Stránka mohla být přesunuta, změnila adresu nebo již není dostupná. |
| `primary_cta` | View programmes | Переглянути програми | Zobrazit programy |
| `secondary_cta` | Return home | На головну | Zpět na hlavní stránku |

### Rate Limited

| Key | EN | UA | CZ |
| --- | --- | --- | --- |
| `seo_title` | Please Wait | Зачекайте | Počkejte prosím |
| `heading` | Too many requests | Забагато запитів | Příliš mnoho požadavků |
| `body` | We have temporarily limited new requests. Wait a moment and try again. | Ми тимчасово обмежили нові запити. Зачекайте трохи та спробуйте знову. | Nové požadavky jsme dočasně omezili. Chvíli počkejte a zkuste to znovu. |
| `cta` | Try again later | Спробувати пізніше | Zkusit později |

### Temporary Error

| Key | EN | UA | CZ |
| --- | --- | --- | --- |
| `seo_title` | Service Temporarily Unavailable | Сервіс тимчасово недоступний | Služba je dočasně nedostupná |
| `heading` | Something went wrong | Сталася помилка | Něco se nepodařilo |
| `body` | The service is temporarily unavailable. Please try again later. | Сервіс тимчасово недоступний. Спробуйте ще раз пізніше. | Služba je dočasně nedostupná. Zkuste to prosím později. |
| `primary_cta` | Try again | Повторити | Zkusit znovu |
| `secondary_cta` | Return home | На головну | Zpět na hlavní stránku |

### Admin Access Denied

| Key | EN | UA | CZ |
| --- | --- | --- | --- |
| `seo_title` | Access Denied | Доступ заборонено | Přístup odepřen |
| `heading` | You do not have access to this section | У вас немає доступу до цього розділу | Do této části nemáte přístup |
| `body` | Your account does not have the required role or security level. | Ваш обліковий запис не має потрібної ролі або рівня безпеки. | Váš účet nemá požadovanou roli nebo úroveň zabezpečení. |
| `primary_cta` | Go to admin home | До головної адмінпанелі | Přejít na hlavní stránku administrace |
| `secondary_cta` | Sign out | Вийти | Odhlásit se |

Do not reveal the missing permission, role mapping, internal route policy, or
MFA implementation detail in public-facing error copy.

## 10. Shared Empty And Loading States

| Key | EN | UA | CZ |
| --- | --- | --- | --- |
| `loading` | Loading… | Завантажуємо… | Načítání… |
| `saving` | Saving… | Зберігаємо… | Ukládání… |
| `saved` | Changes saved | Зміни збережено | Změny byly uloženy |
| `no_results` | No results found | Нічого не знайдено | Nebyly nalezeny žádné výsledky |
| `clear` | Clear | Очистити | Vymazat |
| `cancel` | Cancel | Скасувати | Zrušit |
| `back` | Back | Назад | Zpět |

Programme catalogue and area/type empty states must use their dedicated page
master copy, not the generic `no_results` string.
