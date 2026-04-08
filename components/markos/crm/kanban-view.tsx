import React from 'react';

function KanbanRecordActions({
  currentStageKey,
  recordId,
  stageKeys,
  onStageChange,
}: Readonly<{
  currentStageKey: string;
  recordId: string;
  stageKeys: string[];
  onStageChange?: (recordId: string, stageKey: string) => void;
}>) {
  const nextStageKeys = stageKeys.filter((stageKey) => stageKey !== currentStageKey);

  return (
    <div>
      {nextStageKeys.map((stageKey) => (
        <button key={stageKey} type="button" onClick={() => onStageChange?.(recordId, stageKey)}>
          Move to {stageKey}
        </button>
      ))}
    </div>
  );
}

export function KanbanView({
  columns,
  onStageChange,
  onSelectRecord,
}: Readonly<{
  columns: Array<{ stage_key: string; display_name: string; records: Array<{ entity_id: string; display_name: string; attributes?: { stage_key?: string } }> }>;
  onStageChange?: (recordId: string, stageKey: string) => void;
  onSelectRecord?: (recordId: string) => void;
}>) {
  const stageKeys = columns.map((column) => column.stage_key);

  return (
    <div>
      <h3>Kanban</h3>
      <div>
        {columns.map((column) => (
          <section key={column.stage_key}>
            <h4>{column.display_name}</h4>
            <ul>
              {column.records.map((record) => (
                <li key={record.entity_id}>
                  <button type="button" onClick={() => onSelectRecord?.(record.entity_id)}>{record.display_name}</button>
                  <KanbanRecordActions currentStageKey={column.stage_key} recordId={record.entity_id} stageKeys={stageKeys} onStageChange={onStageChange} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}