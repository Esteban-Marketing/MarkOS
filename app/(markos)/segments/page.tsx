import { segmentSchema } from "../../../lib/markos/contracts/schema";

export default function MarkOSSegmentsPage() {
  return (
    <div>
      <h2>Segments</h2>
      <p>Segment operations and campaign targeting bridge.</p>
      <pre>{JSON.stringify(segmentSchema, null, 2)}</pre>
    </div>
  );
}
