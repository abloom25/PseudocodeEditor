import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideSection, GuideShell, GuideText } from '@/components/GuideShell';
import type { MessageKey } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Cambridge Pseudocode Guides',
  description:
    'Learn Cambridge IGCSE 0478 and A Level 9618 pseudocode syntax with practical examples for declarations, arrays, loops, functions, records, and files.',
  alternates: {
    canonical: '/guides/',
  },
  openGraph: {
    title: 'Cambridge Pseudocode Guides',
    description:
      'Practical syntax guides for Cambridge IGCSE 0478 and A Level 9618 Computer Science.',
    url: '/guides/',
    siteName: 'Pseudocode Editor',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cambridge Pseudocode Guides',
    description:
      'Practical syntax guides for Cambridge IGCSE 0478 and A Level 9618 Computer Science.',
    images: ['/opengraph-image'],
  },
};

const guides = [
  {
    href: '/guides/igcse-0478/',
    titleKey: 'guides.index.igcse.title',
    descriptionKey: 'guides.index.igcse.description',
  },
  {
    href: '/guides/alevel-9618/',
    titleKey: 'guides.index.alevel.title',
    descriptionKey: 'guides.index.alevel.description',
  },
] satisfies Array<{ href: string; titleKey: MessageKey; descriptionKey: MessageKey }>;

export default function GuidesPage() {
  return (
    <GuideShell
      eyebrowKey="guides.index.eyebrow"
      titleKey="guides.index.title"
      descriptionKey="guides.index.description"
      showBackLink={false}
      path="/guides/"
    >
      <GuideSection titleKey="guides.index.choose">
        <div className="grid gap-5 md:grid-cols-2">
          {guides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="group rounded-lg border border-[#22365F] bg-[#070B17] p-5 transition hover:-translate-y-0.5 hover:border-[#6AA9FF] hover:bg-[#0D1528]"
            >
              <div className="mb-4 inline-flex rounded-md bg-[#111A33] px-2 py-1 font-mono text-xs text-[#FFD08A]">
                {guide.href.includes('igcse') ? '0478' : '9618'}
              </div>
              <h3 className="text-xl font-semibold text-[#F4F7FF]">
                <GuideText messageKey={guide.titleKey} />
              </h3>
              <p className="mt-3 text-[#8FA3CC]">
                <GuideText messageKey={guide.descriptionKey} />
              </p>
              <span className="mt-5 inline-block font-medium text-[#8ED0FF] group-hover:text-white">
                <GuideText messageKey="guides.index.read" />
              </span>
            </Link>
          ))}
        </div>
      </GuideSection>

      <GuideSection titleKey="guides.index.useExamples">
        <p><GuideText messageKey="guides.index.useExamplesText" /></p>
        <Link
          href="/"
          className="inline-flex rounded-md bg-[#2B4D91] px-5 py-2.5 font-semibold text-white transition hover:bg-[#3B67BD]"
        >
          <GuideText messageKey="guides.index.openEditor" />
        </Link>
      </GuideSection>
    </GuideShell>
  );
}
