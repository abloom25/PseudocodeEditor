'use client';

import * as Sentry from '@sentry/nextjs';

type CountOptions = Parameters<typeof Sentry.metrics.count>[2];
type DistributionOptions = Parameters<typeof Sentry.metrics.distribution>[2];

let flushTimer: number | null = null;

function scheduleMetricsFlush(): void {
  if (typeof window === 'undefined') return;

  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
  }

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void Sentry.flush(5_000);
  }, 1_000);
}

export function countSentryMetric(
  name: string,
  value = 1,
  options?: CountOptions,
): void {
  Sentry.metrics.count(name, value, options);
  scheduleMetricsFlush();
}

export function distributionSentryMetric(
  name: string,
  value: number,
  options?: DistributionOptions,
): void {
  Sentry.metrics.distribution(name, value, options);
  scheduleMetricsFlush();
}
