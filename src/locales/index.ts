import { en } from './en';
import { zh } from './zh';

export const languagePacks = {
  en,
  zh,
} as const;

export type Locale = keyof typeof languagePacks;

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};

export const supportedLocales = Object.keys(languagePacks) as Locale[];
