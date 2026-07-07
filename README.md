# 小迹旅行手办 Demo

小迹是一个围绕“旅行手办”组织旅行记忆的 Web demo。当前版本先验证核心体验：上传照片、整理时间线、编辑旅行故事，并生成 Plog / Vlog 预览。

## 当前能力

- 图片拖拽或选择上传，支持 JPG、PNG、WebP、HEIC/HEIF
- 后端上传接口和本地对象存储持久化图片
- EXIF / OCR / 图片理解驱动的自动时间线整理
- 生成任务队列，Plog / Vlog 生成状态可追踪、可重试
- 简易用户登录、旅行项目列表、公开分享页
- 西安三日旅行示例时间线
- 事件故事文案可编辑
- Plog / Vlog 两种作品预览
- Plog 图片导出
- 桌面和移动端自适应布局

## 技术栈

- React
- Vite
- Node.js 原生 HTTP API
- 本地文件对象存储：保存上传图片
- JSON 文件数据库：保存用户、旅行、素材、任务和分享页
- OpenAI-compatible API：OCR / 图片理解 / 时间线整理
- Canvas：导出 Plog 图片

## 本地运行

复制环境变量：

```bash
cp .env.example .env.local
```

然后在 `.env.local` 中填入 `DASHSCOPE_API_KEY`。该文件已被 `.gitignore` 排除，不会提交到 Git。

启动后端：

```bash
npm run api
```

另开一个终端启动前端：

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## 项目结构

```text
src/
  App.jsx                 应用状态和业务流程
  main.jsx                React 挂载入口
  components/             页面组件
  data/seedData.js        示例素材和示例时间线
  lib/api.js              后端 API 客户端
server/
  index.js                上传、对象存储、AI 分析、任务队列、分享接口
  storage/                本地对象存储和 JSON 数据库，不提交 Git
src/lib/persistence.js    旧版本地持久化兼容文件
  lib/plogExport.js       Plog canvas 导出
  lib/uploadAssets.js     上传素材对象和 blob URL 管理
  styles.css              全局样式
assets/                   静态示例图片
docs/                     技术路线和后续方案
outputs/                  产品方案文档
work/                     生成脚本和过程素材
```

## 下一步路线

当前 demo 已具备本地 MVP 后端闭环。下一步应补：

1. 将 JSON 文件数据库替换为 Postgres / SQLite。
2. 将本地对象存储替换为 OSS / S3。
3. 将内存任务调度替换为 BullMQ / Sidekiq / Cloud Tasks。
4. 将简易登录替换为正式 Auth。

详细方案见 [docs/TECHNICAL_ROADMAP.md](docs/TECHNICAL_ROADMAP.md)。

## 上传 GitHub 前检查

```bash
npm run build
git status
```

`.gitignore` 已排除 `node_modules/`、`dist/`、本地环境变量和临时渲染文件。
