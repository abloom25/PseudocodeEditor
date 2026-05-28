import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const siteUrl = 'https://pseudocode.site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date('2026-05-28'),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
