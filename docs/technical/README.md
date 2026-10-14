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

版本号变更**只能通过生成器命令**（`--allocate-dev` / `--sync` / `--dry-run` / `--finalize` / `--rollback-to <version>`）。`--rollback-to` 用于撤销**尚未产出任何产物**的开发版号（构建失败后不浪费号段），目标版本已有产物时拒绝，且只允许在同一 baseVersion 上向后移动；CHANGELOG 历史条目不删除。

> **已知不一致（暂不修）**：`version.mjs` 的默认 `outputDir` 为 `B:\outputs`，而构建脚本 `build-windows.ps1` 的默认输出为 `<repo>\..\outputs`（工作区 `outputs`）。二者不一致，但产物扫描包含 `outputDir`、工作区 `outputs`、`work` 三处，因此正常构建不受影响。**跨目录调用 `version.mjs` 时必须显式传 `--output-dir`**，否则产物冲突判定可能落空。修默认值会影响已有调用方，故本轮只记录。

## 5. 端口与运行形态

- 桌面启动器候选端口：5175–5184，按顺序探测，取第一个空闲端口启动本地服务；不再包含 5173。
- `scripts/music-server.mjs` 默认端口：5173（可用 `--port` / `PORT` 覆盖）。
- vite 开发/预览默认端口：5173。
- 并存关系：启动器独占 5175–5184，vite 与服务默认使用 5173，两段互不重叠，桌面端与开发服务器可同时运行。
- 版本节奏：**已发布的 `0.7.0-dev.11` 不含端口修复（属预期）**；下一个真实版本 `0.7.0-dev.12` 会自然带上该修复。

## 6. 数据与版本口径

- 应用数据根：`%LOCALAPPDATA%\Rhine Music\`；曲库与设置数据 Schema 标识：`music-data-v3`（`version.json.dataSchema`）。
- 曲库索引的口径由 `scripts/music-library.mjs` 的 `LIBRARY_LAYOUT_VERSION` 与按条目的 `_entryId` 控制；布局规则变化时以失效缓存的方式生效，**不修改历史数据**。
- PWA 离线缓存的版本键由 `build-pwa.mjs` 写入 `pwa-cache` 相关产物。
- 本项目**无数据库**，因此不存在传统迁移脚本；数据口径变更按"追加新版本 + 失效旧缓存"的方式推进。
- 测试样例数据说明：`林子汐` 为测试样例数据（测试曲目/复现样例的一部分），非真实个人信息；如需对外分发请另行评估。

## 7. 完整校验定义

**本定义为当前生效版本，随 CI 建立再更新。**

> 依据：npm 脚本串联关系与脚本内标记（是否依赖浏览器/CDP），**未逐行通读**；如需精确分类可另立任务。

**门槛内（必须通过）**

| 分类 | 脚本 | 依据 |
|---|---|---|
| 官方必跑（`check:music` 串联 13 项） | `check-music-library`、`check-album-introductions`、`check-lyrics`、`check-quality`、`check-viewport`、`check-music-player`、`check-music-motion`、`check-music-camera`、`check-music-lighting`、`check-music-presentation`、`check-music-model`、`check-version`；另有独立命令 `check:content` | `package.json` scripts 串联 |
| 目标模块跑（依赖浏览器/CDP 或本地服务，改动相关模块时必须跑） | `check-motion`、`check-responsive`、`check-pwa`、`check-music-launcher` | 脚本内 CDP / `127.0.0.1` 标记 |
| 可选 / 待归类（非门槛，按需运行） | `check-loop`、`check-shell`、`check-archive`、`check-appearance`、`check-assembly`、`check-decryption`、`check-internal-optics` | 无 test 框架、无浏览器标记 |

**门槛外（历史遗留，不计入完整校验门槛）**

| 脚本 | 原因 | 依据 |
|---|---|---|
| `check-music-scene` | `CoverAtlas.writePageTile` 无 canvas 实现，在无浏览器环境下抛错 | CHANGELOG dev.58 / dev.1 条目 |
| `check-music-launcher`（2 个用例，其余通过） | ① `Finder command changes cwd safely…`：依赖 macOS 专用文件 `启动音乐播放器.command`，在 Windows 必然 `ENOENT`（跨平台问题）；② `health endpoint is read-only…`：`ERR_INVALID_ARG_TYPE: paths[0] must be of type string`，涉及 Node 版本兼容/用例传参 | 历史遗留，与端口改动无关；需独立任务处理，不在本轮修 |

非检查类工具（不参与校验）：`analyze-reference-audio.mjs`（音频分析）、`sanitize_blend_browser_metadata.py`（Python 工具，环境未验证）。

## 8. 已知坑与硬约束

> 只写一句：**约束、审批与坑统一见 `AGENTS.md`，本文件不复制其内容。**
