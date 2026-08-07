import { ApiError } from '@/lib/supabase/server';
import { assertKeys, assertNonempty, assertUuid } from '@/lib/programmes/admin-input';

type Payload = Record<string, unknown>;

export { assertUuid };

export async function readObject(request: Request): Promise<Payload> {
  let value: unknown;
  try { value = await request.json(); } catch { throw new ApiError('bad_request', 400, 'Request body must be valid JSON.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError('bad_request', 400, 'Request body must be a JSON object.');
  return value as Payload;
}

function requiredText(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim()) throw new ApiError('bad_request', 400, `${field} is required.`);
  const result = value.trim();
  if (result.length > max) throw new ApiError('bad_request', 400, `${field} is too long.`);
  return result;
}

function optionalText(value: unknown, field: string, max: number): string | null {
  if (value === null || value === undefined || value === '') return null;
  return requiredText(value, field, max);
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new ApiError('bad_request', 400, `${field} must be true or false.`);
  return value;
}

export function learnerProfilePayload(body: Payload, partial: boolean): Payload {
  assertKeys(body, ['latinFirstName', 'latinLastName', 'ukrainianFullName', 'internalNote', 'archived']);
  const result: Payload = {};
  if (!partial || 'latinFirstName' in body) result.latin_first_name = requiredText(body.latinFirstName, 'Latin first name', 160);
  if (!partial || 'latinLastName' in body) result.latin_last_name = requiredText(body.latinLastName, 'Latin last name', 160);
  if (!partial || 'ukrainianFullName' in body) result.ukrainian_full_name = requiredText(body.ukrainianFullName, 'Ukrainian full name', 320);
  if (!partial || 'internalNote' in body) result.internal_note = optionalText(body.internalNote, 'Internal note', 4000);
  if ('archived' in body) result.archived_at = booleanValue(body.archived, 'Archived') ? new Date().toISOString() : null;
  if (partial) assertNonempty(result);
  return result;
}

export function emailPayload(body: Payload, partial: boolean): Payload {
  assertKeys(body, ['email', 'isPrimary']);
  const result: Payload = {};
  if (!partial || 'email' in body) {
    const email = requiredText(body.email, 'Email', 320).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('bad_request', 400, 'Enter a valid email address.');
    result.email = email;
  }
  if ('isPrimary' in body) result.is_primary = booleanValue(body.isPrimary, 'Primary email');
  if (partial) assertNonempty(result);
  return result;
}

function canonicalPhone(value: unknown): string {
  const entered = requiredText(value, 'Phone', 40);
  const compact = entered.replace(/[\s().-]/g, '');
  const result = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;
  if (!/^\+[1-9][0-9]{6,14}$/.test(result)) throw new ApiError('bad_request', 400, 'Use an international phone number, for example +420123456789.');
  return result;
}

export function phonePayload(body: Payload, partial: boolean): Payload {
  assertKeys(body, ['phone', 'hasTelegram', 'telegramUsername', 'hasViber', 'hasWhatsapp', 'isPrimary']);
  const result: Payload = {};
  if (!partial || 'phone' in body) result.phone = canonicalPhone(body.phone);
  if (!partial || 'hasTelegram' in body) result.has_telegram = 'hasTelegram' in body ? booleanValue(body.hasTelegram, 'Telegram') : false;
  if (!partial || 'telegramUsername' in body) {
    const username = optionalText(body.telegramUsername, 'Telegram username', 64);
    result.telegram_username = username?.replace(/^@/, '') ?? null;
  }
  if (!partial || 'hasViber' in body) result.has_viber = 'hasViber' in body ? booleanValue(body.hasViber, 'Viber') : false;
  if (!partial || 'hasWhatsapp' in body) result.has_whatsapp = 'hasWhatsapp' in body ? booleanValue(body.hasWhatsapp, 'WhatsApp') : false;
  if ('isPrimary' in body) result.is_primary = booleanValue(body.isPrimary, 'Primary phone');
  const telegramEnabled = result.has_telegram ?? body.hasTelegram;
  if (result.telegram_username && telegramEnabled === false) throw new ApiError('bad_request', 400, 'Enable Telegram before adding a Telegram username.');
  if (partial) assertNonempty(result);
  return result;
}
