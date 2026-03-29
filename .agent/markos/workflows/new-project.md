---
description: Initialize a new marketing project with full Gate 1 intake questionnaire, MIR scaffolding, MSP discipline activation, and roadmap creation
---

# /markos-new-project

<purpose>
Initialize a new single-client MARKOS project from scratch. Clones MIR and MSP templates, runs a structured Gate 1 intake questionnaire with human-confirmed answers written directly to MIR files, activates MSP disciplines, and creates PROJECT.md + ROADMAP.md + STATE.md. No campaign work until Gate 1 is GREEN.
</purpose>

## Process

### 1. Initialize

```bash
INIT=$(node ".agent/markos/bin/markos-tools.cjs" init new-project --raw)
```

If `.planning/PROJECT.md` already exists → show warning, ask if user wants to reinitialize or resume filling existing MIR (resume → skip to Step 4).

### 2. Clone Templates

Copy MIR and MSP templates into the project planning directory:

```bash
node ".agent/markos/bin/markos-tools.cjs" template clone \
  --source templates/MIR \
  --dest .planning/MIR

node ".agent/markos/bin/markos-tools.cjs" template clone \
  --source templates/MSP \
  --dest .planning/MSP
```

Initialize STATE.md:
```bash
node ".agent/markos/bin/markos-tools.cjs" state init --gate1 red --gate2 red
```

### 3. Create .markos-local/ Override Directory

Create the client override space at the project root:

```bash
mkdir -p .markos-local/MIR/Core_Strategy
mkdir -p .markos-local/MIR/Market_Audiences
mkdir -p .markos-local/MIR/Products
mkdir -p .markos-local/MIR/Campaigns_Assets
mkdir -p .markos-local/MIR/Operations
mkdir -p .markos-local/MSP
mkdir -p .markos-local/config
```

Copy the override README:
```bash
cp ".agent/markos/templates/local-override/README.md" ".markos-local/README.md"
```

Add .markos-local/ to .gitignore (append if .gitignore exists, create if not):
```bash
echo "" >> .gitignore
echo "# MARKOS client overrides (private — do not commit)" >> .gitignore
echo ".markos-local/" >> .gitignore
echo "onboarding-seed.json" >> .gitignore
echo ".markos-install-manifest.json" >> .gitignore
```

Emit confirmation: `✓ .markos-local/ created — your private override space is ready`

### 4. Generate RESEARCH/ Intelligence Files

After the project scaffold is complete, initialize the RESEARCH/ directory and auto-populate it:

#### Create RESEARCH/ directory at project root
```bash
mkdir -p RESEARCH
```

#### Check for onboarding seed
```bash
SEED_EXISTS=$(test -f onboarding-seed.json && echo "true" || echo "false")
```

#### Trigger markos-researcher in correct sequence
For each RESEARCH file in this EXACT order (later files need earlier context):
1. `RESEARCH/ORG-PROFILE.md` — identity foundation
2. `RESEARCH/PRODUCT-RESEARCH.md` — what we're marketing
3. `RESEARCH/AUDIENCE-RESEARCH.md` — who we're talking to
4. `RESEARCH/MARKET-TRENDS.md` — environment context
5. `RESEARCH/COMPETITIVE-INTEL.md` — competitor analysis
6. `RESEARCH/CONTENT-AUDIT.md` — content inventory

Copy the template for each file first:
```bash
# Note: In Windows PowerShell, use Copy-Item instead of cp if needed, but assuming git bash context:
cp ".agent/markos/templates/RESEARCH/ORG-PROFILE.md" "RESEARCH/ORG-PROFILE.md"
cp ".agent/markos/templates/RESEARCH/PRODUCT-RESEARCH.md" "RESEARCH/PRODUCT-RESEARCH.md"
cp ".agent/markos/templates/RESEARCH/AUDIENCE-RESEARCH.md" "RESEARCH/AUDIENCE-RESEARCH.md"
cp ".agent/markos/templates/RESEARCH/MARKET-TRENDS.md" "RESEARCH/MARKET-TRENDS.md"
cp ".agent/markos/templates/RESEARCH/COMPETITIVE-INTEL.md" "RESEARCH/COMPETITIVE-INTEL.md"
cp ".agent/markos/templates/RESEARCH/CONTENT-AUDIT.md" "RESEARCH/CONTENT-AUDIT.md"
```

