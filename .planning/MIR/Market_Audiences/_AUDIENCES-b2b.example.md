# AUDIENCES.md — Ideal Customer Profiles, Personas & Segments
# Reference Example: **B2B** (HR Technology Company)

<!-- mgsd-token: MIR | model: B2B -->
> [!NOTE] This is a completed example for a B2B business. Use this as a quality and depth benchmark.

---

## 1. Primary Audience Segments

* **HR Leaders at Mid-Market Enterprises (500–5,000 employees):** HR Directors and VPs of People Operations at companies scaling their workforce. They own hiring, onboarding, and compliance. Budget authority is shared with the CFO for tools above $50K/year.
* **Talent Acquisition Teams:** Recruiters and Talent Acquisition Managers who use the platform daily. They are the product champions — their endorsement is required before the economic buyer signs.
* **IT/Security Gatekeepers:** Enterprise IT security teams who must approve any SaaS tool accessing employee data (GDPR, SOC 2 compliance check required).

## 2. Advanced Psychographics & Neuromarketing Profile

* **Core Desires/Fears:**
  * Desire: To be seen as a strategic business partner — not just "admin." They want to prove HR's ROI to the C-suite.
  * Fear: Making a buying decision that fails to get adoption. A failed software rollout is career-limiting.
* **Neuromarketing Triggers:**
  * *Primary Archetype to Target:* **The Ruler** — They want control, order, and predictability in their function.
  * *Effective Cognitive Biases:* Social Proof (peer HR leaders using the tool), Loss Aversion ("your competitors have modernized — you're falling behind"), Authority (analyst reports, certifications).
* **Pain Points & Frustrations:**
  * Hiring velocity doesn't match business growth — 60+ day time-to-hire is the norm.
  * Spreadsheet-based onboarding creates compliance risk and terrible new-hire experiences.
  * Reporting to leadership requires hours of manual data assembly; no real-time dashboard exists.
* **Objections & Friction:**
  * "We already have an ATS — we don't need another tool."
  * "Our IT team won't approve another vendor without a 6-month security review."
  * "We can't get buy-in from the executive team without proving ROI first."

## 3. Lexicon & Behavioral Patterns

* **Language/Vocabulary:** "People ops," "HRIS integration," "time-to-hire," "headcount planning," "employer brand," "candidate experience," "attrition rate," "workforce analytics," "EEO compliance."
* **Channel Consumption:** LinkedIn (primary for both content and peer validation), SHRM community forums, HR Tech Conference, Gartner Peer Insights for vendor reviews, email newsletters (HR Brew, People Managing People).
* **Buying Triggers:** Board-approved headcount plan for Q1; a compliance incident that exposed process gaps; a key competitor being seen as an "employer of choice" due to better candidate experience; a painful failed hire at the executive level.

## 4. Regulation & Compliance Restraints

* **Compliance Checks Required:** GDPR (for EU employee data), EEOC reporting requirements, SOC 2 Type II certification is a non-negotiable procurement requirement, HIPAA awareness for health benefit integrations.

## 5. Live Vectorized Sentiment (Chroma DB Integration)

* **Vector DB Target:** `chromadb://collections/mgsd-audience-sentiment`
* **Latest Trending Grievances:** (Injected dynamically per query by `mgsd-strategist` reading the DB).
* **High-Volatility Topics:** (Keywords currently accelerating in market chatboards).