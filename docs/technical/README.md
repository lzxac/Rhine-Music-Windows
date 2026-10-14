# 技术实现层 · 总览（docs/technical）

> 本层描述**当前如何实现**，服从业务纲领层（`docs/business/`，尚未建立）。
> 不在此层重新定义业务规则；判断冲突时按 `AGENTS.md` §8.4 处理。
> 事实来源以代码与配置为准；本文件与代码不一致时以代码为准，并回报文档过期。

## 1. 技术栈与约束

- 前端：TypeScript + Vite + Three.js（WebGL 2），样式为手写 CSS（无框架）。
- 桌面外壳：WinForms 启动器（C#，.NET Framework 4.8 编译器编译）+ WebView2（Chromium）承载前端；本地音乐服务以 Node 子进程运行。
- 本地服务：`scripts/music-server.mjs`，Node ESM，仅绑定 `127.0.0.1`。
- 打包：前端产物 + Node 运行时 + 服务脚本 + WebView2 SDK 程序集压入单文件 EXE（`scripts/build-windows.ps1`）。
- 运行时要求：Node ≥ 22.12（开发/构建）、WebView2 Evergreen Runtime（用户机）、.NET Framework 4.8 编译器（仅构建机）。
- 机器与工具事实（编码、Shell、包管理器等）：见 `AGENTS.md` §4，本文件不重复。

## 2. 目录结构与分层职责

| 路径 | 职责 |
|---|---|
| `src/` | 前端全部模块：入口 `main.ts`、音乐应用 `music-app.ts`、三维场景 `scene.ts`、封面图集 `cover-atlas.ts`、播放器与歌词、主题与响应式等 |
| `scripts/` | Node 脚本：代码生成器（见 §4）、校验脚本（`check-*.mjs`，见 §7）、本地服务 `music-server.mjs`、构建脚本（`.ps1`） |
| `desktop/` | 桌面外壳素材：`app.ico`（生成物）与源图 `app-icon-source.png` |
| `public/` | 静态资源与生成物（`archives/` 由 `export-records.mjs` 生成，入库）、字体、许可文件 |
| `sdk/lib/` | WebView2 SDK 程序集与许可（构建输入，入库） |
| `content/` | 内容源数据（供生成器读取） |
| `dist/` | 构建产物（不入库） |

## 3. 核心入口与编排

- 前端入口：`index.html` → `src/main.ts` →（默认）`src/music-app.ts`；`?original=1` 时 → `src/archive-main.ts`（原版档案界面）。
- 桌面入口：`DesktopProgram.cs` 的 `Main` → 解压负载 → 探活/启动本地服务 → `OpenDesktop` 打开 WebView2 窗口（地址带 `?desktop=1`）。
- 服务入口：`scripts/music-server.mjs`（`--port` 或 `PORT`），数据根由环境变量 `MUSIC_DATA_DIR` 决定。
- 前端与服务的契约：本机 HTTP 接口（曲库、封面、歌词等），服务只监听回环地址。

## 4. 生成器边界

**由生成器产出、不得手改的文件**：

| 生成器 | 产物 |
|---|---|
| `scripts/version.mjs` | 版本元数据 7 处（`version.json`、`package.json`、`package-lock.json`、`README.md`、`src/build-version.ts`、`app.manifest`、`DesktopProgram.cs`）+ `CHANGELOG.md` 占位条目 |
| `scripts/export-records.mjs` | `public/archives/*`（`predev`/`prebuild` 自动运行） |
| `scripts/build-pwa.mjs` | `dist/sw.js`、`dist/pwa-build.json`（构建期，不入库） |
| `scripts/build-app-icon.ps1` | `desktop/app.ico`（源图 `desktop/app-icon-source.png` 入库） |

版本号变更**只能通过生成器命令**（`--allocate-dev` / `--sync` / `--dry-run` / `--finalize`）；回滚方案待定（见与用户的审计沟通第 3 项）。

## 5. 端口与运行形态

- 桌面启动器候选端口：5175–5184（以及列表中的 5173）。
- `scripts/music-server.mjs` 默认端口：5173（可用 `--port` / `PORT` 覆盖）。
- vite 开发/预览默认端口：5173。
- **冲突待处理（见第 7 项）**：上述三处存在潜在冲突，最终取值待定，本文件暂不写最终值。

## 6. 数据与版本口径

- 应用数据根：`%LOCALAPPDATA%\Rhine Music\`；曲库与设置数据 Schema 标识：`music-data-v3`（`version.json.dataSchema`）。
- 曲库索引的口径由 `scripts/music-library.mjs` 的 `LIBRARY_LAYOUT_VERSION` 与按条目的 `_entryId` 控制；布局规则变化时以失效缓存的方式生效，**不修改历史数据**。
- PWA 离线缓存的版本键由 `build-pwa.mjs` 写入 `pwa-cache` 相关产物。
- 本项目**无数据库**，因此不存在传统迁移脚本；数据口径变更按"追加新版本 + 失效旧缓存"的方式推进。
- 测试样例数据说明：`林子汐` 为**测试样例数据**（测试曲目/复现样例的一部分），**非真实个人信息**；如需对外分发请另行评估。

## 7. 完整校验定义

> 占位：待"校验脚本分类表"定稿后回填（分类依据：是否被 npm 脚本串联、是否依赖浏览器/CDP；已知失败项 `check-music-scene` 属历史遗留，不计入门槛）。

## 8. 已知坑与硬约束

> 只写一句：**约束、审批与坑统一见 `AGENTS.md`，本文件不复制其内容。**
