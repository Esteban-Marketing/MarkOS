import React from 'react';

type OutboundConsentGateProps = Readonly<{
  consent: any;
  approvalState: string | null | undefined;
}>;

export function OutboundConsentGate({ consent, approvalState }: OutboundConsentGateProps) {
  return (
    <section className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <h3 className="text-xs font-semibold uppercase tracking-wider">Consent And Approval</h3>
      <p className="mt-2">Consent: {consent ? String(consent.status || 'unknown') : 'missing'}</p>
      <p className="mt-1">Approval: {approvalState || 'not-required'}</p>
      <p className="mt-2 text-xs">High-risk or bulk outbound work stays visible here before execution.</p>
    </section>
  );
}