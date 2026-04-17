#!/usr/bin/env node
// Scaffold the MarkOS Canon playbooks inside Obsidian vault:
//   - 27 Pain-Point Playbooks   (8 deep playbooks)
//   - 28 Message Crafting       (8 per-channel playbooks)
//   - 29 Brand System Templates (5 fillable operator templates)
// Idempotent. Preserves files > 500 bytes.

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..', '..');
const BASE = join(ROOT, 'obsidian', 'Literacy', 'Marketing Literacy');

const today = new Date().toISOString().slice(0, 10);

const fm = (desc, tags) =>
  `---\ndate: ${today}\ndescription: ${JSON.stringify(desc)}\ntags:\n${tags.map((t) => `  - ${t}`).join('\n')}\n---\n\n`;

async function existsAndNonTrivial(p) {
  try {
    const s = await stat(p);
    return s.size > 500;
  } catch {
    return false;
  }
}

async function ensureFile(path, content) {
  if (await existsAndNonTrivial(path)) return false;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
  return true;
}

// =============== 27 Pain-Point Playbooks ===============

const painPlaybooks = [
  {
    file: 'High Acquisition Cost Playbook.md',
    title: 'High Acquisition Cost Playbook',
    tag: 'high_acquisition_cost',
    disciplines: ['Paid Media', 'Content/SEO'],
    description: 'Diagnostic + treatment for CAC/CPL/CPR trending above benchmark. Root causes, treatments, agent routing, message tailoring, and measurement.',
    symptoms: [
      'CAC rose ≥ 20% QoQ without proportional revenue lift',
      'CPR above benchmark for ad format + objective',
      'Blended ROAS below profitability threshold',
      'Paid search CPC inflating faster than conversion rate',
      'Disproportionate reliance on one channel',
    ],
    roots: [
      'Audience mismatch — targeting decay, lookalike staleness',
      'Creative fatigue — ad fatigue score rising, CTR collapsing',
      'Landing-page friction — bounce + low CVR upstream of checkout',
      'Auction competition — new entrants bidding up the same queries',
      'Attribution illusion — MTA overstating under-pricing channels',
    ],
    treatments: [
      'Re-segment via first-party data; rebuild lookalikes from recent high-LTV cohorts',
      'Ship 3–5 new creative variants per week; retire ≤ 0.8× mean CTR',
      'CRO sprint on top-5 landing pages — friction audit + shipping',
      'Shift budget toward owned channels (SEO, email, community) as saturation proxies',
      'Run [[Incrementality Testing]] to reveal over-credited channels',
    ],
    literacy: ['Paid Media', 'Retail Media Network Landscape 2026', 'CTV Programmatic', 'MMM Revival', 'Incrementality Testing', 'Conversion & CRO'],
    angle: 'Efficiency and ROI. Proof: case study + benchmark. CTA: audit or demo.',
    agents: ['MARKOS-AGT-STR-01 Strategist', 'Funnel Analyst', 'Copy Drafter', 'Budget Monitor', 'Data Scientist'],
    success: ['CAC reduced ≥ 15% in 90 days at equal volume', 'Incrementality result confirms lift', 'No deterioration of downstream retention'],
  },
  {
    file: 'Low Conversions Playbook.md',
    title: 'Low Conversions Playbook',
    tag: 'low_conversions',
    disciplines: ['Paid Media', 'Landing Pages'],
    description: 'Funnel-step CVR below benchmark at ad → landing, landing → lead, lead → trial. Diagnostic + CRO treatments + message tailoring.',
    symptoms: [
      'Ad → LP CTR okay but LP → lead < 2.5% (B2B) / 4% (B2C)',
      'Form-started → submitted gap > 40%',
      'Cart abandonment > 70%',
      'Trial signup → activated < 30%',
    ],
    roots: [
      'Message-market mismatch: ad promised X, LP delivered Y',
      'Friction — form length, load time, trust gaps',
      'Weak proof — no testimonials, social proof, guarantees',
      'Wrong CTA — asking for too much too early (full demo vs lightweight trial)',
      'Mobile experience broken — 60%+ of traffic but CVR half of desktop',
    ],
    treatments: [
      'Message match audit — ensure ad promise = LP H1',
      'Friction tear-down — remove fields, add autofill, clarify next step',
      'Add social proof in first viewport (logos, quotes, counts)',
      'Swap primary CTA to lower-commitment step (calculator, audit, email course)',
      'Mobile-specific LP; one-thumb navigation',
    ],
    literacy: ['Conversion & CRO', 'Checkout Optimization 2026', 'AI Personalization at Scale', 'Landing Pages'],
    angle: 'Friction removal, trust, clarity. Proof: before/after, testimonial. CTA: self-serve trial.',
    agents: ['CRO Hypothesis', 'Copy Drafter', 'Funnel Analyst', 'Tracking Spec'],
    success: ['LP CVR increased ≥ 25% vs baseline', 'Form completion rate > 75%', 'No uptick in bad-fit leads downstream'],
  },
  {
    file: 'Retention & Churn Playbook.md',
    title: 'Retention & Churn Playbook',
    tag: 'poor_retention_churn',
    disciplines: ['Lifecycle Email', 'Product-Led Growth'],
    description: 'MRR churn rising, repeat-purchase declining, subscriber loss outpacing acquisition. Lifecycle + PLG treatments.',
    symptoms: [
      'Net MRR churn > 1% monthly (SaaS) or > 3% (consumer subscription)',
      'Repeat-purchase rate < 20% (e-com)',
      '30-day active users falling at constant signups',
      'Support tickets rising on onboarding steps',
    ],
    roots: [
      'Activation failure — users never hit the "aha" moment',
      'Value dilution — pricing/packaging out of alignment with usage',
      'No lifecycle nurture after activation',
      'Feature drift — product evolves faster than user education',
      'Competitor pressure — easier, cheaper, or better alternatives',
    ],
    treatments: [
      'Map activation event; instrument rigorously',
      'Build lifecycle flows: welcome → onboarding → feature-discovery → expansion → winback',
      'Health scoring — leading indicators (logins, depth, collaboration)',
      'Success-manager or support intervention at risk thresholds',
      'Reverse trial or downgrade flow to preserve LTV at pricing friction',
    ],
    literacy: ['Email & Lifecycle', 'Lifecycle Flow Patterns', 'Product-Led Growth', 'Product-Qualified Leads', 'Usage-Based Pricing 2026'],
    angle: 'Value reinforcement, lifecycle rigor. Proof: usage data, health score. CTA: feature education.',
    agents: ['Email Sequence', 'Copy Drafter', 'Funnel Analyst', 'Performance Monitor'],
    success: ['Monthly churn reduced ≥ 25%', 'Expansion MRR up', '90-day retention improved'],
  },
  {
    file: 'Organic Visibility Playbook.md',
    title: 'Organic Visibility Playbook',
    tag: 'low_organic_visibility',
    disciplines: ['Content/SEO', 'GEO'],
    description: 'Rankings stagnant, organic share declining, AI-engine citations absent. Classical SEO + GEO treatments.',
    symptoms: [
      'Target keywords not ranking in top 20',
      'Organic traffic flat or declining',
      'Brand not appearing in AI Overview / ChatGPT Search / Perplexity citations',
      'Featured snippets lost to competitors',
    ],
    roots: [
      'Content thin relative to competitors — lower E-E-A-T',
      'Entity confusion — brand not disambiguated in knowledge graph',
      'Technical debt — crawlability, index coverage, Core Web Vitals',
      'No AI-crawler strategy — `robots.txt` blocks GPTBot/ClaudeBot or is absent',
      'No original data or expert contribution',
    ],
    treatments: [
      'Pillar-cluster-atomic content restructure',
      'Entity SEO — Wikipedia/Wikidata presence, consistent schema',
      'Publish original data (surveys, benchmarks, research)',
      'Ship `llms.txt` + allow AI crawlers',
      'Technical audit — schema, speed, mobile, structured FAQs',
    ],
    literacy: ['SEO & Organic Discovery', 'Generative Engine Optimization', 'Zero-Click Search', 'Entity SEO', 'llms.txt Standard', 'Content Marketing', 'Programmatic SEO'],
    angle: 'Authority, discoverability. Proof: ranking deltas, citation counts. CTA: audit or content plan.',
    agents: ['SEO Planner', 'Content Brief', 'Content Creator', 'Copy Drafter'],
    success: ['Target keywords in top 10 for 60% within 120 days', 'AI-engine citations ≥ N per quarter', 'Organic traffic +30% YoY'],
  },
  {
    file: 'Attribution & Measurement Playbook.md',
    title: 'Attribution & Measurement Playbook',
    tag: 'attribution_measurement',
    disciplines: ['Paid Media', 'Analytics'],
    description: 'Fragmented data, conflicting channel reports, no causal confidence. MMM + incrementality + clean-room treatments.',
    symptoms: [
      'Channels self-report > 150% of actual revenue (double-counted)',
      'MTA last-click vs data-driven models diverge by > 30%',
      'iOS / Safari traffic uncorrelated with modeled attribution',
      'Finance does not trust marketing reports',
    ],
    roots: [
      'Cookie deprecation + privacy changes broke MTA',
      'Consent Mode v2 misconfigured → data loss',
      'No incrementality baseline',
      'Walled-garden reporting treated as ground truth',
      'Missing server-side tagging (CAPI, Enhanced Conversions)',
    ],
    treatments: [
      'Deploy Google Consent Mode v2 Advanced + IAB TCF v2.2',
      'Server-side tagging: Meta CAPI, Google Enhanced, TikTok Events v3, LinkedIn CAPI',
      'Monthly MMM via Meridian / Robyn / Recast',
      'Quarterly incrementality tests per top-spend channel',
      'Unified Measurement dashboard',
    ],
    literacy: ['Data, Analytics & Measurement', 'MMM Revival', 'Incrementality Testing', 'Unified Measurement', 'Google Consent Mode v2', 'Cookie Deprecation Status 2026', 'Data Clean Rooms', 'Attention Metrics'],
    angle: 'Clarity and causality. Proof: experiment readouts, MMM curves. CTA: consultation or diagnostic.',
    agents: ['Data Scientist', 'Analyst', 'Tracking Spec', 'UTM Architect', 'Performance Monitor'],
    success: ['Finance signs off on marketing P&L attribution', 'Incrementality calibrated MMM with < 15% deviation', 'All top-5 channels have recent lift result'],
  },
  {
    file: 'Audience Mismatch Playbook.md',
    title: 'Audience Mismatch Playbook',
    tag: 'audience_mismatch',
    disciplines: ['All discipline — cross-cutting'],
    description: 'Reach the wrong people. Bounce high, downstream conversion and retention poor. Re-segmentation + ICP sharpening treatments.',
    symptoms: [
      'Bounce > 70% on top-traffic LPs',
      'Demo signups but < 30% are ICP-fit',
      'High CAC, low LTV on acquired cohorts',
      'Unsubscribe + complaint rates above benchmark',
    ],
    roots: [
      'ICP drift — market changed, definition did not',
      'Broad targeting not offset by strong filtering',
      'Wrong channel mix — reaching adjacent but not true buyers',
      'Archetype fiction — persona built from assumptions not evidence',
    ],
    treatments: [
      'Refresh [[Audience Archetype Canon|archetypes]] via fresh research',
      'Segment by LTV, not channel; rebuild targeting from top-decile seeds',
      'Channel audit — prune 1–2 channels delivering low-fit traffic',
      'Gate lead magnets with 1–2 qualifying questions',
      'Kill ad campaigns that historically fill top-of-funnel but bottom-of-pipeline poorly',
    ],
    literacy: ['Audience & Segmentation', 'Ideal Customer Profile', 'Buying Committee Mapping', 'Predictive Audiences', 'Account-Based Marketing'],
    angle: 'Precision over volume. Proof: cohort analytics, fit scores. CTA: audience workshop.',
    agents: ['Audience Intel', 'Lead Scorer', 'Data Scientist'],
    success: ['ICP-fit of new signups > 70%', 'LTV on acquired cohorts up ≥ 20%', 'Lead → opp conversion up'],
  },
  {
    file: 'Pipeline Velocity Playbook.md',
    title: 'Pipeline Velocity Playbook',
    tag: 'pipeline_velocity',
    disciplines: ['Lifecycle Email', 'Sales Enablement'],
    description: 'Leads stall mid-funnel. Nurture sequences fail to progress. Handoff gaps. Treatments via lifecycle + SLA design.',
    symptoms: [
      'Opp-aging > 60 days in mid-stage',
      'Nurture open + reply rates decaying over a sequence',
      'MQL → SQL conversion < 10%',
      'Reps complain leads are unqualified',
    ],
    roots: [
      'Weak nurture — generic, rhythm-only, no pain matching',
      'No handoff SLA between marketing and sales',
      'Missing mid-funnel content (comparison, ROI, integration)',
      'No lead scoring updates; sales works stale list',
      'Unclear next step in each message — no micro-commit',
    ],
    treatments: [
      'Rebuild nurture by pain-tag; one sequence per dominant pain',
      'Set lead-routing SLA; escalation rules for stalled opps',
      'Add BOFU content: ROI calculator, case studies, implementation guides',
      'Re-instrument lead scoring with product-usage + intent data',
      'Every email includes one concrete next step',
    ],
    literacy: ['Email & Lifecycle', 'Lifecycle Flow Patterns', 'B2B Cold Email Marketing', 'Account-Based Marketing', 'Marketing Ops & RevOps'],
    angle: 'Speed and rigor. Proof: funnel stats, opp aging. CTA: sequence starter or playbook.',
    agents: ['Email Sequence', 'Copy Drafter', 'Lead Scorer', 'Automation Architect'],
    success: ['Mid-stage opp aging reduced ≥ 30%', 'MQL → SQL conversion up', 'Reply rates on nurture stable across sequence'],
  },
  {
    file: 'Content Engagement Playbook.md',
    title: 'Content Engagement Playbook',
    tag: 'content_engagement',
    disciplines: ['Social', 'Content/SEO'],
    description: 'Content published but not resonating. Low shares, low comments, low return visits. Treatments: hooks, distribution, community.',
    symptoms: [
      'Social posts < 0.5% engagement rate',
      'Newsletter CTR < 2%',
      'Blog time-on-page < 60 seconds',
      'Zero UGC or reshares',
    ],
    roots: [
      'Hook failure — first 2 seconds or 2 lines do not stop the scroll',
      'Wrong format for platform (long-form on TikTok, short on LinkedIn)',
      'Content matches vanity keywords, not audience pain',
      'Distribution-only strategy without community seeding',
      'No distinctive POV — vanilla vs. differentiated take',
    ],
    treatments: [
      'Hook rewrite sprint — A/B 5 hooks per piece',
      'Platform-native reshape; do not repurpose unchanged',
      'Pain-first topic selection — content that solves a concrete issue',
      'Seed in 3–5 relevant communities first; amplify on public social',
      'POV editor — every piece has a take, not a summary',
    ],
    literacy: ['Content Marketing', 'Social & Community', 'Founder-Led Content', 'Community-Led Growth', 'Pillar · Cluster · Atomic', 'Influencer & Creator Economy'],
    angle: 'Resonance, cultural fit, POV. Proof: share counts, saves, replies. CTA: content sprint or community invite.',
    agents: ['Content Creator', 'Social Drafter', 'Copy Drafter', 'Performance Monitor'],
    success: ['Engagement rate ≥ 2× baseline', 'Time-on-page > 2 minutes on flagship posts', 'Organic shares per piece trending up'],
  },
];

