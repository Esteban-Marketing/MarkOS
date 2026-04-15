# IT & Technology — Content & SEO Industry Overlay Prompts

> **Context:** IT content SEO serves buyers at different stages of a technical research cycle. Comparison guides and vendor evaluations target buyers in active shortlisting; ROI and TCO content targets buyers building internal business cases; security and compliance content is often a purchase prerequisite that gets shared internally with security teams; use-case deep dives target buyers who know the category but need to understand fit for their specific architecture. Technical depth is a content quality signal in this vertical — surface-level content is identified quickly and dismissed.

## Prompts

### 1. Technical Comparison Guide ("[Product] vs [Competitor]" or "Best [Solution Category]")

Write a technical comparison guide for a [IT vendor] targeting buyers evaluating [solution category] options, including comparison with named competitors.

Guide structure:
- **H1:** "[Solution Category]: [Product A] vs [Product B] vs [Product C] — A Technical Comparison for [Year]"
- **Intro (100 words):** Establish why this comparison is useful — what dimensions matter for [company type/size], and why the wrong choice has specific technical or financial consequences; author voice: written by a practitioner, not a marketing team
- **Evaluation framework (6–8 dimensions, 80 words each):**
  - Architecture and scalability: How each product handles [scale: users, data volume, transaction rate]; where each breaks down
  - Integration depth: Native integrations with [common stack components]; API quality (REST, GraphQL, webhooks, rate limits); custom integration effort estimate
  - Security posture: Certifications held by each (SOC2 Type II, ISO 27001, FedRAMP, HIPAA, GDPR compliance attestation); data residency options; penetration test frequency
  - Total Cost of Ownership (TCO): License model + implementation cost + internal resource cost + ongoing maintenance; actual 3-year TCO comparison at [target company size]
  - Implementation and migration: Time to production-ready deployment; migration support quality; professional services model
  - Vendor support and roadmap: Support SLA tiers; roadmap transparency; community health (if open-source or community tier exists)
- **Comparison table:** All products × all dimensions — include dimensions where competitors win; credible comparisons include honest assessments
- **"Which is right for you?" decision matrix:** 3–4 buyer profiles with a clear recommendation per profile; avoid hedging into "it depends" without specifics

---

### 2. ROI and TCO Calculator Content

Write an ROI and TCO content piece for a [IT vendor], targeting buyers needing to justify a technology purchase to finance and executive stakeholders.

Content structure:
- **H1:** "The True Cost of [Current Approach / Legacy System]: An ROI and TCO Framework for [Solution Category]"
- **Why this content exists (70 words):** IT buyers know the direct cost of a solution; they often struggle to quantify the cost of the problem it solves — especially hidden costs (engineer time, incident response, compliance risk exposure). This piece provides the methodology.
- **The hidden cost model (4–6 cost categories, 100 words each):**
  - Direct cost of the current approach: License fees, infrastructure, support contracts
  - Engineer time cost: Hours per month spent managing/patching/firefighting the current system × burdened hourly rate × 12; provide the calculation formula
  - Risk cost (security/compliance): Probability × impact for the primary risk exposure; reference industry breach cost averages (e.g., IBM/Ponemon data) scoped to company size
  - Opportunity cost: What engineer time could be doing instead; business velocity impact of [specific constraint current system imposes]
  - Integration/maintenance drag: How much custom code or integration maintenance the current system requires; technical debt accumulation rate
- **ROI calculation framework:**
  - Year 1: Implementation cost + license cost vs. [cost categories above reduced or eliminated]
  - Year 2–3: Ongoing license vs. ongoing savings/avoidance
  - Total 3-year NPV at [discount rate] with formula visible
- **Interactive calculator (if page supports it):** Input fields for company-specific variables; output: 3-year ROI, payback period, monthly savings breakdown
- **CTA:** "Get a customized TCO analysis for your environment" → scoping form or calculator tool

---

### 3. Security and Compliance Overview Content

Write a security and compliance documentation page or content piece for a [IT vendor / SaaS product], targeting buyers with security review requirements.

Content structure:
- **H1:** "[Product Name] Security and Compliance: Architecture, Certifications, and Data Protection Overview"
- **Purpose of this page (50 words):** This page is written for security teams, IT procurement specialists, and compliance officers evaluating [Product] for deployment in [regulated] environments. It is updated [quarterly/annually] and last reviewed [date].
- **Certifications and attestations (specific, cited):**
  - List each certification with: (1) full name of the certification, (2) scope of the certification (all products, specific modules, specific geographies), (3) audit frequency, (4) availability of audit report or SOC report to qualified prospects (include request process)
  - Do not list certifications in progress as achieved; do not overstate scope
- **Security architecture overview:**
  - Data at rest: Encryption standard, key management approach, customer-managed keys option (if available)
  - Data in transit: Transport encryption standards, mutual TLS (if applicable)
  - Data residency: Available regions, data domicile options, cross-border transfer compliance (SCCs, BCRs for EU)
  - Access control: SSO integration (SAML/OIDC), MFA enforcement, RBAC model, privileged access management
  - Infrastructure: Where hosted (cloud provider + regions), shared vs. dedicated tenant model
- **Incident response and disclosure:**
  - SLA for breach notification (to customers, to regulators): Specific timeframe in hours
  - Incident response process summary: Who is responsible, what customers receive and when
- **Penetration testing:** Frequency, scope, external auditor name (if publicly disclosable), output available to customers (executive summary or full report upon NDA)
- **Shared responsibility model:** What the vendor secures; what the customer is responsible for — specific and clear
- **CTA:** "Request our security documentation pack" → form for SOC2 report, penetration test summary, questionnaire response template

---

### 4. IT Use-Case Deep Dive (Architecture and Implementation Guide)

Write an IT use-case deep dive article for a [IT vendor] targeting buyers who understand the solution category but need to evaluate fit for their specific architecture or use case.

Article structure:
- **H1:** "How [Company Type / Stack Configuration] [Deploys / Implements / Integrates] [Product]: A Technical Deep Dive"
- **Target reader (50 words):** This guide is for [IT Director / infrastructure engineer / security architect] at [company type] who has evaluated [product category] solutions and wants to understand [specific deployment pattern] in detail.
- **Architecture context:**
  - What the architecture looks like before: Diagram or description of the common pre-implementation state
  - How [Product] fits: Where it sits in the architecture, what it replaces or augments, what it connects to
  - What the architecture looks like after: Post-implementation state with key integration points called out
- **Implementation walkthrough (step-by-step, technical depth appropriate to the audience):**
  - Pre-implementation prerequisites: Required system versions, permissions, network configuration
  - Implementation phases: Named phases with estimated engineer hours per phase; dependencies noted
  - Integration steps: For each key integration — what the connection requires, what data flows, what authentication model
  - Testing and validation: What to test before production cutover; rollback procedure
- **Common implementation challenges (candid):** 3 specific technical obstacles that arise during this implementation pattern; how to resolve or mitigate each; this is a major credibility signal — vendors who hide implementation complexity lose trust when it surfaces post-sale
- **Performance and scale validation:** What performance looks like at [benchmark scale]; how to monitor post-deployment; alert thresholds
- **CTA:** "Talk to our technical implementation team" → form or calendar link to pre-sales engineer (not just a generic demo form)
