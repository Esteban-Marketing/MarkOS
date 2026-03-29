# .mgsd-local/ — Your Private Customization Space

This directory is **yours**. Everything in here:
- Survives MGSD updates and patches (never overwritten)
- Survives GSD updates (never overwritten)
- Overrides the corresponding protocol default when present

## What You Can Customize Here

| What | Override Path | Protocol Default |
|------|--------------|-----------------|
| MIR Core Strategy files | `.mgsd-local/MIR/Core_Strategy/` | `.agent/marketing-get-shit-done/templates/MIR/Core_Strategy/` |
| MIR Audience files | `.mgsd-local/MIR/Market_Audiences/` | `.agent/marketing-get-shit-done/templates/MIR/Market_Audiences/` |
| MIR Product files | `.mgsd-local/MIR/Products/` | `.agent/marketing-get-shit-done/templates/MIR/Products/` |
| MIR Campaign files | `.mgsd-local/MIR/Campaigns_Assets/` | `.agent/marketing-get-shit-done/templates/MIR/Campaigns_Assets/` |
| MIR Operations files | `.mgsd-local/MIR/Operations/` | `.agent/marketing-get-shit-done/templates/MIR/Operations/` |
| MSP discipline templates | `.mgsd-local/MSP/<discipline>/` | `.agent/marketing-get-shit-done/templates/MSP/<discipline>/` |
| Project config overrides | `.mgsd-local/config/config.json` | `.agent/marketing-get-shit-done/templates/config.json` |

## How Overrides Work

When any MGSD agent loads a template, it checks `.mgsd-local/` first.
If a local override exists → use it.
If not → fall back to the protocol default.

You'll see this in agent logs: `[override] Using .mgsd-local/MIR/Core_Strategy/BRAND-VOICE.md`

## What NOT to Put Here

- Campaign files and RESEARCH/ output → those live in your project root MIR/, MSP/, RESEARCH/
- Planning files → those live in .planning/
- This directory is for **template overrides only** — not campaign output

## Privacy

`.mgsd-local/` is added to `.gitignore` by default. Your client customizations stay private.
Remove the gitignore entry if you want to version-control your overrides.
