# Phase 83 Human UAT Protocol

## Objective

Validate that strategy role guidance outputs are actionable, non-contradictory, and practically usable for strategist, founder, and content roles.

## Scenario Setup

1. Use one realistic tenant branding payload from Phase 74 artifacts.
2. Generate or load the canonical strategy artifact and role views.
3. Evaluate strategist, founder, and content projections independently before cross-role comparison.

## Scoring Rubric

Score each role output from 1 to 5 on each criterion.

- Actionability: clear next actions can be executed without additional interpretation.
- Clarity: language is understandable and concise for role intent.
- Non-contradiction: does not conflict with canonical strategy claims or other role outputs.
- Practical usefulness: output can be used in real planning or execution decisions.

## Acceptance Threshold

- Pass threshold per role: average score >= 4.0 and no criterion below 3.
- Global pass: all three roles meet pass threshold.
- Any role below threshold is a UAT fail requiring issue capture and follow-up remediation.

## Evidence Requirements

- Tester identity and timestamp.
- Per-role criterion scores.
- At least one concrete supporting note per role.
- Final approval decision (`approved` or `issues_found`).
