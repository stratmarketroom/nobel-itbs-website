import { readCredentialObject } from '@/lib/credentials/admin-input';
import { assertKeys } from '@/lib/programmes/admin-input';
import { ApiError } from '@/lib/supabase/server';
import type { ResendCredentialInput } from '@/lib/credentials/resend-types';

function requiredText(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim()) throw new ApiError('bad_request', 400, `${field} is required.`);
  const normalized = value.trim();
  if (normalized.length > max) throw new ApiError('bad_request', 400, `${field} is too long.`);
  return normalized;
}

export async function readResendCredentialInput(request: Request): Promise<ResendCredentialInput> {
  const body = await readCredentialObject(request);
  assertKeys(body, ['recipientEmail', 'emailSubject', 'emailBody']);
  let recipientEmail: string | null = null;
  if (body.recipientEmail !== undefined && body.recipientEmail !== null && body.recipientEmail !== '') {
    if (typeof body.recipientEmail !== 'string') throw new ApiError('bad_request', 400, 'Recipient email is invalid.');
    recipientEmail = body.recipientEmail.trim().toLowerCase();
    if (recipientEmail.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      throw new ApiError('bad_request', 400, 'Enter a valid recipient email or leave it empty.');
    }
  }
  return {
    recipientEmail,
    subject: requiredText(body.emailSubject, 'Email subject', 180).replace(/[\r\n]+/g, ' '),
    body: requiredText(body.emailBody, 'Email body', 20000),
  };
}
