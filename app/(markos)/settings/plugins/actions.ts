"use server";

/**
 * app/(markos)/settings/plugins/actions.ts
 *
 * Next.js Server Actions for plugin settings management.
 * Delegates to /api/tenant-plugin-settings for persistence.
 *
 * Phase 52 — Plan 03 (Task 52-03-01)
 */

export async function savePluginSettings(formData: FormData) {
  "use server";
  const pluginId = formData.get("plugin_id") as string;
  const enabled = formData.get("enabled") === "on";
  const capabilities = formData.getAll("capabilities") as string[];

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/tenant-plugin-settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plugin_id: pluginId, enabled, capabilities }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to save plugin settings");
  }

  return response.json();
}

export async function disablePlugin(formData: FormData) {
  "use server";
  const pluginId = formData.get("plugin_id") as string;
  return savePluginSettings(
    Object.assign(new FormData(), {
      get: (k: string) => (k === "plugin_id" ? pluginId : k === "enabled" ? null : null),
      getAll: () => [],
    } as unknown as FormData)
  );
}
