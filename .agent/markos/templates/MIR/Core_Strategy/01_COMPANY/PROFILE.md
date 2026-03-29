# PROFILE.md — Company & Identity Profile
<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.mgsd-local/MIR/Core_Strategy/01_COMPANY/PROFILE.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: This is the primary identity anchor for all marketing execution. `mgsd-strategist` MUST use this file to derive the `MESSAGE-HOUSE.md` and `AUDIENCES.md`. `mgsd-planner` MUST NOT approve any roadmap phase that contradicts Section 10 (What This Business Is NOT).

**Dependencies:** RESEARCH (`../../05_RESEARCH/ORG-PROFILE.md`), BRAND (`../02_BRAND/BRAND-VOICE.md`)
**Assigned Agent:** `mgsd-strategist`
**Linear Project Manager:** `mgsd-linear-manager`

```
file_purpose  : The single most-read file in this repository. A complete, structured
                declaration of who this business is. All marketing derives from this.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — primary source for all business identity facts
```

> **Instructions:** Fill every field. Use "N/A" only if a field genuinely does not apply. Use "UNKNOWN" if the answer exists but you don't have it yet. Never leave brackets unfilled.

---

## 1. Basic Identity

```yaml
legal_name              : "[Full legal business name]"
trading_name            : "[Name used in marketing — may differ from legal name]"
tagline                 : "[One-line descriptor — not a slogan, a factual description]"
business_type           : "[B2C | B2B | B2B2C | MARKETPLACE | OTHER]"
industry                : "[Primary industry category]"
sub_industry            : "[More specific category]"
founded_year            : YYYY
headquarters_location   : "[City, Country]"
operating_regions       : "[Countries or regions where the business actively operates]"
languages_of_operation  : "[Primary language(s) for marketing and customer communication]"
primary_currency        : "[USD | EUR | COP | MXN | etc.]"
company_stage           : "[PRE-REVENUE | EARLY | GROWTH | SCALE | MATURE]"
team_size               : "[Number of full-time employees or SOLO | MICRO (<10) | SMALL (<50) | MEDIUM | LARGE]"
```

---

## 2. What The Business Does

**In one sentence (use this when brevity is needed):**
[FILL — e.g. "We build custom automation systems that reduce manual data entry for e-commerce operations teams."]

**In one paragraph (use this for onboarding and context):**
[FILL — 3–5 sentences. What does the business do? For whom? How do they do it differently? What is the outcome for the customer?]

**Core mechanism (how value is actually delivered):**
[FILL — describe the delivery mechanism, not the marketing claim. e.g. "Client books a discovery call → we audit their ops stack → we build n8n flows → we deliver a handover doc and training session."]

---

## 3. Business Model

```yaml
revenue_model         : "[SERVICE_FEES | SUBSCRIPTIONS | PRODUCT_SALES | LICENSING | 
                          PERFORMANCE | COMMISSION | HYBRID | OTHER]"
primary_transaction   : "[What does the customer pay for?]"
average_order_value   : "[USD amount or range]"
purchase_frequency    : "[ONE_TIME | MONTHLY | ANNUAL | TRANSACTIONAL | SUBSCRIPTION]"
customer_lifetime     : "[Average duration of customer relationship]"
primary_sales_channel : "[INBOUND | OUTBOUND | MARKETPLACE | REFERRAL | HYBRID]"
```

---

## 4. The Problem They Solve

**The specific problem this business addresses:**
[FILL — describe the problem from the customer's perspective, not the company's]

**What customers were doing before this solution existed:**
[FILL — the workaround or alternative that customers lived with]

**Cost of inaction for the customer (why they must solve this):**
[FILL — what happens to the customer if they do nothing]

---

## 5. Target Customer

> **Full detail lives in `Market_Audiences/03_MARKET/AUDIENCES.md`. This section is a summary only.**

**Primary customer type:**
[FILL — one sentence. e.g. "E-commerce store owners doing $30K–$300K/month in revenue who manage their own ad accounts."]

**What they want:**
[FILL — the stated desire, the outcome they want to achieve]

**What they fear:**
[FILL — the risk or loss they are trying to avoid]

**What they need to believe before buying:**
[FILL — the core belief shift required for purchase]

---

## 6. Differentiators

> **What makes this business objectively different from alternatives?**
> Only list claims that can be proven. No vague claims. No "we care more" statements.

| Differentiator | Proof / Evidence |
|----------------|-----------------|
| [Differentiator 1] | [Proof] |
| [Differentiator 2] | [Proof] |
| [Differentiator 3] | [Proof] |

**What this business explicitly does NOT do** (boundaries that define it):
[FILL — constraints that help marketing stay focused]

---

## 7. Proof & Credibility

**Existing social proof:**
```yaml
client_count          : "[Number or range]"
case_studies          : "[YES — count | NO | IN PROGRESS]"
testimonials          : "[YES — count | NO | IN PROGRESS]"
notable_clients       : "[Names if public, or CONFIDENTIAL]"
certifications        : "[Relevant certifications or NONE]"
awards                : "[Relevant awards or NONE]"
media_mentions        : "[Publications, podcasts, or NONE]"
years_in_operation    : "[Number]"
```

---

## 8. Geographic & Language Focus

**Primary market:**
[FILL — country or region with the most revenue or target potential]

**Secondary markets:**
[FILL or N/A]

**Language strategy:**
[FILL — e.g. "Spanish primary. English for technical documentation and US-facing campaigns."]

**Cultural considerations for marketing:**
[FILL — any market-specific norms that affect messaging or creative direction]

---

## 9. Business Goals (Current Period)

> These must be updated when business priorities change. Stale goals mislead agents.

**This quarter's primary goal:**
[FILL — e.g. "Generate 50 qualified discovery calls for the agency retainer service."]

**This year's primary goal:**
[FILL]

**3-year ambition:**
[FILL — directional, not a rigid forecast]

---

## 10. What This Business Is NOT

> Explicit exclusions prevent agents from proposing work outside scope.

- This is NOT: [FILL — e.g. "a software product company"]
- This is NOT: [FILL — e.g. "a traditional creative agency that does print or TV"]
- This is NOT targeting: [FILL — e.g. "enterprise companies with 500+ employees"]
- This does NOT offer: [FILL — e.g. "social media management as a standalone service"]
