'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
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
      return;
    }

    let disposed = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        if (!disposed) {
          await registration.update();
        }
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    void register();

    return () => {
      disposed = true;
    };
  }, []);

  return null;
}
