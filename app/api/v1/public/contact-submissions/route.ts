import { createHmac } from 'node:crypto';
import { after, NextResponse } from 'next/server';
import { isContentLocale } from '@/lib/content/localization';
import {
  isProgrammeSlug,
  privacyPolicyPath,
  type ProgrammeQuestionInput,
  validateProgrammeQuestion,
} from '@/lib/contact/programme-question';
import {
  publicEnquiryTypes,
  type PublicEnquiryInput,
  validatePublicEnquiry,
} from '@/lib/contact/public-enquiry';
import { sendContactSubmissionNotification } from '@/lib/contact/notification';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

type PublicContactBody = Partial<Record<keyof ProgrammeQuestionInput | keyof PublicEnquiryInput, unknown>>;
type ParsedContact = { kind: 'programme'; input: ProgrammeQuestionInput } | { kind: 'public'; input: PublicEnquiryInput };

function response(body: unknown, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function clientAddress(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unavailable';
}

function rateKey(request: Request): string | null {
  const secret = process.env.CONTACT_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHmac('sha256', secret).update(clientAddress(request)).digest('hex');
}

async function captchaValid(token: string, request: Request): Promise<'valid' | 'required' | 'failed'> {
  const endpoint = process.env.CONTACT_CAPTCHA_VERIFY_URL;
  const secret = process.env.CONTACT_CAPTCHA_SECRET;
  if (!endpoint && !secret) return 'valid';
  if (!endpoint || !secret || !token) return 'required';

  try {
    const payload = new URLSearchParams({ secret, response: token, remoteip: clientAddress(request) });
    const result = await fetch(endpoint, { method: 'POST', body: payload, signal: AbortSignal.timeout(4000), cache: 'no-store' });
    if (!result.ok) return 'failed';
    const data = await result.json() as { success?: unknown };
    return data.success === true ? 'valid' : 'failed';
  } catch {
    return 'failed';
  }
}

function sharedFields(body: PublicContactBody) {
  return {
    name: typeof body.name === 'string' ? body.name : '',
    email: typeof body.email === 'string' ? body.email : '',
    phone: typeof body.phone === 'string' ? body.phone : '',
    message: typeof body.message === 'string' ? body.message : '',
    privacyAccepted: body.privacyAccepted === true,
    website: typeof body.website === 'string' ? body.website : '',
    captchaToken: typeof body.captchaToken === 'string' ? body.captchaToken : undefined,
  };
}

function parseBody(body: PublicContactBody): ParsedContact | null {
  if (typeof body.locale !== 'string' || !isContentLocale(body.locale)) return null;
  if (typeof body.programmeSlug === 'string' && isProgrammeSlug(body.programmeSlug)) {
    return { kind: 'programme', input: { programmeSlug: body.programmeSlug, locale: body.locale, ...sharedFields(body) } };
  }
  if (typeof body.type === 'string' && publicEnquiryTypes.includes(body.type as PublicEnquiryInput['type'])) {
    return { kind: 'public', input: { type: body.type as PublicEnquiryInput['type'], locale: body.locale, ...sharedFields(body) } };
  }
  return null;
}

export async function POST(request: Request) {
  let body: PublicContactBody;
  try {
    body = await request.json() as PublicContactBody;
  } catch {
    return response({ error: { code: 'invalid_request' } }, 400);
  }

  const parsed = parseBody(body);
  if (!parsed) return response({ error: { code: 'invalid_request' } }, 400);
  const input = parsed.input;
  if (input.website) return response({ ok: true }, 201);

  const errors = parsed.kind === 'programme' ? validateProgrammeQuestion(parsed.input) : validatePublicEnquiry(parsed.input);
  if (Object.keys(errors).length > 0) {
    return response({ error: { code: 'validation_error', fields: errors } }, 400);
  }

  const captcha = await captchaValid(input.captchaToken ?? '', request);
  if (captcha !== 'valid') return response({ error: { code: captcha === 'required' ? 'captcha_required' : 'captcha_failed' } }, 400);

  const requestRateKey = rateKey(request);
  if (!requestRateKey) return response({ error: { code: 'temporary_error' } }, 503);

  try {
    const commonParameters = {
      p_name: input.name.trim(), p_email: input.email.trim().toLowerCase(), p_phone: input.phone.trim(),
      p_message: input.message.trim(), p_language_code: input.locale, p_rate_key: requestRateKey,
      p_privacy_notice_path: privacyPolicyPath(input.locale),
    };
    const { error } = parsed.kind === 'programme'
      ? await getSupabaseAdminClient().rpc('create_programme_question_submission', { p_programme_slug: parsed.input.programmeSlug, ...commonParameters })
      : await getSupabaseAdminClient().rpc('create_public_contact_submission', { p_type: parsed.input.type, ...commonParameters });

    if (error) {
      if (error.message.includes('CONTACT_RATE_LIMITED')) {
        return response({ error: { code: 'rate_limited' } }, 429, { 'Retry-After': '900' });
      }
      if (parsed.kind === 'programme' && error.message.includes('PROGRAMME_NOT_FOUND')) return response({ error: { code: 'programme_not_found' } }, 404);
      return response({ error: { code: 'temporary_error' } }, 503);
    }

    after(async () => {
      await sendContactSubmissionNotification({
        type: parsed.kind === 'programme' ? 'programme_question' : parsed.input.type,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        message: input.message.trim(),
        locale: input.locale,
        programmeSlug: parsed.kind === 'programme' ? parsed.input.programmeSlug : undefined,
      });
    });

    return response({ ok: true }, 201);
  } catch {
    return response({ error: { code: 'temporary_error' } }, 503);
  }
}
