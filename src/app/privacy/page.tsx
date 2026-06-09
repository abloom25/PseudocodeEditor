import type { Metadata } from 'next';
import { PrivacyPageContent } from './privacy-page-content';

export const metadata: Metadata = {
  title: 'Privacy, Cookies, and Local Storage',
  description:
    'Learn how Pseudocode Editor uses browser storage, Umami, consent-controlled Google Analytics, and Sentry error reporting.',
  alternates: {
    canonical: '/privacy/',
  },
};

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
