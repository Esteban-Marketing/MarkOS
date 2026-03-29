# .markos-local/ — Your Private Customization Space

This directory is **yours**. Everything in here:
- Survives MARKOS updates and patches (never overwritten)
- Survives GSD updates (never overwritten)
- Overrides the corresponding protocol default when present

## What You Can Customize Here

| What | Override Path | Protocol Default |
|------|--------------|-----------------|
| MIR Core Strategy files | `.markos-local/MIR/Core_Strategy/` | `.agent/markos/templates/MIR/Core_Strategy/` |
| MIR Audience files | `.markos-local/MIR/Market_Audiences/` | `.agent/markos/templates/MIR/Market_Audiences/` |
| MIR Product files | `.markos-local/MIR/Products/` | `.agent/markos/templates/MIR/Products/` |
| MIR Campaign files | `.markos-local/MIR/Campaigns_Assets/` | `.agent/markos/templates/MIR/Campaigns_Assets/` |
| MIR Operations files | `.markos-local/MIR/Operations/` | `.agent/markos/templates/MIR/Operations/` |
| MSP discipline templates | `.markos-local/MSP/<discipline>/` | `.agent/markos/templates/MSP/<discipline>/` |
| Project config overrides | `.markos-local/config/config.json` | `.agent/markos/templates/config.json` |

## How Overrides Work

When any MARKOS agent loads a template, it checks `.markos-local/` first.
If a local override exists → use it.
If not → fall back to the protocol default.

You'll see this in agent logs: `[override] Using .markos-local/MIR/Core_Strategy/BRAND-VOICE.md`

## What NOT to Put Here

- Campaign files and RESEARCH/ output → those live in your project root MIR/, MSP/, RESEARCH/
- Planning files → those live in .planning/
- This directory is for **template overrides only** — not campaign output

## Privacy

`.markos-local/` is added to `.gitignore` by default. Your client customizations stay private.
Remove the gitignore entry if you want to version-control your overrides.
