import 'server-only';
import nodemailer from 'nodemailer';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hostnamePattern = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const supportedPorts = new Set([465, 587]);

type CredentialSmtpConfig = {
  host: string;
  port: 465 | 587;
  secure: boolean;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  replyTo: string;
};

export type CredentialSmtpMessage = {
  to: string;
  subject: string;
  text: string;
  attachments: Array<{
    filename: string;
    contentType: 'application/pdf';
    content: Buffer;
  }>;
};

function safeMailbox(value: string, field: string): string {
  const mailbox = value.trim().toLowerCase();
  if (!emailPattern.test(mailbox) || /[\r\n]/.test(mailbox)) {
    throw new Error(`Credential SMTP ${field} is invalid.`);
  }
  return mailbox;
}

function safeHeaderText(value: string, field: string, maxLength: number): string {
  const text = value.replace(/[\r\n]+/g, ' ').trim();
  if (!text || text.length > maxLength) throw new Error(`Credential SMTP ${field} is invalid.`);
  return text;
}

function smtpConfig(): CredentialSmtpConfig | null {
  const values = {
    host: process.env.CREDENTIAL_SMTP_HOST?.trim().toLowerCase(),
    port: process.env.CREDENTIAL_SMTP_PORT?.trim(),
    secure: process.env.CREDENTIAL_SMTP_SECURE?.trim().toLowerCase(),
    username: process.env.CREDENTIAL_SMTP_USERNAME?.trim(),
    password: process.env.CREDENTIAL_SMTP_PASSWORD,
    fromAddress: process.env.CREDENTIAL_EMAIL_FROM?.trim(),
    fromName: process.env.CREDENTIAL_EMAIL_FROM_NAME?.trim(),
    replyTo: process.env.CREDENTIAL_EMAIL_REPLY_TO?.trim(),
  };

  if (Object.values(values).every((value) => !value)) return null;
  if (Object.values(values).some((value) => !value)) {
    throw new Error('Credential SMTP configuration is incomplete.');
  }

  const port = Number(values.port);
  if (!Number.isInteger(port) || !supportedPorts.has(port)) {
    throw new Error('Credential SMTP port must be 465 or 587.');
  }
  if (values.secure !== 'true' && values.secure !== 'false') {
    throw new Error('Credential SMTP secure mode must be true or false.');
  }
  const secure = values.secure === 'true';
  if ((port === 465) !== secure) {
    throw new Error('Credential SMTP port and secure mode do not match.');
  }
  if (!hostnamePattern.test(values.host as string) || !(values.host as string).endsWith('.wedos.net')) {
    throw new Error('Credential SMTP hostname is invalid.');
  }
  if (!(values.password as string).length || (values.password as string).length > 1_024 || /[\r\n]/.test(values.password as string)) {
    throw new Error('Credential SMTP password configuration is invalid.');
  }

  return {
    host: values.host as string,
    port: port as 465 | 587,
    secure,
    username: safeMailbox(values.username as string, 'username'),
    password: values.password as string,
    fromAddress: safeMailbox(values.fromAddress as string, 'sender'),
    fromName: safeHeaderText(values.fromName as string, 'sender name', 100),
    replyTo: safeMailbox(values.replyTo as string, 'reply-to'),
  };
}

function transport(config: CredentialSmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 20_000,
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
      servername: config.host,
    },
  });
}

export function isCredentialSmtpConfigured(): boolean {
  return smtpConfig() !== null;
}

export async function verifyCredentialSmtpConnection(): Promise<'verified' | 'not_configured'> {
  const config = smtpConfig();
  if (!config) return 'not_configured';
  const smtp = transport(config);
  try {
    await smtp.verify();
    return 'verified';
  } finally {
    smtp.close();
  }
}

export async function sendCredentialSmtpMessage(
  message: CredentialSmtpMessage,
): Promise<'sent' | 'not_configured'> {
  const config = smtpConfig();
  if (!config) return 'not_configured';
  const to = safeMailbox(message.to, 'recipient');
  const subject = safeHeaderText(message.subject, 'subject', 180);
  if (!message.text.trim() || message.text.length > 20_000) {
    throw new Error('Credential SMTP message body is invalid.');
  }
  if (message.attachments.length < 1) {
    throw new Error('Credential SMTP delivery requires at least one PDF attachment.');
  }

  const smtp = transport(config);
  try {
    const result = await smtp.sendMail({
      from: { name: config.fromName, address: config.fromAddress },
      replyTo: config.replyTo,
      to,
      subject,
      text: message.text,
      attachments: message.attachments,
    });
    const accepted = result.accepted.map(String).map((mailbox) => mailbox.toLowerCase());
    if (!accepted.includes(to) || result.rejected.length > 0) {
      throw new Error('Credential SMTP server did not accept the recipient.');
    }
    return 'sent';
  } finally {
    smtp.close();
  }
}
