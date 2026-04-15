# IT & Technology — Landing Pages Industry Overlay Prompts

> **Context:** IT landing pages must earn trust before they ask for action. The conversion journey for IT buyers is longer than most B2B sectors — technical validation, security review, and procurement approval all sit between "landing page visit" and "closed deal." Page architecture should serve that journey: make technical depth accessible early, reduce the perceived risk of the evaluation step being requested, and match the CTA to the actual stage of the buyer — not the stage the vendor wants them to be in.

## Prompts

### 1. Technical Solution Overview Page

Write the full copy for a technical solution overview landing page for an [IT vendor / SaaS platform] targeting [CISO / IT Director / VP Engineering].

Page sections and copy requirements:

**Above the fold:**
- H1: "[Product]: [Technical differentiator statement] for [Company type or stack environment]" — no adjectives (no "powerful," "seamless," "best-in-class"); the differentiator must be a factual, verifiable claim
- Subheader (1 sentence): The specific problem this product solves, stated in technical terms the target job role uses daily
- Trust signals immediately below fold: 3 certification badges (SOC2 Type II, ISO 27001, relevant industry certifications) + [N] enterprise customers deployed + average deployment time (if it's a competitive advantage)
- Primary CTA: "Request a technical assessment" or "Start your evaluation" — not "Get a demo" if the audience is technical; engineer-to-engineer framing converts better than sales-demo framing

**How it works section:**
- Architecture diagram or data flow diagram (described for design team): "[Diagram showing where Product sits in the environment — what it connects to, what data flows through it, what outputs it produces]"
- 3-paragraph technical description: integration points, data handling model, deployment options (cloud / on-premise / hybrid)
- "What it replaces vs. what it augments" — specific: "Organizations typically deploy [Product] alongside [common existing tools] — it replaces [X] and integrates with [Y] rather than requiring removal of existing infrastructure"

**Security and compliance posture section:**
- Certifications listed with scope notes — not just logos: "[SOC2 Type II] — covers [specific systems in scope], audited annually by [firm name if public]"
- Data residency options: where data is stored, policy on data processing location for regulated industries
- Encryption model: at rest and in transit standards
- Access control model: SSO support, RBAC, MFA enforcement options
- "Request security documentation" link — to documentation request form, not a sales form

**Integration ecosystem section:**
- Organize by category: SIEM, ITSM, identity providers, cloud platforms, DevOps toolchain
- For each featured integration: connection type (native connector / API / webhook), what data flows, typical setup time
- "See all [N] integrations" → full integration documentation index

**Social proof section:**
- 2–3 customer references from same industry vertical if possible; if not, same company size tier
- Quote format: technical outcome statement + attribution (name, role, company type — exact company if approved, anonymized if not)
- Logo bar of recognized logos only — logos of unknown companies provide negative social proof in IT

**Primary CTA section (bottom):**
- "Start your technical evaluation" → form with technical qualification fields (stack, team size, primary use case, current approach)
- Secondary: "Talk to a solutions engineer" → 30-minute calendar slot

---

### 2. POC and Trial Offer Page

Write the full copy for a POC (proof-of-concept) or trial offer landing page for an [IT vendor], designed to convert technical evaluators who have engaged with content but not yet started an evaluation.

Page sections and copy requirements:

**Above the fold:**
- H1: "Start Your [N]-Week [Product] POC — Scoped for [Company Type / Stack Environment]"
- Subheader: What the POC proves — the specific technical question it answers: "At the end of [N] weeks, you'll know whether [Product] can [specific outcome] in your environment."
- Trust signal: "[N] enterprise POCs completed" or "Average POC-to-deployment conversion: [%]" — if factual data exists; if not, reference customer milestone ("Companies like [customer type] typically see [outcome] within [POC timeframe]")
- Primary CTA: "Configure your POC" → form with prerequisite fields

**What the POC includes section:**
- Specific deliverables (not vague): "Integration of [Product] with [named tech category]; configuration of [specific feature set]; security assessment report for your environment; performance benchmarks on your data volume"
- Named support model: "You'll be assigned a [solutions engineer / implementation engineer] for the full POC duration — [hours/week] of dedicated support, access to async channel, documented handoff at POC close"
- What is NOT included — being explicit about scope prevents disappointment: "[Feature X] is available in [tier] and is not included in the standard POC — if it's required for your evaluation, note it in the configuration form"

**What you'll need to provide:**
- Technical prerequisites listed specifically — not vague: "Access to a [staging / production] environment, [API credentials for named integration], [engineer availability: estimated N hours/week]"
- Named contact requirement: "A technical contact (engineer or IT admin) who can manage the integration configuration — POC success depends on having a dedicated owner on your side"

**POC timeline:**
- Week-by-week milestone schedule: "Week 1 — environment setup and integration; Week 2 — configuration of [primary use case]; Week 3 — evaluation of [specific capability]; Week [N] — POC review session with solutions engineer and output report delivery"

**Success criteria (pre-defined):**
- "You'll know the POC succeeded when: [specific metric — e.g., '[Product] processes [event/data type] within [latency threshold]' or 'Security team can confirm [specific compliance requirement] is met']"
- "If the POC doesn't meet these criteria, you'll receive a written summary of what prevented achievement and what would need to change — in your environment or in our product."

**CTA section:**
- "Configure your POC" → form with fields: company, team size, current tools in the relevant category, primary evaluation question, technical prerequisites availability, desired start window
- Secondary: "Download the POC guide first" → PDF one-pager with POC scope, timeline, and FAQ — reduces commitment threshold for early-stage evaluators

---

### 3. Integration Ecosystem Page

Write the full copy for an integration ecosystem landing page for an [IT vendor], targeting IT buyers for whom integration compatibility is a primary evaluation criterion.

Page sections and copy requirements:

**Above the fold:**
- H1: "[Product] Integrations: [N]+ Native Connections for [Stack Environment / Use Case]"
- Subheader: The specific integration value proposition: "Connect [Product] to your existing [security stack / DevOps toolchain / ITSM workflow] without rebuilding your processes"
- Integration count and categories as visual trust signal: "[N] native integrations across [N] categories — SIEM, ITSM, identity, cloud, DevOps"
- CTA: "Browse all integrations" → anchor to integration catalog; secondary: "Request an integration not listed" → integration request form

**Integration catalog section:**
- Organize by functional category — IT buyers scan by category, not alphabetically:
  - SIEM (e.g., Splunk, Microsoft Sentinel, IBM QRadar) — for security operations context
  - ITSM (e.g., ServiceNow, Jira Service Management, PagerDuty) — for incident and change management
  - Identity and access management (e.g., Okta, Azure AD, Ping Identity)
  - Cloud platforms (e.g., AWS, Azure, GCP, multi-cloud)
  - DevOps / CI-CD (e.g., GitHub, GitLab, Jenkins)
  - [Additional categories relevant to specific product]
- For each featured integration, provide a structured card: Integration name + logo | Connection type: [Native connector / REST API / Webhook / SAML] | Data that flows: [specific — "alert events," "user identity data," "deployment events"] | Setup time: [realistic estimate] | Documentation: [link to implementation guide]

**Integration depth signals section:**
- "What 'native integration' means for [Product]" — technical specificity matters: "Our Splunk integration uses the [Splunk Add-on Builder] format and supports [HEC / REST API / Splunk .conf] configuration. Setup requires [prerequisites]. Data available in Splunk within [timeframe]."
- 1 integration depth example written out in technical detail — this is the proof that the integrations are real and maintained, not just listed

**Build your own integration section:**
- API reference documentation link — [Product] REST API, authentication model, rate limits, versioning policy
- Webhook documentation — event types available, payload format, retry behavior
- SDK availability — languages supported, repository links, documentation quality signal
- "We support [N] customer-built integrations" — if true, this is a strong credibility signal

**Integration support and maintenance section:**
- Integration version compatibility policy — what product versions are supported for each integration
- "Integration support SLA" — who to contact when an integration breaks, not if
- Integration roadmap: "Requested integrations not yet available" — a public roadmap section or a request form signals community responsiveness

---

### 4. ROI Calculator Landing Page

Write the full copy for an ROI calculator landing page for an [IT vendor], designed to help technical buyers build an internal business case for procurement approval.

Page sections and copy requirements:

**Above the fold:**
- H1: "Calculate Your [Product] ROI: Build Your Business Case in [N] Minutes"
- Subheader: Who this is for — "For IT leaders who need to present a quantified business case for [Product] to finance or exec stakeholders"
- Trust calibration before the calculator: "These estimates are based on [N] customer deployments and internal benchmark data. Results vary by environment — all calculations are editable and exportable for your specific context."
- Primary CTA: "Start the calculator" → anchor to calculator inputs

**Calculator inputs section:**
- Input fields should map directly to how IT buyers think about cost:
  - Company size / seat count — scales outputs correctly
  - Current approach: [manual process / legacy tool / named competitive product] — determines the "before" state
  - [Specific cost metric inputs relevant to the product category — e.g., for security: "Current cost of a security incident (estimate in hours of response)" or "Current FTE hours per week spent on [task the product automates"]
  - [Revenue or risk metric inputs if relevant — "Annual revenue at risk from [downtime / compliance failure / breach]"]
- Avoid over-engineering the input form — 5–7 inputs maximum for a calculator that gets completed; more complex models should be offered as "detailed analysis with a solutions engineer"

**Calculator output section:**
- 3-year NPV — the standard finance committee metric for infrastructure technology spend
- Payback period in months — the second most-used metric by finance teams evaluating IT spend
- Annual cost reduction or cost avoidance — stated in dollars, with the calculation shown (transparency in the methodology reduces procurement skepticism)
- Risk reduction quantification — where applicable: "At [N]% reduction in [incident type], this represents [dollar value] in avoided costs annually based on [industry benchmark or your input data]"
- "How we calculated this" — expandable methodology section: which benchmarks were used, what assumptions are built in, where the model may deviate from their specific environment

**Export and next steps section:**
- "Export your ROI report" → PDF generation with their inputs and outputs pre-populated — ready to share with finance or exec; branded as "[Your Company] ROI Analysis: [Customer Company Name] [Date]"
- Secondary export: Excel or CSV of underlying model for finance teams that prefer to work in their own models
- CTA after download: "Talk to a solutions engineer about your specific environment" → calendar link; framing: "Our solutions team can refine these estimates with your actual environment data — 30-minute session, no obligation."
- "How others in [industry] are using this analysis" → 1–2 customer case study snippets with ROI data as social proof
