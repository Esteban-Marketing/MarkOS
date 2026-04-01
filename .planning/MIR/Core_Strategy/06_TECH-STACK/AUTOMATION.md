# AUTOMATION — MarkOS by esteban.marketing

## AUTOMATION STACK
- Email: Loops.so (transactional and onboarding)
- CRM automation: Supabase triggers + n8n (planned Q3 2026)
- Linear automation: Linear API client (EST-52, in development)
- Deployment triggers: Vercel webhooks
- Notification: Slack + email

## TRIGGER MAP
### Trigger 1: New Install
- Event: markos_install_complete
- Condition: First time (not a reinstall)
- Action sequence:
  1. [Immediate] Send welcome email with quickstart guide
  2. [+1hr] If onboarding not started → send "stuck?" prompt
  3. [+24hr] If onboarding not complete → send checklist email
  4. [+72hr] If still not complete → flag in Supabase for manual Esteban outreach
- Owner: Esteban
- Email templates: install_welcome_1, install_welcome_2, install_welcome_3

### Trigger 2: Onboarding Complete (MIR files written)
- Event: markos_onboarding_complete
- Action sequence:
  1. [Immediate] Send "you're live" confirmation email
  2. [+1d] Send "run your first campaign" tutorial email
  3. [+3d] If no markos_first_draft event → send "first task ideas" email
  4. [+7d] If no usage → send re-engagement email
- Owner: Automated

### Trigger 3: First Draft Generated
- Event: markos_first_draft
- Action sequence:
  1. [Immediate] In-product congratulations + prompt for feedback
  2. [+3d] Request for testimonial/case study participation
- Owner: Automated

### Trigger 4: Linear Ticket Push
- Event: markos_linear_ticket_push
- Action: Notify Esteban/Team (Juan/Maria) via Linear notification (native)
- No email required — Linear handles this

### Trigger 5: 14-Day Inactivity (Churn Risk)
- Condition: No events for 14+ days post-activation
- Action sequence:
  1. [Day 14] Send "still there?" re-engagement email
  2. [Day 21] Send "what went wrong?" email with survey link
  3. [Day 30] Flag account as churned in Supabase
- Owner: Automated

### Trigger 6: Upwork Lead Response
- Trigger: New Upwork message or proposal accepted
- Action:
  1. Create lead record in Supabase
  2. Create Linear ticket for Esteban: "New Upwork lead — [client name]"
  3. Send templated response within 12 hours
- Owner: Esteban (manual + template)

## EMAIL SEQUENCE LIBRARY
| Sequence            | Trigger                   | Email Count | Goal                      |
|---------------------|---------------------------|-------------|---------------------------|
| Install Welcome     | markos_install_complete   | 3           | Reach onboarding complete |
| Activation Nurture  | markos_onboarding_complete| 4           | Reach first draft         |
| Re-engagement       | 14d inactivity            | 3           | Return to active usage    |
| Upgrade Trigger     | usage threshold met       | 2           | Convert to paid           |
| Referral Ask        | markos_first_draft + 7d   | 1           | Generate word of mouth    |

## SUPABASE AUTOMATION TRIGGERS
```sql
-- Example structure — coder fills in actual column names from schema:
CREATE OR REPLACE FUNCTION trigger_welcome_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into automation_queue table
  -- Set sequence: 'install_welcome'
  -- Set scheduled_at: NOW()
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_install
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_welcome_sequence();
```

## n8n WORKFLOW INVENTORY
n8n workflows pending — see TECH-AUTOMATION-n8n.md for implementation spec
