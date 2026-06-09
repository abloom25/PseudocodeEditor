import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inspector } from 'react-dev-inspector';
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/components/LanguageProvider';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { PWARegister } from '@/components/PWARegister';
import {
  GOOGLE_ANALYTICS_ID,
  createGoogleConsentInitializationScript,
} from '@/lib/analytics-consent';
import './globals.css';

const siteUrl = 'https://pseudocode.site';
const siteName = 'Pseudocode Editor';
const siteDescription =
  'Write, run, and debug Cambridge IGCSE 0478 and A Level 9618 pseudocode online with syntax checking, trace tables, arrays, records, and file handling.';
const umamiWebsiteId = '78d8bb40-ef8b-4af6-8ef9-06a34cb2d5a6';

export const viewport: Viewport = {
  themeColor: '#020617',
  colorScheme: 'dark light',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Cambridge Pseudocode Editor | IGCSE 0478 & A Level 9618',
    template: '%s | Pseudocode Editor',
  },
  description: siteDescription,
  applicationName: siteName,
  manifest: '/manifest.webmanifest',
  keywords: [
    'Pseudocode Editor',
    'Cambridge pseudocode',
    'Cambridge IGCSE pseudocode editor',
    'Cambridge A Level pseudocode editor',
    'IGCSE 0478',
    'IGCSE Computer Science pseudocode',
    'A Level 9618',
    'A Level Computer Science pseudocode',
    'online pseudocode runner',
    'pseudocode interpreter',
    'trace table generator',
    'Monaco pseudocode editor',
    'syntax highlighting',
    'autocomplete',
    'trace table',
    'virtual file simulation',
  ],
  authors: [{ name: 'abloom25' }],
  creator: 'abloom25',
  publisher: 'abloom25',
  generator: 'Next.js',
  category: 'education',
  alternates: {
    canonical: '/',
  },
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: siteName,
  },
  openGraph: {
    title: 'Cambridge Pseudocode Editor | IGCSE 0478 & A Level 9618',
    description: siteDescription,
    url: '/',
    siteName: 'Pseudocode Editor',
    locale: 'en_US',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cambridge Pseudocode Editor | IGCSE 0478 & A Level 9618',
    description: siteDescription,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description: siteDescription,
      inLanguage: 'en',
    },
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#application`,
      name: siteName,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires a modern web browser with JavaScript enabled',
      url: siteUrl,
      description: siteDescription,
      image: `${siteUrl}/pseudocode-editor-icon.png`,
      author: {
        '@type': 'Person',
        name: 'abloom25',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Cambridge IGCSE 0478 pseudocode editing and execution',
        'Cambridge A Level 9618 pseudocode editing and execution',
        'Syntax highlighting and autocomplete',
        'Trace table generation',
        'Virtual file simulation',
        'AST inspection',
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="antialiased h-screen overflow-hidden"
      >
        {isProduction && (
          <script
            id="google-consent-initialization"
            dangerouslySetInnerHTML={{
              __html: createGoogleConsentInitializationScript(),
            }}
          />
        )}
        <LanguageProvider>
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="nightlight"
            themes={['nightlight', 'dark', 'light', 'monokai', 'dracula', 'solarized-dark', 'solarized-light', 'forest']}
            storageKey="pseudocode-theme"
          >
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            {isDev && <Inspector />}
            {children}
            <PrivacyNotice />
            <PWARegister />
            {isProduction && (
              <Script
                id="google-analytics"
                src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
                strategy="afterInteractive"
              />
            )}
            <Script
              src="https://cloud.umami.is/script.js"
              data-website-id={umamiWebsiteId}
              data-domains="pseudocode.site"
              data-do-not-track="true"
              data-exclude-search="true"
              strategy="afterInteractive"
            />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
