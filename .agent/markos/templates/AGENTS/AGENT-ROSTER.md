# AGENT ROSTER — esteban.marketing
### Automated Intelligence Layer for the MIR + MSP + MarkOS System
##### Template v1.0 — maintained by esteban.marketing

---

## Operating Doctrine

This roster defines every AI agent that can run autonomously or semi-autonomously within the
esteban.marketing system. An agent belongs in this roster only if its task meets all three
criteria:

```
✓ REPEATABLE       — The same process runs on the same trigger every time
✓ CONTEXT-DRIVEN   — The output derives from repository files, not judgment calls
✓ VERIFIABLE       — {{LEAD_AGENT}} can review the output and approve/reject in < 5 minutes
```

**What agents do NOT do:**
- Make final strategic decisions
- Approve client-facing content
- Execute financial transactions
- Send any communication to clients without {{LEAD_AGENT}}'s review
- Generate executable code (HTML, CSS, JS, Python)
- Override repository constraints or tech stack rules

**{{LEAD_AGENT}}'s role in the agent system:**
- Loads context into each session using the boot protocol
- Reviews and approves all agent outputs before they leave the agency
- Updates MIR/MSP files when business reality changes
- Is the final decision-maker on every gate

---

## System Architecture

```
╔══════════════════════════════════════════════════════════════════╗
║                    LAYER 0 — FOUNDATION                          ║
║  AG-F01 Repository Librarian  ·  AG-F02 Context Loader           ║
║  AG-F03 Gap Auditor                                               ║
╠══════════════════════════════════════════════════════════════════╣
║                    LAYER 1 — INTELLIGENCE                        ║
║  AG-I01 Audience Intelligence  ·  AG-I02 Competitive Monitor     ║
║  AG-I03 Market Signal Scanner                                     ║
╠══════════════════════════════════════════════════════════════════╣
║                    LAYER 2 — STRATEGY                            ║
║  AG-S01 Campaign Architect  ·  AG-S02 Content Calendar Builder   ║
║  AG-S03 Budget Pacing Monitor                                     ║
╠══════════════════════════════════════════════════════════════════╣
║                    LAYER 3 — CREATIVE                            ║
║  AG-C01 Creative Brief Agent  ·  AG-C02 Copy Drafter             ║
║  AG-C03 Content Brief Agent  ·  AG-C04 Social Content Drafter    ║
╠══════════════════════════════════════════════════════════════════╣
║                    LAYER 4 — TECHNICAL                           ║
║  AG-T01 Tracking Specifier  ·  AG-T02 Automation Architect       ║
║  AG-T03 Landing Page Specifier  ·  AG-T04 UTM Architect          ║
╠══════════════════════════════════════════════════════════════════╣
║                    LAYER 5 — ANALYTICS                           ║
║  AG-A01 Performance Monitor  ·  AG-A02 Funnel Analyst            ║
║  AG-A03 Report Compiler  ·  AG-A04 CRO Hypothesis Generator      ║
╠══════════════════════════════════════════════════════════════════╣
║                    LAYER 6 — OPERATIONS                          ║
║  AG-O01 Lead Scorer  ·  AG-O02 Email Sequence Drafter            ║
║  AG-O03 SEO Content Planner  ·  AG-O04 Crisis Signal Monitor     ║
║  AG-O05 Influencer Vetter  ·  AG-O06 Partnership Scout           ║
╚══════════════════════════════════════════════════════════════════╝
                               │
                    ┌──────────▼──────────┐
                    │   ESTEBAN (HUMAN)    │
                    │  Reviews · Approves  │
                    │  Decides · Executes  │
                    └─────────────────────┘
```

**Total agents: 22**
**Layers: 7 (0–6)**

---

## Agent Specification Format

Each agent is documented with:

```
ID          — Unique identifier
NAME        — Human-readable name
LAYER       — System layer (0–6)
PURPOSE     — One sentence: what problem this agent solves
TRIGGER     — What activates this agent
FREQUENCY   — How often it runs
INPUTS      — What it reads (repo files + data sources)
PROCESS     — What it does, step by step
OUTPUTS     — What it produces
HANDOFF     — What {{LEAD_AGENT}} must review/decide
CONSTRAINTS — What this agent must never do
DEPENDENCIES— What must be true before this agent runs
PROMPT_ID   — Reference to prompt template in MarkOS PROTOCOL
```

---

---

# LAYER 0 — FOUNDATION
## Repository integrity, session management, and gap detection

---

## AG-F01 — Repository Librarian

```yaml
id          : AG-F01
name        : Repository Librarian
layer       : 0 — Foundation
purpose     : Maintain the structural integrity of MIR and MSP repositories by updating
              status fields, logging changes, and keeping STATE.md current.
trigger     : Any time a repository file is edited OR at end of every working session
frequency   : Per-session + weekly automated audit
```

**Inputs:**
- All modified MIR/MSP files (diff from last commit)
- Current `STATE.md` in MIR and MSP
- `Core_Strategy/00_META/CHANGELOG.md`
- `Core_Strategy/00_META/PROJECT.md`

**Process:**
```
1. Scan all files modified since last commit
2. For each modified file:
   a. Update `last_updated` field to today's date
   b. Assess status: empty → partial → complete → verified
   c. Determine if any Gate 1 or Gate 2 files changed status
3. Update MIR STATE.md:
   a. File status table (mark changed files)
   b. Gate 1 / Gate 2 readiness
   c. Recent changes log
4. Update MSP STATE.md (if applicable)
5. Write CHANGELOG.md entry with:
   - Date
   - Files changed
   - Status changes
   - Agent impact note
6. Flag any conflicts: fields changed that contradict other files
```

**Outputs:**
- Updated `STATE.md` (MIR + MSP)
- New `CHANGELOG.md` entry
- Conflict report (if any contradictions detected)

**Handoff to {{LEAD_AGENT}}:**
- Conflict report requires resolution before any campaign work
- Gate status changes require awareness (especially Gate 2 newly GREEN = ready to launch)

**Constraints:**
- Never deletes content from repository files
- Never marks a file `verified` — only {{LEAD_AGENT}} can verify
- Never changes business-content fields — only metadata fields

**Dependencies:** Git access or file system access to both repositories

---

## AG-F02 — Context Loader

```yaml
id          : AG-F02
name        : Context Loader
layer       : 0 — Foundation
purpose     : Bootstrap any AI session with the correct project context so agents 
              never work from incomplete information.
trigger     : Start of any new AI agent session on a project
frequency   : Every session
```

**Inputs:**
- `Core_Strategy/00_META/AGENTS.md`
- `Core_Strategy/00_META/PROJECT.md`
- `STATE.md`
- `Core_Strategy/01_COMPANY/PROFILE.md`
- Task description provided by {{LEAD_AGENT}}

**Process:**
```
1. Read AGENTS.md — extract mandatory constraints for this project
2. Read PROJECT.md — extract scope, stakeholders, budget constraints
3. Read STATE.md — determine:
   a. What files are complete/partial/empty
   b. Which campaigns are active
   c. Any open blockers
4. Read PROFILE.md — extract business identity facts
5. Compile session brief:
   a. Project summary (3 sentences)
   b. Active constraints
   c. Relevant file statuses
   d. Current task context
   e. Files agent must read before proceeding
6. Present session brief as structured header before any task output
```

**Outputs:**
```
SESSION CONTEXT LOADED
─────────────────────
Project     : P[N] — [Name]
Status      : [Phase]
Gate 1      : [GREEN / RED]
Gate 2      : [GREEN / RED]
Active camps: [List]
Constraints : [Key constraints from AGENTS.md]
Task        : [Current task]
Read before proceeding: [List of relevant files]
─────────────────────
```

**Handoff to {{LEAD_AGENT}}:**
- If Gate 2 is RED and task requires paid campaign work → flag and pause
- If required files are `empty` → list gaps before proceeding

**Constraints:**
- Must run before any other agent in a new session
- Never skips context loading because "it remembers" — sessions have no memory

---

## AG-F03 — Gap Auditor

```yaml
id          : AG-F03
name        : Gap Auditor
layer       : 0 — Foundation
purpose     : Detect every [FILL] placeholder, empty file, and stale record across
              the entire repository system and surface a prioritized remediation list.
trigger     : Weekly (Monday) + on-demand before campaign launch
frequency   : Weekly + per campaign pre-launch check
```

**Inputs:**
- All MIR files (full scan)
- All MSP PLAN.md files (full scan)
- `STATE.md` (both repos)
- Campaign `CAMPAIGN.md` files in `Campaigns_Assets/08_CAMPAIGNS/ACTIVE/`

**Process:**
```
1. Scan every .md file for:
   a. [FILL] placeholders
   b. [YYYY-MM-DD] unfilled date fields
   c. Status = "empty"
   d. last_updated > 90 days ago (stale flag)
2. Cross-reference STATE.md — surface discrepancies
3. Check Gate 1 files — are all required fields filled?
4. Check Gate 2 files — are all tracking/automation specs complete?
5. Check active CAMPAIGN.md files for:
   a. Missing tracking validation checkbox items
   b. Launch checklist items unchecked
   c. Optimization log with no entries (campaign running >7 days)
6. Produce gap report sorted by priority:
   - CRITICAL: Blocks campaign launch
   - HIGH: Blocks strategy quality
   - MEDIUM: Incomplete but non-blocking
   - LOW: Nice to have
```

