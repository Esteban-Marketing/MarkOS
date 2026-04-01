import { mirDocumentSchema } from "../../../lib/markos/contracts/schema";

export default function MarkOSMirPage() {
  return (
    <div>
      <h2>MIR</h2>
      <p>Canonical MIR section editing with draft to publish lifecycle states.</p>
      <pre>{JSON.stringify(mirDocumentSchema, null, 2)}</pre>
    </div>
  );
}
