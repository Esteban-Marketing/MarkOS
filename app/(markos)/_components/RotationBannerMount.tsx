'use client';

// Phase 203 Plan 11 Task 1 — Surface 4 shell-level mount.
//
// One-shot client fetch of /api/tenant/webhooks/rotations/active on mount;
// passes the resulting `rotations` array to <RotationGraceBanner />.
// Banner self-renders null when the list is empty, so this component is
// ambient + zero-cost on pages with no active rotations.
//
// No user-hideable toggle (UI-SPEC §Surface 4 security rule: active
// rotation is a live security-relevant state; admins must not miss it).

import { useEffect, useState } from 'react';

import RotationGraceBanner from './RotationGraceBanner';
import type { Rotation } from './RotationGraceBanner';

export default function RotationBannerMount() {
  const [rotations, setRotations] = useState<Rotation[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/tenant/webhooks/rotations/active', {
          method: 'GET',
          credentials: 'same-origin',
        });
        if (!res.ok) {
          // 401 pre-auth / 500 transient — render nothing, never block shell.
          return;
        }
        const body = (await res.json()) as { rotations?: Rotation[] };
        if (!cancelled && Array.isArray(body.rotations)) {
          setRotations(body.rotations);
        }
      } catch {
        // Network failure — silent; banner stays absent.
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return <RotationGraceBanner rotations={rotations} />;
}