Then invoke `markos-researcher` (as a subagent Task) with:
- Target file: `RESEARCH/{FILENAME}`
- Seed data: relevant section from `onboarding-seed.json` (or prompt user for 5 seed questions)
- Context: all previously populated RESEARCH files (for later files in the sequence)

Emit progress for each file:
```
◆ Generating RESEARCH/ORG-PROFILE.md... [1/6]
✓ RESEARCH/ORG-PROFILE.md populated
◆ Generating RESEARCH/PRODUCT-RESEARCH.md... [2/6]
...
✓ RESEARCH/ — 6 intelligence files (audience, org, product, competitive, market, content)
```

#### Commit RESEARCH/ directory
```bash
node ".agent/markos/bin/markos-tools.cjs" commit "mktg(mir): initialize RESEARCH/ — 6 intelligence files generated" --files RESEARCH/
```

### 4. MSP Discipline Activation

Present all active discipline folders — human confirms which to activate. Save to `.planning/config.json` → `discipline_activation`.

```
Which marketing disciplines are active for this project?
→ Confirm activation: list numbers (e.g. "1, 2, 4, 6")

| # | Discipline | Folder |
|---|-----------|--------|
| 1 | Paid Acquisition | MSP/Campaigns/01_PAID_ACQUISITION |
| 2 | SEO / Organic | MSP/Campaigns/02_SEO_ORGANIC |
| 3 | Lifecycle Email | MSP/Campaigns/03_LIFECYCLE_EMAIL |
| 4 | Content & Social | MSP/Campaigns/04_CONTENT_SOCIAL |
| 5 | Affiliate / Influencer | MSP/Campaigns/05_AFFILIATE_INFLUENCER |
| 6 | Strategy | MSP/Strategy/ |
| 7 | Inbound | MSP/Inbound/ |
| 8 | Outbound | MSP/Outbound/ |
| 9 | Community & Events | MSP/Community_Events/ |
| 10 | Social | MSP/Social/ |
```

### 5. Gate 1 Intake Questionnaire

@-reference `.agent/markos/references/questioning.md`

Walk through each block in order. Write answers directly to the corresponding MIR file after each block. Human confirms accuracy before continuing to the next block.

**Human verification checkpoint after EACH block below.**

---

**Block 1: Company Identity** → `Core_Strategy/01_COMPANY/PROFILE.md`

```
Q1.  Legal company name?
Q2.  Primary industry / niche?
Q3.  Geographic market (country / city / global)?
Q4.  Business model (B2B / B2C / B2B2C / marketplace)?
Q5.  Company size (employees, revenue tier if shareable)?
Q6.  Primary website URL?
Q7.  Social media handles (by platform)?
Q8.  Who is the human marketing lead for this account ({{LEAD_AGENT}} name)?
```

Write answers → confirm with human → mark file `status: partial` or `status: complete`.

---

**Block 2: Brand Voice & Tone** → `Core_Strategy/02_BRAND/VOICE-TONE.md`

```
Q9.  Describe the brand's tone in 5 adjectives:
Q10. List 10 words or phrases the brand NEVER uses:
Q11. What CTA phrases does the brand use? (e.g. "Book a call", "See results")
Q12. Tone by channel:
     a) Social media (Instagram, LinkedIn)?
     b) Email?
     c) Paid ads?
     d) Website?
Q13. Any language / cultural considerations?
```

Write answers → confirm → mark status.

---

**Block 3: Messaging Framework** → `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`

