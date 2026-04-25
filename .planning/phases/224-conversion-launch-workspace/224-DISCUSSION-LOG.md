# Phase 224: Conversion and Launch Workspace - Discussion Log

> **Audit trail only.** Decisions captured in `224-CONTEXT.md`.

**Date:** 2026-04-24
**Phase:** 224-conversion-launch-workspace
**Mode:** discuss (--chain)
**Areas discussed:** Page composition, Form engine, ConversionEvent envelope, Launch object granularity, LaunchSurface coordination, Rollback posture, Pricing safety, Experimentation scope, API/MCP surface, Public delivery, Bot+abuse posture

---

## Page composition runtime

| Option | Description | Selected |
|--------|-------------|----------|
| Block-based ConversionPage with content_blocks[] + governed renderer + Next.js route adapter | SSR composition; doc 23 rule 2; tenant pages without code deploy. | ✓ |
| Next.js route-per-page + ConversionPage metadata layer (no renderer) | Lighter; tenant pages need code deploy. | |
| External page builder + governance webhook | Heavyweight; not native. | |

**User's choice:** Block-based renderer (Recommended). No visual builder in v1; JSON-edit content_blocks via TemplateEditor pattern.

---

## Form engine architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Generic ConversionForm + variables_schema + dynamic React renderer | Tenant-self-serve; reuses P223 channel_templates pattern; identity stitch on submit. | ✓ |
| Typed React forms registered to ConversionForm contract | Type-safe; tenants can't self-serve. | |
| Hybrid (typed React for signup, dynamic for marketing) | Asymmetric. | |

**User's choice:** Generic dynamic (Recommended).

---

## ConversionEvent envelope

| Option | Description | Selected |
|--------|-------------|----------|
| Separate conversion_events table joined to cdp_events via shared source_event_ref | Keeps cdp_events lean; conversion-specific dims queryable. | ✓ |
| Extend cdp_events with surface_id/form_id/experiment_variant_id | cdp_events bloat; violates D-08 envelope generality. | |
| Triple-write (cdp_events + conversion_events + dispatch_events) | Write amplification. | |

**User's choice:** Separate table with FK join (Recommended).

---

## Launch object granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Full doc 26: LaunchBrief + LaunchSurface + LaunchGate + LaunchRunbook + LaunchOutcome (5 tables) | Matches doc 26; auditable; rollback first-class. | ✓ |
| Minimal v1 (LaunchPlan + readiness + outcome) | Defers hard work; rollback informal. | |
| Hybrid (Brief + Surface + Outcome only, defer Gate + Runbook) | No governed go/no-go. | |

**User's choice:** Full doc 26 (Recommended).

---

## LaunchSurface ↔ engine coordination

| Option | Description | Selected |
|--------|-------------|----------|
| Polymorphic ref: surface_target_kind + surface_target_id + per-kind FK CHECK | Single column; matches doc 26 surface_type; new types add no columns. | ✓ |
| Explicit per-type FK columns (8 nullable FKs) | Type-safe; bloats schema. | |
| Loose name-based join | No FK enforcement. | |

**User's choice:** Polymorphic ref with CHECK (Recommended).

---

## Rollback posture

| Option | Description | Selected |
|--------|-------------|----------|
| Reverse-runbook steps + LaunchSurface published→archived + audit row | Doc 26 reversibility; AgentRun pause/cancel. | ✓ |
| Snapshot+restore | Complex schema; can't unsend dispatched broadcasts. | |
| Delete + recreate | No history; violates audit. | |

**User's choice:** Reverse-runbook (Recommended). Non-reversible steps emit operator task.

---

## Pricing safety enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Both layers: pre-publish LaunchGate + runtime placeholder enforcement on every render | Belt-and-suspenders; survives post-publish drift. | ✓ |
| Pre-publish gate only | Hardcoded pricing in body bypasses. | |
| Runtime placeholder only | No pre-launch verification audit. | |

**User's choice:** Both layers (Recommended). Static-text scan added for currency patterns.

---

## Experimentation scope (P224 vs P225)

| Option | Description | Selected |
|--------|-------------|----------|
| Define ConversionExperiment + variant + assignment in P224; analytics & decision rules deferred to P225 | Doc 23 rule 6 native; clean phase boundary. | ✓ |
| Defer all experiment registry to P225 | Doc 23 rule 6 violated. | |
| Full lifecycle in P224 (registry + decision + winner) | Scope creep into P225. | |

**User's choice:** Native registry + assignment in P224, analytics in P225 (Recommended).

---

## API + MCP surface

| Option | Description | Selected |
|--------|-------------|----------|
| Read-write v1 /v1/conversion/* + /v1/launches/* + 6 MCP tools | P224 IS conversion + launch engine; downstream P226/P227 consume. | ✓ |
| Read-only v1; mutations library + UI only | Blocks P226/P227. | |
| Minimal MCP (3 tools) | Insufficient for downstream automation. | |

**User's choice:** Full read-write + 6 MCP (Recommended).

---

## Public surface delivery + caching

| Option | Description | Selected |
|--------|-------------|----------|
| Next.js dynamic route + ISR + revalidateTag(updateTag) on publish/rollback | Vercel knowledge update Cache Components; fast public pages + governed mutation. | ✓ |
| Static generation + redeploy on publish | Slow publish; rollback requires redeploy. | |
| Pure SSR every request | High TTFB; doc 23 rule 7 violated. | |

**User's choice:** ISR + Cache Components + updateTag (Recommended).

---

## Bot + abuse posture

| Option | Description | Selected |
|--------|-------------|----------|
| BotID + tenant rate limit + honeypot + ConsentState double-gate at submit | Defense-in-depth; carries P201 signup pattern. | ✓ |
| BotID + rate limit only | No honeypot. | |
| Rate limit only | Insufficient. | |

**User's choice:** Full defense-in-depth (Recommended).

---

## Claude's Discretion

- Module boundary `lib/markos/conversion/*` and `lib/markos/launches/*`.
- Block schema versioning + deprecation.
- Experiment hash function (xxhash3 vs SHA-256).
- Cron schedules (surface health audit, gate poll, outcome computation).
- ContentClassifier extension for ConversionPage block bodies.
- ISR cache TTL per page_type.
- Visual page builder (drag-and-drop) — fully deferred.

## Deferred Ideas

- Visual page builder; A/B/n MVAB; personalization ML; webhook form integrations; multi-step forms; chatbot conversion surface; video/interactive demo blocks; rich media block types.
- Cross-tenant launch templates → P218/P227.
- Auto-detected readiness via P210 connectors → P226.
- Post-launch narrative AI → P225.
- Multi-region launch coordination → P228.
- Launch revenue attribution beyond first-touch → P225.
- Pre-launch competitor scan → P226.
- Partner-coordinated cross-tenant launches → P227.
- Statistical winner detection / ICE / decision rules → P225.
