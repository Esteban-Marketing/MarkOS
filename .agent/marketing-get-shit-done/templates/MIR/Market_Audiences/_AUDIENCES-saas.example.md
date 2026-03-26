# AUDIENCES.md — Ideal Customer Profiles, Personas & Segments
# Reference Example: **SaaS** (Developer Observability Platform)

<!-- mgsd-token: MIR | model: SaaS -->
> [!NOTE] This is a completed example for a SaaS business. Use this as a quality and depth benchmark.

---

## 1. Primary Audience Segments

* **Platform Engineering Teams (Primary Buyer — Technical Evaluator):** Senior engineers and Engineering Managers at software companies (50–2,000 engineers) who own the observability and monitoring stack. They run the POC, control the technical evaluation, and hold a de facto veto over the purchase. They are reached via developer communities and content.
* **VP/Director of Engineering (Economic Buyer):** They approve the budget ($50K–$500K/yr contract range) and care about P&L impact. They do not read documentation — they read case studies and speak to peers. Condition for purchase: the technical team has endorsed it.
* **Site Reliability Engineers (Daily Users):** The on-call engineers who live inside the dashboards during incidents. Their daily frustration is the most acute problem to solve. If they love the product, they become internal champions and the renewal is guaranteed.

## 2. Advanced Psychographics & Neuromarketing Profile

* **Core Desires/Fears:**
  * Desire (Technical): To finally have a single pane of glass — no more tab-switching between 5 tools during a P0 incident at 2am.
  * Desire (Economic): Reduce MTTR (mean time to resolution) by a measurable percentage they can show the board.
  * Fear (Technical): Vendor lock-in. They've been burned by proprietary query languages and data export restrictions. They want OpenTelemetry-native or nothing.
  * Fear (Economic): Paying for a platform that the engineering team won't adopt. Tool graveyard is a budget killer.
* **Neuromarketing Triggers:**
  * *Primary Archetype to Target:* **The Sage** — Engineers respect expertise, precision, and honest documentation. The brand must demonstrate technical depth at every touchpoint.
  * *Effective Cognitive Biases:* Authority (written by engineers, for engineers), Social Proof (logos of engineering-respected companies: Stripe, Shopify, Notion), Loss Aversion ("every minute of MTTR costs you $X"), Transparency (open pricing, no "contact sales for pricing" for the first 3 tiers).
* **Pain Points & Frustrations:**
  * Alert fatigue: current tool fires 400 alerts a week; 380 are noise. Engineers have tuned out.
  * Data silos: metrics live in one tool, logs in another, traces in a third — correlation is manual.
  * Query performance: the current tool can't query 90-day historical data without slow, expensive exports.
  * Pricing opacity: usage-based billing with no predictability creates budget anxiety.
* **Objections & Friction:**
  * "We already have Datadog / Grafana / New Relic — switching cost is too high."
  * "Our engineers don't want to learn another tool."
  * "We need to see it handle our data volume at scale before committing."
  * "The contract length is too long — we want month-to-month until we've validated ROI."

## 3. Lexicon & Behavioral Patterns

* **Language/Vocabulary:** "MTTR," "P0/P1 incidents," "SLO/SLI/SLA," "cardinality," "distributed tracing," "OpenTelemetry," "OTEL," "PromQL," "APM," "log aggregation," "alert fatigue," "on-call rotation," "runbook," "postmortem," "incident retrospective."
* **Channel Consumption:** Hacker News (product launches, technical criticism), GitHub (checking open-source integrations and stars), Dev.to / engineering blogs (deep technical content), SRE Slack communities and Discord servers, PagerDuty ecosystem events, KubeCon / re:Invent for enterprise deals.
* **Buying Triggers:** A major production incident that exposed monitoring blind spots; a post-mortem that revealed the current tool missed the anomaly; engineering headcount growing beyond what the current tool can handle cost-effectively; a competitor migration that gets mentioned in a peer Slack.

## 4. Regulation & Compliance Restraints

* **Compliance Checks Required:** SOC 2 Type II (non-negotiable for enterprise), GDPR for telemetry data that may include PII, HIPAA BAA required for healthcare customers, FedRAMP for US government contracts. Security review is a procurement gate at all enterprise deals.

## 5. Live Vectorized Sentiment (Chroma DB Integration)

* **Vector DB Target:** `chromadb://collections/mgsd-audience-sentiment`
* **Latest Trending Grievances:** (Injected dynamically per query by `mgsd-strategist` reading the DB).
* **High-Volatility Topics:** (Keywords currently accelerating in market chatboards).
