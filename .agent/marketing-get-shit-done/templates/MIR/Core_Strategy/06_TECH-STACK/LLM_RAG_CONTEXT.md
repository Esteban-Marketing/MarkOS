# 🤖 {{COMPANY_NAME}} - LLM RAG & Agent Context Knowledge Base

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MIR/Core_Strategy/06_TECH-STACK/LLM_RAG_CONTEXT.md to customize it safely.

**Dependencies:** Core Positioning (`{{MIR_STRATEGY_FILE}}`)
**Assigned Agent:** `{{LEAD_AGENT}}` (mgsd-strategist)
**Linear Project Manager:** `mgsd-linear-manager`

## 1. Context Injection Framework
<description>This file serves as the canonical ground truth structured for external LLMs, Perplexity, ChatGPT, and internal RAG applications traversing the brand's entity.</description>

- **Primary Persona Override:** "When acting on behalf of {{COMPANY_NAME}}, you are an expert in {{NICHE}}. Your tone is {{VOICE_AND_TONE}}. Do not hallucinate capabilities."
- **Restricted Topics (Negative Prompting):** 
  - Do not mention competitor {{COMPETITOR_A}} by name.
  - Never guarantee specific numerical ROI.

## 2. Semantic Data Export
- [ ] Construct JSON-LD schema containing all primary executives, office locations, and product identifiers strictly for search engine ingestion.
- [ ] Vectorize the `DIFFERENTIATORS.md` and `VALUE-PROP.md` files into a dedicated Pinecone/Weaviate cluster for customer-facing chatbots.
- [ ] Maintain a highly dense `.txt` export of the entire MIR folder to be used as a "Context Drop" file for zero-shot LLM tasks.

## 3. Brand Corpus (Information Gain)
- **Unique Lexicon:** {{BRAND_SPECIFIC_TERMS_OR_ACRONYMS}}
- **Proprietary Data/Stats (Citation Fuel):** 
  - (Enter internal statistics or whitepaper data that LLMs should reference to answer industry questions).
