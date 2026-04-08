import React from 'react';

import { OutboundComposer } from './outbound-composer';
import { OutboundConsentGate } from './outbound-consent-gate';

type OutboundWorkspaceProps = Readonly<{
  snapshot: {
    tenant_id: string;
    queue: Array<any>;
    templates: Array<any>;
    sequences: Array<any>;
    active_work: any;
    active_contact: any;
    evidence: Array<any>;
    consent: any;
  };
}>;

export function OutboundWorkspace({ snapshot }: OutboundWorkspaceProps) {
  return (
    <div className="flex min-h-screen flex-col gap-4 bg-[#f5f7fa] p-6 lg:flex-row">
      <aside className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:w-[28%]">
        <h1 className="mb-4 text-sm font-medium text-[#0f172a]">Outbound Queue</h1>
        <ul className="space-y-3 text-sm text-[#334155]">
          {snapshot.queue.length ? snapshot.queue.map((item) => (
            <li key={item.queue_id} className="rounded border border-gray-200 p-3">
              <p className="font-medium">{item.channel.toUpperCase()} for {item.contact_id}</p>
              <p className="mt-1 text-xs">Due {item.due_at}</p>
              <p className="mt-1 text-xs">Approval {item.approval_state || 'ready'}</p>
            </li>
          )) : <li>No queued outbound work.</li>}
        </ul>
      </aside>
      <main className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:w-[47%]">
        <div className="mb-6 rounded border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#475569]">CRM Record Context</p>
          <p className="mt-2 text-sm text-[#0f172a]">{snapshot.active_contact?.display_name || 'No contact selected'}</p>
          <p className="mt-1 text-xs text-[#475569]">Templates, sequences, and schedule controls stay inside the CRM shell.</p>
        </div>
        <OutboundComposer activeWork={snapshot.active_work} templates={snapshot.templates} />
        <div className="mt-6 rounded border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-[#0f172a]">Sequence Context</h3>
          <ul className="mt-3 space-y-2 text-sm text-[#334155]">
            {snapshot.sequences.length ? snapshot.sequences.map((sequence) => (
              <li key={sequence.sequence_id}>{sequence.display_name} ({sequence.approval_state})</li>
            )) : <li>No sequence launched yet.</li>}
          </ul>
        </div>
      </main>
      <aside className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:w-[25%]">
        <h2 className="mb-4 text-sm font-medium text-[#0f172a]">Evidence Rail</h2>
        <OutboundConsentGate consent={snapshot.consent} approvalState={snapshot.active_work?.approval_state} />
        <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-[#334155]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0f172a]">Recent Evidence</h3>
          <ul className="mt-3 space-y-2">
            {snapshot.evidence.length ? snapshot.evidence.map((event) => (
              <li key={event.activity_id}>{event.payload_json?.action || event.source_event_ref}</li>
            )) : <li>No outbound evidence yet.</li>}
          </ul>
        </div>
      </aside>
    </div>
  );
}