import { Modal, Setting } from "obsidian";
import type GitHubApiSyncPlugin from "../main";
import type { ConflictRecord } from "../types/sync-types";

export class ConflictModal extends Modal {
  private plugin: GitHubApiSyncPlugin;

  constructor(plugin: GitHubApiSyncPlugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  async onOpen(): Promise<void> {
    await this.render();
  }

  private async render(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();

    new Setting(contentEl).setHeading().setName("Sync conflicts");

    const conflicts = await this.plugin.loadConflicts();
    if (conflicts.length === 0) {
      contentEl.createEl("p", { text: "No conflicts." });
      return;
    }

    const list = contentEl.createEl("ul");
    for (const entry of conflicts.slice(-100)) {
      const item = list.createEl("li");
      item.textContent = `[${entry.timestamp}] ${entry.type}: ${entry.path} (${entry.policy})`;
      this.renderActions(item, entry);
    }
  }

  private renderActions(container: HTMLElement, entry: ConflictRecord): void {
    const actionWrap = container.createEl("div");
    const keepLocal = actionWrap.createEl("button", { text: "Keep local" });
    const keepRemote = actionWrap.createEl("button", { text: "Keep remote" });
    const keepBoth = actionWrap.createEl("button", { text: "Keep both" });

    keepLocal.onclick = async () => {
      await this.plugin.resolveConflict(entry, "keepLocal");
      await this.render();
    };
    keepRemote.onclick = async () => {
      await this.plugin.resolveConflict(entry, "keepRemote");
      await this.render();
    };
    keepBoth.onclick = async () => {
      await this.plugin.resolveConflict(entry, "keepBoth");
      await this.render();
    };
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
