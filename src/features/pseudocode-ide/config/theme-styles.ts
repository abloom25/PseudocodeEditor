import uiThemes from './ui-themes.json';
import type { UIThemeColors } from '../types';
import type { EditorTheme } from '../types';

export type ThemeName = EditorTheme;

export function resolveThemeName(theme: string | undefined): EditorTheme {
  if (
    theme === 'nightlight' ||
    theme === 'dark' ||
    theme === 'light' ||
    theme === 'monokai' ||
    theme === 'dracula' ||
    theme === 'solarized-dark' ||
    theme === 'solarized-light'
  ) {
    return theme;
  }
  return 'nightlight';
}

export function getThemeStyles(theme: string | undefined): UIThemeColors {
  const currentTheme = resolveThemeName(theme);
  const themeData = uiThemes[currentTheme];
  if (themeData) {
    return themeData as UIThemeColors;
  }
  return uiThemes['nightlight'] as UIThemeColors;
}

export function getThemeColors(themeName: string): Record<string, string> {
  switch (themeName) {
    case 'nightlight':
      return { key: 'text-[#7CB7FF]', string: 'text-[#FFD8A8]', number: 'text-[#FFBE7A]', boolean: 'text-[#FFD08A]', null: 'text-[#5D6B8A]' };
    case 'monokai':
      return { key: 'text-purple-400', string: 'text-yellow-300', number: 'text-orange-300', boolean: 'text-green-400', null: 'text-gray-500' };
    case 'dracula':
      return { key: 'text-purple-300', string: 'text-yellow-200', number: 'text-purple-400', boolean: 'text-green-400', null: 'text-gray-500' };
    case 'solarized-dark':
      return { key: 'text-yellow-600', string: 'text-green-700', number: 'text-cyan-600', boolean: 'text-orange-600', null: 'text-gray-500' };
    case 'solarized-light':
      return { key: 'text-yellow-700', string: 'text-green-700', number: 'text-cyan-700', boolean: 'text-orange-700', null: 'text-gray-500' };
    case 'light':
      return { key: 'text-purple-600', string: 'text-green-600', number: 'text-cyan-600', boolean: 'text-amber-600', null: 'text-gray-500' };
    default:
      return { key: 'text-purple-400', string: 'text-green-400', number: 'text-cyan-400', boolean: 'text-amber-400', null: 'text-slate-500' };
  }
}
