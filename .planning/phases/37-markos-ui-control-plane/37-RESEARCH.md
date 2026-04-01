---
phase: 37
phase_name: MarkOS UI Control Plane + White-Label System
milestone: v2.4
milestone_name: Beta Client Onboarding
researched: "2026-04-01"
domain: Next.js application layer, design system linkage, MIR/MSP operations
confidence: HIGH
---

# Phase 37: MarkOS UI Control Plane + White-Label System - Research

**Researched:** 2026-04-01  
**Domain:** Next.js + Tailwind + Supabase productization, white-label theming, MIR/MSP management UX, AI-consumable documentation twin  
**Confidence:** HIGH

## Summary

Phase 37 should establish MarkOS as a product-grade control plane that runs inside an existing Next.js + Tailwind stack backed by the already-provisioned Supabase database. The phase scope is not only campaign activation; it is the operating UI that makes campaign activation reliable, governable, and scalable for both humans and AI agents. The control plane must expose the full operational lifecycle: company profile, MIR, MSP, ICPs, segments, campaign assets, and execution telemetry, while preserving current onboarding/runtime contracts from Phases 34 and 36.

The core requirement is a dual-surface architecture:
1. Human surface: low-friction, guided workflows with role-aware permissions, inline validation, recovery states, and strong anti-error UX.
2. Agent surface: canonical, structured, versioned records with stable schemas and retrieval APIs so AI agents can consume and update the same source of truth safely.

The design foundation should be token-driven and white-label-ready from day one. That means design tokens, semantic color ramps, typographic scales, component variants, and tenant branding are linked by contract to the design system, so one design-system change can propagate across all MarkOS surfaces without fragmentation.

This phase should produce the architecture and implementation plan for a production-ready app shell and core modules, not a prototype. The target is operational readiness for current environments where Next.js, Tailwind, and Supabase already exist.

---

## Competitive Landscape

### 1. Notion + internal overlays (documentation-first competitors)

- Strengths:
  - Fast authoring and collaborative editing.
  - Good for strategy docs and team memory.
- Weaknesses:
  - Weak operational guardrails for structured marketing execution.
  - Poor native coupling between strategy artifacts and campaign workflows.
  - AI-agent consumption often requires brittle exports/parsing.

**Opportunity for MarkOS:** own the documentation + execution bridge with schema-first records and workflow-aware editing.

### 2. Airtable / Coda stacks (ops-table competitors)

- Strengths:
  - Flexible relational-ish workspace views.
  - Good low-code data operations.
- Weaknesses:
  - Design-system consistency and white-label depth are limited.
  - Enterprise-grade leakage controls and semantic publishing workflows require heavy custom work.
  - Strategy content and campaign ops usually drift apart across bases/docs.

**Opportunity for MarkOS:** deliver opinionated marketing domain models (MIR/MSP/ICP/segment/campaign) with strict permissions and coherent UX.

### 3. Retool/Appsmith + custom DB backends (internal-tool competitors)

- Strengths:
  - Rapid CRUD dashboard delivery.
  - Fast admin tooling for technical teams.
- Weaknesses:
  - Poor product-grade UX for non-technical marketing operators.
  - Weak narrative/documentation twin behavior.
  - Theming often feels bolted-on, not truly brand-native.

**Opportunity for MarkOS:** become the branded operator-facing system, not a raw admin console.

### 4. HubSpot / enterprise suites (suite competitors)

- Strengths:
  - Mature campaign and CRM workflows.
  - Rich analytics and ecosystem.
- Weaknesses:
  - Heavy setup and opinion lock-in.
  - Limited control over custom knowledge contracts and AI-native content models.
  - White-label constraints for agency-style deployments.

**Opportunity for MarkOS:** faster deployment, deeper customization, and AI-native repository behavior for agency and growth teams.

### Strategic readout

The market gap is a white-label, marketing-native operating system that merges strategy docs, campaign operations, and agent-safe structured data in one surface. MarkOS can occupy this by shipping a strongly modeled control plane rather than generic workspace primitives.

---

## Audience Intelligence

### Primary personas

1. Growth Operator / Head of Marketing
- Needs quick visibility, safe edits, and clear campaign-to-strategy traceability.
- Pain: fragmented tools, inconsistent metrics, and manual sync overhead.

1. Agency Delivery Lead
- Needs multi-client governance, white-label presentation, and low-risk collaboration flows.
- Pain: branding inconsistencies, permission sprawl, and context loss during handoffs.

