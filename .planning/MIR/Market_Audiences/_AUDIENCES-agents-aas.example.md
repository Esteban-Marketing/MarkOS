# AUDIENCES.md — Ideal Customer Profiles, Personas & Segments
# Reference Example: **Agents-aaS** (AI Marketing Operations Agent Platform)

<!-- mgsd-token: MIR | model: Agents-aaS -->
> [!NOTE] This is a completed example for an Agents-as-a-Service business. Use this as a quality and depth benchmark.

---

## 1. Primary Audience Segments

* **AI-Forward Marketing Leaders (Primary Champion):** VPs of Marketing and Directors of Marketing Operations at B2B companies (100–2,000 employees) who are actively experimenting with AI automation. They've tried prompt engineering, they use ChatGPT daily, and they are frustrated by its lack of memory, workflow context, and system integration. They want autonomous agents that act — not just generate.
* **Revenue Operations (RevOps) Leaders (Influencer/Co-Buyer):** RevOps Directors who own the GTM tech stack. They evaluate tools on data hygiene, CRM integration quality, and auditability of automated actions. They are a required stakeholder in the deal because the agents touch CRM, email, and ad platforms.
* **CTO / Head of AI (Technical Evaluator — Enterprise):** At companies with 500+ employees, a technical evaluation is required before production deployment. They evaluate on API security, audit logging, model transparency, and data residency. They block deals that can't answer "what did the agent do and why?"
* **Founder / CEO at AI-Native Startups (Fast Mover):** At 20–150 person AI-native companies, the CEO often evaluates the product directly against their own agent build vs. buy decision. Fast sales cycle (2–4 weeks), high product engagement, strong word-of-mouth potential.

## 2. Advanced Psychographics & Neuromarketing Profile

* **Core Desires/Fears:**
  * Desire: An agent that autonomously executes a full campaign workflow — research, copy, scheduling, A/B setup — without requiring a human in the loop for every step.
  * Desire (Secondary): Being seen as the team that "figured out AI in marketing" — a career-defining professional identity for early adopters.
  * Fear: An agent that confidently executes the wrong action — a GDPR-violating email send, a brand-damaging social post, or a budget-depleting ad buy — with no human checkpoint.
  * Fear (Secondary): Building internal tooling for 6 months, only to find a vendor ships the same capability.
* **Neuromarketing Triggers:**
  * *Primary Archetype:* **The Explorer / The Sage** — They are on the frontier. They want to be the first, but they insist on understanding *how* the system works before trusting it with production access.
  * *Effective Biases:* Authority (model transparency, published evals, benchmark comparisons), Social Proof (case studies from recognized companies in their industry), Transparency (action audit logs, explainability), Loss Aversion ("while you're building, your competitors are already shipping").
* **Pain Points & Frustrations:**
  * Current AI tools require too much human prompt engineering per task — not truly autonomous.
  * No persistent memory: every AI conversation starts from scratch, losing campaign context.
  * Integration fragility: connecting AI outputs to CRM, ad platforms, and email ESPs requires custom dev work every time.
  * Hallucination risk for brand-critical content — current LLMs produce polished-sounding wrong answers.
  * Accountability gap: no audit trail of what the AI decided and why, making compliance teams nervous.
* **Objections & Friction:**
  * "I don't trust AI to make decisions autonomously in production — my brand is on the line."
  * "Our IT team won't give an AI agent write access to our CRM."
  * "We're already building our own internal agent — why pay for yours?"
  * "How is this different from just using GPT-4 with a good system prompt?"

## 3. Lexicon & Behavioral Patterns

* **Language/Vocabulary:** "Agentic," "autonomous execution," "multi-agent orchestration," "LLM," "RAG," "context window," "tool use," "MCP," "function calling," "action audit," "prompt injection," "human-in-the-loop," "AI ops," "agent workflow," "guardrails," "model routing."
* **Channel Consumption:** Twitter/X (AI discourse, founder-led content), LinkedIn (professional positioning, case study distribution), AI-specific Discord servers (LangChain community, Anthropic Discord, indie hackers AI channels), Hacker News (critical technical discussion), Hugging Face community, AI/ML newsletters (The Batch, Import AI, AI Tidbits), demo videos on YouTube.
* **Buying Triggers:** A conference talk that demos a live agent completing a complex workflow end-to-end; a peer at a comparable company publicly sharing ROI metrics from agent deployment; an internal team failing to ship their homegrown agent after 3 months; a new AI model release that resets their "build vs. buy" calculation; a board-level directive to "get serious about AI productivity."

## 4. Regulation & Compliance Restraints

* **Compliance Checks Required:** GDPR (agents that access and process EU person data require lawful basis documentation), CAN-SPAM/CASL (agent-generated email must comply), brand safety guardrails (required conversation with legal before production deployment), AI governance policies (EU AI Act provisions for automated decision-making), SOC 2 Type II expected at enterprise tier.

## 5. Live Vectorized Sentiment (Chroma DB Integration)

* **Vector DB Target:** `chromadb://collections/mgsd-audience-sentiment`
* **Latest Trending Grievances:** (Injected dynamically per query by `mgsd-strategist` reading the DB).
* **High-Volatility Topics:** (Keywords currently accelerating in market chatboards).