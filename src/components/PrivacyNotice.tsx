'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

export function PrivacyNotice() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem('pseudocode-privacy-notice') !== 'dismissed');
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem('pseudocode-privacy-notice', 'dismissed');
    } catch {
      // Dismiss for this page view when storage is unavailable.
    }
  };

  if (!visible || pathname.startsWith('/privacy')) return null;

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
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <Link href="/privacy/" className="font-medium text-[#8ED0FF] hover:text-white">
              {t('privacyDetails')}
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md bg-[#2B4D91] px-3 py-1.5 font-medium text-white hover:bg-[#3B67BD]"
            >
              {t('dismiss')}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('dismiss')}
          className="h-7 w-7 shrink-0 rounded-md p-1 text-[#6D7FA8] hover:bg-[#162342] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
