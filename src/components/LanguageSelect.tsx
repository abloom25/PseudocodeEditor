'use client';

import { Languages } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { localeNames, supportedLocales, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type LanguageSelectProps = {
  className?: string;
  align?: 'start' | 'center' | 'end';
};

export function LanguageSelect({
  className,
  align = 'end',
}: LanguageSelectProps) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <Select
      value={locale}
      onValueChange={(value) => setLocale(value as Locale)}
    >
      <SelectTrigger
        size="sm"
        aria-label={t('language')}
        className={cn(
          'w-[9.5rem] border-[#22365F] bg-[#0A1020] text-[#DCE7FF] shadow-none hover:bg-[#101A30] focus-visible:border-[#6AA9FF] focus-visible:ring-[#6AA9FF]/25',
          className,
        )}
      >
        <Languages className="h-4 w-4 text-[#8FA3CC]" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align={align}
        className="border-[#22365F] bg-[#0A1020] text-[#DCE7FF]"
      >
        {supportedLocales.map((language) => (
          <SelectItem
            key={language}
            value={language}
            className="cursor-pointer focus:bg-[#162342] focus:text-white"
          >
            {localeNames[language]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
