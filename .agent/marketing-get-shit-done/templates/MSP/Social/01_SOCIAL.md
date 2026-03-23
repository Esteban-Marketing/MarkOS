# 📱 {{COMPANY_NAME}} - Social Media Pipeline

**Dependencies:** MIR Core Strategy (`{{MIR_STRATEGY_FILE}}`), MIR Gate 1 required
**Assigned Agents:** `{{LEAD_AGENT}}` (mgsd-social-drafter, mgsd-calendar-builder, mgsd-content-creator)
**Linear Project Manager:** `mgsd-linear-manager`

## Social Media Parameters
- **Active Platforms:** `{{ACTIVE_PLATFORMS}}` (e.g., LinkedIn, Instagram, TikTok)
- **Primary Platform:** `{{PRIMARY_PLATFORM}}` (where ICP-1 is most active — from AUDIENCES.md)
- **Monthly Follower Growth Target:** `{{FOLLOWER_GROWTH_TARGET}}`
- **Engagement Rate Target:** `{{ENGAGEMENT_RATE_TARGET}}`
- **Publishing Cadence:** `{{PUBLISH_CADENCE}}` (e.g., 5×/week LinkedIn, 3×/week Instagram)
- **Brand Archetype:** `{{BRAND_ARCHETYPE}}` (from MESSAGING-FRAMEWORK.md — Hero/Sage/Outlaw/etc.)

---

<!-- SOURCED_FROM → MGSD-RES-MKT-01 (MARKET-TRENDS.md) -->
<!-- SOURCED_FROM → MGSD-RES-AUD-01 (AUDIENCE-RESEARCH.md § Channel Preferences) -->

## 1. Social Foundation

- [ ] Verify `VOICE-TONE.md` has tone-by-channel rules for each active platform.
- [ ] Verify `07_CONTENT/CONTENT-STRATEGY.md` has content pillar definitions and platform format specs.
- [ ] Profile optimization: bio, header image, link-in-bio CTA aligned with `{{PRIMARY_CTA}}`.
- [ ] Set up social scheduling tool: `{{SCHEDULING_TOOL}}` (Buffer / Later / LinkedIn native).
- [ ] Configure tracking: `{{SOCIAL_CLICK_EVENT}}` fires when visitors land from social links.

## 2. Content Pillar Structure

Define posting ratio across content pillars:

- **Educational (40%):** How-to posts, tips, frameworks aligned with ICP-1 pain points
- **Authority / Proof (25%):** Customer results, case studies, data-backed claims
- **Brand Story (20%):** Behind-the-scenes, team, founder story — builds trust via B03 trigger
- **Engagement (10%):** Questions, polls, controversies in the niche
- **Promotional (5%):** Direct offer or CTA posts

- [ ] Build monthly content calendar via `MGSD-ITM-CNT-04` (Social Media Content Calendar template).
- [ ] Map each post to: pillar, B0N trigger, platform format, and publish date.
- [ ] Human approves full monthly calendar before scheduling begins.

## 3. LinkedIn Channel (B2B Priority)

- [ ] weekly personal brand post from `{{FOUNDERS_ACCOUNT}}`: 1 text post + 1 document/carousel per week.
- [ ] Company page posts: 3×/week. Format split: 1 insight post / 1 proof post / 1 engagement question.
- [ ] Write posts using `mgsd-social-drafter` with VOICE-TONE constraints.
- [ ] Post format: Hook (1–2 lines) + Body (problem → insight → proof) + CTA (single next step).
- [ ] Kill metric: posts with organic reach < `{{MIN_REACH_PER_POST}}` at 48h → analyze and adjust hook.

## 4. Instagram / Visual Platform Channel

- [ ] Post cadence: `{{INSTAGRAM_CADENCE}}` posts per week (feed + reels + stories mix).
- [ ] Reels: 1× per week minimum. Topic tied to top-performing LinkedIn post (repurpose).
- [ ] Stories: 3–5× per week. Mix: behind-scenes / polls / product teases / link stickers.
- [ ] Hashtag strategy: 3–5 niche hashtags + 1–2 broad. Rotate weekly. Track `{{MIN_STORY_REACH}}` per story.
- [ ] Human approves reel scripts before recording.

## 5. Short-Form Video (TikTok / Reels)

- [ ] Content type: quick tips / myth-busting / before-after / trending audio with niche angle.
- [ ] Produce video scripts using `MGSD-ITM-CNT-08` (Video Script template).
- [ ] Hook rule: first 1.5 seconds must state the specific outcome or contradiction. No brand intro.
- [ ] Target: `{{VIDEO_COMPLETION_RATE_TARGET}}` completion rate. Below → rewrite hook.
- [ ] Human approves script before filming. Human approves final edit before posting.

## 6. Cross-Platform Repurposing Engine

- [ ] Repurposing logic: Best-performing LinkedIn post this week → Reels script → Stories quote card → Email PS section.
- [ ] Track top-performing content ID each week. Repurpose if engagement rate > `{{REPURPOSE_THRESHOLD}}`.
- [ ] `mgsd-calibrate`: update `CONTENT-STRATEGY.md` with format performance data each month.

## 7. Social QA Loop

- [ ] Weekly: engagement rate per platform vs. target `{{ENGAGEMENT_RATE_TARGET}}`.
- [ ] Weekly: top-performing post analysis — what pillar, format, trigger caused performance?
- [ ] Monthly: follower growth vs. `{{FOLLOWER_GROWTH_TARGET}}`.
- [ ] Kill format: any post format averaging < `{{FORMAT_KILL_THRESHOLD}}` engagement over 4 weeks → retire.
- [ ] Scale format: post types averaging > `{{FORMAT_SCALE_THRESHOLD}}` → increase frequency by 50%.
- [ ] Monthly report: reach, engagement, profile visits, link clicks → `mgsd-analyst` for KPI variance.
