# 小迹旅行手办 Demo

小迹是一个围绕“旅行手办”组织旅行记忆的 Web demo。当前版本先验证核心体验：上传照片、整理时间线、编辑旅行故事，并生成 Plog / Vlog 预览。

## 当前能力

- 图片拖拽或选择上传
- 浏览器本地保存上传素材和旅行草稿
- 西安三日旅行示例时间线
- 事件故事文案可编辑
- Plog / Vlog 两种作品预览
- Plog 图片导出
- 桌面和移动端自适应布局

## 技术栈

- React
- Vite
- IndexedDB：保存上传图片 blob
- localStorage：保存时间线草稿状态
- Canvas：导出 Plog 图片

## 本地运行

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
  lib/persistence.js      IndexedDB/localStorage 持久化
  lib/plogExport.js       Plog canvas 导出
  lib/uploadAssets.js     上传素材对象和 blob URL 管理
  styles.css              全局样式
assets/                   静态示例图片
docs/                     技术路线和后续方案
outputs/                  产品方案文档
work/                     生成脚本和过程素材
```

## 下一步路线

当前 demo 是纯前端体验验证。要变成可用 MVP，下一步应补：

1. 后端上传接口和对象存储，让图片可持久化。
2. EXIF / OCR / 图片理解，把时间线从模拟变成可信自动整理。
3. 生成任务队列，让 Plog、Vlog 生成可追踪、可重试。
4. 用户登录、旅行项目列表、公开分享页。

详细方案见 [docs/TECHNICAL_ROADMAP.md](docs/TECHNICAL_ROADMAP.md)。

## 上传 GitHub 前检查

```bash
npm run build
git status
```

`.gitignore` 已排除 `node_modules/`、`dist/`、本地环境变量和临时渲染文件。
