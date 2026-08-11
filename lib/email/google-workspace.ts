import 'server-only';
import { createSign, randomBytes } from 'node:crypto';

const googleTokenEndpoint = 'https://oauth2.googleapis.com/token';
const gmailSendScope = 'https://www.googleapis.com/auth/gmail.send';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type GoogleWorkspaceMailConfig = {
  serviceAccountEmail: string;
  privateKey: string;
  delegatedUser: string;
};

export type GoogleWorkspaceMessage = {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  attachments?: Array<{
    filename: string;
    contentType: 'application/pdf';
    content: Buffer;
  }>;
};

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function mailConfig(): GoogleWorkspaceMailConfig | null {
  const serviceAccountEmail = process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_WORKSPACE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  const delegatedUser = process.env.GOOGLE_WORKSPACE_DELEGATED_USER?.trim().toLowerCase();

  if (!serviceAccountEmail && !privateKey && !delegatedUser) return null;
  if (
    !serviceAccountEmail || !privateKey || !delegatedUser
    || !emailPattern.test(serviceAccountEmail) || !emailPattern.test(delegatedUser)
  ) {
    throw new Error('Google Workspace email configuration is incomplete.');
  }

  return { serviceAccountEmail, privateKey, delegatedUser };
}

function safeMailbox(value: string): string {
  const mailbox = value.trim().toLowerCase();
  if (!emailPattern.test(mailbox) || /[\r\n]/.test(mailbox)) throw new Error('Invalid email mailbox.');
  return mailbox;
}

function safeSubject(value: string): string {
  const subject = value.replace(/[\r\n]+/g, ' ').trim();
  if (!subject || subject.length > 180) throw new Error('Invalid email subject.');
  return subject;
}

function serviceAccountAssertion(config: GoogleWorkspaceMailConfig): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: config.serviceAccountEmail,
    sub: config.delegatedUser,
    scope: gmailSendScope,
    aud: googleTokenEndpoint,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${signer.sign(config.privateKey).toString('base64url')}`;
}

async function accessToken(config: GoogleWorkspaceMailConfig): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: serviceAccountAssertion(config),
  });
  const response = await fetch(googleTokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  const payload = await response.json().catch(() => null) as { access_token?: unknown } | null;
  if (!response.ok || typeof payload?.access_token !== 'string') {
    throw new Error('Google Workspace access token request failed.');
  }
  return payload.access_token;
}

function encodedHeader(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function base64Lines(value: Buffer): string {
  return value.toString('base64').match(/.{1,76}/g)?.join('\r\n') ?? '';
}

function safeFilename(value: string): { ascii: string; encoded: string } {
  const normalized = value.replace(/[\r\n/\\]/g, '-').trim().slice(0, 180) || 'credential-document.pdf';
  const pdfName = normalized.toLowerCase().endsWith('.pdf') ? normalized : `${normalized}.pdf`;
  const ascii = pdfName.replace(/[^A-Za-z0-9._ -]/g, '_');
  return { ascii, encoded: encodeURIComponent(pdfName) };
}

function rawMessage(config: GoogleWorkspaceMailConfig, message: GoogleWorkspaceMessage): string {
  const to = safeMailbox(message.to);
  const replyTo = message.replyTo ? safeMailbox(message.replyTo) : null;
  const subject = safeSubject(message.subject);
  const boundary = `nobel-itbs-${randomBytes(12).toString('hex')}`;
  const lines = [
    `From: Nobel ITBS <${config.delegatedUser}>`,
    `To: ${to}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: ${encodedHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(Buffer.from(message.text, 'utf8')),
    ...(message.attachments ?? []).flatMap((attachment) => {
      const filename = safeFilename(attachment.filename);
      return [
        `--${boundary}`,
        `Content-Type: ${attachment.contentType}; name="${filename.ascii}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${filename.ascii}"; filename*=UTF-8''${filename.encoded}`,
        '',
        base64Lines(attachment.content),
      ];
    }),
    `--${boundary}--`,
    '',
  ];
  return base64Url(lines.join('\r\n'));
}

export function isGoogleWorkspaceConfigured(): boolean {
  return mailConfig() !== null;
}

export async function sendGoogleWorkspaceMessage(message: GoogleWorkspaceMessage): Promise<'sent' | 'not_configured'> {
  const config = mailConfig();
  if (!config) return 'not_configured';

  const token = await accessToken(config);
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawMessage(config, message) }),
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) throw new Error('Google Workspace message send failed.');
  return 'sent';
}