// =============== 28 Message Crafting per-channel ===============

const messageCrafting = [
  {
    file: 'Email Message Crafting.md',
    title: 'Email Message Crafting',
    channel: 'email',
    description: 'Per-channel crafting playbook for email — subject, preview, body, CTA, format, deliverability + voice constraints.',
    constraints: [
      'Subject 30–60 chars; preview 50–100; body per type (transactional 50–150, nurture 150–300, long 300–500).',
      'Plain-text parity.',
      'One primary CTA, optional secondary if orthogonal.',
      'SPF/DKIM/DMARC aligned; BIMI optional.',
      'Unsubscribe link + physical address (CAN-SPAM).',
    ],
    structure: [
      'Subject — one hook: curiosity OR specificity',
      'Preview — complements, does not repeat',
      'Opening line — name the reader\'s situation',
      'Body — 1 pain acknowledged + 1 promise + 1 proof + 1 CTA',
      'Sign-off — consistent sender identity',
    ],
    hooks: ['personal context', 'provocative stat', 'question echoing pain', 'direct claim', 'name-drop authority'],
    proof: ['customer quote', 'metric with context', 'case study micro-snippet', 'expert reference'],
    antiPatterns: ['"I hope this finds you well"', 'AI clichés', 'multi-CTA spray', 'emoji overuse', 'sender lookalike spam'],
    voice: 'Conversational, direct, warm for nurture; cooler for cold.',
  },
  {
    file: 'Ad Message Crafting.md',
    title: 'Ad Message Crafting',
    channel: 'ad',
    description: 'Per-channel crafting playbook for paid ads — headline, description, creative, disclosure, per-platform guidance.',
    constraints: [
      'Headline ≤ 30 chars main; variants 15/25/30.',
      'Description: one-sentence proposition + one proof hint.',
      'Creative: brand-consistent LoRA; AI-gen labelled per platform + EU AI Act.',
      'Compliance: specific claims sourced to claim library.',
      'Frequency cap set; fatigue-aware rotation.',
    ],
    structure: [
      'Hook headline — pain or promise',
      'Description — specific proof',
      'Visual — one idea, thumb-stop',
      'CTA — verb + specific outcome',
      'Disclosure — AI + comparison claims',
    ],
    hooks: ['direct claim', 'pattern interrupt', 'social proof stat', 'category redefinition'],
    proof: ['specific %, $, × metric', 'brand logo row', 'case study thumbnail'],
    antiPatterns: ['vague superlatives', 'CTA-less creative', 'brand-logo-as-copy', 'stock photo + bold text'],
    voice: 'Blunt on X/Meta; professional on LinkedIn; dynamic on TikTok.',
  },
  {
    file: 'Landing Page Message Crafting.md',
    title: 'Landing Page Message Crafting',
    channel: 'landing page',
    description: 'Crafting playbook for LPs — H1, sub-head, first viewport, body, CTA, proof, trust.',
    constraints: [
      'H1 ≤ 10 words; promise specific.',
      'Sub-head ≤ 20 words; proof or differentiator.',
      'First 100 words answer who · what · why-now · why-you.',
      'Social proof in first viewport.',
      'One primary CTA; secondary for hesitant.',
      'Mobile-first; one-thumb nav.',
    ],
    structure: [
      'Hero — H1 + sub-head + primary CTA + hero image/video',
      'Proof row — logos, quote, count',
      'Problem section — named, empathic',
      'Solution section — specific, demonstrable',
      'Features → outcomes — not features alone',
      'Objection handling — FAQ or comparison',
      'Repeat CTA in context',
      'Footer — legal, links, alt CTA',
    ],
    hooks: ['specific outcome + time frame', 'pain articulation', 'category anchor'],
    proof: ['customer quote + photo + role', 'metric with context', 'logos bar', 'awards + badges'],
    antiPatterns: ['feature wall', 'stock-photo hero', 'multi-CTA competition', 'hidden pricing'],
    voice: 'Confident, specific, empathic — expressive and warm.',
  },
  {
    file: 'SMS Message Crafting.md',
    title: 'SMS Message Crafting',
    channel: 'SMS',
    description: 'Crafting playbook for SMS — 160-char discipline, consent, opt-out, one CTA, deliverability.',
    constraints: [
      '≤ 160 chars per segment; 10DLC registration in US.',
      'Opt-out phrase (STOP) mandatory.',
      'Brand prefix if legally required.',
      'No emoji unless brand-approved.',
      'Short link with UTM.',
    ],
    structure: [
      'Brand prefix (if required)',
      'Name or situation',
      'Value in one clause',
      'Short link',
      'Opt-out',
    ],
    hooks: ['recent action reference', 'direct ask', 'status update'],
    proof: ['specific number', 'recent event reference'],
    antiPatterns: ['long links', 'multi-message spam', 'emoji walls', 'false urgency'],
    voice: 'Blunt, concise, cool unless in onboarding flow.',
  },
  {
    file: 'Push Message Crafting.md',
    title: 'Push Message Crafting',
    channel: 'push notification',
    description: 'Crafting playbook for push — title ≤ 35, body ≤ 90, action verb, payoff, timing.',
    constraints: [
      'Title ≤ 35 chars; body ≤ 90.',
      'One CTA; deep-link directly to payoff surface.',
      'Timezone + activity window aware.',
      'Frequency cap per user per week.',
      'iOS MPP + Android personal preference respected.',
    ],
    structure: [
      'Title — action or status',
      'Body — specific payoff',
      'Deep link — specific screen',
    ],
    hooks: ['status change', 'personalized recommendation', 'time-bound opportunity'],
    proof: ['user context ("you saved X"); specific metric'],
    antiPatterns: ['generic engagement pings', 'dark-pattern urgency', 'vague rewards'],
    voice: 'Crisp, warm, user-centric — never begging for attention.',
  },
  {
    file: 'Social Post Message Crafting.md',
    title: 'Social Post Message Crafting',
    channel: 'social',
    description: 'Per-platform social crafting — LinkedIn, X, Instagram, TikTok, Threads, Reddit.',
    constraints: [
      'Platform-native length + format.',
      'Hook in first 2 seconds / lines.',
      'Caption + visual aligned.',
      'Disclosures (creator + AI) when applicable.',
      'One clear takeaway per post.',
    ],
    structure: [
      'Hook — line 1 or first 2 seconds',
      'Context — what + why-now',
      'Insight — single idea',
      'Proof or story — specific',
      'CTA (optional) — save / share / comment / click',
    ],
    hooks: ['contrarian take', 'personal story', 'specific result', 'question echoing audience pain'],
    proof: ['case study micro', 'data point', 'screenshot', 'in-app metric'],
    antiPatterns: ['engagement-bait questions', 'buzzword soup', 'repost without platform adapt'],
    voice: 'LinkedIn professional; X blunt; TikTok personal; Threads conversational.',
  },
  {
    file: 'Creator Brief Crafting.md',
    title: 'Creator Brief Crafting',
    channel: 'creator / influencer',
    description: 'Brief-crafting playbook for creator deliverables — brief structure, voice latitude, compliance, measurement.',
    constraints: [
      'Creator voice preserved; brand rules softly enforced.',
      'FTC disclosure required.',
      'Usage rights explicit.',
      'Claim library binding; creators cannot invent claims.',
      'Deliverable format + cadence specified.',
    ],
    structure: [
      'Campaign objective',
      'Audience snapshot (from [[Audience Archetype Canon]])',
      'Single-minded proposition',
      'Proof points creator can cite',
      'Voice latitude (what must be brand, what is theirs)',
      'Do + don\'t list',
      'Deliverables (format, length, platform, count, timeline)',
      'Measurement (UTM, coupon code, promo asset)',
    ],
    hooks: ['creator\'s own hook pattern'],
    proof: ['demo, before/after, personal experience'],
    antiPatterns: ['script forcing', 'generic brand copy', 'scope creep mid-campaign'],
    voice: 'Creator-led; brand rules applied via filter, not replacement.',
  },
  {
    file: 'SEO Article Crafting.md',
    title: 'SEO Article Crafting',
    channel: 'SEO / long-form',
    description: 'Crafting playbook for SEO + GEO articles — structure that ranks in SERPs and gets cited by LLM answer engines.',
    constraints: [
      'H1 includes target entity + intent.',
      'First 200 chars = standalone declarative answer (GEO bait).',
      'Schema.org (Article + FAQPage where applicable).',
      'E-E-A-T signals: named author, sources, date, update cadence.',
      'Internal links to cluster + atomic nodes.',
    ],
    structure: [
      'H1 — entity + intent',
      'Declarative lede (GEO-quotable)',
      'TL;DR box / summary',
      'Body — H2/H3 hierarchy, one idea per section',
      'Proofs — quotes, stats, diagrams',
      'FAQ section with schema',
      'Conclusion with next steps',
      'Related (internal) + further reading (external)',
    ],
    hooks: ['definitive answer in first sentence', 'contrarian thesis'],
    proof: ['original research data', 'expert quotes', 'named case studies'],
    antiPatterns: ['AI-boilerplate openings ("In today\'s fast-paced world…")', 'thin content + FAQ schema stuffing', 'unsourced claims'],
    voice: 'Professional, authoritative, direct. See [[Communication Guides]] reading level by audience.',
  },
];

