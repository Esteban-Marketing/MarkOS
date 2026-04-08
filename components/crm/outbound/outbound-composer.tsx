import React from 'react';

type OutboundComposerProps = Readonly<{
  activeWork: any;
  templates: Array<any>;
}>;

export function OutboundComposer({ activeWork, templates }: OutboundComposerProps) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-[#0f172a]">Outbound Composer</h2>
        <p className="mt-1 text-sm text-[#475569]">Choose a channel, apply a template, schedule work, and keep approval state visible.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-[#334155]">
          <span>Channel</span>
          <input readOnly className="mt-1 w-full rounded border border-gray-200 px-3 py-2" value={activeWork?.channel || 'email'} />
        </label>
        <label className="text-sm text-[#334155]">
          <span>Schedule</span>
          <input readOnly className="mt-1 w-full rounded border border-gray-200 px-3 py-2" value={activeWork?.due_at || 'Send now'} />
        </label>
      </div>
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-sm font-semibold text-[#0f172a]">Template Library</h3>
        <ul className="mt-3 space-y-2 text-sm text-[#334155]">
          {templates.length ? templates.map((template) => (
            <li key={template.template_id || template.template_key}>
              {template.display_name} ({template.channel})
            </li>
          )) : <li>No template configured yet.</li>}
        </ul>
      </div>
      <div className="rounded border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Approval warnings, schedule controls, and template choices remain visible before operators execute outbound work.
      </div>
      <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Assistive drafting is operator-triggered and suggestion-only. No autonomous send or sequence execution path is available here.
      </div>
    </section>
  );
}