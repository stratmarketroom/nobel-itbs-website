export const contactSubmissionTypes = [
  'general',
  'programme_question',
  'partner_enquiry',
  'organisation_enquiry',
] as const;

export const contactSubmissionStatuses = ['new', 'processed', 'archived'] as const;

export type ContactSubmissionType = (typeof contactSubmissionTypes)[number];
export type ContactSubmissionStatus = (typeof contactSubmissionStatuses)[number];

export type ContactSubmissionAdminItem = {
  id: string;
  type: ContactSubmissionType;
  status: ContactSubmissionStatus;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  languageCode: string;
  metadata: Record<string, unknown>;
  programme: { slug: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
};
