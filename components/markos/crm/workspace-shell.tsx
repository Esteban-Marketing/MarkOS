"use client";

import React, { startTransition, useEffect, useState } from 'react';

import { KanbanView } from './kanban-view';
import { TableView } from './table-view';
import { RecordDetail } from './record-detail';
import { TimelinePanel } from './timeline-panel';
import { CalendarView } from './calendar-view';
import { FunnelView } from './funnel-view';

const workspace = require('../../../lib/markos/crm/workspace');

type WorkspaceShellProps = Readonly<{
  tenantId: string;
  objectKind: string;
  state: ReturnType<typeof workspace.createWorkspaceState>;
  pipeline?: { stages?: Array<{ stage_key: string; display_name: string; stage_order: number }> };
  detail?: { record: unknown; timeline: Array<any>; tasks: Array<any>; notes: Array<any> };
  objectDefinition?: { calendar_enabled?: boolean; calendar_date_field_key?: string };
}>;

export function WorkspaceShell({
  tenantId,
  objectKind,
  state,
  pipeline,
  detail,
  objectDefinition,
}: WorkspaceShellProps) {
  const [workspaceState, setWorkspaceState] = useState(state);
  const [workspaceDetail, setWorkspaceDetail] = useState(detail);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setWorkspaceState(state);
  }, [state]);

  useEffect(() => {
    setWorkspaceDetail(detail);
  }, [detail]);

  const activeView = workspaceState.view_type;
  const columns = workspace.buildKanbanColumns(workspaceState, pipeline?.stages || []);
  const rows = workspace.buildTableRows(workspaceState);
  const calendarEntries = workspace.buildCalendarEntries({ state: workspaceState, object_definition: objectDefinition || {} });
  const funnelRows = workspace.buildFunnelRows({ state: workspaceState, pipeline: pipeline || { stages: [] } });

  function syncRecord(record: any) {
    startTransition(() => {
      const nextState = workspace.applyWorkspaceMutation(workspaceState, { type: 'record_updated', record });
      setWorkspaceState(nextState);
      if (workspaceDetail?.record && workspaceDetail.record.entity_id === record.entity_id) {
        setWorkspaceDetail({ ...workspaceDetail, record });
      }
    });
  }

  async function patchRecord(body: Record<string, unknown>) {
    setErrorMessage(null);
    const response = await fetch('/api/crm/records', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record_kind: objectKind, ...body }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.record) {
      setErrorMessage(payload?.message || payload?.error || 'CRM mutation failed');
      return;
    }
    syncRecord(payload.record);
  }

  async function rescheduleRecord(recordId: string, value: string) {
    setErrorMessage(null);
    const nextValue = new Date(Date.parse(value || Date.now()) + 86400000).toISOString();
    const response = await fetch('/api/crm/calendar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record_kind: objectKind, entity_id: recordId, value: nextValue }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.record) {
      setErrorMessage(payload?.message || payload?.error || 'CRM reschedule failed');
      return;
    }
    syncRecord(payload.record);
  }

  function selectRecord(recordId: string) {
    startTransition(() => {
      const nextState = workspace.applyWorkspaceMutation(workspaceState, { type: 'select_record', record_id: recordId });
      setWorkspaceState(workspace.applyWorkspaceMutation(nextState, { type: 'set_view', view_type: 'detail' }));
    });
  }

  return (
    <section>
      <header>
        <h1>CRM Workspace</h1>
        <p>Tenant: {tenantId}</p>
        <p>Object: {objectKind}</p>
        <nav>
          <button type="button" onClick={() => setWorkspaceState(workspace.applyWorkspaceMutation(workspaceState, { type: 'set_view', view_type: 'kanban' }))}>Kanban</button>{' '}
          <button type="button" onClick={() => setWorkspaceState(workspace.applyWorkspaceMutation(workspaceState, { type: 'set_view', view_type: 'table' }))}>Table</button>{' '}
          <button type="button" onClick={() => setWorkspaceState(workspace.applyWorkspaceMutation(workspaceState, { type: 'set_view', view_type: 'detail' }))}>Detail</button>{' '}
          <button type="button" onClick={() => setWorkspaceState(workspace.applyWorkspaceMutation(workspaceState, { type: 'set_view', view_type: 'timeline' }))}>Timeline</button>{' '}
          <button type="button" onClick={() => setWorkspaceState(workspace.applyWorkspaceMutation(workspaceState, { type: 'set_view', view_type: 'calendar' }))}>Calendar</button>{' '}
          <button type="button" onClick={() => setWorkspaceState(workspace.applyWorkspaceMutation(workspaceState, { type: 'set_view', view_type: 'funnel' }))}>Funnel</button>
        </nav>
      </header>
      {errorMessage ? <p>{errorMessage}</p> : null}
      {activeView === 'kanban' ? <KanbanView columns={columns} onStageChange={(recordId, stageKey) => patchRecord({ entity_id: recordId, stage_key: stageKey })} onSelectRecord={selectRecord} /> : null}
      {activeView === 'table' ? <TableView rows={rows} onFieldUpdate={(recordId, fieldKey, value) => patchRecord({ entity_id: recordId, field_key: fieldKey, value })} onSelectRecord={selectRecord} /> : null}
      {activeView === 'detail' && workspaceDetail ? <RecordDetail record={workspaceDetail.record as any} timeline={workspaceDetail.timeline} tasks={workspaceDetail.tasks} notes={workspaceDetail.notes} onFieldUpdate={(recordId, fieldKey, value) => patchRecord({ entity_id: recordId, field_key: fieldKey, value })} onStageChange={(recordId, stageKey) => patchRecord({ entity_id: recordId, stage_key: stageKey })} /> : null}
      {activeView === 'timeline' && workspaceDetail ? <TimelinePanel timeline={workspaceDetail.timeline} /> : null}
      {activeView === 'calendar' ? <CalendarView entries={calendarEntries} onReschedule={rescheduleRecord} /> : null}
      {activeView === 'funnel' ? <FunnelView rows={funnelRows} /> : null}
    </section>
  );
}