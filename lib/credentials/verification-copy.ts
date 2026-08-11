import type { ContentLocale } from '@/lib/content/localization';

type VerificationCopy = {
  seo: { title: string; description: string; ogTitle: string; ogDescription: string };
  eyebrow: string;
  title: string;
  lead: string;
  instruction: string;
  fieldLabel: string;
  placeholder: string;
  fieldHelper: string;
  submit: string;
  submitting: string;
  requiredError: string;
  formatError: string;
  loading: string;
  fields: {
    documentNumber: string;
    holderName: string;
    programmeTitle: string;
    credentialType: string;
    issueDate: string;
  };
  valid: { status: string; heading: string; body: string; note: string };
  revoked: { status: string; heading: string; body: string };
  notFound: { heading: string; body: string; helper: string };
  rateLimited: { heading: string; body: string; button: string };
  temporary: { heading: string; body: string; button: string };
  connection: { heading: string; body: string; button: string };
  contact: string;
};

export const verificationCopy: Record<ContentLocale, VerificationCopy> = {
  en: {
    seo: {
      title: 'Verify a Document | Nobel ITBS',
      description: 'Verify a Nobel ITBS document by number or open its verification page using the QR code printed on the document.',
      ogTitle: 'Nobel ITBS Document Verification',
      ogDescription: "Check a document's status using its number or QR code.",
    },
    eyebrow: 'Document Verification',
    title: 'Verify a document',
    lead: 'Enter the document number to check its status in the Nobel ITBS registry.',
    instruction: 'Use the number exactly as it appears on the document. If the document has a QR code, scan it with your phone camera to open the verification page without entering the number manually.',
    fieldLabel: 'Document number',
    placeholder: 'For example, NITBS-C-2026-000123',
    fieldHelper: 'Verification is available only with the complete document number.',
    submit: 'Verify',
    submitting: 'Verifying…',
    requiredError: 'Enter the document number.',
    formatError: 'Check the document number and try again.',
    loading: 'Checking the document status…',
    fields: { documentNumber: 'Document number', holderName: 'Document holder', programmeTitle: 'Programme', credentialType: 'Document type', issueDate: 'Issue date' },
    valid: { status: 'Valid', heading: 'Document verified', body: 'The document was found in the Nobel ITBS registry and has valid status.', note: "This page confirms the document's status at the time of verification." },
    revoked: { status: 'Revoked', heading: 'Document revoked', body: 'This document has Revoked status. Document details are not displayed.' },
    notFound: { heading: 'Document not found', body: 'No document was found for this code or number.', helper: 'Check that the number is correct. If it has been entered correctly, contact the organisation that provided the document.' },
    rateLimited: { heading: 'Too many verification attempts', body: 'We have temporarily limited new requests. Wait a moment and try again.', button: 'Try again later' },
    temporary: { heading: 'Verification could not be completed', body: 'The verification service is temporarily unavailable. Please try again later.', button: 'Try again' },
    connection: { heading: 'Cannot connect to the verification service', body: 'Check your internet connection and submit the request again.', button: 'Try again' },
    contact: 'Contact',
  },
  ua: {
    seo: {
      title: 'Перевірити документ | Nobel ITBS',
      description: 'Перевірте дійсність документа Nobel ITBS за номером або відкрийте сторінку перевірки через QR-код на документі.',
      ogTitle: 'Перевірка документа Nobel ITBS',
      ogDescription: 'Перевірте статус документа за його номером або QR-кодом.',
    },
    eyebrow: 'Document Verification',
    title: 'Перевірка документа',
    lead: 'Введіть номер документа, щоб перевірити його статус у реєстрі Nobel ITBS.',
    instruction: 'Використовуйте номер у тому форматі, у якому він зазначений на документі. Якщо на документі є QR-код, відскануйте його камерою телефона, щоб відкрити сторінку перевірки без ручного введення.',
    fieldLabel: 'Номер документа',
    placeholder: 'Наприклад, NITBS-C-2026-000123',
    fieldHelper: 'Перевірка доступна лише за повним номером документа.',
    submit: 'Перевірити',
    submitting: 'Перевіряємо…',
    requiredError: 'Введіть номер документа.',
    formatError: 'Перевірте номер документа та спробуйте ще раз.',
    loading: 'Перевіряємо статус документа…',
    fields: { documentNumber: 'Номер документа', holderName: 'Власник документа', programmeTitle: 'Програма', credentialType: 'Тип документа', issueDate: 'Дата видачі' },
    valid: { status: 'Дійсний', heading: 'Документ підтверджено', body: 'Документ знайдено в реєстрі Nobel ITBS і він має дійсний статус.', note: 'Сторінка підтверджує статус документа на момент перевірки.' },
    revoked: { status: 'Відкликаний', heading: 'Документ відкликано', body: 'Цей документ має статус «Відкликаний». Деталі документа не відображаються.' },
    notFound: { heading: 'Документ не знайдено', body: 'За цим кодом/номером документ не знайдено.', helper: 'Перевірте правильність номера. Якщо номер введено правильно, зверніться до організації, яка надала документ.' },
    rateLimited: { heading: 'Забагато спроб перевірки', body: 'Ми тимчасово обмежили нові запити. Зачекайте трохи та спробуйте ще раз.', button: 'Спробувати пізніше' },
    temporary: { heading: 'Не вдалося виконати перевірку', body: 'Сервіс перевірки тимчасово недоступний. Спробуйте ще раз пізніше.', button: 'Повторити' },
    connection: { heading: 'Немає зв’язку із сервісом перевірки', body: 'Перевірте інтернет-з’єднання та повторіть запит.', button: 'Повторити' },
    contact: 'Контакти',
  },
  cz: {
    seo: {
      title: 'Ověření dokumentu | Nobel ITBS',
      description: 'Ověřte dokument Nobel ITBS podle čísla nebo otevřete ověřovací stránku pomocí QR kódu na dokumentu.',
      ogTitle: 'Ověření dokumentu Nobel ITBS',
      ogDescription: 'Ověřte stav dokumentu podle čísla nebo QR kódu.',
    },
    eyebrow: 'Document Verification',
    title: 'Ověření dokumentu',
    lead: 'Zadejte číslo dokumentu a ověřte jeho stav v registru Nobel ITBS.',
    instruction: 'Použijte číslo přesně ve formátu uvedeném na dokumentu. Pokud obsahuje QR kód, naskenujte jej fotoaparátem telefonu a otevřete ověřovací stránku bez ručního zadávání.',
    fieldLabel: 'Číslo dokumentu',
    placeholder: 'Například NITBS-C-2026-000123',
    fieldHelper: 'Ověření je dostupné pouze podle celého čísla dokumentu.',
    submit: 'Ověřit',
    submitting: 'Ověřujeme…',
    requiredError: 'Zadejte číslo dokumentu.',
    formatError: 'Zkontrolujte číslo dokumentu a zkuste to znovu.',
    loading: 'Ověřujeme stav dokumentu…',
    fields: { documentNumber: 'Číslo dokumentu', holderName: 'Držitel dokumentu', programmeTitle: 'Program', credentialType: 'Typ dokumentu', issueDate: 'Datum vydání' },
    valid: { status: 'Platný', heading: 'Dokument ověřen', body: 'Dokument byl nalezen v registru Nobel ITBS a má platný stav.', note: 'Stránka potvrzuje stav dokumentu v okamžiku ověření.' },
    revoked: { status: 'Odvolaný', heading: 'Dokument byl odvolán', body: 'Tento dokument má stav „Odvolaný“. Podrobnosti dokumentu se nezobrazují.' },
    notFound: { heading: 'Dokument nenalezen', body: 'Pro tento kód nebo číslo nebyl nalezen žádný dokument.', helper: 'Zkontrolujte správnost čísla. Pokud je správné, kontaktujte organizaci, která dokument poskytla.' },
    rateLimited: { heading: 'Příliš mnoho pokusů o ověření', body: 'Nové požadavky jsme dočasně omezili. Chvíli počkejte a zkuste to znovu.', button: 'Zkusit později' },
    temporary: { heading: 'Ověření se nepodařilo dokončit', body: 'Ověřovací služba je dočasně nedostupná. Zkuste to později.', button: 'Zkusit znovu' },
    connection: { heading: 'Nelze se spojit s ověřovací službou', body: 'Zkontrolujte připojení k internetu a požadavek opakujte.', button: 'Zkusit znovu' },
    contact: 'Kontakt',
  },
};
