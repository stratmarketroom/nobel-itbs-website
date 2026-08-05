import { PublicShell } from '@/components/public-shell';
import { homeCopy } from '@/lib/i18n';
import { getPublicPartners } from '@/lib/partners/public';

export default async function HomePage() {
  const partners = await getPublicPartners('en');
  return <PublicShell copy={homeCopy.en} locale="en" partners={partners.items} />;
}
