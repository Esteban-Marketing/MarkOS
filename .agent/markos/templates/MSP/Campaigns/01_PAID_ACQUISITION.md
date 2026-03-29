# 💸 {{COMPANY_NAME}} - Paid Acquisition Pipeline

<!-- mgsd-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MSP/Campaigns/01_PAID_ACQUISITION.md to customize it safely.


**Dependencies:** MIR Core Strategy (`{{MIR_STRATEGY_FILE}}`)
**Assigned Agent:** `{{LEAD_AGENT}}` (mgsd-strategist, mgsd-content-creator)
**Linear Project Manager:** `mgsd-linear-manager`

## Phase Budget & Parameters
- **Target CAC Limits:** `{{CAC_LIMIT}}`
- **Target CPA Bounds:** `{{CPA_GOAL}}`
- **Target LTV Goal:** `{{LTV_TARGET}}`
- **Daily Spend Threshold:** `{{DAILY_BUDGET}}`

## 1. Matrix Initialization: Audiences & Tracking
- [ ] Verify UTM parameter deployment across all landing page URLs securely (`{{COMPANY_URL}}`).
- [ ] Pull CRM exports and format Custom Audiences (Purchasers, High CLV, 30-Day Active).
- [ ] Render 1% and 3% Lookalike (LAL) Audiences from core purchaser lists.
- [ ] Verify rigorous exclusion matrix implementation (Do not show acquisition ads to current users).

## 2. Pipeline Execution: Meta Ads
- [ ] Sprint 1: Launch Top of Funnel (TOF) Video Campaign. Structure: 1 Broad Audience, 3 Creative Variants, 2 Copy Narratives aligned with `{{VOICE_AND_TONE}}`.
- [ ] Sprint 2: Launch Middle of Funnel (MOF) Retargeting Campaign. Structure: 30-Day Site Visitors. Assets: Social Proof & Testimonial Focus.
- [ ] Sprint 3: Launch Bottom of Funnel (BOF) Conversion Campaign. Assets: Hard Offer, Scarcity/Urgency logic.

## 3. Pipeline Execution: Search & Intent (Google/LinkedIn)
- [ ] Deploy Branded Search defensive campaign focusing on exact match terms related to `{{COMPANY_NAME}}`.
- [ ] Deploy Non-Branded Search intent campaign aggressively targeting competitor brand names `{{COMPETITORS}}`.
- [ ] Configure Performance Max (PMax) campaigns with 5 headlines, 5 descriptions, max media assets.

## 4. Algorithmic QA & Optimization Loops
- [ ] Track 3-day and 7-day Blended ROAS vs. Target `{{CAC_LIMIT}}`.
- [ ] Terminate any ad variant explicitly costing > 1.5x of the acceptable `{{CPA_GOAL}}`.
- [ ] Algorithmically scale daily budgets on winning ad sets precisely by 20% every 48 hours.

## 5. Neuromarketing & CRO Integration
- [ ] A/B test purely Psychological Hooks in ad copy at the MOF layer: **Authority vs. Social Proof**.
- [ ] Inject **Loss Aversion (Scarcity/Urgency)** strictly into BOF retargeting sequences.
- [ ] Implement Post-Purchase Upsell flows mapped to maximize the average initial order value and establish `{{LTV_TARGET}}` vectors.
