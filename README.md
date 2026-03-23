# Marketing Get Shit Done (MGSD)

Agentic marketing execution protocol. Installs alongside [Get Shit Done (GSD)](https://www.npmjs.com/package/get-shit-done-cc) for unified AI-powered development + marketing teams.

## Install

```bash
npx marketing-get-shit-done
```

## Update

```bash
npx marketing-get-shit-done update
```

## What It Does

- **MIR** (Marketing Intelligence Repository) — Brand, audience, product, and operations strategy documents
- **MSP** (Marketing Strategy Playbook) — Executable discipline modules (SEO, Social, Ads, Email, etc.)
- **RESEARCH/** — 6 auto-generated intelligence files (audience, org, product, competitive, market, content)
- **Web Onboarding** — Step-by-step form that seeds the entire RESEARCH/ → MIR/ → MSP/ pipeline
- **Patch Engine** — Updates never overwrite your customizations (`.mgsd-local/` protected)

## GSD Co-existence

MGSD detects and installs alongside existing GSD without touching any GSD files. Both protocols share `.agent/` and run in parallel.

## Customization

Place overrides in `.mgsd-local/` — this directory survives all updates and patches.
See `.agent/marketing-get-shit-done/MGSD-INDEX.md` for full documentation.

## License

MIT
