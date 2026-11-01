# 云端思考抽屉 · 独立私人令牌

云端思考抽屉与书房共用现有 Cloudflare Worker 的算力和构建环境，但**不共用访问令牌、MCP 工具或用户存储**。

- 云端抽屉：`https://ss-reading-nest.a755928137.workers.dev/drawer/mcp/<DRAWER_PATH_TOKEN>`
- 原书房：`https://ss-reading-nest.a755928137.workers.dev/mcp/<MCP_PATH_TOKEN>`

## 一次性配置（只需 Cloudflare 网页后台，不需要 Windows 命令行）

1. 打开 `https://dash.cloudflare.com/` → **Workers & Pages** → 选择 `ss-reading-nest` → **Settings** → **Variables and Secrets** → **Add**。
2. **Type** 选 `Secret`，**Variable name** 精确填写 `DRAWER_PATH_TOKEN`。
3. **Value** 填写用户自己生成并妥善保管的强随机令牌（例如密码管理器生成的 32 位以上随机十六进制字符串；请勿把它发给聊天助手）。此令牌与书房的 `MCP_PATH_TOKEN` 完全不同，且原书房 secret 必须保留。
4. 点击 **Deploy** 保存。不要编辑或删除原有 `MCP_PATH_TOKEN` / D1 / R2。
5. 在自己的记事本拼出抽屉完整 URL：`https://ss-reading-nest.a755928137.workers.dev/drawer/mcp/` + 第 3 步的令牌。不要把完整私密 URL 放进 GitHub、公共截图或聊天消息。
6. ChatGPT 的 **添加自定义 MCP 服务器** 选择 **服务器 URL**（不是安全隧道）；粘贴完整 URL、认证选“无需身份验证”。新建后实际调用 `render_thinking_block` 并验证“胭脂夜猫 / 丝带珍珠”两种主题。
7. 只有电脑关机后在手机端验证成功，才关闭/卸载旧 Windows 隧道版本。

## 行为与边界

- `DRAWER_PATH_TOKEN` 未设置或错误时，云端抽屉返回 404，不会回退到书房令牌。
- `MCP_PATH_TOKEN` 和书房 `/mcp/`、`/reader/`、`/source/` 路由完全不变。
- 两种卡片皮肤均随 Worker 部署；不依赖本地电脑、VPN、Secure MCP Tunnel，也不存储对话。
- URL 包含私人凭据。若令牌泄露，通过 Cloudflare 后台轮换 `DRAWER_PATH_TOKEN`，然后更新 ChatGPT 服务器 URL。
- 此应用只显示可见的解释说明，不显示不可见的内部推理。
