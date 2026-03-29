# APPROVALS.md — Decision & Sign-Off Authority Matrix
<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.mgsd-local/MIR/Operations/10_OPERATIONS/APPROVALS.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: This matrix is a hard constraint on autonomy. `mgsd-executor` MUST pause if any action falls under Section 5 (Prohibited Actions). Escalation thresholds (Section 2) MUST trigger immediate notifications to `{{LEAD_AGENT}}`. `mgsd-analyst` MUST monitor performance triggers in Section 2.

**Dependencies:** WORKFLOWS (`WORKFLOWS.md`), MISSION (`../../Core_Strategy/01_COMPANY/MISSION-VISION-VALUES.md`)
**Assigned Agent:** `mgsd-executor`
**Linear Project Manager:** `mgsd-linear-manager`

```
file_purpose  : Define who approves what, at what threshold, and in what timeframe.
                Prevents unauthorized action and clarifies escalation paths.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES for approval routing
```

---

## 1. Approval Authority Matrix

| Decision | Authority | Consult | Inform | SLA |
|----------|-----------|---------|--------|-----|
| Campaign strategy | {{LEAD_AGENT}} | Client | — | — |
| Campaign launch | {{LEAD_AGENT}} | — | Client | — |
| Ad creative — final approval | [Client or {{LEAD_AGENT}} — FILL] | {{LEAD_AGENT}} | — | [X business days] |
| Ad copy — final approval | [Client or {{LEAD_AGENT}} — FILL] | {{LEAD_AGENT}} | — | [X business days] |
| Budget increase ≤ 10% | {{LEAD_AGENT}} | — | Client | — |
| Budget increase > 10% | Client + {{LEAD_AGENT}} | — | — | [X business days] |
| Budget decrease (any) | {{LEAD_AGENT}} | — | Client | — |
| Campaign pause (performance) | {{LEAD_AGENT}} | — | Client | Immediate + notify |
| Campaign pause (client request) | Client | {{LEAD_AGENT}} | — | Immediate |
| New platform test | {{LEAD_AGENT}} + Client | — | — | [X business days] |
| Landing page copy | [Client or {{LEAD_AGENT}} — FILL] | {{LEAD_AGENT}} | — | [X business days] |
| Landing page launch | {{LEAD_AGENT}} | — | Client | — |
| Offer or promotion creation | Client + {{LEAD_AGENT}} | — | — | [X business days] |
| Price change in PRICING.md | Client + {{LEAD_AGENT}} | — | — | [X business days] |
| Brand guideline exception | Client | {{LEAD_AGENT}} | — | [X business days] |
| New product in CATALOG.md | Client | {{LEAD_AGENT}} | — | — |
| Tracking implementation change | {{LEAD_AGENT}} | — | Client | — |
| MIR repository structural change | {{LEAD_AGENT}} | — | — | — |
| Tool/platform addition | {{LEAD_AGENT}} | Client (if cost) | — | — |
| Agency-client contract change | Client + {{LEAD_AGENT}} | Legal if needed | — | — |

---

## 2. Escalation Thresholds

### Performance Escalations

| Condition | Action | Who Acts | Who is Notified | Timeframe |
|-----------|--------|---------|----------------|-----------|
| CPL > 150% of target for 5 days | Campaign review + optimization proposal | {{LEAD_AGENT}} | Client | Within 24h |
| CPL > 200% of target for 3 days | Campaign pause + strategy review | {{LEAD_AGENT}} | Client | Immediate |
| Zero leads for 4 consecutive days | Pause + investigation | {{LEAD_AGENT}} | Client | Immediate |
| Tracking discrepancy > 30% | Stop optimization decisions | {{LEAD_AGENT}} | Client | Immediate |
| n8n/Make workflow failure > 1h | Investigation + manual fallback | {{LEAD_AGENT}} | — | Within 1h of detection |
| Meta CAPI event quality score < 6.0 | Tracking audit (SOP-008) | {{LEAD_AGENT}} | — | Within 48h |

### Budget Escalations

| Condition | Threshold | Approval Required |
|-----------|-----------|------------------|
| Overspend vs. plan | Any | {{LEAD_AGENT}} reviews + documents |
| Budget increase request | > 10% | Client approval required |
| Emergency pause | Any | {{LEAD_AGENT}} acts, notifies client same day |

---

## 3. Approval Request Format

When requesting approval from the client, use this format:

```
APPROVAL REQUEST

Decision: [What is being approved]
Context: [Why this decision is needed — 2–3 sentences]
Recommendation: [What we recommend and why]
Options: 
  A) [Recommended option] — [Estimated impact]
  B) [Alternative option] — [Estimated impact]
Impact if delayed: [What happens if approval takes longer than SLA]
Deadline for response: [Date/time]
```

---

## 4. Pre-Approved Actions (No Approval Needed)

> These actions are pre-authorized by scope of engagement. {{LEAD_AGENT}} executes and informs.

- [ ] Pausing clearly underperforming ads (CPL > 200% target)
- [ ] A/B testing creatives within approved concept
- [ ] Adjusting bids within ±15% of current
- [ ] Turning off ads flagged by platform for policy violations
- [ ] Updating UTM parameters for tracking accuracy
- [ ] Minor landing page copy fixes (typos, broken links)
- [ ] Adding negative keywords in Google campaigns

---

## 5. Prohibited Actions Without Explicit Approval

> These require explicit written approval before execution, regardless of urgency.

- Increasing total monthly budget beyond agreed amount
- Changing the primary campaign objective
- Adding or removing an entire ad platform
- Publishing content that mentions a competitor by name
- Discounting any product or service outside what is in OFFERS.md
- Changing the primary landing page URL
- Modifying any legal or compliance copy
- Publishing the client's personal information in any ad or page
