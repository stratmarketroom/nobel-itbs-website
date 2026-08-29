import { readObject } from '@/lib/learners/admin-input';
import { assertKeys } from '@/lib/programmes/admin-input';
import { ApiError } from '@/lib/supabase/server';
import type { EmailTemplateUpdate } from './types';

function requiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError('bad_request', 400, `${field} is required.`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ApiError('bad_request', 400, `${field} is too long.`);
  }
  return normalized;
}

export async function readEmailTemplateUpdate(request: Request): Promise<EmailTemplateUpdate> {
  const body = await readObject(request);
  assertKeys(body, ['subject', 'body']);
  const subject = requiredText(body.subject, 'Email subject', 180);
  if (/[\r\n]/.test(subject)) {
    throw new ApiError('bad_request', 400, 'Email subject must stay on one line.');
  }
  return {
    subject,
    body: requiredText(body.body, 'Email body', 20000),
  };
}
