# Rust 重写 · M0 基线冻结

> 状态：**M0 交付物**。本档是**当前生效基线**，审阅通过后才启动 M1。
> 层：需求变更层（`specs/`），描述"这次要改什么、以什么为基准验收"，不重新定义业务规则。
> 配套：`RUST-REWRITE-ANALYSIS.md`（仓库外）讲"为什么/选型"；本档讲"以什么为基准"。
> 截图集**不入库**（38 MB 级二进制），存放与采集方法见 §6。

**开工禁令（在 M1 获确认前）**：不建 `rust/` 目录、不引 Cargo/rustup、不改构建脚本、不动 `version.mjs`；工作分支用 `rust-port`，不碰 `rhine-lab`。

---

## 1. 冻结的决策（来自用户确认，2026-10-14）

| 项 | 决定 |
|---|---|
| 首要目标 | **GPU/功耗优先** → 必须换渲染层（"只换渲染+UI"或"全量"路线，非仅换服务） |
| 时间盒 | 接受 **M1 渲染原型 1–2 周** 作为唯一开工条件 |
| 视觉标准 | **核心界面（歌词面板、封面、播放器）1:1**；其他界面允许"接近" |
| 3D 场景 | **允许适度简化**：先保核心视角（货架+封面+相机），细节可后补 |
| 开工前置 | 本档审阅通过 → 才启动 M1 |

---

## 2. 冻结环境（基线只在同环境下可比）

| 项 | 值 | 来源 |
|---|---|---|
| 机型/OS | Windows 11 专业版 10.0.26200（Build 26200） | `Win32_OperatingSystem` |
| GPU | NVIDIA GeForce RTX 2070 SUPER，驱动 `32.0.16.1714` | `Win32_VideoController`（WMI 显存上报 4 GB，不可靠，仅记录） |
| 显示器 | 3440×1440（`monitorBoundsPx`）；刷新率 144 Hz（会话记录） | 采集快照 |
| 窗口客户区 | **3440×1370**，DPR **1** | 采集快照 `windowClientPx` |
| 基线构建 | **`0.7.0-dev.11`**（已发布）SHA256 `12096e8dacbf706ca25bbdb8ac34df105da31b3cc684a5617452da208bb93061` | `Get-FileHash` |
| 渲染后端 | WebGL 2 / ANGLE（NVIDIA D3D11） | 采集快照 `gpu` |
| Node | v24.14.0 | `node --version` |
| 数据根 | `%LOCALAPPDATA%\Rhine Music\music-data-v3` | 代码 |
| 数据根重定向 | **`RHINE_HOME`**（启动器把 `DataRoot` 设为 `<RHINE_HOME>\music-data-v3`；**启动器会覆盖 `MUSIC_DATA_DIR`**，见 `DesktopProgram.cs:337`） | 代码 |
| 曲库 | `D:\Music\林子汐的车载电台`（171 个专辑/单曲；封面源图 300/400/500/640 px） | 服务日志 + 临时索引 |
| 素材授权 | 模型/字体不在 MIT 范围（`NOTICE.md`），重写不改变 | 仓库文档 |

---

## 3. 性能基线（冻结数字）

### 3.1 系统级（既有验收方法）

| 场景 | GPU（程序自身 3D 引擎） | CPU | 内存 | 整卡 |
|---|---|---|---|---|
| 静止·帧率治理前（dev.11 治理前构建） | **88%（峰值 89%）** | 4.7% | 1091 MB | 224 W / 81℃ |
| **静止·治理后（0.7.0-dev.11，当前基线）** | **33.5%（28%–35.7%）** | **1.0%** | **~1.05 GB** | **62 W / 50℃** |
| 连续切换/详情/主题（治理前） | 平均 83.6%（峰值 92.5%） | — | — | — |
| 程序关闭（对照） | 12% | — | — | 39 W / 62℃ |

**方法**：性能计数器 `\GPU Engine(*engtype_3D)\Utilization Percentage`，对"启动器 + WebView2 子进程"求和；内存为进程树工作集；脚本 `_verify\perf\measure-usage.ps1`（仓库外）。

**关键结论（重构决策依据）**：治理后剩下的约 33% 里，**有 15–20 个百分点不随帧率变化**（144→30 fps 几乎不变）→ 判定为 WebView2/Chromium 在 3440×1440 全屏的合成"地板"。**只有换掉渲染层才能吃掉这部分**，这正是 M1 要验证的核心假设。

### 3.2 帧内计时（`_verify\m0\profile-capture.jsonl` → `warm-baseline`）

