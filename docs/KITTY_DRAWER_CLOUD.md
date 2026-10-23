# 云端思考抽屉（小猫版）
本功能复用现有 **ss-reading-nest** Cloudflare Worker 的部署，不使用 Windows、VPN、Secure MCP Tunnel 或额外数据库。两个 MCP 端点的实现是隔离的：

- 书房：`https://ss-reading-nest.a755928137.workers.dev/mcp/<MCP_PATH_TOKEN>`（保持原样）
- 思考抽屉：`https://ss-reading-nest.a755928137.workers.dev/drawer/mcp/<MCP_PATH_TOKEN>`

`MCP_PATH_TOKEN` 是已经配置在 Cloudflare Worker 上的秘密；**不要提交到 GitHub 或发送给聊天助手**。从已能使用的书房 MCP 连接地址，保留末尾秘密，仅在自己的设备上将 `/mcp/` 改成 `/drawer/mcp/`。

在 ChatGPT 中添加自定义 MCP 服务器时选择“服务器 URL”，粘贴云端思考抽屉地址（非 Tunnel ID），认证选“无需身份验证”（私密 URL 路径本身就是 bearer 令牌，应保护好）。保持旧 Windows 版本作为回退，直到真实工具 `render_thinking_block` 可以调用且卡片能够折叠换装。

Cloudflare 部署前请确保现有 Workers Builds 的 GitHub 自动部署还在运行。这个模块只增加新路由，不修改读书数据、D1、R2、阅读 UI 或原来的 MCP 工具。

资源和工具：`render_thinking_block`，`relational | deep_think`，`rose-noir | ribbon-pearl`，折叠与切换皮肤。这里只显示用户可见的解释说明，不涉及隐藏推理链，也不会把对话内容写入云端存储。
