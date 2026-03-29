# EVENT-PLAYBOOK.md — Standard Operating Procedures Per Event Type

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Community_Events/13_EVENT-MARKETING/EVENT-PLAYBOOK.md to customize it safely.


```
status      : empty
last_updated: YYYY-MM-DD
```

---

## Webinar SOP

**Timeline (working backward from event date):**

| T-minus | Task | Owner |
|---------|------|-------|
| T-21 days | Topic confirmed. Registration page live (Vibe code). | {{LEAD_AGENT}} |
| T-21 days | Promotional email #1 sent to list | {{LEAD_AGENT}} |
| T-14 days | Paid ad promotion begins (if budgeted) | {{LEAD_AGENT}} |
| T-7 days | Promotional email #2 to list | {{LEAD_AGENT}} |
| T-3 days | Reminder email to registrants | {{LEAD_AGENT}} |
| T-1 day | Tech rehearsal | {{LEAD_AGENT}} |
| T-1h | Final reminder email + link | {{LEAD_AGENT}} |
| Event day | Go live. Monitor chat. | {{LEAD_AGENT}} |
| T+1h | Recording processing begins | {{LEAD_AGENT}} |
| T+1h | Follow-up email #1 sent | Automated via ESP |
| T+24h | Follow-up email #2 sent | Automated via ESP |
| T+3 days | Follow-up email #3 (CTA) sent | Automated via ESP |
| T+7 days | Performance review | {{LEAD_AGENT}} |

---

## Tracking Setup (per event)

- [ ] Registration page PostHog `page_viewed` firing
- [ ] Registration form fires `lead_submitted` with utm_source=event
- [ ] n8n WF-001 routes registrant to CRM + CAPI
- [ ] Confirmation email triggers from ESP
- [ ] Reminder sequence configured
- [ ] Post-event follow-up sequence ready (draft, not live)
