import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { COMPRESSED_WIDGET } from "./kitty-drawer-widget.js";
import { polishKittyDrawerHtml } from "./kitty-drawer-chrome.js";
import { addDrawerHostBridge } from "./kitty-drawer-host-bridge.js";

export const KITTY_DRAWER_URI = "ui://widget/kitty-thinking-drawer-cloud-v4.html";
export const PREVIOUS_KITTY_DRAWER_URI = "ui://widget/kitty-thinking-drawer-cloud-v2.html";
export const LEGACY_KITTY_DRAWER_URI = "ui://widget/kitty-thinking-drawer-cloud-v1.html";
let widgetHtmlPromise: Promise<string> | undefined;

// Return the exact original dual-skin widget, with no remote asset downloads.
async function loadWidgetHtml(): Promise<string> {
  widgetHtmlPromise ??= (async () => {
    const compressed = Uint8Array.from(atob(COMPRESSED_WIDGET), c => c.charCodeAt(0));
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
    return addDrawerHostBridge(polishKittyDrawerHtml(await new Response(stream).text()));
  })();
  return widgetHtmlPromise;
}

const Args = z.object({
  style: z.enum(["relational", "deep_think"]),
  thinking: z.string().max(16000).describe("User-visible summary only. Default to 1–3 concise sentences. Longer summaries are optional; never pad to a minimum length."),
  effort: z.enum(["low", "medium", "high"]).describe("Use low by default. Medium/high are summary detail levels, not model thinking settings."),
  skin: z.enum(["rose-noir", "ribbon-pearl", "botanical", "microglow"])
});

export function createKittyDrawerMcpServer(): McpServer {
  const server = new McpServer({ name: "巴巴和小猫的思考抽屉", version: "1.1.2" });
  registerAppTool(server, "render_thinking_block", {
    title: "展开可见思路说明",
    description: "Optional user-visible summary card, never hidden chain-of-thought. Use only when requested or genuinely helpful; skip greetings and simple replies unless explicitly requested. Make at most one card per reply. Default to effort low and 1–3 short sentences (roughly 60–150 Chinese characters), without duplicating the final answer. Use medium/high and longer summaries only when the user requests more detail or the task merits it. Choose relational for personal chats and deep_think for analytical explanations. Preserve the requested skin. The effort field controls summary detail, not model reasoning time. No conversation content is stored by this service.",
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
    structuredContent: { style: args.style, effort: args.effort, skin: args.skin },
    _meta: {
      style: args.style, thinking: args.thinking, effort: args.effort, skin: args.skin
    }
  }));
  // Keep old resource aliases; use v4 for the standard host handshake.
  for (const resourceUri of [KITTY_DRAWER_URI, PREVIOUS_KITTY_DRAWER_URI, LEGACY_KITTY_DRAWER_URI]) {
    registerAppResource(server, "胭脂夜猫和丝带珍珠双皮肤", resourceUri, {
      description: "一张可折叠、可换装的中文可见思路说明卡",
      _meta: {
        ui: { prefersBorder: true },
        "openai/widgetPrefersBorder": true,
        "openai/widgetDescription": "私人的可见思路说明卡，绝不展示隐藏思考链"
      }
    }, async () => ({
      contents: [{
        uri: resourceUri,
        mimeType: RESOURCE_MIME_TYPE,
        text: await loadWidgetHtml(),
        _meta: {
          ui: { prefersBorder: true },
          "openai/widgetPrefersBorder": true,
          "openai/widgetDescription": "胭脂夜猫 / 丝带珍珠"
        }
      }]
    }));
  }
  return server;
}
