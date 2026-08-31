import type { MetadataRoute } from 'next';
import { absolutePublicUrl } from '@/lib/seo/urls';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: ['/admin', '/admin/', '/api', '/api/'],
    },
    sitemap: absolutePublicUrl('/sitemap.xml'),
  };
}
