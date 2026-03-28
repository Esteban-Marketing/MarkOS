# Architecture Patterns

**Domain:** AI-native marketing operating system
**Researched:** 2026-03-28

## Recommended Architecture

```text
CLI Layer
  bin/install.cjs
  bin/update.cjs
  bin/ensure-chroma.cjs

Delivery Layer
  Local server: onboarding/backend/server.cjs
  Hosted wrapper: api/*.js + vercel.json

Application Layer
  onboarding/backend/handlers.cjs
  onboarding/backend/agents/*.cjs
  onboarding/backend/write-mir.cjs

State Layer
  .agent/marketing-get-shit-done/templates/
  .planning/MIR
  .planning/MSP
  .mgsd-local/
  .mgsd-project.json
  Chroma collections
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| CLI binaries | Install, update, bootstrap, health operations | Filesystem, Chroma bootstrap, local repo |
| Onboarding UI | Collect user inputs and drive approval workflow | Local server or Vercel API routes |
| Shared handlers | Route business logic for config, status, submit, regenerate, approve | UI, orchestrator, Chroma, write-mir |
| LLM adapter | Normalize provider calls | Anthropic, OpenAI, Gemini, Ollama |
| Orchestrator | Sequence draft generation and error capture | Fillers, adapter, Chroma |
| Write-MIR layer | Persist approved drafts into client-owned files | Templates, local override directories, STATE tracking |
| Template layer | Immutable protocol defaults | Install/update engine, write-mir fallback |
| Local override layer | Client-specific approved state | Execution agents, write-mir, update protection |
| Test suite | Protect installer, updater, onboarding, and protocol integrity | All major runtime surfaces |

### Data Flow

User input enters through the onboarding UI and is submitted to shared handlers. The handlers persist seed data when running locally, derive or reuse a project slug, and call the orchestrator. The orchestrator runs MIR and MSP generators through a provider-agnostic LLM adapter, stores seed and draft artifacts in Chroma, and returns generated sections. After human approval, `write-mir.cjs` merges approved content into local MIR/MSP files and updates state markers.

## Patterns to Follow

### Pattern 1: Immutable Templates + Local Overrides
**What:** Keep protocol templates versioned and pristine while writing approved project state to a separate local layer.
**When:** Any time generated or user-edited content must survive updates.
**Example:** `write-mir.cjs` reads from template files only as a fallback and writes approved drafts into `.mgsd-local` targets.

### Pattern 2: Shared Business Logic Across Runtimes
**What:** Put route behavior in reusable handlers and expose thin runtime-specific entrypoints.
**When:** A feature must work both in a local server and a hosted/serverless wrapper.
**Example:** `server.cjs` and `api/*.js` both delegate to `onboarding/backend/handlers.cjs`.

### Pattern 3: Provider Abstraction at the Edge
**What:** Normalize AI calls behind one adapter instead of scattering provider branches across business logic.
**When:** Multiple providers or fallbacks are required.
**Example:** `llm-adapter.cjs` resolves provider choice and returns a stable `{ ok, text, usage }` shape.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Writing Client State into Versioned Templates
**What:** Mutating `.agent/.../templates` with approved client content.
**Why bad:** Breaks updates, pollutes defaults, and destroys the ownership boundary.
**Instead:** Keep approved state in `.mgsd-local` and treat templates as source defaults only.

### Anti-Pattern 2: Runtime-Specific Business Logic Forks
**What:** Let local server logic and Vercel logic drift apart.
**Why bad:** Creates bugs that only appear in one deployment mode.
**Instead:** Keep handlers shared and push environment differences to thin boundaries.

### Anti-Pattern 3: Hardcoded Relative Path Sprawl
**What:** Resolve important paths with repeated `../../` chains.
**Why bad:** Fragile in tests, serverless wrappers, and multi-tenant contexts.
**Instead:** Use centralized path constants for backend file resolution.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Onboarding traffic | Local or small hosted deployments are fine | Needs better queueing and request observability | Needs explicit async job model and durable orchestration |
| Vector storage | Local Chroma or a single hosted instance is workable | Requires tenancy and migration discipline | Requires strict namespace governance and operational automation |
| LLM cost and latency | Acceptable with synchronous generation | Needs caching, retries, and provider controls | Needs batching, budgeting, and likely workflow decomposition |
| File-based state | Excellent for client trust and small teams | Still useful, but migration tooling becomes important | Needs stronger sync and compatibility guarantees around local state |

## Sources

- .protocol-lore/ARCHITECTURE.md
- .protocol-lore/CONVENTIONS.md
- onboarding/backend/server.cjs
- onboarding/backend/handlers.cjs
- onboarding/backend/path-constants.cjs
- onboarding/backend/write-mir.cjs
- onboarding/backend/agents/orchestrator.cjs
- api/submit.js
- api/status.js
- vercel.json
