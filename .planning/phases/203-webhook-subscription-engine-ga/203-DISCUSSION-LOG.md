# Phase 203: Webhook Subscription Engine GA - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 203-webhook-subscription-engine-ga
**Areas discussed:** Dashboard UX, DLQ + replay, Rotation flow, Rate-limit + breaker + adapter

---

## Dashboard UX

### Q1: Subscription list shape for /settings/webhooks?

| Option | Description | Selected |
|--------|-------------|----------|
| Table | Columns: URL, events, status, last delivery, success rate, actions. Dense, scannable. Matches /settings/mcp sessions table from 202-09. | ✓ |
| Card grid | One card per sub with URL header + inline health chart. More visual, less dense. Better for <10 subs. | |
| Split panel | Left: sub list. Right: selected sub detail with deliveries + DLQ inline. Stripe-style. Heavier build. | |

**User's choice:** Table (Recommended) → D-01

### Q2: Delivery log presentation?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline row expand | Click delivery row → expands to show request/response/headers inline. Keeps context, no modal/drawer weight. | ✓ |
| Side drawer | Click row → slides drawer with full detail + raw body. Separates list from detail. | |
| Full detail page | Click row → routes to /settings/webhooks/deliveries/{id}. Deep-linkable, heaviest. | |

**User's choice:** Inline row expand (Recommended) → D-02

### Q3: DLQ pane placement?

| Option | Description | Selected |
|--------|-------------|----------|
| Tab on sub detail | DLQ lives inside each sub's detail: Deliveries \| DLQ \| Settings tabs. Scoped. | ✓ |
| Global /settings/webhooks/dlq | Cross-sub DLQ view with filters. Admin-friendly for fleet ops. | |
| Hybrid | Per-sub tab + global view. Both. More surface area. | |

**User's choice:** Tab on sub detail (Recommended) → D-03

### Q4: Fleet metrics placement?

| Option | Description | Selected |
|--------|-------------|----------|
| Hero banner on index | Top of /settings/webhooks: 4 big numbers — 24h deliveries / success % / avg latency / DLQ count. Matches /settings/mcp cost-meter hero. | ✓ |
| Sidebar per-sub | Inline with each sub row: mini sparkline of last-24h success rate. | |
| Separate /status page | Public webhook status page (part of scope) doubles as metrics home. | |

**User's choice:** Hero banner on index (Recommended) → D-04

---

## DLQ + Replay

### Q5: DLQ replay scope?

| Option | Description | Selected |
|--------|-------------|----------|
| Single + batch select | Checkbox select multi rows → Replay button. Also single-row replay. Covers 90% ops without time-range complexity. | ✓ |
| Single only | One replay per click. Simpler, but fleet replays painful after outages. | |
| Time-range + filter | Replay all DLQ entries between T1–T2 matching event=X. Power-user. Heavier UI. | |

**User's choice:** Single + batch select (Recommended) → D-05

### Q6: Signature on replay?

| Option | Description | Selected |
|--------|-------------|----------|
| Re-sign with fresh ts | New HMAC + current timestamp. Safe against skew window. Add `x-markos-replayed-from: {original_ts}` header for subscriber audit. | ✓ |
| Preserve original signature+ts | Exact replay. But 300s skew window (from 200-03) rejects. Would force skew bypass — replay attack vector. | |
| Re-sign + attempt counter | Re-sign + increment `x-markos-attempt` header. Same safety + explicit attempt trail. | |

**User's choice:** Re-sign with fresh ts (Recommended) — but the chosen option in D-06 combines headers from Option C (`x-markos-attempt`) with Option A (`x-markos-replayed-from`) for full audit trail.

### Q7: Auto-retry policy from DLQ?

| Option | Description | Selected |
|--------|-------------|----------|
| Manual only | DLQ is terminal after 24 attempts (200-03 cap). Human decides. Prevents replay→fail→replay loops. | ✓ |
| Auto-retry on circuit close | Breaker trips open → DLQ fills → breaker closes → auto-drain DLQ. Fast recovery but surprises subscribers. | |
| Opt-in per sub | Flag on sub: auto_drain_on_recovery: true\|false. Flexible, more UI/config. | |

**User's choice:** Manual only (Recommended) → D-07

### Q8: DLQ TTL / retention?

| Option | Description | Selected |
|--------|-------------|----------|
| 7 days | Matches Stripe/GitHub webhook replay window. Long enough for weekend outage + Monday ops. Short enough that storage stays cheap. | ✓ |
| 30 days | Mirrors signing-secret rotation grace. Heavier storage, mostly unused entries. | |
| Tenant-configurable | Default 7d, overridable per plan tier. More config surface. | |

**User's choice:** 7 days (Recommended) → D-08

---

## Rotation flow

### Q9: Rotation trigger?

| Option | Description | Selected |
|--------|-------------|----------|
| Admin-triggered | Tenant admin clicks Rotate. Auto-rotate adds scheduler complexity for little gain — SOC2 expects human-in-loop on secret events. | ✓ |
| Auto every 90d + admin override | Background rotation + admin can force rotate. Good for compliance, scheduler cost. | |
| Admin + compromise-triggered auto | Admin default, but auto on anomaly signal (breach detect). Needs anomaly source — not in scope. | |

