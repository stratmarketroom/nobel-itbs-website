import { ApiError } from '@/lib/supabase/server';
import {
  applicationProviders,
  assertKeys,
  assertNonempty,
  badgeOverrides,
  booleanValue,
  enumValue,
  instructionLanguages,
  jsonObject,
  nonnegativeInteger,
  nullableCurrency,
  nullableDate,
  nullableHttpsUrl,
  nullablePrice,
  nullableText,
  programmeFormats,
  recordStatuses,
  runStatuses,
  slug,
  translationBase,
  uuid,
} from './admin-input';

type Payload = Record<string, unknown>;

export function mutationPart(body: Payload): { kind: 'record' | 'translation'; value: Payload } {
  assertKeys(body, ['record', 'translation']);
  const hasRecord = 'record' in body;
  const hasTranslation = 'translation' in body;
  if (hasRecord === hasTranslation) {
    throw new ApiError('bad_request', 400, 'Provide exactly one of record or translation.');
  }
  const value = hasRecord ? body.record : body.translation;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('bad_request', 400, 'Mutation payload must be a JSON object.');
  }
  return { kind: hasRecord ? 'record' : 'translation', value: value as Payload };
}

function coreTaxonomyPayload(body: Payload, partial: boolean): Payload {
  assertKeys(body, ['slug', 'status', 'sortOrder']);
  const result: Payload = {};
  if (!partial || 'slug' in body) result.slug = slug(body.slug);
  if ('status' in body) result.status = enumValue(body.status, recordStatuses, 'record status');
  if ('sortOrder' in body) result.sort_order = nonnegativeInteger(body.sortOrder, 'Sort order');
  if (partial) assertNonempty(result);
  return result;
}

export const areaRecordPayload = coreTaxonomyPayload;
export const typeRecordPayload = coreTaxonomyPayload;

function textFields(body: Payload, result: Payload, fields: Record<string, string>, maxLength = 10000): void {
  for (const [inputKey, databaseKey] of Object.entries(fields)) {
    if (inputKey in body) result[databaseKey] = nullableText(body[inputKey], inputKey, maxLength);
  }
}

export function areaTranslationPayload(body: Payload, id: string): Payload {
  assertKeys(body, ['languageCode', 'translationStatus', 'title', 'shortDescription', 'introContent', 'sections', 'seoTitle', 'seoDescription', 'ogTitle', 'ogDescription']);
  const result = translationBase(body, 'area_id', id);
  textFields(body, result, { title: 'title', shortDescription: 'short_description', introContent: 'intro_content', seoTitle: 'seo_title', seoDescription: 'seo_description', ogTitle: 'og_title', ogDescription: 'og_description' });
  if ('sections' in body) result.sections = jsonObject(body.sections, 'Sections');
  return result;
}

export function typeTranslationPayload(body: Payload, id: string): Payload {
  assertKeys(body, ['languageCode', 'translationStatus', 'title', 'landingTitle', 'shortDescription', 'introContent', 'sections', 'seoTitle', 'seoDescription', 'ogTitle', 'ogDescription']);
  const result = translationBase(body, 'type_id', id);
  textFields(body, result, { title: 'title', landingTitle: 'landing_title', shortDescription: 'short_description', introContent: 'intro_content', seoTitle: 'seo_title', seoDescription: 'seo_description', ogTitle: 'og_title', ogDescription: 'og_description' });
  if ('sections' in body) result.sections = jsonObject(body.sections, 'Sections');
  return result;
}

