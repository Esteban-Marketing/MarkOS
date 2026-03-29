# Technology Stack

**Project:** MarkOS
**Researched:** 2026-03-28

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | >=18.0.0 | Runtime for CLI, onboarding backend, tests | Matches package engine, supports built-in fetch and `node:test`, keeps distribution simple |
| CommonJS | Current repo standard | Module system | Consistent with all shipped `.cjs` entrypoints and avoids a build step |
| Raw `http` server | Node built-in | Local onboarding server | Sufficient for the current API surface, low dependency weight, easy to ship inside `npx` install |

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase + Upstash Vector JS client | ^3.4.0 | Vector persistence for seed data and drafts | Supports local/self-hosted and cloud-addressable retrieval for onboarding memory |
| Local filesystem | Native | Persistent client-owned protocol state | Keeps MIR/MSP and override data inspectable, versionable, and migration-friendly |

### Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| npm / npx distribution | Current | CLI installation and updates | Core product delivery mechanism |
| Vercel routing | Current repo config | Hosted onboarding entrypoints | Reuses shared backend handlers without maintaining a second API implementation |
| PostHog Node | ^5.21.2 | Telemetry | Lightweight opt-in observability path already wired into config |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dotenv` | ^17.3.1 | Environment loading | Use for local provider keys and Vector Store host configuration |
| `openai` | ^6.32.0 | OpenAI integration | Use when OpenAI is the selected or fallback provider |
| `formidable` | ^3.5.4 | Multipart form/file ingestion | Use for onboarding source uploads |
| `mammoth` | ^1.12.0 | DOCX parsing | Use for uploaded planning or strategy docs |
| `pdf-parse` | ^2.4.5 | PDF parsing | Use for uploaded PDFs in onboarding extraction |
| `csv-parse` | ^6.2.1 | CSV parsing | Use for structured source uploads |
| `posthog-node` | ^5.21.2 | Telemetry events | Use only where event capture materially informs product operations |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Backend framework | Raw Node `http` | Express / Fastify | Current route surface is small enough that a framework would add weight without clear leverage |
| Testing | `node:test` | Jest / Vitest | Built-in runner already covers current needs and keeps install footprint low |
| Vector store | Vector Store | SaaS-only vector DB | MarkOS benefits from local-first/self-hostable deployment and operator control |
| Provider strategy | Adapter over multiple vendors | Single-vendor integration | Current product value includes provider flexibility and fallback paths |

## Installation

```bash
npm install upstash-vector csv-parse dotenv formidable mammoth openai pdf-parse posthog-node
```

## Sources

- package.json
- README.md
- bin/install.cjs
- onboarding/backend/server.cjs
- onboarding/backend/vector-store-client.cjs
- https://nodejs.org/api/test.html
- https://upstash.com/docs/vector/overall/getstarted
- https://developers.openai.com/api/reference/resources/chat
- https://platform.claude.com/docs/en/api/messages
- https://ai.google.dev/gemini-api/docs/text-generation

