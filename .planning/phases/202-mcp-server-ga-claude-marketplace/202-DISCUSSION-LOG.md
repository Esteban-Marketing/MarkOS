# Phase 202: MCP Server GA + Claude Marketplace Launch — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 202-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 202-mcp-server-ga-claude-marketplace
**Areas discussed:** Tool slate, Session + auth + marketplace cert, Cost metering + hard budget, Tool safety (injection + confusion), Rate-limits + latency contract, Marketplace + pricing posture, MCP resources + streaming, Observability + release channel

---

## Tool slate (+20 tools)

### Q: Tool budget — how should the +20 new tools be allocated across domains?
| Option | Description | Selected |
|--------|-------------|----------|
| Marketing-weighted (10-5-3-2) | Marketing 10 + Tenancy 5 + Literacy 3 + CRM 2. Plays to MarkOS brand. | |
| Platform-balanced (7-7-3-3) | Marketing 7 + CRM 7 + Tenancy 3 + Literacy 3. Broader surface. | |
| Agency-skewed (8-4-4-4) | Marketing 8 + CRM 4 + Tenancy 4 + Execution 4. | |
| **Other (free text)** | | ✓ |

**User's choice:** "Make them marketing 1st, then CRM and literacy and last the rest. Tenants can be as basic as possible now."
**Notes:** Interpreted as ~10 Marketing + 4-5 CRM + 3-4 Literacy/Canon + 2 Tenancy (read-only) + remainder into execution/approvals helpers. Concrete split deferred to planner.

---

### Q: Do the 8 wave-0 stubs get backend-wired in 202?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes — wire all 8 in 202 | "30 tools, all live" marketplace pitch. | ✓ |
| Wire 4, keep 4 as stubs | Wire easiest 4; others stay schema-compliant stubs. | |
| None — stubs stay, add 20 new live | Fastest but risks cert pushback. | |

**User's choice:** Yes — wire all 8 in 202.

---

### Q: Should every mutating tool require an approval-gate round-trip?
| Option | Description | Selected |
|--------|-------------|----------|
| All mutations gated | Every write = preview + approval_token first, commit on re-call. | ✓ |
| Gated only for destructive/irreversible | Destructive ops gated; other writes fire directly. | |
| No gating — trust session auth | All writes fire directly; audit covers governance. | |

**User's choice:** All mutations gated.

---

### Q: Which single tool is the "must-work-flawlessly" hero for the marketplace listing?
| Option | Description | Selected |
|--------|-------------|----------|
| draft_message (live) | Marketing wow. Already wired. | |
| plan_campaign (stub → live) | Campaign-planning demo. Requires wiring in 202. | ✓ |
| run_neuro_audit (live) | Neuromarketing differentiator. | |

**User's choice:** plan_campaign (stub → live).

---

## Session + auth + marketplace cert

### Q: Session auth flow — how do MCP clients authenticate?
| Option | Description | Selected |
|--------|-------------|----------|
| OAuth 2.1 + PKCE | MCP 2025-06-18 spec; marketplace-standard. | ✓ |
| Supabase bearer + headers | Reuse Phase 201 tenant headers. | |
| API key (PAT) only | Personal access tokens; simplest. | |

**User's choice:** OAuth 2.1 + PKCE.

---

### Q: markos_mcp_sessions token type + TTL?
| Option | Description | Selected |
|--------|-------------|----------|
| Opaque + DB lookup, 24h rolling | 32-byte random, every request hits DB, extends on use. | ✓ |
| JWT signed, 15min + refresh | OAuth-standard short access + refresh. | |
| Opaque + edge-config cache, 24h | Edge-config backfill + DB fallback. | |

**User's choice:** Opaque + DB lookup, 24h rolling.

---

### Q: Tenant binding — how does an MCP session know which tenant?
| Option | Description | Selected |
|--------|-------------|----------|
| Bound at session-create | User picks tenant during OAuth consent; session fixed. | ✓ |
| Dynamic per-tool-call | Session authenticates user; tool call names tenant. | |
| Org-scoped sessions | Org-bound; tool calls pick tenant inside org. | |

