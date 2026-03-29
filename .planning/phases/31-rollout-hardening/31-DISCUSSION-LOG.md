# Phase 31: Rollout Hardening - Discussion Log

> Audit trail only. Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves alternatives considered.

**Date:** 2026-03-28
**Phase:** 31-rollout-hardening
**Areas discussed:** SLO policy thresholds, Migration safety mode transitions, Security and retention boundaries, Compatibility deprecation gates

---

## SLO Policy Thresholds

| Option | Description | Selected |
|--------|-------------|----------|
| Tiered by endpoint criticality | Use stricter budgets for write-critical endpoints and looser for integration endpoints. | ✓ |
| Single uniform SLO | Same objective/error budget for all four endpoints. | |
| Readiness gate only | Track metrics but delay budget-triggered actions until post-rollout baseline. | |

**User's choice:** Tiered by endpoint criticality
**Notes:** Keep critical write endpoints as stricter rollout gates while still monitoring integration paths.

---

## Migration Safety Mode Transitions

| Option | Description | Selected |
|--------|-------------|----------|
| Strict phased promotion | dry-run -> dual-write -> cloud-primary with explicit rollback criteria and owner sign-off. | ✓ |
| Fast-track promotion | dry-run -> cloud-primary directly when smoke checks pass. | |
| Environment-driven automatic switch | Runtime flags and health checks drive transitions without manual gate approvals. | |

**User's choice:** Strict phased promotion
**Notes:** Promotion should be gated by sign-off at each transition checkpoint.

---

## Security and Retention Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Strict production policy now | Fail-fast secret validation, mandatory redaction, fixed retention bounds in all modes. | ✓ |
| Soft enforcement pre-launch | Warn first, then enforce hard policy after launch. | |
| Local relaxed, hosted strict | Hard policy only in hosted runtime; warnings in local flows. | |

**User's choice:** Strict production policy now
**Notes:** Enforcement should not be delayed.

---

## Compatibility Deprecation Gates

| Option | Description | Selected |
|--------|-------------|----------|
| Telemetry and readiness gates | Require usage thresholds plus protocol/migration readiness checks. | |
| Calendar-based sunset | Retire on scheduled dates regardless of usage. | |
| Manual operator discretion | Deprecation proceeds case-by-case without fixed thresholds. | ✓ |

**User's choice:** Manual operator discretion
**Notes:** Follow-up decision selected no hard minimum evidence before retiring a legacy surface.

### Deprecation Follow-up

| Option | Description | Selected |
|--------|-------------|----------|
| No hard minimum | Operator judgement alone can retire a surface. | ✓ |
| Protocol tests must stay green | Require protocol suite pass before and after retirement change. | |
| Protocol + migration evidence | Require protocol pass plus migration dry-run/rollback evidence. | |
| Usage review only | Require operator-reviewed usage snapshot without automated checks. | |

**User's choice:** No hard minimum
**Notes:** This explicitly relaxes pre-retirement validation gates.

---

## the agent's Discretion

- Convert selected SLO strategy into concrete numeric thresholds during planning.
- Define transition ownership and gate-check mechanics for each migration mode stage.

## Deferred Ideas

- None captured in this discussion.

---

*Phase: 31-rollout-hardening*
*Discussion log generated: 2026-03-28*
