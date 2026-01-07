import { describe, expect, it, vi } from "vitest";
import { GitHubApiClient } from "../src/clients/github-client";

type MockResponse = {
  ok: boolean;
  status: number;
  headers: { get: (name: string) => string | null };
  json: () => Promise<any>;
  text: () => Promise<string>;
};

const makeResponse = (options: {
  ok: boolean;
  status: number;
  json?: any;
  text?: string;
  headers?: Record<string, string>;
}): MockResponse => {
  const headerMap = new Map<string, string>();
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headerMap.set(key.toLowerCase(), value);
    }
  }

  return {
    ok: options.ok,
    status: options.status,
    headers: {
      get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
    },
    json: async () => options.json ?? {},
    text: async () => options.text ?? "",
  };
};

describe("GitHubApiClient", () => {
  it("retries on 429", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse({ ok: false, status: 429, headers: { "retry-after": "0" } }))
      .mockResolvedValueOnce(makeResponse({ ok: true, status: 200, json: { content: "Zg==", sha: "s" } }));

    globalThis.fetch = fetchMock as any;

    const client = new GitHubApiClient("t", "o", "r");
    const promise = client.getFile("a.md", "main");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.sha).toBe("s");
    vi.useRealTimers();
  });

  it("retries on rate limit 403", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({
          ok: false,
          status: 403,
          headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "0" },
        })
      )
      .mockResolvedValueOnce(makeResponse({ ok: true, status: 200, json: { sha: "s" } }));

    globalThis.fetch = fetchMock as any;

    const client = new GitHubApiClient("t", "o", "r");
    const promise = client.getCommitSha("main");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toBe("s");
    vi.useRealTimers();
  });

  it("does not retry on 401", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({ ok: false, status: 401, text: "unauthorized" })
    );
    globalThis.fetch = fetchMock as any;

    const client = new GitHubApiClient("t", "o", "r");
    await expect(client.getFile("a.md", "main")).rejects.toThrow("401");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws conflict error on 409", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({ ok: false, status: 409, text: "conflict" })
    );
    globalThis.fetch = fetchMock as any;

    const client = new GitHubApiClient("t", "o", "r");
    await expect(client.getCommitSha("main")).rejects.toThrow("409");
  });

  it("encodes path segments", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({ ok: true, status: 200, json: { content: "Zg==", sha: "s" } })
    );
    globalThis.fetch = fetchMock as any;

    const client = new GitHubApiClient("t", "o", "r");
    await client.getFile("folder/a b.md", "main");

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("folder/a%20b.md");
  });
});
