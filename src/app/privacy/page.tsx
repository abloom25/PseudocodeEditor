import type { Metadata } from 'next';
import { PrivacyPageContent } from './privacy-page-content';

export const metadata: Metadata = {
  title: 'Privacy, Cookies, and Local Storage',
  description:
    'Learn how Pseudocode Editor uses browser storage and privacy-friendly Umami analytics without advertising or tracking cookies.',
  alternates: {
    canonical: '/privacy/',
  },
};

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