**User's choice:** Bound at session-create.

---

### Q: Which MCP client to certify first after Claude Marketplace?
| Option | Description | Selected |
|--------|-------------|----------|
| Cursor | Largest MCP user base. | |
| Windsurf | Agent IDE; developer-native. | |
| ChatGPT Agents | Broadest audience; hardest cert. | |
| Warp | Terminal-based; fastest cert. | |
| **Other: VS Code** | | ✓ |

**User's choice:** VS Code.
**Notes:** Interpreted as VS Code's built-in MCP host / MCP-extension ecosystem.

---

## Cost metering + hard budget

### Q: Budget unit — what gets metered per session?
| Option | Description | Selected |
|--------|-------------|----------|
| Tokens (input + output LLM tokens) | Only LLM spend; simple. | |
| Tool calls + weighted tokens | Base + LLM-weighted. | |
| Cents (real cost per call) | Dollar-accurate; needs cost-table per tool/model. | ✓ |

**User's choice:** Cents (real cost per call).

---

### Q: Budget scope — at what level is the cap enforced?
| Option | Description | Selected |
|--------|-------------|----------|
| Per session | Each session has own cap. | |
| Per tenant, rolling 24h | Aligns with seat-pooled billing model. | ✓ |
| Per org, rolling 24h | Org-wide (spans tenants). | |

**User's choice:** Per tenant, rolling 24h.

---

### Q: Breach action — what happens at 100% budget?
| Option | Description | Selected |
|--------|-------------|----------|
| Hard 402 — kill-switch | 402 on next call; agent sees structured error. | ✓ |
| Warn + 5% grace | Warn at 100%, stop at 105%. | |
| Warn only, never block | No enforcement in 202; defer to 205. | |

**User's choice:** Hard 402 — kill-switch.

---

### Q: Budget visibility — where do operators see usage?
| Option | Description | Selected |
|--------|-------------|----------|
| /settings/mcp + audit rows | Dedicated UI + source_domain='mcp' audit rows. | ✓ |
| Audit rows only, no UI | Defer UI to 205. | |
| Real-time via MCP resource | mcp://markos/usage resource. | |

**User's choice:** /settings/mcp + audit rows.

---

## Tool safety (injection + confusion)

### Q: Output schema enforcement — how strict is tool response validation?
| Option | Description | Selected |
|--------|-------------|----------|
| Strict AJV validate on every call | Every response validated against F-contract. | ✓ |
| Strict in dev, warn in prod | Dev-only enforcement. | |
| None (trust handlers) | Current 0-day behavior. | |

**User's choice:** Strict AJV validate on every call.

---

### Q: Prompt-injection defense at tool input?
| Option | Description | Selected |
|--------|-------------|----------|
| Strict input schema + deny-list | AJV + known-injection-string filter. | ✓ |
| Schema only | AJV types + required; no content scan. | |
| Schema + LLM-based classifier | Classifier per call. | |

**User's choice:** Strict input schema + deny-list.

---

### Q: Tool output data-exfil guardrail?
| Option | Description | Selected |
|--------|-------------|----------|
| Tenant-scoped only | Every read declares tenant_id filter; cross-tenant rejected. | ✓ |
| Tenant-scoped + PII redaction | Tenant scope + redact PII in outputs. | |
| Tenant-scoped + allowlist fields | Whitelist exact output fields per contract. | |

**User's choice:** Tenant-scoped only.

---

### Q: Human-in-the-loop gate for destructive mutations — what UI confirms?
| Option | Description | Selected |
|--------|-------------|----------|
| Inline approval_token round-trip (no UI) | Agent handles in reasoning loop. | ✓ |
| Operator email/push confirm | Strongest; breaks autonomous flows. | |
| Inline + /settings/mcp approval queue UI | Round-trip + oversight queue. | |

**User's choice:** Inline approval_token round-trip (no UI).

---

## Rate-limits + latency contract