// =============== 29 Brand System Templates ===============

const brandTemplates = [
  { file: 'Brand Pack Template.md', title: 'Brand Pack Template', description: 'Fillable operator template for the complete brand pack — identity, personality, positioning, voice, style, substance.' },
  { file: 'Voice Classifier Rubric.md', title: 'Voice Classifier Rubric', description: 'Scoring rubric used by the LLM voice classifier — dimensions, weights, anchor examples.' },
  { file: 'Claim Library Template.md', title: 'Claim Library Template', description: 'Fillable template for the substantiated claim library — claim, evidence, scope, decay.' },
  { file: 'Visual Style Token Template.md', title: 'Visual Style Token Template', description: 'Design-token schema for brand colors, type, spacing, motion, imagery — machine-readable format.' },
  { file: 'Neuro Spec Template.md', title: 'Neuro Spec Template', description: 'Fillable <neuro_spec> XML block schema for campaign plans — triggers, pre-conditions, anti-patterns.' },
];

// =============== Writers ===============

function painPlaybookContent(p) {
  return (
    fm(p.description, ['literacy', 'playbook', 'pain-point'])
    + `# ${p.title}\n\n`
    + `> Parent tag: \`${p.tag}\`. Routing: ${p.disciplines.join(' · ')}.\n\n`
    + `## Symptoms (diagnose)\n\n${p.symptoms.map((s) => `- ${s}`).join('\n')}\n\n`
    + `## Root causes (below the symptoms)\n\n${p.roots.map((r) => `- ${r}`).join('\n')}\n\n`
    + `## Treatments (what to do)\n\n${p.treatments.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n`
    + `## Literacy to consult\n\n${p.literacy.map((l) => `- [[${l}]]`).join('\n')}\n\n`
    + `## Message tailoring angle\n\n${p.angle}\n\n`
    + `## Agents to route to\n\n${p.agents.map((a) => `- ${a}`).join('\n')}\n\n`
    + `## Success criteria\n\n${p.success.map((s) => `- ${s}`).join('\n')}\n\n`
    + `## Measurement\n\nInstrument via [[Unified Measurement]]. Baseline before treatment. Expected change window 30–120 days per treatment.\n\n`
    + `## Related\n\n- [[Pain-Point Engine]] · [[MarkOS Canon]] · [[Message Crafting Pipeline]] · [[27 Pain-Point Playbooks|README]] · [[Audience Archetype Canon]]\n`
  );
}

