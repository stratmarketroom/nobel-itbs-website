import type { Metadata } from 'next';
import { PartnershipsPage } from '@/components/partnerships-page';
import { partnershipsCopy } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Nobel ITBS Partnerships | Education and Expertise',
  description: 'Nobel ITBS partnership models for educational organisations, online schools, experts and authors of professional programmes.',
  openGraph: {
    title: 'Nobel ITBS Partnerships',
    description: 'Bringing together educational expertise, original programmes and infrastructure to create clear professional outcomes.',
  },
};

export default function PartnershipsRoute() {
  return <PartnershipsPage copy={partnershipsCopy.en} locale="en" />;
}
