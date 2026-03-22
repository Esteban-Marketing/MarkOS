---
phase: [FILL — phase number]
phase_name: [FILL]
discipline: [FILL — paid_acquisition | seo_organic | lifecycle_email | ...]
type: standard
created: [FILL — ISO date]
---

# Phase {N}: {Name} — Validation Strategy

**Purpose:** Maps phase deliverables to verification methods. Created by plan-phase from RESEARCH.md validation architecture.

## Phase Goal
[FILL — from ROADMAP.md]

## Deliverables and Verification Methods

| Deliverable | Verification Method | Responsible | Dimension |
|-------------|-------------------|-------------|-----------|
| [FILL — e.g., Ad campaigns live] | [FILL — e.g., Screenshot from Ads Manager] | AI / Human | Tracking |
| [FILL — e.g., PostHog events firing] | [FILL — e.g., PostHog dashboard event log] | Human | Tracking |
| [FILL — e.g., Landing page live] | [FILL — e.g., curl URL returns 200] | AI | Variable Resolution |

## MIR Gate Requirements

Gate 1 (Identity) — files that must be populated before this phase:
- [FILL — e.g., Core_Strategy/01_COMPANY/PROFILE.md]

Gate 2 (Execution) — files that must be populated:
- [FILL — e.g., Core_Strategy/06_TECH-STACK/TRACKING.md]

## KPI Measurement Plan

| KPI | Baseline | Target | Data Source | Review Date |
|-----|---------|--------|------------|-------------|
| [FILL] | [FILL] | [FILL] | [FILL] | [FILL] |

## Human Testing Items

Steps that require platform access to verify:
1. [FILL — e.g., "Log into Meta Ads Manager → verify pixel firing on /thank-you"]
2. [FILL]

## Automated Checks

Verifiable via file read or CLI:
- [FILL — e.g., "TRACKING.md contains event 'lead_form_submit' with campaign_id property"]
- [FILL]

---
*Phase {N} Validation Strategy — created {date}*
