---
milestone: v3.5.0
milestone_name: Ultimate Literacy Vault
version: 1
created: 2026-04-12
status: locked
---

# v3.5.0 Milestone Context — Ultimate Literacy Vault

**Vision:** Establish a vault-first literacy operating model using Obsidian Mind for content storage/viewing and PageIndex vectorless RAG for agentic retrieval and execution, replacing legacy Supabase+Upstash infrastructure while preserving v3.4.0 branding/governance guarantees.

**Target User:** Agents retrieving audience-centric strategies for multi-step reasoning and execution; operators curating the vault with Obsidian interface.

---

## Locked Design Decisions

### D-01: Vault Structure — Hybrid Organization
**Decision:** Organize artifacts hierarchically by discipline (Paid_Media, Content_SEO, Lifecycle_Email, Social, Landing_Pages) with cross-cutting semantic tags/indices for discovery by audience, pain-point, concept type, or execution stage.

**Rationale:** Preserves familiar discipline navigation for operators while enabling agents to query across silos by semantic intent.

**Implications:**
- Obsidian folder structure mirrors disciplines
- PageIndex indices layer concept/audience tags on top
- Retrieval APIs expose both paths (by-discipline and cross-cutting)

### D-02: PageIndex Replaces Vector Store Entirely
**Decision:** Migrate from Supabase+Upstash vector retrieval to PageIndex as the primary agentic retrieval layer. Drop legacy vector store infrastructure; this is not a bridge migration.

**Rationale:** PageIndex vectorless RAG is cost-efficient, faster for agentic orchestration, and better aligns with semantic intent matching (agents reason over retrieved concepts, not just embeddings).

**Implications:**
- Supabase remains auth/policy boundary (RLS, tenant isolation)
- Supabase schema simplified to artifact metadata + audit trail
- PageIndex becomes retrieval and orchestration engine
- All vector-compute offloaded to PageIndex
- Cost/latency improvement for agent execution loops

**Constraints:**
- No fallback to Upstash; PageIndex must be reliable baseline
- Indexing and retrieval SLAs explicit in closure gates

### D-03: Marketing Audiences Dual Organization
**Decision:** Structure artifacts by primary concept (strategy, insights, content templates, execution tactics) with secondary indices by marketing audience persona (ICP, segment, decision-maker role, pain-point).

**Rationale:** Agents reason over concepts first, then filter/customize by audience. Operators navigate intuitively by discipline; audience is secondary discovery path.

**Implications:**
- Vault schema includes audience metadata on all artifacts
- PageIndex indices support "Strategy for ICP-A" or "Content for SMB decision-maker" queries
- Role-consumable handoffs include audience context
- Retrieval contracts expose audience-filtered results

### D-04: Agentic-Ready — Three Execution Modes
**Decision:** Agents can:
1. **Retrieve + Reason** — Pull concepts, apply LLM reasoning to customize
2. **Retrieve + Apply** — Direct template execution without extra reasoning
3. **Retrieve + Iterate** — Multi-step loops, verify outcomes, refine tactics based on vault evidence

**Rationale:** Different agent workflows have different latency/reasoning budgets. Step retrieval + reasoning is core; direct apply for low-risk templates; iteration for high-stakes decisions.

**Implications:**
- Retrieval API distinguishes "reasoning mode" (return raw artifact) vs "apply mode" (return actionable payload)
- Iteration patterns include evidence verification step (agent compares outcome to archived prior evidence)
- Approval gates scoped to high-risk mutations only

### D-05: Obsidian Integration — Best Practice, Not Overkill
**Decision:** Operators edit and organize vault artifacts through Obsidian Mind with minimal friction. Use file-watcher or sync API for bidirectional updates without manual commit steps.

**Rationale:** Obsidian gives operators familiar PKM interface; sync should be automatic but non-destructive.

**Implications:**
- Obsidian folder structure maps 1:1 to backend vault paths
- Edits in Obsidian trigger backend indexing/audit trail
- Conflicts resolved via last-write-wins + audit log recovery
- No manual "publish" step; edits live on next retrieval

### D-06: Full Migration — Legacy Cleanup
**Decision:** No legacy Supabase+Upstash retrieval paths remain. Ingest-literacy, vector-store-client, and related Phase 32 runtime are refactored or removed. This is not a parallel migration.

**Rationale:** Maintaining parallel infrastructure creates confusion and drift. Full migration forces commitment to PageIndex and Obsidian as the truth layer.