| 指标 | mean | p95 | p99 | 样本 |
|---|---|---|---|---|
| GPU 计时总计（EXT_disjoint_timer_query_webgl2） | **7.96 ms** | 9.65 ms | 16.10 ms | 77 |
| RenderPass#0 | 5.93 ms | 7.34 ms | 8.82 ms | 380 |
| SSAOPass#1 | 1.18 ms | 1.95 ms | 2.60 ms | 380 |
| BokehPass#2（景深） | 0.83 ms | 1.26 ms | 1.49 ms | 380 |
| OutputPass#4 | 0.09 ms | 0.09 ms | 0.36 ms | 380 |
| 场景更新总计（CPU） | 2.08 ms | 2.90 ms | 3.90 ms | 458 |
| ↳ 实例剔除（图集） | 0.88 ms | 1.20 ms | 1.40 ms | 458 |
| ↳ 实例循环（非图集） | 0.76 ms | 1.10 ms | 1.30 ms | 458 |
| ↳ composer 提交 | 1.03 ms | 1.50 ms | 2.00 ms | 458 |
| 图集 tile 绘制 | 1.25 ms | 5.60 ms | 6.60 ms | 75 |
| 图集纹理上传 | 4.99 ms | 7.80 ms | 15.50 ms | 75 |
| 主线程 rAF 间隔 | — | 34.70 ms | 34.80 ms | 458 帧 |

> `rafP95 ≈ 34.7 ms` 出现在启动/图集绘制阶段（2 次长任务合计 1084 ms，最长 988 ms）；稳定静止态见 §3.1。
> 帧预算：3440×1440@144Hz ⇒ **6.94 ms/帧**；全质量实测 8.74 ms ⇒ **144 fps 与全质量不可兼得**（既有结论）。

### 3.3 冷启动（本次补测，2026-10-14）

| 指标 | 值 |
|---|---|
| **冷启动到首帧可视（中位数，3 次）** | **3099 ms** |
| 单次 | 2950 / 3099 / 3530 ms |
| QPC 交叉校验（`webview-initialized` → `startup`） | 2544 ms |
| 定义 | 从进程启动（`Start-Process` 返回）到 `profile-capture.jsonl` 出现 `startup` 阶段（= 渲染器 `stats().loaded` 为真并写入首帧快照） |
| 条件 | 无其它实例；WebView2 profile 已存在（**进程冷、OS 与磁盘缓存热**）；开启 `RHINE_PROFILE_CAPTURE=1`（该模式下 `?profile=1&scene=archive`） |

> M1 对测必须使用**同一协议**（同定义、同条件、同机器），否则数字不可比。

---

## 4. 渲染与场景基线

| 项 | 值 |
|---|---|
| Backbuffer | 3440×1370 |
| 质量参数 | `ratio 1`（**未限幅** `limited:false`）、`antialias off`、`anisotropy 16`、`aoSamples 32`、`aoScale 0.6633`、`shadows 2048`、`depthOfField 100`（开）、`transmissionScale 0.6633` |
| 后处理 | SSAO 开、景深（Bokeh）开、阴影贴图开 |
| 场景统计 | drawCalls **56**、triangles **698,134**、instanceBatches **3**、instancesPerBatch **432**、visibleInstances **267**、shadowCasterInstances **401**、visibleCoverPages **4** |
| 封面图集 | tile **256×256**、pageColumns **16**、pageRows **8**、instancesPerPage **128**、`pendingImages 0` |
| 3D 资产 | `archive-assembly.glb` 3.2 MB、`archive-cassette.glb` 3.5 MB、`music-cd.glb` 21 KB |
| 已知缺陷（不在本轮范围） | 关闭 SSAO+景深会让磨砂玻璃发白并遮住封面（上游 bug，触发条件已隔离，根因未定） |

---

## 5. 功能清单（要保真的对象）

按 `src/` 实测规模分层（`src/` 合计 **21,468 行**，含 TS 与 CSS）：

