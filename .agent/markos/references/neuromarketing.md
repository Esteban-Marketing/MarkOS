---
token_id: MARKOS-REF-NEU-01
document_class: reference
domain: neu
version: 1.0
status: active
upstream: []
downstream:
  - token_id: MARKOS-AGT-NEU-01
    path: agents/markos-neuro-auditor.md
    relationship: reads_trigger_catalog
  - token_id: MARKOS-AGT-STR-01
    path: agents/markos-strategist.md
    relationship: reads_trigger_architecture_rules
  - token_id: MARKOS-AGT-EXE-01
    path: agents/markos-executor.md
    relationship: reads_neuro_spec_schema
  - token_id: MARKOS-AGT-EXE-03
    path: agents/markos-plan-checker.md
    relationship: reads_neuro_spec_schema_for_validation
  - token_id: MARKOS-TPL-NEU-01
    path: templates/NEURO-BRIEF.md
    relationship: is_source_schema_for
mir_gate_required: none
---

# Neuromarketing Trigger Reference

## Purpose

**Function:** Defines the complete biological trigger catalog (B01–B10), ICP→archetype mapping, funnel stage→trigger assignments, and the `<neuro_spec>` XML block schema required in every campaign plan.
**Produces:** Reference data consumed by audit, strategy, execution, and verification agents; no artifact is written directly from this file.
**Consumed by:** MARKOS-AGT-NEU-01 (audit), MARKOS-AGT-STR-01 (strategy), MARKOS-AGT-EXE-01 (execution), MARKOS-AGT-EXE-03 (plan checking), MARKOS-TPL-NEU-01 (brief scaffold)

## Scope of Authority

Every document class (AGT, SKL, WFL, TPL) that references a biological trigger (B01–B10) or a psychological archetype **must** cite this file by TOKEN_ID `MARKOS-REF-NEU-01` and the specific section heading containing the trigger definition.

## Verification Frequency

Human operators verify this catalog against current neuroscience literature on a per-milestone basis. Updates to trigger definitions require a minor version increment.

---

**Scope:** Applied to every MARKOS campaign plan. Executors MUST include a `<neuro_spec>` block in every plan targeting an external audience.

---

## Biological Trigger Catalog (B01–B10)

### B01 — Variable Reward (Dopamine)
**Brain region:** Nucleus accumbens  
**Behavioral output:** Compulsive return, scroll continuation, purchase impulse  
**Activation conditions:** Unpredictable reward timing + unpredictable reward ratio  
**Marketing applications:**
- Content drops at irregular intervals (not every Tuesday 9am)
- Offers with randomized bonus tiers discovered only after adding to cart
- Email sequences where value magnitude is unpredictable across sends
- Notification copy that implies unknown reward ("Something for you →")

**Failure mode:** Fixed schedules create anticipation tolerance — dopamine response habituates. Break the pattern every 3rd instance.

---

### B02 — Loss Aversion (Norepinephrine + Amygdala)
**Brain region:** Amygdala → orbitofrontal cortex  
**Behavioral output:** Behavior driven by avoidance is 2.5× more powerful than equivalent approach motivation  
**Activation conditions:** Perceived ownership of something about to be lost  
**Marketing applications:**
- "Your spot closes in 23:47" (vs. "Only X left" — ownership language converts better)
- Free trial framing: "You have full access until [date]" → loss at expiry
- CTA: "Keep your [discount / access / price]" not "Get started"
- Retargeting copy escalates cost of inaction daily (Day 1: $X/month. Day 3: that's $X per week you're spending on the old way)

**Activation sequence:** Pre-ownership must be established BEFORE deadline pressure. Loss aversion requires there be something to lose — establish phantom ownership first.

---

### B03 — Social Proof Cascade (Oxytocin + Mirror Neurons)
**Brain region:** Anterior cingulate cortex + mirror neuron network  
**Behavioral output:** Trust transfer from recognized peer; conformity pressure from visible mass behavior  
**Activation conditions:** Testimonials must show a recognizable peer (not aspirational figure) in a plausible scenario  
**Marketing applications:**
- Testimonials with: named person, company type matching ICP, specific before/after metric
- Real-time social activity feeds ("47 people from [industry] signed up this week")
- Peer-case studies written from user perspective, not brand perspective
- Review snippets must include friction ("I was skeptical because X") not just praise