```
Q14. In one sentence: what transformation does your product/service deliver?
Q15. What are the top 3 problems your ICP faces? (use their exact language)
Q16. What are your top 3 value propositions?
Q17. What are the 5 most common objections from leads? Answer to each?
Q18. Give 5 proven headline formulas that have worked (or describe ones to test):
Q19. What proof / social proof assets do you have? (testimonials, case studies, data)
```

Write answers → confirm → mark status.

---

**Block 4: Audience Definition** → `Market_Audiences/03_MARKET/AUDIENCES.md`

```
Q20. Describe ICP-1 (primary target): job title, company size, industry, geography
Q21. What does ICP-1 fear most professionally?
Q22. What does ICP-1 want most professionally?
Q23. Where does ICP-1 spend time online?
Q24. What communities, forums, or publications does ICP-1 read?
Q25. Do you have a secondary ICP (ICP-2)? If yes, describe similarly.
```

Write answers → confirm → mark status.

---

**Block 5: Product & Offer Catalog** → `Products/04_PRODUCTS/CATALOG.md`

```
Q26. List all products/services: name, price, one-sentence description
Q27. What is your lead/entry offer?
Q28. What is your core offer (primary revenue driver)?
Q29. Upsell or ascension path?
Q30. Any current promotions or limited-time offers?
```

Write answers → confirm → mark status.

### 6. Gate 1 Verification

```bash
GATE1=$(node ".agent/markos/bin/markos-tools.cjs" mir-audit --gate 1 --raw)
```

**If gate1.ready: true:**
```
✅ GATE 1 GREEN — Identity foundation complete

  ✓ Core_Strategy/01_COMPANY/PROFILE.md
  ✓ Core_Strategy/02_BRAND/VOICE-TONE.md
  ✓ Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md
  ✓ Market_Audiences/03_MARKET/AUDIENCES.md
  ✓ Products/04_PRODUCTS/CATALOG.md
```

**If gate1.ready: false:** Return to intake for the specific missing fields only. Do not re-run completed blocks.

### 7. Gate 2 Prompt

After Gate 1 is GREEN, prompt for Gate 2:

```
Gate 2 covers: tracking, automation, ad accounts, and KPI targets.
Campaigns cannot launch until Gate 2 is GREEN.

Continue to Gate 2 setup now ("now") or defer to later ("defer")?
→ Run /markos-health at any time to check gate status.
```

If "defer" → set `gate2: deferred` in STATE.md and proceed.
If "now" → run Gate 2 intake (see `references/mir-gates.md §Gate 2` for required files). Walk through each Gate 2 file using the same block/confirm pattern.

### 8. Create Planning Files

Using MARKOS templates:

1. **PROJECT.md** — from `templates/project.md`, populated with discovery answers
2. **REQUIREMENTS.md** — from `templates/requirements.md`
3. **ROADMAP.md** — from `templates/roadmap.md`, with initial milestone
4. **STATE.md** — gate status current
5. **config.json** — with activated disciplines

### 9. Commit and Next Steps

```bash
node ".agent/markos/bin/markos-tools.cjs" commit "mktg(init): initialize MARKOS project — Gate 1 ${GATE1_STATUS}"
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► PROJECT INITIALIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gate 1: {✅ GREEN | 🔴 RED}
Gate 2: {✅ GREEN | 🔴 deferred}

/markos-progress         → see project dashboard
/markos-new-milestone    → define first marketing milestone
/markos-discuss-phase 1  → start planning Phase 1
```

<success_criteria>
- [ ] MIR template cloned to .planning/MIR/
- [ ] MSP template cloned to .planning/MSP/
- [ ] RESEARCH/ — 6 intelligence files auto-populated by markos-researcher
- [ ] Gate 1 intake complete — all 5 files written and human-confirmed
- [ ] Gate 1 GREEN or specific gaps documented
- [ ] Gate 2 either completed or explicitly deferred in STATE.md
- [ ] Disciplines activated in config.json
- [ ] PROJECT.md, ROADMAP.md, STATE.md committed
</success_criteria>
