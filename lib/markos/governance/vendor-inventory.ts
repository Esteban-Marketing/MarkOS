import type { RetentionExportRecord, VendorInventoryEntry } from './contracts';

export function buildVendorInventory(entries: VendorInventoryEntry[]): VendorInventoryEntry[] {
  return entries.map((entry) => ({
    ...entry,
    source_of_truth: entry.source_of_truth || 'immutable-ledger',
  }));
}

export function buildRetentionExportRecord(input: Partial<RetentionExportRecord> = {}): RetentionExportRecord {
  return {
    export_record_id: input.export_record_id || 'retention-export-001',
    evidence_pack_id: input.evidence_pack_id || 'evidence-pack-001',
    tenant_id: input.tenant_id || 'tenant-alpha-001',
    retention_window: input.retention_window || 'P12M',
    export_status: input.export_status || 'ready',
    exported_at: input.exported_at || null,
    export_location: input.export_location || 'markos://governance/evidence-pack-001',
  };
}