import { PublicShell } from '@/components/public-shell';
import { homeCopy } from '@/lib/i18n';

export default function HomePage() {
  return <PublicShell copy={homeCopy.en} locale="en" />;
}
