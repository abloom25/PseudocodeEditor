'use client';

import { RefreshCw, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

export function PWARegister() {
  const { t } = useLanguage();
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!('serviceWorker' in navigator)) {
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    if (process.env.NODE_ENV !== 'production') {
      const removeDevelopmentPWAState = async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations
            .filter((registration) =>
              registration.active?.scriptURL.endsWith('/sw.js') ||
              registration.installing?.scriptURL.endsWith('/sw.js') ||
              registration.waiting?.scriptURL.endsWith('/sw.js'),
            )
            .map((registration) => registration.unregister()),
        );

        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames
              .filter((cacheName) => cacheName.startsWith('pseudocode-'))
              .map((cacheName) => caches.delete(cacheName)),
          );
        }
      };

      void removeDevelopmentPWAState().catch((error) => {
        console.error('Failed to clear development PWA state:', error);
      });
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    let disposed = false;
    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange,
    );

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        const inspectWaitingWorker = () => {
          if (!disposed && registration.waiting) {
            setWaitingWorker(registration.waiting);
          }
        };
        inspectWaitingWorker();

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (
              worker.state === 'installed' &&
              navigator.serviceWorker.controller &&
              !disposed
            ) {
              setWaitingWorker(worker);
            }
          });
        });

        if (!disposed) await registration.update();
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    void register();

    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange,
      );
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const applyUpdate = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
  };

  if (!waitingWorker && !offline) return null;

  return (
    <aside className="fixed bottom-3 right-3 z-[110] flex max-w-sm flex-col gap-2">
      {offline && (
        <div className="flex items-start gap-3 rounded-lg border border-[#30466F] bg-[#0A1020]/98 p-4 text-[#DCE7FF] shadow-2xl backdrop-blur">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-[#FFD08A]" />
          <div>
            <p className="text-sm font-semibold">{t('offlineMode')}</p>
            <p className="mt-1 text-xs leading-5 text-[#8FA3CC]">
              {t('offlineModeDescription')}
            </p>
          </div>
        </div>
      )}
      {waitingWorker && (
        <div className="flex items-start gap-3 rounded-lg border border-[#30466F] bg-[#0A1020]/98 p-4 text-[#DCE7FF] shadow-2xl backdrop-blur">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-[#8ED0FF]" />
          <div>
            <p className="text-sm font-semibold">{t('updateAvailable')}</p>
            <p className="mt-1 text-xs leading-5 text-[#8FA3CC]">
              {t('updateAvailableDescription')}
            </p>
            <button
              type="button"
              onClick={applyUpdate}
              className="mt-3 rounded-md bg-[#2B4D91] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#3B67BD]"
            >
              {t('reloadToUpdate')}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
