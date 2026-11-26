import { describe, expect, it } from "vitest";
import { addDrawerHostBridge } from "./kitty-drawer-host-bridge.js";
import { COMPRESSED_WIDGET } from "./kitty-drawer-widget.js";

async function originalHtml() {
  const bytes = Uint8Array.from(atob(COMPRESSED_WIDGET), c => c.charCodeAt(0));
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
}
describe("drawer standard host bridge", () => {
  it("patches the actual compressed widget and keeps legacy APIs", async () => {
    const html = addDrawerHostBridge(await originalHtml());
    expect(html).toContain('method:"ui/initialize"');
    expect(html).toContain('drawerNotify("ui/notifications/initialized",{})');
    expect(html).toContain('ui/notifications/tool-input');
    expect(html).toContain('ui/notifications/tool-result');
    expect(html).toContain('ui/notifications/size-changed');
    expect(html).toContain('setWidgetState');
    expect(html).toContain('openai:set_globals');
    expect(html).toContain('drawerConnect();\nrender();');
  });
  it("rejects changed source instead of silently dropping the bridge", () => {
    expect(() => addDrawerHostBridge("<html></html>")).toThrow(/anchor missing/);
  });
});
