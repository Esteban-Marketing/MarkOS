---
date: 2026-04-16
description: "Google Consent Mode v2 — required for EEA/UK ad performance. ad_storage, ad_user_data, ad_personalization, analytics_storage signals. Basic vs Advanced implementations."
tags:
  - literacy
  - privacy
  - consent
  - google
  - frontier
---

# Google Consent Mode v2

> Consent Mode v2 is Google's signal-passing framework for telling Google products (Ads, Analytics 4, Floodlight) a user's consent state. It became mandatory in March 2024 for any advertiser using remarketing/measurement on EEA/UK traffic in Google Ads, GA4, or DV360.

## The four signals

| Signal | Meaning |
|---|---|
| `ad_storage` | permission to use cookies/local storage for ads |
| `analytics_storage` | permission to use cookies/local storage for analytics |
| `ad_user_data` | permission to send user data to Google for ads (v2) |
| `ad_personalization` | permission to use data for personalized ads (v2) |

Default state should be `denied` until the user interacts with the CMP.

## Basic vs Advanced mode

| Mode | Tags fire when denied? | Modeling? |
|---|---|---|
| **Basic** | tags don't fire at all before consent | no modeled conversions — data loss |
| **Advanced** | tags fire with cookieless pings | Google models conversions in GA4/Ads |

Advanced recovers 30–70% of lost attribution via Google's conversion modeling. Basic is compliance-easier but analytically lossy.

## Implementation

1. **CMP** — OneTrust · Cookiebot · Didomi · Osano · CookieYes · Iubenda · Quantcast Choice · Google-certified list.
2. **GTM or gtag** — wire consent signals via `gtag('consent', 'default', {...})` and `gtag('consent', 'update', {...})`.
3. **Verify** — DebugView in GA4, Tag Assistant, Consent Mode Status in Google Ads.
4. **CMP IAB TCF v2.2** — if you use IAB framework, Google requires TCF v2.2 (from November 2023).

## What breaks without it

- Ads: personalized remarketing, Customer Match, PMax audience signals — down-weighted or disabled for EEA/UK.
- Analytics: behavioral reports, audiences in GA4 — lose event volume.
- Conversion APIs (GA4 + Google Ads Enhanced Conversions) — require consent alignment.

## Pitfalls

- Leaving `ad_user_data` and `ad_personalization` missing — Google treats as non-compliant even with the legacy v1 signals.
- Sending `granted` by default before CMP interaction — regulatory violation.
- Wiring consent for Google only and forgetting Meta Conversions API consent + TikTok Events consent + LinkedIn consent.
- Not testing modeled conversion lift — Advanced mode's value is empirical; measure vs pre-change baseline.

## Beyond Google

Similar consent-signalling exists across platforms:

- **Meta** — Conversions API consent (`ad_user_data` equivalent).
- **TikTok** — Events API v3 consent signals.
- **LinkedIn** — Conversions API consent flag.
- **Apple** — SKAdNetwork + Attribution Reporting.
- **US** — Global Privacy Control (GPC) signal honoured by state laws (CA, CO, CT, CA).

## Related

- [[Privacy, Consent & Compliance]] · [[Cookie Deprecation Status 2026]] · [[EU AI Act for Marketers]] · [[US State Privacy Patchwork]] · [[Data, Analytics & Measurement]]
