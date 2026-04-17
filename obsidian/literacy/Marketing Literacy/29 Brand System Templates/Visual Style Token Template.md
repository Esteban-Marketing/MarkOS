---
date: 2026-04-16
description: "Design-token schema for brand colors, type, spacing, motion, imagery."
tags:
  - literacy
  - template
  - brand
  - visual
---

# Visual Style Token Template

> Machine-readable brand style tokens. Source of truth for Figma + code (see `lib/markos/theme/tokens.ts`).

## Color

```yaml
color:
  brand:
    primary:   hsl(215 85% 55%)
    secondary: hsl(165 60% 45%)
  semantic:
    action:    hsl(215 85% 55%)
    warn:      hsl(38 90% 55%)
    danger:    hsl(0 75% 55%)
    success:   hsl(155 65% 45%)
  surface:
    bg:        hsl(0 0% 100%)
    muted:     hsl(0 0% 96%)
    border:    hsl(0 0% 88%)
  text:
    primary:   hsl(0 0% 10%)
    secondary: hsl(0 0% 40%)
    inverse:   hsl(0 0% 100%)
```

## Type

```yaml
font:
  sans:      "Inter, system-ui, sans-serif"
  serif:     "Source Serif Pro, serif"
  mono:      "JetBrains Mono, monospace"
scale:
  xs:  0.75rem
  sm:  0.875rem
  md:  1rem
  lg:  1.25rem
  xl:  1.5rem
  2xl: 2rem
  3xl: 3rem
weight:
  regular: 400
  medium:  500
  bold:    700
```

## Spacing + grid

```yaml
spacing:
  base: 4px
  scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96]
radius:
  sm: 4px
  md: 8px
  lg: 16px
  xl: 24px
```

## Motion

```yaml
easing:
  standard: "cubic-bezier(0.2, 0, 0, 1)"
  enter:    "cubic-bezier(0, 0, 0, 1)"
  exit:     "cubic-bezier(0.4, 0, 1, 1)"
duration:
  fast:   120ms
  normal: 200ms
  slow:   400ms
```

## Imagery

- **Style**: realistic photography / stylized illustration / 3D / hybrid (pick one primary).
- **Mood references**: 5 anchor images committed to the brand pack.
- **AI-gen LoRA**: named model + prompt suffix for brand-consistent output.
- **Alt text policy**: descriptive, first-sentence-of-caption style.

## Accessibility

- WCAG 2.2 AA floor; AAA for marketing critical paths.
- Color-contrast minimums verified by axe-core.
- Motion-reduce respected.

## Related

- [[Brand System Canon]] · [[Brand Pack Template]] · [[AI Creative Pipelines 2026]] · [[Sustainability & Responsible Marketing]]
