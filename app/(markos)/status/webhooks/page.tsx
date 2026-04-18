'use client';

// Phase 203 Plan 10 Task 2 — Surface 3 /status/webhooks (public, standalone).
// Mirrors app/(markos)/invite/[token]/page.tsx layout posture (centered card, NO workspace shell).
// Copy locked to UI-SPEC Surface 3 §Locked Copy.

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

export default function PublicWebhookStatusPage() {
  const [snapshot, setSnapshot] = useState<StatusSnapshot | null>(null);
  const [uiState, setUiState] = useState<UiState>('loading');

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
    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => clearInterval(interval);
  }, []);

  const variant = classifyStatus(snapshot);
  const lastUpdatedIso = snapshot?.last_updated || new Date().toISOString();

  return (
    <main className={styles.page}>
      <section className={styles.contentCard} aria-labelledby="status-heading">
        <h1 id="status-heading" className={styles.heading}>
          Webhook delivery status
        </h1>
        <p className={styles.subheading}>
          Live metrics for the MarkOS webhook platform. Updated every 60 seconds.
        </p>

        <div className={styles.heroGrid}>
          <div className={styles.heroCard}>
            <div className={styles.heroNumber} aria-label="Deliveries in the last 24 hours">
              {snapshot ? snapshot.total_24h.toLocaleString() : '—'}
            </div>
            <div className={styles.heroLabel}>Deliveries 24h (total_24h)</div>
          </div>
          <div className={styles.heroCard}>
            <div className={styles.heroNumber} aria-label="Success rate percentage">
              {snapshot ? formatPct(snapshot.success_rate) : '—'}
            </div>
            <div className={styles.heroLabel}>Success rate</div>
          </div>
          <div className={styles.heroCard}>
            <div className={styles.heroNumber} aria-label="Average latency in milliseconds">
              {snapshot ? `${snapshot.avg_latency_ms}ms` : '—'}
            </div>
            <div className={styles.heroLabel}>Avg latency (avg_latency_ms)</div>
          </div>
          <div className={styles.heroCard} data-dlq={snapshot && snapshot.dlq_count > 0 ? 'alert' : 'ok'}>
            <div className={styles.heroNumber} aria-label="Dead letter queue count">
              {snapshot ? snapshot.dlq_count.toLocaleString() : '—'}
            </div>
            <div className={styles.heroLabel}>DLQ count (dlq_count)</div>
          </div>
        </div>

        <p className={styles.lastUpdated}>
          <time dateTime={lastUpdatedIso}>Last updated {formatLastUpdated(lastUpdatedIso)}</time>
        </p>

        <p
          className={styles.statusLine}
          role="status"
          aria-live="polite"
          data-status={variant}
        >
          <span className={styles.statusDot} data-status={variant} aria-hidden="true" />
          {uiState === 'error' ? 'Elevated failure rate.' : statusCopy(variant)}
        </p>

        <p className={styles.footer}>
          <a href="/docs/webhooks" className={styles.footerLink}>
            Subscriber? Learn how to configure webhooks.
          </a>
        </p>
      </section>
    </main>
  );
}
