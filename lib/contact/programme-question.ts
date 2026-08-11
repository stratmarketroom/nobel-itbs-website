import type { ContentLocale } from '@/lib/content/localization';

export type ProgrammeQuestionInput = {
  programmeSlug: string;
  locale: ContentLocale;
  name: string;
  email: string;
  phone: string;
  message: string;
  privacyAccepted: boolean;
  website: string;
  captchaToken?: string;
};

export type ProgrammeQuestionField = 'name' | 'email' | 'phone' | 'message' | 'privacyAccepted';
export type ProgrammeQuestionErrors = Partial<Record<ProgrammeQuestionField, string>>;

const programmeSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9 ()-]{7,30}$/;

export function validateProgrammeQuestion(input: ProgrammeQuestionInput): ProgrammeQuestionErrors {
  const errors: ProgrammeQuestionErrors = {};
  const copy = programmeQuestionCopy[input.locale].validation;

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

export function isProgrammeSlug(value: string): boolean {
  return programmeSlugPattern.test(value);
}

export const programmeQuestionCopy = {
  en: {
    title: (programme: string) => `Ask about ${programme}`,
    intro: 'Ask about the programme, learning format, documents, or participation conditions.',
    programme: 'Programme', required: 'Required fields', name: 'Name', namePlaceholder: 'Your name',
    email: 'Email', emailPlaceholder: 'name@example.com', phone: 'Phone', optional: 'Optional', phonePlaceholder: 'Include country code',
    message: 'Message', messagePlaceholder: 'Tell us how we can help',
    privacyBefore: 'I have read the ', privacyLink: 'Privacy Policy', privacyAfter: ' and understand how my data will be used to respond to this enquiry.',
    submit: 'Send question', submitting: 'Sending…', successTitle: 'Question received', successBody: 'Thank you. We will contact you about this programme.',
    rateTitle: 'Too many requests', rateBody: 'Please wait a moment before sending another message.',
    temporary: 'We could not send your message. Please try again later.', connection: 'Check your internet connection and try again.',
    validation: { name: 'Enter your name.', emailRequired: 'Enter your email address.', emailInvalid: 'Enter a valid email address.', phone: 'Enter a valid phone number with country code.', messageRequired: 'Enter your message.', messageShort: 'Add a little more detail so we can respond accurately.', messageLong: 'Shorten the message and try again.', privacy: 'Confirm that you have read the Privacy Policy.' },
  },
  ua: {
    title: (programme: string) => `Запитання про ${programme}`,
    intro: 'Поставте запитання про програму, формат навчання, документи або умови участі.',
    programme: 'Програма', required: 'Обов’язкові поля', name: 'Ім’я', namePlaceholder: 'Ваше ім’я',
    email: 'Email', emailPlaceholder: 'name@example.com', phone: 'Телефон', optional: 'Необов’язково', phonePlaceholder: 'Вкажіть код країни',
    message: 'Повідомлення', messagePlaceholder: 'Розкажіть, чим ми можемо допомогти',
    privacyBefore: 'Я ознайомився / ознайомилася з ', privacyLink: 'Політикою конфіденційності', privacyAfter: ' та розумію, як мої дані використовуватимуться для відповіді на це звернення.',
    submit: 'Надіслати запитання', submitting: 'Надсилаємо…', successTitle: 'Запитання отримано', successBody: 'Дякуємо. Ми зв’яжемося з вами щодо цієї програми.',
    rateTitle: 'Забагато запитів', rateBody: 'Зачекайте трохи перед повторним надсиланням.',
    temporary: 'Не вдалося надіслати повідомлення. Спробуйте пізніше.', connection: 'Перевірте інтернет-з’єднання та спробуйте ще раз.',
    validation: { name: 'Введіть ім’я.', emailRequired: 'Введіть email.', emailInvalid: 'Введіть коректний email.', phone: 'Введіть коректний номер телефону з кодом країни.', messageRequired: 'Введіть повідомлення.', messageShort: 'Додайте трохи більше деталей, щоб ми могли точно відповісти.', messageLong: 'Скоротіть повідомлення та спробуйте ще раз.', privacy: 'Підтвердьте, що ви ознайомилися з Політикою конфіденційності.' },
  },
  cz: {
    title: (programme: string) => `Dotaz k programu ${programme}`,
    intro: 'Zeptejte se na program, formát výuky, dokumenty nebo podmínky účasti.',
    programme: 'Program', required: 'Povinná pole', name: 'Jméno', namePlaceholder: 'Vaše jméno',
    email: 'E-mail', emailPlaceholder: 'name@example.com', phone: 'Telefon', optional: 'Nepovinné', phonePlaceholder: 'Uveďte předvolbu země',
    message: 'Zpráva', messagePlaceholder: 'Napište nám, jak vám můžeme pomoci',
    privacyBefore: 'Seznámil/a jsem se se ', privacyLink: 'Zásadami ochrany osobních údajů', privacyAfter: ' a rozumím tomu, jak budou mé údaje použity k vyřízení tohoto dotazu.',
    submit: 'Odeslat dotaz', submitting: 'Odesíláme…', successTitle: 'Dotaz jsme přijali', successBody: 'Děkujeme. Ozveme se vám ohledně tohoto programu.',
    rateTitle: 'Příliš mnoho požadavků', rateBody: 'Chvíli počkejte, než odešlete další zprávu.',
    temporary: 'Zprávu se nepodařilo odeslat. Zkuste to později.', connection: 'Zkontrolujte připojení k internetu a zkuste to znovu.',
    validation: { name: 'Zadejte své jméno.', emailRequired: 'Zadejte e-mailovou adresu.', emailInvalid: 'Zadejte platnou e-mailovou adresu.', phone: 'Zadejte platné telefonní číslo s předvolbou země.', messageRequired: 'Napište zprávu.', messageShort: 'Doplňte prosím více informací, abychom mohli přesně odpovědět.', messageLong: 'Zkraťte zprávu a zkuste to znovu.', privacy: 'Potvrďte, že jste se seznámil/a se Zásadami ochrany osobních údajů.' },
  },
} satisfies Record<ContentLocale, Record<string, unknown>>;

export function privacyPolicyPath(locale: ContentLocale): string {
  return locale === 'en' ? '/privacy-policy' : `/${locale}/privacy-policy`;
}
