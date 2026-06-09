import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://09bafd6f2e3d1545e53953ad03418e42@o4511528226783232.ingest.us.sentry.io/4511528231436288',
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  enableMetrics: true,
  enableLogs: true,
});
