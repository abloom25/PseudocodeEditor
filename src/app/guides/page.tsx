import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideSection, GuideShell } from '@/components/GuideShell';

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
    title: 'IGCSE Computer Science 0478',
    description:
      'Core declarations, arrays, selection, iteration, procedures, functions, and text file handling.',
  },
  {
    href: '/guides/alevel-9618/',
    title: 'A Level Computer Science 9618',
    description:
      'Strict A-Level syntax including records, pointers, sets, classes, random files, and syllabus-specific operators.',
  },
];

export default function GuidesPage() {
  return (
    <GuideShell
      eyebrow="Cambridge Computer Science"
      title="Pseudocode syntax guides and runnable examples"
      description="Choose the guide for your syllabus. Each page explains the syntax accepted by the editor and includes examples you can adapt for exam practice."
      showBackLink={false}
      path="/guides/"
    >
      <GuideSection title="Choose your syllabus">
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
              <h3 className="text-xl font-semibold text-[#F4F7FF]">{guide.title}</h3>
              <p className="mt-3 text-[#8FA3CC]">{guide.description}</p>
              <span className="mt-5 inline-block font-medium text-[#8ED0FF] group-hover:text-white">
                Read guide →
              </span>
            </Link>
          ))}
        </div>
      </GuideSection>

      <GuideSection title="Use the examples in the editor">
        <p>
          Open the editor, select the matching syllabus, and paste an example.
          The syntax checker, execution output, trace table, array viewer, and
          virtual file system help you inspect how the algorithm behaves.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-md bg-[#2B4D91] px-5 py-2.5 font-semibold text-white transition hover:bg-[#3B67BD]"
        >
          Open Pseudocode Editor
        </Link>
      </GuideSection>
    </GuideShell>
  );
}
