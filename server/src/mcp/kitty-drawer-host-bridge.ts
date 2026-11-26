// Standard MCP Apps lifecycle, with the original ChatGPT compatibility API intact.
const BRIDGE = "\nlet drawerBridgeReady=false;\nlet drawerBridgeInput={};\nlet drawerBridgeResult={};\nlet drawerBridgeContext={};\nlet drawerBridgeHeight=-1;\nconst drawerInitId=\"kitty-drawer-init\";\nfunction drawerNotify(method,params){\n  window.parent.postMessage({jsonrpc:\"2.0\",method,params},\"*\");\n}\nfunction drawerStandardRender(){\n  const result=drawerBridgeResult||{};\n  const context=drawerBridgeContext||{};\n  const dimensions=context.containerDimensions||{};\n  render({detail:{globals:{\n    toolInput:Object.assign({},(window.openai||{}).toolInput||{},drawerBridgeInput),\n    toolOutput:Object.assign({},(window.openai||{}).toolOutput||{},result.structuredContent||{}),\n    toolResponseMetadata:result._meta||((window.openai||{}).toolResponseMetadata||{}),\n    maxHeight:dimensions.maxHeight||dimensions.height||(window.openai||{}).maxHeight\n  }}});\n}\nfunction drawerStandardResize(){\n  if(!drawerBridgeReady)return;\n  const h=Math.ceil(document.body.getBoundingClientRect().height);\n  if(h>0&&h!==drawerBridgeHeight){\n    drawerBridgeHeight=h;\n    drawerNotify(\"ui/notifications/size-changed\",{height:h});\n  }\n}\nfunction drawerBridgeMessage(event){\n  if(event.source!==window.parent)return;\n  const m=event.data;\n  if(!m||m.jsonrpc!==\"2.0\")return;\n  if(m.id===drawerInitId&&!m.method){\n    if(m.error||!m.result||drawerBridgeReady)return;\n    drawerBridgeContext=m.result.hostContext||{};\n    drawerBridgeReady=true;\n    drawerNotify(\"ui/notifications/initialized\",{});\n    drawerStandardRender();\n    return;\n  }\n  if(!drawerBridgeReady)return;\n  const p=m.params||{};\n  if(m.method===\"ui/notifications/tool-input\"){\n    drawerBridgeInput=p.arguments||{};\n    drawerStandardRender();\n  }else if(m.method===\"ui/notifications/tool-result\"){\n    drawerBridgeResult=p;\n    drawerStandardRender();\n  }else if(m.method===\"ui/notifications/host-context-changed\"){\n    drawerBridgeContext=Object.assign({},drawerBridgeContext,p);\n    drawerStandardRender();\n  }else if((m.method===\"ping\"||m.method===\"ui/resource-teardown\")&&m.id!==undefined){\n    window.parent.postMessage({jsonrpc:\"2.0\",id:m.id,result:{}},\"*\");\n  }\n}\nfunction drawerConnect(){\n  if(window.parent===window)return;\n  window.addEventListener(\"message\",drawerBridgeMessage);\n  try{\n    window.parent.postMessage({jsonrpc:\"2.0\",id:drawerInitId,method:\"ui/initialize\",params:{\n      appInfo:{name:\"kitty-thinking-drawer\",version:\"1.1.2\"},\n      appCapabilities:{availableDisplayModes:[\"inline\"]},\n      protocolVersion:\"2026-01-26\"\n    }},\"*\");\n  }catch(_){}\n}\n";
export function addDrawerHostBridge(html: string): string {
  const anchors = [
    "let frame=0;",
    "function heightChanged(){",
    "window.addEventListener('openai:set_globals',render);",
    "render();\n})();"
  ];
  for (const anchor of anchors) {
    if (!html.includes(anchor)) throw new Error("Drawer bridge anchor missing: " + anchor);
  }
  return html
    .replace(anchors[0], anchors[0] + "\n" + BRIDGE)
    .replace(anchors[1], anchors[1] + "\n  if(drawerBridgeReady){requestAnimationFrame(drawerStandardResize);return;}")
    .replace(anchors[2], "window.addEventListener('openai:set_globals',event=>{if(drawerBridgeReady)drawerStandardRender();else render(event);});")
    .replace(anchors[3], "drawerConnect();\nrender();\n})();");
}
