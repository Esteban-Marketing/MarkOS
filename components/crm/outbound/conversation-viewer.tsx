import React from 'react';

type ConversationViewerProps = Readonly<{
  conversations: Array<any>;
}>;

export function ConversationViewer({ conversations }: ConversationViewerProps) {
  return (
    <section className="mx-auto max-w-5xl space-y-4 p-6">
      <header className="rounded border border-gray-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-[#0f172a]">Outbound Conversations</h1>
        <p className="mt-1 text-sm text-[#475569]">Delivery markers, replies, opt-outs, and suggestion-only assistive drafting stay visible inside the CRM shell.</p>
      </header>
      <div className="grid gap-4">
        {conversations.length ? conversations.map((conversation) => (
          <article key={conversation.thread_id} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[#0f172a]">{conversation.thread_id}</h2>
              <span className="text-xs uppercase tracking-wider text-[#475569]">{conversation.status}</span>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-[#334155]">
              {conversation.messages.map((message: any) => (
                <li key={message.message_id} className="rounded border border-gray-100 bg-gray-50 p-3">
                  <p>{message.direction} · {message.status}</p>
                  <p className="mt-1">{message.text || 'No body captured.'}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Suggestion-only assistive drafts can help operators prepare follow-up copy, but send and sequence execution remain manual.
            </div>
          </article>
        )) : <p className="rounded border border-dashed border-gray-300 bg-white p-6 text-sm text-[#475569]">No conversation threads yet.</p>}
      </div>
    </section>
  );
}