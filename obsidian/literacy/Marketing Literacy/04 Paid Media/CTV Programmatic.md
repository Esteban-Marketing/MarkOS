---
date: 2026-04-16
description: "CTV (Connected-TV) programmatic — streaming inventory landscape, AVOD/FAST, SSAI, attention metrics, shoppable TV, measurement beyond reach/frequency."
tags:
  - literacy
  - paid-media
  - ctv
  - programmatic
  - frontier
---

# CTV Programmatic

> CTV is now the largest single category of TV ad spend and the most contested surface in 2026. Streaming platforms opened ad tiers; FAST channels proliferated; retail media networks extended into living-room inventory. Planning it well requires different muscles than linear TV *or* classic programmatic display.

## Inventory supply (2026)

| Category | Examples |
|---|---|
| **Premium AVOD** (ad-supported tier on subscription) | Netflix Ads · Disney+ Ads · Max Ads · Prime Video Ads · Apple TV+ (late 2025) · Paramount+ · Peacock |
| **FAST** (Free Ad-Supported TV channels) | Tubi · Pluto TV · The Roku Channel · Freevee · Samsung TV Plus · LG Channels · Vizio WatchFree+ · Xumo Play |
| **vMVPDs** | YouTube TV · Hulu Live · Sling · Fubo |
| **Publisher direct** | NBCU One Platform · Disney DRAX · WBD (Max) · Paramount EyeQ · FOX Advance · CNN+ |
| **Smart-TV OEM** | Vizio (Walmart-owned) · Samsung · LG · Roku · Google TV · Amazon Fire TV |
| **Shoppable TV** | NBCU "Must Shop TV", Disney Gateway Shop, Roku Action Ads, Amazon Prime Video shoppable |

## Buying paths

- **Programmatic guaranteed** — fixed price + inventory, auction mechanics minimal.
- **Private marketplace (PMP)** — invite-only auctions at premium CPMs.
- **Open exchange** — long-tail + FAST.
- **Biddable** self-serve platforms — Netflix / Disney / Amazon each have direct self-serve UIs supplementing DSPs.
- **Retail media extension** — Walmart Connect + Vizio, Amazon + Prime Video. See [[Retail Media Network Landscape 2026]].

## Stack components

| Layer | Tools (2026) |
|---|---|
| DSP | The Trade Desk · DV360 · Amazon DSP · Yahoo DSP · MediaMath · Adform |
| SSP | Magnite · PubMatic · FreeWheel · Xandr · OpenX |
| Identity | UID2 · ID5 · RampID (LiveRamp) · Publisher-provided IDs |
| Verification | IAS · DoubleVerify · MOAT |
| Attention | Adelaide AU · Realeyes · TVision · Lumen |
| Ad server | FreeWheel · Google Ad Manager · Operative |
| SSAI | Server-Side Ad Insertion at CDN — Harmonic · Broadpeak · Yospace · AWS Elemental MediaTailor |

## Measurement

- **Reach & frequency** — cross-publisher dedup via iSpot, VideoAmp, Comscore, Nielsen ONE, Kantar.
- **Attention** — eye-tracking + completion + volume signals (2026 default KPI alongside completed-view).
- **Incrementality** — geo holdout, matched-market, synthetic control. See [[Incrementality Testing]].
- **Commerce attribution** — retailer data back-feeds into MMM/clean-rooms.

## Creative patterns

- 15s + 30s still dominate; 6s bumpers growing.
- Ad pods are shorter (2–4 ads); first-in-pod is premium.
- Frequency-cap obsessively — viewers complain loudest about the same spot 7× in a show.
- Shoppable overlays (QR, remote-triggered add-to-cart) are meaningful but not yet transformative.
- Interactive / pause ads on Netflix + Disney are high-attention formats.

## Pitfalls

- **SSAI + identity gaps** — server-side insertion can break user-level attribution if publisher-provided IDs are missing.
- **Impression quality** — "CTV" can mean smart-TV browser ads (much lower value) versus real streaming inventory.
- **Frequency abuse** — cross-platform capping is genuinely hard; default caps in DSPs are too permissive.
- **Co-viewing undercounted** — 2–3 humans per household stream; measurement doesn't always reflect.
- **Over-indexing on reach** — without attention + incrementality, CTV looks amazing and proves little.

## Related

- [[Paid Media]] · [[Retail Media Network Landscape 2026]] · [[Attention Metrics]] · [[Incrementality Testing]] · [[MMM Revival]] · [[Data, Analytics & Measurement]]