**Anti-pattern:** Celebrity testimonials reduce social proof for price-sensitive ICPs — the social distance is too great for mirror neuron activation.

---

### B04 — Authority Signal (Cortisol Reduction)
**Brain region:** Prefrontal cortex (uncertainty processing → cortisol release)  
**Behavioral output:** Uncertainty collapse, reduced decision anxiety, accelerated commitment  
**Activation conditions:** Signal must be specific and verifiable — generic "experts say" does not trigger cortisol reduction  
**Marketing applications:**
- Specific data citations: "MIT lab, 2024, N=1,200" not "studies show"
- Logo walls work but only with logos the ICP recognizes as authoritative to them (not generic Fortune 500 if ICP is SMB)
- Founder credentials tied to specific relevant outcome, not impressive-sounding title
- Third-party audit badges (G2, Capterra verified)

---

### B05 — Pain Relief Narrative (Cortisol → Serotonin)
**Brain region:** Amygdala (cortisol induction) → dorsal raphe nucleus (serotonin release during relief)  
**Behavioral output:** Attention lock on pain state; emotional association between brand and relief state  
**Activation sequence:** Pain must be FELT before solution is revealed. Premature solution description short-circuits the cortisol induction.  
**Copy structure:**
```
1. Name the pain with visceral specificity (cortisol spike)
2. Amplify the consequence (cortisol sustain)
3. Introduce the mechanism — NOT the product (curiosity bridge)
4. Deliver the product as relief (serotonin drop)
```
**Forbidden pattern:** "Our product solves X" — solution-first bypasses emotional encoding entirely.

---

### B06 — Scarcity / Urgency (Amygdala Threat Response)
**Brain region:** Amygdala → hypothalamus (behavioral urgency activation)  
**Behavioral output:** Rational evaluation suppression; accelerated decision  
**Activation conditions:** Scarcity must be credible (fake scarcity triggers distrust via prefrontal cortex override)  
**Marketing applications:**
- Cohort-limited access (real) over generic countdown timers
- Waitlist with position number ("You are #847 of 1,000 spots")
- Price increase tied to external event (funding round, season, cost input) — earns credibility
- Early access framing is scarcity without deadline-stress tone

---

### B07 — Curiosity Gap (Prefrontal Cortex — Information Gap Theory)
**Brain region:** Prefrontal cortex (anterior) — intrinsic motivation for information completion  
**Behavioral output:** Compelled reading past first sentence; link/CTA click  
**Activation conditions:** Partial information must be *relevant* to existing knowledge — gap cannot be created in a topic the reader doesn't care about  
**Copy structures:**
- "The [category] mistake that costs [ICP] $X / month"
- "[Specific number] [ICP] don't know this yet"
- "Why [established belief the ICP holds] is wrong (and what to do instead)"
- Interrupted list: "The 3 reasons [thing] fails — #2 surprised us"

---

### B08 — In-Group Identity (Oxytocin + Basal Ganglia)
**Brain region:** Basal ganglia (habit and identity encoding) + oxytocin (trust within in-group)  
**Behavioral output:** Brand affiliation, word-of-mouth, price insensitivity, churn resistance  
**Activation conditions:** Tribe must be defined by *exclusion* as well as inclusion — identity requires knowing who is NOT in the group  
**Marketing applications:**
- "For [specific ICP descriptor], not [adjacent non-ICP]"
- Insider vocabulary used consistently across all touchpoints
- Enemy framing: the incumbent solution, the old way, or the category of lazy thinking
- Subscriber/user labels that carry identity weight ("Growth Team members," not "subscribers")

---

