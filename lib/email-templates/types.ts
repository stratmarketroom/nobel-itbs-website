export type EmailTemplateLanguage = 'en' | 'ua';

export type AdminEmailTemplate = {
  id: string;
  templateKey: 'credential_delivery';
  languageCode: EmailTemplateLanguage;
  subject: string;
  body: string;
  updatedBy: string | null;
  updatedAt: string;
};

export type EmailTemplateUpdate = {
  subject: string;
  body: string;
};
