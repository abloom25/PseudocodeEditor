import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pseudocode Editor for Cambridge Computer Science',
    short_name: 'Pseudocode',
    description:
      'Write, run, and debug Cambridge IGCSE 0478 and A Level 9618 pseudocode.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#020617',
    theme_color: '#020617',
    categories: ['education', 'developer tools', 'productivity'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      {
        src: '/icons/pwa-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
