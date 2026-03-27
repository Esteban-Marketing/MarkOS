<mgsd_templates>
<purpose>Token-efficient map of MIR, MSP, and ITM templates. Bypasses need to load 21KB index.</purpose>

<mir_domain>
  <gate level="1">
    <dir>MIR/Core_Strategy/01_COMPANY/ (Identity)</dir>
    <dir>MIR/Core_Strategy/02_BRAND/ (Voice & Visuals)</dir>
    <file>MIR/Core_Strategy/02_BUSINESS/LEAN-CANVAS.md (Business Physics)</file>
    <file>MIR/Core_Strategy/02_BUSINESS/JTBD-MATRIX.md (Psychology)</file>
    <dir>MIR/Market_Audiences/03_MARKET/ (Competitors & Demand)</dir>
    <dir>MIR/Products/04_PRODUCTS/ (Features & Hooks)</dir>
  </gate>
  <gate level="2">
    <dir>MIR/Campaigns_Assets/05_CHANNELS/ (Distribution)</dir>
    <dir>MIR/Core_Strategy/06_TECH-STACK/ (Ops & Tools)</dir>
  </gate>
</mir_domain>

<linear_items>
  <!-- ITM tokens auto-map onto Linear issues during mgsd-linear-sync -->
  <group id="content_creation">
    <token>MGSD-ITM-CNT-01 (Lead Magnet) [B04/B05/B07]</token>
    <token>MGSD-ITM-CNT-02 (Ad Copy) [B02/B05/B06/B09]</token>
    <token>MGSD-ITM-CNT-03 (Email Seq) [B01-B03/B07]</token>
    <token>MGSD-ITM-CNT-06 (SEO Article) [B04/B05/B07/B08]</token>
  </group>
  <group id="acquisition">
    <token>MGSD-ITM-ACQ-01 (Paid Social Setup)</token>
    <token>MGSD-ITM-ACQ-02 (Retargeting Setup)</token>
    <token>MGSD-ITM-ACQ-03 (LinkedIn Outbound)</token>
  </group>
</linear_items>

<resolution_protocol>
  1. Detect `<!-- OVERRIDABLE: .mgsd-local/... -->`
  2. Check `.mgsd-local/<path>`
  3. If exists, override protocol baseline.
  4. If none, fallback to baseline.
</resolution_protocol>
</mgsd_templates>