**Outputs:**
```
GAP AUDIT REPORT — [YYYY-MM-DD]
Project: P[N] — [Name]

CRITICAL GAPS (0 active campaigns possible until resolved):
  ⛔ MIR/Core_Strategy/06_TECH-STACK/TRACKING.md → capi_status = NOT_CONFIGURED

HIGH GAPS (strategy quality affected):
  ⚠️  MIR/Market_Audiences/03_MARKET/AUDIENCES.md → targeting_parameters → meta_interests = [FILL]
  ⚠️  MSP/Outbound/01_ADVERTISING/PLAN.md → kill_condition = [FILL]

STALE FILES (last updated >90 days):
  📅 MIR/Products/04_PRODUCTS/PRICING.md → last_updated: 2024-09-01

TOTAL: [N] critical, [N] high, [N] medium, [N] low
Estimated fill time: ~[Xh]
```

**Handoff to {{LEAD_AGENT}}:**
- Full report reviewed weekly
- CRITICAL gaps escalated immediately if a campaign is trying to launch

**Constraints:**
- Report only — never fills gaps itself without {{LEAD_AGENT}} providing the correct content
- Never assumes a default value to fill a blank field

---

---

# LAYER 1 — INTELLIGENCE
## Audience research, competitive monitoring, and market signals

---

## AG-I01 — Audience Intelligence Agent

```yaml
id          : AG-I01
name        : Audience Intelligence Agent
layer       : 1 — Intelligence
purpose     : Continuously surface new insights about ICP-1 behavior, language,
              and pain points from public data to sharpen targeting and messaging.
trigger     : Monthly refresh + before any new campaign brief
frequency   : Monthly + on-demand
```

**Inputs:**
- MIR `Market_Audiences/03_MARKET/AUDIENCES.md` (current ICP definitions)
- MIR `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` (current messaging)
- Web search: forums, communities, and platforms where ICP-1 is active
- Reddit / Facebook Group discussions in relevant categories
- PostHog session data summary (provided by AG-A02)
- CRM lead qualification notes (if provided by {{LEAD_AGENT}})

**Process:**
```
1. Read current ICP definition from AUDIENCES.md
2. Search public forums/communities for language ICP-1 uses:
   - "What are people in [industry] complaining about?"
   - "What questions do [ICP job title] ask in [community]?"
3. Extract:
   a. Exact phrases they use to describe the problem
   b. New objections not currently in MESSAGING-FRAMEWORK.md
   c. Competitors they mention
   d. Content formats they engage with
   e. Platforms where they're most active
4. Compare against current AUDIENCES.md — flag new insights
5. Suggest updates to:
   - AUDIENCES.md psychographic fields
   - MESSAGING-FRAMEWORK.md objection responses
   - VOICE-TONE.md vocabulary section
```

**Outputs:**
```
AUDIENCE INTELLIGENCE REPORT — [YYYY-MM]

New language ICP-1 uses for the problem:
  "[Exact phrase found in community X]"
  "[Exact phrase found in community Y]"

New objections not in MESSAGING-FRAMEWORK.md:
  1. "[Objection]" — found in [source]
  2. "[Objection]" — found in [source]

Recommended AUDIENCES.md updates:
  → frustrations field: add "[new pain point]"
  → behavioral_profile → search_behavior: add "[new search pattern]"

Recommended MESSAGING-FRAMEWORK.md updates:
  → §8 Objection Responses: add "[new objection + response draft]"
```

**Handoff to {{LEAD_AGENT}}:**
- {{LEAD_AGENT}} reviews and approves all suggested MIR updates before they're applied
- AG-F01 logs approved changes

**Constraints:**
- Never scrapes private groups or paywalled communities
- Never invents insights — every claim cites a source
- Never updates MIR files directly — produces recommendations only

---

## AG-I02 — Competitive Monitor

```yaml
id          : AG-I02
name        : Competitive Monitor
layer       : 1 — Intelligence
purpose     : Track competitor advertising activity, messaging shifts, and new
              offers to keep competitive positioning current and responsive.
trigger     : Weekly automated scan + any time a new competitor is added to MIR
frequency   : Weekly
```

**Inputs:**
- MIR `Market_Audiences/03_MARKET/COMPETITIVE-LANDSCAPE.md` (competitor list)
- MIR `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` (our claims to protect)
- Meta Ad Library (public API/web search)
- Competitor websites and landing pages
- Competitor social profiles

**Process:**
```
1. Load competitor list from COMPETITIVE-LANDSCAPE.md
2. For each competitor:
   a. Check Meta Ad Library: any new ads in the past 7 days?
   b. Screenshot or log new ad copy angles
   c. Visit landing pages — any messaging changes?
   d. Check social profile — any new offers or campaigns?
3. Flag:
   a. New claims that overlap with our messaging (messaging collision)
   b. New offers that undercut our pricing
   c. New case studies or social proof published
   d. Channels newly activated by competitors
4. Compare against last week's report — what's new?
5. Flag if any competitor begins using language from our messaging framework
```

**Outputs:**
```
COMPETITIVE MONITOR REPORT — Week of [YYYY-MM-DD]

New competitor ads detected:
  [Competitor A]: 3 new Meta ads — angle: [describe hook/message]
  [Competitor B]: No new ad activity

Messaging collisions (competitors using our angles):
  ⚠️ [Competitor A] now claims "[phrase similar to ours]"
  → Recommend updating our headline to differentiate

New competitor offers:
  [Competitor B] launched [offer type] at [price/terms]
  → Compare to MIR PRICING.md — assess if response needed

Landing page changes:
  [Competitor A] updated headline from "[old]" to "[new]"

Recommended actions for {{LEAD_AGENT}}:
  1. [FILL — specific action]
  2. [FILL — specific action]
```

**Handoff to {{LEAD_AGENT}}:**
- {{LEAD_AGENT}} decides whether to respond to competitive shifts
- MSP `Market_Audiences/03_MARKET/COMPETITIVE-LANDSCAPE.md` updates approved by {{LEAD_AGENT}}

**Constraints:**
- Only uses publicly available data
- Never engages with competitor accounts
- Never makes strategic recommendations beyond flagging observations

---

## AG-I03 — Market Signal Scanner

```yaml
id          : AG-I03
name        : Market Signal Scanner
layer       : 1 — Intelligence
purpose     : Monitor platform algorithm changes, advertising policy updates, and
              industry developments that could affect campaign performance or strategy.
trigger     : Weekly automated scan
frequency   : Weekly + immediately on major platform announcements
```

**Inputs:**
- Meta Business blog and policy update feed
- Google Ads announcements
- TikTok for Business updates
- PostHog changelog (for tracking updates)
- n8n release notes
- Industry newsletters (search-based)

**Process:**
```
1. Search for updates in the past 7 days across:
   - "Meta Ads algorithm update [date]"
   - "Google Ads policy change [date]"
   - "TikTok advertising [date]"
   - "iOS tracking changes [date]"
   - "PostHog changelog [date]"
2. Classify each signal:
   a. URGENT: Affects active campaigns or tracking immediately
   b. MONITOR: Developing situation, watch for impact
   c. FYI: Background context, no immediate action
3. For URGENT signals: draft recommended response
4. Update MSP Market_Audiences/03_MARKET/INDUSTRY.md signal log
```

**Outputs:**
```
MARKET SIGNALS REPORT — Week of [YYYY-MM-DD]

URGENT (requires action this week):
  🔴 [Signal] — Impact: [describe] — Recommended action: [FILL]

MONITOR (watch over next 30 days):
  🟡 [Signal] — Potential impact: [describe]

FYI (background context):
  ⚪ [Signal] — Note: [describe]
```

**Handoff to {{LEAD_AGENT}}:**
- URGENT signals escalated immediately
- {{LEAD_AGENT}} decides response to platform policy changes

---

---

# LAYER 2 — STRATEGY
## Campaign architecture, content planning, and budget management

---

## AG-S01 — Campaign Architect

```yaml
id          : AG-S01
name        : Campaign Architect
layer       : 2 — Strategy
purpose     : Draft a complete CAMPAIGN.md file using data pulled from MIR and 
              MSP so {{LEAD_AGENT}} starts every campaign from a fully-populated brief.
trigger     : {{LEAD_AGENT}} initiates a new campaign request
frequency   : Per campaign
```

**Inputs:**
- MIR `Core_Strategy/01_COMPANY/PROFILE.md`
- MIR `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`
- MIR `Core_Strategy/02_BRAND/VOICE-TONE.md`
- MIR `Market_Audiences/03_MARKET/AUDIENCES.md` (target segment)
- MIR `Products/04_PRODUCTS/CATALOG.md` + `OFFERS.md` (what to promote)
- MIR `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md` (account IDs, pixel IDs)
- MIR `Core_Strategy/06_TECH-STACK/TRACKING.md` (PostHog events, CAPI params)
- MSP `Strategy/00_MASTER-PLAN/STRATEGIC-GOALS.md` (which goal this campaign serves)
- MSP `Strategy/00_MASTER-PLAN/BUDGET-ALLOCATION.md` (available budget)
- MSP `Outbound/01_ADVERTISING/PLAN.md` (discipline strategy it belongs to)
- {{LEAD_AGENT}}'s campaign brief input (objective, product, budget, timeline)

