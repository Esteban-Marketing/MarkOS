---
date: 2026-04-16
description: "Agentic commerce — LLM agents transact on users' behalf. Agent-readable catalogs, structured offers, affiliate contracts, trusted-vendor registries. A new top-of-funnel."
tags:
  - literacy
  - ai
  - commerce
  - agents
  - frontier
---

# Agentic Commerce

> Users delegate purchase tasks to AI agents ("find and buy a navy blazer under $300, my size, ships by Friday"). The agent browses catalogs, evaluates offers, completes checkout. Agentic commerce is to 2026 what mobile commerce was to 2010 — a distribution shift that rewards early brands.

## Surfaces (2026)

| Surface | Notes |
|---|---|
| **ChatGPT Shopping + Operator** | conversational product discovery + checkout agent |
| **Perplexity Shopping** | citations-first product answers, native buy flow with Shopify, Klarna integration |
| **Claude with Computer Use / Projects** | agent controls browser to complete transactions |
| **Gemini + Google Shopping** | ads + organic merged, agentic flows in Google apps |
| **Amazon Rufus / Project Amelia** | in-Amazon assistant that recommends + transacts |
| **Meta AI** — in-app shopping concierge | |
| **Shopify Sidekick + Shop Pay agent** | checkout + support agent bound to the merchant |
| **Apple Intelligence + Siri agent** | on-device commerce delegation (emerging) |

## Brand implications

1. **Be in the training + retrieval corpus.** If the agent doesn't know the brand exists, it doesn't show up. See [[Generative Engine Optimization]].
2. **Agent-readable product data.** Clean schema.org Product + Offer, stable GTIN/SKU, up-to-date pricing + availability, high-quality images, policy + shipping metadata.
3. **Structured offer feeds** — merchant feeds to ChatGPT/Perplexity/Shopify agents (emerging open standards).
4. **Trust + reviews signal** — verified reviews, third-party ratings, warranty terms; agents weight these.
5. **Affiliate + agent commissions** — new commercial rails (e.g. Perplexity Shopping affiliate, ChatGPT Commerce Program) require merchant agreements.
6. **Policy-friendly copy** — agents parse returns, shipping, support policy. Ambiguity loses the sale.

## Risks

- **Margin compression** — agents optimize on price + availability without brand loyalty unless brand is in the preference prompt.
- **Prompt injection / fraud** — malicious content on retailer pages can hijack agent decisions; verify safe rendering.
- **Attribution gaps** — agent traffic arrives with unusual UA strings and may be blocked; allow + tag distinct referrers.
- **Regulatory** — agent-led purchases raise disclosure + consent questions (EU AI Act, FTC).

## Emerging standards

- **Agent payment** — Stripe "Agent Commerce", PayPal AI agents, Shop Pay agent checkout.
- **Agent identity / attestation** — OAuth-for-agents, Anthropic "Computer Use" attestation, OpenAI Actions.
- **Offer feeds** — JSON-LD + schema.org `Offer`, Shopify Agent Kit, Perplexity merchant API, OpenAI commerce API.
- **MCP (Model Context Protocol)** — Anthropic-led standard for agents to consume merchant data.

## Build posture

1. Clean up product feed + schema.
2. Publish `llms.txt` with canonical policies + catalog pointers.
3. Join merchant programs on each major agent platform.
4. Monitor agent traffic as a separate channel in analytics.
5. Run agent-centric UX tests — does the site function for a headless agent?

## Related

- [[AI & Agentic Marketing — 2026 Frontier]] · [[Agentic Marketing Stack]] · [[Agentic Checkout]] · [[Generative Engine Optimization]] · [[llms.txt Standard]] · [[Commerce & Retail Media]] · [[Key Decisions]]
