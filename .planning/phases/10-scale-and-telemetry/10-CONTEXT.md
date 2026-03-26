# Phase 10 Context: Multi-Tenant Scale & Telemetry

## Objective
Optimize MGSD to seamlessly run across multiple isolated brands (Multi-Tenant) hosted on **Vercel** and build robust output telemetry using **PostHog** to track AI-vs-human execution metrics and user onboarding.

## Goals & Requirements (SCL-01, TLM-01)
1. **Multi-Tenant Vercel Hosting**: Update the onboarding server to support multiple projects running from a single Vercel deployment.
2. **PostHog Telemetry Integration**:
   - Initialize PostHog in the front-end (onboarding UI).
   - Initialize PostHog in the backend/CLI (agent operations).
3. **Event Tracking Taxonomy**:
   - **Onboarding UI**: Track step completions, business model selection, form abandons.
   - **Agent Usage**: Track AI generations, drafts saved, phases planned/executed, token usage.
4. **Cross-Client Vector Segregation**: Ensure ChromaDB collections strictly isolate vectors by the new `project_slug` (established in Phase 12).

## Planned PostHog Events

### `onboarding_started`
- Trigger: User lands on step 1
- Properties: `url`

### `onboarding_step_completed`
- Trigger: User proceeds to next step
- Properties: `step_name`, `step_number`

### `business_model_selected`
- Trigger: User selects a business model
- Properties: `business_model`

### `onboarding_completed`
- Trigger: User successfully submits the seed data
- Properties: `business_model`, `project_slug`

### `agent_execution_started`
- Trigger: A filler or orchestrator agent starts a draft generation
- Properties: `agent_name`, `template_name`, `project_slug`

### `agent_execution_completed`
- Trigger: Agent successfully generates content
- Properties: `agent_name`, `template_name`, `project_slug`, `token_usage`, `generation_time_ms`
