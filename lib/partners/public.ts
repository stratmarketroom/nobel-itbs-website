import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { ContentLocale, TranslationStatus } from '@/lib/content/localization';
import { selectPublishedTranslation } from '@/lib/content/localization';
import { contentDataSource, requireSupabaseContent } from '@/lib/content/data-source';
import { getSeedPartners } from './seed';
import type { PartnerCard, PartnerType, PublicPartnersResponse } from './types';

type DbTranslation = {
  language_code: ContentLocale;
  translation_status: TranslationStatus;
  name: string | null;
  role_label: string | null;
  location: string | null;
  logo_alt: string | null;
};

type DbPartner = {
  slug: string;
  partner_type: PartnerType;
  official_url: string;
  logo_path: string;
  partner_translations: DbTranslation[];
};

function projectPartner(partner: DbPartner, locale: ContentLocale): PartnerCard | null {
  const translation = selectPublishedTranslation(
    partner.partner_translations.map((item) => ({
      ...item,
      languageCode: item.language_code,
      translationStatus: item.translation_status,
    })),
    locale,
  );

  if (!translation?.name || !translation.role_label || !translation.logo_alt) return null;

  return {
    slug: partner.slug,
    type: partner.partner_type,
    name: translation.name,
    role: translation.role_label,
    location: translation.location,
    officialUrl: partner.official_url,
    logoPath: partner.logo_path,
    logoAlt: translation.logo_alt,
  };
}

async function loadFromSupabase(locale: ContentLocale): Promise<PartnerCard[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) },
  });

  try {
    const query = client
      .from('partners')
      .select(`
        slug,
        partner_type,
        official_url,
        logo_path,
        partner_translations (language_code, translation_status, name, role_label, location, logo_alt)
      `)
      .eq('status', 'published')
      .order('sort_order', { ascending: true });

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const result = await Promise.race([
      query,
      new Promise<null>((resolve) => { timeoutId = setTimeout(() => resolve(null), 9000); }),
    ]);
    if (timeoutId) clearTimeout(timeoutId);
    if (!result) return null;

    const { data, error } = result;
    if (error || !data) return null;

    return (data as unknown as DbPartner[])
      .map((partner) => projectPartner(partner, locale))
      .filter((partner): partner is PartnerCard => partner !== null);
  } catch {
    return null;
  }
}

export async function getPublicPartners(locale: ContentLocale): Promise<PublicPartnersResponse> {
  if (contentDataSource() === 'seed') return { locale, items: getSeedPartners(locale) };
  return { locale, items: requireSupabaseContent(await loadFromSupabase(locale), 'Partners') };
}
