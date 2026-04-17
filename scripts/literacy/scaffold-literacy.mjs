#!/usr/bin/env node
// Scaffold the Marketing Literacy tree inside the Obsidian vault.
// Produces 27 discipline folders, each with a MOC (README.md) and seed atomic notes.
// Idempotent: never overwrites existing files with non-trivial content.

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..', '..');
const BASE = join(ROOT, 'obsidian', 'Literacy', 'Marketing Literacy');

const today = new Date().toISOString().slice(0, 10);

const fm = (title, description, tags) => `---\ndate: ${today}\ndescription: ${JSON.stringify(description)}\ntags:\n${tags.map((t) => `  - ${t}`).join('\n')}\n---\n\n# ${title}\n\n`;

const disciplines = [
  {
    dir: '00 Frameworks',
    title: 'Frameworks',
    tagline: 'Foundational mental models every marketer shares — STP, JTBD, AARRR, 4Ps, NSM, funnels, buyer psychology, neuro triggers.',
    sections: ['STP (Segmentation · Targeting · Positioning)', 'Jobs-to-be-Done', 'AARRR (Pirate Metrics)', '4Ps / 7Ps', 'North Star Metric', 'Funnel Models (AIDA · TOFU/MOFU/BOFU · HEART)', 'Buyer Psychology & Neuro Triggers', 'RACE Planning Framework', 'Flywheel vs Funnel', 'Ansoff Matrix'],
    atomics: [
      ['STP Framework', 'Segmentation · targeting · positioning — the classical strategic sequence.'],
      ['Jobs-to-be-Done', 'Why customers "hire" a product — functional, emotional, social jobs.'],
      ['AARRR Pirate Metrics', 'Acquisition · Activation · Retention · Referral · Revenue.'],
      ['North Star Metric', 'Single operating metric that captures the product-value delivered to the user.'],
      ['Neuro Triggers', 'Biological + cognitive triggers that influence buyer decisions — matches MarkOS Neuro Auditor taxonomy.'],
    ],
  },
  {
    dir: '01 Strategy & Positioning',
    title: 'Strategy & Positioning',
    tagline: 'Where we play and how we win — category design, differentiation, GTM motions, business-model–aware plays.',
    sections: ['Category Design', 'Differentiation', 'GTM Motions (PLG · SLG · CLG · MLG)', 'Business-Model Plays (B2B · B2C · B2B2C · DTC · Marketplace · SaaS · Agents-aaS)', 'Challenger Playbook', 'Brand Positioning Canvases'],
    atomics: [
      ['Category Design', 'Creating and owning a new market category.'],
      ['GTM Motions', 'Product-led, sales-led, community-led, marketing-led — how the motion shapes the org.'],
      ['Challenger Sales / Marketing', 'Teach, tailor, take control — pattern for disrupting incumbents.'],
    ],
  },
  {
    dir: '02 Brand & Creative',
    title: 'Brand & Creative',
    tagline: 'Brand system — promise, voice, identity — and the creative engine that expresses it consistently across channels.',
    sections: ['Brand Promise & Voice', 'Visual Identity System', 'Brand Architecture', 'Creative Briefs', 'Brand Governance', 'AI-Assisted Creative Production'],
    atomics: [
      ['Brand Voice Design', 'Tone · register · lexicon · taboos.'],
      ['Creative Brief Canvas', 'Objective · audience · insight · single-minded proposition · reasons to believe.'],
      ['AI-Assisted Creative Production', 'Prompt-to-campaign workflows, brand guardrails, model-level QA.'],
    ],
  },
  {
    dir: '03 Audience & Segmentation',
    title: 'Audience & Segmentation',
    tagline: 'Who exactly — ICPs, personas, buying committees, psychographics, lookalikes, predictive audiences.',
    sections: ['ICP (Ideal Customer Profile)', 'Personas vs Jobs', 'Buying Committees (B2B)', 'Psychographics & Values', 'Lookalike & Act-Alike Audiences', 'Predictive Audiences (AI-driven)'],
    atomics: [
      ['Ideal Customer Profile', 'Firmographic + technographic + behavioural specification of the "perfect" account.'],
      ['Buying Committee Mapping', 'Economic buyer · champion · user · technical gatekeeper · blocker · ratifier.'],
      ['Predictive Audiences', 'ML-derived clusters replacing static lookalikes.'],
    ],
  },
  {
    dir: '04 Paid Media',
    title: 'Paid Media',
    tagline: 'Paid channel discipline — search, social, display, CTV, retail media, audio, DOOH — 2026 landscape.',
    sections: ['Paid Search (Google Ads · Bing · TikTok Search Ads)', 'Paid Social (Meta · TikTok · LinkedIn · X · Pinterest · Reddit · Threads)', 'Programmatic Display & Native', 'CTV / Streaming TV', 'Retail Media Networks', 'Audio (Podcasts · Spotify · Audio SEO)', 'DOOH / Programmatic OOH', 'Gaming / In-Play Advertising', 'Creator-Sponsored Ads'],
    atomics: [
      ['Paid Search 2026', 'Automated bidding, AI campaign creation (PMax / Advantage+), SGE/AI-Overview placement bidding.'],
      ['Paid Social 2026', 'Advantage+ Shopping, TikTok Symphony, LinkedIn Accelerate, creator-first ads.'],
      ['CTV Programmatic', 'Streaming-TV buying — ad-tech stack, attention metrics, SSAI, frequency capping, shoppable TV.'],
      ['Retail Media Networks', 'Amazon · Walmart · Instacart · Kroger · Uber · Target · Etsy · TikTok Shop — closed-loop, first-party data advantage.'],
      ['Programmatic OOH', 'Addressable outdoor, attention-measurement pixels, live event triggers.'],
    ],
  },
  {
    dir: '05 SEO & Organic Discovery',
    title: 'SEO & Organic Discovery',
    tagline: 'Organic discovery in the post-10-blue-links era — classical SEO + LLMO/GEO/AEO for AI-generated answers.',
    sections: ['Classical SEO (Technical · On-page · Off-page · Local)', 'LLMO / GEO / AEO — Generative Engine Optimization', 'Zero-Click Search & SERP Features', 'AI Overviews (Google) · ChatGPT Search · Perplexity · Copilot · Claude', 'E-E-A-T & Source Authority', 'Entity SEO & Knowledge Graph', 'Schema.org / llms.txt / ai.txt'],
    atomics: [
      ['Generative Engine Optimization', 'Optimizing content to be cited by LLM answer engines (ChatGPT, Perplexity, Google AI Overview, Copilot, Claude).'],
      ['LLMO vs GEO vs AEO', 'Overlapping acronyms — nuances of each, canonical reference matrix.'],
      ['Zero-Click Search', 'Strategies when SERPs answer without a click — brand entity presence, instant-answer formatting.'],
      ['Entity SEO', 'Knowledge-graph-level optimization — Wikidata, Wikipedia, schema, named-entity relevance.'],
      ['llms.txt Standard', 'Machine-readable content contract for LLM crawlers — emerging 2026 standard.'],
    ],
  },
  {
    dir: '06 Content Marketing',
    title: 'Content Marketing',
    tagline: 'Content as the flywheel — pillar → cluster → atomic — augmented by AI authoring, programmatic SEO, and video-first surfaces.',
    sections: ['Content Strategy (Pillar / Cluster / Atomic)', 'Programmatic SEO', 'AI-Assisted Authoring & Editorial', 'Video & Short-Form', 'Podcasting', 'Interactive Content', 'Documentation-as-Marketing (dev-rel, API docs)'],
    atomics: [
      ['Pillar · Cluster · Atomic', 'Topic architecture for depth + breadth in one graph.'],
      ['Programmatic SEO', 'Template-driven long-tail content powered by structured data and LLM generation — with quality gates.'],
      ['AI-Assisted Editorial Workflow', 'Ideation → draft → voice calibration → fact-check → publish; human-in-the-loop checkpoints.'],
      ['Documentation-as-Marketing', 'Dev-rel content, API references, code samples that compound as SEO assets.'],
    ],
  },
  {
    dir: '07 Email & Lifecycle',
    title: 'Email & Lifecycle',
    tagline: 'Owned, direct, first-party channel — deliverability, lifecycle flows, personalization, predictive send-time.',
    sections: ['Deliverability (SPF · DKIM · DMARC · BIMI)', 'List Hygiene & Re-engagement', 'B2B Cold Outreach', 'Lifecycle Flows (Welcome · Onboarding · Nurture · Reactivation · Winback · Churn)', 'Personalization & Dynamic Content', 'Predictive Send-Time & AI Subject Lines', 'Privacy-Friendly Tracking (Apple MPP · BIMI · verified sender)'],
    atomics: [
      ['Deliverability Baseline 2026', 'SPF · DKIM · DMARC enforcement, BIMI, Gmail/Yahoo bulk-sender requirements.'],
      ['B2B Cold Email Marketing', 'Cold outreach literacy — existing note migrated here.'],
      ['Lifecycle Flow Patterns', 'Welcome, onboarding, nurture, reactivation, winback, churn-save sequences.'],
      ['Apple MPP & Post-Open Metrics', 'Open-rate inflation; pivot to clicks, replies, pipeline.'],
    ],
  },
  {
    dir: '08 SMS & Conversational',
    title: 'SMS & Conversational',
    tagline: 'SMS, WhatsApp, RCS, and messenger-native marketing — consent, deliverability, conversational AI.',
    sections: ['SMS Baseline (10DLC · Toll-Free · Short Code)', 'WhatsApp Business Platform', 'RCS Business Messaging', 'Consent & Opt-In/Out', 'Conversational AI Agents', 'Click-to-Messenger Ads'],
    atomics: [
      ['RCS Business Messaging', 'Rich-card, branded, verified messaging — Google + Apple (2026) cross-platform rollout.'],
      ['WhatsApp Business Platform', 'Template messages, marketing conversations, session-based pricing, flows.'],
      ['SMS Consent & 10DLC', 'US carrier registration, opt-in language, double-opt-in for marketing.'],
    ],
  },
  {
    dir: '09 Social & Community',
    title: 'Social & Community',
    tagline: 'Organic social + owned community — engagement, content atomization, community-led growth.',
    sections: ['Platform Strategy (platform-native content)', 'Employee & Founder-Led Content', 'Community-Led Growth', 'Private Communities (Discord · Circle · Slack · Geneva)', 'Social Listening & Sentiment', 'AI Social Management Tools'],
    atomics: [
      ['Founder-Led Content', 'Personal-brand amplification strategy for B2B and DTC.'],
      ['Community-Led Growth', 'Community as acquisition + retention channel; models and metrics.'],
      ['Social Listening 2026', 'Multimodal sentiment, meme detection, LLM-powered conversation clustering.'],
    ],
  },
  {
    dir: '10 Influencer & Creator',
    title: 'Influencer & Creator Economy',
    tagline: 'Creator-led marketing — nano/micro/macro, affiliate + UGC, deepfake disclosure, performance attribution.',
    sections: ['Creator Tiering & Selection', 'Whitelisting / Dark Posts', 'UGC Licensing & Rights', 'Affiliate & Performance Creator Deals', 'Disclosure & FTC/AI Transparency', 'Creator MarTech (Insense · GRIN · Aspire · CreatorIQ)'],
    atomics: [
      ['Creator Whitelisting', 'Running paid ads from a creator\'s handle — compliance, attribution.'],
      ['UGC Rights & Usage', 'Licensing models, exclusivity windows, usage-fee benchmarks.'],
      ['AI-Generated Creators', 'Virtual influencers and synthetic content — disclosure + ethical boundaries (2026 regulation).'],
    ],
  },
  {
    dir: '11 Conversion & CRO',
    title: 'Conversion & CRO',
    tagline: 'Turning traffic into revenue — user research, UX, experimentation, personalization, friction removal.',
    sections: ['CRO Process (hypothesis → test → learn)', 'User Research Methods', 'Friction Audits', 'Personalization at Scale', 'Checkout Optimization', 'Landing-Page Patterns', 'AI Copy & Layout Generation'],
    atomics: [
      ['CRO Hypothesis Framework', 'We believe X for user-segment Y will move metric Z by W.'],
      ['Checkout Optimization 2026', 'One-click, passkeys, wallet SDKs (Apple · Google · Shop · PayPal), address auto-complete, AI fraud triage.'],
      ['AI Personalization at Scale', 'LLM-derived segments → dynamic content → closed-loop measurement.'],
    ],
  },
  {
    dir: '12 Product-Led Growth',
    title: 'Product-Led Growth',
    tagline: 'Product as distribution — free / freemium / trial, activation loops, usage-based pricing, PQL scoring.',
    sections: ['Activation Loops', 'Free · Freemium · Trial · Reverse Trial', 'Product-Qualified Leads (PQL)', 'Usage-Based Pricing', 'In-Product Growth (prompts · checklists · tours)', 'Community + Product Flywheel'],
    atomics: [
      ['Product-Qualified Leads', 'Scoring signals from product usage that predict conversion.'],
      ['Reverse Trial', 'Start on paid, downgrade to free — pattern for land + expand.'],
      ['Usage-Based Pricing', 'Metered, consumption, seat-blended models — aligning price with value.'],
    ],
  },
  {
    dir: '13 ABM (B2B)',
    title: 'Account-Based Marketing',
    tagline: 'B2B account-centric motion — tiering, orchestration, intent data, buying-committee engagement.',
    sections: ['Tiering (1:1 · 1:few · 1:many)', 'Intent Data (Bombora · G2 · 6sense · ZoomInfo)', 'Account Orchestration Platforms', 'Buying Committee Engagement', 'Multi-Thread Plays', 'Dark Social & Peer Review Influence'],
    atomics: [
      ['ABM Tiering', 'Strategic (1:1), lite (1:few), broad (1:many) — budget + effort split.'],
      ['Intent Data 2026', 'First-party + third-party signals — ethical sourcing, deprecation risks, aggregation patterns.'],
      ['Dark Social', 'Peer conversations, Slack communities, podcast mentions — measurement proxies.'],
    ],
  },
  {
    dir: '14 Events & Field',
    title: 'Events & Field Marketing',
    tagline: 'In-person, hybrid, and virtual events — user groups, conferences, roadshows, field ABM.',
    sections: ['Own Events vs Sponsorships', 'Hybrid Production', 'User Groups & Communities', 'Field ABM Dinners', 'Event Tech Stack', 'Post-Event Follow-up Flows'],
    atomics: [
      ['Event ROI Modeling', 'Pipeline attribution, influenced deals, multi-touch weighting.'],
      ['Hybrid Event Production', 'Venue + virtual + async — content capture → year-round atomization.'],
    ],
  },
  {
    dir: '15 PR & Comms',
    title: 'PR & Comms',
    tagline: 'Earned media, analyst relations, executive visibility, crisis comms — AI-era narrative discipline.',
    sections: ['Analyst Relations (Gartner · Forrester · IDC · G2)', 'Earned Media Strategy', 'Thought Leadership', 'Crisis Comms (+ AI-era misinformation)', 'Internal Comms'],
    atomics: [
      ['Analyst Relations', 'Inclusion in Magic Quadrant, Wave, Market Guide — briefing cadence, evidence requirements.'],
      ['Crisis Comms in the AI Era', 'Deepfake incidents, misinformation amplification, response-speed benchmarks.'],
    ],
  },
  {
    dir: '16 Data, Analytics & Measurement',
    title: 'Data, Analytics & Measurement',
    tagline: 'How we know what works — web analytics, MTA, MMM, incrementality, attention metrics, causal inference.',
    sections: ['Web Analytics (GA4 · Plausible · PostHog · Fathom · Matomo)', 'Multi-Touch Attribution (MTA)', 'Marketing Mix Modeling (MMM) revival', 'Incrementality Testing (geo-lift · holdout · synthetic control)', 'Attention Metrics', 'Unified Measurement', 'Causal Inference (DiD · IV · RCT)', 'North-Star + Input/Output Metrics'],
    atomics: [
      ['MMM Revival', 'Why Marketing Mix Modeling returned in 2024-2026 — privacy, first-party, open-source tools (Meridian · Robyn · Lightweight MMM).'],
      ['Incrementality Testing', 'Geo-lift, matched-market, synthetic control — cookieless causal measurement.'],
      ['Attention Metrics', 'Viewability → attention (Adelaide AU · Realeyes · TVision).'],
      ['Unified Measurement', 'Triangulate MTA + MMM + experiments for one decision surface.'],
    ],
  },
  {
    dir: '17 CDP, Warehouse & Reverse ETL',
    title: 'CDP · Data Warehouse · Reverse ETL',
    tagline: 'Composable customer-data stack — warehouse-native CDPs, identity resolution, activation, zero-copy data sharing.',
    sections: ['Warehouse-Native CDPs (Hightouch · Census · RudderStack · Segment → Twilio · Tealium · mParticle)', 'Identity Graphs', 'Reverse ETL', 'Zero-Copy Data Sharing (Snowflake · Databricks · BigQuery Clean Rooms)', 'Consent Propagation'],
    atomics: [
      ['Warehouse-Native CDP', 'Operate on warehouse truth — no copy, no sync lag, governance inside Snowflake/BigQuery/Databricks.'],
      ['Data Clean Rooms', 'Privacy-preserving joins between first-party datasets for measurement or co-marketing.'],
      ['Identity Resolution 2026', 'Probabilistic + deterministic stitching across devices and identifiers post-IDFA/third-party cookie.'],
    ],
  },
  {
    dir: '18 Experimentation',
    title: 'Experimentation',
    tagline: 'Culture and infrastructure for running controlled experiments — from A/B tests to holdouts to multi-armed bandits.',
    sections: ['Experiment Design', 'A/B vs MAB vs Bayesian', 'Feature Flags & Rollouts', 'Holdouts & Geo Experiments', 'Experiment Review Cadence', 'CUPED + Variance Reduction'],
    atomics: [
      ['Experiment Design 101', 'Hypothesis, metric, MDE, power, duration, guardrails.'],
      ['CUPED', 'Controlled-experiment variance reduction via pre-experiment covariates.'],
      ['Multi-Armed Bandits', 'When they beat A/B — and when they don\'t.'],
    ],
  },
  {
    dir: '19 MarTech Stack',
    title: 'MarTech Stack',
    tagline: 'Composable marketing stack architecture — buy vs build, canonical stack 2026.',
    sections: ['Acquisition Stack (ad ops · attribution · bidding)', 'Web / Content Stack (CMS · landing · CRO)', 'Email/SMS Stack', 'CRM & Revenue Stack', 'Analytics Stack', 'AI/Agent Stack', 'Martech Buy-vs-Build'],
    atomics: [
      ['Canonical 2026 MarTech Stack', 'Reference architecture — CDP → activation → creative → media → measurement.'],
      ['AI Marketing Agent Stack', 'Orchestrator · planner · executor · verifier · brand guardrails — matches MarkOS architecture.'],
    ],
  },
  {
    dir: '20 AI & Agentic Marketing (2026 Frontier)',
    title: 'AI & Agentic Marketing — 2026 Frontier',
    tagline: 'AI-native marketing — agents that plan, execute, verify; RAG-grounded personalization; agentic commerce.',
    sections: ['Agent Architectures (orchestrator + specialists)', 'Retrieval-Augmented Personalization', 'Agentic Commerce (ChatGPT · Perplexity · Claude · Gemini shopping)', 'AI Creative Pipelines (image · video · voice · multimodal)', 'LLM Observability & Guardrails', 'Prompt / Model Governance', 'Human-in-the-Loop Marketing Ops'],
    atomics: [
      ['Agentic Marketing Stack', 'Planner → researcher → content-creator → auditor → publisher — bounded autonomy with approval gates.'],
      ['Agentic Commerce', 'Agents transact on behalf of users — affiliate contracts, agent-readable catalogs, structured offers.'],
      ['RAG-Grounded Personalization', 'Dynamic content grounded in first-party data via retrieval — replaces rule-based personalization.'],
      ['AI Creative Pipelines 2026', 'Text-to-image (Flux · Ideogram · Midjourney), text-to-video (Veo · Sora · Runway · Kling), voice (ElevenLabs), multimodal editing agents.'],
      ['LLM Observability for Marketing', 'Output tracing, brand-safety classifiers, hallucination gates, cost telemetry.'],
    ],
  },
  {
    dir: '21 Privacy, Consent & Compliance',
    title: 'Privacy, Consent & Compliance',
    tagline: 'Privacy as first-class product — GDPR, CCPA/CPRA, DMA, DSA, consent signalling, privacy-enhancing tech.',
    sections: ['GDPR · UK GDPR · CCPA/CPRA', 'EU Digital Markets Act (DMA) & Digital Services Act (DSA)', 'Google Consent Mode v2 + IAB TCF v2.2', 'Apple ATT / iOS privacy surface', 'Cookie-Deprecation Timeline (post-2024 status)', 'Privacy-Enhancing Technologies (DP · federated · clean rooms)', 'AI-specific regulation (EU AI Act)', 'State-level US laws (CO · CT · VA · TX · FL · OR · DE)'],
    atomics: [
      ['Google Consent Mode v2', 'Required for EEA + UK ad performance; ad_user_data + ad_personalization signals.'],
      ['Cookie Deprecation Status 2026', 'Safari · Firefox · Chrome history, Privacy Sandbox APIs, where 1st-party data wins.'],
      ['EU AI Act for Marketers', 'Risk categories, provenance, deepfake disclosure obligations.'],
      ['US State Privacy Patchwork', 'Navigating 15+ state laws with shared opt-out signals (GPC).'],
    ],
  },
  {
    dir: '22 Commerce & Retail Media',
    title: 'Commerce & Retail Media',
    tagline: 'Shoppable surfaces + retail media networks + live + social commerce + agentic checkout.',
    sections: ['Retail Media Networks (Amazon Ads · Walmart Connect · Instacart · Kroger · Uber · Target Roundel · Etsy · TikTok Shop)', 'Social Commerce (TikTok Shop · Instagram Shop · YouTube Shopping)', 'Live Commerce', 'Agentic Checkout', 'Headless Commerce', 'DTC Economics (CAC · LTV · contribution margin)'],
    atomics: [
      ['Retail Media Network Landscape 2026', 'Closed-loop attribution advantage, first-party data, on-site + off-site placements.'],
      ['Social Commerce 2026', 'TikTok Shop ascendancy, Instagram/YouTube shopping parity, creator-commerce integration.'],
      ['Agentic Checkout', 'LLM-initiated purchases, Shop Pay / PayPal agent APIs, Perplexity shopping, OpenAI Operator / Anthropic Computer Use commerce.'],
    ],
  },
  {
    dir: '23 Localization & International',
    title: 'Localization & International',
    tagline: 'Going global — hreflang, translation quality, regional platforms, local payments, cultural adaptation.',
    sections: ['Hreflang & International SEO', 'Translation vs Transcreation', 'AI-Assisted Localization', 'Regional Platforms (Naver · Yandex · Baidu · Weibo · LINE · Rakuten)', 'Local Payment Methods', 'Cultural Adaptation Patterns'],
    atomics: [
      ['AI-Assisted Localization', 'LLM translation with reviewer-in-the-loop, style guides as retrieval context.'],
      ['Regional Platform Matrix', 'Which platforms matter in JP · KR · CN · RU · MENA · LATAM · SEA.'],
    ],
  },
  {
    dir: '24 Sustainability & Responsible Marketing',
    title: 'Sustainability & Responsible Marketing',
    tagline: 'Ad sustainability, carbon reporting, inclusive creative, anti-greenwashing, ethical targeting.',
    sections: ['Ad Sustainability & Carbon (GreenAd · Scope3)', 'Inclusive Creative', 'Anti-Greenwashing Regulation', 'Ethical Targeting (vulnerable audience rules)', 'Accessibility in Marketing (WCAG 2.2 · EAA 2025)'],
    atomics: [
      ['Ad Sustainability', 'Measuring and reducing the carbon footprint of digital media (Scope3 · GreenAd).'],
      ['EU Green Claims Directive', 'Anti-greenwashing rules — substantiation requirements for environmental claims.'],
      ['EAA 2025 Compliance', 'European Accessibility Act — digital product + marketing surface requirements.'],
    ],
  },
  {
    dir: '25 Marketing Ops & RevOps',
    title: 'Marketing Ops & RevOps',
    tagline: 'The machinery — systems ownership, lead lifecycle, SLAs, planning rhythms, attribution hygiene.',
    sections: ['Lead Lifecycle & SLAs', 'Lead Scoring (rule-based → ML)', 'Revenue Ops Alignment', 'Marketing Planning Cadence', 'Quarterly OKRs', 'Vendor Management', 'Data Quality & Hygiene'],
    atomics: [
      ['Lead Lifecycle & SLAs', 'MQL → SQL → opportunity → customer, with stage-SLA and routing rules.'],
      ['Marketing Planning Rhythm', 'Annual → quarterly → monthly → weekly — stakeholder alignment checkpoints.'],
    ],
  },
  {
    dir: '26 Pricing & Packaging',
    title: 'Pricing & Packaging',
    tagline: 'Price strategy as a marketing lever — tiers, entitlements, psychological pricing, value-based, usage-based.',
    sections: ['Value-Based Pricing', 'Usage-Based Pricing', 'Tier & Bundle Design', 'Psychological Pricing', 'Price Experiments', 'Enterprise Negotiation Norms'],
    atomics: [
      ['Value-Based Pricing', 'Price to the value created, not cost to produce.'],
      ['Tier Design Patterns', 'Good-better-best, entry/expansion loops, fence mechanisms.'],
      ['Usage-Based Pricing 2026', 'Metered compute, API calls, agent actions — aligning price with consumption.'],
    ],
  },
];

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

