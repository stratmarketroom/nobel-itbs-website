import type { ContentLocale } from '@/lib/content/localization';

export const publicEnquiryTypes = ['general', 'partner_enquiry', 'organisation_enquiry'] as const;
export type PublicEnquiryType = (typeof publicEnquiryTypes)[number];

export type PublicEnquiryInput = {
  type: PublicEnquiryType;
  locale: ContentLocale;
  name: string;
  email: string;
  phone: string;
  message: string;
  privacyAccepted: boolean;
  website: string;
  captchaToken?: string;
};

export type PublicEnquiryField = 'name' | 'email' | 'phone' | 'message' | 'privacyAccepted';
export type PublicEnquiryErrors = Partial<Record<PublicEnquiryField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9 ()-]{7,30}$/;

export function validatePublicEnquiry(input: PublicEnquiryInput): PublicEnquiryErrors {
  const errors: PublicEnquiryErrors = {};
  const copy = publicEnquiryCopy[input.locale].validation;

  if (input.name.trim().length < 2 || input.name.trim().length > 120) errors.name = copy.name;
  if (!input.email.trim()) errors.email = copy.emailRequired;
  else if (input.email.length > 254 || !emailPattern.test(input.email.trim())) errors.email = copy.emailInvalid;
  if (input.phone.trim() && (input.phone.trim().length > 40 || !phonePattern.test(input.phone.trim()))) errors.phone = copy.phone;
  if (!input.message.trim()) errors.message = copy.messageRequired;
  else if (input.message.trim().length < 10) errors.message = copy.messageShort;
  else if (input.message.trim().length > 4000) errors.message = copy.messageLong;
  if (!input.privacyAccepted) errors.privacyAccepted = copy.privacy;

  return errors;
}

