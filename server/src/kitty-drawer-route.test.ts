import { describe, expect, it } from "vitest";
import { getWorkerRoute } from "./worker-router.js";

describe("Cloud-hosted kitty thinking drawer route", () => {
  const origin = "https://example.com";
  it("keeps all existing reading-room routes unchanged", () => {
    expect(getWorkerRoute(new URL(`${origin}/mcp/book-key`), "book-key", "drawer-key")).toBe("mcp");
    expect(getWorkerRoute(new URL(`${origin}/reader/book-key`), "book-key", "drawer-key")).toBe("reader");
    expect(getWorkerRoute(new URL(`${origin}/source/book-key/state`), "book-key", "drawer-key")).toBe("source");
    expect(getWorkerRoute(new URL(`${origin}/health`), "book-key", "drawer-key")).toBe("health");
  });
  it("only accepts the drawer's independently configured secret", () => {
    expect(getWorkerRoute(new URL(`${origin}/drawer/mcp/drawer-key`), "book-key", "drawer-key")).toBe("drawer");
    expect(getWorkerRoute(new URL(`${origin}/drawer/mcp/book-key`), "book-key", "drawer-key")).toBe("not-found");
    expect(getWorkerRoute(new URL(`${origin}/drawer/mcp/wrong`), "book-key", "drawer-key")).toBe("not-found");
  });
  it("keeps the drawer disabled until its own secret is provisioned", () => {
    expect(getWorkerRoute(new URL(`${origin}/drawer/mcp/book-key`), "book-key")).toBe("not-found");
    expect(getWorkerRoute(new URL(`${origin}/drawer/mcp/drawer-key`), "book-key")).toBe("not-found");
    expect(getWorkerRoute(new URL(`${origin}/mcp/book-key`), "book-key")).toBe("mcp");
  });
  it("continues the pre-existing fail-closed behavior when book secret is missing", () => {
    expect(getWorkerRoute(new URL(`${origin}/drawer/mcp/drawer-key`), undefined, "drawer-key")).toBe("misconfigured");
  });
});
