# IT & Technology — Lifecycle & Email Industry Overlay Prompts

> **Context:** IT email lifecycle aligns to the technical buying cycle — long research phases, multi-stakeholder sign-off, and security review gates before procurement. The most effective IT email sequences are technically substantive: proof of integration compatibility, security documentation delivery, ROI calculation support, and renewal business case building. Promotional or feature-announcement email performs poorly with technical audiences; credibility-building and problem-solving content performs well.

## Prompts

### 1. Technical Onboarding Sequence (New Customer / Trial User)

Write a 4-email technical onboarding sequence for an [IT vendor / SaaS platform] starting when a new customer or trial user activates.

Email 1 — Activation confirmation + first value step (send: immediately on activation):
- Subject: "[Product] activated — your first configuration step"
- Body: Confirm activation; immediate first-value action — specific and achievable in < 30 minutes: "To see [specific outcome], connect [integration / configure setting X]. Here's the 3-step setup: [numbered steps with exact UI paths]"; link to documentation for each step; named technical contact if enterprise: "Your dedicated [solutions engineer / customer success engineer] is [Name] — [email] / [calendar link]." No feature list, no marketing language.

Email 2 — Integration and stack connection (send: day 3 if integration not yet completed):
- Subject: "Connecting [Product] to your [tech stack] — what most teams set up in week 1"
- Body: The 3 integrations that unlock the most value for [company profile or use case]; for each: what it connects, what it enables, link to specific integration documentation; one-paragraph note on authentication requirements (SSO, API key, OAuth); CTA: "If you hit a configuration issue, our [#slack-channel / support ticket system / solutions engineer] responds within [SLA]."

Email 3 — Security and compliance package delivery (send: day 7):
- Subject: "Your [Product] security documentation — for your IT and compliance team"
- Body: Proactive delivery of security documentation without requiring the customer to ask: SOC2 report request link, penetration test summary access, security questionnaire pre-fill template, data processing agreement; 1-sentence framing: "IT buyers are often asked for this documentation by security and procurement — we've made it available before you're asked."; CTA: "Request the full security pack" → documentation request form

Email 4 — First-month check-in + success metric review (send: day 21–28):
- Subject: "30 days with [Product] — where you are vs. where you could be"
- Body: Summary of what has been configured and activated (if product usage data allows — specific); the gap analysis: what's configured vs. what most similar organizations have active; the value they're currently realizing vs. the full-deployment benchmark; CTA: "Schedule a technical review" → calendar link to solutions engineer or CSM; or "See the full deployment checklist" → documentation

---

### 2. Proof-Point Nurture Sequence (Trial-to-Paid / Evaluation Stage)

Write a 4-email nurture sequence for an [IT vendor] supporting a technical evaluation or trial that has not yet converted to paid.

Email 1 — Technical case study delivery, matched to their use case (send: day 7 of trial):
- Subject: "How [anonymized: 'a 2,000-seat enterprise in financial services'] deployed [Product] in [timeframe]"
- Body: 200-word case study matched to the prospect's industry, use case, or stack; specific technical detail — how they integrated, what configuration they used, what technical problem was solved; outcome metrics specific and attributed; CTA: "Read the full technical case study" → case study page; secondary: "Is your use case similar? Talk to the implementation team" → pre-sales engineer calendar

Email 2 — Security and compliance validation (send: day 14 of trial):
- Subject: "The security questions your IT / compliance team will ask — answered"
- Body: The 5 most common security questions that arise during IT procurement evaluation — answered briefly and directly in the email body; reference to full security documentation pack (link); offer to provide additional documentation in a specific format: "If your organization uses a vendor security questionnaire, we have a pre-filled version available — saves your team [estimated hours] of back-and-forth."; CTA: "Request pre-filled security questionnaire" → documentation form

