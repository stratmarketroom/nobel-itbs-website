import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { getLegalPageCopy } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Terms of Use | Nobel ITBS',
  description: 'Terms governing the purchase and use of Nobel ITBS online educational programmes.',
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return <LegalPage copy={getLegalPageCopy('en', 'terms')} locale="en" />;
}
