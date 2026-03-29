---
token_id: MARKOS-RES-AUD-01
document_class: RESEARCH
version: "1.0.0"
status: populated
populated_by: markos-onboarder
populated_at: 2025-07-18
feeds_into:
  - MIR/Market_Audiences/AUDIENCES.md
  - MIR/Market_Audiences/ICPs.md
  - MIR/Market_Audiences/SEGMENTS.md
  - MIR/Market_Audiences/BUYER-JOURNEY.md
---

# Audience Research — MarkOS

<!-- markos-token: RESEARCH -->

---

## Primary Segments

**Segment 1 — Developer-Adjacent Founders (SEG-001)**
- Characteristics: Solo founders or 1-3 person teams, ship AI-powered products, technically literate, use VS Code, GitHub, cursor, local models. Understand marketing matters but have no system for it. Have tried "prompt engineering their way" through marketing and hit walls.
- Platform: X/Twitter (primary discovery), GitHub (tool adoption), Reddit r/SideProject r/entrepreneur
- Buying trigger: Shipped a product, got silence. "I built it but nobody installed it" moment triggers urgent search for marketing system.
- Deal-breaker: Requires SaaS signup, ongoing dashboard management, or any "black box" where they can't see what's happening.
- Size: Estimated tens of thousands globally active on X/GitHub in AI-native builder communities. Source: Community observation. Confidence: Medium. Implication: This segment is the install-volume driver — optimize for friction-free adoption and word-of-mouth.

**Segment 2 — AI-Forward Technical Marketing Leads (SEG-002)**
- Characteristics: Marketing manager or head of growth at 10-50 person tech startup. Responsible for marketing without a full team. Already using AI tools (ChatGPT, Claude, Notion AI) but finds outputs inconsistent — "it doesn't know our brand." Needs structure, not more AI features.
- Platform: LinkedIn (professional research), X/Twitter (community), Product Hunt (tool discovery)
- Buying trigger: Onboarded their 3rd AI tool and realized outputs are still generic. "None of these tools know who we are" is the explicit trigger language.
- Deal-breaker: Requires IT approval/security review up front (pre-revenue), or demands a long-form sales process.
- Size: Large — every Series A startup with <5 marketing headcount faces this problem. Confidence: Medium. Implication: This segment drives pilot conversion — they have budget authority and recognize the structured intelligence value.

**Segment 3 — Indie Hackers / Bootstrapped Builders (SEG-003)**
- Characteristics: Single-product builders, MRR-focused, launch frequently on Product Hunt, Hacker News. Treat marketing as engineering problem ("I need a system that runs itself"). Zero marketing budget. High DIY ethic.
- Platform: Hacker News (show HN discussions), X/Twitter, Indie Hackers community
- Buying trigger: Wasted time on scattered AI marketing experiments. Wants "marketing infra I set up once."
- Deal-breaker: Recurring cost before any revenue. Requires any form of commitment before value is proven.
- Size: Large indie hacker community globally (~300K+ on Indie Hackers platform alone). Confidence: Medium. Implication: Freemium is essential for this segment. Volume driver. Convert to paid when they hit scale.

Source: Gate 1 audience intake, JTBD-MATRIX.md. Confidence: Medium (all three segments are hypothesis-validated but not user-validated — first 200 installs will confirm segment mix).

---

## Ideal Customer Profile (ICP)

**Primary ICP: The AI-Ready Operator (ICP-01)**

| Attribute | Detail |
|-----------|--------|
| Role | Founder, co-founder, or solo operator |
| Company size | 1-25 people |
| Stage | Pre-revenue to early revenue ($0–$50K MRR) |
| Industry | IT, SaaS, AI tooling, developer tools, tech-forward services |
| Tech stack | VS Code, GitHub, AI coding assistants, local LLMs or API-based AI |
| Marketing reality | No dedicated marketer. Owner does all marketing. Has tried ChatGPT for content. Results inconsistent. |
| Primary goal | Get first 100 users / 10 paying customers without hiring a marketing team |
| Core frustration | "I have AI tools but my outputs are generic — the AI doesn't know my brand or strategy" |
| Decision process | Self-serve research → GitHub check → install and evaluate → buy if valuable |
| Budget authority | Full authority. Budget is time, not money (pre-revenue) |
| Success metric | Install-to-active rate, pilot conversion rate, word-of-mouth referrals |

**Why this ICP is highest value:** They self-serve fast (no sales motion needed), they have highest word-of-mouth potential in tight dev communities, and they face the exact problem MarkOS was designed to solve. Source: Gate 1 intake (ICP description), JTBD-MATRIX.md. Confidence: High on problem fit, Medium on segment size.

---

## Psychographic Profile

**Core identity:** "I figure things out myself." Extreme self-reliance and allergic to hand-holding. Proud of their technical problem-solving. Measure themselves against other builders, not against traditional marketers.

**Values:** Systematic thinking, efficiency, autonomy, building in public, shipping over perfecting, first-principles approaches to solved problems.

**What they want to be seen as:** A builder who executes at a high level — not just technically, but operationally. Being known as someone who "has their systems dialed" is aspirational. Fear: being seen as someone who builds without traction (the "technical founder who can't market" archetype).

**What they brag about to peers:** "I automated my marketing pipeline." "I have a system for this." "Our installs have been growing week-over-week." Install counts, GitHub stars, and organic mentions are status signals in this community.

**What they fear:** Wasted time on tools that don't work. Appearing to do marketing theater (activity without outcomes). Being locked into expensive tools before product-market fit. Generic AI outputs that embarrass them with their professional audience.

