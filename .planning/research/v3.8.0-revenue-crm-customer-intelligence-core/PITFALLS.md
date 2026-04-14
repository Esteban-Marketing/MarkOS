# Domain Pitfalls

**Domain:** Revenue CRM and customer intelligence in MarkOS
**Researched:** 2026-04-14

## Critical Pitfalls

### Pitfall 1: Creating a second source of truth
**What goes wrong:** CRM state starts living partly in PostHog, partly in vendor payloads, and partly in internal tables.
**Why it happens:** Teams skip normalization and let the nearest system drive UI state.
**Consequences:** Broken attribution, identity drift, and impossible audits.
**Prevention:** Keep Supabase CRM tables canonical and route all external signals through the activity ledger.
**Detection:** The same contact or company looks different across reporting, workspace, and outbound views.

### Pitfall 2: Overbuilding the identity graph
**What goes wrong:** A graph database or opaque ML merge system is introduced too early.
**Why it happens:** Identity stitching feels like a graph problem before scale justifies it.
**Consequences:** More infra, less explainability, and harder tenant isolation.
**Prevention:** Stay relational-first; use confidence links, lineage tables, and reviewable merge decisions.
**Detection:** Merge logic becomes hard to explain or impossible to test deterministically.

### Pitfall 3: Letting AI mutate records without bounded contracts
**What goes wrong:** Copilot shortcuts bypass approval and audit boundaries.
**Why it happens:** Prompt-driven speed is prioritized over governance.
**Consequences:** Unsafe external sends, silent stage changes, and trust loss.
**Prevention:** All AI actions should flow through typed action envelopes with explicit approval requirements.
**Detection:** A CRM mutation exists with no actor, no rationale, or no evidence bundle.

## Moderate Pitfalls

### Pitfall 1: Adding too many new platforms
**What goes wrong:** The milestone becomes an integration project instead of a product milestone.
**Prevention:** Reuse Supabase, PostHog, and the existing LLM adapter whenever possible.

### Pitfall 2: Reporting directly from raw event tables
**What goes wrong:** Dashboards slow down and tell inconsistent stories.
**Prevention:** Use SQL rollups, materialized views, and explicit attribution models.

### Pitfall 3: Heavy UI framework lock-in
**What goes wrong:** Workspace surfaces become rigid and harder to test.
**Prevention:** Use headless table and drag-drop primitives.

## Minor Pitfalls

### Pitfall 1: Over-validating at only one layer
**What goes wrong:** Invalid JSON sneaks through DB or API edges.
**Prevention:** Validate in Node with Ajv and in Postgres with pg_jsonschema for high-risk payloads.

### Pitfall 2: Queueing before idempotency
**What goes wrong:** Retries cause duplicate sends or timeline spam.
**Prevention:** Add idempotency keys and delivery reconciliation before scaling the queue layer.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Canonical schema | JSONB flexibility turns into ungoverned shape drift | Enforce schemas and version envelopes |
| Identity graph | Too many automatic merges | Require accepted link states and lineage evidence |
| Behavioral tracking | Event taxonomies drift by surface | Maintain one contract registry for capture names and properties |
| Workspace views | UI complexity outruns data contracts | Build views on stable read models |
| Outbound execution | Retries create duplicate messages | Use queued idempotent sends and webhook reconciliation |
| Copilot | Prompt-only actions skip governance | Use bounded tool contracts and approval packages |
| Attribution | Competing models confuse operators | Start with one deterministic model and show its lineage |

## Sources

- Current MarkOS CRM requirements and architecture
- Official Supabase, PostHog, Resend, Twilio, TanStack Table, and dnd kit docs
