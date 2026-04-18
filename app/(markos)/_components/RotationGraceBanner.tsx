'use client';

// Phase 203 Plan 06 Task 2 — Surface 4: Global rotation grace banner.
//
// Renders ambient (role="status") T-7 / T-1 / T-0 countdown banner across
// tenant-admin routes when at least one active rotation has a grace window
// in progress. Pure-display component — shell-level wiring (fetch of
// /api/tenant/webhooks/rotations/active from layout shell) is deferred to
// Plan 203-09. This file exists so Plan 203-05 API + Plan 203-06 cron both
// have their paired UI surface in place.
//
// UI-SPEC §Surface 4 contract:
//   - data-stage attribute on the banner div: "t-7" | "t-1" | "t-0" | "multi"
//   - role="status" (ambient — NOT alert to avoid re-announcing on nav)
//   - Locked copy per stage (tests will grep these literal strings)
//   - Single banner for 2+ rotations ("multi" variant)
//   - No user-hideable toggle (security anti-pattern per UI-SPEC; tests
//     enforce persistence until stage transitions out of the window)
//
// Pattern lineage:
//   - 201 danger/page.module.css .purgeBanner (warn banner ancestor)
//   - 202 /settings/mcp/page.module.css .atCapBanner (rename-and-reuse)
//   - 201 invite/[token]/page.module.css (errorMessage T-0 escalation tokens)

import styles from './RotationGraceBanner.module.css';

export type RotationStage = 't-7' | 't-1' | 't-0' | 'normal';

export interface Rotation {
  id: string;
  subscription_id: string;
  url: string;
  grace_ends_at: string; // ISO timestamp
  stage: RotationStage;
}

export interface RotationGraceBannerProps {
  rotations?: Rotation[];
}

// Format grace_ends_at ISO as a human-readable time-of-day string for T-0
// copy ("will be purged at {time}"). Matches 201 <time dateTime=...>
// posture — readable wall-clock without timezone noise.
function formatGraceTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toUTCString();
  } catch {
    return iso;
  }
}

export default function RotationGraceBanner({ rotations }: RotationGraceBannerProps) {
  // 2a — nothing to render when no active rotations.
  if (!rotations || rotations.length === 0) {
    return null;
  }

  // 2f — multi-rotation variant: single banner summarizing N rotations.
  if (rotations.length > 1) {
    return (
      <div className={styles.rotationGraceBanner} role="status" data-stage="multi">
        <strong>{rotations.length} signing-secret rotations in progress.</strong>{' '}
        <a href="/settings/webhooks?filter=rotating" className={styles.graceLink}>
          Review all rotations
        </a>
      </div>
    );
  }

  // Single-rotation variants: stage-specific locked copy.
  const r = rotations[0];
  const stage = r.stage;
  const settingsHref = `/settings/webhooks/${r.subscription_id}?tab=settings`;

  // 'normal' is out of the notification window — render nothing.
  if (stage === 'normal') {
    return null;
  }

  if (stage === 't-7') {
    return (
      <div className={styles.rotationGraceBanner} role="status" data-stage="t-7">
        <strong>Signing-secret rotation in progress.</strong>{' '}
        7 days remain in the grace window.{' '}
        <a href={settingsHref} className={styles.graceLink}>
          Review rotation for {r.url}
        </a>
      </div>
    );
  }

  if (stage === 't-1') {
    return (
      <div className={styles.rotationGraceBanner} role="status" data-stage="t-1">
        <span className={styles.pulseDot} aria-hidden="true" />
        <strong>Signing-secret rotation ends tomorrow.</strong>{' '}
        Verify subscribers have switched to the new signature.{' '}
        <a href={settingsHref} className={styles.graceLink}>
          Open settings
        </a>
      </div>
    );
  }

  // stage === 't-0' (final day escalation).
  return (
    <div className={styles.rotationGraceBanner} role="status" data-stage="t-0">
      <strong>Grace window ends today.</strong>{' '}
      The old signing secret will be purged at {formatGraceTime(r.grace_ends_at)}.{' '}
      <a href={settingsHref} className={styles.graceLink}>
        Open settings
      </a>
    </div>
  );
}
