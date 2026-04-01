import { ENTITY_ORDER } from "../../lib/markos/contracts/schema";

export default function MarkOSDashboardPage() {
  return (
    <div>
      <h2>MarkOS Dashboard</h2>
      <p>Phase 37 scaffold is active. Core domains are now wired for guarded CRUD and publish snapshots.</p>
      <h3>Active Entity Contracts</h3>
      <ul>
        {ENTITY_ORDER.map((entity) => (
          <li key={entity}>{entity}</li>
        ))}
      </ul>
    </div>
  );
}
