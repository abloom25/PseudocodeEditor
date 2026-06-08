'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  translate,
  translateRich,
  type Locale,
  type Translate,
  type TranslateRich,
} from '@/lib/i18n';

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
  tr: TranslateRich;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pseudocode-language');
      if (saved === 'en' || saved === 'zh') setLocaleState(saved);
    } catch {
      // Keep the deterministic English default when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    try {
      localStorage.setItem('pseudocode-language', nextLocale);
    } catch {
      // Language still changes for the current session.
    }
  }, []);

  const t = useCallback<Translate>(
    (key, variables) => translate(locale, key, variables),
    [locale],
  );
  const tr = useCallback<TranslateRich>(
    (key, variables) => translateRich(locale, key, variables),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, tr }),
    [locale, setLocale, t, tr],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
