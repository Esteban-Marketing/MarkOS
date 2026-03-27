# ICPs.md — Ideal Customer Profiles (Firmographics)
# Reference Example: **SaaS** (Developer Observability Platform)

<!-- mgsd-token: MIR | model: SaaS -->
> [!NOTE] SaaS ICP is firmographic with layered stakeholder mapping (technical evaluator + economic buyer).

---

## 1. Ideal Customer Profile Overview

The ideal customer is a **software company with a production engineering team** that is experiencing growing observability complexity — too many tools, too much alert noise, or a recent production incident that exposed monitoring blind spots. They have budget authority for engineering tooling and are evaluating alternatives to their current (often Datadog, New Relic, or Grafana) stack.

---

## 2. ICP Attributes

| Attribute | Ideal Value | Acceptable Range |
|-----------|-------------|------------------|
| Industry | Software / Tech / Fintech / Healthcare Tech | Any with production SaaS workloads |
| Engineering Team Size | 15 – 500 engineers | 5 – 5,000 engineers |
| Annual Revenue | $5M – $500M | $1M – $2B |
| Infrastructure | Cloud-native (AWS/GCP/Azure), Kubernetes, microservices | Any containerized or cloud-hosted workload |
| Current Observability Spend | $50K – $1M/year | $10K+ on monitoring/observability tooling |
| Tech Stack | OpenTelemetry, Datadog, New Relic, Prometheus/Grafana | Any modern observability toolchain |
| Deployment Model | Multi-region cloud | Single-region or hybrid |
| Annual Contract Value Target | $40K – $500K | $12K – $2M |
| Sales Cycle | 2 – 6 months | 1 – 12 months |
| POC Velocity | 30 – 60 day proof of concept | Up to 90 days |

---

## 3. Stakeholder Map

| Role | Influence | Engagement Strategy |
|------|-----------|---------------------|
| Senior SRE / Platform Engineer | Technical Evaluator / De-facto Veto | Self-serve trial, deep docs, Slack/Discord community |
| Engineering Manager | Champion / Internal Sponsor | ROI framing, time-saved metrics, team productivity narrative |
| VP/Director of Engineering | Economic Buyer | Business case, case studies from peer companies, no-surprise pricing |
| CISO / InfoSec | Compliance Gate | SOC 2 Type II report, data residency docs, security whitepaper |

---

## 4. Disqualifiers

* Companies still running monolithic on-premise applications — not a fit for distributed tracing value prop.
* Teams with fewer than 5 engineers — not complex enough to need the product; better served by managed solutions.
* Companies with <$5M revenue — budget doesn't support ACV; sales cycle economics don't work.
* Companies locked into multi-year Datadog Enterprise contracts with >18 months remaining — switching cost too high unless there's a compliance or incident-driven forcing function.