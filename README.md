# Job Express

Job Express 是一套面向求职准备的本地优先工具。它把简历编辑、简历优化、模拟训练、面试形象分析和求职记录放在同一个工作区中，帮助用户按步骤完成准备并持续复盘。

## 核心功能

- 首页行动路径：从简历完善、模拟训练、形象检查到求职记录逐步推进。
- 简历工作台：支持多套模板、实时预览、版式调整、JSON 备份和 Markdown 导出。
- 本地 PDF 保存：使用浏览器打印能力保存 PDF，不向额外的 PDF 服务发送简历内容。
- 模拟训练：使用 DeepSeek V4 Flash 或 DeepSeek V4 Pro。
- 简历 AI 辅助：使用 DeepSeek V4 Flash 或 DeepSeek V4 Pro。
- 面试形象分析：使用通义千问视觉模型，默认推荐 Qwen 3.6 Plus。
- 数据存储：简历、设置和 API 密钥默认保存在当前浏览器。

## AI 服务配置

在首页右上角进入“设置”，可以分别配置：

| 场景 | 服务商 | 可选模型 |
| --- | --- | --- |
| 简历优化与模拟训练 | DeepSeek | `deepseek-v4-flash`、`deepseek-v4-pro` |
| 面试形象分析 | 通义千问 | `qwen3.6-plus`、`qwen3.6-flash` |
| 语音识别 | 浏览器或 DashScope | 浏览器内置识别、DashScope 录音转写 |

使用 AI 功能时，相关文本、音频或照片会发送至用户选择的服务商。保存 PDF 使用浏览器本地打印能力。

## 本地开发

环境要求：

- Node.js 20+
- pnpm 10+

```bash
corepack enable
pnpm install
pnpm dev
```

默认开发地址为 `http://127.0.0.1:3000/`。

## 构建与运行

```bash
pnpm build
pnpm start
```

生产服务默认监听 `3000` 端口，也可以通过 `PORT` 和 `HOSTNAME` 环境变量调整。

## 常用脚本

```bash
pnpm dev
pnpm build
pnpm start
pnpm preview
pnpm generate:template-snapshots
```

生成模板快照前，需要先安装 Playwright Chromium：

```bash
pnpm install:playwright
```

## 目录说明

```text
src/routes/              TanStack 路由入口
src/features/career/     模拟训练、形象分析和求职记录
src/components/          简历工作台与通用组件
src/store/               浏览器本地状态
src/config/              AI 模型与默认配置
public/                  静态资源
```

## 隐私说明

- 简历和设置默认保存在当前浏览器。
- API 密钥默认保存在当前浏览器。
- PDF 保存过程在浏览器本地完成。
- 启用 AI 功能前，请根据实际部署环境补充服务商隐私政策和用户授权提示。

## 许可与第三方说明

项目保留了依法需要保留的许可文件。部署、分发或商业使用前，请阅读 [LICENSE](./LICENSE)，并核对第三方依赖和字体许可。
