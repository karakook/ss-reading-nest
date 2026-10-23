import { describe, expect, it } from "vitest";
import { getWorkerRoute } from "./worker-router.js";

describe("Cloud-hosted kitty thinking drawer route", () => {
  it("keeps the existing reading room route unchanged", () => {
    expect(getWorkerRoute(new URL("https://example.com/mcp/secret"), "secret")).toBe("mcp");
    expect(getWorkerRoute(new URL("https://example.com/reader/secret"), "secret")).toBe("reader");
  });
  it("resolves the independent drawer route only for the matching path token", () => {
    expect(getWorkerRoute(new URL("https://example.com/drawer/mcp/secret"), "secret")).toBe("drawer");
    expect(getWorkerRoute(new URL("https://example.com/drawer/mcp/wrong"), "secret")).toBe("not-found");
    expect(getWorkerRoute(new URL("https://example.com/drawer/mcp/secret"), undefined)).toBe("misconfigured");
  });
});
