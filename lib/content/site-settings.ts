import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { AdminContext } from '@/lib/supabase/server';
import { ApiError, assertCanManageSiteSettings, getSupabaseRequestClient } from '@/lib/supabase/server';
import { contentDataSource, requireSupabaseContent } from './data-source';

export const forOrganisationsSettingKey = 'for_organisations_application_url';
export type SiteSetting = { setting_key: string; value_text: string | null; description: string; updated_at: string };

export async function getForOrganisationsApplicationUrl(): Promise<string | null> {
  if (contentDataSource() === 'seed') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return requireSupabaseContent<string | null>(undefined, 'Site settings');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.from('site_settings').select('value_text').eq('setting_key', forOrganisationsSettingKey).eq('is_public', true).maybeSingle();
  if (error) return requireSupabaseContent<string | null>(undefined, 'Site settings');
  return data?.value_text ?? null;
}

export async function getAdminSiteSetting(context: AdminContext): Promise<SiteSetting> {
  assertCanManageSiteSettings(context);
  const { data, error } = await getSupabaseRequestClient(context.accessToken).from('site_settings').select('setting_key,value_text,description,updated_at').eq('setting_key', forOrganisationsSettingKey).single();
  if (error || !data) throw new ApiError('server_error', 500, 'Site setting could not be loaded.');
  return data as SiteSetting;
}

export async function updateForOrganisationsApplicationUrl(context: AdminContext, value: string | null): Promise<SiteSetting> {
  assertCanManageSiteSettings(context);
  const { data, error } = await getSupabaseRequestClient(context.accessToken).from('site_settings').update({ value_text: value }).eq('setting_key', forOrganisationsSettingKey).select('setting_key,value_text,description,updated_at').single();
  if (error || !data) throw new ApiError('bad_request', 400, 'Site setting could not be updated. Use a valid HTTPS URL.');
  return data as SiteSetting;
}
