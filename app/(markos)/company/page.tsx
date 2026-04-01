import { companySchema } from "../../../lib/markos/contracts/schema";

export default function MarkOSCompanyPage() {
  return (
    <div>
      <h2>Company</h2>
      <p>Guided edit surface for company profile, intake hydration, and publish governance.</p>
      <pre>{JSON.stringify(companySchema, null, 2)}</pre>
    </div>
  );
}
