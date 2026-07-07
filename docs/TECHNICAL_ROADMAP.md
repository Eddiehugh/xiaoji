# 小迹技术路线

## 1. 当前代码边界

当前项目是纯前端 demo：

- 前端框架：React + Vite
- 数据持久化：IndexedDB 保存上传图片，localStorage 保存旅行状态
- 自动理解：前端模拟状态，没有真实模型能力
- Plog：浏览器 canvas 导出静态图片
- Vlog：图片轮播预览，没有真实视频文件生成

这说明当前版本适合产品演示和交互验证，但还不能作为多用户线上产品。

## 2. 推荐 MVP 架构

```text
React Web
  |
  | REST API
  v
Backend API
  |-- Auth
  |-- Trip Service
  |-- Asset Upload Service
  |-- Understanding Job Service
  |-- Generation Job Service
  |
  |---- Postgres
  |---- Object Storage
  |---- Queue / Worker
```

## 3. 数据模型建议

第一版需要这些核心实体：

| 表 | 作用 |
| --- | --- |
| users | 用户账号 |
| trips | 一次旅行项目 |
| assets | 原图、缩略图、元数据、对象存储地址 |
| events | 旅行时间线事件 |
| generation_jobs | Plog / Vlog 生成任务 |
| outputs | 生成后的图片、视频、分享页资源 |

## 4. 上传与理解流程

1. 用户上传图片。
2. 前端拿到后端返回的 asset id。
3. 后端保存原图到对象存储。
4. 后端提取 EXIF 时间、GPS、设备信息。
5. 后端执行 OCR 和图片场景识别。
6. Worker 将素材归并到旅行事件。
7. 前端刷新时间线，用户可人工修正。

第一阶段可以先做 EXIF 时间排序，再引入 OCR 和多模态模型。

## 5. 生成流程

### Plog

第一版建议用模板化渲染：

- 输入：trip、events、assets、style
- 输出：高清 PNG/JPEG
- 实现：HTML/CSS 模板转图片，或服务端 canvas

### Vlog

第一版建议用固定模板视频：

- 输入：事件排序、图片、标题、字幕、背景音乐
- 输出：9:16 MP4
- 实现：Remotion 或 FFmpeg Worker

生成应走异步任务队列，避免浏览器长时间等待。

## 6. 开发阶段

### 阶段 1：工程化和真实上传

- 拆分前端组件
- 新增后端项目
- 新增上传接口
- 接对象存储
- 保存 trip / asset / event

### 阶段 2：可信时间线

- EXIF 解析
- OCR 识别
- 图片理解
- 规则归并事件
- 用户修正后回写

### 阶段 3：作品生成和分享

- Plog 高清导出
- Vlog 视频任务
- 分享页
- 生成版本管理
- 失败重试和任务日志

## 7. 短期实现建议

先不要急着做复杂视频生成。最稳的顺序是：

1. 保持当前前端体验。
2. 增加后端上传和数据库。
3. 用 EXIF 时间生成真实时间线。
4. 做 Plog 服务端高清导出。
5. 再做 Vlog 模板视频。
