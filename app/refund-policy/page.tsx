import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { getLegalPageCopy } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Refund Policy | Nobel ITBS',
  description: 'Rules for withdrawal, complaints, and refunds for Nobel ITBS online programmes.',
  robots: { index: false, follow: true },
};

export default function RefundPolicyPage() {
  return <LegalPage copy={getLegalPageCopy('en', 'refund-policy')} locale="en" />;
}