**User's choice:** Admin-triggered (Recommended) → D-09

### Q10: Overlap window semantics?

| Option | Description | Selected |
|--------|-------------|----------|
| Outbound dual-sign | During overlap, every webhook signed with BOTH secrets (two headers: `x-markos-signature-v1` + `x-markos-signature-v2`). Subscriber verifies either. Standard Stripe pattern. | ✓ |
| Single outbound sign, dual verify | Sign only with new. Subscribers keep both verify keys. Lower bandwidth, but breaks for subscribers that haven't rotated their verify logic. | |
| Cutover (no overlap, brief) | Rotate = swap. Violates 30-day grace constraint. Reject. | |

**User's choice:** Outbound dual-sign (Recommended) → D-10

### Q11: Rotation notifications?

| Option | Description | Selected |
|--------|-------------|----------|
| T-7 + T-1 + T-0 email + UI banner | Email tenant admins 7 days before old secret dies + 1 day + on cutover. Dashboard banner during grace. | ✓ |
| T-1 + T-0 email | Minimal. Saves 1 email. Tighter recovery window for teams that missed banners. | |
| UI banner only | No email. Relies on admin checking dashboard. Risky for infrequent users. | |

**User's choice:** T-7 + T-1 + T-0 email + UI banner (Recommended) → D-11

### Q12: Rollback path during grace?

| Option | Description | Selected |
|--------|-------------|----------|
| Restore old as new | During grace window, admin can promote old secret back to active — cancels rotation. After grace (30d), old is purged and unrecoverable. | ✓ |
| No rollback, issue new rotation | Compromised rotation → rotate again. Leaves window of confusion. | |
| Rollback both ways anytime | Even after grace, old retained encrypted for emergency restore. Security risk — old secret lives forever. | |

**User's choice:** Restore old as new (Recommended) → D-12

---

## Rate-limit + breaker + adapter

### Q13: Per-sub RPS cap source?

| Option | Description | Selected |
|--------|-------------|----------|
| Plan-tier default + per-sub override | Free: 10rps, Team: 60rps, Enterprise: 300rps. Tenant admin can lower per-sub. Never raise above plan ceiling. Matches 202-04 pattern. | ✓ |
| Plan-tier only | No per-sub override. Simpler. But teams with noisy single endpoint can't throttle it. | |
| Per-sub user-set, no plan caps | Tenant admin sets each sub's RPS freely. Risk: free tier floods our egress. | |

**User's choice:** Plan-tier default + per-sub override (Recommended) → D-13

### Q14: Circuit breaker trip condition?

| Option | Description | Selected |
|--------|-------------|----------|
| Error-rate window | Trip when >50% of last 20 deliveries fail (5xx/timeout). Sliding window survives single-bad-deploy blips. | ✓ |
| Consecutive 5xx count | Trip after N consecutive failures (e.g. 10). Simpler, but flaps on intermittent failures. | |
| Both thresholds OR'd | Trip if consecutive=10 OR rate>50%/window. Most defensive. More state. | |

**User's choice:** Error-rate window (Recommended) → D-14

### Q15: Half-open re-probe cadence?

| Option | Description | Selected |
|--------|-------------|----------|
| Exponential backoff 30s→10m | First probe 30s after trip, then 1m, 2m, 5m, 10m. Caps at 10m. Aligns with 200-03 delivery backoff shape. | ✓ |
| Fixed 1m interval | Probe every 60s. Predictable. Burns capacity on long outages. | |
| Fibonacci 30s/1m/2m/3m/5m/8m | Gentler curve. More code. | |

**User's choice:** Exponential backoff 30s→10m (Recommended) → D-15

### Q16: Store adapter swap timing?

| Option | Description | Selected |
|--------|-------------|----------|
| Swap to Supabase + Queues first | Wave 1: drop-in adapter per 200-03.1. Process-local singleton won't survive Vercel Fluid concurrency across instances. All GA features need durable state. | ✓ |
| Layer GA features on in-memory, swap last | Ship UI/DLQ/rotation against in-memory, swap adapter in Wave 5. Faster early wins but forces contract churn. | |
| Hybrid | Supabase for subs + DLQ, keep in-memory for delivery queue. Middle ground. | |

**User's choice:** Swap to Supabase + Queues first (Recommended) → D-16

---

## Claude's Discretion

Areas where the user deferred implementation detail to Claude (captured in CONTEXT.md `<decisions>` section):
- Sentry telemetry schema — match 202-05 log-drain shape
- Test-fire flow UI — follow existing 200-03 `test-fire.js` contract
- Egress SSRF guard for subscriber URLs
- Event-type filtering at subscribe time — reuse existing `events: string[]` schema
- Public webhook status page shape — same numbers as fleet metrics hero, without per-sub detail

## Deferred Ideas

- Custom payload transformations (Phase 210)
- Time-range replay filter
- Auto-rotation scheduler (90-day)
- Compromise-triggered rotation
- Post-grace secret restore (rejected)
- Per-sub auto-drain on circuit close
