---
date: 2026-04-16
description: "Agentic marketing stack — orchestrator + specialist agents (planner, researcher, creator, auditor, publisher) with bounded autonomy and approval gates. Pattern mirrored in MarkOS."
tags:
  - literacy
  - marketing
  - ai
  - agents
  - frontier
---

# Agentic Marketing Stack

> Multi-agent system that plans, executes, and verifies marketing work with human approval checkpoints. The MarkOS codebase itself is one implementation of this pattern — see [[MarkOS Protocol]].

## Architecture

```
User intent → Orchestrator
              ├─ Planner         → decomposes goal into phases + tasks
              ├─ Researcher      → gathers MIR-level intelligence (market, audience, competitors)
              ├─ Creator         → produces drafts (copy, visuals, video, audio)
              ├─ Auditor         → brand guardrails, neuro-trigger checks, compliance
              ├─ Publisher       → dispatches to channels (gated by consent + approval)
              └─ Verifier        → measures outcomes vs goal, feeds back
```

MarkOS maps this to 23 domain-specialized agents addressable by TOKEN_ID (e.g. `MARKOS-AGT-STR-02` = Planner). See `.agent/markos/MARKOS-INDEX.md`.

## Bounded autonomy

Agents never bypass human approval for mutations. Pattern:

1. Agent proposes mutation → packaged as `approval_package` (F-63A in MarkOS contracts).
2. Operator reviews in UI (amber gates).
3. On accept, execution records an immutable outcome row (e.g. `crm_copilot_mutation_outcomes`).
4. On reject, approval package closed with evidence.

Rationale: AI errs, hallucinates, drifts. Humans sign off on anything that touches brand, spend, deliverability, or customer data. See [[Key Decisions]].

## Guardrails

- **Brand voice classifier** — every output scored against `brand-pack` tokens before publish.
- **Neuro-trigger audit** — optional MARKOS-AGT-NEU-01 validates biological-trigger alignment (B01–B10).
- **Compliance gate** — CAN-SPAM, GDPR, DMA, CPRA consent required before outbound.
- **Knowledge gates** — Gate 1 (Identity: brand, voice, business-model) and Gate 2 (Execution: tracking, automation, KPIs) must be populated before any content generation.

## State persistence

- **MIR** (Marketing Intelligence Repository) — canonical knowledge, vault-first.
- **MSP** (Marketing Strategy Pack) — discipline-routed execution plan.
- **Agent runs** — immutable envelope + events + side effects (tables `markos_agent_runs` / `markos_agent_run_events` / `markos_agent_side_effects`).
- **Approvals** — immutable `markos_agent_approval_decisions` ledger.

## 2026 landscape

| Layer | Options |
|---|---|
| Agent frameworks | LangGraph · LlamaIndex Agents · OpenAI Agents SDK · Vercel AI SDK · Claude Agent SDK · Pydantic AI · CrewAI · AutoGen · Anthropic Computer Use |
| Orchestrators | Inngest · Vercel Workflow DevKit · Temporal · Restate · AWS Step Functions |
| Memory | Upstash Vector · Pinecone · Weaviate · Chroma · pgvector · Turbopuffer |
| Observability | Braintrust · LangSmith · Helicone · Traceloop · Vercel AI Observability · Sentry AI Monitoring |
| Safety | Guardrails AI · NeMo Guardrails · Lakera Guard · Arize |

## Pitfalls

- **Unbounded autonomy** — removing human gates to move fast → brand incidents + compliance breaches.
- **Ungrounded generation** — creator agent without RAG context = hallucinated product claims.
- **Non-deterministic cost** — agent loops can burn tokens. Enforce budgets + cost telemetry.
- **Opaque state** — agents must record events + side effects; otherwise rollback is impossible.

## Related

- [[AI & Agentic Marketing — 2026 Frontier]] · [[Agentic Commerce]] · [[RAG-Grounded Personalization]] · [[AI Creative Pipelines 2026]] · [[LLM Observability for Marketing]] · [[MarkOS Protocol]] · [[MarkOS Codebase Atlas]] · [[Key Decisions]]
