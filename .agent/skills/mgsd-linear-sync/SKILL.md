---
name: mgsd-linear-sync
description: Sync marketing roadmap phases and plans to Linear.
---

<objective>
Parse all active `.planning` files and automatically map them to Linear Issues and Projects.
</objective>

<process>
1. Check `.planning/ROADMAP.md` and `.planning/phased/` plans.
2. Formulate node/curl command payloads using the Linear API endpoint `https://api.linear.app/graphql`.
3. If no API key is natively configured, prompt the user for their Linear API key or instruct them to set `LINEAR_API_KEY`.
4. Create Epics/Projects for each Phase, and Issues for each Task within the Phase.
5. Assign issues to humans or agent avatars as indicated in the plans.
</process>