function mocContent(d) {
  const linksByBullet = d.atomics.map(([t]) => `- [[${t}]]`).join('\n');
  const sections = d.sections.map((s) => `- **${s}**`).join('\n');
  return fm(d.title, d.tagline, ['literacy', 'marketing', 'moc', 'discipline'])
    + `> ${d.tagline}\n\n`
    + `## Scope\n\n${sections}\n\n`
    + `## Atomic notes\n\n${linksByBullet}\n\n`
    + `## State of the art (2026)\n\n`
    + `See atomic notes above. For the AI-native frontier see [[AI & Agentic Marketing — 2026 Frontier]].\n\n`
    + `## Related\n\n`
    + `- [[Marketing Literacy]] · [[Home]] · [[Patterns]] · [[Key Decisions]] · [[MarkOS Codebase Atlas]]\n`;
}

function atomicContent(discTitle, [title, desc]) {
  return fm(title, desc, ['literacy', 'marketing', 'atomic'])
    + `> ${desc}\n\n`
    + `## Definition\n\n_Stub. Populate with canonical definition, key references, canonical examples._\n\n`
    + `## Why it matters (2026)\n\n_Stub. Populate with the state of the art and why it is load-bearing this year._\n\n`
    + `## Mechanics\n\n_Stub. Populate with the concrete workflow, formulas, templates, or code._\n\n`
    + `## Pitfalls\n\n_Stub._\n\n`
    + `## Related\n\n`
    + `- [[${discTitle}]] · [[Marketing Literacy]] · [[Patterns]] · [[Key Decisions]] · [[Gotchas]]\n`;
}

let written = 0;
let skipped = 0;

for (const d of disciplines) {
  const mocPath = join(BASE, d.dir, 'README.md');
  if (await ensureFile(mocPath, mocContent(d))) written++; else skipped++;
  for (const a of d.atomics) {
    const p = join(BASE, d.dir, `${a[0]}.md`);
    if (await ensureFile(p, atomicContent(d.title, a))) written++; else skipped++;
  }
}

console.log(`[literacy] wrote ${written} files, preserved ${skipped}.`);
