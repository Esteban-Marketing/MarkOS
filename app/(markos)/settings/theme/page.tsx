import { defaultBrandPack, validateBrandPack } from "../../../../lib/markos/theme/brand-pack";

export default function MarkOSThemeSettingsPage() {
  const validation = validateBrandPack(defaultBrandPack);

  return (
    <div>
      <h2>Theme Settings</h2>
      <p>White-label token ingestion preview with guardrails.</p>
      <p>Pack valid: {validation.valid ? "yes" : "no"}</p>
      {validation.valid ? null : <pre>{JSON.stringify(validation.errors, null, 2)}</pre>}
      <pre>{JSON.stringify(defaultBrandPack, null, 2)}</pre>
    </div>
  );
}