export function programmeRecordPayload(body: Payload, partial: boolean): Payload {
  assertKeys(body, ['areaId', 'typeId', 'slug', 'publicationStatus', 'format', 'applicationProvider', 'applicationUrl', 'enrolmentBadgeOverride', 'featured', 'catalogueSortOrder', 'instructionLanguageCodes']);
  const result: Payload = {};
  if (!partial || 'areaId' in body) result.area_id = uuid(body.areaId, 'Area ID');
  if (!partial || 'typeId' in body) result.type_id = uuid(body.typeId, 'Type ID');
  if (!partial || 'slug' in body) result.slug = slug(body.slug);
  if ('publicationStatus' in body) result.publication_status = enumValue(body.publicationStatus, recordStatuses, 'publication status');
  if (!partial || 'format' in body) result.format = enumValue(body.format, programmeFormats, 'programme format');
  if (!partial || 'applicationProvider' in body) result.application_provider = enumValue(body.applicationProvider, applicationProviders, 'application provider');
  if ('applicationUrl' in body) result.application_url = nullableHttpsUrl(body.applicationUrl, 'Application URL');
  if ('enrolmentBadgeOverride' in body) {
    result.enrolment_badge_override = body.enrolmentBadgeOverride === null || body.enrolmentBadgeOverride === ''
      ? null
      : enumValue(body.enrolmentBadgeOverride, badgeOverrides, 'enrolment badge override');
  }
  if ('featured' in body) result.featured = booleanValue(body.featured, 'Featured');
  if ('catalogueSortOrder' in body) result.catalogue_sort_order = nonnegativeInteger(body.catalogueSortOrder, 'Catalogue sort order');
  if ('instructionLanguageCodes' in body) result.instruction_language_codes = instructionLanguages(body.instructionLanguageCodes);
  if (partial) assertNonempty(result);
  return result;
}

export function programmeTranslationPayload(body: Payload, id: string): Payload {
  assertKeys(body, ['languageCode', 'translationStatus', 'title', 'summary', 'heroCopy', 'catalogueDescription', 'catalogueFacts', 'catalogueDocumentSummary', 'sections', 'seoTitle', 'seoDescription', 'ogTitle', 'ogDescription']);
  const result = translationBase(body, 'programme_id', id);
  textFields(body, result, { title: 'title', summary: 'summary', heroCopy: 'hero_copy', catalogueDescription: 'catalogue_description', catalogueFacts: 'catalogue_facts', catalogueDocumentSummary: 'catalogue_document_summary', seoTitle: 'seo_title', seoDescription: 'seo_description', ogTitle: 'og_title', ogDescription: 'og_description' });
  if ('sections' in body) result.sections = jsonObject(body.sections, 'Sections');
  return result;
}

export function runRecordPayload(body: Payload, partial: boolean): Payload {
  assertKeys(body, ['programmeId', 'status', 'startsAt', 'endsAt', 'applicationUrl']);
  const result: Payload = {};
  if (!partial || 'programmeId' in body) result.programme_id = uuid(body.programmeId, 'Programme ID');
  if ('status' in body) result.status = enumValue(body.status, runStatuses, 'run status');
  if ('startsAt' in body) result.starts_at = nullableDate(body.startsAt, 'Start date');
  if ('endsAt' in body) result.ends_at = nullableDate(body.endsAt, 'End date');
  if ('applicationUrl' in body) result.application_url = nullableHttpsUrl(body.applicationUrl, 'Application URL');
  if (typeof result.starts_at === 'string' && typeof result.ends_at === 'string' && result.ends_at < result.starts_at) {
    throw new ApiError('bad_request', 400, 'End date cannot be before start date.');
  }
  if (partial) assertNonempty(result);
  return result;
}

export function pricingRecordPayload(body: Payload, partial: boolean): Payload {
  assertKeys(body, ['programmeId', 'price', 'currencyCode', 'applicationUrl', 'sortOrder', 'isActive']);
  const result: Payload = {};
  if (!partial || 'programmeId' in body) result.programme_id = uuid(body.programmeId, 'Programme ID');
  if ('price' in body || 'currencyCode' in body) {
    if (!('price' in body) || !('currencyCode' in body)) {
      throw new ApiError('bad_request', 400, 'Price and currencyCode must be provided together.');
    }
    const price = nullablePrice(body.price);
    result.price = price;
    result.currency_code = nullableCurrency(body.currencyCode, price);
  }
  if ('applicationUrl' in body) result.application_url = nullableHttpsUrl(body.applicationUrl, 'Application URL');
  if ('sortOrder' in body) result.sort_order = nonnegativeInteger(body.sortOrder, 'Sort order');
  if ('isActive' in body) result.is_active = booleanValue(body.isActive, 'Active status');
  if (partial) assertNonempty(result);
  return result;
}

export function pricingTranslationPayload(body: Payload, id: string): Payload {
  assertKeys(body, ['languageCode', 'translationStatus', 'title', 'description', 'ctaLabel']);
  const result = translationBase(body, 'pricing_option_id', id);
  textFields(body, result, { title: 'title', description: 'description', ctaLabel: 'cta_label' });
  return result;
}
