# Phase 56: Security and Privacy Evidence Closure - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

## Boundary

Phase 56 closes the remaining MarkOS v3 security and privacy evidence gaps.

This phase owns:
- SEC-01
- SEC-02
- SEC-03

This phase consumes:
- Phase 31 rollout hardening controls and retention boundaries
- Phase 51 tenant isolation foundations
- Phase 54 governance, retention/export, identity mapping, and audit evidence surfaces

## Why this phase exists

The repo already contains governance and security-related controls, but the v3 package still lacks direct closure for:

- privileged-action audit coverage as a named SEC-01 artifact
- GDPR-aligned deletion workflow proof for SEC-02
- explicit encryption-in-transit and at-rest proof for SEC-03

## Objectives

1. Bind privileged actions to named immutable audit evidence.
2. Produce a deletion workflow that can survive enterprise/privacy diligence.
3. Make encryption proof explicit in the v3 evidence chain.

## Discuss-phase decisions locked on 2026-04-03

### 1. SEC-01 closure will use one governance evidence surface, not scattered notes

Phase 56 should keep `api/governance/evidence.js` as the canonical retrieval seam for requirement-facing proof.

Locked implementation direction:
- Extend the governance evidence payload so SEC-01 can cite explicit privileged action families rather than inferring them from generic governance records.
- The required action families are: authentication and authorization, approvals, billing administration, and tenant-configuration changes.
- Evidence must remain derived from immutable or append-only system records, not operator-authored notes.

Minimum evidence families that must be named:
- authentication and authorization: SSO role-mapping grants and denials
- approvals: reviewer approval decisions and decision provenance
- billing administration: reconciliation, hold, release, and entitlement-state changes
- tenant configuration: plugin settings, branding, domain, or SSO binding changes

### 2. SEC-02 must add a first-class deletion workflow artifact

The current repo exposes retention and export proof, but that is not enough for GDPR-aligned deletion closure.

Locked product direction:
- Phase 56 should add a deletion-workflow artifact surfaced alongside retention and export evidence.
- The workflow should capture request receipt, tenant scope, approval or actor provenance, export-before-delete checkpoint, deletion action taken, final status, and resulting evidence reference.
- The phase should not destroy immutable audit ledgers or approval history in the name of deletion. Privacy deletion must be modeled as controlled tenant-data deletion with preserved compliance evidence.

Implementation guardrail:
- Prefer a requirement-specific workflow record and evidence seam over a broad destructive data-deletion engine.
- If a concrete delete executor is still out of scope, the artifact must still make the operational workflow explicit and testable.

### 3. SEC-03 closes through explicit trust-boundary proof, not new platform crypto scope

The encryption gap is primarily an evidence gap, not a missing-platform-foundation gap.

Locked proof direction:
- In-transit proof should bind tenant-data paths to HTTPS transport seams already present in Supabase, Upstash Vector, external IdP metadata, LLM providers, and other provider endpoints.
- At-rest proof should cite existing encrypted secret storage for operator keys plus managed-platform storage boundaries for tenant data stores.
- Vendor inventory and governance artifacts should be used as supporting evidence, but SEC-03 needs a direct requirement-facing note or evidence object that names the protected systems and trust boundaries.

Important scope boundary:
- Phase 56 should not introduce custom encryption for every tenant data model.
- The correct closure is explicit evidence for existing managed-platform encryption plus the in-repo operator-key encryption seam.

### 4. Test strategy remains narrow and requirement-facing

Phase 56 should add or extend tests that fail when:
- privileged action families disappear from the governance evidence surface
- deletion workflow proof is absent or incomplete
- encryption proof no longer names the required transport and storage boundaries

Auth negative-path coverage should only expand if role-mapping evidence shape changes.

### 5. Scope guardrails

This phase is not allowed to expand into:
- new identity architecture
- generalized privacy automation across every entity type
- broad compliance-program documentation unrelated to SEC-01 through SEC-03
- penetration testing or operational incident work that belongs to Phase 57

The goal is requirement closure with direct, defensible evidence and minimal implementation support.

## Open planning questions

- Should the deletion workflow model explicit states such as `received`, `export_ready`, `deleted`, `denied`, and `completed`, or is a simpler single-record status model sufficient?
- Which tenant-configuration families should be mandatory in the SEC-01 action map on day one: plugin settings only, or plugin settings plus custom domains and SSO bindings?
- Should the SEC-03 evidence live inside the governance evidence endpoint payload, a separate governance note, or both?

## Canonical references

- `.planning/projects/markos-v3/CLOSURE-MATRIX.md`
- `.planning/projects/markos-v3/REQUIREMENTS.md`
- `.planning/projects/markos-v3/technical-specs/SECURITY-COMPLIANCE.md`
- `.planning/phases/31-rollout-hardening/31-01-PLAN.md`
- `.planning/phases/54-billing-metering-and-enterprise-governance/54-VERIFICATION.md`
- `api/governance/evidence.js`
- `api/governance/vendor-inventory.js`
- `api/auth/sso/callback.js`
- `onboarding/backend/runtime-context.cjs`
- `lib/markos/governance/evidence-pack.ts`
- `lib/markos/governance/contracts.ts`
- `lib/markos/identity/role-mapping.ts`
- `lib/markos/llm/encryption.ts`
- `supabase/migrations/54_governance_evidence.sql`

## Deliverables expected from this phase

- SEC-01 mapping artifact for privileged billing, auth, approval, and tenant-configuration actions.
- GDPR-aligned deletion workflow artifact and any required implementation support.
- Encryption control note or verification artifact with direct system references.
- Closure-matrix and verification updates for SEC-01 through SEC-03.