### Q: Rate-limit shape — how are tool calls throttled beyond cost-cap?
| Option | Description | Selected |
|--------|-------------|----------|
| 60 rpm/session + 600 rpm/tenant | Tier-1 default; room for swarms. | ✓ |
| No per-minute, cost-cap only | Simplest; hot-loop risk. | |
| 120 rpm/session + 1200 rpm/tenant + burst | Higher ceiling + burst. | |

**User's choice:** 60 rpm/session + 600 rpm/tenant.

---

### Q: Session p95 ≤ 300ms contract — how enforced/measured?
| Option | Description | Selected |
|--------|-------------|----------|
| Instrumented + Vercel Observability | Per-tool spans; alert at 15-min window. | ✓ |
| Audit-log sampled metrics only | Duration_ms on audit row. | |
| Synthetic cron probe | vercel.ts cron probing health. | |

**User's choice:** Instrumented + Vercel Observability.

---

### Q: What counts as a "simple tool" for the 300ms SLO?
| Option | Description | Selected |
|--------|-------------|----------|
| Non-LLM read tools only | list_*, explain_*, get_* — DB-bound. | ✓ |
| All tools, no distinction | Uniform target. | |
| Manifest-declared tier per tool | simple / llm / long tiers per F-contract. | |

**User's choice:** Non-LLM read tools only.
**Notes:** Implementation still uses per-F-contract `latency_tier` (simple/llm/long) to declare targets (300ms/5s/30s respectively). "Non-LLM read tools" maps to `simple`.

---

### Q: Rate-limit storage backing — where are counters kept?
| Option | Description | Selected |
|--------|-------------|----------|
| Upstash Redis | Reuses Phase 201 rate-limit infra. | ✓ |
| @vercel/edge-config | 60s propagation unsuitable for counters. | |
| Supabase in-memory window | No new infra; slow at scale. | |

**User's choice:** Upstash Redis.

---

## Marketplace + pricing posture

### Q: Pricing posture — free tier vs paid?
| Option | Description | Selected |
|--------|-------------|----------|
| Free: read-only tools + $1/day cap | Read-only free; writes require paid seat. | ✓ |
| Free: all tools + $0.50/day cap | Full surface free with tighter cap. | |
| Paid-only listing | No free tier; lowest install volume. | |

**User's choice:** Free tier = read-only tools + $1/day cost cap.

---

### Q: Listing category on Claude Marketplace?
| Option | Description | Selected |
|--------|-------------|----------|
| Marketing + Content Generation | Matches existing marketplace.json. | ✓ |
| Developer Tools + Analytics | Developer-native ICP reach. | |
| Productivity + CRM | Solo/agency appeal. | |

**User's choice:** Marketing + Content Generation.

---

### Q: Install-tracking for 50-installs-in-30d KPI?
| Option | Description | Selected |
|--------|-------------|----------|
| OAuth grant counter | source_domain='mcp' action='session.created'. | |
| Built-in marketplace analytics | Opaque; delayed. | |
| Both + weekly digest email | Counter + dash + founders digest. | ✓ |

**User's choice:** Both + weekly digest email.

---

### Q: Listing copy tone?
| Option | Description | Selected |
|--------|-------------|----------|
| Developer-native + quietly confident | Spec-heavy; matches brand stance Q-B. | ✓ |
| Outcome-led + marketing-team voice | Outcome-forward; broader appeal. | |
| Benchmark-led | Numbers-forward; procurement-friendly. | |

**User's choice:** Developer-native + quietly confident.

---

## MCP resources + streaming

### Q: Expose MCP Resources (read-only URIs)?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes — 3 resources in 202 | canon, literacy, tenant/status. | ✓ |
| Yes — 1 resource only (canon) | Start small; expand 202.1. | |
| No — tools-only for 202 | Skip resources. | |

**User's choice:** Yes — 3 resources in 202.

---

