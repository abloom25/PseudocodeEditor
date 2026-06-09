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
  tracesSampleRate: 0,
  enableLogs: false,
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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
