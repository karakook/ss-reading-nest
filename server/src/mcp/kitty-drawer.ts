import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { COMPRESSED_WIDGET } from "./kitty-drawer-widget.js";

export const KITTY_DRAWER_URI = "ui://widget/kitty-thinking-drawer-cloud-v1.html";
let widgetHtmlPromise: Promise<string> | undefined;

// Return the exact original dual-skin widget, with no remote asset downloads.
async function loadWidgetHtml(): Promise<string> {
  widgetHtmlPromise ??= (async () => {
    const compressed = Uint8Array.from(atob(COMPRESSED_WIDGET), c => c.charCodeAt(0));
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  })();
  return widgetHtmlPromise;
}

const Args = z.object({
  style: z.enum(["relational", "deep_think"]),
  thinking: z.string().max(16000),
  effort: z.enum(["low", "medium", "high"]),
  skin: z.enum(["rose-noir", "ribbon-pearl", "botanical", "microglow"])
});

export function createKittyDrawerMcpServer(): McpServer {
  const server = new McpServer({ name: "巴巴和小猫的思考抽屉", version: "1.0.0" });
  registerAppTool(server, "render_thinking_block", {
    title: "展开可见思路说明",
    description: "Render a concise USER-VISIBLE explanation card, not hidden chain-of-thought. Choose relational for personal chats and deep_think for reasoning, and honor the requested theme. The card can collapse and switch between rose-noir and ribbon-pearl. No chat content is stored by this service.",
    inputSchema: Args,
    annotations: {
      readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false
    },
    _meta: {
      ui: { resourceUri: KITTY_DRAWER_URI },
      "openai/outputTemplate": KITTY_DRAWER_URI,
      "openai/widgetAccessible": true,
      "openai/toolInvocation/invoking": "打开小猫的思考抽屉…",
      "openai/toolInvocation/invoked": "思考抽屉已打开"
    }
  }, async (args) => ({
    content: [{ type: "text", text: "rendered" }],
    _meta: {
      style: args.style, thinking: args.thinking, effort: args.effort, skin: args.skin
    }
  }));
  registerAppResource(server, "胭脂夜猫和丝带珍珠双皮肤", KITTY_DRAWER_URI, {
    description: "一张可折叠、可换装的中文可见思路说明卡",
    _meta: {
      ui: { prefersBorder: true },
      "openai/widgetPrefersBorder": true,
      "openai/widgetDescription": "私人的可见思路说明卡，绝不展示隐藏思考链"
    }
  }, async () => ({
    contents: [{
      uri: KITTY_DRAWER_URI, mimeType: RESOURCE_MIME_TYPE,
      text: await loadWidgetHtml(),
      _meta: {
        ui: { prefersBorder: true },
        "openai/widgetPrefersBorder": true,
        "openai/widgetDescription": "胭脂夜猫 / 丝带珍珠"
      }
    }]
  }));
  return server;
}
