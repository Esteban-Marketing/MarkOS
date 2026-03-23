# 📤 {{COMPANY_NAME}} - Outbound Marketing Pipeline

<!-- mgsd-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MSP/Outbound/01_OUTBOUND.md to customize it safely.


**Dependencies:** MIR Core Strategy (`{{MIR_STRATEGY_FILE}}`), MIR Gate 1 + Gate 2 required
**Assigned Agents:** `{{LEAD_AGENT}}` (mgsd-strategist, mgsd-campaign-architect, mgsd-copy-drafter)
**Linear Project Manager:** `mgsd-linear-manager`

## Outbound Parameters
- **Primary Outbound Channel:** `{{PRIMARY_OUTBOUND_CHANNEL}}` (e.g., LinkedIn Outbound / Cold Email / Paid Search)
- **Target Monthly Outreach Volume:** `{{OUTREACH_VOLUME}}`
- **Target CPL:** `{{CPL_TARGET}}`
- **Target CAC:** `{{CAC_TARGET}}`
- **Primary Prospect Segment:** `{{PROSPECT_SEGMENT}}` (from AUDIENCES.md ICP-1)

---

## 1. Outbound Foundation

- [ ] Verify ICP-1 definition in `Market_Audiences/03_MARKET/AUDIENCES.md` is `status: complete`.
- [ ] Verify `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` has outbound-specific objection responses.
- [ ] Confirm `Core_Strategy/06_TECH-STACK/AUTOMATION.md` has outbound CRM integration configured.
- [ ] Configure `TRACKING.md` with outbound conversion event: `{{OUTBOUND_CONVERSION_EVENT}}`.

## 2. Prospecting List Build

- [ ] Define prospecting criteria: company size `{{COMPANY_SIZE_FILTER}}`, industry `{{INDUSTRY_FILTER}}`, title `{{JOB_TITLE_FILTER}}`.
- [ ] Source prospect list from `{{PROSPECTING_SOURCE}}` (LinkedIn Sales Nav / Apollo / manual research).
- [ ] Validate list: remove existing customers, current opportunities, and hard bounces.
- [ ] Target volume: `{{LIST_SIZE}}` contacts per sprint. QA sample: human reviews 10% of list.
- [ ] Human approves prospecting criteria before list build begins.

## 3. LinkedIn Outbound Sequence (B2B)

Use `MGSD-ITM-ACQ-03` template for sequence setup.

- [ ] Design 5-touch sequence per `MGSD-ITM-ACQ-03`: Connect → Value → Proof → Offer → Follow-up.
- [ ] Write each touch using `mgsd-copy-drafter` with B03/B05/B07/B08 trigger mapping.
- [ ] Human reviews and approves all 5 messages before deployment.
- [ ] Launch to first `{{COHORT_SIZE}}` prospects. Monitor acceptance rate target: `{{ACCEPT_RATE_TARGET}}`.
- [ ] Kill switch: if reply rate < `{{MIN_REPLY_RATE}}` after 50 sends → pause and rewrite message 1.

## 4. Cold Email Sequence

- [ ] Design 4-email sequence: Problem → Social Proof → Offer → Bump.
- [ ] Subject lines: A/B test `{{SUBJECT_A}}` vs `{{SUBJECT_B}}`.
- [ ] Deliverability: verify SPF, DKIM, DMARC for `{{SENDING_DOMAIN}}` before launch.
- [ ] Daily send volume cap: `{{DAILY_SEND_CAP}}` (warm domain protocol).
- [ ] Track: open rate target `{{COLD_EMAIL_OPEN_TARGET}}`, reply rate target `{{COLD_EMAIL_REPLY_TARGET}}`.
- [ ] Human approves sequence before sending first email.

## 5. Follow-Up & Nurture

- [ ] Define follow-up trigger: if prospect opens email `{{N}}` times without replying → move to high-intent sequence.
- [ ] Build high-intent 2-touch sequence: Demo offer + Calendar link.
- [ ] Configure in `{{CRM_TOOL}}`: auto-tag prospects who open >3x as `warm-leads`.
- [ ] Sync `warm-leads` tag to Linear as `[MGSD-HOT-LEAD]` ticket for human follow-up.

## 6. Outbound QA Loop

- [ ] Weekly: reply rate vs. target `{{REPLY_RATE_TARGET}}`. If below → human reviews message copy.
- [ ] Weekly: meeting booked rate vs. target `{{MEETING_TARGET}}`.
- [ ] After each cohort: compute CPL. Kill channels where CPL > `{{CPL_TARGET}} * 1.5`.
- [ ] Monthly: cost per meeting booked vs. `{{CAC_TARGET}}`. Report to `mgsd-analyst`.
- [ ] Algorithmic scale: cohorts delivering CPL < target → increase volume by 20% next sprint.
