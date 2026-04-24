# MarkOS Sales Enablement Engine
## Battlecards · Deal Intelligence · RevOps · Proof Packs · Deal Rooms · Forecast Support

---

## Why Sales Enablement Gets Its Own Engine

Marketing systems usually stop at lead generation. Great ones extend into pipeline.
Category leaders go further: they help revenue teams win more often, faster, and with
better proof.

That is what the Sales Enablement Engine does inside MarkOS.

It takes the output of research, CRM, pricing, messaging, analytics, and content systems
and turns them into deal-winning materials and revenue workflows.

Without this engine, MarkOS can create demand but still leak value during:

- objection handling
- competitive deals
- proof-pack assembly
- stakeholder communication
- pricing explanation
- proposal and deal-room preparation
- handoff from marketing to sales to CS

---

## Core Doctrine

The Sales Enablement Engine follows seven rules:

1. **Every deal should inherit system memory, not restart from zero**
2. **Proof must be assembled from governed evidence, not rep folklore**
3. **Pricing promises must come from approved pricing posture**
4. **Competitive response must be structured and current**
5. **Enablement must create faster action, not more content clutter**
6. **Forecast and risk should be explainable**
7. **Marketing, sales, CS, support, and finance must work from the same truth**

---

## What the Sales Enablement Engine Must Do

The engine must support:

- competitive battlecards
- objection libraries
- proof packs and reference packs
- deal briefs and executive summaries
- deal rooms
- proposal and pricing explanation support
- stakeholder-specific messaging
- revenue handoff and forecast support
- expansion and renewal materials

---

## Part 1: Core Objects

```typescript
interface Battlecard {
  battlecard_id: string
  tenant_id: string
  competitor_name: string
  competitor_profile_id: string | null
  summary: string
  strengths_to_acknowledge: string[]
  weaknesses_to_press: string[]
  ideal_positioning_angles: string[]
  risky_claims_to_avoid: string[]
  proof_refs: string[]
  last_verified_at: string
}

interface DealBrief {
  deal_brief_id: string
  tenant_id: string
  opportunity_id: string
  account_id: string | null
  objective: string
  current_stage: string
  stakeholders: string[]
  open_objections: string[]
  required_artifacts: string[]
  recommended_next_steps: string[]
  pricing_context_id: string | null
  evidence_refs: string[]
}

interface ProofPack {
  proof_pack_id: string
  tenant_id: string
  audience_type:
    | 'executive'
    | 'marketing_lead'
    | 'finance'
    | 'security'
    | 'technical'
    | 'customer_success'
  case_study_refs: string[]
  benchmark_refs: string[]
  roi_refs: string[]
  security_refs: string[]
  pricing_refs: string[]
  evidence_refs: string[]
  approval_state: 'draft' | 'approved' | 'retired'
}

interface DealRoom {
  deal_room_id: string
  tenant_id: string
  opportunity_id: string
  status: 'draft' | 'live' | 'closed'
  artifact_ids: string[]
  stakeholder_views: string[]
  last_activity_at: string | null
}
```

---

## Part 2: Competitive and Objection Intelligence

The engine must provide a governed answer to:

- how we position against competitor X
- which objections are most likely in this segment
- which proof is strongest for this stakeholder
- what claims are safe to make
- what pricing explanation is currently approved

This requires:

- live connection to doc 06 research and doc 15 pricing
- battlecard freshness checks
- objection tagging in CRM and Messaging
- proof mapping by persona, industry, and deal stage

---

## Part 3: Deal Support and RevOps

The engine should create structured support for:

- deal inspection before meetings
- stakeholder-specific follow-up
- executive summary generation
- pricing summary and packaging explanation
- required approvals for discounts or custom terms
- renewal and expansion preparation
- forecast confidence explanation

This is where marketing, pricing, CRM, and analytics become revenue tools instead of
independent systems.

---

## Part 4: Sales Enablement Agents

**New agent: MARKOS-AGT-SAL-01: Battlecard Composer**  
Creates and updates competitor battlecards from live research and pricing data.

**New agent: MARKOS-AGT-SAL-02: Objection Strategist**  
Maps objections to approved proof, messaging, and next actions.

**New agent: MARKOS-AGT-SAL-03: Deal Brief Builder**  
Creates opportunity-specific summaries, risk maps, and stakeholder plans.

**New agent: MARKOS-AGT-SAL-04: Proof Pack Curator**  
Builds audience-specific proof bundles grounded in evidence and approved claims.

**New agent: MARKOS-AGT-SAL-05: Forecast Risk Interpreter**  
Explains why deals are healthy, stalled, or at risk.

---

## Part 5: UI, API, and MCP Surface

### UI

The operator UI should expose:

- battlecard library
- objection library
- deal brief builder
- proof-pack builder
- deal rooms
- forecast risk workspace

### API

Required families:

- `/v1/sales/battlecards/*`
- `/v1/sales/deal-briefs/*`
- `/v1/sales/proof-packs/*`
- `/v1/sales/deal-rooms/*`
- `/v1/sales/forecast/*`

### MCP

Required tools:

- `get_battlecard`
- `build_deal_brief`
- `suggest_objection_response`
- `assemble_proof_pack`
- `explain_forecast_risk`

---

## Part 6: Global-Leader Requirements

To lead the category, the Sales Enablement Engine must:

1. translate marketing intelligence into revenue-winning artifacts
2. make battlecards and proof packs live, not static PDFs
3. keep pricing, claims, and proof aligned with governance
4. reduce deal friction and rework
5. help teams win in both sales-led and expansion motions

---

## Part 7: Governance and Safety

The Sales Enablement Engine must never:

- include unsupported claims in proof packs
- promise pricing, discounts, terms, or outcomes outside approved posture
- operate from stale battlecards without warning
- detach deal materials from CRM timeline and opportunity memory

This is how MarkOS turns marketing intelligence into revenue execution.
