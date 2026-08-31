import type { Metadata } from 'next';
import type { ContentLocale } from '@/lib/content/localization';
import type { ProgrammeNamespaceEntity } from '@/lib/programmes/landing-types';
import { absolutePublicUrl, seoLocaleConfig } from './urls';

const imageDirectory = '/brand/social';

export const socialImagePaths = {
  institutional: `${imageDirectory}/institutional-1200x630.png`,
  catalogue: `${imageDirectory}/catalogue-1200x630.png`,
  programmeFormat: `${imageDirectory}/programme-format-1200x630.png`,
  verify: `${imageDirectory}/verify-1200x630.png`,
} as const;

const programmeImagePaths: Record<string, string> = {
  'business-management': `${imageDirectory}/area-business-management-1200x630.png`,
  'technology-innovation': `${imageDirectory}/area-technology-innovation-1200x630.png`,
  'psychology-human': `${imageDirectory}/area-psychology-human-1200x630.png`,
  'certificate-programme': socialImagePaths.programmeFormat,
  'mini-mba': socialImagePaths.programmeFormat,
  'professional-development-course': socialImagePaths.programmeFormat,
  'ai-production': `${imageDirectory}/programme-ai-production-1200x630.png`,
  'general-psychology': `${imageDirectory}/programme-general-psychology-1200x630.png`,
  'child-psychology': `${imageDirectory}/programme-child-psychology-1200x630.png`,
  'neuroplastic-reconstruction': `${imageDirectory}/programme-neuroplastic-reconstruction-1200x630.png`,
  'space-business': `${imageDirectory}/programme-space-business-1200x630.png`,
};

const institutionalAlt: Record<ContentLocale, string> = {
  en: 'Nobel ITBS professional education',
  ua: 'Професійна освіта Nobel ITBS',
  cz: 'Profesní vzdělávání Nobel ITBS',
};

const catalogueAlt: Record<ContentLocale, string> = {
  en: 'Nobel ITBS professional programme catalogue',
  ua: 'Каталог професійних програм Nobel ITBS',
  cz: 'Katalog profesních programů Nobel ITBS',
};

const verificationAlt: Record<ContentLocale, string> = {
  en: 'Nobel ITBS document verification',
  ua: 'Перевірка документів Nobel ITBS',
  cz: 'Ověření dokumentů Nobel ITBS',
};

export function getInstitutionalSocialAlt(locale: ContentLocale): string {
  return institutionalAlt[locale];
}

export function getCatalogueSocialAlt(locale: ContentLocale): string {
  return catalogueAlt[locale];
}

export function getVerificationSocialAlt(locale: ContentLocale): string {
  return verificationAlt[locale];
}

export function getProgrammeSocialAlt(locale: ContentLocale, title: string): string {
  if (locale === 'ua') return `Програма ${title} у Nobel ITBS`;
  if (locale === 'cz') return `Program ${title} v Nobel ITBS`;
  return `${title} programme at Nobel ITBS`;
}

export function programmeSocialImagePath(entity: ProgrammeNamespaceEntity): string {
  return programmeImagePaths[entity.slug] ?? socialImagePaths.programmeFormat;
}

type SocialMetadataInput = {
  title: string;
  description: string;
  canonical: string;
  locale: ContentLocale;
  imagePath: string;
  imageAlt: string;
  publishedLocales?: readonly ContentLocale[];
};

export function createSocialMetadata({
  title,
  description,
  canonical,
  locale,
  imagePath,
  imageAlt,
  publishedLocales = ['en', 'ua', 'cz'],
}: SocialMetadataInput): Pick<Metadata, 'openGraph' | 'twitter'> {
  const image = {
    url: absolutePublicUrl(imagePath),
    width: 1200,
    height: 630,
    alt: imageAlt,
    type: 'image/png',
  };

  return {
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: 'Nobel ITBS',
      locale: seoLocaleConfig[locale].openGraphLocale,
      alternateLocale: publishedLocales
        .filter((publishedLocale) => publishedLocale !== locale)
        .map((publishedLocale) => seoLocaleConfig[publishedLocale].openGraphLocale),
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
