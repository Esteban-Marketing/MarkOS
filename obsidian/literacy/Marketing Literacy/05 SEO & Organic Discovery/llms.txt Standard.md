---
date: 2026-04-16
description: "llms.txt — emerging machine-readable manifest that declares to LLM crawlers which pages/docs to prioritize when answering about the site. Distinct from robots.txt."
tags:
  - literacy
  - seo
  - llmo
  - standard
  - frontier
---

# llms.txt Standard

> `llms.txt` proposes a markdown file at the site root that tells LLM crawlers which URLs contain the canonical, LLM-friendly explanation of the site, product, or docs. Not a replacement for `robots.txt` — it complements it.

Proposed by Jeremy Howard (Answer.AI) in late 2024; broadly adopted through 2025–2026 by dev-tool and docs-heavy brands.

## Shape

```
# Acme
> One-line description.

Longer paragraph providing context about the product, team, tone.

## Docs
- [Quickstart](https://acme.dev/docs/quickstart.md): five-minute getting-started
- [API Reference](https://acme.dev/docs/api.md): all endpoints, authoritative

## Examples
- [Agent recipe](https://acme.dev/examples/agent.md): canonical end-to-end example

## Optional
- [Changelog](https://acme.dev/changelog.md)
```

Variants:

- `/llms.txt` — curated index for crawlers.
- `/llms-full.txt` — concatenated markdown of the docs for one-shot LLM ingestion.
- `/docs/foo.md` — markdown mirror of the HTML docs page (same URL, `.md` suffix).

## Why marketers care

- **Control the quote.** The crawler quotes the markdown version; you choose what lives there.
- **Disambiguate.** One signed source for facts that conflict across site pages.
- **Structural clarity.** Docs indexed without HTML chrome yield cleaner embeddings and better retrieval.
- **Observable adoption.** Crawl logs from `GPTBot` / `ClaudeBot` / `PerplexityBot` tell you who fetches what.

## Related standards

- `robots.txt` — allow / disallow bots.
- `sitemap.xml` — enumerate URLs.
- `ai.txt` (Spawning) — opt-in/out for AI training corpora.
- `TDMRep` (W3C) — text-and-data-mining reservation signal.
- Schema.org `license`, `usageInfo` — rights information inline.

## Tooling

Generators: Mintlify · Fern · Docusaurus plugin · llmstxt.org generator · Firecrawl `/llmstxt` · custom CI scripts.

## Pitfalls

- Shipping `llms.txt` that points at stale or low-quality pages — worse than shipping none.
- Assuming every crawler honors it. Major engines increasingly do; long tail is uneven.
- Confusing it with `robots.txt` — they solve different problems (access vs. prioritization).

## Related

- [[Generative Engine Optimization]] · [[Zero-Click Search]] · [[Entity SEO]] · [[SEO & Organic Discovery]] · [[Privacy, Consent & Compliance]]
