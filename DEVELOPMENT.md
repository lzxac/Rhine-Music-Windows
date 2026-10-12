# 开发说明（你自己的项目怎么管）

这份文档写给**非程序员的项目所有者**。你不需要看懂代码，只需要知道：这个项目怎么组织、遇到事情怎么判断、以及怎么把你的想法交给我。如果哪天换了工具或隔很久回来，打开这份文档就能接上。

---

## 1. 这个项目是什么

它是 [RonaldDeng/Rhine-Music-Demo](https://github.com/RonaldDeng/Rhine-Music-Demo) 的 Windows 版（由 [Bong712](https://github.com/Bong712) 移植）的**衍生版本**。我们在它的基础上修 bug、加自己的功能。

和你相关的两个 GitHub 仓库：

| 名字 | 地址 | 作用 |
|---|---|---|
| **upstream**（上游） | `Bong712/Rhine-Music-Windows` | Bong712 的官方 Windows 版。他修的新 bug 可以从这里同步过来 |
| **origin**（你的） | 你自己的 Fork | 你的地盘，随便改，改坏了也不影响他 |

> 注意：你**不需要**管 macOS 那个上游（`RonaldDeng/Rhine-Music-Demo`）。你这条线是从 Windows 版发展出来的。

---

## 2. 两条分支，各管一件事

```
main        只放「和上游共有的修复」——就是上游那些代码本身的 bug
rhine-lab   你自己的功能开发：歌词改版、你想要的任何新东西
```

**为什么必须分两条？** 因为 `main` 上的东西是可以干净地反馈给 Bong712 的。如果把你自己的私人功能和上游的修复混在一起，以后想反馈某一条修复时，就会带上一大堆他不关心、也未必认同的改动，他很可能直接不看。分开之后，这件事永远不会发生。

**日常怎么用**（你不用记，我来操作）：

- 你要加功能 → 在 `rhine-lab` 上做
- 上游 Bong712 更新了 → 同步到 `main`，再合进 `rhine-lab`
- 想反馈某个修复给他 → 只从 `main` 上那个干净的提交发出去

### 已经完成的分支设置

| 分支 | 状态 | 内容 |
|---|---|---|
| `main` | 已建立 | 封面串台修复（`0.6.0-dev.58`），这是可以和上游共有的修复 |
| `rhine-lab` | 已建立 | 你的功能开发线起点，`0.7.0` 版本线从这里开始 |

---

## 3. 遇到 bug，先判断是哪一类

这是**最重要的一条规则**。因为你自己加的功能，上游根本没有那些代码，所以「反馈给上游」这件事对你自己代码里的 bug 是没有意义的。

| Bug 类型 | 判断方法 | 修在哪 | 要不要反馈给 Bong712 |
|---|---|---|---|
| **原有代码的 bug** | 想想「如果这个软件是原版、没有我加的功能，会不会也有这个问题？」会 → 属于这类 | `main` | **要**，他有真实用户会受影响 |
| **你自己新代码的 bug** | 只有你新加的功能里才出现，原版没有这个功能 | `rhine-lab` | **不要**，他那边没这段代码 |

**实例**：专辑封面串台就是第一类（原版也有，我修在 `main` 上，并且写了反馈报告）。以后歌词滚动不同步，大概率是第二类（歌词改版是你自己的功能），就只在 `rhine-lab` 上修。

**你不确定时怎么办**：直接问我「这个 bug 是原有的还是我自己的？」，我会查清楚再告诉你，不用自己判断。

---

## 4. 版本号

分家之后，版本号故意和上游错开，避免混淆：

| 版本 | 含义 |
|---|---|
| `0.7.0-dev.1`、`0.7.0-dev.2` … | 你自己的开发迭代，数字每改进一次就加一 |
| `0.7.0-beta.1` | 功能基本齐了，找人试用 |
| `0.7.0` | 正式版 |

上游用的是 `0.6.0-dev.N`，所以看到 `0.7.x` 就是你的版本、`0.6.x` 就是上游的。

**版本号不要手动改。** 项目里有一套自动机制（`scripts/version.mjs`），会把版本号同步到 7 个文件（安装包元数据、界面显示、文档等）。每次要出新版本时由我来跑，跑歪了会导致打包和显示不一致。

**例外**：`0.6.0-dev.58`（封面修复那一版）故意留在 `0.6.x`，因为那是针对上游 0.6.0 代码的修复，版本号对得上，Bong712 才好对照。

---

## 5. 每次改动，我交付给你什么

每完成一件事，我会给你三样东西：

1. **一个独立版本号** + `CHANGELOG.md` 里的规范条目
2. **一份详细说明**（如果是 bug）：现象、复现步骤、根因、修复方式、验证结果。放在仓库根目录，命名为 `BUG-REPORT-<主题>.md`。这份是给上游反馈用的，可以直接引用或贴出去
3. **验证结果**：跑了哪些测试、哪些通过、哪些有问题。**如果有测试失败或没验证到的地方，我会明确告诉你，不会含糊过去**

例如这次封面修复的完整报告是 `BUG-REPORT-album-artwork.md`。

**关于修 bug 和加功能要分开做**：我每次只做一件事、单独记一次版本。这样万一某个改动你不满意或者上游不认可，你能单独回退，不会牵连别的改动。

---

## 6. 你怎么给我提需求

你不需要写需求文档，也不需要懂技术。用大白话描述就行，越具体越好：

- **你想要的效果**：「播放歌曲时，右边整块显示滚动歌词，像网易云那样」
- **为什么想要**：「我要录屏做视频发到平台，现在歌词太小了不好看」
- **参考对象**：「类似 Apple Music / 网易云音乐」
- **优先级**：「这个最急」或「这个有空再说」

**我会负责**：判断可行性、给你方案和取舍点、实现、测试、写文档。

**遇到需要你决定的设计选择，我会先问你，不会替你决定。** 比如「歌词滚动要不要自动居中」这类会影响观感的问题，我列选项给你选。

---

## 7. 必须记住的两件事

### 7.1 素材授权（只有对外发布时要注意）

代码是 MIT 协议，你可以自由修改、自己用。但 `NOTICE.md` 明确写着：**模型、图标、音频采样、字体等素材不在 MIT 范围内**，标注来源不等于获得再分发许可。

- **自己用、自己改：完全没问题**
- **要打包发给别人用：素材授权需要单独确认**，到时候我会提醒你一起过一遍

### 7.2 提交身份

提交记录里用的是你的 GitHub 隐私邮箱（`112012156+izacx@users.noreply.github.com`），不会暴露你的真实邮箱。这是好事，别改。

---

## 8. 常用操作（供参考，通常由我执行）

```powershell
# 同步上游的更新到 main（Bong712 修了新东西时）
git fetch upstream
git checkout main
git merge upstream/main

# 把上游更新合进你自己的功能分支
git checkout rhine-lab
git merge main
```

**你自己不需要敲这些命令**，交给我就行。写在这里是为了让你知道项目里存在这些动作，以及它们的作用。

---

## 9. 交接说明（2026-10-13，给下一个会话的我）

> 这一节是**给 AI 助手看的**，不是给你看的。你不需要读。但如果你换了工具、或我这边失去了上下文，打开这里就能接上。

### 当前进度

**分支**：`rhine-lab`。**已提交**到 `6800ee1`（歌词面板改造 + 首轮修复）。

**仓库里有 3 个文件未提交**，是歌词 bug 的**第二轮修复尝试**，尚未验证：

| 文件 | 未提交改动是什么 |
|---|---|
| `src/music-app.ts` | 把居中逻辑从「自己算 scrollTop + 缓动」改成**浏览器原生** `line.scrollIntoView({ block: "center", behavior: "smooth" })`；**并包含临时诊断代码**（`reportLyricDiagnostics`、`lyricDiagnostics`，都有 `TEMPORARY` 注释） |
| `src/music.css` | 歌词列表改用**固定留白** `padding-block: clamp(140px, 30vh, 340px)`（替换掉之前会崩的运行时测量方案） |
| `scripts/music-server.mjs` | 加了临时端点 `POST /api/diagnostics/lyrics`，把页面测量结果追加写入 `work/lyric-diagnostics.log` |

### 歌词 bug 的已知事实（重要，别重复排查）

**症状**：播放带歌词的歌时，右侧面板是**白纸一片**（或歌词平铺、不滚动、当前句不居中）。

**已用真实数据定位到的根因**（来自诊断上报）：

```
panel:  y=-1705  h=2611          ← 面板被撑到 2611px，比窗口高得多
list:   clientHeight=2535  scrollHeight=2535  scrollTop=0
```

- **列表的 `clientHeight` 等于 `scrollHeight`** → 没有形成滚动视口 → `scrollTop` 恒为 0 → **无法滚动居中**
- 当时面板上下留白各 287px（按容器高度算的），数值本身合理
- **所以问题不是居中公式，而是面板/列表没有被窗口高度约束住**

**已修复但仍需确认**：把留白改成固定 `clamp()`、居中交给浏览器原生 `scrollIntoView`。**这次改动尚未经过用户目视验证。**

**已排除**：留白数值算错、`scrollIntoView` 多祖先滚动、`lyricCenterOffset` 公式（有 6 项测试且 672 组合等价验证）。

### 恢复验证环境的步骤

1. 复制用户曲库索引到验证目录（**不要动 `%LOCALAPPDATA%\Rhine Music\music-data-v3`**）：
   ```powershell
   $live = "$env:LOCALAPPDATA\Rhine Music\music-data-v3"
   $test = 'B:\RHINE LAB_DEV\_verify\music-data'
   Copy-Item "$live\config.json","$live\genre-rules.json","$live\library-index.json","$live\playlists.json" -Destination $test -Force
   Copy-Item "$live\artwork" -Destination "$test\artwork" -Recurse -Force
   ```
2. 构建并启动服务（**需要代理**，见下）：
   ```powershell
   npm run build
   $env:MUSIC_DATA_DIR = 'B:\RHINE LAB_DEV\_verify\music-data'
   $env:PORT = '8099'
   node scripts/music-server.mjs
   ```
3. 测试歌曲：**`林子汐 - NUNA3.0`**（用户曲库里**唯一**有 `.lrc` 的一首，49 行）
4. 让用户在 http://127.0.0.1:8099/ 播放它，页面会**自动上报**面板测量数据到 `work/lyric-diagnostics.log`
5. 用 `B:\RHINE LAB_DEV\_verify\read-diagnostics.mjs` 解析该日志

### 环境注意事项

- **代理必须开着**：`127.0.0.1:10810`（Whale）。它中途关闭过一次，导致 GitHub 访问出现**假 404**，我曾据此错误判断"仓库不存在"。**代理关闭时任何 GitHub 结论都不可信。**
- `github.com` **直连超时**，`api.github.com` 直连可通——**不要用单一通道的失败推断仓库不存在**
- 验证脚本（含 `verify-objective.mjs`、`verify-panel.mjs`、`verify-scroll.mjs`、`read-diagnostics.mjs`）都放在仓库**之外**的 `B:\RHINE LAB_DEV\_verify\`

### 不要在未询问用户的情况下做的事

- 不要绕过 DSH 插件的版本兼容检查
- 不要推送任何东西到 GitHub（用户要求先不推）
- 不要扩大改动范围：背景虚化、逐字歌词、专辑信息收纳都**已明确留给后续单独迭代**

### 诊断代码的清理

那三处 `TEMPORARY` 诊断代码是**临时脚手架**。等歌词 bug 确认修好后**应当移除**：`reportLyricDiagnostics`、`lyricDiagnostics`、`lyricDiagnostics` 在 `Object.assign(window, ...)` 里的条目，以及 `scripts/music-server.mjs` 的 `/api/diagnostics/lyrics` 路由。

