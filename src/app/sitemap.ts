import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const siteUrl = 'https://pseudocode.site';
const lastModified = new Date('2026-06-08');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/guides/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/guides/igcse-0478/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/guides/alevel-9618/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];
}
