import React from 'react';

export function TableView({
  rows,
  onFieldUpdate,
  onSelectRecord,
}: Readonly<{
  rows: Array<{ entity_id: string; display_name: string; attributes?: { stage_key?: string; amount?: number } }>;
  onFieldUpdate?: (recordId: string, fieldKey: string, value: string | number) => void;
  onSelectRecord?: (recordId: string) => void;
}>) {
  return (
    <div>
      <h3>Table</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Stage</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.entity_id}>
              <td>
                <button type="button" onClick={() => onSelectRecord?.(row.entity_id)}>{row.display_name}</button>
              </td>
              <td>{row.attributes?.stage_key || 'unassigned'}</td>
              <td>{row.attributes?.amount ?? ''}</td>
              <td>
                <button type="button" onClick={() => onFieldUpdate?.(row.entity_id, 'amount', Number(row.attributes?.amount || 0) + 100)}>
                  Increase amount
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}