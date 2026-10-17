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

## 3.1 音频格式与解码

**本项目不做任何音频转码，也没有音频编码器。** `/api/audio/<trackId>` 由 `serveFile()` 用 `createReadStream(...).pipe(response)` 把**原文件字节**直接返回（支持 HTTP Range，所以进度条可拖动）。因此：

- 播放音质 **= 源文件音质**，程序不解码后重编码、不降采样、不改变位深。元数据里的码率/采样率/位深由 `music-metadata` 从文件读出，只用于显示。
- 能播哪些格式由**运行时的 Chromium/WebView2 解码栈**决定，不由本项目决定；项目只做"能否交给浏览器播"的过滤。
- 设置页的「画质」预设（`qualityPresets`）是 **3D 渲染参数**（`scale`/`pixelRatio`/`shadows`/`aoSamples` 等），与音频无关，不要混用。

**扩展名集合**（`scripts/music-library.mjs`）：

| 集合 | 用途 | 取值 |
|---|---|---|
| `AUDIO_EXTENSIONS` | 扫描入库 | `.flac` `.wav` `.m4a` `.mp4` `.alac` `.dsf` `.dff` `.mp3` `.aac` `.aiff` `.aif` `.ogg` `.opus` |
| `BROWSER_EXTENSIONS` | 判定 `browserPlayable` | `.flac` `.wav` `.m4a` `.mp4` `.mp3` `.aac` `.ogg` `.opus` |

只入库但不能播的：`.alac`（独立扩展名）、`.dsf`/`.dff`（DSD）、`.aiff`/`.aif`。不可播曲目在 UI 上禁用，播放时的提示见 `src/music-player.ts` 的 `unsupported()`。

**实测解码能力**（Edge/WebView2 Chromium 155，2026-10-15 实测；方法见下）：

| 格式 | `canPlayType` | 真实解码（`decodeAudioData`） | `<audio>` 读到时长的 |
|---|---|---|---|
| MP3 | probably | ✅ | ✅ |
| AAC / M4A(AAC-LC) | probably | 未单独构造样本，依赖同一解码栈 | — |
| FLAC | probably | ✅ 48000Hz / 1ch / 12.272s（真实样本） | ✅ 12.272 |
| WAV (PCM) | probably | ✅ 48000Hz / 2ch / 0.5s（自制样本） | ✅ 0.5 |
| OGG Vorbis | probably | ✅ 48000Hz / 2ch / 53.333s | ✅ 53.336 |
| OGG / WebM Opus | probably | 同栈 | — |
| **M4A / ALAC** | **不支持** | — | — |
| **AIFF** | **不支持** | ❌ `Unable to decode audio data` | ❌ 错误码 4 |
| **DSD (DSF/DFF)** | **不支持** | — | — |
| WMA / AC-3 / AMR | 不支持 | — | — |

> 结论：无损可播到 **FLAC / WAV / ALAC-in-M4A**；有损可播 MP3 / AAC / Vorbis / Opus；**DSD 与 AIFF 不可播**。
> 采样率与位深的上限由 Chromium 的解码器决定，本项目不设限也不改写。

**验证方法**（可复现）。两个探针在**验证脚手架目录** `_verify/css-diff/`（与仓库同级的开发工作区目录，按 `DEVELOPMENT.md` 的既有约定存放，属于本项目的验证工具而非仓库内代码）：

```powershell
node _verify/css-diff/codec-support-probe.mjs    # 让运行中的解码器自报 canPlayType 能力
node _verify/css-diff/decode-support-probe.mjs   # 把真实文件交给 decodeAudioData 与 <audio> 实解
```

`decode-support-probe.mjs` 的 WAV/AIFF 样本由同目录的 `make-audio-fixtures.py` 生成（标准库 + numpy，无音频库依赖）；FLAC 需要一个真实样本，**该第三方样本不随脚手架保存**，探头在缺失时会跳过该项（取回方法见脚本头部注释）。

**不要只凭 `canPlayType` 下结论**——AIFF 在 `canPlayType` 与实解上一致为不支持，但两者并不总是等价。

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

| 脚本 | 原因 | 依据 | 处理状态 |
|---|---|---|---|
| `check-music-scene` | `CoverAtlas.writePageTile` 无 canvas 实现，在无浏览器环境下抛错 | CHANGELOG dev.58 / dev.1 条目 | 历史遗留，未排期 |
| `check-music-launcher`（2 个用例，其余通过） | ① `Finder command changes cwd safely…`：依赖 macOS 专用文件 `启动音乐播放器.command`，在 Windows 必然 `ENOENT`（跨平台问题，涉及 CI 策略，当前无 CI）；② `health endpoint is read-only…`：`ERR_INVALID_ARG_TYPE: paths[0] must be of type string`，涉及 Node 版本兼容/用例传参 | 历史遗留，与端口改动无关 | 另立任务，未排期 |

非检查类工具（不参与校验）：`analyze-reference-audio.mjs`（音频分析）、`sanitize_blend_browser_metadata.py`（Python 工具，环境未验证）。

## 8. 已知坑与硬约束

> 只写一句：**约束、审批与坑统一见 `AGENTS.md`，本文件不复制其内容。**

## 9. Rust 重构分支策略

> 本节**只记录策略，尚未执行任何分支操作**；M1 启动前不建分支。

- 项目当前无外部用户，**重构期间不计划发布新的 dev 版本**。
- `rust-port` 从 `rhine-lab` **当前 HEAD** 切出。
- 重构期间 **`rhine-lab` 冻结**，不合并未验收阶段。
- **未验收阶段不合并回 `rhine-lab`。**
- **M1 启动前才切分支**；在此之前仅保留本策略说明。

需求侧的基线、门槛与决策记录见 `specs/rust-rewrite/M0-baseline.md`；可行性分析与选型见仓库外 `RUST-REWRITE-ANALYSIS.md`。

## 10. Rust 工具链（M1 阶段）

> 仅记录当前机器事实与选择理由；**M1 验证通过后再评估是否提升到 `AGENTS.md` §4**（本轮不写入该文件）。

- 本机**没有安装 Visual Studio / MSVC 链接器**（`vswhere`、`link.exe` 均不存在），因此**不使用 `x86_64-pc-windows-msvc`**。
- 使用 **`x86_64-pc-windows-gnu` 目标**：rustup 自带 `rust-mingw` 组件（含链接器），**自包含、无需 VS**。
- 工具链：**rustup + stable 1.99.0**，**仅安装 Windows-GNU 目标**（组件：cargo / rust-mingw / rust-std / rustc）。
- 安装位置 `%USERPROFILE%\.cargo`；新开终端需让 PATH 含 `%USERPROFILE%\.cargo\bin`。
- Rust 代码位于分支 `rust-port` 的 `rust/` 目录，**不参与**现有 npm / PowerShell 构建链；`rust/target/` 不入库。
- **GNU 目标除 `rust-mingw` 外，另需 WinLibs 提供 `as.exe`**：rust-mingw 的自包含目录只有 `dlltool.exe` / `ld.exe`，缺汇编器，`dlltool` 调用 `as` 时会报 `CreateProcess` 失败。
  安装与使用：`winget install -e --id BrechtSanders.WinLibs.POSIX.UCRT`，构建时把其 `mingw64\bin` 加入 PATH。
  这是 **B2 阶段唯一新增的系统级依赖**（记录于 M1/B2 期间）。
