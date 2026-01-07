import { describe, expect, it } from "vitest";
import { DefaultSyncPlanner } from "../src/core/sync-planner";
import type { LocalIndex, RemoteIndex, SyncBaseline } from "../src/types/sync-types";

const planner = new DefaultSyncPlanner();

const makeBaseline = (entries: SyncBaseline["entries"], commitSha = "base") => ({
  commitSha,
  entries,
});

const localEntry = (path: string, hash: string) => ({
  path,
  hash,
  mtime: 1,
  size: 10,
});

const remoteEntry = (path: string, sha: string) => ({
  path,
  sha,
  size: 10,
  lastCommitTime: 1,
});

describe("DefaultSyncPlanner", () => {
  it("plans push_new for new local file", () => {
    const local: LocalIndex = { "a.md": localEntry("a.md", "h1") };
    const remote: RemoteIndex = {};
    const baseline: SyncBaseline | null = null;

    const result = planner.plan(local, remote, baseline);
    expect(result.ops).toEqual([{ type: "push_new", path: "a.md" }]);
  });

  it("plans pull_new for new remote file", () => {
    const local: LocalIndex = {};
    const remote: RemoteIndex = { "b.md": remoteEntry("b.md", "s1") };
    const baseline: SyncBaseline | null = null;

    const result = planner.plan(local, remote, baseline);
    expect(result.ops).toEqual([{ type: "pull_new", path: "b.md" }]);
  });

  it("plans update when local changed", () => {
    const local: LocalIndex = { "c.md": localEntry("c.md", "h2") };
    const remote: RemoteIndex = { "c.md": remoteEntry("c.md", "s1") };
    const baseline = makeBaseline({
      "c.md": { path: "c.md", hash: "h1", sha: "s1" },
    });

    const result = planner.plan(local, remote, baseline);
    expect(result.ops).toEqual([{ type: "push_update", path: "c.md" }]);
  });

  it("plans update when remote changed", () => {
    const local: LocalIndex = { "d.md": localEntry("d.md", "h1") };
    const remote: RemoteIndex = { "d.md": remoteEntry("d.md", "s2") };
    const baseline = makeBaseline({
      "d.md": { path: "d.md", hash: "h1", sha: "s1" },
    });

    const result = planner.plan(local, remote, baseline);
    expect(result.ops).toEqual([{ type: "pull_update", path: "d.md" }]);
  });

  it("plans delete when local removed", () => {
    const local: LocalIndex = {};
    const remote: RemoteIndex = { "e.md": remoteEntry("e.md", "s1") };
    const baseline = makeBaseline({
      "e.md": { path: "e.md", hash: "h1", sha: "s1" },
    });

    const result = planner.plan(local, remote, baseline);
    expect(result.ops).toEqual([]);
    expect(result.conflicts).toEqual([
      { type: "conflict", path: "e.md", reason: "local-missing-remote" },
    ]);
  });

  it("plans delete when remote removed", () => {
    const local: LocalIndex = { "f.md": localEntry("f.md", "h1") };
    const remote: RemoteIndex = {};
    const baseline = makeBaseline({
      "f.md": { path: "f.md", hash: "h1", sha: "s1" },
    });

    const result = planner.plan(local, remote, baseline);
    expect(result.ops).toEqual([{ type: "pull_delete", path: "f.md" }]);
  });

  it("flags conflict when both changed", () => {
    const local: LocalIndex = { "g.md": localEntry("g.md", "h2") };
    const remote: RemoteIndex = { "g.md": remoteEntry("g.md", "s2") };
    const baseline = makeBaseline({
      "g.md": { path: "g.md", hash: "h1", sha: "s1" },
    });

    const result = planner.plan(local, remote, baseline);
    expect(result.conflicts).toEqual([{ type: "conflict", path: "g.md", reason: "modify-modify" }]);
  });

  it("flags conflict when delete-modify", () => {
    const local: LocalIndex = { "h.md": localEntry("h.md", "h2") };
    const remote: RemoteIndex = {};
    const baseline = makeBaseline({
      "h.md": { path: "h.md", hash: "h1", sha: "s1" },
    });

    const result = planner.plan(local, remote, baseline);
    expect(result.conflicts).toEqual([
      { type: "conflict", path: "h.md", reason: "delete-modify-remote" },
    ]);
  });

  it("flags conflict when local missing but remote unchanged", () => {
    const local: LocalIndex = {};
    const remote: RemoteIndex = { "i.md": remoteEntry("i.md", "s1") };
    const baseline = makeBaseline({
      "i.md": { path: "i.md", hash: "h1", sha: "s1" },
    });

    const result = planner.plan(local, remote, baseline);
    expect(result.conflicts).toEqual([
      { type: "conflict", path: "i.md", reason: "local-missing-remote" },
    ]);
    expect(result.ops).toEqual([]);
  });

  it("detects local rename", () => {
    const local: LocalIndex = { "new.md": localEntry("new.md", "h1") };
    const remote: RemoteIndex = { "old.md": remoteEntry("old.md", "s1") };
    const baseline = makeBaseline({
      "old.md": { path: "old.md", hash: "h1", sha: "s1" },
    });

    const result = planner.plan(local, remote, baseline);
    expect(result.ops).toEqual([{ type: "rename_local", from: "old.md", to: "new.md" }]);
  });

  it("detects remote rename", () => {
    const local: LocalIndex = { "old.md": localEntry("old.md", "h1") };
    const remote: RemoteIndex = { "new.md": remoteEntry("new.md", "s1") };
    const baseline = makeBaseline({
      "old.md": { path: "old.md", hash: "h1", sha: "s1" },
    });

    const result = planner.plan(local, remote, baseline);
    expect(result.ops).toEqual([{ type: "rename_remote", from: "old.md", to: "new.md" }]);
  });

  it("handles rename plus delete", () => {
    const local: LocalIndex = { "renamed.md": localEntry("renamed.md", "h1") };
    const remote: RemoteIndex = {
      "gone.md": remoteEntry("gone.md", "s2"),
      "old.md": remoteEntry("old.md", "s1"),
    };
    const baseline = makeBaseline({
      "old.md": { path: "old.md", hash: "h1", sha: "s1" },
      "gone.md": { path: "gone.md", hash: "h2", sha: "s2" },
    });

    const result = planner.plan(local, remote, baseline);
    expect(result.ops).toEqual([
      { type: "rename_local", from: "old.md", to: "renamed.md" },
    ]);
    expect(result.conflicts).toEqual([
      { type: "conflict", path: "gone.md", reason: "local-missing-remote" },
    ]);
  });
});
