'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ANALYTICS_CONSENT_CHANGED_EVENT,
  ANALYTICS_CONSENT_STORAGE_KEY,
  readAnalyticsConsent,
  updateAnalyticsConsent,
  type AnalyticsConsent,
} from '@/lib/analytics-consent';

export function useAnalyticsConsent() {
  const [consent, setConsentState] = useState<AnalyticsConsent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsentState(readAnalyticsConsent());
    setReady(true);

    const handleConsentChange = (event: Event) => {
      setConsentState((event as CustomEvent<AnalyticsConsent>).detail);
    };
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === ANALYTICS_CONSENT_STORAGE_KEY) {
        setConsentState(
          event.newValue === 'granted' || event.newValue === 'denied'
            ? event.newValue
            : null,
        );
      }
    };

    window.addEventListener(
      ANALYTICS_CONSENT_CHANGED_EVENT,
      handleConsentChange,
    );
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(
        ANALYTICS_CONSENT_CHANGED_EVENT,
        handleConsentChange,
      );
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setConsent = useCallback((nextConsent: AnalyticsConsent) => {
    setConsentState(nextConsent);
    updateAnalyticsConsent(nextConsent);
  }, []);

  return { consent, ready, setConsent };
}
