'use client';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { translate, type Locale } from '@/lib/i18n';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  useEffect(() => {
    const savedLocale = localStorage.getItem('pseudocode-language');
    if (savedLocale === 'en' || savedLocale === 'zh') {
      setLocale(savedLocale);
    }
  }, []);

  return (
    <html lang={locale === 'zh' ? 'zh-CN' : 'en'}>
      <body className="flex min-h-screen items-center justify-center bg-[#050914] p-6 text-[#DCE7FF]">
        <main className="w-full max-w-lg rounded-xl border border-[#22365F] bg-[#0A1020] p-6 text-center">
          <h1 className="text-xl font-semibold text-white">{translate(locale, 'globalErrorTitle')}</h1>
          <p className="mt-3 text-sm leading-6 text-[#8FA3CC]">
            {translate(locale, 'globalErrorDescription')}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-md bg-[#2B4D91] px-4 py-2 text-sm font-medium text-white hover:bg-[#3B67BD]"
          >
            {translate(locale, 'tryAgain')}
          </button>
        </main>
      </body>
    </html>
  );
}
