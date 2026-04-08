import React from 'react';

export function FunnelView({
  rows,
}: Readonly<{
  rows: Array<{ stage_key: string; display_name: string; record_count: number; total_value: number }>;
}>) {
  return (
    <div>
      <h3>Funnel</h3>
      <table>
        <thead>
          <tr>
            <th>Stage</th>
            <th>Count</th>
            <th>Total Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stage_key}>
              <td>{row.display_name}</td>
              <td>{row.record_count}</td>
              <td>{row.total_value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}