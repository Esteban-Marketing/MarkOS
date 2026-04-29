'use client';

// Phase 203 Plan 10 Task 2 — Surface 3 /status/webhooks (public, standalone).
// Mirrors app/(markos)/invite/[token]/page.tsx layout posture (centered card, NO workspace shell).
// Phase 213.4 Plan 06 — className-only update: primitives composed JSX-side per SW-1..SW-7.
// Phase 203 wiring (fetchStatus, classifyStatus, statusCopy) preserved verbatim per D-20.

import { useEffect, useState } from 'react';
import styles from './page.module.css';

type StatusSnapshot = {
  total_24h: number;
  success_rate: number;
  avg_latency_ms: number;
  dlq_count: number;
  last_updated: string;
};

type UiState = 'loading' | 'ready' | 'error';

function classifyStatus(s: StatusSnapshot | null): 'operational' | 'retrying' | 'elevated' {
  if (!s) return 'elevated';
  // success_rate comes through as a fraction (0..1).
  const rate = s.success_rate > 1 ? s.success_rate / 100 : s.success_rate;
  if (rate >= 0.999 && s.dlq_count === 0) return 'operational';
  if (rate >= 0.95) return 'retrying';
  return 'elevated';
}

function statusCopy(variant: 'operational' | 'retrying' | 'elevated'): string {
  switch (variant) {
    case 'operational':
      return 'All systems operational.';
    case 'retrying':
      return 'Some deliveries are being retried.';
    default:
      return 'Elevated failure rate.';
  }
}

function formatPct(fraction: number): string {
  const p = fraction > 1 ? fraction / 100 : fraction;
  return `${(p * 100).toFixed(1)}%`;
}

function formatLastUpdated(iso: string): string {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return 'just now';
  const secsAgo = Math.max(0, Math.round((Date.now() - when.getTime()) / 1000));
  if (secsAgo < 60) return `${secsAgo}s ago`;
  return `${Math.floor(secsAgo / 60)}m ago`;
}

const STATUS_MAP = {
  operational: {
    cls: 'c-notice c-notice--success',
    dot: 'c-status-dot c-status-dot--live',
    glyph: '[ok]',
  },
  retrying: {
    cls: 'c-notice c-notice--warning',
    dot: 'c-status-dot',
    glyph: '[warn]',
  },
  elevated: {
    cls: 'c-notice c-notice--error',
    dot: 'c-status-dot c-status-dot--error',
    glyph: '[err]',
  },
} as const;

export default function PublicWebhookStatusPage({
  snapshot: snapshotProp,
}: {
  snapshot?: StatusSnapshot | null;
} = {}) {
  const [snapshot, setSnapshot] = useState<StatusSnapshot | null>(snapshotProp ?? null);
  const [uiState, setUiState] = useState<UiState>(snapshotProp == null ? 'loading' : 'ready');

  async function fetchStatus() {
    try {
      const r = await fetch('/api/public/webhooks/status', { cache: 'no-store' });
      if (!r.ok) {
        setUiState('error');
        return;
      }
      const body = (await r.json()) as StatusSnapshot;
      setSnapshot(body);
      setUiState('ready');
    } catch {
      setUiState('error');
    }
  }

  useEffect(() => {
    // Skip live fetch when snapshot provided as prop (Storybook / SSR override).
    if (snapshotProp == null) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 60_000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [snapshotProp]);

  const variant = classifyStatus(snapshot);
  const { cls, dot, glyph } = STATUS_MAP[variant];
  const copy = uiState === 'error' ? 'Elevated failure rate.' : statusCopy(variant);
  const lastUpdatedIso = snapshot?.last_updated || new Date().toISOString();

  return (
    <main className={styles.page}>
      <div className={styles.contentWrap}>
        <div className="c-card" aria-labelledby="status-heading">
          <h1 id="status-heading">Webhook delivery status</h1>
          <p className="t-lead">
            Live metrics for the MarkOS webhook platform. Updated every 60 seconds.
          </p>

          <div className={styles.heroGrid}>
            <div className={styles.heroCard} aria-label="Deliveries in the last 24 hours (total_24h)">
              <span className="t-label-caps">Deliveries 24h</span>
              <span className={styles.heroNumber}>
                {snapshot ? snapshot.total_24h.toLocaleString() : '—'}
              </span>
            </div>
            <div className={styles.heroCard} aria-label="Success rate percentage">
              <span className="t-label-caps">Success rate</span>
              <span className={styles.heroNumber}>
                {snapshot ? formatPct(snapshot.success_rate) : '—'}
              </span>
            </div>
            <div className={styles.heroCard} aria-label="Average latency in milliseconds (avg_latency_ms)">
              <span className="t-label-caps">Avg latency</span>
              <span className={styles.heroNumber}>
                {snapshot ? `${snapshot.avg_latency_ms}ms` : '—'}
              </span>
            </div>
            <div
              className={styles.heroCard}
              data-dlq={snapshot && snapshot.dlq_count > 0 ? 'alert' : undefined}
              aria-label="Dead letter queue count (dlq_count)"
            >
              <span className="t-label-caps">DLQ count</span>
              <span className={styles.heroNumber}>
                {snapshot ? snapshot.dlq_count.toLocaleString() : '—'}
              </span>
            </div>
          </div>

          <div className={cls} role="status" aria-live="polite">
            <span className={dot} aria-hidden="true" />
            <strong>{glyph}</strong>{' '}{copy}
          </div>

          <p className={styles.lastUpdated}>
            <time dateTime={lastUpdatedIso}>Last updated {formatLastUpdated(lastUpdatedIso)}</time>
          </p>

          <p className={styles.footer}>
            <a href="/docs/webhooks" className={styles.footerLink}>
              Subscriber? Learn how to configure webhooks.
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
