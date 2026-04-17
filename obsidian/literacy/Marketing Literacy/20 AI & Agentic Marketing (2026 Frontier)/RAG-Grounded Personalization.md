---
date: 2026-04-16
description: "RAG-grounded personalization — LLM dynamic content fed with first-party retrieval context. Replaces rule-based dynamic content; gated by consent and brand guardrails."
tags:
  - literacy
  - ai
  - personalization
  - rag
  - frontier
---

# RAG-Grounded Personalization

> Classic personalization was rule-based (`if segment == X then show block Y`). RAG-grounded personalization lets an LLM compose copy / recommendations dynamically by retrieving the relevant facts from a first-party knowledge base at runtime. Better personalization, but only when the retrieval layer is clean.

## Architecture

```
user → retrieve 1P context  ┐
  (profile, orders,          │─→ LLM → generated block
   events, intent)           │
knowledge base:              │
  product catalog            │
  brand voice guide          │
  canonical claims           │
  offers + inventory         │
  policies                   │
  prior comms + responses    ┘
```

## Retrieval stack

| Layer | Options |
|---|---|
| **Vector store** | Upstash Vector · Pinecone · Weaviate · Chroma · pgvector · Turbopuffer · MongoDB Atlas Vector · Elasticsearch 8 |
| **Embedding model** | OpenAI `text-embedding-3-large` · Voyage AI voyage-3 · Cohere embed-v4 · Google text-embedding-005 |
| **Hybrid search** | Weaviate BM25 + vector · Vespa · Typesense · OpenSearch with kNN |
| **Reranker** | Cohere Rerank v4 · Voyage Rerank · Jina Reranker |
| **Graph / entity** | Neo4j · Kuzu · Memgraph — for relational retrieval |

## Use cases

- **Email + push** — dynamic block generation ("your next recommended purchase," "your loyalty balance + offers").
- **Website + landing pages** — hero copy + CTA personalized per session segment + referral.
- **In-product** — welcome messages, feature hints, tutorial content per persona + usage signal.
- **Chat + support agent** — answer grounded in knowledge base, not training data.
- **Ads creative** — dynamic copy variants generated per segment + placement.

## Guardrails

1. **Retrieve, don't hallucinate.** LLM output must cite retrieved passages; anything not grounded is rejected.
2. **Consent-aware retrieval** — user's consent flags restrict what can be used.
3. **Brand voice classifier** — output scored before publish.
4. **Claim checker** — no claims beyond approved list.
5. **Fallback** — if retrieval confidence is low, return default content, not generated.
6. **Observability** — log retrieval hits + generation outputs per user for audit.

## Measurement

- **Lift vs control** — A/B or contextual-bandit test grounded content vs static.
- **Quality score** — human-in-the-loop review on a sample.
- **Hallucination rate** — classifier on production outputs.
- **Retrieval precision** — were the right documents retrieved?

## Pitfalls

- **Stale index** — out-of-date product, inventory, pricing. Refresh cadence is the feature.
- **Over-personalization** — "this is exactly my data" feels creepy; respect consent + disclosure.
- **Single-tenant retrieval** in multi-tenant SaaS — cross-tenant leaks are catastrophic. Strict namespacing.
- **Unbounded context windows** — pack too much, model loses signal. Rerank + top-k discipline.

## Related

- [[AI & Agentic Marketing — 2026 Frontier]] · [[Agentic Marketing Stack]] · [[AI Creative Pipelines 2026]] · [[LLM Observability for Marketing]] · [[Warehouse-Native CDP]] · [[CRM Domain]]
