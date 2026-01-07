import type { ConflictRecord, SyncBaseline, SyncLogEntry } from "../types/sync-types";
import type { StateStore } from "../types/interfaces";
import type { Plugin } from "obsidian";

type StoredState = {
  baseline: SyncBaseline | null;
  conflicts: ConflictRecord[];
  logs: SyncLogEntry[];
};

export class PluginStateStore implements StateStore {
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  async loadBaseline(): Promise<SyncBaseline | null> {
    const state = await this.loadState();
    return state.baseline;
  }

  async saveBaseline(baseline: SyncBaseline): Promise<void> {
    const state = await this.loadState();
    state.baseline = baseline;
    await this.plugin.saveData(state);
  }

  async saveConflicts(records: ConflictRecord[]): Promise<void> {
    const state = await this.loadState();
    state.conflicts = records;
    await this.plugin.saveData(state);
  }

  async loadConflicts(): Promise<ConflictRecord[]> {
    const state = await this.loadState();
    return state.conflicts;
  }

  async appendLog(entry: SyncLogEntry): Promise<void> {
    const state = await this.loadState();
    state.logs.push(entry);
    if (state.logs.length > 500) {
      state.logs = state.logs.slice(-500);
    }
    await this.plugin.saveData(state);
  }

  async loadLogs(): Promise<SyncLogEntry[]> {
    const state = await this.loadState();
    return state.logs;
  }

  private async loadState(): Promise<StoredState> {
    const raw = await this.plugin.loadData();
    const state = (raw ?? {}) as Partial<StoredState>;
    return {
      baseline: state.baseline ?? null,
      conflicts: state.conflicts ?? [],
      logs: state.logs ?? [],
    };
  }
}