### B09 — Anchoring (Cognitive Heuristic — Prefrontal)
**Brain region:** Prefrontal cortex (heuristic processing under uncertainty)  
**Behavioral output:** Price perception calibrated relative to anchor — target price feels cheap against high anchor  
**Application rules:**
- Always lead pricing presentation with highest-value option, left to right or top to bottom
- Express value in per-unit terms before showing price ("$X per lead generated" → "Monthly: $Y")
- Competitor price anchoring: show what the alternative costs in total (including hidden costs) before showing your price
- Include a clearly decoy option to make target option feel rational

---

### B10 — Embodied Cognition (Motor + Sensory Cortex)
**Brain region:** Motor cortex + sensory cortex + insula (interoception)  
**Behavioral output:** Product-self integration; product feels owned before purchase  
**Activation conditions:** Abstract descriptions activate the prefrontal cortex only; sensory language activates motor and sensory cortices, creating pre-ownership simulation  
**Copy rules:**
- Describe product use with sensation: weight, texture, speed, temperature, sound
- Demo copy: "Watch how fast this loads" (sensory) not "Performance is industry-leading" (abstract)
- Onboarding micro-copy: describe what the user will physically do, not what the system will do for them

---

## Psychological Archetype Mapping

### Quick-Reference ICP → Archetype Map

| Who the ICP is | Primary Archetype | Core Fear | Primary Trigger Cluster |
|----------------|-------------------|-----------|-------------------------|
| Founder / CEO | Ruler or Hero | Losing control or being outcompeted | B06 (scarcity of dominance), B09 (status anchor), B08 (exclusive tribe) |
| Marketing manager | Hero or Creator | Being blamed for underperformance | B02 (loss of job security covert framing), B03 (social proof with their peers), B04 (authority cover) |
| Developer | Sage or Outlaw | Being wrong or constrained | B07 (curiosity gap), B04 (technical authority), B08 (dev-culture tribe) |
| SMB owner | Caregiver or Hero | Failure affecting their team | B05 (pain relief — business survival), B03 (peer success), B02 (loss of cash) |
| Enterprise buyer | Ruler or Sage | Risk, politics, being wrong | B04 (authority and compliance), B03 (reference customers), B09 (ROI anchor) |

---

## Funnel Stage → Trigger Assignment

| Stage | Primary Triggers | Copy Instruction |
|-------|-----------------|------------------|
| Awareness (cold) | B05, B07 | Pain-first structure; curiosity gap headline |
| Consideration | B01, B03, B04 | Progressive value reveals; peer proof with metrics |
| Decision | B02, B06, B09 | Loss framing; anchor high; credible urgency |
| Onboarding | B01, B08, B10 | Variable early wins; tribe induction; sensory product description |
| Retention | B08, B03, B01 | Identity deepening; peer success stories; streak mechanics |

---

## `<neuro_spec>` Block — Required in Every Campaign Plan

Every PLAN.md with `tracking_required: true` must include:

```xml
<neuro_spec>
  <trigger>B0N — [Trigger Name]</trigger>
  <brain_region>[where activated]</brain_region>
  <activation_method>[specific copy or UX mechanism]</activation_method>
  <archetype>[Archetype Name — with one-line justification]</archetype>
  <funnel_stage>[awareness | consideration | decision | onboarding | retention]</funnel_stage>
  <psy_kpi>[which KPI from neuromarketing framework this maps to]</psy_kpi>
  <failure_mode>[what to watch for — how you'd know it's not activating]</failure_mode>
</neuro_spec>
```

---

## Anti-Patterns (Never Do)

| Pattern | Why It Fails |
|---------|-------------|
| Solution-first copy | Bypasses cortisol induction — no emotional encoding |
| Generic scarcity ("Limited time!") | Prefrontal override — distrust detected |
| Aspirational testimonials (celebrity) | Social distance prevents mirror neuron activation |
| Fixed content schedule | Dopamine habituation — anticipation stops being rewarding |
| Gain-framed CTAs when loss frame is available | 2.5× power left on table |
| Abstract product descriptions | Prefrontal only — no embodied cognition, no pre-ownership |
| Tribal language without enemy framing | Identity without contrast has weak encoding |
