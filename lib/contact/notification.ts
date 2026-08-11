import 'server-only';
import { sendGoogleWorkspaceMessage } from '@/lib/email/google-workspace';

type ContactNotificationInput = {
  type: 'general' | 'programme_question' | 'partner_enquiry' | 'organisation_enquiry';
  name: string;
  email: string;
  phone: string;
  message: string;
  locale: string;
  programmeSlug?: string;
};

export type ContactNotificationResult = 'sent' | 'not_configured' | 'failed';

function notificationRecipient(): string | null {
  const recipient = process.env.CONTACT_NOTIFICATION_EMAIL?.trim().toLowerCase();
  return recipient || null;
}

export async function sendContactSubmissionNotification(
  input: ContactNotificationInput,
): Promise<ContactNotificationResult> {
  const to = notificationRecipient();
  if (!to) return 'not_configured';

  const context = input.programmeSlug ? `Programme: ${input.programmeSlug}` : 'Programme: not applicable';
  const phone = input.phone.trim() || 'Not provided';
  const text = [
    'A new Nobel ITBS contact submission was received.',
    '',
    `Type: ${input.type}`,
    `Website locale: ${input.locale}`,
    context,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${phone}`,
    '',
    'Message:',
    input.message,
    '',
    'Open the protected Nobel ITBS admin panel to process and archive this submission.',
  ].join('\n');

  try {
    return await sendGoogleWorkspaceMessage({
      to,
      replyTo: input.email,
      subject: `[Nobel ITBS] New ${input.type.replaceAll('_', ' ')}`,
      text,
    });
  } catch {
    return 'failed';
  }
}
