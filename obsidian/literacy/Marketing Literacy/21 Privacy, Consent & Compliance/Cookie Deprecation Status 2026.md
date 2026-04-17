---
date: 2026-04-16
description: "Third-party cookie timeline across Safari, Firefox, Chrome — where each browser stands in 2026, Privacy Sandbox status, and first-party + clean-room patterns that work."
tags:
  - literacy
  - privacy
  - cookies
  - frontier
---

# Cookie Deprecation Status 2026

> The "cookiepocalypse" happened gradually, then all at once. By 2026 third-party cookies are **operationally dead on Safari, Firefox, and Brave** (~35% of global web traffic) and are **user-choice in Chrome** after Google's July 2024 pivot from default-off to user-prompt. Planning must assume deterministic user-level tracking is the exception, not the default.

## Browser state

| Browser | Status |
|---|---|
| **Safari** | ITP blocks 3PCs since 2020; 1PCs limited to 7 days; fingerprinting defences active |
| **Firefox** | ETP blocks 3PCs + known trackers since 2019 |
| **Brave** | 3PCs blocked by default + fingerprinting mitigations |
| **Chrome** | July 2024 — Google scrapped default deprecation; now a user-choice prompt and Privacy Sandbox remains live for alternate APIs |
| **Edge** | Tracking Prevention similar to ETP; uses Chromium + some MS additions |

## Privacy Sandbox APIs (Chrome)

- **Topics API** — interest-based audience without 3PCs.
- **Protected Audience** (formerly FLEDGE) — in-browser auctions for remarketing.
- **Attribution Reporting API** — event + summary aggregate conversion attribution.
- **Fenced Frames** — privacy-preserving iframe replacement.
- **Shared Storage** — cross-origin storage with privacy constraints.
- **IP Protection** (Gnatcatcher) — IP proxy for known trackers.

Adoption varies; DSPs and SSPs built integrations through 2024–2026 but many advertisers treat Sandbox as a supplementary not primary signal.

## What actually works in 2026

1. **First-party data everywhere.** Collect with consent (email, account login, purchase, preference center) and activate through [[Warehouse-Native CDP|warehouse-native CDPs]].
2. **Server-side tagging** — Conversions API (Meta), Enhanced Conversions (Google), Events API v3 (TikTok), LinkedIn CAPI.
3. **[[Data Clean Rooms]]** — Snowflake, Databricks, Amazon Marketing Cloud, Google Ads Data Hub, Disney Clean Room, LiveRamp Safe Haven.
4. **Deterministic IDs** — UID2, ID5, RampID, publisher-provided IDs — deterministic where consent + login exist.
5. **Probabilistic + contextual** — IP + UA + behavior modelling, plus Seedtag / GumGum / Peer39 contextual signals.
6. **MMM + incrementality** — channel-level causality that doesn't need user IDs.
7. **Retail media first-party** — RMN closed loop sidesteps 3PC issues entirely.

## Planning consequences

- Re-target lists shrink by a lot outside Chrome; compensate with contextual + first-party CRM-based targeting.
- Frequency capping across publishers is leaky — use DSP + publisher caps together.
- Attribution accepts aggregate truth (see [[Unified Measurement]]).
- Lookalike modeling uses first-party seeds + clean-room joins, not 3PC pixels.

## Pitfalls

- Treating July 2024 Chrome reversal as "cookies are back." User-choice prompts + Safari/Firefox realities mean 3PCs are still unreliable.
- Building infra only for Privacy Sandbox — coverage is Chrome-only.
- Skipping consent mode — measurement loss compounds.

## Related

- [[Privacy, Consent & Compliance]] · [[Google Consent Mode v2]] · [[Warehouse-Native CDP]] · [[Data Clean Rooms]] · [[Identity Resolution 2026]] · [[Retail Media Network Landscape 2026]]