| 层 | 关键文件（行数） | 功能 |
|---|---|---|
| 外壳/启动 | `DesktopProgram.cs` 1364；`boot.ts` 249、`boot-tracks.ts` 344、`boot-orbit-tracks.ts` 147、`boot-logo-tracks.ts` 186、`music-boot.ts` 219 | 单文件 EXE、payload 解压（`AppRoot=app-v<version>`）、端口探测 5175–5184、服务拉起、无边框窗口、圆角、缩放热区、双击最大化、顶栏融合 |
| 渲染 | `scene.ts` 2104、`cover-atlas.ts` 841、`model-viewer.ts` 669、`render-quality.ts` 167、`music-camera.ts` 207、`music-lighting.ts` 200、`music-presentation.ts` 180、`frame-profiler.ts` 247 | 三维专辑架、实例化绘制、封面图集与 UV、相机、灯光、后处理（SSAO/景深/阴影）、自适应质量 |
| 音乐 | `music-player.ts` 671、`audio.ts` 623、`music-title.ts` 379、`music-title-reels.ts` 362、`music-ruler.ts` 336、`music-ticks.ts` 155、`music-text-motion.ts` 219 | 播放/暂停/进度、歌词（同步、自动居中、可收起、字号/对齐）、曲目/专辑标题、刻度与动效 |
| 应用/数据 | `music-app.ts` 2766、`decryption.ts` 179、`appearance.ts` 213、`viewer-theme.ts` 158 | 状态编排、曲库/歌单/队列、设置、主题三态、繁简转换、PWA/离线缓存、响应式 |
| 原版档案界面 | `archive-main.ts` 982 | `?original=1` 的原版档案界面 |
| 样式 | `music.css` 3059、`style.css` 2126、`music-playlists.css` 350、`responsive.css` 189、`music-theme.css` 163 | 视觉语言、响应式断点、主题 |
| 服务端 | `scripts/music-server.mjs` 等（Node 脚本与服务 6609 行） | 本机 HTTP 接口（曲库/封面/歌词/健康）、索引与缓存口径 |
| 生成器/校验 | `version.mjs`、`export-records.mjs`、`build-pwa.mjs`、13 项 `check-*` | 版本号 7 处同步、档案生成、PWA 构建、完整校验（`docs/technical/README.md` §7） |

**1:1 保真对象（用户定义）**：歌词面板、封面、播放器 → 不允许"接近"档。
**可适度简化**：货架动效/材质细节 → 先保核心视角。

> 备注：**逐项保真度标注待 M1 原型后补**（有原型与对照结果后再定"1:1 / 接近 / 可简化"，避免现在凭印象分类）。

---

## 6. 截图集（同角度对照基准）

**存放位置（不入库）**：`B:\RHINE LAB_DEV\_verify\m0\`
**统一协议**：窗口客户区 3440×1370、DPR 1、`?desktop=1&profile=1&scene=archive`、默认相机；由应用自身 `CoreWebView2.CapturePreviewAsync` 抓取（非屏幕截图）。

| 归档目录 | 文件数 | 内容 | 采集会话与条件 | 数值证据 |
|---|---|---|---|---|
| `covers-real\` | 11 | `cover-startup`、`cover-album-1..6`、`cover-detail` + 3 张 CPU 预览 | **真实曲库**（171 专辑），同日 10:38 会话 | `profile-capture.jsonl` |
| `lyrics-with-lrc\` | 5 | `lyrics-playing`、`lyrics-playing-browse`、`lyrics-collapsed`、`lyrics-collapse-restored`、`lyrics-stopped` | 夹具曲库（`日光留声`，带 LRC），单会话 | `capture-lyrics-with-lrc.jsonl` |
| `lyrics-no-lrc\` | 5 | 同上 5 个状态，**无 LRC 状态**（`status=歌曲所在文件夹里没有同名 LRC 歌词。`） | 夹具曲库（`日光留声`，无 LRC），单会话 | `capture-lyrics-no-lrc.jsonl` |
| `session-lyrics\`、`session-nolrc\` | 19 + 19 | 两个夹具会话的**全部**产物（含全部 6 张 CPU 预览） | 夹具独占曲库 | 同上 |
| `_superseded-20261014-0930\` | 5 | 早前 09:30 的歌词截图，已被上面两组取代 | 真实曲库 | — |
| `capture-sessionE.jsonl` | 1 | 带 ID3 标签的两曲夹具尝试（记录未走通的分支） | 夹具独占曲库 | — |

**歌词状态证据（来自 JSONL，非目测）**：
- 有词：`lyrics-playing` → `panelActive=第二行歌词`、`lyrics-stopped` → `panelActive=第一行歌词`、`status=点击歌词可跳转到对应时间`（5/5 阶段均含真实歌词行）。
- 无词：5/5 阶段 `panelActive=(无)`、`current=—`、`status=歌曲所在文件夹里没有同名 LRC 歌词。`

**已知缺口（2 项，均需代码或进一步夹具工作，不在本档范围内自行修改）**：
1. **`lyrics-no-lrc-track.png` 未产出**：该分支（`DesktopProgram.cs:1403-1413`）会切到**选中专辑的另一首**再截图；无标签 WAV 夹具被编目为单曲（专辑仅 1 首），改用带 ID3 的 MP3 副本时应用读到的仍是原始标签，行切换未生效 → 未触发。**根因是应用侧夹具耦合**，需应用内注入点或一个真正带标签的多曲夹具专辑。
2. **真实曲库的 `cover-album-2/3/4-cpu.png` 未产出**：`JavaScriptSerializer` 默认 `maxJsonLength` 被超出（`字符串的长度超过了为 maxJsonLength 属性设置的值`）→ **代码限制**，与封面缺失无关；夹具会话（载荷更小）可产出全部 6 张 CPU 预览。

**关于"同进程"要求**：歌词集现已做到"每个状态一次会话内采集"；但**无法与真实曲库的封面集共用同一进程**——歌词分支要求曲库中存在夹具专辑 `日光留声`，而该专辑不在真实曲库中。这是应用测试分支的耦合，已在上面按会话分别标注。

---

## 7. M1 验收标准（基于本基线的量化门槛）

| 判据 | 门槛 | 基线 |
|---|---|---|
| 静止 GPU | **≤10%** | 33.5%（其中 15–20 pt 为合成地板） |
| 内存 | **≤400 MB** | ~1.05 GB |
| **冷启动到首帧可视** | **≤2169 ms（比 dev.11 快 ≥30%）** | **3099 ms**（§3.3，同协议对测） |
| 视觉（核心 1:1） | 与 `covers-real\cover-startup.png`、`lyrics-with-lrc\lyrics-playing.png` 同状态逐项对照；核心界面不接受"接近" | — |
| 视觉（其他） | 差异清单列出并标注"可接受/需修正" | — |
| 功能（核心视角） | 货架 + 封面 + 相机可用（细节可后补） | — |

> 判定方式：M1 原型在同一机器、同一分辨率、同一窗口客户区、**同一冷启动协议**下采集自身截图与计数，与上表逐项比对。

---

## 8. 复现命令

```powershell
# 8.1 系统级 GPU/功耗/内存（需管理员，PresentMon/ETW）
B:\RHINE LAB_DEV\_verify\perf\measure-usage.ps1

