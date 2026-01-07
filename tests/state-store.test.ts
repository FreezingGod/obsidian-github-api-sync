import { describe, expect, it } from "vitest";
import { PluginStateStore } from "../src/storage/state-store";
import type { ConflictRecord, SyncBaseline } from "../src/types/sync-types";

class FakePlugin {
  private data: any = null;
  async loadData() {
    return this.data;
  }
  async saveData(data: any) {
    this.data = data;
  }
}

describe("PluginStateStore", () => {
  it("persists baseline", async () => {
    const plugin = new FakePlugin();
    const store = new PluginStateStore(plugin as any);
    const baseline: SyncBaseline = { commitSha: "a", entries: { "a.md": { path: "a.md" } } };

    await store.saveBaseline(baseline);
    const loaded = await store.loadBaseline();

    expect(loaded).toEqual(baseline);
  });

  it("persists conflicts", async () => {
    const plugin = new FakePlugin();
    const store = new PluginStateStore(plugin as any);
    const conflicts: ConflictRecord[] = [
      {
        path: "a.md",
        type: "modify-modify",
        reason: "modify-modify",
        policy: "manual",
        timestamp: "now",
      },
    ];

    await store.saveConflicts(conflicts);
    const loaded = await store.loadConflicts();

    expect(loaded).toEqual(conflicts);
  });

  it("caps log length", async () => {
    const plugin = new FakePlugin();
    const store = new PluginStateStore(plugin as any);

    for (let i = 0; i < 600; i += 1) {
      await store.appendLog({ timestamp: String(i), level: "info", message: "m" });
    }

    const logs = await store.loadLogs();
    expect(logs).toHaveLength(500);
    expect(logs[0].timestamp).toBe("100");
  });
});
