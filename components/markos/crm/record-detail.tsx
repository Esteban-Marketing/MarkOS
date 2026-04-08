import React from 'react';
import { TimelinePanel } from './timeline-panel';

type DetailRecord = {
  entity_id: string;
  display_name: string;
  attributes?: Record<string, unknown>;
};

type DetailTimelineEntry = {
  activity_id: string;
  activity_family: string;
  source_event_ref: string;
  stitched_identity?: boolean;
};

type DetailTask = {
  task_id: string;
  title: string;
};

type DetailNote = {
  note_id: string;
  body_markdown: string;
};

type RecordDetailProps = Readonly<{
  record: DetailRecord | null;
  timeline: DetailTimelineEntry[];
  tasks: DetailTask[];
  notes: DetailNote[];
  onFieldUpdate?: (recordId: string, fieldKey: string, value: string | number) => void;
  onStageChange?: (recordId: string, stageKey: string) => void;
}>;

export function RecordDetail({
  record,
  timeline,
  tasks,
  notes,
  onFieldUpdate,
  onStageChange,
}: RecordDetailProps) {
  if (!record) {
    return <div>No record selected.</div>;
  }

  const stageValue = typeof record.attributes?.stage_key === 'string'
    ? record.attributes.stage_key
    : 'unassigned';

  return (
    <section>
      <h2>{record.display_name}</h2>
      <p>Record ID: {record.entity_id}</p>
      <p>Stage: {stageValue}</p>
      <div>
        <button type="button" onClick={() => onStageChange?.(record.entity_id, 'qualified')}>Set qualified</button>
        <button type="button" onClick={() => onStageChange?.(record.entity_id, 'proposal')}>Set proposal</button>
        <button type="button" onClick={() => onFieldUpdate?.(record.entity_id, 'amount', Number(record.attributes?.amount || 0) + 100)}>
          Increase amount
        </button>
      </div>
      <TimelinePanel timeline={timeline} />
      <section>
        <h3>Tasks</h3>
        <ul>
          {tasks.map((task) => <li key={task.task_id}>{task.title}</li>)}
        </ul>
      </section>
      <section>
        <h3>Notes</h3>
        <ul>
          {notes.map((note) => <li key={note.note_id}>{note.body_markdown}</li>)}
        </ul>
      </section>
    </section>
  );
}