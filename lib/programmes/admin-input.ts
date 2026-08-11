import { ApiError } from '@/lib/supabase/server';

export const recordStatuses = ['draft', 'published', 'archived'] as const;
export const translationStatuses = ['missing', 'draft', 'published'] as const;
export const programmeFormats = ['distance', 'blended_distance'] as const;
export const applicationProviders = ['leeloo', 'partner_site'] as const;
export const runStatuses = ['upcoming', 'open', 'ongoing', 'closed'] as const;
export const badgeOverrides = ['open', 'ongoing', 'coming_soon', 'inactive'] as const;
export const programmeLocales = ['en', 'ua', 'cz'] as const;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const languageCodePattern = /^[a-z]{2}$/;

export async function readObject(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError('bad_request', 400, 'A valid JSON object is required.');
  }
  return body as Record<string, unknown>;
}

export function assertUuid(value: string, label = 'ID'): string {
  if (!uuidPattern.test(value)) throw new ApiError('bad_request', 400, `Invalid ${label}.`);
  return value;
}

export function uuid(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new ApiError('bad_request', 400, `${label} is required.`);
  return assertUuid(value, label);
}

export function slug(value: unknown): string {
  if (typeof value !== 'string' || !slugPattern.test(value) || value.length > 160) {
    throw new ApiError('bad_request', 400, 'Slug must contain lowercase letters, numbers, and hyphens only.');
  }
  return value;
}

export function enumValue<T extends readonly string[]>(value: unknown, values: T, label: string): T[number] {
  if (typeof value !== 'string' || !values.includes(value)) {
    throw new ApiError('bad_request', 400, `Invalid ${label}.`);
  }
  return value as T[number];
}

export function nonnegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new ApiError('bad_request', 400, `${label} must be a non-negative integer.`);
  }
  return value as number;
}

export function booleanValue(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new ApiError('bad_request', 400, `${label} must be boolean.`);
  return value;
}

export function nullableText(value: unknown, label: string, maxLength = 10000): string | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new ApiError('bad_request', 400, `Invalid ${label}.`);
  }
  return value.trim() || null;
}

export function nullableHttpsUrl(value: unknown, label: string): string | null {
  const parsed = nullableText(value, label, 2000);
  if (parsed && !parsed.startsWith('https://')) {
    throw new ApiError('bad_request', 400, `${label} must be an HTTPS URL or null.`);
  }
  return parsed;
}

export function nullableDate(value: unknown, label: string): string | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !datePattern.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new ApiError('bad_request', 400, `${label} must use YYYY-MM-DD or be null.`);
  }
  return value;
}

export function nullablePrice(value: unknown): number | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 9999999999.99) {
    throw new ApiError('bad_request', 400, 'Price must be a non-negative number or null.');
  }
  return value;
}

export function nullableCurrency(value: unknown, price: number | null): string | null {
  if (price === null) {
    if (value !== null && value !== '' && value !== undefined) {
      throw new ApiError('bad_request', 400, 'Currency must be null when price is null.');
    }
    return null;
  }
  if (typeof value !== 'string' || !/^[A-Z]{3}$/.test(value)) {
    throw new ApiError('bad_request', 400, 'Currency must be a three-letter uppercase code when price is set.');
  }
  return value;
}

export function jsonObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('bad_request', 400, `${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

export function instructionLanguages(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || !languageCodePattern.test(item))) {
    throw new ApiError('bad_request', 400, 'Instruction languages must be a non-empty array of two-letter codes.');
  }
  return [...new Set(value as string[])];
}

export function assertKeys(body: Record<string, unknown>, allowed: readonly string[]): void {
  const unknown = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new ApiError('bad_request', 400, `Unsupported field: ${unknown[0]}.`);
}

export function assertNonempty(record: Record<string, unknown>): void {
  if (Object.keys(record).length === 0) throw new ApiError('bad_request', 400, 'At least one change is required.');
}

export function translationBase(body: Record<string, unknown>, foreignKey: string, foreignId: string) {
  const result: Record<string, unknown> = {
    [foreignKey]: foreignId,
    language_code: enumValue(body.languageCode, programmeLocales, 'language code'),
  };
  if ('translationStatus' in body) result.translation_status = enumValue(body.translationStatus, translationStatuses, 'translation status');
  return result;
}
