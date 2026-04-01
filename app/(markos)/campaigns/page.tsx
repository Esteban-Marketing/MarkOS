import { campaignSchema } from "../../../lib/markos/contracts/schema";

export default function MarkOSCampaignsPage() {
  return (
    <div>
      <h2>Campaigns</h2>
      <p>Campaign workspace with KPI and publish-state aware controls.</p>
      <pre>{JSON.stringify(campaignSchema, null, 2)}</pre>
    </div>
  );
}