**Process:**
```
1. Load boot sequence (AG-F02)
2. Run gap check on required input files (AG-F03 mini-scan)
3. Pull all relevant data from MIR + MSP
4. Generate campaign_id: [client-slug]-[initiative]-[YYMM]
5. Populate CAMPAIGN.md template:
   §1 Brief — from {{LEAD_AGENT}}'s input + PROFILE.md
   §2 Audience — from AUDIENCES.md matching segment
   §3 Offer — from CATALOG.md + OFFERS.md
   §4 Creative Brief — from MESSAGING-FRAMEWORK.md + VISUAL-GUIDELINES.md
   §5 Tracking — from TRACKING.md (event names, CAPI params, UTM structure)
   §6 Launch Checklist — full checklist from template
   §7 Optimization Log — blank, ready for entries
6. Flag any fields that cannot be auto-populated (gaps)
7. Generate UTM parameter set (delegate to AG-T04)
```

**Outputs:**
- Complete `CAMPAIGN.md` draft in `Campaigns_Assets/08_CAMPAIGNS/ACTIVE/[campaign_id].md`
- Gap report: fields requiring {{LEAD_AGENT}}'s input
- UTM parameter sheet (from AG-T04)

**Handoff to {{LEAD_AGENT}}:**
- Review all auto-populated fields for accuracy
- Fill any flagged gaps
- Approve creative concept direction before AG-C01 is triggered
- Approve tracking spec before AG-T01 produces final spec

**Constraints:**
- Never invents data not in the repository
- Never sets a campaign live — produces drafts only
- Flags if Gate 2 is not GREEN before producing the campaign draft

**Dependencies:**
- AG-F02 (context loader) must run first
- MIR Gate 1: complete
- MSP `Strategy/00_MASTER-PLAN/BUDGET-ALLOCATION.md`: complete

---

## AG-S02 — Content Calendar Builder

```yaml
id          : AG-S02
name        : Content Calendar Builder
layer       : 2 — Strategy
purpose     : Populate the monthly editorial calendar by mapping content pillars,
              SEO keywords, and campaign alignment into a structured publishing schedule.
trigger     : Monthly (last week of each month for the following month) + quarterly for Q-view
frequency   : Monthly
```

**Inputs:**
- MIR `Campaigns_Assets/07_CONTENT/CONTENT-STRATEGY.md` (pillars, formats, cadence)
- MSP `Inbound/02_CONTENT-MARKETING/CONTENT-PILLARS.md`
- MSP `Inbound/06_SEO/KEYWORD-STRATEGY.md` (keyword queue)
- MSP `Inbound/02_CONTENT-MARKETING/SEO-CONTENT.md` (SEO content queue)
- MIR `Campaigns_Assets/07_CONTENT/EDITORIAL-CALENDAR.md` (current calendar)
- Active `CAMPAIGN.md` files (to align content with campaigns)
- MSP `Strategy/00_MASTER-PLAN/ANNUAL-CALENDAR.md` (seasonal events)

**Process:**
```
1. Load current month's publishing cadence from CONTENT-STRATEGY.md
2. Pull next month's seasonal events from ANNUAL-CALENDAR.md
3. Pull next 4 SEO content targets from SEO-CONTENT.md queue
4. Allocate content slots by pillar ratio (from CONTENT-PILLARS.md)
5. Check active campaigns — align 1–2 pieces per active campaign
6. For each content slot, generate:
   a. Platform
   b. Format
   c. Pillar
   d. Topic / working title
   e. Target keyword (if SEO piece)
   f. Campaign link (if campaign-aligned)
   g. Draft status: PLANNED
7. Output as table for EDITORIAL-CALENDAR.md
8. Flag: are there enough content assets for active ad campaigns?
```

**Outputs:**
- Monthly content calendar table (ready to paste into `EDITORIAL-CALENDAR.md`)
- Content gaps flagged: "Campaign X needs 2 more proof-point posts"
- Briefing queue for AG-C03 (content brief agent)

**Handoff to {{LEAD_AGENT}}:**
- Approve calendar before AG-C03 starts drafting briefs
- Adjust any topic angles that don't feel right

---

## AG-S03 — Budget Pacing Monitor

```yaml
id          : AG-S03
name        : Budget Pacing Monitor
layer       : 2 — Strategy
purpose     : Compare actual ad spend against the monthly plan, flag overspend/underspend,
              and surface budget reallocation recommendations before they become problems.
trigger     : Daily (weekdays) during active campaigns
frequency   : Daily
```

**Inputs:**
- MSP `Strategy/00_MASTER-PLAN/BUDGET-ALLOCATION.md` (planned budget by platform)
- Platform spend data (pulled via ad platform reports or provided by {{LEAD_AGENT}})
- Active `CAMPAIGN.md` budgets
- Current date (day of month ÷ total days = expected pacing %)

**Process:**
```
1. Calculate expected spend pacing for today:
   expected_pct = (day_of_month / days_in_month) × 100
2. For each platform and campaign:
   actual_spend = [pull from platform or use latest {{LEAD_AGENT}}-provided figure]
   actual_pct = actual_spend / monthly_budget × 100
   variance = actual_pct - expected_pct
3. Flag conditions:
   variance > +15% → OVERPACING (risk of budget exhaustion before month end)
   variance < -20% → UNDERPACING (delivery issue or learning phase)
   variance within ±15% → ON TRACK
4. Check CPL trend (last 7 days vs. target from KPI-FRAMEWORK.md)
5. Apply budget rules from MSP Outbound/01_ADVERTISING/PLAN.md:
   CPL > 150% target for 5 days → flag for review
   CPL > 200% target → flag for pause consideration
6. Generate daily pacing card
```

**Outputs:**
```
BUDGET PACING — [YYYY-MM-DD]
Day [N] of [M] — Expected pacing: [X]%

Platform        Budget    Spent    Pacing    Status
Meta Ads        $[X]      $[X]     [X]%      🟢 ON TRACK
Google Ads      $[X]      $[X]     [X]%      🟡 UNDERPACING
TOTAL           $[X]      $[X]     [X]%      🟢

CPL Alert: Meta — $[X] vs. $[X] target — [X]% over for [N] days
Action required: [FILL per budget rules in PLAN.md]
```

**Handoff to {{LEAD_AGENT}}:**
- Any 🔴 flag requires {{LEAD_AGENT}} to act within 24 hours
- Reallocation recommendations reviewed and approved by {{LEAD_AGENT}}
- Logged in `BUDGET-ALLOCATION.md` reallocation log

**Constraints:**
- Never changes budgets directly — produces recommendations only
- Always references the budget rule from MSP PLAN.md that triggered each flag

---

---

# LAYER 3 — CREATIVE
## Briefs, copy, content, and social assets

---

## AG-C01 — Creative Brief Agent

```yaml
id          : AG-C01
name        : Creative Brief Agent
layer       : 3 — Creative
purpose     : Produce a complete structural design brief for the designer based on 
              MIR brand standards and campaign requirements — no copy, no code, 
              pure structural specifications.
trigger     : New campaign approved by {{LEAD_AGENT}} + creative assets required
frequency   : Per campaign creative batch
```

**Inputs:**
- Approved `CAMPAIGN.md` §4 (creative concept direction)
- MIR `Core_Strategy/02_BRAND/BRAND-IDENTITY.md` (colors, fonts, logo specs)
- MIR `Core_Strategy/02_BRAND/VISUAL-GUIDELINES.md` (photography, layout, composition)
- MIR `Campaigns_Assets/07_CONTENT/TEMPLATES/AD-COPY.md` (structural text zones)
- Format list from campaign (e.g. Meta Feed 1080×1080, Story 1080×1920)

**Process:**
```
1. Load brand identity parameters (colors, fonts, logo variant rules)
2. Load visual direction (photography style, prohibited visuals)
3. Load format specs from BRAND-IDENTITY.md §6 asset specification table
4. For each required format:
   a. Define canvas dimensions and safe zones
   b. Define visual zone breakdown (top/mid/bottom)
   c. Specify approved colors (HEX) for this piece
   d. Specify typography (font, weight, size range) per text zone
   e. Specify logo placement and minimum size
   f. Specify imagery direction (reference VISUAL-GUIDELINES.md)
   g. Specify text overlay rules (coverage %, color treatment)
   h. List prohibited elements
5. Compile brief document
6. Include asset naming convention per README.md format
7. Include delivery spec: format, size, resolution, deadline
```

