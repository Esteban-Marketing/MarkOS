# Phase 6: Web-Based Client Onboarding Engine — Context

**Gathered:** 2026-03-23
**Status:** Ready for planning
**Source:** discuss-phase session decisions

<domain>
## Phase Boundary

Build a lightweight, white-labeled, step-by-step web onboarding form that collects all seed data needed to populate `RESEARCH/`, `MIR/`, and `MSP/` for a new client. Form output is a structured `onboarding-seed.json`. An orchestrator agent then reads this file and drives `mgsd-researcher` to generate all 6 RESEARCH files, then scaffolds derived MIR/MSP fields.
</domain>

<decisions>
## Implementation Decisions

### Technology Stack
- Pure HTML + Vanilla JS + CSS — zero dependencies, no build step required
- Single self-contained file (`onboarding.html`) OR a minimal multi-file folder (`onboarding/`)
- Served locally via Node.js `http.createServer` launched by `mgsd-new-project` CLI
- Opens automatically in the user's default browser on port 4242

### Form Structure (Multi-Step)
Step 1 — Company & Brand (ORG-PROFILE seed): Company name, industry, country, founding year, mission in 1 sentence, 3 brand values, tone of voice (selector: Formal/Balanced/Casual/Playful), primary language
Step 2 — Product / Service (PRODUCT-RESEARCH seed): Product/service name(s), category, primary benefit in 1 sentence, 3 top features, price range, main objection heard from prospects
Step 3 — Audience (AUDIENCE-RESEARCH seed): Primary customer segment name, age range, job title/role, top 3 pain points, where they spend time online, language/phrases they use
Step 4 — Competition (COMPETITIVE-INTEL seed): 3 main competitors (name + URL), your #1 differentiator vs. each, biggest gap you see in competitor messaging
Step 5 — Market Context (MARKET-TRENDS seed): Market maturity (Emerging/Growth/Mature/Declining), biggest macro trend affecting the business, top regulatory/compliance concern (if any)
Step 6 — Existing Content (CONTENT-AUDIT seed): Best performing piece of content (URL + why it worked), content channels currently active (checkboxes), estimated monthly content output

### Output Format
- On form submission: generate `onboarding-seed.json` saved to project root
- JSON schema with keys matching each RESEARCH file's seed requirements
- Include `metadata`: `{ "generated": ISO-date, "version": "1.0", "completeness_score": N/6 }`
- Download JSON automatically AND write to project root if CLI-server mode

### White-Label Configurability
- Config file: `onboarding-config.json` at project root
- Configurable: `logo_url`, `primary_color`, `company_name`, `form_title`, `completion_message`
- Default config ships with neutral MGSD branding

### UX Standards
- Progress bar showing current step / total steps
- Validation before allowing step advance (no empty required fields)
- "Save progress" button persists to localStorage
- Completion screen: green checkmark + "Your marketing intelligence is being generated..." message
- Mobile-responsive (used on tablets during in-person client sessions)

### Orchestrator Agent Integration
- After form submission, the `mgsd-onboarder` orchestrator reads `onboarding-seed.json`
- Drives `mgsd-researcher` in sequence: ORG → PRODUCT → AUDIENCE → MARKET → COMPETITIVE → CONTENT
- Each researcher call receives the relevant seed section as context
- Final step: scaffolds derived fields into MIR/ and MSP/ templates

### Agent Discretion
- Exact CSS design choices beyond brand colors and layout
- localStorage key naming
- Server port fallback logic if 4242 is occupied
</decisions>

<canonical_refs>
## Canonical References

### Phase 5 Artifacts (MUST be complete first)
- `.agent/marketing-get-shit-done/templates/RESEARCH/` — all 6 research templates (from Phase 5)
- `.agent/marketing-get-shit-done/agents/mgsd-researcher.md` — researcher agent (from Phase 5)
- `.planning/phases/05-research-architecture-and-tokenization/` — Phase 5 plans

### Existing Patterns
- `.agent/marketing-get-shit-done/bin/mgsd-tools.cjs` — existing CLI tool for patterns
- `.agent/marketing-get-shit-done/templates/MIR/SETUP.md` — scaffold reference
- `.agent/skills/mgsd-new-project/SKILL.md` — skill to update with onboarding trigger

### Requirements
- `.planning/REQUIREMENTS.md` — ONB-01, ONB-02 must be addressed
</canonical_refs>

<specifics>
## Specific Deliverables

### Web Onboarding App
- `onboarding/index.html` — full multi-step form UI
- `onboarding/onboarding.js` — form logic, validation, JSON generation
- `onboarding/onboarding.css` — premium step-by-step UI styling
- `onboarding/onboarding-config.json` — default white-label config

### CLI Server
- `bin/serve-onboarding.cjs` — Node.js HTTP server that serves the onboarding app locally

### Orchestrator Agent
- `.agent/marketing-get-shit-done/agents/mgsd-onboarder.md` — orchestrates seed → research → scaffold pipeline

### Schema File
- `onboarding/onboarding-seed.schema.json` — JSON schema for validation
</specifics>

<deferred>
## Deferred Ideas
- SaaS-hosted version of the onboarding form (post-v1)
- Multi-language form support
- CRM integration (e.g. HubSpot pre-fill)
</deferred>

---
*Phase: 06-web-based-client-onboarding-engine*
*Context gathered: 2026-03-23 via discuss-phase session*