### Q: Streaming / progress notifications for long tools?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes — for LLM tools (draft, plan_campaign, audit_claim) | SSE during token streaming. | ✓ |
| Yes — only for tools > 2s | Based on latency_tier: long. | |
| No — buffered JSON-RPC only in 202 | Defer streaming to 202.1. | |

**User's choice:** Yes — for LLM tools.

---

### Q: Resource change-notify — how do clients learn of updates?
| Option | Description | Selected |
|--------|-------------|----------|
| notifications/resources/updated on every canon/literacy write | Server pushes to subscribed sessions. | ✓ |
| Poll-only (no notifications in 202) | Client-side ETag polling. | |
| Notifications only for canon, not literacy/status | Pragmatic filter. | |

**User's choice:** notifications/resources/updated on every canon/literacy write.

---

### Q: Tool handler compute budget?
| Option | Description | Selected |
|--------|-------------|----------|
| 30s simple / 120s LLM / 300s long | Three tiers via F-contract. | ✓ |
| 60s hard for every tool | Uniform cap. | |
| Per-tool declared timeout_ms | Each contract declares. | |

**User's choice:** 30s simple / 120s LLM / 300s long.

---

## Observability + release channel

### Q: Request ID propagation — how do MCP calls correlate?
| Option | Description | Selected |
|--------|-------------|----------|
| UUID per JSON-RPC call, echoed in audit + logs | mcp-req-<uuid> everywhere. | ✓ |
| Use client-supplied JSON-RPC id | Reuse envelope id; collision risk. | |
| Session-scoped seq only | Simplest; hardest to trace. | |

**User's choice:** UUID per JSON-RPC call, echoed in audit + logs.

---

### Q: Structured log shape — where do MCP logs go?
| Option | Description | Selected |
|--------|-------------|----------|
| Vercel Log Drains → structured JSON | One JSON per event; SIEM-ready for SOC 2. | ✓ |
| Audit table only | source_domain='mcp' rows only. | |
| Both — audit + Vercel logs | Duplicate writes. | |

**User's choice:** Vercel Log Drains → structured JSON.

---

### Q: Release channel — canary vs GA listing?
| Option | Description | Selected |
|--------|-------------|----------|
| Single GA listing only | One marketplace entry. | ✓ |
| GA + Canary endpoints | /api/mcp/canary for opt-in. | |
| Rolling Releases via Vercel | Server-side gradual roll-out. | |

**User's choice:** Single GA listing only.
**Notes:** Rolling Releases still expected as a server-side roll-out safety net (D-31) but marketplace listing surface is single GA.

---

### Q: Error reporting — do handler exceptions go to Sentry?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes — @sentry/nextjs wraps every handler | Sentry + req_id + generic external error. | ✓ |
| Audit-only error capture | source_domain='mcp' audit row only. | |
| Both | Sentry + audit row. | |

**User's choice:** Yes — @sentry/nextjs wraps every handler.
**Notes:** D-32 adds an audit row alongside the Sentry capture so the audit fabric stays complete; captured as "Sentry wraps every handler + audit row emitted" during the context write step.

---

## Claude's Discretion

Deferred to downstream agents:
- Concrete `markos_mcp_sessions` SQL + RLS (columns locked in decisions; types + indexes open)
- Cost-table bootstrap values (provider rates — research at plan time)
- Exact `/oauth/authorize` + `/oauth/token` handler + consent-page UI (reuse Phase 201 CSS)
- Plan decomposition — target ≤ 10 plans across 3 waves
- `@sentry/nextjs` integration version + setup matching project conventions

## Deferred Ideas

- Cursor / Windsurf / Warp / ChatGPT certifications → 202.1 or dedicated cert phase
- Per-session cost as MCP resource (`mcp://markos/usage`)
- PII redaction layer on tool outputs
- LLM-based input classifier for injection defense
- Operator email/push for destructive-op HITL
- Canary marketplace endpoint
- Computer-use / browser-agent tools → Phase 235
- 3rd-party agent marketplace → Phase 213 alpha
- Marketplace paid tier as Stripe subscription → Phase 205
- SIEM fan-out + SOC 2 evidence collection → Phase 206
