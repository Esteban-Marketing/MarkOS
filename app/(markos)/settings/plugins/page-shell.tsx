import React from "react";

import { defaultBrandPack, getPluginBrandContext } from "../../../../lib/markos/theme/brand-pack";
import styles from "./page-shell.module.css";

const PLUGIN_ID = "digital-agency-v1";

const ALL_CAPABILITIES = [
  { id: "read_campaigns", label: "View Campaigns" },
  { id: "write_campaigns", label: "Create & Edit Campaigns" },
  { id: "publish_campaigns", label: "Publish Campaigns" },
  { id: "read_drafts", label: "View Drafts" },
];

export type PluginSettingsAction = (formData: FormData) => void | Promise<void>;

export type PluginSettingsPageProps = Readonly<{
  savePluginSettingsAction?: PluginSettingsAction;
  disablePluginAction?: PluginSettingsAction;
  /** Plugin slug for the protocol chip — defaults to "digital-agency-v1" */
  pluginSlug?: string;
  /** Whether the plugin is currently disabled */
  disabled?: boolean;
  /** Whether an update is available */
  updateAvailable?: boolean;
  /** Whether the plugin is compatible with the running MarkOS version */
  compatible?: boolean;
  /** Minimum required MarkOS version (used in compatibility warning) */
  minVersion?: string;
  /** Whether the plugin is currently installed/enabled */
  installed?: boolean;
}>;

export function PluginSettingsPageShell({
  savePluginSettingsAction,
  disablePluginAction,
  pluginSlug = "digital-agency-v1",
  disabled = false,
  updateAvailable = false,
  compatible = true,
  minVersion = "1.0.0",
  installed = true,
}: PluginSettingsPageProps) {
  const brandCtx = getPluginBrandContext("current-tenant", defaultBrandPack);
  const capabilityGroups = [
    ALL_CAPABILITIES.slice(0, 2),
    ALL_CAPABILITIES.slice(2),
  ];

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className="c-card">
          <div className={styles.summaryHeader}>
            <div>
              <p className="t-label-caps">Workspace plugin control</p>
              <h1>Plugins</h1>
              <p>
                Enable the tenant-branded campaign workspace, assign capability grants,
                and keep disable controls explicit when access must fail closed.
              </p>
            </div>
            <div className={styles.brandCard}>
              <div className={styles.cardHeader}>
                {brandCtx.logoUrl ? (
                  <img src={brandCtx.logoUrl} alt="Plugin logo" className={styles.logo} />
                ) : (
                  <div className={styles.logoFallback}>DA</div>
                )}
                <div>
                  <p>{brandCtx.label}</p>
                  <p>Tenant-branded workflow surface</p>
                  {/* Plugin slug as protocol chip — P-3 */}
                  <span className="c-chip-protocol">plugin:{pluginSlug}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            {/* Compatibility warning — P-4 */}
            {!compatible && (
              <div className="c-notice c-notice--warning" role="status">
                <strong>[warn]</strong>{" "}This plugin requires MarkOS v{minVersion} or later.
              </div>
            )}

            <article className="c-card">
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Enablement and capability grants</h2>
                  <p>
                    Workspace owners can toggle access and adjust role-safe permissions for
                    campaign drafting, review, and publishing.
                  </p>
                </div>
                {/* Status badges — P-2 */}
                {installed && !disabled && !updateAvailable && (
                  <span className="c-chip c-chip--mint">[ok] Installed</span>
                )}
                {disabled && (
                  <span className="c-badge c-badge--warning">[warn] Disabled</span>
                )}
                {updateAvailable && (
                  <span className="c-badge c-badge--info">[info] Update available</span>
                )}
                {!installed && !disabled && (
                  <span className="c-badge c-badge--info">Not installed</span>
                )}
              </div>

              <form action={savePluginSettingsAction} className={styles.formStack}>
                <input type="hidden" name="plugin_id" value={PLUGIN_ID} />

                <div className={styles.toggleCard}>
                  <div>
                    <p>Enable Digital Agency Plugin</p>
                    <p>
                      Restores the dashboard, campaign workflow routes, and approval surfaces
                      for this workspace.
                    </p>
                  </div>
                  <label htmlFor="plugin-enabled" className={styles.toggleControl}>
                    <span className={styles.srOnly}>Enable Digital Agency Plugin</span>
                    <input id="plugin-enabled" type="checkbox" name="enabled" />
                  </label>
                </div>

                <fieldset className={styles.fieldset}>
                  <legend>Capability grants</legend>
                  <div className={styles.capabilityGrid}>
                    {capabilityGroups.map((group) => (
                      <div key={group.map((cap) => cap.id).join("-")} className={styles.capabilityColumn}>
                        {group.map((cap) => (
                          <label key={cap.id} className={`c-card c-card--interactive ${styles.capabilityCard}`}>
                            <input
                              type="checkbox"
                              name="capabilities"
                              value={cap.id}
                            />
                            <span>{cap.label}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </fieldset>

                <div className={styles.actionRow}>
                  {/* Primary save action — P-2 */}
                  <button type="submit" className="c-button c-button--primary">
                    Save Plugin Settings
                  </button>
                  <button type="button" className="c-button c-button--secondary">
                    Review Route Gate Impact
                  </button>
                </div>
              </form>
            </article>
          </div>

          <aside className={styles.sideColumn}>
            <section className="c-card">
              <h2>What changes when enabled</h2>
              <p>
                The plugin exposes the branded dashboard, campaign assembly flow, draft review,
                and gated publishing permissions for approved users.
              </p>
              <ul className={styles.detailList}>
                <li className={styles.detailItem}>Tenant-branded dashboard and route shell</li>
                <li className={styles.detailItem}>Approval-safe draft workflow access</li>
                <li className={styles.detailItem}>Capability-based publishing controls</li>
              </ul>
            </section>

            <section className="c-card">
              <h2>Disable access</h2>
              <p>
                Disabling the plugin removes workspace access immediately and forces protected
                routes to fail closed until re-enabled.
              </p>
              <form action={disablePluginAction} className={styles.actionRow}>
                <input type="hidden" name="plugin_id" value={PLUGIN_ID} />
                {/* Destructive uninstall action — P-4 */}
                <button type="submit" className="c-button c-button--destructive">
                  Disable Digital Agency Plugin
                </button>
              </form>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}
