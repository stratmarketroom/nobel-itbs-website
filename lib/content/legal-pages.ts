import type { Metadata } from 'next';
import type { ContentPageKey, StructuredContentPage } from './pages';
import { createSocialMetadata, getInstitutionalSocialAlt, socialImagePaths } from '@/lib/seo/social';
import { localizedAbsoluteUrl } from '@/lib/seo/urls';

export type LegalPageKey = Extract<ContentPageKey, 'privacy_policy' | 'terms_of_use' | 'refund_policy'>;
export const legalSlugs: Record<LegalPageKey, string> = { privacy_policy: 'privacy-policy', terms_of_use: 'terms-of-use', refund_policy: 'refund-policy' };
export function legalMetadata(page: StructuredContentPage): Metadata {
  const slug = legalSlugs[page.pageKey as LegalPageKey];
  const canonical = localizedAbsoluteUrl(page.renderedLocale, `/${slug}`);
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    ...createSocialMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      canonical,
      locale: page.renderedLocale,
      imagePath: socialImagePaths.institutional,
      imageAlt: getInstitutionalSocialAlt(page.renderedLocale),
      publishedLocales: [page.renderedLocale],
    }),
    robots: { index: false, follow: true },
    alternates: { canonical },
  };
}
