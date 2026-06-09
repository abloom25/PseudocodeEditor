'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Braces, Languages } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { localeNames, supportedLocales } from '@/lib/i18n';

export function NotFoundContent() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <main className="h-screen overflow-y-auto bg-[#070B17] text-[#DCE7FF]">
      <header className="h-12 border-b border-[#111A33] bg-[#0A1020]">
        <div className="mx-auto flex h-full w-full max-w-[1536px] items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-[#F4F7FF] hover:text-white"
          >
            <Braces className="h-4 w-4 text-[#8ED0FF]" aria-hidden="true" />
            {t('appName')}
          </Link>

          <div className="flex items-center gap-1 rounded-md border border-[#22365F] bg-[#070B17] p-1">
            <Languages className="mx-1 h-4 w-4 text-[#8FA3CC]" aria-hidden="true" />
            {supportedLocales.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => setLocale(language)}
                aria-pressed={locale === language}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  locale === language
                    ? 'bg-[#2B4D91] text-white'
                    : 'text-[#8FA3CC] hover:bg-[#162342] hover:text-white'
                }`}
              >
                {localeNames[language]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1536px] items-center px-4 py-10 sm:px-6">
        <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-xl border border-[#22365F] bg-[#0A1020] shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center border-b border-[#22365F] p-7 sm:p-10 lg:border-b-0 lg:border-r">
            <p className="font-mono text-sm font-semibold tracking-[0.25em] text-[#6AA9FF]">
              {t('notFoundCode')}
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {t('notFoundTitle')}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-[#8FA3CC] sm:text-base">
              {t('notFoundDescription')}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-md bg-[#2B4D91] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3B67BD]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t('backEditor')}
              </Link>
              <Link
                href="/guides/"
                className="inline-flex items-center gap-2 rounded-md border border-[#30466F] bg-[#101A30] px-4 py-2.5 text-sm font-semibold text-[#DCE7FF] transition hover:bg-[#162342] hover:text-white"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {t('browseGuides')}
              </Link>
            </div>
          </div>

          <div className="bg-[#070B17] p-5 sm:p-8">
            <div className="overflow-hidden rounded-lg border border-[#22365F] bg-[#050914]">
              <div className="flex h-10 items-center gap-2 border-b border-[#111A33] bg-[#0D1528] px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#C94F6D]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFD08A]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#8ED0FF]" />
                <span className="ml-2 font-mono text-xs text-[#6D7FA8]">
                  missing-page.pseudo
                </span>
              </div>
              <div className="grid grid-cols-[2.5rem_1fr] font-mono text-sm leading-7">
                <div className="select-none border-r border-[#111A33] bg-[#080D1B] py-4 pr-3 text-right text-[#405174]">
                  <div>1</div>
                  <div>2</div>
                  <div>3</div>
                  <div>4</div>
                  <div>5</div>
                </div>
                <div className="overflow-x-auto p-4 text-[#DCE7FF]">
                  <div>
                    <span className="text-[#C792EA]">DECLARE</span>{' '}
                    <span className="text-[#8ED0FF]">Page</span>
                    <span className="text-[#89DDFF]"> : </span>
                    <span className="text-[#FFD08A]">STRING</span>
                  </div>
                  <div>
                    <span className="text-[#8ED0FF]">Page</span>{' '}
                    <span className="text-[#89DDFF]">&lt;-</span>{' '}
                    <span className="text-[#C3E88D]">&quot;404&quot;</span>
                  </div>
                  <div>
                    <span className="text-[#C792EA]">IF</span>{' '}
                    <span className="text-[#8ED0FF]">Page</span>{' '}
                    <span className="text-[#89DDFF]">=</span>{' '}
                    <span className="text-[#C3E88D]">&quot;404&quot;</span>{' '}
                    <span className="text-[#C792EA]">THEN</span>
                  </div>
                  <div className="pl-5">
                    <span className="text-[#82AAFF]">OUTPUT</span>{' '}
                    <span className="text-[#C3E88D]">
                      &quot;{t('notFoundOutput')}&quot;
                    </span>
                  </div>
                  <div>
                    <span className="text-[#C792EA]">ENDIF</span>
                    <span className="ml-3 text-[#546A92]">
                      {'// '}
                      {t('notFoundComment')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#22365F] bg-[#0A1020]">
              <div className="border-b border-[#111A33] px-4 py-2 font-mono text-xs text-[#8FA3CC]">
                {t('output')}
              </div>
              <p className="px-4 py-3 font-mono text-sm text-[#FFD08A]">
                {t('notFoundOutput')}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
