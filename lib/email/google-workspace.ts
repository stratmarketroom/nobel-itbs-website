import 'server-only';
import { createSign } from 'node:crypto';

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

function rawMessage(config: GoogleWorkspaceMailConfig, message: GoogleWorkspaceMessage): string {
  const to = safeMailbox(message.to);
  const replyTo = message.replyTo ? safeMailbox(message.replyTo) : null;
  const lines = [
    `From: Nobel ITBS <${config.delegatedUser}>`,
    `To: ${to}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: ${safeSubject(message.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    message.text,
  ];
  return base64Url(lines.join('\r\n'));
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
