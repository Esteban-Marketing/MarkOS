# MarkOS Launch Engine
## Product Launches · Release Marketing · Announcement Orchestration · Cross-Channel GTM · Launch Analytics

---

## Why Launches Get Their Own Engine

Most companies still run launches through spreadsheets, Slack threads, Figma files,
one-off landing pages, and last-minute emails. That is tolerable for a small team.
It is unacceptable for a platform trying to lead the category.

MarkOS needs a Launch Engine because launches sit at the intersection of:

- product
- pricing
- content
- email
- messaging
- sales enablement
- partner and community distribution
- analytics
- support and CS readiness

Without a dedicated launch system, those layers drift apart and the company repeatedly
ships undercoordinated moments.

---

## Core Doctrine

The Launch Engine follows seven rules:

1. **Every launch has one canonical brief**
2. **A launch is multi-surface by default**
3. **Pricing, proof, and positioning must stay aligned**
4. **Internal readiness is part of launch quality**
5. **Launches must be measurable from announcement to revenue impact**
6. **Launch variants by audience and region must be deliberate**
7. **Post-launch learning must feed future launches**

---

## What the Launch Engine Must Do

The engine must support:

- feature launches
- pricing and packaging launches
- product repositions
- integrations and partner launches
- events and webinar launches
- waitlist and beta launches
- country and vertical launches

Each launch should coordinate:

- page creation
- email and messaging sequences
- social plans
- sales enablement artifacts
- partner/community assets
- support and CS readiness
- analytics and narrative measurement

---

## Part 1: Core Launch Objects

```typescript
interface LaunchBrief {
  launch_id: string
  tenant_id: string
  launch_type:
    | 'feature'
    | 'pricing'
    | 'integration'
    | 'campaign'
    | 'event'
    | 'beta'
    | 'market_entry'
  name: string
  objective: string
  target_audiences: string[]
  launch_date: string
  owner_user_id: string
  status: 'planning' | 'pending_approval' | 'ready' | 'live' | 'completed'

  positioning_summary: string
  pricing_context_id: string | null
  evidence_pack_id: string | null
  surface_ids: string[]
  internal_readiness_checks: string[]
}

interface LaunchSurface {
  surface_id: string
  tenant_id: string
  launch_id: string
  surface_type:
    | 'landing_page'
    | 'email_campaign'
    | 'messaging_flow'
    | 'social_pack'
    | 'sales_enablement'
    | 'partner_pack'
    | 'support_pack'
    | 'docs_update'
  status: 'draft' | 'blocked' | 'approved' | 'published'
  blocking_reasons: string[]
}

interface LaunchOutcome {
  launch_id: string
  tenant_id: string
  period_days: number
  reach: number
  signups: number
  pipeline_created: number | null
  influenced_revenue: number | null
  activation_lift: number | null
  narrative_summary: string | null
}
```

---

## Part 2: The Launch Workflow

Every launch should progress through:

1. strategy and launch brief
2. audience and positioning definition
3. pricing and proof validation
4. asset creation across channels
5. internal readiness
6. launch day orchestration
7. post-launch measurement
8. learning capture

This means a launch is not "email plus page." It is a governed, measurable operating sequence.

---

## Part 3: Cross-Engine Coordination

The Launch Engine must orchestrate:

- doc 23 Conversion Engine for launch pages and forms
- doc 19 Email Engine for sequences and announcements
- doc 21 Messaging Engine for reminders and high-urgency channels
- doc 24 Sales Enablement Engine for battlecards, deal briefs, and support packs
- doc 25 Ecosystem Engine for partner, marketplace, and community distribution
- doc 22 Analytics Engine for launch impact and narrative
- doc 15 Pricing Engine when the launch affects pricing

---

## Part 4: Launch Agents

**New agent: MARKOS-AGT-LCH-01: Launch Strategist**  
Turns product or pricing changes into a structured launch plan.

**New agent: MARKOS-AGT-LCH-02: Launch Surface Coordinator**  
Checks every required asset and surface for readiness and drift.

**New agent: MARKOS-AGT-LCH-03: Internal Readiness Auditor**  
Confirms sales, support, docs, and CS are aligned before launch.

**New agent: MARKOS-AGT-LCH-04: Launch Impact Analyst**  
Measures launch impact across conversion, pipeline, product, and revenue.

---

## Part 5: UI, API, and MCP Surface

### UI

The UI should expose:

- launch brief workspace
- launch checklist and readiness board
- surface tracker
- audience and variant planner
- post-launch analytics narrative

### API

Required families:

- `/v1/launches/*`
- `/v1/launches/surfaces/*`
- `/v1/launches/readiness/*`
- `/v1/launches/outcomes/*`

### MCP

Required tools:

- `create_launch_brief`
- `check_launch_readiness`
- `list_launch_blockers`
- `summarize_launch_impact`

---

## Part 6: Global-Leader Requirements

To lead the category, the Launch Engine must:

1. coordinate every major release from one canonical brief
2. keep positioning, pricing, proof, and execution aligned
3. create launch outputs across every required channel
4. make launch readiness visible before public release
5. turn launches into measurable business events, not one-day announcements

---

## Part 7: Governance and Safety

The Launch Engine must never:

- let launch assets drift out of sync with pricing or claims posture
- allow launch-day customer-facing changes without required approvals
- publish incomplete internal readiness for support, sales, or CS
- treat launch performance as vanity metrics only

This is how MarkOS makes launches repeatable, coordinated, and compounding.
