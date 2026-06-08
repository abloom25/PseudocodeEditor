import { Fragment, createElement, type ReactNode } from 'react';
import { en, type MessageKey } from '@/locales/en';
import {
  languagePacks,
  localeNames,
  supportedLocales,
  type Locale,
} from '@/locales';

export type { Locale, MessageKey };
export { localeNames, supportedLocales };

export type Translate = (
  key: MessageKey,
  variables?: Record<string, string | number>,
) => string;

export type TranslateRich = (
  key: MessageKey,
  variables?: Record<string, ReactNode>,
) => ReactNode;

export function translate(
  locale: Locale,
  key: MessageKey,
  variables: Record<string, string | number> = {},
): string {
  let value = languagePacks[locale][key] ?? en[key];
  for (const [name, replacement] of Object.entries(variables)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}

export function translateRich(
  locale: Locale,
  key: MessageKey,
  variables: Record<string, ReactNode> = {},
): ReactNode {
  const template = languagePacks[locale][key] ?? en[key];
  const parts = template.split(/(\{[A-Za-z0-9_]+\})/g);
  return parts.map((part, index) => {
    const match = /^\{([A-Za-z0-9_]+)\}$/.exec(part);
    if (!match) return part;
    return createElement(
      Fragment,
      { key: `${match[1]}-${index}` },
      variables[match[1]] ?? part,
    );
  });
}