function messageCraftingContent(m) {
  return (
    fm(m.description, ['literacy', 'message-crafting', 'channel'])
    + `# ${m.title}\n\n`
    + `> Channel: **${m.channel}**. Stage 6 of [[Message Crafting Pipeline]]. Every draft in this channel conforms to the rules below + brand voice from [[Brand System Canon]].\n\n`
    + `## Constraints\n\n${m.constraints.map((c) => `- ${c}`).join('\n')}\n\n`
    + `## Canonical structure\n\n${m.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n`
    + `## Hook patterns\n\n${m.hooks.map((h) => `- ${h}`).join('\n')}\n\n`
    + `## Proof patterns\n\n${m.proof.map((p) => `- ${p}`).join('\n')}\n\n`
    + `## Anti-patterns (auto-reject)\n\n${m.antiPatterns.map((a) => `- ${a}`).join('\n')}\n\n`
    + `## Voice defaults\n\n${m.voice}\n\n`
    + `## Audience × pain tailoring\n\nEvery draft composes: **this channel's canonical structure × resolved [[Audience Archetype Canon|archetype]] × tagged pain from [[Pain-Point Engine]] × brand voice from [[Brand System Canon]] × optional triggers from [[Neuro Audit Canon]]**.\n\n`
    + `## Rejection criteria\n\n- Missing archetype or pain tag → reject (Canon commandment I + II).\n- Violates constraints above → reject or revise.\n- Fails voice classifier or claim check → reject.\n\n`
    + `## Related\n\n- [[Message Crafting Pipeline]] · [[Brand System Canon]] · [[Communication Guides]] · [[Pain-Point Engine]] · [[Audience Archetype Canon]] · [[Neuro Audit Canon]] · [[Marketing Literacy]]\n`
  );
}