1. Strategist / Content Lead
- Needs rich documentation UX plus structured publishing to operational systems.
- Pain: doc quality degrades when moved into tactical tools.

1. AI Agent / Automation Layer
- Needs stable schemas, explicit versioning, and deterministic retrieval paths.
- Pain: unstructured text blobs, missing metadata, and mutable formats.

### Behavioral requirements extracted from request

- Must run in current Next.js/Tailwind/Supabase environments without greenfield replatforming.
- Must support white-labeling via design-system linkage, not one-off CSS overrides.
- Must reduce friction and errors through guided workflows, defaults, and validation.
- Must reduce leakage risk through role separation, scoped access, and auditable changes.
- Must support full read/edit/manage flows for company info, MIR/MSP, ICPs, segments, and related strategy assets.

---

## Channel Benchmarks

Benchmarks below are practical product targets for a modern B2B SaaS control plane in marketing operations.

| metric | industry avg | target |
|---|---|---|
| Time to first configured workspace | 30-90 min | under 12 min |
| Primary navigation depth to key entities (MIR/MSP/ICP) | 3-5 clicks | 1-2 clicks |
| Form completion success for structured strategy edits | 70-85% | 95%+ |
| Validation error rate per save attempt | 8-20% | under 3% |
| Mean time to resolve blocking validation errors | 5-15 min | under 2 min |
| Theme switch propagation latency across app | mixed/manual | immediate (same session) |
| Role-scoped data leakage incidents (internal QA) | occasional in early-stage tools | zero tolerated |
| AI retrieval success on canonical artifacts | 60-80% in unstructured repos | 98% structured retrieval success |
| Lighthouse performance score (dashboard routes) | 70-85 | 92+ |
| Largest Contentful Paint (core pages) | 2.5-4.0s | under 2.0s |

---

## Recommended Approach

### Product architecture outcome for Phase 37

Implement a modular MarkOS Control Plane in Next.js App Router with Supabase-backed domain modules and a tokenized UI system:

1. App shell and workspace model
- Tenant/workspace switcher, role-aware nav, command palette, global search.
- Sections: Dashboard, Company, MIR, MSP, ICPs, Segments, Campaigns, Documentation Twin, Settings.

1. Domain model and contract-first data layer
- Canonical entities:
  - Company Profile
  - MIR Documents (typed sections)
  - MSP Plans and channel matrices
  - ICP Profiles
  - Segments
  - Campaign Records and Outcomes
  - Artifact Versions and Change Logs
- Supabase tables and RLS policies aligned to workspace and role scopes.

1. Edit lifecycle and governance
- Draft -> Validate -> Review -> Publish states for strategic artifacts.
- Conflict-safe editing with optimistic UI + server reconciliation.
- Revision history and rollback for all high-value objects.

1. White-label design-system linkage
- Design tokens as source of truth (color, typography, spacing, radius, motion, semantic states).
- Token ingestion path for tenant brand packs.
- Component library driven by semantic tokens, not hardcoded palette values.
- Theme editor with live preview and guardrails for contrast/accessibility.

1. AI-consumable documentation twin
- Each artifact stores:
  - human_rendered_content
  - structured_json_contract
  - metadata (owner, status, version, updated_at, confidence)
  - embeddings/index pointer for retrieval
- Publish pipeline writes canonical machine-readable snapshots for agents.

1. UX reliability and anti-friction design
- Progressive disclosure forms for complex strategy objects.
- Inline field-level guidance and deterministic validation copy.
- Autosave with explicit dirty-state indicator and fail-safe recovery.
- Error boundaries by module with actionable remediation steps.

### Suggested module sequencing

1. Foundation: app shell, auth, workspace context, role model, token pipeline.
2. Core entities: Company + MIR + MSP read/write flows.
3. Strategy objects: ICP + Segments + campaign linkage.
4. Governance: publish workflow, audit logs, rollback.
5. AI twin: contract snapshots, retrieval API, agent permissions.

---

## Platform Capabilities and Constraints

### Existing capabilities to leverage

- Next.js-compatible runtime exists (from current project direction and hosted wrappers).
- Tailwind-based styling pipeline can be extended into full tokenized theming.
- Supabase exists and can host relational domain objects + RLS.
- Existing onboarding/orchestration and intake contracts already provide seed and metadata flows.

### Constraints

1. Backward compatibility
- Existing intake/orchestrator contracts must remain stable while adding UI modules.

