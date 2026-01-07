import type { ConflictRecord, SyncConfig, SyncOp } from "../types/sync-types";
import type { ConflictResolver } from "../types/interfaces";

type ConflictReason =
  | "modify-modify"
  | "delete-modify-local"
  | "delete-modify-remote"
  | "local-missing-remote";

export class DefaultConflictResolver implements ConflictResolver {
  async resolve(
    conflicts: SyncOp[],
    policy: SyncConfig["conflictPolicy"]
  ): Promise<{ resolvedOps: SyncOp[]; conflictRecords: ConflictRecord[] }> {
    const resolvedOps: SyncOp[] = [];
    const conflictRecords: ConflictRecord[] = [];

    for (const conflict of conflicts) {
      if (conflict.type !== "conflict") {
        continue;
      }

      const reason = this.normalizeReason(conflict.reason);
      conflictRecords.push(this.buildRecord(conflict.path, reason, policy));

      if (policy === "manual" || policy === "keepBoth") {
        continue;
      }

      if (policy === "preferLocal") {
        resolvedOps.push(this.resolvePreferLocal(conflict.path, reason));
        continue;
      }

      resolvedOps.push(this.resolvePreferRemote(conflict.path, reason));
    }

    return { resolvedOps, conflictRecords };
  }

  private normalizeReason(reason: string): ConflictReason {
    if (reason === "delete-modify-local") {
      return "delete-modify-local";
    }

    if (reason === "delete-modify-remote") {
      return "delete-modify-remote";
    }

    if (reason === "local-missing-remote") {
      return "local-missing-remote";
    }

    return "modify-modify";
  }

  private buildRecord(
    path: string,
    reason: ConflictReason,
    policy: SyncConfig["conflictPolicy"]
  ): ConflictRecord {
    const type = reason === "modify-modify" ? "modify-modify" : "delete-modify";
    return {
      path,
      type,
      reason,
      policy,
      timestamp: new Date().toISOString(),
    };
  }

  private resolvePreferLocal(path: string, reason: ConflictReason): SyncOp {
    if (reason === "delete-modify-local" || reason === "local-missing-remote") {
      return { type: "push_delete", path };
    }

    if (reason === "delete-modify-remote") {
      return { type: "push_new", path };
    }

    return { type: "push_update", path };
  }

  private resolvePreferRemote(path: string, reason: ConflictReason): SyncOp {
    if (reason === "delete-modify-local" || reason === "local-missing-remote") {
      return { type: "pull_update", path };
    }

    if (reason === "delete-modify-remote") {
      return { type: "pull_delete", path };
    }

    return { type: "pull_update", path };
  }
}