**Outputs:**
```
CREATIVE BRIEF — [campaign_id] — [YYYY-MM-DD]
Prepared by: AG-C01 | Reviewed by: {{LEAD_AGENT}} | For: [Designer Name]

ASSET 1: Meta Feed Static — 1080×1080px PNG RGB
  Zone layout:
    Top 35%   : [Visual description — e.g. "Product/person — high contrast, left-aligned"]
    Middle 40%: [Visual description — e.g. "Clean white space — no text overlay"]
    Bottom 25%: [CTA bar + logo zone]
  Colors: Primary #[HEX] · Background #[HEX] · Text #[HEX]
  Typography: H1 [Font] [Weight] [~Xpx] · CTA [Font] [Weight] [~Xpx]
  Logo: Horizontal lockup — bottom right — min 120px wide
  Imagery: [Specific direction from VISUAL-GUIDELINES.md]
  Prohibited: [List from VISUAL-GUIDELINES.md]
  File name: [campaign_id]-meta-feed-v1.png
  Due: [Date]

[ASSET 2, 3, etc...]
```

**Handoff to {{LEAD_AGENT}}:**
- {{LEAD_AGENT}} reviews brief before sending to designer
- {{LEAD_AGENT}} approves designer's deliverables against this brief

**Constraints:**
- Produces structural specifications only — never writes ad copy
- Never generates visual files
- Never sends the brief to the designer directly

---

## AG-C02 — Copy Drafter

```yaml
id          : AG-C02
name        : Copy Drafter
layer       : 3 — Creative
purpose     : Draft all required marketing copy for a campaign — ads, landing page, 
              email — strictly following brand voice rules and messaging architecture.
trigger     : Campaign brief approved by {{LEAD_AGENT}} + copy required
frequency   : Per campaign + per creative refresh
```

**Inputs:**
- Approved `CAMPAIGN.md` (objective, audience, offer)
- MIR `Core_Strategy/02_BRAND/VOICE-TONE.md` (language rules, prohibited words)
- MIR `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` (value props, objections, headlines bank)
- MIR `Market_Audiences/03_MARKET/AUDIENCES.md` (ICP segment — psychographic data)
- MIR `Campaigns_Assets/07_CONTENT/TEMPLATES/AD-COPY.md` (structural templates)
- MIR `Campaigns_Assets/07_CONTENT/TEMPLATES/LANDING-PAGE.md`
- MIR `Campaigns_Assets/07_CONTENT/TEMPLATES/EMAIL.md`

**Process:**
```
1. Load tone rules from VOICE-TONE.md — extract prohibited word list
2. Load audience psychographic profile (fears, desires, language)
3. Load primary message from MESSAGING-FRAMEWORK.md for this segment + funnel stage
4. Draft in structural order:
   FOR EACH AD FORMAT:
     a. Hook (problem-framed or outcome-framed, per template)
     b. Body (problem → mechanism → outcome)
     c. Proof element (from MESSAGING-FRAMEWORK.md §7)
     d. CTA (from approved CTA list in VOICE-TONE.md §7)
     e. Headline (outcome-focused, ≤6 words)
   FOR LANDING PAGE:
     a. Populate each section per LANDING-PAGE.md template
     b. Headline must match ad headline (message match)
   FOR EMAIL SEQUENCE:
     a. Subject line (per EMAIL.md rules — no clickbait)
     b. Body structure per template
     c. Single CTA
5. Self-review: check every draft against prohibited word list
6. Flag any claims requiring legal review (per LEGAL.md §3)
```

**Outputs:**
- Ad copy deck: all variants, labeled by format and audience
- Landing page copy draft: section by section
- Email copy draft: all sequence steps
- Legal flag list (any claims needing LEGAL.md verification)

**Handoff to {{LEAD_AGENT}}:**
- ALL copy requires {{LEAD_AGENT}}'s review before use
- Client approval required per APPROVALS.md before any external publication
- Legal flags resolved before any claim goes live

**Constraints:**
- Never produces "final" copy — always labeled DRAFT
- Every piece of copy must cite which MESSAGING-FRAMEWORK.md message it derives from
- Prohibited words from VOICE-TONE.md are hard-blocked (re-read list before every output)
- Never writes copy that contradicts LEGAL.md §3 compliance rules

---

## AG-C03 — Content Brief Agent

```yaml
id          : AG-C03
name        : Content Brief Agent
layer       : 3 — Creative
purpose     : Generate a detailed content brief for every item on the editorial calendar
              so content can be produced consistently, on-strategy, and SEO-ready.
trigger     : Approved editorial calendar from AG-S02 + {{LEAD_AGENT}} confirmation
frequency   : Monthly (batch for the month) + on-demand
```

**Inputs:**
- MIR `Campaigns_Assets/07_CONTENT/EDITORIAL-CALENDAR.md` (approved planned items)
- MSP `Inbound/02_CONTENT-MARKETING/CONTENT-PILLARS.md` (pillar definition)
- MSP `Inbound/06_SEO/KEYWORD-STRATEGY.md` (target keyword if SEO piece)
- MIR `Core_Strategy/02_BRAND/VOICE-TONE.md`
- MIR `Market_Audiences/03_MARKET/AUDIENCES.md` (who this content is for)
- MIR `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` (what it should reinforce)

**Process:**
```
1. For each planned content item this month:
   a. Identify pillar, format, audience stage
   b. Pull target keyword (if SEO piece from KEYWORD-STRATEGY.md)
   c. Define reader's entry state: what do they know/believe arriving?
   d. Define exit state: what should they know/believe leaving?
   e. Propose H1 and 3–5 H2 section headings
   f. List 3–5 key points to cover (from MESSAGING-FRAMEWORK.md)
   g. Identify proof point to include (from §7 Key Proof Points)
   h. Specify internal links (to other published content)
   i. Specify CTA (from approved CTA list)
   j. Specify SEO requirements (word count, keyword placement, schema)
   k. Reference repurposing plan (what other formats derive from this)
```

**Outputs:**
```
CONTENT BRIEF — [Title] — [YYYY-MM-DD]
Pillar: [C1–C4] | Format: [Blog / Video / Carousel] | Platform: [FILL]
Target keyword: [FILL] | Search volume: [FILL] | Difficulty: [FILL]
Target audience: [ICP-1] at [funnel stage] stage
Entry state: [What they believe before reading]
Exit state: [What they should believe after reading]
Word count: [FILL] minimum
Proposed structure:
  H1: [FILL]
  H2: [Section 1 — key point]
  H2: [Section 2 — key point]
  H2: [Section 3 — key point]
Key proof to include: [From MESSAGING-FRAMEWORK.md §7]
Internal links: [Links to existing content]
CTA: [FILL]
Repurpose to: [5 social posts, 1 email section, 1 short video]
```

**Handoff to {{LEAD_AGENT}}:**
- {{LEAD_AGENT}} reviews brief direction before writing begins
- Final draft reviewed by {{LEAD_AGENT}} before scheduling

---

## AG-C04 — Social Content Drafter

```yaml
id          : AG-C04
name        : Social Content Drafter
layer       : 3 — Creative
purpose     : Draft a batch of organic social posts for the week based on the
              editorial calendar, repurposed content, and platform-specific rules.
trigger     : Weekly (Thursday — draft next week's content for {{LEAD_AGENT}} review)
frequency   : Weekly
```

