---
phase: 200-saas-readiness-wave-0
plan: 08
type: execute
wave: 3
depends_on: [200-06]
files_modified:
  - app/(marketing)/integrations/claude/page.tsx
  - app/(marketing)/integrations/claude/demo/page.tsx
  - app/(marketing)/integrations/claude/demo/api/route.ts
  - test/marketing/claude-landing.test.js
  - public/integrations/claude/og.png
autonomous: true
must_haves:
  truths:
    - "Landing page at /integrations/claude renders with Canon-generated copy"
    - "Demo sandbox at /integrations/claude/demo runs an in-browser MCP playground against 200-06 MCP server"
    - "Demo completes a full draft-generation loop end-to-end"
    - "Voice classifier score ≥ 85 on landing copy"
    - "Page passes UI a11y (axe) and basic security checks (CSP present, no inline script without nonce)"
  artifacts:
    - path: "app/(marketing)/integrations/claude/page.tsx"
      provides: "Claude Marketplace landing page"
    - path: "app/(marketing)/integrations/claude/demo/page.tsx"
      provides: "In-browser MCP playground"
---

<objective>
Close the loop on the Claude Marketplace submission with a dedicated, on-brand landing page
and a working in-browser MCP playground so prospects can draft a message without signing up.

Marketing copy runs through the Canon pipeline (archetypes: solopreneur + vibe-coder; pains:
content_engagement + pipeline_velocity) so voice/tone matches the rest of the site.
</objective>

<context>
@.planning/phases/200-saas-readiness-wave-0/200-OVERVIEW.md
@.planning/phases/200-saas-readiness-wave-0/200-06-mcp-server-PLAN.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Landing page</name>
  <files>app/(marketing)/integrations/claude/page.tsx, public/integrations/claude/og.png</files>
  <action>
Next.js page with hero, 3 value props, tool grid (10 MCP tools), install instructions, CTA to
demo. Run copy through Canon generator; persist final copy in page. Add OG image.
  </action>
  <verify>Voice classifier score ≥ 85; axe a11y scan clean</verify>
</task>

<task type="auto">
  <name>Task 2: Demo sandbox</name>
  <files>app/(marketing)/integrations/claude/demo/page.tsx, app/(marketing)/integrations/claude/demo/api/route.ts</files>
  <action>
Client page with a minimal chat UI that streams against api/mcp/session.js (200-06). Server
route.ts proxies if CORS needed. Guest rate limit per IP.
  </action>
  <verify>E2E test drives a draft-generation loop and asserts final assistant message contains generated copy</verify>
</task>

<task type="auto">
  <name>Task 3: Test</name>
  <files>test/marketing/claude-landing.test.js</files>
  <action>
Playwright test loads page, runs axe, asserts score threshold, runs demo flow end-to-end.
  </action>
  <verify>npx playwright test test/marketing/claude-landing.test.js passes</verify>
</task>

</tasks>

<success_criteria>
- [ ] Landing page passes a11y + voice classifier
- [ ] Demo sandbox completes draft loop
- [ ] OG image present
- [ ] Security headers present
</success_criteria>
