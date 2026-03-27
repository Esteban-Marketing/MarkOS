# VISUAL-GUIDELINES.md — Imagery, Layout & Design Direction

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MIR/Core_Strategy/02_BRAND/VISUAL-GUIDELINES.md to customize it safely.


```
file_purpose  : Define the visual direction for photography, illustration, video,
                and layout. Used when briefing the designer and when sourcing assets.
status        : empty
last_updated  : YYYY-MM-DD
authoritative : YES for visual production direction
```

---

## 1. Visual Identity Summary

**In one sentence, the visual feel of this brand:**
[FILL — e.g. "Structured, minimal, high-contrast — precision without coldness."]

**Three words that define the visual language:**
[FILL] · [FILL] · [FILL]

---

## 2. Photography Direction

### Style Parameters

```yaml
photography_style     : "[e.g. Candid documentary | Studio | Lifestyle | Product-focused]"
lighting              : "[e.g. Natural, soft diffused | High-key studio | Low-key dramatic]"
color_treatment       : "[e.g. True-to-life color | Warm tones | Desaturated muted palette]"
depth_of_field        : "[e.g. Shallow, subject-focused | Deep, environmental context]"
composition           : "[e.g. Subject-forward, centered | Rule of thirds | Environmental negative space]"
post_processing       : "[e.g. Clean, minimal retouching | Film-grain overlay | None]"
```

### What to Show

**Approved subjects:**
[FILL — e.g. "Real workspaces. People in context (not posed). Data on screens. Process over result."]

**Approved aesthetic references (link or describe):**
[FILL — links to mood board or descriptive reference]

### What to Never Show

**Prohibited subjects:**
[FILL — e.g. "Stock photo handshakes. Suits. Artificial smiles. Overly polished 'success' imagery. Generic laptop-on-desk setups."]

**Prohibited visual treatments:**
[FILL — e.g. "No HDR. No heavy vignettes. No obvious filters. No clip art."]

---

## 3. Illustration & Graphic Elements

```yaml
illustration_use      : "[YES — describe style | NO]"
illustration_style    : "[e.g. Flat geometric | Hand-drawn | Isometric | Data visualization]"
approved_uses         : "[e.g. Explainer diagrams only. Not for hero images.]"
prohibited_uses       : "[e.g. Never as a substitute for real photography in social.]"
```

---

## 4. Video Direction

```yaml
video_use             : "[YES | NO | AD_ONLY | ORGANIC_ONLY]"
video_style           : "[e.g. Talking head, handheld, natural environment]"
editing_style         : "[e.g. Direct cuts only. No jump cuts. No stock transitions.]"
music_direction       : "[e.g. Instrumental only. No lyrics. License required. | NONE]"
caption_style         : "[e.g. Always captioned. White text, black outline. Bottom third.]"
aspect_ratios         : "[e.g. 9:16 for Reels/TikTok. 1:1 for feed. 16:9 for YouTube.]"
max_duration_by_format:
  story_ad      : "[e.g. 15 sec]"
  reel_ad       : "[e.g. 30 sec]"
  feed_video    : "[e.g. 60 sec]"
  youtube       : "[e.g. 3–10 min]"
```

---

## 5. Layout Principles

### Structure

```yaml
grid_system           : "[e.g. 12-column, 8px base grid]"
container_max_width   : "[e.g. 1200px desktop, 100% mobile]"
spacing_unit          : "[e.g. 8px base — all spacing multiples of 8]"
```

### Hierarchy

**Visual hierarchy rules:**
[FILL — e.g. "One dominant element per composition. Headline largest. CTA must have highest contrast on the page."]

### White Space

```yaml
whitespace_philosophy : "[e.g. Generous. We do not fill space for its own sake.]"
```

---

## 6. Ad Format Composition Rules

### Static Ads

| Zone | What Goes There | Rule |
|------|----------------|------|
| Top 1/3 | [e.g. Hook text or product] | [e.g. Must work without logo] |
| Middle 1/3 | [e.g. Visual proof / product] | [e.g. Keep clear of text overlay] |
| Bottom 1/3 | [e.g. CTA + Logo] | [e.g. Always include logo here] |

### Text Overlay Rules

```yaml
max_text_coverage_pct : "[e.g. 20% of image area]"
headline_overlay      : "[YES — see typography spec | NO]"
approved_text_colors  : "[e.g. White with 40% black overlay background only]"
```

---

## 7. Accessibility Standards

```yaml
min_contrast_ratio    : "[e.g. 4.5:1 for body text | 3:1 for large text]"
alt_text_required     : "YES — all published images must have alt text"
color_blind_safe      : "[YES — verify with Coblis or similar | NO — not required]"
```

---

## 8. Asset Approval Checklist

Before any visual asset is approved for use:

- [ ] Uses only approved color palette
- [ ] Uses only approved fonts
- [ ] Logo present and correctly placed (if required)
- [ ] No prohibited imagery or visual treatments
- [ ] Text contrast meets minimum ratio
- [ ] File format and dimensions match the spec
- [ ] File named according to naming convention in `README.md`
- [ ] Approved by {{LEAD_AGENT}} before use