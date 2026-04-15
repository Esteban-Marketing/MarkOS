# Professional Services Industry Overlay Pack

This pack contains PROMPTS.md skeletons for professional services firms — management consulting, strategy advisory, and partner-led practices.

> **D-06 Thin Delta:** This is a thin delta on the Services base pack. Prompts in this pack extend the services funnel with practitioner-authority and RFP-culture layers. They do not re-author core services funnel content.

## Pack Contents

| Directory | Description |
|-----------|-------------|
| `Paid_Media/` | Paid advertising prompts: LinkedIn C-suite targeting, Google retargeting, competitive positioning vs. generalist firms, executive briefing lead gen |
| `Content_SEO/` | Content and SEO prompts: practice area methodology pages, regulatory trend content, case study SEO format, buyer's guide for evaluating PS firms |
| `Lifecycle_Email/` | Email sequence prompts: RFP inquiry acknowledgment, proposal follow-up, project onboarding, post-engagement referral and relationship continuity |
| `Social/` | Social content prompts: practitioner thought leadership, conference/speaking highlights, client engagement milestones, practitioner credentials and promotions |
| `Landing_Pages/` | Landing page prompts: practice area overview, team and credentials page, consultation request, engagement model and rate transparency |

## Overlay Behaviour

- `overlay_for: ["services", "b2b"]` — extends the services base pack
- `industry: ["professional-services"]` — professional services vertical only
- Proof posture: credentials and methodology first, outcomes second
- RFP culture: formal, structured positioning signals competence in this vertical
- Rate transparency: expected at late-funnel; vague "contact us for pricing" undermines trust
- Peer referrals: explicitly prompt for referral testimonials at decision stage

## Usage

Load tone overlay before generating prompts:
```
@overlay TPL-SHARED-overlay-industry-professional-services
```
Then apply discipline-specific prompt from the appropriate subdirectory.
