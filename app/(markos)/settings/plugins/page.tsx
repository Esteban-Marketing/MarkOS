import { savePluginSettings, disablePlugin } from "./actions";
import { PluginSettingsPageShell, type PluginSettingsPageProps } from "./page-shell";

export default function PluginSettingsPage({
  savePluginSettingsAction = savePluginSettings,
  disablePluginAction = disablePlugin,
}: PluginSettingsPageProps) {
  return (
    <PluginSettingsPageShell
      savePluginSettingsAction={savePluginSettingsAction}
      disablePluginAction={disablePluginAction}
    />
  );
}