Email 3 — ROI and business case support (send: day 21 of trial):
- Subject: "The numbers your finance team will need for the [Product] approval"
- Body: Business case framework — what finance and exec approval typically requires for a purchase at this price point; provide the 3-year TCO model with their company size pre-populated if trial data allows; link to ROI calculator tool; offer: "Our solutions team can help you build a customized business case for your approval process — if that's useful, here's the calendar link." No pressure, no deadline.

Email 4 — Trial end + conversion decision support (send: 3 days before trial expiry):
- Subject: "Your [Product] trial ends on [date] — what happens next"
- Body: Clear statement of what happens at trial expiry (data retained for [X] days, no automatic charges); 3 conversion options stated plainly (upgrade path, extended trial option if available, migration path); single CTA: "Continue with [Product]" → upgrade flow; secondary: "Talk to the team before deciding" → 20-minute calendar slot with solutions engineer; no manufactured urgency — technical buyers distrust it

---

### 3. Renewal and Expansion Sequence

Write a 3-email renewal and expansion sequence for an [IT vendor], targeting customers approaching their annual renewal.

Email 1 — Renewal preview + usage summary (send: 90 days before renewal):
- Subject: "[Customer Company] renewal preview — your [Product] usage review"
- Body: Usage summary for the renewal period (specific metrics: active users, data volume processed, integrations active, incident response events if relevant to product); value realized vs. benchmark for similar deployments; renewal date, current terms, and options for renewal; CTA: "Schedule your renewal review" → CSM or account manager calendar; no urgency language at 90 days — this is a relationship touchpoint

Email 2 — Expansion opportunity and ROI summary (send: 60 days before renewal):
- Subject: "Your [Product] renewal + one expansion opportunity worth reviewing"
- Body: Confirm renewal terms from previous email; surface one specific expansion opportunity relevant to their observed usage: additional seats, higher tier for compliance features they're almost hitting limits on, or adjacent module that would complete a workflow gap; present the expansion ROI simply: what it costs vs. what it's designed to solve; CTA: "See the expansion options" → upgrade comparison page; make it easy to say no: "If the current tier is right for your needs, here's the standard renewal link."

Email 3 — Renewal action reminder (send: 14 days before renewal):
- Subject: "Action needed: [Customer Company] renewal on [date]"
- Body: Simple, transactional: renewal date, terms, and single renewal CTA; if expansion was discussed: brief note on whether that decision is needed at renewal or can be added mid-cycle; emergency escalation contact if there are procurement or approval issues that could delay renewal; no marketing content in this email — it is operational

---

### 4. Executive ROI Summary (Quarterly or Annual Report to Exec Stakeholders)

Write an executive ROI summary email template for an [IT vendor] to send to non-technical executive stakeholders (CFO, CEO, COO) at a customer organization.

Email structure (sent by CSM or account manager, not marketing automation):
- Subject: "[Customer Company] — [Product] value report: Q[N] / [Year]"
- Body structure:
  - **Business outcome summary (3 metrics):** The 3 KPIs most relevant to executive stakeholders for this product category — examples: incidents prevented, engineer hours recovered, compliance audit findings resolved, uptime percentage; present as: [Metric]: [Value achieved] vs. [Baseline/Target]
  - **Cost efficiency summary:** License cost vs. cost of the problems solved or risks mitigated; present the ROI formula specifically for this customer's usage; reference the TCO model agreed at purchase if available
  - **Operational summary:** What the product is doing operationally — stated in plain English, not technical jargon; the executive should understand what they're paying for without needing to understand the architecture
  - **Renewal or expansion note (1 sentence only):** If renewal is approaching, note it; if there is a relevant expansion opportunity, name it in one sentence; no detailed pitch in an exec ROI summary
  - **Team contact:** Named CSM/account manager with direct contact; invitation to brief the executive team in [15/30 minutes] if they have questions
- Tone: Confident, precise, non-promotional. This email is a value demonstration, not a sales document. The executive should forward it to their IT lead as confirmation that the spend is justified.
