import type { RemoteIndex, SyncBaseline } from "../types/sync-types";
import type { RemoteIndexer } from "../types/interfaces";
import type { GitHubApiClient } from "../clients/github-client";

export class GitHubRemoteIndexer implements RemoteIndexer {
  private client: GitHubApiClient;

  constructor(client: GitHubApiClient) {
    this.client = client;
  }

  async fetchIndex(
    owner: string,
    repo: string,
    branch: string,
    baseline?: SyncBaseline | null
  ): Promise<RemoteIndex> {
    void owner;
    void repo;
    if (!baseline?.commitSha) {
      try {
        return await this.client.listTree(branch);
      } catch (error) {
        if (this.isEmptyRepoError(error)) {
          return {};
        }
        throw error;
      }
    }

    try {
      return await this.buildIncrementalIndex(branch, baseline);
    } catch {
      return this.client.listTree(branch);
    }
  }

  async fetchDiff(baseSha: string, headSha: string): Promise<RemoteIndex> {
    void baseSha;
    return this.client.listTree(headSha);
  }

  private async buildIncrementalIndex(
    branch: string,
    baseline: SyncBaseline
  ): Promise<RemoteIndex> {
    const index: RemoteIndex = {};
    for (const [path, entry] of Object.entries(baseline.entries)) {
      if (entry.sha) {
        index[path] = {
          path,
          sha: entry.sha,
          size: 0,
          lastCommitTime: entry.lastCommitTime ?? 0,
        };
      }
    }

    const comparison = await this.client.compareCommits(baseline.commitSha ?? "", branch);
    const time = Date.parse(comparison.headCommitDate);
    const commitTime = Number.isFinite(time) ? time : 0;

    for (const file of comparison.files) {
      if (file.status === "removed") {
        delete index[file.filename];
        if (file.previous_filename) {
          delete index[file.previous_filename];
        }
        continue;
      }

      if (file.status === "renamed" && file.previous_filename) {
        delete index[file.previous_filename];
      }

      // Use SHA from compareCommits API if available, otherwise fetch file
      let sha: string;
      if (file.sha) {
        sha = file.sha;
      } else {
        const info = await this.client.getFile(file.filename, branch);
        sha = info.sha;
      }

      index[file.filename] = {
        path: file.filename,
        sha,
        size: 0,
        lastCommitTime: commitTime,
      };
    }

    return index;
  }

  private isEmptyRepoError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes("Git Repository is empty");
  }
}
