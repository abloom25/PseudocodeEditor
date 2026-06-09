'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { LanguageSelect } from '@/components/LanguageSelect';
import { useLanguage } from '@/components/LanguageProvider';
import type { MessageKey } from '@/lib/i18n';
import {
  ArrowLeft,
  BookOpen,
  Braces,
  ChevronRight,
  FileCode2,
  Play,
  TerminalSquare,
} from 'lucide-react';

type GuideShellProps = {
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  eyebrowKey: MessageKey;
  children: ReactNode;
  showBackLink?: boolean;
  path: string;
};

export function GuideShell({
  titleKey,
  descriptionKey,
  eyebrowKey,
  children,
  showBackLink = true,
  path,
}: GuideShellProps) {
  const { t } = useLanguage();
  const localizedTitle = t(titleKey);
  const siteUrl = 'https://pseudocode.site';
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Pseudocode Editor',
      item: `${siteUrl}/`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Guides',
      item: `${siteUrl}/guides/`,
    },
  ];

  if (path !== '/guides/') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: localizedTitle,
      item: `${siteUrl}${path}`,
    });
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return (
    <main className="h-screen overflow-y-auto bg-[#070B17] text-[#DCE7FF]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <header className="sticky top-0 z-20 h-12 border-b border-[#111A33] bg-[#0A1020]/95 backdrop-blur">
        <nav
          aria-label={t('primaryNavigation')}
          className="flex h-full w-full items-center justify-between px-2 md:px-4"
        >
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-[#DCE7FF] transition hover:text-white"
          >
            <FileCode2 className="h-5 w-5 text-[#9D8CFF]" />
            <span>Pseudocode Editor</span>
            <span className="hidden rounded bg-[#111A33] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#FFD08A] sm:inline">
              {t('guides')}
            </span>
          </Link>
          <div className="flex items-center gap-1 text-sm">
            <Link
              href="/guides/"
              className="hidden rounded-md px-3 py-1.5 text-[#BFD1FF] transition hover:bg-[#162342] hover:text-white sm:inline-flex"
            >
              {t('guideReference')}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#2B4D91] px-3 py-1.5 font-medium text-white transition hover:bg-[#3B67BD]"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {t('openEditor')}
            </Link>
          </div>
        </nav>
      </header>

      <div className="border-b border-[#111A33] bg-[#080D1B]">
        <div className="w-full px-4 py-8 md:py-10">
          {showBackLink && (
            <Link
              href="/guides/"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#6D7FA8] transition hover:text-[#BFD1FF]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('allGuides')}
            </Link>
          )}
          <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-end">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#6AA9FF]" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFD08A]">
                  {t(eyebrowKey)}
                </p>
              </div>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-[#F4F7FF] md:text-5xl">
                {localizedTitle}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#8FA3CC] md:text-lg">
                {t(descriptionKey)}
              </p>
            </div>
            <div className="rounded-lg border border-[#22365F] bg-[#0A1020] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6D7FA8]">
                <TerminalSquare className="h-4 w-4 text-[#8ED0FF]" />
                {t('editorWorkflow')}
              </div>
              <div className="mt-3 flex items-center gap-2 font-mono text-sm text-[#BFD1FF]">
                <span className="text-[#FFD08A]">WRITE</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#40547A]" />
                <span className="text-[#8ED0FF]">RUN</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#40547A]" />
                <span className="text-[#A8D8B9]">TRACE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <article className="w-full px-4 py-6 md:py-8">
        <div className="space-y-6">{children}</div>
      </article>

      <footer className="border-t border-[#111A33] bg-[#0A1020]">
        <div className="flex w-full flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-[#6D7FA8]">
          <span className="flex items-center gap-2">
            <Braces className="h-4 w-4 text-[#6AA9FF]" />
            {t('footerReference')}
          </span>
          <LanguageSelect />
        </div>
      </footer>
    </main>
  );
}

export function GuideSection({
  titleKey,
  children,
}: {
  titleKey: MessageKey;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <section className="overflow-hidden rounded-lg border border-[#111A33] bg-[#0A1020] shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-2 border-b border-[#111A33] bg-[#0D1528] px-4 py-3 md:px-5">
        <span className="h-2 w-2 rounded-full bg-[#6AA9FF]" />
        <h2 className="text-base font-semibold text-[#F4F7FF] md:text-lg">
          {t(titleKey)}
        </h2>
      </div>
      <div className="space-y-4 px-4 py-5 leading-7 text-[#A9B9DA] md:px-5 [&_code]:rounded [&_code]:bg-[#111A33] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-[#FFD08A]">
        {children}
      </div>
    </section>
  );
}

export function GuideText({
  messageKey,
  values,
}: {
  messageKey: MessageKey;
  values?: Record<string, ReactNode>;
}) {
  const { tr } = useLanguage();
  return <>{tr(messageKey, values)}</>;
}

export function CodeExample({ children }: { children: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-[#22365F] bg-[#070B17]">
      <div className="flex h-9 items-center justify-between border-b border-[#111A33] bg-[#0D1528] px-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#C94F6D]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFD08A]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#8ED0FF]" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#5D6B8A]">
          pseudocode
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-6 text-[#DCE7FF] md:p-5">
        <code className="!bg-transparent !p-0 !text-inherit">{children.trim()}</code>
      </pre>
    </div>
  );
}
