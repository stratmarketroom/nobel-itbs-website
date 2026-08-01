import type { Metadata } from 'next';
import { AboutPage } from '@/components/about-page';
import { aboutCopy } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'About Nobel ITBS | Professional Education in Europe',
  description:
    'Discover Nobel ITBS, a European professional education platform for adults and organisations offering its own and partner programmes, documents and online verification.',
  openGraph: {
    title: 'About Nobel ITBS',
    description: 'Professional education, partner programmes and document infrastructure in the European educational environment.',
  },
};

export default function AboutRoute() {
  return <AboutPage copy={aboutCopy.en} locale="en" />;
}
