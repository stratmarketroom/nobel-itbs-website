# Cookie Consent: Release 1 Copy

Product: Nobel ITBS Website and Credential Registry  
Component: Minimal cookie-consent block  
Locales: Ukrainian, English, Czech  
Status: product-owner approved Release 1 copy  
Updated: 2026-07-31

## 1. Release 1 Model

Release 1 uses a minimal cookie-consent block without a separate Cookie Policy
page or granular category settings.

The block:

- appears before any non-essential cookies load;
- offers two equally visible actions;
- stores the user's choice;
- keeps strictly necessary cookies active;
- does not show a link to a non-existing Cookie Policy page.

## 2. Ukrainian

`aria_label`: Згода на використання cookie

`text`: Ми використовуємо необхідні cookie для роботи сайту. За вашою згодою ми
також можемо використовувати необов’язкові cookie для аналітики та покращення
сайту. Ви можете прийняти або відхилити їх.

`accept_button`: Приймаю

`decline_button`: Не приймаю

## 3. English

`aria_label`: Cookie consent

`text`: We use necessary cookies to operate this website. With your consent, we
may also use optional cookies for analytics and website improvement. You can
accept or decline them.

`accept_button`: Accept

`decline_button`: Decline

## 4. Czech

`aria_label`: Souhlas s používáním souborů cookie

`text`: Používáme nezbytné soubory cookie pro fungování tohoto webu. S vaším
souhlasem můžeme používat také volitelné soubory cookie pro analytiku a
zlepšování webu. Můžete je přijmout nebo odmítnout.

`accept_button`: Přijímám

`decline_button`: Odmítám

## 5. Behaviour Copy Rules

- declining means non-essential cookies remain disabled;
- do not use a preselected option;
- do not describe necessary cookies as optional;
- do not imply that declining blocks access to the website;
- do not add `Configure`, `Accept all`, or category-level copy in Release 1;
- update this component when the lawyer-approved full Cookie Policy and actual
  provider inventory are available.