function brandPackTemplate() {
  return (
    fm('Fillable operator template for the complete brand pack.', ['literacy', 'template', 'brand'])
    + `# Brand Pack Template\n\n`
    + `> Fill one per tenant. Stored at \`.markos-local/MIR/brand-pack.md\`. Synced to Supabase \`markos_company\`. Deterministic source for the voice classifier.\n\n`
    + `## 1. Identity\n\n`
    + `- **Mission**:\n- **Vision**:\n- **Core values** (3–5, with behavior):\n  - \n- **Brand promise**:\n- **Point of view** (market belief we reject):\n\n`
    + `## 2. Personality\n\n`
    + `- **Archetype** (Sage / Creator / Rebel / Hero / …):\n- **Temperament sliders** (1–5 for each):\n  - formal↔casual:\n  - serious↔playful:\n  - direct↔diplomatic:\n  - rational↔emotional:\n  - reserved↔expressive:\n- **Tension** (on-brand contradiction):\n- **Adjacencies**:\n- **Human analog**:\n\n`
    + `## 3. Positioning\n\n`
    + `- **Category**:\n- **Anchor competitor**:\n- **Frame of reference**:\n- **Differentiation**:\n- **Reasons to believe** (3–5):\n  - \n\n`
    + `## 4. Voice\n\n`
    + `- **Lexicon — prefer**:\n- **Lexicon — avoid**:\n- **Taboos**:\n- **Sentence length** min/avg/max:\n- **Register**:\n- **Reading level**:\n- **Cadence**:\n- **Humor policy**:\n- **Pronouns policy**:\n- **Emoji policy**:\n- **Punctuation rules**:\n- **Disclaimers required**:\n\n`
    + `## 5. Style (visual)\n\n`
    + `- **Logo usage**:\n- **Type system**:\n- **Color tokens**:\n- **Spacing grid**:\n- **Imagery style**:\n- **Motion language**:\n- **Accessibility floor**: WCAG 2.2 AA\n- **AI-gen style** (LoRA + prompt suffix):\n\n`
    + `## 6. Substance (claim library link)\n\n`
    + `See [[Claim Library Template]].\n\n`
    + `## Sign-off\n\n- Approved by:\n- Effective:\n- Next review:\n\n`
    + `## Related\n\n- [[Brand System Canon]] · [[Voice Classifier Rubric]] · [[Claim Library Template]] · [[Visual Style Token Template]] · [[MarkOS Canon]]\n`
  );
}

