---
description: Campaign performance analysis and optimization recommendations
---

# /markos-performance-review

<purpose>
Analyze campaign performance against KPI targets. Surface optimization opportunities, budget reallocation recommendations, and creative refresh signals.
</purpose>

## Arguments

- `{campaign_id}` — Campaign ID (optional, reviews all active if omitted)

## Process

### 1. Load Active Campaigns

Read all `CAMPAIGN.md` files in `Campaigns_Assets/08_CAMPAIGNS/ACTIVE/`.

### 2. Performance Dashboard

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► PERFORMANCE REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Campaign | Platform | CPL | Target | ROAS | Budget Used | Status |
|----------|----------|-----|--------|------|-------------|--------|
```

### 3. Analysis Dimensions

For each campaign:
- **Pacing:** On track / Overpacing / Underpacing
- **CPL trend:** Improving / Stable / Declining
- **Creative fatigue:** Frequency > [threshold]
- **Audience saturation:** CTR declining + frequency increasing
- **Budget efficiency:** CPL vs. target ratio

### 4. Optimization Recommendations

```
OPTIMIZATIONS IDENTIFIED:

Campaign: {id}
  📈 Scale budget +20% — CPL 30% below target for 5 days
  🔄 Refresh creative — Frequency = 4.2, CTR declining
  
Campaign: {id2}
  ⚠️ Review audience — CPL 150% of target
  🛑 Consider pause — CPL > 200% target for 3 days
```

### 5. Budget Reallocation

If reallocation recommended:
```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Budget Decision                                 ║
╚══════════════════════════════════════════════════════════════╝

Recommended reallocation:
  Campaign A: $X → $Y (scale winner)
  Campaign B: $X → $Z (reduce underperformer)
  Total budget unchanged: $TOTAL

→ Approve / Modify / Hold
```

### 6. Update Optimization Log

Write entries to each campaign's optimization log section.
