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
}>;

export function PluginSettingsPageShell({
  savePluginSettingsAction,
  disablePluginAction,
}: PluginSettingsPageProps) {
  const brandCtx = getPluginBrandContext("current-tenant", defaultBrandPack);
  const capabilityGroups = [
    ALL_CAPABILITIES.slice(0, 2),
    ALL_CAPABILITIES.slice(2),
  ];

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div>
              <p className={styles.eyebrow}>Workspace plugin control</p>
              <h1 className={styles.title}>Digital Agency</h1>
              <p className={styles.summaryText}>
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
                  <p className={styles.brandLabel}>{brandCtx.label}</p>
                  <p className={styles.brandMeta}>Tenant-branded workflow surface</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <article className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Enablement and capability grants</h2>
                  <p className={styles.bodyText}>
                    Workspace owners can toggle access and adjust role-safe permissions for
                    campaign drafting, review, and publishing.
                  </p>
                </div>
                <span className={styles.statusBadge}>Review-ready</span>
              </div>

              <form action={savePluginSettingsAction} className={styles.formStack}>
                <input type="hidden" name="plugin_id" value={PLUGIN_ID} />

                <div className={styles.toggleCard}>
                  <div>
                    <p className={styles.toggleTitle}>Enable Digital Agency Plugin</p>
                    <p className={styles.toggleDescription}>
                      Restores the dashboard, campaign workflow routes, and approval surfaces
                      for this workspace.
                    </p>
                  </div>
                  <label htmlFor="plugin-enabled" className={styles.toggleControl}>
                    <span className={styles.srOnly}>Enable Digital Agency Plugin</span>
                    <input id="plugin-enabled" type="checkbox" name="enabled" className={styles.toggleInput} />
                  </label>
                </div>

                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>Capability grants</legend>
                  <div className={styles.capabilityGrid}>
                    {capabilityGroups.map((group) => (
                      <div key={group.map((cap) => cap.id).join("-")} className={styles.capabilityColumn}>
                        {group.map((cap) => (
                          <label key={cap.id} className={styles.capabilityCard}>
                            <input
                              type="checkbox"
                              name="capabilities"
                              value={cap.id}
                              className={styles.capabilityInput}
                            />
                            <span className={styles.capabilityText}>{cap.label}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </fieldset>

                <div className={styles.actionRow}>
                  <button type="submit" className={styles.primaryButton}>
                    Save Plugin Settings
                  </button>
                  <button type="button" className={styles.secondaryButton}>
                    Review Route Gate Impact
                  </button>
                </div>
              </form>
            </article>
          </div>

          <aside className={styles.sideColumn}>
            <section className={styles.panel}>
              <h2 className={styles.sectionTitle}>What changes when enabled</h2>
              <p className={styles.bodyText}>
                The plugin exposes the branded dashboard, campaign assembly flow, draft review,
                and gated publishing permissions for approved users.
              </p>
              <ul className={styles.detailList}>
                <li className={styles.detailItem}>Tenant-branded dashboard and route shell</li>
                <li className={styles.detailItem}>Approval-safe draft workflow access</li>
                <li className={styles.detailItem}>Capability-based publishing controls</li>
              </ul>
            </section>

            <section className={styles.dangerCard}>
              <h2 className={styles.dangerTitle}>Disable access</h2>
              <p className={styles.dangerText}>
                Disabling the plugin removes workspace access immediately and forces protected
                routes to fail closed until re-enabled.
              </p>
              <form action={disablePluginAction}>
                <input type="hidden" name="plugin_id" value={PLUGIN_ID} />
                <button type="submit" className={styles.dangerButton}>
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