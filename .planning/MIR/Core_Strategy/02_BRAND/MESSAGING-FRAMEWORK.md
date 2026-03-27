# MESSAGING-FRAMEWORK.md — Core Value Propositions & Messaging Architecture
<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.mgsd-local/MIR/Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: This file is the "Message House" that anchors all external communication. `mgsd-copywriter` MUST derive all ad scripts and landing page copy from Section 1 and Section 3. `mgsd-analyst` MUST use Section 8 (Objection Responses) when training or configuring AI chat/outbound systems.

**Dependencies:** PROFILE (`../01_COMPANY/PROFILE.md`), AUDIENCES (`../../Market_Audiences/03_MARKET/AUDIENCES.md`)
**Assigned Agent:** `mgsd-copywriter`
**Linear Project Manager:** `mgsd-linear-manager`

```
file_purpose  : Define the structured messaging system: what we say, why it matters,
                to whom, and in what format. All copy derives from this architecture.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — primary source for all marketing messaging
```

---

## 1. Core Value Proposition

**The single most important claim this business makes:**

```
[FILL — one sentence. This is the primary marketing claim that everything else supports.
Example: "We build and run paid media systems that generate qualified leads without requiring 
the client to understand any of the technical stack."]
```

**Why a customer should believe this claim (proof points):**
1. [FILL]
2. [FILL]
3. [FILL]

---

## 2. Positioning Statement (Internal Use)

> Use this to align the team — not as a marketing headline.

```
For [target customer description],
[Brand name] is the [category]
that delivers [key benefit]
because [reason to believe].

Unlike [main alternative],
[Brand name] [key differentiator].
```

**Filled version:**
```
For [FILL],
[FILL] is the [FILL]
that delivers [FILL]
because [FILL].

Unlike [FILL],
[FILL] [FILL].
```

---

## 3. Message Hierarchy by Audience

> For each major audience segment, define what message leads. Full audience definitions: `Market_Audiences/03_MARKET/AUDIENCES.md`.

### Segment A: [Audience Name from AUDIENCES.md]

```yaml
segment_id          : "A1"
primary_message     : "[The ONE thing this segment needs to hear first]"
supporting_messages : 
  - "[Supporting claim 1]"
  - "[Supporting claim 2]"
  - "[Supporting claim 3]"
proof_that_works    : "[Most persuasive proof element for this segment]"
objection_to_address: "[The main reason they won't buy — and how we counter it]"
emotional_hook      : "[What fear or desire drives them]"
```

### Segment B: [Audience Name]

```yaml
segment_id          : "A2"
primary_message     : "[FILL]"
supporting_messages : 
  - "[FILL]"
proof_that_works    : "[FILL]"
objection_to_address: "[FILL]"
emotional_hook      : "[FILL]"
```

---

## 4. Messaging by Funnel Stage

| Stage | Awareness | Consideration | Decision |
|-------|-----------|---------------|---------|
| **Goal** | Problem/outcome framing | Solution education | Conversion |
| **Lead message** | [FILL] | [FILL] | [FILL] |
| **Tone** | [FILL] | [FILL] | [FILL] |
| **CTA** | [FILL] | [FILL] | [FILL] |
| **Proof type** | [Social proof / stats] | [Case studies / demos] | [Guarantees / testimonials] |

---

## 5. Headlines Bank

> Pre-approved headline structures and examples. AI agents: use these as models.

### Formula-Based Headlines

| Formula | Example | Context |
|---------|---------|---------|
| [Problem] → [Outcome] | [FILL] | Cold audience |
| [Outcome] without [pain] | [FILL] | Cold audience |
| [Specific result] in [timeframe] | [FILL] | Retargeting |
| How [brand] does [X] differently | [FILL] | Consideration |
| The reason [audience] can't [outcome] | [FILL] | Awareness |
| [Number] [things/steps/reasons] [claim] | [FILL] | Content / organic |

### Approved Headlines (Ready to Use)

| Headline | Channel | Audience | Status |
|----------|---------|---------|--------|
| [FILL] | [FILL] | [FILL] | [APPROVED / DRAFT] |
| [FILL] | [FILL] | [FILL] | [FILL] |

---

## 6. Elevator Pitches

> Pre-written versions for different contexts and time constraints.

**10 seconds (for profile bios, intros):**
[FILL]

**30 seconds (for ads, quick pitches):**
[FILL]

**2 minutes (for landing page hero, discovery calls):**
[FILL]

---

## 7. Key Proof Points

> Specific, quantifiable, or verifiable claims available for use in marketing.

| Proof Point | Type | Where to Use | Verification |
|------------|------|-------------|-------------|
| [FILL] | [Stat / Testimonial / Case study / Award] | [Context] | [Source or date] |
| [FILL] | [FILL] | [FILL] | [FILL] |

---

## 8. Objection Responses

> Standard responses to the most common objections. Agents: use these when writing
> FAQ sections, email sequences, or retargeting copy.

| Objection | Response Strategy | Short Answer |
|-----------|------------------|-------------|
| "Too expensive" | [FILL] | [FILL] |
| "I don't know if this will work for me" | [FILL] | [FILL] |
| "I've tried this before and it didn't work" | [FILL] | [FILL] |
| "I need to think about it" | [FILL] | [FILL] |
| "I'll do it myself" | [FILL] | [FILL] |
| [Add project-specific objection] | [FILL] | [FILL] |

---

## 9. What We Do NOT Claim

> Hard limits on what marketing may never say.

- We do NOT claim: [FILL]
- We do NOT use: [FILL — e.g. "competitors' names in ad copy"]
- We do NOT promise: [FILL]