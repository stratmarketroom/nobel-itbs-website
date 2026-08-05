const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type RedirectRow = { new_slug?: unknown };

export async function getProgrammeSlugRedirect(
  oldSlug: string,
  timeoutMs = 900,
): Promise<string | null> {
  if (!slugPattern.test(oldSlug)) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  try {
    const endpoint = new URL('/rest/v1/programme_slug_redirects', supabaseUrl);
    endpoint.searchParams.set('select', 'new_slug');
    endpoint.searchParams.set('old_slug', `eq.${oldSlug}`);
    endpoint.searchParams.set('limit', '1');

    const response = await fetch(endpoint, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const rows = await response.json() as RedirectRow[];
    const newSlug = rows[0]?.new_slug;
    return typeof newSlug === 'string' && slugPattern.test(newSlug) && newSlug !== oldSlug
      ? newSlug
      : null;
  } catch {
    return null;
  }
}
