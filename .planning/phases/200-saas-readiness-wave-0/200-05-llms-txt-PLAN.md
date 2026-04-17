---
phase: 200-saas-readiness-wave-0
plan: 05
type: execute
wave: 1
depends_on: []
files_modified:
  - public/llms.txt
  - public/robots.txt
  - app/docs/llms-full.txt/route.ts
  - app/(marketing)/docs/[[...slug]]/page.tsx
  - scripts/docs/build-md-mirror.cjs
  - test/docs/llms-txt.test.js
autonomous: true
must_haves:
  truths:
    - "public/llms.txt served at /llms.txt returns curated index matching spec llmstxt.org"
    - "GET /docs/llms-full.txt returns concatenated markdown of all docs pages"
    - "Every /docs/<slug> HTML page also resolves at /docs/<slug>.md with raw markdown body"
    - "public/robots.txt allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot, CCBot, ChatGPT-User"
    - "llms-full.txt endpoint uses Cache-Control with ISR or route.ts cacheLife"
  artifacts:
    - path: "app/docs/llms-full.txt/route.ts"
      provides: "Concatenated markdown endpoint"
    - path: "public/llms.txt"
      provides: "llms.txt curated index"
    - path: "public/robots.txt"
      provides: "AI-bot-friendly robots policy"
---

<objective>
Make MarkOS docs first-class citizens in AI search and agent retrieval. Publish
`/llms.txt`, a concatenated `/docs/llms-full.txt`, and a `.md` mirror for every docs page.
Unblock AI bots in robots.txt.
</objective>

<context>
@.planning/phases/200-saas-readiness-wave-0/200-OVERVIEW.md
@app/(marketing)/docs/[[...slug]]/page.tsx
@public/robots.txt
</context>

<tasks>

<task type="auto">
  <name>Task 1: llms.txt manifest</name>
  <files>public/llms.txt</files>
  <action>
Author static llms.txt per llmstxt.org spec: H1 project name, blockquote summary, sections
for Docs / API / Examples with absolute URLs to key pages.
  </action>
  <verify>curl / returns the file; spec validator passes</verify>
</task>

<task type="auto">
  <name>Task 2: llms-full.txt route</name>
  <files>app/docs/llms-full.txt/route.ts, scripts/docs/build-md-mirror.cjs</files>
  <action>
Next.js App Router route.ts that at build (or cached per hour via cacheLife) walks the docs
MDX source, strips MDX to plain markdown, concatenates in nav order, returns text/plain.
  </action>
  <verify>curl /docs/llms-full.txt returns >10KB markdown</verify>
</task>

<task type="auto">
  <name>Task 3: .md mirror</name>
  <files>app/(marketing)/docs/[[...slug]]/page.tsx</files>
  <action>
Detect Accept: text/markdown header or .md suffix in the catch-all route, and respond with raw
markdown body instead of rendered HTML. Keep HTML default.
  </action>
  <verify>curl /docs/quickstart.md returns markdown body; /docs/quickstart returns HTML</verify>
</task>

<task type="auto">
  <name>Task 4: robots.txt allow-list</name>
  <files>public/robots.txt</files>
  <action>
Update robots.txt to explicitly Allow the 7 AI crawlers. Keep existing rules for other bots.
  </action>
  <verify>grep -c "GPTBot\|ClaudeBot\|PerplexityBot\|Google-Extended\|OAI-SearchBot\|CCBot\|ChatGPT-User" public/robots.txt returns 7</verify>
</task>

<task type="auto">
  <name>Task 5: Smoke test</name>
  <files>test/docs/llms-txt.test.js</files>
  <action>
node:test hits /llms.txt, /docs/llms-full.txt, /docs/quickstart.md (using next dev server on
a free port) and asserts 200 + expected content-type.
  </action>
  <verify>node --test test/docs/llms-txt.test.js passes</verify>
</task>

</tasks>

<success_criteria>
- [ ] llms.txt served
- [ ] llms-full.txt concatenated markdown served
- [ ] .md mirror works for every docs page
- [ ] 7 AI bots allow-listed
</success_criteria>
