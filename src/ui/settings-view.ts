import { App, PluginSettingTab, Setting } from "obsidian";
import type GitHubApiSyncPlugin from "../main";

export class SettingsView extends PluginSettingTab {
  private plugin: GitHubApiSyncPlugin;

  constructor(app: App, plugin: GitHubApiSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setHeading().setName("GitHub API sync");

    new Setting(containerEl)
      .setName("GitHub token")
      .setDesc("Requires repo scope for private repositories.")
      .addText((text) =>
        text
          .setPlaceholder("ghp_...")
          .setValue(this.plugin.settings.token)
          .onChange(async (value) => {
            this.plugin.settings.token = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("owner")
      .addText((text) =>
        text
          .setPlaceholder("owner")
          .setValue(this.plugin.settings.owner)
          .onChange(async (value) => {
            this.plugin.settings.owner = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("repository")
      .addText((text) =>
        text
          .setPlaceholder("repo")
          .setValue(this.plugin.settings.repo)
          .onChange(async (value) => {
            this.plugin.settings.repo = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("branch")
      .addText((text) =>
        text
          .setPlaceholder("main")
          .setValue(this.plugin.settings.branch)
          .onChange(async (value) => {
            this.plugin.settings.branch = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Root path")
      .setDesc("Vault-relative path to sync. Leave empty for entire vault.")
      .addText((text) =>
        text
          .setPlaceholder("Journal")
          .setValue(this.plugin.settings.rootPath)
          .onChange(async (value) => {
            this.plugin.settings.rootPath = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Ignore patterns")
      .setDesc("Comma-separated list of ignore patterns.")
      .addTextArea((text) =>
        text
          .setPlaceholder(".git/")
          .setValue(this.plugin.settings.ignorePatterns.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.ignorePatterns = value
              .split(",")
              .map((entry) => entry.trim())
              .filter((entry) => entry.length > 0);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Conflict policy")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("keepBoth", "keep both")
          .addOption("preferLocal", "prefer local")
          .addOption("preferRemote", "prefer remote")
          .addOption("manual", "manual")
          .setValue(this.plugin.settings.conflictPolicy)
          .onChange(async (value) => {
            this.plugin.settings.conflictPolicy = value as typeof this.plugin.settings.conflictPolicy;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Sync interval (minutes)")
      .setDesc("Leave empty to disable scheduled sync.")
      .addText((text) =>
        text
          .setPlaceholder("15")
          .setValue(
            this.plugin.settings.syncIntervalMinutes === null
              ? ""
              : String(this.plugin.settings.syncIntervalMinutes)
          )
          .onChange(async (value) => {
            const trimmed = value.trim();
            this.plugin.settings.syncIntervalMinutes =
              trimmed.length === 0 ? null : Number(trimmed);
            await this.plugin.saveSettings();
          })
      );
  }
}
