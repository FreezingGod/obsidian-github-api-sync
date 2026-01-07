import { Modal } from "obsidian";
import type GitHubApiSyncPlugin from "../main";

export class SyncLogModal extends Modal {
  private plugin: GitHubApiSyncPlugin;

  constructor(plugin: GitHubApiSyncPlugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Sync Log" });

    const logs = await this.plugin.loadSyncLogs();
    if (logs.length === 0) {
      contentEl.createEl("p", { text: "No logs yet." });
      return;
    }

    const text = logs
      .slice(-200)
      .map((entry) => `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`)
      .join("\n");

    const textarea = contentEl.createEl("textarea");
    textarea.value = text;
    textarea.readOnly = true;
    textarea.rows = 18;
    textarea.cols = 60;
    textarea.style.width = "100%";
    textarea.style.minHeight = "320px";
  }
}