1. Data safety and leakage prevention
- Multi-tenant boundaries must be enforced at query layer (RLS), API layer, and client cache boundaries.

1. Performance constraints
- Rich strategy pages can become heavy; server component boundaries and selective hydration are required.

1. White-label complexity
- Brand packs must not break accessibility, layout stability, or component semantics.

1. Agent interoperability
- AI consumers require stable schema versions; ad-hoc rich-text-only storage is insufficient.

### Technical posture recommendation

- Use Next.js server actions or route handlers for mutation boundaries with typed validation.
- Use schema validators (Zod or equivalent) shared across client and server.
- Use Supabase row-level security with role claims and workspace scoping.
- Use typed API contracts for both UI and agent access (same source schema).

---

## Tracking Requirements

Track both UX quality and governance/security outcomes.

### Core product events

| event | required properties | purpose |
|---|---|---|
| `markos_ui_view_loaded` | route, workspace_id, role, load_ms | Baseline route performance and adoption |
| `markos_entity_opened` | entity_type, entity_id, mode, role | Understand operational usage by artifact type |
| `markos_entity_validation_failed` | entity_type, field, rule_id, severity | Detect friction and schema confusion |
| `markos_entity_saved` | entity_type, save_mode, latency_ms, has_warnings | Save reliability and user confidence |
| `markos_entity_published` | entity_type, version, reviewer_role | Governance state transitions |
| `markos_theme_changed` | tenant_id, token_set_version, changed_tokens_count | White-label and design-system operations |
| `markos_access_denied` | route, policy, role, workspace_id | Leakage prevention observability |
| `markos_ai_snapshot_generated` | artifact_type, schema_version, tokens_indexed | Agent-consumable twin health |
| `markos_ai_snapshot_read` | agent_id, artifact_type, schema_version | Agent usage and compatibility tracking |

### Required dimensions and governance metadata

- `workspace_id`, `tenant_id`, `role`, `artifact_id`, `schema_version`, `publish_state`, `request_id`.
- Retention and redaction policies aligned to existing security boundaries.
- No secret or raw PII payload logging in client telemetry.

---

## Risks and Pitfalls

1. Scope explosion
- Building all modules at once can delay value. Sequence by foundation-first vertical slices.

1. Theming without contract discipline
- Ad-hoc CSS overrides will create drift and break white-label promises.

1. UX over-complexity
- Dumping raw schema fields into UI forms increases error rates and abandonment.

1. Hidden leakage vectors
- Client-side caching, broad service-role usage, or missing RLS predicates can expose cross-tenant data.

1. AI/human model divergence
- If machine-readable contracts are not generated from the same source as UI content, twin drift appears quickly.

1. Performance regression
- Rich editors and heavy dashboards can degrade route performance without route-level budget enforcement.

1. Incomplete governance
- Without audit trails and review states, strategic content quality and accountability degrade over time.

---

## Validation Architecture

### 1. Contract validation (must-pass)

- Shared schema tests for Company, MIR, MSP, ICP, Segment, Campaign entities.
- Backward compatibility tests against existing intake/orchestrator contracts.
- Snapshot contract tests for AI twin outputs per schema version.

### 2. Security and leakage validation (must-pass)

- Supabase RLS policy tests for every entity and role.
- Cross-tenant access denial tests at DB and API layers.
- Audit-log integrity tests for publish and permission events.

### 3. UX quality validation

- Task-based usability test scripts:
  - edit company profile
  - update ICP and segment
  - publish MIR section
  - apply tenant theme pack
- Instrumented funnels with drop-off and error thresholds.
- Accessibility checks (WCAG AA contrast, keyboard nav, focus states).

### 4. Performance validation

- Route-level budgets for LCP, TTI, and server response times.
- Regression checks for dashboard and editor routes.
- Cache correctness tests for role and workspace changes.

### 5. AI interoperability validation

- Retrieval precision/recall checks on canonical artifacts.
- Round-trip test: UI edit -> contract snapshot -> agent read -> validated mutation.
- Schema-version migration test ensuring agents can detect and adapt to version changes.

### 6. Release readiness criteria

- All core modules pass functional + RLS + accessibility + performance gates.
- Theme pack change affects all semantic components without hardcoded overrides.
- AI twin contracts are generated for every publish event and retrievable by stable API.
- Pilot operator cohort can complete end-to-end workflows with under 3% blocking errors.

## RESEARCH COMPLETE
