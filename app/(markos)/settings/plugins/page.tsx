import { defaultBrandPack, getPluginBrandContext } from "../../../../lib/markos/theme/brand-pack";
import { savePluginSettings, disablePlugin } from "./actions";

const PLUGIN_ID = "digital-agency-v1";

// All capabilities exposed by the Digital Agency plugin
const ALL_CAPABILITIES = [
  { id: "read_campaigns", label: "View Campaigns" },
  { id: "write_campaigns", label: "Create & Edit Campaigns" },
  { id: "publish_campaigns", label: "Publish Campaigns" },
  { id: "read_drafts", label: "View Drafts" },
];

export default function PluginSettingsPage() {
  const brandCtx = getPluginBrandContext("current-tenant", defaultBrandPack);

  return (
    <div style={{ fontFamily: "inherit", padding: "2rem", background: "#f5f7fa", minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "0.5rem" }}>Plugin Settings</h2>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Enable plugins and manage capability grants for your workspace.
      </p>

      {/* Digital Agency Plugin Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          maxWidth: "640px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          {brandCtx.logoUrl ? (
            <img src={brandCtx.logoUrl} alt="Plugin logo" style={{ width: 40, height: 40, borderRadius: "0.5rem" }} />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "0.5rem",
                background: brandCtx.primaryColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.25rem",
              }}
            >
              DA
            </div>
          )}
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Digital Agency</h3>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
              Campaign assembly, approval, and publishing workflows
            </p>
          </div>
        </div>

        <form action={savePluginSettings}>
          <input type="hidden" name="plugin_id" value={PLUGIN_ID} />

          {/* Enable toggle */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
              cursor: "pointer",
            }}
          >
            <input type="checkbox" name="enabled" style={{ width: 18, height: 18 }} />
            <span style={{ fontWeight: 500 }}>Enable Digital Agency Plugin</span>
          </label>

          {/* Capability grants */}
          <fieldset
            style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1.25rem" }}
          >
            <legend style={{ fontWeight: 500, padding: "0 0.5rem", fontSize: "0.875rem" }}>
              Capability Grants
            </legend>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {ALL_CAPABILITIES.map((cap) => (
                <label key={cap.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <input type="checkbox" name="capabilities" value={cap.id} style={{ width: 16, height: 16 }} />
                  {cap.label}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            style={{
              background: brandCtx.primaryColor,
              color: brandCtx.primaryTextColor,
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.6rem 1.5rem",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Save Plugin Settings
          </button>
        </form>
      </div>

      {/* Destructive zone */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #fca5a5",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          maxWidth: "640px",
        }}
      >
        <h4 style={{ margin: "0 0 0.5rem", color: "#dc2626" }}>Danger Zone</h4>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
          Disabling the plugin will immediately remove access for all workspace members.
        </p>
        <form action={disablePlugin}>
          <input type="hidden" name="plugin_id" value={PLUGIN_ID} />
          <button
            type="submit"
            style={{
              background: "#dc2626",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.6rem 1.5rem",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Disable Digital Agency Plugin: Confirm disable.
          </button>
        </form>
      </div>
    </div>
  );
}
