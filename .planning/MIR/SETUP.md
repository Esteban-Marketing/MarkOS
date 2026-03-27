# SETUP.md — Quick-Start Guide for New Projects

<!-- mgsd-token: MIR -->

> **Read this when starting a new project from the MIR template.**

---

## Step 1: Clone the Template

```bash
# From the get-shit-done repo
git clone https://github.com/[your-org]/get-shit-done.git
cp -r get-shit-done/MIR-TEMPLATE P[N]-[client-slug]
cd P[N]-[client-slug]
git init
git remote add origin https://github.com/[your-org]/P[N]-[client-slug].git
```

---

## Step 2: Initialize the Repository

Fill these files **in order**. Do not skip ahead.

### Day 1 (30–60 minutes)
1. `Core_Strategy/00_META/PROJECT.md` — Who is this project? What are the constraints?
2. `STATE.md` — Set project_id, project_name, client_slug, start_date
3. `Core_Strategy/00_META/CHANGELOG.md` — Log initialization entry

### Week 1 (Discovery with client)
4. `Core_Strategy/01_COMPANY/PROFILE.md` ← **Most important file. Do this first.**
5. `Core_Strategy/01_COMPANY/TEAM.md`
6. `Core_Strategy/01_COMPANY/FOUNDING-STORY.md`
7. `Core_Strategy/01_COMPANY/MISSION-VISION-VALUES.md`
8. `Core_Strategy/01_COMPANY/LEGAL.md`
9. `Core_Strategy/02_BRAND/BRAND-IDENTITY.md`
10. `Core_Strategy/02_BRAND/VOICE-TONE.md`
11. `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`
12. `Core_Strategy/02_BRAND/VISUAL-GUIDELINES.md`
13. `Market_Audiences/03_MARKET/AUDIENCES.md` ← Gate 1 requires this
14. `Products/04_PRODUCTS/CATALOG.md` ← Gate 1 requires this
15. `Products/04_PRODUCTS/PRICING.md`

### Week 2 (Infrastructure audit)
16. `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md` ← Gate 2 requires this
17. `Campaigns_Assets/05_CHANNELS/DIGITAL-PRESENCE.md`
18. `Campaigns_Assets/05_CHANNELS/EMAIL.md`
19. `Core_Strategy/06_TECH-STACK/INFRASTRUCTURE.md`
20. `Core_Strategy/06_TECH-STACK/TRACKING.md` ← Gate 2 requires this
21. `Core_Strategy/06_TECH-STACK/AUTOMATION.md` ← Gate 2 requires this
22. `Core_Strategy/06_TECH-STACK/INTEGRATIONS.md`

### Week 2–3 (Strategy)
23. `Market_Audiences/03_MARKET/INDUSTRY.md`
24. `Market_Audiences/03_MARKET/COMPETITIVE-LANDSCAPE.md`
25. `Market_Audiences/03_MARKET/POSITIONING.md`
26. `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md` ← Gate 2 requires this
27. `Core_Strategy/09_ANALYTICS/REPORTING-CADENCE.md`
28. `Operations/10_OPERATIONS/APPROVALS.md`
29. `Operations/10_OPERATIONS/CONTACTS.md`

---

## Step 3: Gate Check

Update `STATE.md` file status table. Verify:

**Gate 1 (Identity) — required before any marketing work:**
- [ ] `Core_Strategy/01_COMPANY/PROFILE.md` = `complete`
- [ ] `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` = `complete`
- [ ] `Core_Strategy/02_BRAND/VOICE-TONE.md` = `complete`
- [ ] `Market_Audiences/03_MARKET/AUDIENCES.md` = `complete`
- [ ] `Products/04_PRODUCTS/CATALOG.md` = `complete`

**Gate 2 (Execution) — required before paid campaigns:**
- [ ] `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md` = `complete`
- [ ] `Core_Strategy/06_TECH-STACK/TRACKING.md` = `complete`
- [ ] `Core_Strategy/06_TECH-STACK/AUTOMATION.md` = `complete`
- [ ] `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md` = `complete`

---

## Step 4: First Campaign

Once Gate 2 is clear:

```bash
cp Campaigns_Assets/08_CAMPAIGNS/_CAMPAIGN-TEMPLATE.md \
   Campaigns_Assets/08_CAMPAIGNS/ACTIVE/[campaign_id].md
```

Fill `CAMPAIGN.md` and follow the mGSD Protocol (Phase 3 onward).

---

## Project Numbering Reference

| Project | ID | Slug | Repo |
|---------|-----|------|------|
| esteban.marketing (agency) | P0 | esteban-marketing | P0-esteban-marketing |
| First client | P1 | [client-slug] | P1-[client-slug] |
| Second client | P2 | [client-slug] | P2-[client-slug] |

---

## How AI Agents Boot Into This Repository

Paste this into any AI agent session to load the project:

```
You are the Agency Operational Architect working on project [project_id] — [project_name].

Read the following files before responding to anything:
1. Core_Strategy/00_META/AGENTS.md
2. Core_Strategy/00_META/PROJECT.md  
3. STATE.md
4. Core_Strategy/01_COMPANY/PROFILE.md

[Paste file contents here]

Current task: [FILL]
```

> This is the PT-10 equivalent for the MIR system. See `MARKETING-GSD-PROTOCOL.md` for the full prompt template library.

---

## Maintenance

- Update `STATE.md` whenever anything significant changes
- Log all changes in `Core_Strategy/00_META/CHANGELOG.md`
- Review all files with `last_updated` older than 90 days quarterly
- Never let information exist outside this repository that affects marketing decisions
