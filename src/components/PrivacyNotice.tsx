'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { useAnalyticsConsent } from '@/hooks/useAnalyticsConsent';

export function PrivacyNotice() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { consent, ready, setConsent } = useAnalyticsConsent();

  if (!ready || consent !== null || pathname.startsWith('/privacy')) return null;

  return (
    <aside
      aria-label={t('privacyTitle')}
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-lg border border-[#22365F] bg-[#0A1020]/98 p-4 text-[#DCE7FF] shadow-2xl backdrop-blur md:bottom-5"
    >
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8ED0FF]" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{t('privacyTitle')}</h2>
          <p className="mt-1 text-xs leading-5 text-[#8FA3CC]">{t('privacySummary')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setConsent('granted')}
              className="rounded-md bg-[#2B4D91] px-3 py-1.5 font-medium text-white hover:bg-[#3B67BD]"
            >
              {t('allowAnalytics')}
            </button>
            <button
              type="button"
              onClick={() => setConsent('denied')}
              className="rounded-md border border-[#30466F] bg-[#101A30] px-3 py-1.5 font-medium text-[#DCE7FF] hover:bg-[#162342]"
            >
              {t('rejectAnalytics')}
            </button>
            <Link href="/privacy/" className="font-medium text-[#8ED0FF] hover:text-white">
              {t('privacyDetails')}
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
