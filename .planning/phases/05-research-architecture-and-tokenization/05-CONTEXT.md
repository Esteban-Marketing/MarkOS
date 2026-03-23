# Phase 5: Research Architecture & Tokenization — Context

**Gathered:** 2026-03-23
**Status:** Ready for planning
**Source:** discuss-phase session decisions

<domain>
## Phase Boundary

Create a dedicated `RESEARCH/` directory system (peer to `MIR/` and `MSP/`) with 6 canonical tokenized research file templates. Each template feeds specific MIR/MSP fields via explicit token cross-references. Auto-trigger research generation via `mgsd-new-project`. Create the `mgsd-researcher` agent.
</domain>

<decisions>
## Implementation Decisions

### RESEARCH/ Directory Structure
- `RESEARCH/` lives at the **client project root**, peer to `MIR/` and `MSP/` — NOT nested inside either
- Contains only **post-processed, tokenized, insight-dense outputs** — raw notes/dumps are forbidden
- 6 canonical files: `AUDIENCE-RESEARCH.md`, `ORG-PROFILE.md`, `PRODUCT-RESEARCH.md`, `COMPETITIVE-INTEL.md`, `MARKET-TRENDS.md`, `CONTENT-AUDIT.md`
- A `RESEARCH/.gitignore` entry protects sensitive client research from accidental exposure

### Research File Template Schema
Each file MUST contain:
1. YAML frontmatter: `token_id`, `document_class: RESEARCH`, `version`, `status`, `feeds_into` (list of MIR/MSP tokens it populates)
2. Agent instruction block at top: `<!-- AGENT: Populate from onboarding-seed.json + direct research. Output: insight-dense processed analysis only. No raw notes. -->`
3. Sections with `<!-- FEEDS → [TOKEN_ID] -->` comments mapping to MIR/MSP fields
4. Quality gate line per section: `<!-- QUALITY: Evidence source + confidence (High/Med/Low) + strategic implication required -->`
5. Empty placeholder blocks clearly marked `[AGENT_POPULATE: description of what goes here]`

### Token Cross-Reference System (Bidirectional)
- RESEARCH files: section headers include `<!-- FEEDS → [MIR-TOKEN, MSP-TOKEN] -->`
- MIR/MSP templates: relevant fields gain `<!-- SOURCED_FROM → [RESEARCH-TOKEN] -->` comment
- This creates a navigable dependency graph for agents to follow
- Token IDs follow pattern: `MGSD-RES-{TYPE}-{NN}` (e.g. `MGSD-RES-AUD-01`)

### mgsd-researcher Agent
- New agent defined at: `.agent/marketing-get-shit-done/agents/mgsd-researcher.md`
- Role: reads `onboarding-seed.json` + raw client input → writes processed insights to RESEARCH/ files
- Research protocol: market sources → competitive → audience synthesis (in order)
- Output standard per insight: `{finding} | Source: {origin} | Confidence: {High/Med/Low} | Implication: {strategic consequence}`
- If no `onboarding-seed.json`: agent asks 5 seed questions per file before generating

### mgsd-new-project Integration
- After scaffold creates `MIR/`, `MSP/`, `.mgsd-local/`: auto-trigger `mgsd-researcher` for each RESEARCH/ file
- Generation sequence: ORG-PROFILE → PRODUCT-RESEARCH → AUDIENCE-RESEARCH → MARKET-TRENDS → COMPETITIVE-INTEL → CONTENT-AUDIT (order matters for context dependencies)

### Agent Discretion
- Exact research source weighting per file type
- Confidence scoring numerical scale
- Internal section ordering within templates
</decisions>

<canonical_refs>
## Canonical References

### Existing Templates
- `.agent/marketing-get-shit-done/templates/research/RESEARCH.md` — existing base template to extend
- `.agent/marketing-get-shit-done/templates/research/MARKET.md` — market research template
- `.agent/marketing-get-shit-done/templates/research/BENCHMARKS.md` — benchmarks template
- `.agent/marketing-get-shit-done/templates/MIR/` — all MIR subdirs (for adding SOURCED_FROM tokens)
- `.agent/marketing-get-shit-done/templates/MSP/` — all MSP discipline files (for adding SOURCED_FROM tokens)
- `.agent/marketing-get-shit-done/MGSD-INDEX.md` — master registry (register new RESEARCH tokens here)
- `.agent/marketing-get-shit-done/agents/` — existing agent definitions for pattern reference

### Requirements
- `.planning/REQUIREMENTS.md` — RES-01, RES-02 must be addressed
</canonical_refs>

<specifics>
## Specific File Targets

### 6 RESEARCH Template Files (in `.agent/marketing-get-shit-done/templates/RESEARCH/`):
1. `AUDIENCE-RESEARCH.md` — Feeds: MIR/Market_Audiences/. Covers: psychographics, behavioral triggers, segments, pain points, language/vocabulary patterns, channel preferences
2. `ORG-PROFILE.md` — Feeds: MIR/Core_Strategy/. Covers: org history, culture code, voice & tone baseline, differentiators, strategic goals, team structure, decision-making style
3. `PRODUCT-RESEARCH.md` — Feeds: MIR/Products/. Covers: feature inventory, benefits hierarchy, pricing architecture, use cases, objection library, proof points, comparison vs. alternatives
4. `COMPETITIVE-INTEL.md` — Feeds: MIR/Core_Strategy/DIFFERENTIATORS.md + MSP strategy files. Covers: competitor positioning matrix, messaging gap analysis, content angle opportunities, share-of-voice data
5. `MARKET-TRENDS.md` — Feeds: MSP discipline files. Covers: market size + trajectory, macro trends, seasonal patterns, regulatory landscape, emerging channels
6. `CONTENT-AUDIT.md` — Feeds: MIR/Campaigns_Assets/. Covers: existing content inventory (format, channel, date, performance), gap map, reusable asset list, top performers by type

### New Agent:
- `.agent/marketing-get-shit-done/agents/mgsd-researcher.md`
</specifics>

<deferred>
## Deferred Ideas
- Automated web scraping for competitive intel (Phase 7 tooling)
- Real-time trend API integration
- Research freshness expiry / auto-refresh triggers
</deferred>

---
*Phase: 05-research-architecture-and-tokenization*
*Context gathered: 2026-03-23 via discuss-phase session*
