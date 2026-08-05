import 'server-only';

export type ContentDataSource = 'supabase' | 'seed';

export function contentDataSource(): ContentDataSource {
  const configured = process.env.CONTENT_DATA_SOURCE?.trim().toLowerCase();

  if (!configured || configured === 'supabase') return 'supabase';
  if (configured === 'seed') return 'seed';

  throw new Error('CONTENT_DATA_SOURCE must be either "supabase" or "seed".');
}

export function requireSupabaseContent<T>(value: T | null, label: string): T {
  if (value !== null) return value;
  throw new Error(`${label} could not be loaded from Supabase.`);
}
