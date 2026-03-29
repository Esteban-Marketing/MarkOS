---
token_id: MARKOS-REF-OPS-01
document_class: reference
domain: ops
version: 1.0
status: active
upstream: []
downstream:
  - token_id: MARKOS-AGT-STR-01
    path: agents/markos-strategist.md
    relationship: reads_gate_enforcement_rules
  - token_id: MARKOS-AGT-CNT-01
    path: agents/markos-content-creator.md
    relationship: reads_gate1_requirement
  - token_id: MARKOS-AGT-TRK-01
    path: agents/markos-tracking-spec.md
    relationship: reads_gate2_requirement
  - token_id: MARKOS-AGT-TRK-02
    path: agents/markos-utm-architect.md
    relationship: reads_gate2_requirement
  - token_id: MARKOS-SKL-CAM-03
    path: skills/markos-mir-audit/SKILL.md
    relationship: executes_gate_check
mir_gate_required: none
---

# MIR Gates — Readiness Check Logic

## Purpose

**Function:** Defines Gate 1 (Identity) and Gate 2 (Execution) readiness requirements, the check procedure, and which agents are blocked by each gate.
**Produces:** Gate status signal read by pre-execution hooks and agents before any campaign action.
**Consumed by:** MARKOS-AGT-STR-01, MARKOS-AGT-CNT-01, MARKOS-AGT-TRK-01, MARKOS-AGT-TRK-02, MARKOS-SKL-CAM-03

## Scope of Authority

Every AGT document must declare its `mir_gate_required` frontmatter field pointing to `1`, `2`, or `none`. The enforcement table in `## Agent Enforcement` below is authoritative; individual agent files do not override it.

## Verification Frequency

Verify gate file lists against active MIR directory contents on every milestone transition.

---

MIR gates enforce a knowledge-before-execution principle. No campaign launches without verified business identity and tracking infrastructure.

## Gate 1 — Identity (Must pass before strategy)

Required files with status `complete` or `verified`:

| File | What it provides |
|------|-----------------|
| `Core_Strategy/01_COMPANY/PROFILE.md` | Business identity, legal name, geography |
| `Core_Strategy/02_BRAND/VOICE-TONE.md` | Language rules, prohibited words, tone-by-context |
| `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` | Value props, objection responses, headline bank |
| `Core_Strategy/02_BUSINESS/LEAN-CANVAS.md` | Business model physics (CPA, LTV, Revenue) |
| `Core_Strategy/02_BUSINESS/JTBD-MATRIX.md` | Buyer psychology (Triggers, Pains, Gains) |

**Gate 1 RED means:** Agent cannot generate copy, briefs, or campaign drafts. The brand foundation is incomplete.

## Gate 2 — Execution (Must pass before campaign launch)

Required files with status `complete` or `verified`:

| File | What it provides | Block If |
|------|-----------------|----------|
| `Core_Strategy/06_TECH-STACK/TRACKING.md` | PostHog events, CAPI params, pixel IDs | Empty — tracking is unconfigured |
| `Core_Strategy/06_TECH-STACK/AUTOMATION.md` | n8n workflows, webhook URLs, API keys | Empty — automation stack is unconfigured |
| `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md` | Ad account IDs, budget caps, pixel IDs per platform | Empty — no ad account identifiers to launch against |
| `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md` | KPI targets for verification; baseline metrics | Empty — no targets to verify campaign performance against |

**Gate 2 RED means:** Agent cannot validate tracking, generate UTM specs, confirm pixel coverage, check budget caps, or verify KPI targets. Campaigns launch blind and unverifiable.

**Gate 2 partial:** If TRACKING.md and AUTOMATION.md are complete but PAID-MEDIA.md or KPI-FRAMEWORK.md are missing, agent can plan and configure but cannot approve campaign launch.

## Check Logic

```bash
INIT=$(node ".agent/markos/bin/markos-tools.cjs" mir-audit)
```

Parse JSON `gate1.ready` and `gate2.ready`:
- Both `true` → proceed normally
- Gate 1 `false` → block creative and strategy agents
- Gate 2 `false` → allow planning but block launch verification

## Agent Enforcement

| Agent | TOKEN_ID | Gate 1 Required | Gate 2 Required |
|-------|---------|----------------|----------------|
| markos-strategist | MARKOS-AGT-STR-01 | ✓ | — |
| markos-content-creator | MARKOS-AGT-CNT-01 | ✓ | — |
| markos-copy-drafter | MARKOS-AGT-CNT-02 | ✓ | — |
| markos-social-drafter | MARKOS-AGT-CNT-03 | ✓ | — |
| markos-email-sequence | MARKOS-AGT-CNT-04 | ✓ | — |
| markos-campaign-architect | MARKOS-AGT-STR-03 | ✓ | — |
| markos-creative-brief | MARKOS-AGT-STR-04 | ✓ | — |
| markos-planner | MARKOS-AGT-STR-02 | ✓ | — |
| markos-tracking-spec | MARKOS-AGT-TRK-01 | — | ✓ |
| markos-utm-architect | MARKOS-AGT-TRK-02 | — | ✓ |
| markos-campaign-launch | MARKOS-SKL-CAM-01 | ✓ | ✓ |
| markos-analyst | MARKOS-AGT-ANA-05 | — | ✓ |
| markos-funnel-analyst | MARKOS-AGT-ANA-01 | — | ✓ |
| markos-performance-monitor | MARKOS-AGT-ANA-02 | — | ✓ |
| paid_media_creator | MARKOS-PRM-PM-01 | ✓ | — |
| email_lifecycle_strategist | MARKOS-PRM-EM-01 | ✓ | — |
| cro_landing_page_builder | MARKOS-PRM-LC-01 | ✓ | ✓ |
| seo_content_architect | MARKOS-PRM-SEO-01 | ✓ | — |
| social_community_manager | MARKOS-PRM-SOC-01 | ✓ | — |
| brand_enforcer_qa | MARKOS-PRM-QA-01 | ✓ | — |
| telemetry_synthesizer | MARKOS-PRM-TRK-01 | — | ✓ |
| markos-auditor | MARKOS-AGT-OPS-08 | — | — |
| markos-linear-manager | MARKOS-AGT-OPS-07 | — | — |
| markos-context-loader | MARKOS-AGT-OPS-01 | — | — |
| markos-librarian | MARKOS-AGT-OPS-02 | — | — |

## Override

If `mir_gate_enforcement: false` in `.planning/config.json`, gates are checked but not enforced. Warnings are still displayed.
