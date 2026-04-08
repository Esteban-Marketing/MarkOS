import React from 'react';

export function TimelinePanel({ timeline }: Readonly<{ timeline: Array<{ activity_id: string; activity_family: string; source_event_ref: string; stitched_identity?: boolean }> }>) {
  return (
    <div>
      <h3>Timeline</h3>
      <ul>
        {timeline.map((entry) => (
          <li key={entry.activity_id}>
            <strong>{entry.activity_family}</strong> {entry.source_event_ref}
            {entry.stitched_identity ? ' stitched_identity' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}