function voiceRubricTemplate() {
  return (
    fm('Scoring rubric used by the LLM voice classifier.', ['literacy', 'template', 'brand', 'voice'])
    + `# Voice Classifier Rubric\n\n`
    + `> The LLM-as-judge prompt that the voice classifier uses. Instantiated per tenant; filled from [[Brand Pack Template|brand pack]].\n\n`
    + `## Inputs\n\n- Draft artifact.\n- Brand pack (voice section).\n- Anchor examples (10–30 approved messages).\n- Anti-examples (what the brand never sounds like).\n\n`
    + `## Scoring dimensions\n\n| Dimension | Weight | What to check |\n|---|---|---|\n| Lexicon adherence | 20 | prefers prefer-list, avoids avoid-list |\n| Register fit | 15 | matches declared register |\n| Cadence fit | 10 | sentence length + rhythm match |\n| Directness fit | 10 | on declared slider |\n| Tone / temperature fit | 10 | warm / cool match |\n| Pronoun policy | 5 | we/you ratio correct |\n| Humor policy | 5 | within rule |\n| Anti-cliché | 10 | zero AI cliché hits |\n| Claim discipline | 10 | all claims in library |\n| Inclusive language | 5 | no flagged terms |\n\n`
    + `## Scoring prompt (template)\n\n\`\`\`\nYou are the brand voice classifier for {{brand}}. Brand voice rules:\n{{voice_rules_yaml}}\nAnchor examples:\n{{anchor_examples}}\nAnti-examples:\n{{anti_examples}}\n\nScore the following draft against each dimension (0–10), return JSON:\n{"scores": {...}, "total": N, "hard_fails": [...], "rewrites": [...]}\n\nDraft:\n{{draft}}\n\`\`\`\n\n`
    + `## Pass threshold\n\nTotal ≥ 85/100 AND zero hard fails.\n\n## Related\n\n- [[Brand System Canon]] · [[Brand Pack Template]] · [[Communication Guides]] · [[LLM Observability for Marketing]]\n`
  );
}

