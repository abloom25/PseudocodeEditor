import type { Locale } from '@/lib/i18n';
import { monacoEn } from './en';
import { monacoZh } from './zh';
import type { MonacoLanguagePack } from './types';

export const monacoLanguagePacks: Record<Locale, MonacoLanguagePack> = {
  en: monacoEn,
  zh: monacoZh,
};
