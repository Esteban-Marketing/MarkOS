# VOICE-TONE.md — Language Personality & Style Rules

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MIR/Core_Strategy/02_BRAND/VOICE-TONE.md to customize it safely.


```
file_purpose  : Define exactly how this brand communicates in writing.
                Governs all copy, messaging, and agent-generated text.
                THIS FILE WINS over PROFILE.md if they conflict on tone or language.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES — most specific file for language decisions
```

---

## 1. Brand Voice (Constant)

> Voice is who the brand is. It doesn't change across contexts.
> Pick 3–5 adjectives and define precisely what they mean.

### Voice Attributes

| Attribute | What It Means | What It Does NOT Mean | Example ON | Example OFF |
|-----------|-------------|----------------------|-----------|------------|
| [e.g. Direct] | [We say what we mean. No hedging, no fluff.] | [Blunt or aggressive] | ["You'll pay $X/month."] | ["Our flexible pricing works around your budget needs."] |
| [e.g. Expert] | [We demonstrate knowledge through specifics.] | [Condescending or academic] | ["ROAS degraded because the creative fatigue threshold was crossed."] | ["Your ads aren't working as well as they used to."] |
| [Attribute 3] | [Definition] | [What it excludes] | [ON example] | [OFF example] |
| [Attribute 4] | [Definition] | [What it excludes] | [ON example] | [OFF example] |

---

## 2. Tone (Contextual)

> Tone shifts by channel and audience state. Voice stays constant.

| Context | Tone | Example |
|---------|------|---------|
| Paid ads — cold audience | [e.g. Curious and direct] | [FILL] |
| Paid ads — warm/retargeting | [e.g. Confident and specific] | [FILL] |
| Landing pages | [e.g. Structured and reassuring] | [FILL] |
| Email — prospect | [e.g. Conversational, low pressure] | [FILL] |
| Email — client update | [e.g. Professional and transparent] | [FILL] |
| Social — organic | [e.g. Candid, slightly informal] | [FILL] |
| Error messages / UI text | [e.g. Clear, brief, no blame] | [FILL] |
| Crisis communication | [e.g. Calm, factual, action-oriented] | [FILL] |

---

## 3. Writing Rules

### Sentence & Structure

```yaml
sentence_length       : "[e.g. Default to short. Max 2 clauses per sentence. Break long ideas into lists.]"
paragraph_length      : "[e.g. 2–3 sentences for ads. Up to 5 for email body.]"
punctuation_style     : "[e.g. Oxford comma YES. Em-dash over semicolons.]"
capitalization        : "[e.g. Title case for headlines. Sentence case for body.]"
numbers               : "[e.g. Numerals for anything ≥ 10. Spell out one through nine.]"
```

### Active vs. Passive

```yaml
default_voice         : "Active"
passive_allowed_when  : "[FILL — e.g. When the subject is unknown or irrelevant]"
```

---

## 4. Vocabulary

### Words We Use

| Term | Why We Use It | Context |
|------|-------------|---------|
| [Word/phrase] | [Reason] | [Where to use it] |
| [Word/phrase] | [Reason] | [Where to use it] |

### Words We Do NOT Use

> These are hard bans. AI agents: never use these words in any output for this project.

| Prohibited Word/Phrase | Replace With | Reason |
|-----------------------|-------------|--------|
| "advanced" | [Alternative] | [Reason — e.g. vague, overused] |
| "competitive" | [Alternative] | [Reason] |
| "efficient" | [Alternative] | [Reason] |
| "engaging" | [Alternative] | [Reason] |
| "innovative" | [Alternative] | [Reason] |
| "cutting-edge" | [Alternative] | [Reason] |
| "best practices" | [Alternative] | [Reason] |
| "world-class" | [Alternative] | [Reason] |
| "seamless" | [Alternative] | [Reason] |
| "leverage" | [Alternative] | [Reason] |
| "synergy" | [Alternative] | [Reason] |
| "game-changing" | [Alternative] | [Reason] |
| [Add project-specific bans] | | |

---

## 5. Messaging Hierarchy in Copy

> When writing any marketing piece, structure should follow this hierarchy:

1. **Lead with the problem or desired outcome** — not the solution
2. **Introduce the product/service as the mechanism** — after the problem is established
3. **Proof** — specific, not generic
4. **CTA** — one clear next step, not multiple options

---

## 6. Language & Localization

```yaml
primary_language      : "[e.g. Spanish (Colombia)]"
secondary_language    : "[e.g. English (US)]"
translation_rule      : "[e.g. Spanish is always primary. English is used for technical content and global campaigns only.]"
dialect_notes         : "[e.g. Use voseo (vos) for Colombian audience. Use tú for neutral Latin America.]"
```

**Localization rules:**
[FILL — e.g. "Currency always in COP for Colombian campaigns, USD for international. Dates in DD/MM/YYYY format."]

---

## 7. CTAs (Calls To Action)

### Approved CTA Formulas

| Context | Approved CTA | Prohibited CTA |
|---------|-------------|---------------|
| Lead form | [e.g. "Agendar llamada"] | [e.g. "Submit", "Click here"] |
| Content download | [e.g. "Descargar guía gratis"] | [e.g. "Get it now"] |
| Retargeting | [e.g. "Ver opciones de servicio"] | [e.g. "Buy now"] |
| Email | [e.g. "Responde este email"] | [e.g. "Click the link below"] |

### CTA Rules

```yaml
cta_per_piece         : "ONE primary CTA per ad or page. Secondary CTA allowed on long pages only."
urgency_allowed       : "[YES — only with real deadlines | NO — no artificial urgency]"
emoji_in_cta          : "[YES | NO]"
```

---

## 8. Disclaimers & Legal Language

**Required disclaimer for:**
| Claim Type | Disclaimer Text |
|------------|----------------|
| [e.g. Income/results claims] | [Required legal disclaimer text] |
| [e.g. Testimonials] | [Required qualifier] |
| [e.g. Promotional pricing] | [Expiration/conditions text] |
