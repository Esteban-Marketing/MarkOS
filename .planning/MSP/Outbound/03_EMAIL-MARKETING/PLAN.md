# Email Marketing Plan

<!-- mgsd-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MSP/Outbound/03_EMAIL-MARKETING/PLAN.md to customize it safely.


```
discipline    : Email Marketing
activation    : [ACTIVE | INACTIVE | FUTURE]
funnel_stages : Aware → Considering → Deciding → Onboarding → Retained
status        : empty
plan_period   : YYYY
budget        : $[FILL]
last_updated  : YYYY-MM-DD
```

> Email is the only channel the business owns outright — no algorithm, no platform dependency.
> It is the primary nurture and retention mechanism. Every lead that is not ready to buy today 
> belongs in an email sequence.

---

## Why This Discipline

[FILL — email's role: primary nurture channel, retention driver, revenue multiplier from existing relationships.
Specific to this business: who is on the list, how it was built, what the list can do.]

---

## 1. Situation Analysis

```yaml
esp_platform          : "[From MIR EMAIL.md]"
current_list_size     : "[FILL or UNKNOWN]"
list_quality          : "[High — all opt-in | Mixed | Unknown]"
avg_open_rate         : "[FILL or UNKNOWN]"
avg_click_rate        : "[FILL or UNKNOWN]"
active_sequences      : "[YES — [count] | NONE]"
deliverability_status : "[Good | Needs attention | Unknown]"
```

---

## 2. Goals & KPIs

| KPI | Baseline | Q1 | Q2 | Q3 | Q4 | Source |
|-----|----------|----|----|----|----|----|
| List size | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | ESP |
| Avg open rate | [FILL]% | [FILL]% | [FILL]% | [FILL]% | [FILL]% | ESP |
| Email-to-lead rate | [FILL]% | [FILL]% | [FILL]% | [FILL]% | [FILL]% | CRM |
| Monthly email-attributed leads | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | CRM utm_medium=email |
| Unsubscribe rate | — | ≤0.5% | ≤0.5% | ≤0.5% | ≤0.5% | ESP |

---

## 3. List Strategy

**List sources (how the list grows):**

| Source | Volume | Quality | Method |
|--------|--------|---------|--------|
| [e.g. Paid ad lead forms] | [FILL/month] | [HIGH] | [Auto-synced via n8n WF-001] |
| [e.g. Content lead magnets] | [FILL/month] | [MEDIUM] | [Form opt-in on Vibe page] |
| [e.g. Referrals] | [FILL/month] | [HIGH] | [Manual] |

**List segmentation model:**

| Segment | Definition | Email Treatment |
|---------|-----------|----------------|
| New leads | Subscribed <30 days | Welcome + nurture sequence |
| Engaged leads | Opened ≥3 emails last 60 days | Regular nurture |
| Cold leads | No open in 90+ days | Re-engagement sequence → sunset |
| Clients | CRM status = Closed Won | Onboarding + retention sequence |
| Advocates | Referred someone or gave testimonial | VIP treatment |

---

## 4. Sequence Architecture

> Detail in `LIFECYCLE-SEQUENCES.md`.

**Required sequences (build before launch):**

| Sequence | Trigger | Length | Goal |
|----------|---------|--------|------|
| Welcome | New subscriber | 3 emails / 7 days | Orient, deliver value, set tone |
| Lead nurture | Post-welcome, pre-call | 5–7 emails / 14 days | Build trust, address objections, drive call |
| Post-call — no show | Missed discovery call | 2 emails / 48h | Rebook |
| Onboarding (client) | Contract signed | 4 emails / 14 days | First value moment |
| Re-engagement | 90 days inactive | 3 emails / 14 days | Re-engage or sunset |
| Retention | 60-day client | Ongoing monthly | Proof, results, expansion |

---

## 5. Broadcast Strategy

> Detail in `BROADCAST-STRATEGY.md`.

**Newsletter cadence:**
```yaml
frequency       : "[e.g. Biweekly]"
send_day        : "[e.g. Tuesday]"
send_time       : "[e.g. 9am local audience time]"
content_format  : "[e.g. 1 insight + 1 resource + 1 CTA]"
segment_all     : "[YES | NO — segment exclusions: clients / cold subscribers]"
```

---

## 6. Automation Requirements

**n8n/Make workflows this discipline depends on:**

| Workflow | Purpose | Status |
|----------|---------|--------|
| WF-001 (Lead Capture) | Triggers welcome sequence | [ACTIVE / NEEDED] |
| WF-002 (CRM Stage) | Triggers onboarding sequence | [ACTIVE / NEEDED] |
| WF-003 (Email Engagement) | Updates CRM with engagement score | [ACTIVE / NEEDED] |

> Reference: MIR `Core_Strategy/06_TECH-STACK/AUTOMATION.md`

---

## 7. Deliverability Standards

```yaml
dkim_spf_dmarc    : "Required. See MIR EMAIL.md for configuration."
warm_up_new_domain: "[YES — 4-week warmup plan | N/A — domain established]"
list_hygiene      : "Remove hard bounces immediately. Sunset unengaged after 90 days."
unsubscribe       : "One-click. Never hidden. Never delayed."
spam_test_tool    : "[e.g. Mail-tester.com | GlockApps | Litmus]"
```
