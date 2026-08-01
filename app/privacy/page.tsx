import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { getLegalPageCopy } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Privacy Policy | Nobel ITBS',
  description: 'How Nobel ITBS processes and protects personal data.',
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return <LegalPage copy={getLegalPageCopy('en', 'privacy')} locale="en" />;
}
