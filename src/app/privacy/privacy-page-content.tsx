'use client';

import Link from 'next/link';
import { ArrowLeft, BarChart3, Bug, Cookie, Database, Languages, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { useAnalyticsConsent } from '@/hooks/useAnalyticsConsent';
import { localeNames, supportedLocales } from '@/lib/i18n';

const sections = [
  ['noCookiesHeading', 'noCookiesText', Cookie],
  ['localStorageHeading', 'localStorageText', Database],
  ['analyticsHeading', 'analyticsText', BarChart3],
  ['errorMonitoringHeading', 'errorMonitoringText', Bug],
  ['dataControlHeading', 'dataControlText', ShieldCheck],
] as const;

export function PrivacyPageContent() {
  const { locale, setLocale, t } = useLanguage();
  const { consent, ready, setConsent } = useAnalyticsConsent();
  const consentStatus = !ready
    ? t('analyticsConsentLoading')
    : consent === 'granted'
      ? t('analyticsConsentGranted')
      : consent === 'denied'
        ? t('analyticsConsentDenied')
        : t('analyticsConsentNotChosen');

  return (
    <main className="min-h-screen overflow-auto bg-[#050914] px-4 py-6 text-[#DCE7FF] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1536px]">
        <header className="flex items-center justify-between border-b border-[#1A2A4A] pb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#8ED0FF] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backEditor')}
          </Link>
          <div className="flex items-center gap-1 rounded-md border border-[#22365F] bg-[#0A1020] p-1">
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
        </header>

        <div className="max-w-4xl py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6FAFE7]">
            {t('privacyTitle')}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {t('privacyHeading')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#9FB0D2]">
            {t('privacyIntro')}
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {sections.map(([heading, text, Icon]) => (
              <section
                key={heading}
                className="rounded-xl border border-[#1A2A4A] bg-[#0A1020] p-5"
              >
                <Icon className="h-5 w-5 text-[#8ED0FF]" aria-hidden="true" />
                <h2 className="mt-4 text-base font-semibold text-white">{t(heading)}</h2>
                <p className="mt-2 text-sm leading-6 text-[#8FA3CC]">{t(text)}</p>
              </section>
            ))}
          </div>

          <section className="mt-4 rounded-xl border border-[#22365F] bg-[#0A1020] p-5">
            <ShieldCheck className="h-5 w-5 text-[#8ED0FF]" aria-hidden="true" />
            <h2 className="mt-4 text-base font-semibold text-white">
              {t('manageAnalyticsConsent')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#8FA3CC]">
              {t('manageAnalyticsConsentText')}
            </p>
            <p
              className="mt-3 text-xs font-medium text-[#B8C8E8]"
              aria-live="polite"
            >
              {t('analyticsConsentStatus', { status: consentStatus })}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConsent('granted')}
                aria-pressed={consent === 'granted'}
                className="rounded-md bg-[#2B4D91] px-3 py-2 text-xs font-medium text-white hover:bg-[#3B67BD]"
              >
                {t('allowAnalytics')}
              </button>
              <button
                type="button"
                onClick={() => setConsent('denied')}
                aria-pressed={consent === 'denied'}
                className="rounded-md border border-[#30466F] bg-[#101A30] px-3 py-2 text-xs font-medium text-[#DCE7FF] hover:bg-[#162342]"
              >
                {t('rejectAnalytics')}
              </button>
            </div>
          </section>

          <p className="mt-8 text-xs leading-5 text-[#6D7FA8]">{t('privacyUpdated')}</p>
        </div>
      </div>
    </main>
  );
}
