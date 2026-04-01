import { icpSchema } from "../../../lib/markos/contracts/schema";

export default function MarkOSIcpsPage() {
  return (
    <div>
      <h2>ICPs</h2>
      <p>Ideal customer profile management with validation and revision history linkage.</p>
      <pre>{JSON.stringify(icpSchema, null, 2)}</pre>
    </div>
  );
}
