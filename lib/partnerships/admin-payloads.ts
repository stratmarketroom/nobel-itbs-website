import { ApiError } from '@/lib/supabase/server';
import {
  assertKeys,
  assertNonempty,
  enumValue,
  nonnegativeInteger,
  nullableHttpsUrl,
  nullableText,
  programmeLocales,
  readObject,
  recordStatuses,
  slug,
  translationBase,
} from '@/lib/programmes/admin-input';

type Payload = Record<string, unknown>;

const partnerTypes = ['exclusive_academic_partner', 'partner_organisation'] as const;

export { readObject };

export function mutationPart(body: Payload): { kind: 'record' | 'translation'; value: Payload } {
  assertKeys(body, ['record', 'translation']);
  const hasRecord = 'record' in body;
  const hasTranslation = 'translation' in body;
  if (hasRecord === hasTranslation) throw new ApiError('bad_request', 400, 'Provide exactly one of record or translation.');
  const value = hasRecord ? body.record : body.translation;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError('bad_request', 400, 'Mutation payload must be a JSON object.');
  return { kind: hasRecord ? 'record' : 'translation', value: value as Payload };
}

function publicAssetPath(value: unknown, directory: 'partners' | 'experts', required: boolean): string | null {
  const path = nullableText(value, `${directory} asset path`, 500);
  if (!path && required) throw new ApiError('bad_request', 400, `A /${directory}/…webp asset path is required.`);
  if (path && !new RegExp(`^/${directory}/[a-z0-9-]+\\.webp$`).test(path)) {
    throw new ApiError('bad_request', 400, `Asset path must use /${directory}/file-name.webp.`);
  }
  return path;
}

export function partnerRecordPayload(body: Payload, partial: boolean): Payload {
  assertKeys(body, ['slug', 'partnerType', 'status', 'officialUrl', 'logoPath', 'sortOrder']);
  const result: Payload = {};
  if (!partial || 'slug' in body) result.slug = slug(body.slug);
  if (!partial || 'partnerType' in body) result.partner_type = enumValue(body.partnerType, partnerTypes, 'partner type');
  if ('status' in body) result.status = enumValue(body.status, recordStatuses, 'record status');
  if (!partial || 'officialUrl' in body) {
    const url = nullableHttpsUrl(body.officialUrl, 'Official URL');
    if (!url) throw new ApiError('bad_request', 400, 'Official URL is required.');
    result.official_url = url;
  }
  if (!partial || 'logoPath' in body) result.logo_path = publicAssetPath(body.logoPath, 'partners', true);
  if ('sortOrder' in body) result.sort_order = nonnegativeInteger(body.sortOrder, 'Sort order');
  if (result.partner_type === 'exclusive_academic_partner' && result.slug !== 'alfred-nobel-university') {
    throw new ApiError('bad_request', 400, 'Only Alfred Nobel University may be classified as the exclusive academic partner.');
  }
  if (partial) assertNonempty(result);
  return result;
}

export function expertRecordPayload(body: Payload, partial: boolean): Payload {
  assertKeys(body, ['slug', 'status', 'photoPath', 'sortOrder']);
  const result: Payload = {};
  if (!partial || 'slug' in body) result.slug = slug(body.slug);
  if ('status' in body) result.status = enumValue(body.status, recordStatuses, 'record status');
  if (!partial || 'photoPath' in body) result.photo_path = publicAssetPath(body.photoPath, 'experts', false);
  if ('sortOrder' in body) result.sort_order = nonnegativeInteger(body.sortOrder, 'Sort order');
  if (partial) assertNonempty(result);
  return result;
}

function localizedFields(body: Payload, foreignKey: string, foreignId: string, allowed: string[], mapping: Record<string, string>): Payload {
  assertKeys(body, ['languageCode', 'translationStatus', ...allowed]);
  const result = translationBase(body, foreignKey, foreignId);
  for (const [input, column] of Object.entries(mapping)) {
    if (input in body) result[column] = nullableText(body[input], input, 500);
  }
  return result;
}

export function partnerTranslationPayload(body: Payload, id: string): Payload {
  return localizedFields(body, 'partner_id', id, ['name', 'roleLabel', 'location', 'logoAlt'], {
    name: 'name', roleLabel: 'role_label', location: 'location', logoAlt: 'logo_alt',
  });
}

export function expertTranslationPayload(body: Payload, id: string): Payload {
  return localizedFields(body, 'expert_id', id, ['name', 'publicCategory', 'expertRole', 'photoAlt'], {
    name: 'name', publicCategory: 'public_category', expertRole: 'expert_role', photoAlt: 'photo_alt',
  });
}

export function locale(value: unknown): string {
  return enumValue(value, programmeLocales, 'language code');
}
