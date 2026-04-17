---
date: 2026-04-16
description: "LLM observability for marketing — tracing, evals, hallucination + brand-safety classifiers, cost telemetry. The feedback loop that makes AI creative production safe."
tags:
  - literacy
  - ai
  - observability
  - evals
  - frontier
---

# LLM Observability for Marketing

> LLM observability is the telemetry + evaluation stack around prompts, outputs, and agent behavior. For marketing, the additional dimensions are brand safety, regulatory compliance, and creative performance correlation.

## Three layers

1. **Tracing** — every prompt → context → output + tool calls logged.
2. **Evaluation** — offline + online scoring on correctness, brand voice, safety, style.
3. **Telemetry** — cost, latency, provider health, failure modes.

## Tooling (2026)

| Layer | Tools |
|---|---|
| **Tracing + evals** | Braintrust · LangSmith · Helicone · Traceloop · Langfuse · Arize · Phoenix (open-source) |
| **Evaluation frameworks** | OpenAI Evals · Deepeval · Ragas · TruLens · Anthropic Eval Harness |
| **Guardrails** | Guardrails AI · NeMo Guardrails · Lakera Guard · Arize Phoenix · Promptfoo |
| **Safety classifiers** | Perspective API · OpenAI Moderation · Anthropic Safety API · Azure Content Safety |
| **Brand voice classifier** | custom LLM-as-judge with brand rubric |
| **Cost / provider telemetry** | Helicone · Portkey · LiteLLM · OpenRouter · Vercel AI Gateway |
| **Vector + retrieval obs** | Arize Phoenix · Ragas · Weaviate usage metrics |

## What to log

- **Prompt** (rendered) + template version + variables.
- **Retrieved context** (document IDs + scores).
- **Model** + version + provider.
- **Output** (raw) + post-processed.
- **User / tenant** (for attribution + safety review).
- **Tool calls** made (agent steps).
- **Latency** + token usage + cost.
- **Downstream outcome** where measurable (click, conversion, deliverability, complaint).

## Eval dimensions

| Dimension | Eval type |
|---|---|
| Factuality | LLM-as-judge vs ground truth; RAG provenance check |
| Brand voice | LLM-as-judge with brand rubric |
| Safety | classifier on hate, self-harm, violence, illegal |
| Regulatory | claim-substantiation check; disclosure presence |
| Relevance | semantic similarity to intent |
| Fluency | perplexity / human panel |
| Jailbreak resistance | adversarial prompt suite |

## Feedback loop

1. Trace every production call.
2. Sample 1–5% for human review.
3. Run automated LLM-as-judge evals on 100%.
4. Score aggregates per prompt template / model / segment.
5. A/B test prompt / model changes in production with guardrails.
6. Feed failures back as training examples or prompt refinements.

## Pitfalls

- **Observability debt** — launching AI features without tracing = can't debug, can't improve.
- **Sampling too low** — evaluate 100% with cheap evals, 1–5% with human review.
- **Judging with the generator** — LLM-as-judge using the same model it is judging biases toward that model.
- **No downstream signal** — evals disconnected from business outcomes optimize to nothing.
- **Leaking PII into logs** — logs are data; redact + govern with same rigour as the warehouse.

## MarkOS mapping

MarkOS persists agent telemetry in `markos_llm_call_events`, agent runs in `markos_agent_runs` / `markos_agent_run_events` / `markos_agent_side_effects`, and approval decisions in `markos_agent_approval_decisions`. See [[MarkOS Codebase Atlas]] + [[Database Schema]].

## Related

- [[AI & Agentic Marketing — 2026 Frontier]] · [[Agentic Marketing Stack]] · [[AI Creative Pipelines 2026]] · [[RAG-Grounded Personalization]] · [[Experimentation]] · [[MarkOS Codebase Atlas]]
