import 'server-only';

type ContactNotificationInput = {
  type: 'general' | 'programme_question' | 'partner_enquiry' | 'organisation_enquiry';
  locale: string;
  programmeSlug?: string;
  submittedAt: string;
};

export type ContactNotificationResult = 'sent' | 'not_configured' | 'failed';

type TelegramNotificationConfig = {
  botToken: string;
  chatId: string;
  adminUrl: string;
};

function telegramNotificationConfig(): TelegramNotificationConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? '';
  const chatId = process.env.TELEGRAM_CONTACT_CHAT_ID?.trim() ?? '';
  const adminBaseUrl = process.env.ADMIN_BASE_URL?.trim() ?? '';

  if (!botToken && !chatId && !adminBaseUrl) return null;
  if (!botToken || !chatId || !adminBaseUrl) throw new Error('Incomplete Telegram notification configuration.');
  if (!/^\d{6,20}:[A-Za-z0-9_-]{20,200}$/.test(botToken)) throw new Error('Invalid Telegram bot token.');
  if (!/^-?\d{1,20}$/.test(chatId)) throw new Error('Invalid Telegram chat ID.');

  const baseUrl = new URL(adminBaseUrl);
  if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password) {
    throw new Error('Invalid admin base URL.');
  }

  return {
    botToken,
    chatId,
    adminUrl: new URL('/admin/contact-submissions', baseUrl.origin).toString(),
  };
}

function notificationText(input: ContactNotificationInput, adminUrl: string): string {
  const programme = input.programmeSlug ?? 'not applicable';
  return [
    'New Nobel ITBS contact submission',
    '',
    `Type: ${input.type}`,
    `Website locale: ${input.locale}`,
    `Programme: ${programme}`,
    `Received: ${input.submittedAt}`,
    `Admin: ${adminUrl}`,
  ].join('\n');
}

export async function sendContactSubmissionNotification(
  input: ContactNotificationInput,
): Promise<ContactNotificationResult> {
  try {
    const config = telegramNotificationConfig();
    if (!config) return 'not_configured';

    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: notificationText(input, config.adminUrl),
        disable_web_page_preview: true,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    const result = await response.json().catch(() => null) as { ok?: unknown } | null;
    return response.ok && result?.ok === true ? 'sent' : 'failed';
  } catch {
    return 'failed';
  }
}
