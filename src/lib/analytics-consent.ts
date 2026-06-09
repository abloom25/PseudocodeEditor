export const GOOGLE_ANALYTICS_ID = 'G-KDTWMNV5EY';
export const ANALYTICS_CONSENT_STORAGE_KEY = 'pseudocode-analytics-consent';
export const ANALYTICS_CONSENT_CHANGED_EVENT =
  'pseudocode-analytics-consent-changed';

export type AnalyticsConsent = 'granted' | 'denied';

type GoogleTag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GoogleTag;
  }
}

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const value = localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function updateAnalyticsConsent(consent: AnalyticsConsent): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);
  } catch {
    // The selection still applies to the current page when storage is unavailable.
  }

  window.gtag?.('consent', 'update', {
    analytics_storage: consent,
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  window.dispatchEvent(
    new CustomEvent<AnalyticsConsent>(ANALYTICS_CONSENT_CHANGED_EVENT, {
      detail: consent,
    }),
  );
}

export function createGoogleConsentInitializationScript(): string {
  return `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};

window.gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});

try {
  if (window.localStorage.getItem('${ANALYTICS_CONSENT_STORAGE_KEY}') === 'granted') {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }
} catch (error) {
  // Keep the privacy-preserving denied defaults when storage is unavailable.
}

window.gtag('set', 'ads_data_redaction', true);
window.gtag('js', new Date());
window.gtag('config', '${GOOGLE_ANALYTICS_ID}');
`;
}