function claimLibraryTemplate() {
  return (
    fm('Fillable template for the substantiated claim library.', ['literacy', 'template', 'brand', 'claims'])
    + `# Claim Library Template\n\n`
    + `> Single source of truth for what the brand is allowed to say. Every claim has evidence, scope, and decay date. Referenced by Auditor agent before publish.\n\n`
    + `## Schema\n\n`
    + `| Claim | Evidence | Scope | Owner | Last verified | Decay |\n|---|---|---|---|---|---|\n| | | | | | |\n\n`
    + `## Example row\n\n`
    + `| Claim | Evidence | Scope | Owner | Last verified | Decay |\n|---|---|---|---|---|---|\n| Cuts CAC 30% in 90 days | case-study-acme-2025-q4, case-study-bolt-2026-q1 | B2B SaaS Tier-1 | Head of Growth | 2026-04-01 | 12 months |\n\n`
    + `## Claim-type rules\n\n`
    + `- **Performance claim** — requires named evidence row with reviewable source.\n`
    + `- **Comparison claim** — benchmarked + date-stamped + fair comparison.\n`
    + `- **Regulated category** (health, finance, food, children's) — legal review required.\n`
    + `- **Testimonial** — FTC disclosure if compensated.\n`
    + `- **Superlative** ("best", "fastest", "leading") — benchmark data in-hand or strike.\n\n`
    + `## Review cadence\n\nQuarterly. Decayed rows archive, not delete. Evidence remains discoverable.\n\n`
    + `## Related\n\n- [[Brand System Canon]] · [[Brand Pack Template]] · [[Communication Guides]] · [[EU AI Act for Marketers]] · [[Privacy, Consent & Compliance]]\n`
  );
}

function visualTokenTemplate() {
  return (
    fm('Design-token schema for brand colors, type, spacing, motion, imagery.', ['literacy', 'template', 'brand', 'visual'])
    + `# Visual Style Token Template\n\n`
    + `> Machine-readable brand style tokens. Source of truth for Figma + code (see \`lib/markos/theme/tokens.ts\`).\n\n`
    + `## Color\n\n`
    + `\`\`\`yaml\ncolor:\n  brand:\n    primary:   hsl(215 85% 55%)\n    secondary: hsl(165 60% 45%)\n  semantic:\n    action:    hsl(215 85% 55%)\n    warn:      hsl(38 90% 55%)\n    danger:    hsl(0 75% 55%)\n    success:   hsl(155 65% 45%)\n  surface:\n    bg:        hsl(0 0% 100%)\n    muted:     hsl(0 0% 96%)\n    border:    hsl(0 0% 88%)\n  text:\n    primary:   hsl(0 0% 10%)\n    secondary: hsl(0 0% 40%)\n    inverse:   hsl(0 0% 100%)\n\`\`\`\n\n`
    + `## Type\n\n`
    + `\`\`\`yaml\nfont:\n  sans:      "Inter, system-ui, sans-serif"\n  serif:     "Source Serif Pro, serif"\n  mono:      "JetBrains Mono, monospace"\nscale:\n  xs:  0.75rem\n  sm:  0.875rem\n  md:  1rem\n  lg:  1.25rem\n  xl:  1.5rem\n  2xl: 2rem\n  3xl: 3rem\nweight:\n  regular: 400\n  medium:  500\n  bold:    700\n\`\`\`\n\n`
    + `## Spacing + grid\n\n`
    + `\`\`\`yaml\nspacing:\n  base: 4px\n  scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96]\nradius:\n  sm: 4px\n  md: 8px\n  lg: 16px\n  xl: 24px\n\`\`\`\n\n`
    + `## Motion\n\n`
    + `\`\`\`yaml\neasing:\n  standard: "cubic-bezier(0.2, 0, 0, 1)"\n  enter:    "cubic-bezier(0, 0, 0, 1)"\n  exit:     "cubic-bezier(0.4, 0, 1, 1)"\nduration:\n  fast:   120ms\n  normal: 200ms\n  slow:   400ms\n\`\`\`\n\n`
    + `## Imagery\n\n- **Style**: realistic photography / stylized illustration / 3D / hybrid (pick one primary).\n- **Mood references**: 5 anchor images committed to the brand pack.\n- **AI-gen LoRA**: named model + prompt suffix for brand-consistent output.\n- **Alt text policy**: descriptive, first-sentence-of-caption style.\n\n`
    + `## Accessibility\n\n- WCAG 2.2 AA floor; AAA for marketing critical paths.\n- Color-contrast minimums verified by axe-core.\n- Motion-reduce respected.\n\n`
    + `## Related\n\n- [[Brand System Canon]] · [[Brand Pack Template]] · [[AI Creative Pipelines 2026]] · [[Sustainability & Responsible Marketing]]\n`
  );
}

