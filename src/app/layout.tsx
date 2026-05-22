import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { ThemeProvider } from 'next-themes';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://pseudocode.site/'),
  title: {
    default: 'Pseudocode Editor',
    template: '%s | Pseudocode Editor',
  },
  description:
    'A browser-based pseudocode editor for Cambridge IGCSE 0478 and A Level 9618, with syntax highlighting, autocomplete, execution output, trace tables, and file simulation.',
  keywords: [
    'Pseudocode Editor',
    'Cambridge pseudocode',
    'IGCSE 0478',
    'A Level 9618',
    'syntax highlighting',
    'autocomplete',
    'trace table',
    'pseudocode interpreter',
  ],
  authors: [{ name: 'abloom25' }],
  generator: 'Next.js',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'Pseudocode Editor',
    description:
      'Write, run, and debug Cambridge-style pseudocode with an editor built for IGCSE 0478 and A Level 9618.',
    url: 'https://pseudocode.site/',
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
    title: 'Pseudocode Editor',
    description:
      'Write, run, and debug Cambridge-style pseudocode with syntax highlighting, autocomplete, and trace tools.',
    images: ['/pseudocode-editor-icon.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
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
          themes={['nightlight', 'dark', 'light', 'monokai', 'dracula', 'solarized-dark', 'solarized-light']}
          storageKey="pseudocode-theme"
        >
          {isDev && <Inspector />}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
