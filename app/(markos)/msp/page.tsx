import { mspPlanSchema } from "../../../lib/markos/contracts/schema";

export default function MarkOSMspPage() {
  return (
    <div>
      <h2>MSP</h2>
      <p>MSP plan and channel matrix control panel.</p>
      <pre>{JSON.stringify(mspPlanSchema, null, 2)}</pre>
    </div>
  );
}