function neuroSpecTemplate() {
  return (
    fm('Fillable <neuro_spec> XML block for campaign plans.', ['literacy', 'template', 'neuro'])
    + `# Neuro Spec Template\n\n`
    + `> The \`<neuro_spec>\` block every campaign plan attaches. Validated by the Neuro Auditor (\`MARKOS-AGT-NEU-01\`). Canonical trigger catalog: [[Neuro Audit Canon]].\n\n`
    + `## Schema\n\n`
    + `\`\`\`xml\n<neuro_spec>\n  <funnel_stage>awareness|interest|consideration|decision|retention|advocacy</funnel_stage>\n  <primary_trigger code="B04" justification="..."/>\n  <secondary_trigger code="B03" justification="..."/>\n  <pre_conditions>\n    <condition>...</condition>\n  </pre_conditions>\n  <anti_patterns_avoided>\n    <pattern>fake scarcity</pattern>\n    <pattern>authority bluff</pattern>\n  </anti_patterns_avoided>\n  <evidence_of_activation>\n    <phrase>...</phrase>\n  </evidence_of_activation>\n</neuro_spec>\n\`\`\`\n\n`
    + `## Example (re-engagement email for trial lapsers)\n\n`
    + `\`\`\`xml\n<neuro_spec>\n  <funnel_stage>retention</funnel_stage>\n  <primary_trigger code="B02" justification="phantom ownership: 'your workspace is still here, untouched'"/>\n  <secondary_trigger code="B04" justification="authority: product-team insight on reactivation rates"/>\n  <pre_conditions>\n    <condition>user created workspace during trial</condition>\n  </pre_conditions>\n  <anti_patterns_avoided>\n    <pattern>fake scarcity</pattern>\n    <pattern>guilt-trip opt-in</pattern>\n  </anti_patterns_avoided>\n  <evidence_of_activation>\n    <phrase>your workspace is still here</phrase>\n    <phrase>most teams reactivate within 72 hours</phrase>\n  </evidence_of_activation>\n</neuro_spec>\n\`\`\`\n\n`
    + `## Validation rules\n\n1. \`primary_trigger\` must be in funnel-stage recommended set ([[Neuro Audit Canon]]).\n2. \`pre_conditions\` verified against prior touch history.\n3. \`anti_patterns_avoided\` explicitly listed — auditor checks draft for these.\n4. \`evidence_of_activation\` phrases must appear in the draft copy.\n\n`
    + `## Related\n\n- [[Neuro Audit Canon]] · [[Message Crafting Pipeline]] · [[MarkOS Canon]] · [[Agent Registry]]\n`
  );
}

// =============== Run ===============

async function main() {
  let written = 0, skipped = 0;

  for (const p of painPlaybooks) {
    const path = join(BASE, '27 Pain-Point Playbooks', p.file);
    if (await ensureFile(path, painPlaybookContent(p))) written++; else skipped++;
  }
  for (const m of messageCrafting) {
    const path = join(BASE, '28 Message Crafting', m.file);
    if (await ensureFile(path, messageCraftingContent(m))) written++; else skipped++;
  }

  const baseTemplates = [
    ['Brand Pack Template.md', brandPackTemplate()],
    ['Voice Classifier Rubric.md', voiceRubricTemplate()],
    ['Claim Library Template.md', claimLibraryTemplate()],
    ['Visual Style Token Template.md', visualTokenTemplate()],
    ['Neuro Spec Template.md', neuroSpecTemplate()],
  ];
  for (const [name, content] of baseTemplates) {
    const path = join(BASE, '29 Brand System Templates', name);
    if (await ensureFile(path, content)) written++; else skipped++;
  }

  // MOCs for 28 + 29
  const moc28 = fm('Per-channel message crafting playbooks — stage-6 of the Message Crafting Pipeline.', ['literacy', 'message-crafting', 'moc'])
    + `# 28 Message Crafting\n\n> One per channel. Each playbook inherits the [[Message Crafting Pipeline]] and adds channel-native constraints + structure.\n\n`
    + messageCrafting.map((m) => `- [[${m.title}]]`).join('\n')
    + `\n\n## Related\n\n- [[Message Crafting Pipeline]] · [[Marketing Literacy]] · [[Brand System Canon]] · [[Communication Guides]]\n`;
  if (await ensureFile(join(BASE, '28 Message Crafting', 'README.md'), moc28)) written++; else skipped++;

  const moc29 = fm('Fillable operator templates for the brand system.', ['literacy', 'template', 'moc'])
    + `# 29 Brand System Templates\n\n> Fillable operator templates. Each pairs with its canon in \`brain/\`.\n\n`
    + `- [[Brand Pack Template]] — complete brand pack\n- [[Voice Classifier Rubric]] — LLM voice scoring rubric\n- [[Claim Library Template]] — substantiated claim library\n- [[Visual Style Token Template]] — design tokens\n- [[Neuro Spec Template]] — campaign neuro-spec XML block\n\n`
    + `## Related\n\n- [[Brand System Canon]] · [[Neuro Audit Canon]] · [[Marketing Literacy]] · [[MarkOS Canon]]\n`;
  if (await ensureFile(join(BASE, '29 Brand System Templates', 'README.md'), moc29)) written++; else skipped++;

  console.log(`[canon-playbooks] wrote ${written}, preserved ${skipped}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
