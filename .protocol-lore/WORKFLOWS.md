<mgsd_workflows>
<purpose>Machine-readable index of core operational workflows.</purpose>

<execution_loops>
  <loop id="autonomous">mgsd-autonomous iterates phases sequentially. Calls discuss->plan->execute.</loop>
  <loop id="research">mgsd-research-phase builds MIR data independently of execution.</loop>
  <loop id="sync">mgsd-linear-sync pulls linear issue updates to phase tracking.</loop>
</execution_loops>

<gate_enforcement>
  <gate type="mir-audit">mgsd-mir-audit validates MIR structural integrity vs requirements.</gate>
  <gate type="verifier">mgsd-verify-work runs post-phase 7-dimension Nyquist rules.</gate>
  <gate type="health">mgsd-health validates directory health for missing index files.</gate>
</gate_enforcement>
</mgsd_workflows>
