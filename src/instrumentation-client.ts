import * as Sentry from '@sentry/nextjs';

function withoutHash(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const hashIndex = value.indexOf('#');
  return hashIndex >= 0 ? value.slice(0, hashIndex) : value;
}

Sentry.init({
  dsn: 'https://09bafd6f2e3d1545e53953ad03418e42@o4511528226783232.ingest.us.sentry.io/4511528231436288',
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV,
  sendDefaultPii: false,
  integrations: [
    Sentry.consoleLoggingIntegration({
      levels: ['log', 'warn', 'error'],
    }),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/pseudocode\.site(?:\/|$)/,
  ],
  enableMetrics: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  maxBreadcrumbs: 50,
  beforeSend(event) {
    if (event.request?.url) {
      event.request.url = String(withoutHash(event.request.url));
    }
    event.breadcrumbs = event.breadcrumbs?.map((breadcrumb) => ({
      ...breadcrumb,
      data: breadcrumb.data
        ? Object.fromEntries(
            Object.entries(breadcrumb.data).map(([key, value]) => [
              key,
              ['url', 'from', 'to'].includes(key) ? withoutHash(value) : value,
            ]),
          )
        : breadcrumb.data,
    }));
    return event;
  },
});

Sentry.logger.info('Pseudocode Editor client initialized', {
  page: window.location.pathname,
  environment: process.env.NODE_ENV,
});
Sentry.metrics.count('app_session', 1, {
  attributes: {
    page: window.location.pathname,
    source: 'browser',
  },
});
void Sentry.flush(5_000);

const telemetryFlushInterval = window.setInterval(() => {
  void Sentry.flush(5_000);
}, 5_000);

window.addEventListener(
  'pagehide',
  () => {
    window.clearInterval(telemetryFlushInterval);
    void Sentry.flush(5_000);
  },
  { once: true },
);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