**Beliefs about marketing:** Skeptical of "marketing magic." Believe marketing is a solvable systems problem, not a creative black art. Respect data, mechanisms, and repeatability over vibes and brand storytelling. However: they know they're not equipped to build the marketing system from scratch — that's why MarkOS matters.

Source: JTBD-MATRIX.md (emotional/social jobs, pains, gains), Gate 1 audience intake. Confidence: Medium (derived from JTBD analysis; not yet user-interview validated).

---

## Behavioral Triggers & Buying Journey

**Primary trigger:** Failed DIY AI marketing experiment. The trigger event is specific: they used ChatGPT/Claude to "write some marketing content" and the output was correctly spelled but generically wrong — it didn't reflect their actual voice, positioning, or audience insight. The trigger is the realization that AI tools don't solve the underlying intelligence gap.

**Secondary triggers:**
- Shipped a product to silence (0 downloads, no installs)  
- Spent >3 hours on a marketing task that should take 30 minutes
- Saw a competitor gain traction with seemingly less-good technology
- Onboarded a 3rd AI tool and still getting generic outputs

**Journey mapping:**

| Stage | State | What They Need | Risk of Loss |
|-------|-------|----------------|--------------|
| **Unaware** | "I'll just prompt my way through this" | Nothing yet — not looking | Low |
| **Problem-aware** | "These AI tools keep giving me generic outputs" | Validation that the problem is real and systemic | Medium |
| **Solution-aware** | "There must be a better system for this" | Proof that MarkOS solves the root cause, not just symptoms | High |
| **Evaluating** | "Does this actually work?" | Install frictionlessness + transparent architecture | Very High |
| **Decision** | "I'll run the install and see" | Speed-to-value in first 5 minutes | Critical |
| **Pilot** | "This is promising, what would a paid version give me?" | Concrete pilot value offer, no sales pressure | High |

**Key moments of doubt (and required reassurance):**
1. "Is this just another prompt template tool?" → Reassurance: Architecture diagram showing MIR/MSP separation — it's infrastructure, not prompts
2. "Will this work with my existing stack?" → Reassurance: Works alongside VS Code, GSD, any LLM. No replacement required.
3. "What does 'paid pilot' actually mean?" → Reassurance: Clear pilot scope, founder involvement, defined deliverables

Source: JTBD-MATRIX.md (decision triggers, copy anchors), Gate 1 intake. Confidence: Medium (journey is hypothesized, not user-tested).

---

## Language & Vocabulary

**Words they use to describe their problem:**
- "My AI outputs are generic" / "It doesn't know our brand"
- "I'm doing marketing theater" (activity without results)
- "I don't have a system for this"
- "I've tried [tool] but the outputs are all the same"
- "I wasted 3 hours on something that should take 20 minutes"
- "My prompts are spaghetti"

**Words they trust (resonate):** framework, architecture, protocol, system, pipeline, structured, versioned, auditable, first-principles, developer-friendly, open, local-first, composable

**Words that repel them:** "AI-powered" (overused, meaningless), "effortless" (condescending), "magic" (non-mechanistic), "revolutionary" (hyperbole), "all-in-one" (lock-in signal), "no code" (condescending to technical audience), "simple" (removes credit for their skill)

**Jargon they trust:** MIR, MSP, RAG, context window, embeddings, token budget, system prompt, agents, protocol, local LLM, schema, override layer, idempotent

**Jargon that marks outsiders:** "viral content," "brand storytelling" (un-systematic), "content pillars" (feels like agency-speak), "funnel hacking"

Source: Gate 1 brand intake (vocabulary allowed/prohibited), VOICE-TONE.md, JTBD-MATRIX.md (copy anchors). Confidence: Medium (extrapolated from founder positioning input — needs validation with real user language from first community interactions).

---

## Channel Preferences

**SEG-001 / SEG-003 (Developer-adjacent founders, indie hackers):**
- Primary: X/Twitter — This is where developer builders share tools, wins, and experiments. Short threads with technical depth perform well. Build-in-public posts with real data get shared.
- Secondary: GitHub — Discovery via README, trending repositories, topic search. Stars = social proof in this community.
- Tertiary: Reddit — r/SideProject, r/entrepreneur, r/LocalLLaMA, r/MachineLearning for specific problem discussions. High-value, low-friction authentic participation.
- Dark horse: Hacker News Show HN — High-risk, high-reward. A good Show HN can drive 500+ installs in 24 hours. Bad Show HN is ignored.
- Preferred format: Technical depth > polish. Working demos > feature lists. Honest failure posts > success theater. Prefer to discover tools via peer recommendation, not ads.

**SEG-002 (Technical marketing leads at startups):**
- Primary: LinkedIn — Professional research and peer validation. Watch what impressive peers endorse.
- Secondary: X/Twitter — Keep up with AI tooling news.
- Tertiary: Product Hunt — For tool launches, not daily discovery.
- Preferred format: Case studies with real numbers, comparisons with named competitors, "how we built/use this" first-person narratives from credible operators.

**Content format performance hypothesis:** Short X threads (6-10 posts) with a real mechanism explanation > polished marketing copy. GitHub README with an honest "what this is and isn't" > feature lists. These are hypotheses — to be validated with first 60 days of content data.

Source: Gate 1 audience channels input ("X/Reddit/dev communities"), Gate 2 KPI-FRAMEWORK (channel KPIs). Confidence: Medium (channel selection is evidence-based hypothesis, not user-validated). Implication: Content calendar for Q1 should weight X/Twitter + GitHub + Reddit over LinkedIn, with one HN attempt at launch.

---
*Research Quality Gate: All sections include evidence source, confidence level, and strategic implication.*
*Last populated: 2025-07-18 | Populated by: markos-onboarder | Source: Gate 1 + Gate 2 MIR intake*