**Implications:**
- Phase 32 (Marketing Literacy Base) runtime updated to use PageIndex
- Old vector-store tables archived or dropped
- Operators transition to Obsidian; no dual interface
- Cross-product impact: UI routes, Agent prompt contracts, telemetry schemas updated

### D-07: Execution Handoff — Hardened Verification Without Heavy Gates
**Decision:** Agents retrieve and execute vault content with on-demand access. High-risk executions (outbound send, CRM mutation, publish decision) use hardened verification (agent logs reasoning, outcome compared to vault evidence) but not human approval gates (those are scoped to strategy role decisions, not execution).

**Rationale:** Execution speed matters for agents. Approval complexity should live at strategy/planning layer, not execution.

**Implications:**
- Execution telemetry includes vault artifact ID + retrieval timestamp
- Outcome verification compares to historical evidence in vault
- Anomaly detection flags (e.g., agent action inconsistent with archived tactics)
- Approval gates only on strategy approval, not retrieval use

### D-08: Preservation — v3.4.0 Non-Regression
**Decision:** v3.4.0 branding determinism, governance, and UAT guarantees remain non-negotiable baselines. Vault scope is additive; no breaking changes to brand/governance surfaces.

**Rationale:** v3.4 is shipped and trusted. Vault pivot must not regress those guarantees.

**Implications:**
- Branding artifact generation remains deterministic (vault is retrieval layer, not generative)
- Governance publish/rollback contracts unchanged
- Tenant isolation enforced at Supabase RLS + PageIndex query scope
- Test suite for v3.4 surfaces runs as part of v3.5 verification gates

---

## Gray Areas → Requirements Mapping

| decision | gray area | user selection | outcome |
|---|---|---|---|
| D-01 | Discipline-first vs concept-first organization | discipline-first with semantic cross-cut | ✓ locked |
| D-02 | Replace or augment vector store | replace entirely | ✓ locked |
| D-03 | Audience organization | dual (concept primary, audience secondary) | ✓ locked |
| D-04 | Agentic modes | all three (reason, apply, iterate) | ✓ locked |
| D-05 | Obsidian sync strategy | best-practice baseline, user defers to agent | → TBD in research |
| D-06 | Legacy migration scope | full cleanup | ✓ locked |
| D-07 | Approval gates | hardened verification, on-demand agent access | ✓ locked |
| D-08 | Non-regression | preserve v3.4 guarantees | ✓ locked |

---

## Requirements Implications

The locked decisions above directly inform these v3.5.0 requirement categories:

1. **VAULT-01 through VAULT-03** (Vault Foundation)
   - Obsidian folder structure (D-01)
   - Page Index retrieval contract (D-02)
   - Artifact metadata + provenance (D-01, D-08)

2. **LITV-01 through LITV-03** (Ingestion and Curation)
   - Obsidian + backend sync (D-05)
   - PageIndex indexing pipeline (D-02)
   - Audience tagging (D-03)

3. **ROLEV-01 through ROLEV-03** (Retrieval and Role Handoffs)
   - Dual retrieval paths: by-discipline, by-audience (D-01, D-03)
   - Retrieve + reason/apply/iterate modes (D-04)
   - Agentic execution payload (D-04, D-07)

4. **GOVV-01 through GOVV-03** (Governance and Regression Safety)
   - Tenant isolation via PageIndex scope (D-02)
   - v3.4 branding/governance non-regression (D-08)
   - Execution telemetry and verification (D-07)

---

## Constraints & Assumptions

- **PageIndex Reliability:** PageIndex must provide production-grade SLAs for agentic retrieval. If unreliable, fallback architecture is out-of-scope (full commitment to PageIndex).
- **Obsidian Sync:** Bidirectional sync requires careful conflict resolution. Last-write-wins + audit trail is acceptable; simultaneous edits must be rare.
- **Cost:** Moving to PageIndex should reduce vector-compute costs vs Supabase+Upstash. If not, cost/benefit must be re-evaluated in Phase research.
- **Migration Path:** Full cleanup of legacy infrastructure is irreversible. Cutover must include thorough testing and rollback plan.

---

## Next Steps

1. **Run Phase Research** — Deep-dive PageIndex integration patterns, Obsidian sync libraries, cost/latency benchmarks
2. **Refine Requirements** — Lock REQUIREMENTS.md based on these decisions
3. **Create Roadmap** — Phase the vault foundation → ingestion → retrieval → agentic execution
4. **Execute Phase 1** — Vault schema, Obsidian integration, PageIndex adapter

---

**Context Locked by:** User + Agent  
**Consent:** ✓ User confirmed all 8 decisions  
**Ready for:** Phase Research → Requirements Refinement → Roadmapping
