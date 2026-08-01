import type { Metadata } from 'next';
import { ProgrammeCatalogue } from '@/components/programme-catalogue';
import { catalogueCopy } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Professional Programmes | Nobel ITBS',
  description:
    'Explore Nobel ITBS professional programmes in business, technology, and psychology, including distance courses, certificate programmes, and Mini-MBA study.',
};

export default function ProgrammesPage() {
  return <ProgrammeCatalogue copy={catalogueCopy.en} locale="en" />;
}