**Inputs:**
- MIR `Campaigns_Assets/07_CONTENT/EDITORIAL-CALENDAR.md` (upcoming week's schedule)
- MIR `Campaigns_Assets/07_CONTENT/TEMPLATES/SOCIAL-POST.md` (platform templates)
- MIR `Core_Strategy/02_BRAND/VOICE-TONE.md`
- MSP `Social/04_SOCIAL-MEDIA/PLATFORM-STRATEGIES.md` (platform rules)
- Any published content from this week to repurpose

**Process:**
```
1. Load next week's social slots from EDITORIAL-CALENDAR.md
2. For each slot:
   a. Apply platform template from SOCIAL-POST.md
   b. Apply tone for that platform's context (from VOICE-TONE.md §2)
   c. Draft hook — test against "would I save or share this?" standard
   d. Draft body — maximum density, no filler sentences
   e. Draft CTA — must match approved CTA list for organic
   f. Add hashtags (per PLATFORM-STRATEGIES.md limits)
3. Repurpose any published blog/video from this week:
   a. Pull 5 insight sentences
   b. Format as standalone posts
   c. Tag as [REPURPOSED — source: URL]
4. Self-check: prohibited word list from VOICE-TONE.md
5. Output formatted for each platform
```

**Outputs:**
- Draft post batch (one per slot, labeled by platform and date)
- Repurposed content variants
- Visual specification note per post (for designer if image required)

**Handoff to {{LEAD_AGENT}}:**
- {{LEAD_AGENT}} reviews and edits all drafts — voice is personal, requires human sign-off
- {{LEAD_AGENT}} schedules approved posts

**Constraints:**
- Never publishes directly
- Never invents proof points or statistics not in the repository
- Never uses emoji unless VOICE-TONE.md confirms it's appropriate for this brand

---

---

# LAYER 4 — TECHNICAL
## Tracking, automation, and infrastructure specifications

---

## AG-T01 — Tracking Specifier

```yaml
id          : AG-T01
name        : Tracking Specifier
layer       : 4 — Technical
purpose     : Generate a complete, implementation-ready tracking specification for any
              new page or campaign — PostHog events, CAPI params, and deduplication logic.
trigger     : New landing page or campaign requiring tracking + {{LEAD_AGENT}} approval
frequency   : Per new page/campaign
```

**Inputs:**
- MIR `Core_Strategy/06_TECH-STACK/TRACKING.md` (master schema, naming conventions)
- Active `CAMPAIGN.md` (UTM structure, offer ID, form IDs)
- MIR `Products/04_PRODUCTS/CUSTOMER-JOURNEY.md` (funnel stages)
- MIR `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md` (pixel IDs, CAPI dataset ID)

**Process:**
```
1. Load master event schema from TRACKING.md
2. For this campaign's landing page, define:
   a. All PostHog events to fire (using naming convention: object_action)
   b. Required properties for each event (from standard property definitions)
   c. Person properties for identify() call on lead submission
   d. Funnel definition (4 steps) to create in PostHog
3. For Meta CAPI:
   a. Map each PostHog event to its CAPI equivalent
   b. Generate Lead event JSON schema (from TRACKING.md §6 template)
   c. Define event_id deduplication format
4. Generate PostHog cohort definition for this campaign
5. Generate 4-step validation test plan:
   a. What to click/fill to trigger each event
   b. What to verify in PostHog live events
   c. What to verify in Meta Events Manager
   d. Acceptable pass criteria
```

**Outputs:**
```
TRACKING SPEC — [campaign_id] — [YYYY-MM-DD]

PostHog Events:
  page_viewed
    trigger  : Landing page load
    properties: $current_url, utm_source, utm_medium, utm_campaign
  
  form_started
    trigger  : First field interaction on lead form
    properties: form_id: "[page-slug]-form-1", page_path
  
  lead_submitted
    trigger  : Successful form submission
    properties: form_id, page_path, offer_id: "[OFR-00X]",
                campaign_id: "[campaign_id]", ad_id: "[if available]"
  
  thank_you_page_viewed
    trigger  : Thank you page load
    properties: form_id, offer_id

Meta CAPI Lead Event:
  event_name      : "Lead"
  event_time      : [UNIX timestamp]
  event_source_url: [landing page URL]
  action_source   : "website"
  event_id        : "lead-[form_id]-[timestamp]-[email_hash_8char]"
  user_data       : [SHA-256 email, phone, fbc, fbp, client_ip, user_agent]

PostHog Funnel:
  Name: "[campaign_id] Conversion Funnel"
  Step 1: page_viewed (url = [LP URL])
  Step 2: form_started
  Step 3: lead_submitted
  Step 4: thank_you_page_viewed

Validation test plan: [4 steps with pass criteria]
```

**Handoff to {{LEAD_AGENT}}:**
- Spec reviewed before passing to whoever implements on Vibe code pages
- Validation checklist executed by {{LEAD_AGENT}} before campaign goes live

---

## AG-T02 — Automation Architect

```yaml
id          : AG-T02
name        : Automation Architect
layer       : 4 — Technical
purpose     : Specify the complete n8n/Make workflow logic for any new lead routing,
              data sync, or automation requirement — ready for implementation.
trigger     : New campaign requiring automation + any new workflow request
frequency   : Per new workflow need
```

**Inputs:**
- MIR `Core_Strategy/06_TECH-STACK/AUTOMATION.md` (existing workflows, data mapping)
- MIR `Core_Strategy/06_TECH-STACK/INTEGRATIONS.md` (system connections)
- MIR `Core_Strategy/06_TECH-STACK/TRACKING.md` (CAPI event requirements)
- MIR `Core_Strategy/06_TECH-STACK/INFRASTRUCTURE.md` (CRM and ESP platform)
- `CAMPAIGN.md` (specific routing requirements)

**Process:**
```
1. Review existing workflows in AUTOMATION.md — does WF-001 cover this need?
2. If existing workflow covers it: output configuration diff (what to add/change)
3. If new workflow needed:
   a. Define trigger (webhook / schedule / CRM event / ESP event)
   b. Map all steps with:
      - Input payload structure
      - Transformation logic
      - Output system and endpoint
      - Error handling behavior
      - Retry policy
   c. Define data mapping (UTM → CRM field, etc.)
   d. Define test payload
4. Assign workflow ID following WF-XXX convention
5. Produce implementation spec (no code — structured logic document)
```

**Outputs:**
```
WORKFLOW SPEC — WF-[NNN] — [Name] — [YYYY-MM-DD]

Trigger    : [POST /webhook/[path] | Cron: [schedule] | CRM event: [type]]
Platform   : [n8n | Make]
Status     : DRAFT — awaiting implementation

Step 1: [Action name]
  Input    : [payload fields]
  Logic    : [what this step does]
  Output   : [what it produces or sends]
  On error : [retry X times / alert {{LEAD_AGENT}} / log and continue]

[Steps 2–N...]

Data mapping:
  [Source field] → [Destination field] ([transformation if any])

Test payload:
  [JSON or structured example]

Validation:
  □ [Check 1 — what to verify after implementation]
  □ [Check 2]
```

**Handoff to {{LEAD_AGENT}}:**
- Spec reviewed by {{LEAD_AGENT}} before implementation
- {{LEAD_AGENT}} or developer implements — AG-T02 does not build workflows

---

## AG-T03 — Landing Page Specifier

```yaml
id          : AG-T03
name        : Landing Page Specifier
layer       : 4 — Technical
purpose     : Produce a complete Vibe code page specification: section structure,
              copy zones, form fields, tracking hooks, and mobile rules.
trigger     : New landing page needed for a campaign
frequency   : Per campaign / per new page
```

**Inputs:**
- Approved `CAMPAIGN.md` (objective, offer, CTA)
- MIR `Campaigns_Assets/07_CONTENT/TEMPLATES/LANDING-PAGE.md` (page structure template)
- AG-C02 copy draft (if available — layout adapts to copy length)
- MIR `Core_Strategy/02_BRAND/BRAND-IDENTITY.md` (colors, fonts)
- MIR `Core_Strategy/02_BRAND/VISUAL-GUIDELINES.md` (imagery rules)
- MSP `Inbound/11_CRO/PLAN.md` (landing page CRO standards)

**Process:**
```
1. Select page structure from LANDING-PAGE.md (lead gen vs. sales vs. event)
2. Define section-by-section spec:
   a. Section purpose, order, and conditional visibility
   b. Copy zones (headline zone, body zone, CTA zone) with character limits
   c. Visual zones (hero image spec, social proof asset spec)
   d. Form specification: fields, labels, validation, submit button
   e. Trust signal placements
3. Define mobile layout adjustments (which sections collapse/reorder)
4. Embed tracking hooks:
   a. PostHog SDK initialization point
   b. form_started event trigger (first field focus)
   c. lead_submitted event trigger (form submit success)
   d. Meta pixel PageView trigger (page load)
5. Define page URL and slug convention
6. Apply CRO standards checklist from MSP Inbound/11_CRO/PLAN.md §6
```

**Outputs:**
- Page spec document: section map, copy zones, form spec, tracking hooks
- Mobile spec addendum
- CRO standards checklist (filled — any items failing = flag)
- UTM parameter capture spec (hidden fields or cookie capture)

**Handoff to {{LEAD_AGENT}}:**
- Spec reviewed before Vibe code build begins
- Page reviewed on staging before going live

---

## AG-T04 — UTM Architect

```yaml
id          : AG-T04
name        : UTM Architect
layer       : 4 — Technical
purpose     : Generate the complete UTM parameter set for every campaign and asset,
              ensuring PostHog attribution is clean and consistent.
trigger     : Any new campaign, ad, or promotional link
frequency   : Per campaign + per new content asset requiring tracking
```

**Inputs:**
- MIR `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md` (UTM naming conventions)
- Active `CAMPAIGN.md` (campaign_id, platforms, ad variants)

**Process:**
```
1. Load UTM naming conventions from PAID-MEDIA.md §8
2. For each ad platform, format, and variant:
   a. utm_source: [platform slug]
   b. utm_medium: [medium type]
   c. utm_campaign: [campaign_id]
   d. utm_content: [asset-type]-[variant]-v[N]
   e. utm_term: [keyword or segment — if applicable]
3. Construct full URL + UTM string for each asset
4. Validate: no spaces, correct encoding, no duplicate parameters
5. Produce tracking sheet
```

**Outputs:**
```
UTM PARAMETER SHEET — [campaign_id] — [YYYY-MM-DD]

Asset                            Full URL with UTMs
─────────────────────────────────────────────────────
Meta Feed — Cold — v1           [URL]?utm_source=meta&utm_medium=paid-social&...
Meta Story — Cold — v1          [URL]?utm_source=meta&utm_medium=paid-social&...
Google Search — Brand — v1      [URL]?utm_source=google&utm_medium=paid-search&...
Email — Nurture Step 3          [URL]?utm_source=email&utm_medium=email&...

IMPORTANT: These are the ONLY approved URLs for this campaign.
Do not use any untagged links in any paid or email channel.
```

**Handoff to {{LEAD_AGENT}}:**
- Sheet verified before assets go live
- Any change to URL or campaign ID requires a fresh UTM sheet

---

---

# LAYER 5 — ANALYTICS
## Performance monitoring, funnel analysis, and reporting

---

## AG-A01 — Performance Monitor

```yaml
id          : AG-A01
name        : Performance Monitor
layer       : 5 — Analytics
purpose     : Generate the daily/weekly marketing performance pulse across all active
              campaigns against KPI targets — PostHog first, platform data as signal.
trigger     : Daily (first 14 days of campaign) · Weekly thereafter
frequency   : Daily (first 2 weeks) · Weekly (ongoing)
```

**Inputs:**
- MIR `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md` (targets and decision rules)
- PostHog dashboard data (provided by {{LEAD_AGENT}} or via API)
- Ad platform data (provided by {{LEAD_AGENT}} — signal only)
- Active `CAMPAIGN.md` files (§7 optimization log)
- MSP `Strategy/00_MASTER-PLAN/PERFORMANCE-DASHBOARD.md`

**Process:**
```
1. Load KPI targets from KPI-FRAMEWORK.md
2. For each active campaign:
   a. Pull PostHog: lead_submitted event count (authoritative)
   b. Pull platform: spend (authoritative for spend)
   c. Calculate CPL = platform_spend / posthog_leads
   d. Compare CPL to target
   e. Check discrepancy: |posthog_leads - platform_reported_leads| / posthog_leads
   f. Apply status rules:
      ≤15% discrepancy + CPL on target → 🟢
      15–30% discrepancy OR CPL 100-150% → 🟡
      >30% discrepancy OR CPL >150% → 🔴
3. Check optimization rules from KPI-FRAMEWORK.md §6
4. If any rule trigger is met: generate recommended action
5. Update PERFORMANCE-DASHBOARD.md data cells
```

**Outputs:**
```
PERFORMANCE PULSE — [YYYY-MM-DD] — [Campaign ID]
Source of truth: PostHog

Leads today     : [N] | Target: [N/day] | Status: 🟢
Leads MTD       : [N] | Target: [N] | Pace: [%]
CPL (PostHog)   : $[X] | Target: $[X] | Status: 🟢
Ad Spend MTD    : $[X] | Budget: $[X] | Pacing: [%]
Discrepancy     : [X]% (PostHog [N] vs Meta CAPI [N]) | Status: 🟢

Optimization flags:
  None — continue current strategy

Tracking health:
  PostHog lead_submitted: ✓ firing
  Meta CAPI event quality: [X.X] ✓
```

**Handoff to {{LEAD_AGENT}}:**
- Any 🔴 flag reviewed within 4 hours
- Optimization recommendations require {{LEAD_AGENT}} decision to act
- Never adjusts budgets, pauses campaigns, or changes targeting directly

**Constraints:**
- PostHog numbers are always cited as primary
- Platform numbers always labeled "signal only"
- Never makes optimization changes — produces flagged recommendations only

---

## AG-A02 — Funnel Analyst

```yaml
id          : AG-A02
name        : Funnel Analyst
layer       : 5 — Analytics
purpose     : Run the monthly funnel analysis — identify the biggest conversion drop-off,
              surface session recording patterns, and generate CRO hypotheses.
trigger     : Monthly (first week) + after any significant page or campaign change
frequency   : Monthly
```

**Inputs:**
- PostHog funnel data (4-step funnel per campaign)
- PostHog session recordings summary (patterns from drop-off pages)
- MSP `Inbound/11_CRO/FUNNEL-ANALYSIS.md` (historical trend)
- MIR `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md` (funnel targets)
- MSP `Inbound/11_CRO/TESTING-ROADMAP.md` (what's already been tested)

**Process:**
```
1. Pull current month's 4-step funnel conversion rates from PostHog
2. Compare each step vs. target and vs. previous month
3. Calculate absolute volume drop at each step
4. Identify the ONE step with the highest absolute drop-off
5. For the drop-off step:
   a. Pull session recording observations (scroll depth, click patterns)
   b. Check form field abandonment data (if available)
   c. Check post-thank-you-page rate (if <95% = tracking issue, not CRO)
6. Cross-reference: what copy/creative was running for these sessions?
7. Generate 2–3 hypotheses for drop-off cause
8. For each hypothesis: propose A/B test variant
9. Update MSP FUNNEL-ANALYSIS.md monthly snapshot
10. Feed top hypothesis to MSP TESTING-ROADMAP.md queue
```

**Outputs:**
```
FUNNEL ANALYSIS — [YYYY-MM] — [campaign_id]

Step            Volume    CVR       vs. Target    vs. Last Month
──────────────────────────────────────────────────────────────
LP View         [N]       100%      —             —
Form Started    [N]       [X]%      [+/- %]       [+/- %]
Lead Submitted  [N]       [X]%      ⚠️ -8%        ↓ -3%  ← BIGGEST DROP
TY Page View    [N]       [X]%      ✓             =

Primary bottleneck: Step 2 → Step 3 (Form Started → Lead Submitted)
Absolute leak: [N] sessions started the form but did not submit

Observations from session recordings:
  · 62% of users scroll past the form without engaging
  · 38% who start the form abandon on the phone field
  · Average form completion time: [X] seconds

Hypotheses:
  H1: Form has too many fields — phone field is friction
      Test: Remove phone field. Impact: +8-15% form completion estimated.
  H2: Submit button ("Send" ) is unclear — action ambiguity
      Test: Change CTA to "Book my free call". Impact: +3-8% estimated.

Recommended test to add to queue: H1 (highest impact / simplest to test)
```

**Handoff to {{LEAD_AGENT}}:**
- Hypotheses reviewed by {{LEAD_AGENT}} before adding to test queue
- Test changes to Vibe code pages approved by {{LEAD_AGENT}}

---

## AG-A03 — Report Compiler

```yaml
id          : AG-A03
name        : Report Compiler
layer       : 5 — Analytics
purpose     : Assemble the weekly and monthly performance report from all data
              sources into the approved template — ready for {{LEAD_AGENT}}'s review and delivery.
trigger     : Weekly (Friday PM) · Monthly (1st week of following month)
frequency   : Weekly + Monthly
```

**Inputs:**
- AG-A01 daily pulse outputs (7-day or 30-day set)
- AG-A02 funnel analysis (monthly only)
- AG-S03 budget pacing output
- MIR `Core_Strategy/09_ANALYTICS/REPORTING-CADENCE.md` (format and structure)
- Active `CAMPAIGN.md` §7 optimization log
- MSP `Strategy/00_MASTER-PLAN/PERFORMANCE-DASHBOARD.md`

**Process:**
```
WEEKLY REPORT:
1. Pull 7-day performance data from AG-A01 outputs
2. Identify top and bottom 3 creatives by CPL
3. Summarize optimization actions taken this week
4. Summarize planned actions next week
5. Apply weekly report template from REPORTING-CADENCE.md
6. Flag: any campaigns needing {{LEAD_AGENT}} attention before next Monday

MONTHLY REPORT:
1. Compile all KPIs vs. targets (full KPI dictionary from KPI-FRAMEWORK.md)
2. Include funnel analysis from AG-A02
3. Channel breakdown: spend and leads by platform
4. Creative performance summary: top 3 performers, 3 being retired
5. Audience insights from AG-I01 (if run this month)
6. Optimization actions log (from CAMPAIGN.md §7 entries)
7. Recommendations section: 3–5 numbered action items for next month
8. Budget proposal for next month (stays within BUDGET-ALLOCATION.md)
9. Apply monthly report template from REPORTING-CADENCE.md
```

**Outputs:**
- Draft weekly/monthly report as `.md` file saved to `Core_Strategy/09_ANALYTICS/REPORTS/`
- Named per convention from `REPORTS/README.md`
- Executive summary section first (3–5 sentences)

**Handoff to {{LEAD_AGENT}}:**
- {{LEAD_AGENT}} reviews draft report
- {{LEAD_AGENT}} adds any context not captured in data
- {{LEAD_AGENT}} delivers to client per preferred channel
- Never delivered to client without {{LEAD_AGENT}} review

---

## AG-A04 — CRO Hypothesis Generator

```yaml
id          : AG-A04
name        : CRO Hypothesis Generator
layer       : 5 — Analytics
purpose     : Generate structured A/B test hypotheses from funnel data, session
              recordings, and heuristic analysis — keeping the test queue full.
trigger     : Monthly (after AG-A02 funnel analysis) + on-demand
frequency   : Monthly
```

**Inputs:**
- AG-A02 funnel analysis output
- MSP `Inbound/11_CRO/TESTING-ROADMAP.md` (what has already been tested)
- MSP `Inbound/11_CRO/PLAN.md` §3 research framework
- MIR `Campaigns_Assets/07_CONTENT/TEMPLATES/LANDING-PAGE.md` (structure reference)
- PostHog heatmap and session data (provided by {{LEAD_AGENT}})

**Process:**
```
1. Read funnel analysis drop-off points from AG-A02
2. Apply heuristic framework from CRO PLAN.md §3:
   - Message match check (ad headline = LP headline?)
   - Above-fold CTA visibility
   - Form field count
   - Social proof proximity to CTA
   - Mobile usability check
   - Load time
3. For each identified issue: construct hypothesis in format:
   "If we [change X] then [metric] will [direction] by [estimated %]
    because [ICP behavior insight]"
4. Estimate impact score (based on affected funnel volume)
5. Estimate implementation effort (1–5 scale)
6. Score: impact ÷ effort → prioritize high-impact/low-effort first
7. Add top 3 hypotheses to TESTING-ROADMAP.md queue
```

**Outputs:**
- 3–5 prioritized test hypotheses per month
- Impact/effort scoring matrix
- Updated `TESTING-ROADMAP.md` queue section

**Handoff to {{LEAD_AGENT}}:**
- {{LEAD_AGENT}} approves hypotheses before tests are implemented
- Test implementation requires Vibe code changes (not handled by this agent)

---

---

# LAYER 6 — OPERATIONS
## Lead scoring, sequence drafting, SEO planning, monitoring

---

## AG-O01 — Lead Scorer

```yaml
id          : AG-O01
name        : Lead Scorer
layer       : 6 — Operations
purpose     : Apply the standardized lead scoring model to every new CRM lead
              and output a routing recommendation within minutes of lead capture.
trigger     : New lead arrives in CRM (triggered by n8n WF-001 completion)
frequency   : Per lead (real-time)
```

**Inputs:**
- CRM lead record (email, company, utm_source, utm_campaign, utm_content)
- MIR `Market_Audiences/03_MARKET/AUDIENCES.md` (ICP qualification criteria)
- MIR `Core_Strategy/06_TECH-STACK/AUTOMATION.md` WF-001 §7 scoring rules
- PostHog person profile for this email (if available — prior page visits)

**Process:**
```
SCORING MODEL:
  Base score = 0

  Source quality:
    +20  utm_source = meta AND utm_medium = paid-social
    +15  utm_source = referral
    +10  utm_source = organic
    +5   utm_source = email
    +0   utm_source = unknown

  Page engagement signals:
    +15  pricing_page_viewed event in PostHog
    +10  case_study_viewed event in PostHog
    +10  fbclid or gclid present (direct ad click)
    +5   multiple page views in session (>3)

  ICP match (from company domain / stated company):
    +20  Company size matches ICP-1 (from AUDIENCES.md)
    +10  Industry matches ICP-1
    +5   Role/title matches ICP decision-maker criteria

  Email domain quality:
    +5   Corporate domain (not gmail/yahoo/hotmail)

ROUTING OUTPUT:
  Score ≥ 50: PRIORITY — {{LEAD_AGENT}} outreach within 2h
  Score 25–49: STANDARD — {{LEAD_AGENT}} outreach within 24h
  Score < 25: NURTURE — Email sequence only, no manual outreach
```

**Outputs:**
```
LEAD SCORE — [Lead Name] — [YYYY-MM-DD HH:MM]
Email    : [email]
Score    : [N] / 80
Routing  : [PRIORITY / STANDARD / NURTURE]

Scoring breakdown:
  Source quality    : +[N] (utm_source = [FILL])
  Pricing page      : +[N] (visited pricing page [N] min ago)
  ICP match         : +[N] (company domain suggests [industry])
  
Recommended action: [{{LEAD_AGENT}} outreach within 2h / Enter nurture only]
CRM stage to set  : [New Lead — Priority / New Lead — Standard / Nurture]
```

**Handoff to {{LEAD_AGENT}}:**
- PRIORITY leads: {{LEAD_AGENT}} notified within 5 minutes
- STANDARD leads: {{LEAD_AGENT}} sees in daily lead review
- NURTURE leads: fully automated — no {{LEAD_AGENT}} action needed

---

## AG-O02 — Email Sequence Drafter

```yaml
id          : AG-O02
name        : Email Sequence Drafter
layer       : 6 — Operations
purpose     : Draft complete lifecycle email sequences — welcome, nurture, onboarding,
              re-engagement — for {{LEAD_AGENT}}'s review before activation in the ESP.
trigger     : New sequence required (campaign launch or sequence gap identified by AG-F03)
frequency   : Per new sequence need
```

**Inputs:**
- MSP `Outbound/03_EMAIL-MARKETING/LIFECYCLE-SEQUENCES.md` (sequence architecture)
- MIR `Campaigns_Assets/07_CONTENT/TEMPLATES/EMAIL.md` (copy templates)
- MIR `Core_Strategy/02_BRAND/VOICE-TONE.md` (language rules)
- MIR `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` (objection handling)
- MIR `Market_Audiences/03_MARKET/AUDIENCES.md` (ICP psychographic data)
- MIR `Campaigns_Assets/05_CHANNELS/EMAIL.md` (ESP, from name, deliverability rules)

**Process:**
```
1. Load sequence architecture from LIFECYCLE-SEQUENCES.md
2. For each email in the sequence:
   a. Load the objection or value point for this step
   b. Apply email template structure (from TEMPLATES/EMAIL.md)
   c. Draft subject line (5–8 words, no clickbait, per VOICE-TONE.md)
   d. Draft preview text (complements subject, ≠ repeat)
   e. Draft body (max 300 words, single CTA)
   f. Apply prohibited word check
   g. Confirm single CTA per email
3. Apply sequence-level logic:
   a. Verify each email advances toward sequence goal
   b. Verify objection flow follows MESSAGING-FRAMEWORK.md §8 progression
   c. Verify final email has appropriate sunset/CTA
4. Flag any legal compliance requirements (from LEGAL.md §3)
```

**Outputs:**
- Complete sequence draft document (all emails, in order)
- Subject line alternatives (2 per email)
- Deliverability checklist: unsubscribe, from name, text-to-image ratio
- Legal flag list

**Handoff to {{LEAD_AGENT}}:**
- ALL email sequence drafts require {{LEAD_AGENT}}'s review and approval
- ESP upload done by {{LEAD_AGENT}} after approval
- Activation only after n8n workflow test (AG-T02 spec)

---

## AG-O03 — SEO Content Planner

```yaml
id          : AG-O03
name        : SEO Content Planner
layer       : 6 — Operations
purpose     : Maintain the SEO content pipeline by mapping target keywords to content
              briefs and ensuring the keyword queue advances each month.
trigger     : Monthly (before AG-S02 calendar build) + quarterly keyword refresh
frequency   : Monthly
```

**Inputs:**
- MSP `Inbound/06_SEO/KEYWORD-STRATEGY.md` (keyword queue by tier)
- MSP `Inbound/06_SEO/PLAN.md` (SEO goals and keyword targets)
- MIR `Campaigns_Assets/07_CONTENT/EDITORIAL-CALENDAR.md` (content already scheduled)
- MIR `Campaigns_Assets/07_CONTENT/CONTENT-LIBRARY/README.md` (published content — avoid duplication)
- AG-I02 competitive monitor (are competitors ranking for our targets?)

**Process:**
```
1. Load Tier 1 keyword queue from KEYWORD-STRATEGY.md
2. Check: how many Tier 1 keywords have supporting content published?
3. Identify the 2–3 Tier 1 keywords with no content yet
4. For each target keyword:
   a. Check search intent: informational / commercial / transactional
   b. Determine best content format (blog, case study, landing page)
   c. Identify cannibalization risk (existing content on same topic?)
   d. Determine internal linking opportunities (from CONTENT-LIBRARY)
   e. Estimate SERP competition: page 1 DR average (rough from keyword tool)
   f. Recommend content length and structure
5. Pass 2–3 briefed keyword targets to AG-C03 for content briefing
6. Update KEYWORD-STRATEGY.md with "IN PROGRESS" status for targeted keywords
7. Report on ranking progress: any Tier 1/2 keywords moved positions this month?
```

**Outputs:**
- Monthly SEO content targets: 2–3 keywords with format and structure recommendations
- Ranking movement report (keywords gained/lost positions)
- Internal linking map update (new content should link to/from existing)
- Updated `KEYWORD-STRATEGY.md` status column

**Handoff to {{LEAD_AGENT}}:**
- Keyword targets approved by {{LEAD_AGENT}} before briefing
- Ranking report reviewed monthly

---

## AG-O04 — Crisis Signal Monitor

```yaml
id          : AG-O04
name        : Crisis Signal Monitor
layer       : 6 — Operations
purpose     : Continuously scan for signals that require urgent attention — ad account
              issues, tracking failures, negative brand mentions, and platform outages.
trigger     : Daily automated scan (morning)
frequency   : Daily
```

**Inputs:**
- Meta Ads account status (ad account active/restricted/disabled check)
- PostHog live events (is tracking firing? — last event timestamp)
- n8n/Make error log summary (WF-001 failure rate)
- Web search: "[brand name]" + negative keywords (complaint, scam, lawsuit, etc.)
- Platform status pages: Meta, Google, PostHog, n8n

**Process:**
```
1. Check ad account status — any flags, restrictions, or policy violations?
2. Check PostHog: when was the last lead_submitted event?
   > 24h with active campaigns = TRACKING FAILURE alert
3. Check n8n/Make WF-001: any failed executions in last 24h?
4. Check Meta Events Manager: any event quality drops below 6.0?
5. Search for brand mentions with negative signals
6. Check platform status pages for outages
7. Classify findings: CRITICAL / HIGH / MONITOR / CLEAR
8. For CRITICAL: draft immediate response action
9. Reference MSP Outbound/07_PR-COMMUNICATIONS/CRISIS-PLAYBOOK.md for response templates
```

**Outputs:**
```
CRISIS MONITOR — [YYYY-MM-DD HH:MM]

CRITICAL (immediate action required):
  🔴 [None today — or: Ad account flagged for policy review]

HIGH (action within 4 hours):
  🟡 [None today — or: n8n WF-001 had 3 failures in last 6 hours]

MONITOR (watch):
  🟡 [None today — or: Platform degraded response times]

ALL CLEAR:
  ✓ Ad accounts: Active
  ✓ PostHog: Last event [N] min ago
  ✓ n8n WF-001: 0 errors last 24h
  ✓ Brand mentions: No negative signals
```

**Handoff to {{LEAD_AGENT}}:**
- CRITICAL alerts sent to {{LEAD_AGENT}} via preferred channel within 10 minutes
- {{LEAD_AGENT}} executes response from CRISIS-PLAYBOOK.md
- All incidents logged in `Core_Strategy/00_META/CHANGELOG.md`

---

## AG-O05 — Influencer Vetter

```yaml
id          : AG-O05
name        : Influencer Vetter
layer       : 6 — Operations
purpose     : Research prospective influencer partners against the tier framework
              and ICP criteria — producing a scored profile before any outreach.
trigger     : Influencer Marketing PLAN.md activated + partner candidates identified
frequency   : Per prospective partner (batch or individual)
```

**Inputs:**
- MSP `Social/05_INFLUENCER-MARKETING/TIER-FRAMEWORK.md` (vetting criteria)
- MSP `Social/05_INFLUENCER-MARKETING/PLAN.md` (partner profile requirements)
- MIR `Market_Audiences/03_MARKET/AUDIENCES.md` (ICP to match)
- Prospective partner handle/profile URL (provided by {{LEAD_AGENT}})

**Process:**
```
1. Load partner profile criteria from PLAN.md
2. For each prospective partner:
   a. Follower count + tier classification
   b. Engagement rate calculation (last 10 posts)
   c. Audience demographic match (visible signals — location, language, niche)
   d. Content style alignment with MIR VISUAL-GUIDELINES.md
   e. Disclosure compliance: do past sponsored posts have proper tags?
   f. Competitor check: promoted competitors in last 90 days?
   g. Controversy scan: "[handle]" + controversy/complaint
   h. Content quality: does it match ICP-1 consumption patterns?
3. Score against vetting checklist (TIER-FRAMEWORK.md)
4. Produce partner profile card
5. Add to PARTNER-ROSTER.md prospecting pipeline
```

**Outputs:**
```
PARTNER VETTING PROFILE — [@handle] — [Platform]

Tier         : [Nano / Micro / Macro]
Followers    : [N] | Engagement Rate: [X]%
ICP Match    : [HIGH / MEDIUM / LOW]
Content Style: [Aligns / Partial / Misaligned]
Disclosure   : [Compliant / Issues found]
Competitor   : [Clean / Flag: promoted [competitor] on [date]]
Controversy  : [Clear / Flag: [summary]]
Overall Score: [N/10]
Recommendation: [PROCEED TO OUTREACH / MONITOR / DO NOT ENGAGE]

Notes: [FILL]
```

**Handoff to {{LEAD_AGENT}}:**
- {{LEAD_AGENT}} reviews profiles before any outreach
- {{LEAD_AGENT}} conducts all outreach and negotiations

---

## AG-O06 — Partnership Scout

```yaml
id          : AG-O06
name        : Partnership Scout
layer       : 6 — Operations
purpose     : Identify and profile potential strategic co-marketing partners and
              referral sources that serve the same ICP without competing directly.
trigger     : Partnerships PLAN.md activated OR quarterly partner pipeline review
frequency   : Quarterly
```

**Inputs:**
- MIR `Market_Audiences/03_MARKET/AUDIENCES.md` (ICP-1 definition)
- MSP `Social/10_PARTNERSHIPS-AFFILIATES/PLAN.md` (partner profile requirements)
- MSP `Social/10_PARTNERSHIPS-AFFILIATES/STRATEGIC-PARTNERS.md` (existing partners — avoid duplication)
- MIR `Market_Audiences/03_MARKET/COMPETITIVE-LANDSCAPE.md` (who NOT to partner with)
- Web search for adjacent service providers in the same ICP space

**Process:**
```
1. Load ICP-1 from AUDIENCES.md — what other services do they buy?
2. Identify adjacent service categories (non-competing, same buyer):
   e.g. If ICP = e-commerce operators → adjacent: logistics, warehousing,
   e-commerce platforms, accounting, legal, inventory software
3. For each adjacent category: search for 5 providers serving this ICP
4. For each candidate:
   a. Audience overlap assessment (do they publicly serve ICP-1?)
   b. Content quality check (do they produce helpful content?)
   c. Company size / legitimacy check
   d. Competitive overlap check (MIR COMPETITIVE-LANDSCAPE.md)
   e. Existing partnership with a competitor?
5. Score: ICP overlap + non-competitive + content quality + reachability
6. Produce top 5 partnership candidates per category
7. Add to STRATEGIC-PARTNERS.md prospecting pipeline
```

**Outputs:**
```
PARTNERSHIP SCOUT REPORT — Q[N] [YYYY]

Category: [Adjacent service category]

Top 5 Candidates:
  1. [Company] — [Website] — Overlap: HIGH — Notes: [FILL]
  2. [Company] — [Website] — Overlap: HIGH — Notes: [FILL]
  3. [Company] — [Website] — Overlap: MEDIUM — Notes: [FILL]

Recommended outreach priority: [Company 1 and 2]
Suggested first contact approach: [FILL per PLAN.md guidelines]
```

**Handoff to {{LEAD_AGENT}}:**
- {{LEAD_AGENT}} reviews candidates before any outreach
- {{LEAD_AGENT}} conducts all partnership conversations

---

---

# AGENT INTERACTION MAP

```
ESTEBAN INPUT
      │
      ▼
[AG-F02: Context Loader] ─────────────────────────── RUNS FIRST, EVERY SESSION
      │
      ├──► [AG-F03: Gap Auditor] ────────────────────── WEEKLY HEALTH CHECK
      │
      ▼
[AG-S01: Campaign Architect] ◄── [AG-I01: Audience Intelligence]
      │                       ◄── [AG-I02: Competitive Monitor]
      │                       ◄── [AG-I03: Market Signal Scanner]
      │
      ├──► [AG-C01: Creative Brief] ───────────────────► DESIGNER
      ├──► [AG-C02: Copy Drafter] ─────────────────────► ESTEBAN REVIEW
      ├──► [AG-T01: Tracking Specifier] ──────────────► VIBE CODE BUILD
      ├──► [AG-T02: Automation Architect] ─────────────► n8n/MAKE BUILD
      ├──► [AG-T03: Landing Page Specifier] ───────────► VIBE CODE BUILD
      └──► [AG-T04: UTM Architect] ────────────────────► AD PLATFORM SETUP
                                                               │
                                                         CAMPAIGN LIVE
                                                               │
                        ┌──────────────────────────────────────┤
                        │                                      │
              [AG-A01: Performance Monitor]    [AG-O01: Lead Scorer]
              [AG-A02: Funnel Analyst]         [AG-O04: Crisis Monitor]
              [AG-A03: Report Compiler]        [AG-S03: Budget Pacing]
              [AG-A04: CRO Hypotheses]
                        │
                        ▼
               ESTEBAN REVIEWS → APPROVES → OPTIMIZES
```

---

# AGENT ACTIVATION GATES

| Gate | Condition | Agents Unlocked |
|------|-----------|----------------|
| Pre-Gate 1 | Any time | AG-F01, AG-F02, AG-F03, AG-I01, AG-I02, AG-I03 |
| Gate 1 GREEN | MIR identity files complete | AG-S01, AG-S02, AG-C01, AG-C02, AG-C03, AG-C04, AG-O06 |
| Gate 2 GREEN | MIR execution files complete | AG-T01, AG-T02, AG-T03, AG-T04, AG-S03 |
| Campaign LIVE | Active campaign in `Campaigns_Assets/08_CAMPAIGNS/ACTIVE/` | AG-A01, AG-A02, AG-A03, AG-A04, AG-O01, AG-O04 |
| MSP Discipline ACTIVE | Discipline PLAN.md status = ACTIVE | AG-O02 (email), AG-O03 (SEO), AG-O05 (influencer), AG-O06 (partnerships) |

---

# WHAT ESTEBAN ALWAYS OWNS

> This is the non-negotiable human layer. No agent takes these over.

| Decision | Why It Stays With {{LEAD_AGENT}} |
|----------|--------------------------|
| Strategic direction | Judgment, not pattern matching |
| Final content approval | Voice, brand, legal responsibility |
| Client communication | Relationship, trust, accountability |
| Budget decisions (>10%) | Financial authority |
| Campaign activation | "Go live" is irreversible |
| Contract and pricing negotiations | Legal and commercial |
| Crisis response execution | Reputation, speed, nuance |
| Hiring and vendor selection | Relationship and judgment |
| MIR/MSP strategic updates | Only {{LEAD_AGENT}} can `verify` a file |
| Discovery calls and sales | Closing is human |

---

*Agent Roster v1.0 — esteban.marketing*
*22 agents across 7 layers*
*Maintained in the get-shit-done repo alongside MIR-TEMPLATE and MSP-TEMPLATE*
