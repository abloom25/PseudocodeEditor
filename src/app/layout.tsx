import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const siteUrl = 'https://pseudocode.site';
const siteName = 'Pseudocode Editor';
const siteDescription =
  'Write, run, and debug Cambridge IGCSE 0478 and A Level 9618 pseudocode in a browser editor with syntax highlighting, autocomplete, trace tables, and virtual file simulation.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Pseudocode Editor for Cambridge IGCSE 0478 and A Level 9618',
    template: '%s | Pseudocode Editor',
  },
  description: siteDescription,
  applicationName: siteName,
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
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'Pseudocode Editor for Cambridge IGCSE 0478 and A Level 9618',
    description: siteDescription,
    url: '/',
    siteName: 'Pseudocode Editor',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/pseudocode-editor-icon.png',
        width: 1254,
        height: 1254,
        alt: 'Pseudocode Editor icon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pseudocode Editor for Cambridge IGCSE 0478 and A Level 9618',
    description: siteDescription,
    images: ['/pseudocode-editor-icon.png'],
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
  '@type': 'SoftwareApplication',
  name: siteName,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased h-screen overflow-hidden`}>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
