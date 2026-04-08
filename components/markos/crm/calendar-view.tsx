import React from 'react';

export function CalendarView({
  entries,
  onReschedule,
}: Readonly<{
  entries: Array<{ entity_id: string; display_name: string; occurs_at: string }>;
  onReschedule?: (recordId: string, value: string) => void;
}>) {
  return (
    <div>
      <h3>Calendar</h3>
      <ul>
        {entries.map((entry) => (
          <li key={entry.entity_id}>
            <strong>{entry.display_name}</strong> {entry.occurs_at}
            <button type="button" onClick={() => onReschedule?.(entry.entity_id, entry.occurs_at)}>
              Reschedule
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}