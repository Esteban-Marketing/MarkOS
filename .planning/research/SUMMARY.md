# Research Summary: v3.4.0 Complete Branding Engine

**Domain:** Tenant-scoped branding pipeline (strategy -> identity -> design system -> Next.js starter)
**Researched:** 2026-04-11
**Overall confidence:** HIGH

## Executive Summary

v3.4.0 should ship a branding domain in place, not a platform rewrite. The right shape is an append-only, tenant-scoped pipeline that converts structured brand inputs into strategy artifacts, identity artifacts, token sets, shadcn component contracts, and executable Next.js starter outputs. The implementation should reuse existing MarkOS seams in app, api, lib, contracts, telemetry, and governance.

Roadmap scope should stay tight around deterministic artifact generation and controlled activation. Focus on contracts, repository interfaces, compiler stages, and publish/rollback pointer semantics. Defer full UI replatform and autonomous production deployment; deliver a canonical starter and incremental adoption path instead.

The highest risks are semantic drift (strategy disconnected from UI outputs), token fragmentation across surfaces, accessibility regressions, and non-deterministic generation. These are preventable with contract-level lineage fields, token-only enforcement in branded paths, contrast gates, and repeat-run snapshot checks.

## Stack Additions

- Tailwind v4 + PostCSS bridge (`tailwindcss`, `@tailwindcss/postcss`) to support canonical CSS variable theming outputs.
- shadcn tooling and composition utilities (`shadcn`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`) for component contract realization.
- Schema and compiler safety (`zod`, `culori`, `wcag-contrast`) for deterministic artifacts and accessibility checks.
- Keep existing foundations unchanged: Next.js 15, React 19, TypeScript, Storybook/Chromatic, existing Node test lanes.

## Feature Table Stakes

- Structured concept intake for audience pains, needs, expectations (`BRAND-INP-*`).
- Pain/need to opportunity mapping with explicit trace links (`BRAND-INP-04`, `BRAND-STRAT-01`).
- Positioning brief and messaging pillars/tone matrix (`BRAND-STRAT-*`).
- Deterministic identity pack (palette roles, typography hierarchy, visual rules, voice cues) (`BRAND-ID-*`).
- Token compiler to canonical Next.js + Tailwind v4 + shadcn contract (`BRAND-DS-*`).
- Starter outputs (theme vars, component manifest, sample scaffolds) (`BRAND-NEXT-*`).
- Role-ready handoffs and version governance (`BRAND-ROLE-*`, `BRAND-GOV-*`).

## Feature Differentiators

- Evidence-linked strategy graph tying outputs to pain/need source nodes.
- Strategy-to-token rationale ledger for cross-role traceability.
- Role-view output slices from one shared artifact chain.
- Contract-first shadcn mapping manifest before full component-library migration.
- Deterministic regression snapshots for strategy, identity, and token outputs.

## Architecture Build Order

1. Contracts and repository foundation
- Add branding contracts, runtime type guards, storage adapters, and F-65 to F-70 flow files.

2. Inputs and strategy services
- Implement inputs and strategy endpoints with tenant context + role gates.

3. Identity and token compiler
- Add identity generation and token compile endpoints; extend theme primitives for generated families.

4. UI contract and starter generation
- Generate shadcn component contracts and Next starter descriptors; add workflow screens.

5. Publish and rollback activation
- Add active lineage pointer semantics and wire consumers to active brand version.

6. Governance and validation closeout
- Add telemetry events, evidence packs, contract checks, determinism tests, a11y gates, and tenant isolation coverage.

## Top Pitfalls and Mitigations

- Strategy-to-UI semantic drift
Mitigation: require `source_strategy_id` lineage on identity/token/component nodes; fail contract tests on missing mappings.

- Token contract fragmentation
Mitigation: enforce token-only usage in branded paths and block raw style literals via CI lint/scan.

- Accessibility regressions
Mitigation: contrast matrix checks for semantic pairs and component states; block publish or require explicit governance waiver.

- Non-deterministic outputs
Mitigation: stable normalization + golden snapshots across repeat runs; isolate and label any allowed stochastic fields.

- Governance/version drift
Mitigation: one bundle release version with checksum manifest spanning strategy -> identity -> tokens -> UI contract -> starter.

## Requirement-Family Mapping

| Family | Primary Deliverables in v3.4.0 | Primary Build Stage |
|---|---|---|
| `BRAND-INP-*` | Intake schema + normalized evidence graph | Stage 1-2 |
| `BRAND-STRAT-*` | Positioning brief + messaging matrix artifacts | Stage 2 |
| `BRAND-ID-*` | Identity artifact with accessibility constraints | Stage 3 |
| `BRAND-DS-*` | Semantic token set + shadcn component contract | Stage 3-4 |
| `BRAND-NEXT-*` | Next.js starter bundle descriptors + wiring metadata | Stage 4 |
| `BRAND-ROLE-*` | Role-specific handoff packs and checklists | Stage 4-6 |
| `BRAND-GOV-*` | Versioned publish/rollback + drift checks + evidence | Stage 5-6 |

## Implications for Roadmap

- Keep milestone objective implementation-first: produce deterministic, tenant-safe brand artifacts and a runnable starter path.
- Group work by pipeline dependency (inputs -> strategy -> identity -> tokens -> contracts -> starter -> activation).
- Treat publish/rollback and governance as first-class scope, not polish, because they protect multi-tenant safety and auditability.
- Avoid broad UI migration in-milestone; adopt generated contracts incrementally through existing surfaces.

## Do First Checklist

- Confirm requirement IDs for F-65 to F-70 and align acceptance criteria to the family mapping table.
- Draft roadmap phases using the six-stage build order above and assign each phase one primary pitfall gate.
- Lock deterministic fixture set for repeat-run snapshot testing before implementation starts.
- Define tenant/RLS and role gate invariants once, then reference them in every branding endpoint contract.
- Define the minimum shadcn component set and required states up front to prevent scope drift.

## Sources

- `.planning/research/STACK.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
