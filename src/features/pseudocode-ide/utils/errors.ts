import {
  formatDiagnostic,
  normalizePseudocodeError,
  type PseudocodeDiagnostic,
} from '@/lib/pseudocode/diagnostics';
import type { Locale } from '@/lib/i18n';

export function friendlyErrorMessage(
  error: unknown | PseudocodeDiagnostic,
  locale: Locale = 'en',
): string {
  const diagnostic = isDiagnostic(error)
    ? error
    : normalizePseudocodeError(error).diagnostic;
  return formatDiagnostic(diagnostic, locale);
}

function isDiagnostic(value: unknown): value is PseudocodeDiagnostic {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'code' in value &&
    'params' in value &&
    'sourceMessage' in value,
  );
}
