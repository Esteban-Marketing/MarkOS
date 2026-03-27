# GOLD-STANDARD Agent Interaction Catalog

Use these as quality anchors for structure, grounding, and decision traceability.

## Example 1 — Strategy and Planning

### User Input
Create a campaign launch blueprint for a B2B SaaS targeting RevOps leaders with a 45-day runway and strict CPA ceiling.

### Expected Grounded Reasoning Pattern
1. Pull constraints first from Lean Canvas and KPI framework.
2. Map message architecture to JTBD emotional driver and status quo enemy.
3. Sequence launch into measurable waves with explicit dependencies.
4. Surface assumptions and add a validation checkpoint before spend scale.

### Output Format Expectations
- Sections: Objective, Constraints, Audience Signal, Offer Narrative, Channel Plan, KPI Targets, Risks.
- Include at least one explicit stop/go metric gate.
- No generic channel advice; include concrete operational next steps.

## Example 2 — Content Generation

### User Input
Draft three LinkedIn post variants announcing a workflow automation feature for agency owners.

### Expected Grounded Reasoning Pattern
1. Read brand ontology and banned lexicon first.
2. Select one primary pain and one explicit promise per variant.
3. Keep platform-native formatting and a strong first-line pattern interrupt.
4. Run a quick compliance/tone self-check before finalizing copy.

### Output Format Expectations
- Variant A/B/C headings.
- For each variant: Hook, Body, CTA.
- Each CTA tied to one clear business action.
- Avoid vague authority claims and fluff intros.

## Example 3 — Analytics and Telemetry Synthesis

### User Input
Analyze drop-off from landing page to form submit using this week of PostHog events and suggest actions.

### Expected Grounded Reasoning Pattern
1. Confirm event coverage and data sufficiency before conclusions.
2. Identify dominant breakpoints by segment and device.
3. Separate observation from hypothesis and confidence level.
4. Recommend reversible experiments with measurable success thresholds.

### Output Format Expectations
- Sections: Signal Summary, Hypothesis, Recommended Action, Measurement Plan.
- Include exact events/properties to monitor.
- If evidence is weak, explicitly state insufficient significance.

## Example 4 — Verification and Audit

### User Input
Review this paid media draft and determine whether it is ready for execution.

### Expected Grounded Reasoning Pattern
1. Evaluate against brand ontology, compliance rules, and economic constraints.
2. Flag hard failures with exact offending lines or claims.
3. Provide a binary verdict and one-line remediation instruction.
4. Do not rewrite creative content unless explicitly asked.

### Output Format Expectations
- Machine-parseable structure (JSON or strict checklist table).
- Fields: verdict, failures, risk_level, remediation.
- No ambiguous language in final decision.