# 8.2 真实曲库基线采集（封面/货架；约 40 秒）
$env:RHINE_PROFILE_CAPTURE = '1'
Start-Process 'B:\RHINE LAB_DEV\outputs\Rhine-Music-Desktop-0.7.0-dev.11.exe'
# 等待 profile-capture.jsonl 出现 capture-complete，产物在：
#   $env:LOCALAPPDATA\Rhine Music\music-data-v3\webview-profile\
Remove-Item Env:RHINE_PROFILE_CAPTURE

# 8.3 歌词夹具会话（数据根重定向；夹具脚本在 _verify\m0\scripts\）
node B:\RHINE LAB_DEV\_verify\m0\scripts\make-fixture-wav.mjs 'B:\RHINE LAB_DEV\_verify\m0\homeX' with-lyrics fixture-only
$env:RHINE_PROFILE_CAPTURE = '1'; $env:RHINE_HOME = 'B:\RHINE LAB_DEV\_verify\m0\homeX'
Start-Process 'B:\RHINE LAB_DEV\outputs\Rhine-Music-Desktop-0.7.0-dev.11.exe'
# 产物在 B:\RHINE LAB_DEV\_verify\m0\homeX\music-data-v3\webview-profile\
Remove-Item Env:RHINE_PROFILE_CAPTURE, Env:RHINE_HOME

# 8.4 冷启动补测（§3.3 协议）
#   记录 Start-Process 返回时刻，轮询 profile-capture.jsonl 至出现 "startup"，取 3 次中位数
```

**注意**：单实例限制——采集前必须关闭正在运行的应用实例（采集后恢复）。

---

## 9. 变更控制

1. 本档数字一经审阅即视为**冻结基线**；修订必须附**新采集证据 + 原因**，并注明替代的旧值。
2. 与代码/文档冲突时：**以实测采集与代码为准**，并回报本档过期。
3. 本档不定义业务规则；业务口径以 `docs/business`（尚未建立）与仓库代码为准。
4. §5 功能清单由 `src/` 文件规模与既有验收记录整理，**未逐行通读**；逐项保真度标注按 §5 备注留给 M1。

---

## 10. 待确认

1. §7 门槛是否照此定稿（GPU ≤10%、内存 ≤400 MB、**冷启动 ≤2169 ms**）。
2. §6 两处缺口是否另行立任务处理（二者都需要代码或进一步夹具工作）：① `lyrics-no-lrc-track.png` 的夹具耦合 ② `maxJsonLength` 限制。
3. 截图集留在 `_verify\m0\`（90 MB）不入库——是否维持此约定。