export const publicEnquiryCopy = {
  en: {
    forms: {
      general: { eyebrow: 'Contact', title: 'Contact Nobel ITBS', intro: 'Send us a message about programmes, documents, or working with Nobel ITBS.', submit: 'Send message', successTitle: 'Message received', successBody: 'Thank you. We will review your enquiry and contact you.' },
      partner_enquiry: { eyebrow: 'Partnership', title: 'Propose a partnership', intro: 'Tell us about your organisation, expertise, programme, and the cooperation you are considering.', submit: 'Send partnership enquiry', successTitle: 'Partnership enquiry received', successBody: 'Thank you. We will review your proposal and contact you.' },
      organisation_enquiry: { eyebrow: 'For organisations', title: 'Discuss your project', intro: 'Tell us about your educational project, its current format, and the infrastructure you need.', submit: 'Send project enquiry', successTitle: 'Project enquiry received', successBody: 'Thank you. We will review the project information and contact you.' },
    },
    required: 'Required fields', name: 'Name', namePlaceholder: 'Your name', email: 'Email', emailPlaceholder: 'name@example.com', phone: 'Phone', optional: 'Optional', phonePlaceholder: 'Include country code', message: 'Message', messagePlaceholder: 'Tell us how we can help', privacyBefore: 'I have read the ', privacyLink: 'Privacy Policy', privacyAfter: ' and understand how my data will be used to respond to this enquiry.', submitting: 'Sending…', rate: 'Too many requests. Please wait before sending another message.', captcha: 'Please complete the anti-spam check and try again.', temporary: 'We could not send your message. Please try again later.', connection: 'Check your internet connection and try again.',
    validation: { name: 'Enter your name.', emailRequired: 'Enter your email address.', emailInvalid: 'Enter a valid email address.', phone: 'Enter a valid phone number with country code.', messageRequired: 'Enter your message.', messageShort: 'Add a little more detail so we can respond accurately.', messageLong: 'Shorten the message and try again.', privacy: 'Confirm that you have read the Privacy Policy.' },
  },
  ua: {
    forms: {
      general: { eyebrow: 'Контакти', title: 'Зв’язатися з Nobel ITBS', intro: 'Надішліть нам повідомлення щодо програм, документів або співпраці з Nobel ITBS.', submit: 'Надіслати повідомлення', successTitle: 'Повідомлення отримано', successBody: 'Дякуємо. Ми розглянемо звернення та зв’яжемося з вами.' },
      partner_enquiry: { eyebrow: 'Партнерство', title: 'Запропонувати партнерство', intro: 'Розкажіть про вашу організацію, експертизу, програму та бажаний формат співпраці.', submit: 'Надіслати пропозицію', successTitle: 'Пропозицію отримано', successBody: 'Дякуємо. Ми розглянемо пропозицію та зв’яжемося з вами.' },
      organisation_enquiry: { eyebrow: 'Для організацій', title: 'Обговорити ваш проєкт', intro: 'Розкажіть про освітній проєкт, його поточний формат та необхідну інфраструктуру.', submit: 'Надіслати інформацію', successTitle: 'Інформацію отримано', successBody: 'Дякуємо. Ми розглянемо інформацію про проєкт та зв’яжемося з вами.' },
    },
    required: 'Обов’язкові поля', name: 'Ім’я', namePlaceholder: 'Ваше ім’я', email: 'Email', emailPlaceholder: 'name@example.com', phone: 'Телефон', optional: 'Необов’язково', phonePlaceholder: 'Вкажіть код країни', message: 'Повідомлення', messagePlaceholder: 'Розкажіть, чим ми можемо допомогти', privacyBefore: 'Я ознайомився / ознайомилася з ', privacyLink: 'Політикою конфіденційності', privacyAfter: ' та розумію, як мої дані використовуватимуться для відповіді на це звернення.', submitting: 'Надсилаємо…', rate: 'Забагато запитів. Зачекайте перед повторним надсиланням.', captcha: 'Пройдіть перевірку проти спаму та спробуйте ще раз.', temporary: 'Не вдалося надіслати повідомлення. Спробуйте пізніше.', connection: 'Перевірте інтернет-з’єднання та спробуйте ще раз.',
    validation: { name: 'Введіть ім’я.', emailRequired: 'Введіть email.', emailInvalid: 'Введіть коректний email.', phone: 'Введіть коректний номер телефону з кодом країни.', messageRequired: 'Введіть повідомлення.', messageShort: 'Додайте трохи більше деталей, щоб ми могли точно відповісти.', messageLong: 'Скоротіть повідомлення та спробуйте ще раз.', privacy: 'Підтвердьте, що ви ознайомилися з Політикою конфіденційності.' },
  },
  cz: {
    forms: {
      general: { eyebrow: 'Kontakt', title: 'Kontaktujte Nobel ITBS', intro: 'Napište nám ohledně programů, dokumentů nebo spolupráce s Nobel ITBS.', submit: 'Odeslat zprávu', successTitle: 'Zprávu jsme přijali', successBody: 'Děkujeme. Váš dotaz posoudíme a ozveme se vám.' },
      partner_enquiry: { eyebrow: 'Partnerství', title: 'Navrhněte partnerství', intro: 'Představte svou organizaci, odbornost, program a zamýšlenou formu spolupráce.', submit: 'Odeslat návrh', successTitle: 'Návrh jsme přijali', successBody: 'Děkujeme. Návrh posoudíme a ozveme se vám.' },
      organisation_enquiry: { eyebrow: 'Pro organizace', title: 'Proberte s námi svůj projekt', intro: 'Popište svůj vzdělávací projekt, jeho současný formát a potřebnou infrastrukturu.', submit: 'Odeslat informace', successTitle: 'Informace jsme přijali', successBody: 'Děkujeme. Informace o projektu posoudíme a ozveme se vám.' },
    },
    required: 'Povinná pole', name: 'Jméno', namePlaceholder: 'Vaše jméno', email: 'E-mail', emailPlaceholder: 'name@example.com', phone: 'Telefon', optional: 'Nepovinné', phonePlaceholder: 'Uveďte předvolbu země', message: 'Zpráva', messagePlaceholder: 'Napište nám, jak vám můžeme pomoci', privacyBefore: 'Seznámil/a jsem se se ', privacyLink: 'Zásadami ochrany osobních údajů', privacyAfter: ' a rozumím tomu, jak budou mé údaje použity k vyřízení tohoto dotazu.', submitting: 'Odesíláme…', rate: 'Příliš mnoho požadavků. Před dalším odesláním chvíli počkejte.', captcha: 'Dokončete kontrolu proti spamu a zkuste to znovu.', temporary: 'Zprávu se nepodařilo odeslat. Zkuste to později.', connection: 'Zkontrolujte připojení k internetu a zkuste to znovu.',
    validation: { name: 'Zadejte své jméno.', emailRequired: 'Zadejte e-mailovou adresu.', emailInvalid: 'Zadejte platnou e-mailovou adresu.', phone: 'Zadejte platné telefonní číslo s předvolbou země.', messageRequired: 'Napište zprávu.', messageShort: 'Doplňte prosím více informací, abychom mohli přesně odpovědět.', messageLong: 'Zkraťte zprávu a zkuste to znovu.', privacy: 'Potvrďte, že jste se seznámil/a se Zásadami ochrany osobních údajů.' },
  },
} satisfies Record<ContentLocale, Record<string, unknown>>;
