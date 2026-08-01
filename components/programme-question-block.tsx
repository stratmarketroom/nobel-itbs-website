"use client";

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Locale } from '@/lib/i18n';

type ProgrammeQuestionBlockProps = {
  locale: Locale;
  programmeTitle: string;
  programmeHref: string;
};

type ProgrammeQuestionCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  programmeLabel: string;
  topicLabel: string;
  topics: string[];
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phoneOptional: string;
  phonePlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  requiredHint: string;
  privacyTextBefore: string;
  privacyLink: string;
  privacyTextAfter: string;
  privacyHref: string;
  submit: string;
  successTitle: string;
  successBody: string;
};

const copyByLocale: Record<Locale, ProgrammeQuestionCopy> = {
  en: {
    eyebrow: 'Programme question',
    title: 'Ask about {programme}',
    intro: 'Ask about the programme, learning format, documents, or participation conditions.',
    programmeLabel: 'Programme',
    topicLabel: 'What should we clarify?',
    topics: ['Learning format', 'Documents', 'Participation conditions', 'Other question'],
    nameLabel: 'Name',
    namePlaceholder: 'Your name',
    emailLabel: 'Email',
    emailPlaceholder: 'name@example.com',
    phoneLabel: 'Phone',
    phoneOptional: 'Optional',
    phonePlaceholder: 'Include country code',
    messageLabel: 'Message',
    messagePlaceholder: 'Tell us how we can help',
    requiredHint: 'Required fields',
    privacyTextBefore: 'I have read the ',
    privacyLink: 'Privacy Policy',
    privacyTextAfter: ' and understand how my data will be used to respond to this enquiry.',
    privacyHref: '/privacy',
    submit: 'Send question',
    successTitle: 'Question received',
    successBody: 'Thank you. We will contact you about this programme.',
  },
  ua: {
    eyebrow: 'Запитання про програму',
    title: 'Запитання про {programme}',
    intro: 'Поставте запитання про програму, формат навчання, документи або умови участі.',
    programmeLabel: 'Програма',
    topicLabel: 'Що уточнити?',
    topics: ['Формат навчання', 'Документи', 'Умови участі', 'Інше запитання'],
    nameLabel: "Ім'я",
    namePlaceholder: "Ваше ім'я",
    emailLabel: 'Email',
    emailPlaceholder: 'name@example.com',
    phoneLabel: 'Телефон',
    phoneOptional: "Необов'язково",
    phonePlaceholder: 'Вкажіть код країни',
    messageLabel: 'Повідомлення',
    messagePlaceholder: 'Розкажіть, чим ми можемо допомогти',
    requiredHint: "Обов'язкові поля",
    privacyTextBefore: 'Я ознайомився / ознайомилася з ',
    privacyLink: 'Політикою конфіденційності',
    privacyTextAfter: ' та розумію, як мої дані використовуватимуться для відповіді на це звернення.',
    privacyHref: '/ua/privacy',
    submit: 'Надіслати запитання',
    successTitle: 'Запитання отримано',
    successBody: "Дякуємо. Ми зв'яжемося з вами щодо цієї програми.",
  },
  cz: {
    eyebrow: 'Dotaz k programu',
    title: 'Dotaz k programu {programme}',
    intro: 'Zeptejte se na program, formát výuky, dokumenty nebo podmínky účasti.',
    programmeLabel: 'Program',
    topicLabel: 'Co máme upřesnit?',
    topics: ['Formát výuky', 'Dokumenty', 'Podmínky účasti', 'Jiný dotaz'],
    nameLabel: 'Jméno',
    namePlaceholder: 'Vaše jméno',
    emailLabel: 'E-mail',
    emailPlaceholder: 'name@example.com',
    phoneLabel: 'Telefon',
    phoneOptional: 'Nepovinné',
    phonePlaceholder: 'Uveďte předvolbu země',
    messageLabel: 'Zpráva',
    messagePlaceholder: 'Napište nám, jak vám můžeme pomoci',
    requiredHint: 'Povinná pole',
    privacyTextBefore: 'Seznámil/a jsem se se ',
    privacyLink: 'Zásadami ochrany osobních údajů',
    privacyTextAfter: ' a rozumím tomu, jak budou mé údaje použity k vyřízení tohoto dotazu.',
    privacyHref: '/cz/privacy',
    submit: 'Odeslat dotaz',
    successTitle: 'Dotaz jsme přijali',
    successBody: 'Děkujeme. Ozveme se vám ohledně tohoto programu.',
  },
};

function programmeSlugFromHref(href: string) {
  const match = href.match(/[?&]programme=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export function ProgrammeQuestionBlock({ locale, programmeTitle, programmeHref }: ProgrammeQuestionBlockProps) {
  const copy = copyByLocale[locale];
  const [selectedTopic, setSelectedTopic] = useState(copy.topics[0]);
  const [submitted, setSubmitted] = useState(false);
  const programmeSlug = programmeSlugFromHref(programmeHref);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="programme-question-block section-band" aria-labelledby="programme-question-title">
      <div className="programme-question-intro">
        <p className="eyebrow dark">{copy.eyebrow}</p>
        <h2 id="programme-question-title">{copy.title.replace('{programme}', programmeTitle)}</h2>
        <p>{copy.intro}</p>
      </div>

      <div className="programme-question-surface">
        {submitted ? (
          <div className="programme-question-success" role="status">
            <p className="eyebrow dark">{copy.successTitle}</p>
            <h3>{programmeTitle}</h3>
            <p>{copy.successBody}</p>
          </div>
        ) : (
          <form className="programme-question-form" onSubmit={handleSubmit}>
            <input type="hidden" name="submissionType" value="programme_question" />
            <input type="hidden" name="programmeSlug" value={programmeSlug} />
            <div className="programme-question-programme">
              <span>{copy.programmeLabel}</span>
              <strong>{programmeTitle}</strong>
            </div>

            <label className="programme-question-topic">
              <span>{copy.topicLabel}</span>
              <select name="topic" value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>
                {copy.topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </label>

            <div className="programme-question-fields">
              <label>
                <span>{copy.nameLabel} *</span>
                <input name="name" placeholder={copy.namePlaceholder} required />
              </label>
              <label>
                <span>{copy.emailLabel} *</span>
                <input name="email" type="email" placeholder={copy.emailPlaceholder} required />
              </label>
              <label>
                <span>
                  {copy.phoneLabel} <em>{copy.phoneOptional}</em>
                </span>
                <input name="phone" type="tel" placeholder={copy.phonePlaceholder} />
              </label>
            </div>

            <label className="programme-question-message">
              <span>{copy.messageLabel} *</span>
              <textarea name="message" placeholder={copy.messagePlaceholder} rows={5} required />
            </label>

            <label className="programme-question-privacy">
              <input name="privacyAcknowledgement" type="checkbox" required />
              <span>
                {copy.privacyTextBefore}
                <Link href={copy.privacyHref}>{copy.privacyLink}</Link>
                {copy.privacyTextAfter}
              </span>
            </label>

            <div className="programme-question-actions">
              <span>{copy.requiredHint}</span>
              <button type="submit">{copy.submit}</button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
