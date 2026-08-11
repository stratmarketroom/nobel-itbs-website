import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { ContentLocale, TranslationStatus } from '@/lib/content/localization';
import { selectPublishedTranslation } from '@/lib/content/localization';
import { contentDataSource, requireSupabaseContent } from '@/lib/content/data-source';
import { getSeedExperts } from './seed';
import type { ExpertCard, PublicExpertsResponse } from './types';

type DbTranslation = {
  language_code: ContentLocale;
  translation_status: TranslationStatus;
  name: string | null;
  public_category: string | null;
  expert_role: string | null;
  photo_alt: string | null;
};

type DbExpert = {
  slug: string;
  photo_path: string | null;
  expert_translations: DbTranslation[];
};

function projectExpert(expert: DbExpert, locale: ContentLocale): ExpertCard | null {
  const translation = selectPublishedTranslation(
    expert.expert_translations.map((item) => ({
      ...item,
      languageCode: item.language_code,
      translationStatus: item.translation_status,
    })),
    locale,
  );

  if (!translation?.name || !translation.public_category || !translation.expert_role) return null;

  return {
    slug: expert.slug,
    name: translation.name,
    category: translation.public_category,
    role: translation.expert_role,
    photoPath: expert.photo_path,
    photoAlt: translation.photo_alt,
  };
}

async function loadFromSupabase(locale: ContentLocale): Promise<ExpertCard[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) },
  });

  try {
    const query = client
      .from('experts')
      .select(`
        slug,
        photo_path,
        expert_translations (language_code, translation_status, name, public_category, expert_role, photo_alt)
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

    return (data as unknown as DbExpert[])
      .map((expert) => projectExpert(expert, locale))
      .filter((expert): expert is ExpertCard => expert !== null);
  } catch {
    return null;
  }
}

export async function getPublicExperts(locale: ContentLocale): Promise<PublicExpertsResponse> {
  if (contentDataSource() === 'seed') return { locale, items: getSeedExperts(locale) };
  return { locale, items: requireSupabaseContent(await loadFromSupabase(locale), 'Experts') };
}
