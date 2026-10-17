# Rhine Music · Windows

这是 [RonaldDeng/Rhine-Music-Demo](https://github.com/RonaldDeng/Rhine-Music-Demo) 的 Windows 桌面移植版。项目在三维音乐档案界面和本机播放基础上，添加了同步歌词显示，并扩展了 Windows 曲库、歌单和播放队列管理。

本仓库是 [lzxac](https://github.com/lzxac) 维护的**衍生版（Rhine Lab 版）**：在 Bong712 的 Windows 版基础上修复 bug、开发自己的功能。能反馈给上游的修复走 `main` 分支，自有功能走 `rhine-lab` 分支。

**当前版本：0.7.0-dev.16** · **维护者：** [lzxac](https://github.com/lzxac)（Rhine Lab 衍生版）

## Rhine Lab 版的更新内容

相对上游 Bong712 的 Windows 版，本分支目前的改动：

### 修复的 Bug

- **专辑封面串台**（`0.6.0-dev.58`）：同一个歌手文件夹里散放的多首单曲、或合集文件夹，会让派生出的所有专辑都显示其中第一首歌的封面（在 666 首歌的真实曲库中，41 张互不相关的专辑共用同一张图）。现在每个专辑都会读取并使用自己的封面，并已加回归测试防止复发。此修复已通过 [PR #4](https://github.com/Bong712/Rhine-Music-Windows/pull/4) 反馈给上游，完整分析见 [BUG-REPORT-album-artwork.md](BUG-REPORT-album-artwork.md)。

### 新增与改进

- **同步歌词成为主视图**（`0.7.0-dev.2`）：右侧常驻歌词面板取代原来的两行小字——当前句自动居中跟随；手动滚动列表时跟随会自动暂停、停止后再恢复；可收起成一条只显示当前句和加载状态的窄卡，收起状态会被记住；窄窗口下面板自动停靠到底部；原来的全屏歌词弹窗已移除。
- **专辑详情页显示打磨**（`0.7.0-dev.3`）：歌词面板与专辑页融为一体（去背景、与专辑文字对齐），制作人员区块始终可见，行悬停和点击跳转的高亮铺满整行，长歌单滚动时不再穿透到制作人员文字后面。
- **歌词字号与对齐控制**（`0.7.0-dev.4`）：面板上可用 A－/A＋ 调节六档歌词字号，可切换左对齐／居中对齐，偏好都会记住。
- **程序图标**（`0.7.0-dev.9`）：EXE 与任务栏使用自有图标（"RLAB" 标识 + 真实透明圆角，替代原项目图标），素材在仓库 `desktop/` 目录。
- **窗口与顶栏融合**（`0.7.0-dev.6`，缩放修复 `0.7.0-dev.10`）：去掉系统标题栏、内容直达窗口边缘；顶栏空白处可拖动窗口、双击最大化，右上角三键控制窗口；窗口四边与四角可拖拽缩放。
- **空闲不再满帧重绘**（`0.7.0-dev.11`）：界面静止时不再按显示器刷新率不停重绘——约 0.4 秒无操作后降到 30fps，一有操作（鼠标／键盘／切专辑／播放状态变化）立刻回到满帧，全屏查看器与开机动画期间恒为满帧。**画质零变化**；实测静止时三维引擎占用约 88% → 33%，右下角"rAF诊断"可自行核对。
- **曲目列表与歌词卡共用一条底边**（`0.7.0-dev.12`）：曲目列表在底部让出一整行（那条留白以后用来放播放控制按钮），**展开的歌词卡底边落在同一条线上**——在专辑页与歌词页之间切换时那条边界不再移动，两边的可见区域也不再随专辑的曲目数量变化。顺带修好首次打开专辑时歌词卡上边未与专辑大标题对齐的问题。
- **专辑详情页首行对齐 + 歌词卡字号统一**（`0.7.0-dev.13`）：右侧「ALBUM 001 ↑上一张 下一张↓」与左上「← 返回专辑架」**落在同一条线上**；右侧整块（大标题、发行信息、页签、曲目表、歌词卡）随之上移。另修掉**退出到专辑架时歌词卡盖住归档页文字**的问题（现在专辑架页**完全不显示歌词卡**，回到专辑页自动恢复你原来选的状态，不会改你的记忆设置）；歌词卡展开态的**歌名/歌手与专辑详情逐项一致**（字号、颜色、字重、左边界都一样），卡片那条长横线与专辑「发行信息」上方的横线**同高**且**首次展开就位**，名字过长时（歌词卡歌名/歌手、**专辑页大标题与歌手行**）改为**横向滚动**完整显示（不换行、不截断、字号不变；系统开启"减少动态效果"时不滚）；**专辑架页完全保持原样**（那边的大标题是逐字滚动排版、歌手名由文字动效包成 span，不适合横向滚动）。
- **控制栏定型与听后感面板**（`0.7.0-dev.16`）：控制栏按网易云排布重做——左「歌名·歌手 / ♥ / 评论 / 播放模式」、中「上一首 / 播放 / 下一首」、右「队列 / 音质 / 收藏到歌单 / 词 / 音量 / …更多」，**两端与进度条对齐**、播放键**始终居中**、整组在曲目列表底边与制作人员之间**垂直居中**。**听后感（本地评论）改为第三个右列视图**（专辑详情 ↔ 歌词 ↔ 听后感，互斥切换、底边与曲目列表齐平，不再压住控制栏），按网易云评论页排版：顶部曲目与 `全部评论 N`、中间列表、底部发布区；评论按**歌名|歌手|专辑|时长**存储，**移动或重命名文件不再丢失**（旧数据启动时自动迁移），每条只留删除（点赞/回复/分享需要账号与网络，本机不提供）。评论与收藏图标加上**右上角条数角标**（没有内容就整个隐藏，不显示 0；三位数以上收成 `999+`）。曲目列表**行号改为列表位置**并新增**「原编号」列**（`编号：06` / `编号：未知`），解决同一首歌多个格式显示两行相同序号的问题。另外修好四处播放行为：**上一首直接切歌**（不再需要点好几次）、**队首按上一首真正回到开头**、**单曲循环下「下一首」也生效**、**播放中切换播放模式不再点不动**。「…更多」菜单按网易云那一列搭好结构、各项如实置灰并注明原因。
- **控制栏空间与歌词体验打磨**（`0.7.0-dev.15`）：曲目列表再**让出一整行**（共 2 行）给控制栏，窗口很矮时**优雅降级**（列表至少保留 1 行、控制栏永远有带子）；歌词卡**从右滑入 / 原路滑回**（进出完全对称），**关闭瞬间专辑详情就浮现**（不再有空白断层）；**打开专辑即后台预取**整张专辑的歌词，播放**瞬时**显示；**点歌词句跳转更准**（不再飘回上一句、点完立即居中）；**拖动窗口实时跟随**（不再错位）；曲目列表下方多了一个"**下面还有曲目**"小箭头；空白状态「词」按钮**置灰**；并**彻底删除**了旧的"收起态"两态之外的所有残留代码。
- **播放进度条**（`0.7.0-dev.15`）：控制栏里加入**完整功能**的播放进度条，纵向顺序为**小箭头 → 进度条 → 状态文字 → 控制按钮**（控制按钮仍钉在带子底部，进度条显隐都不动它）。**打开专辑详情就和控制栏一起在**（`00:00 / 00:00`、置灰不可拖），不会等到播放才冒出来。一条 2px 细线，**已播部分暖橙**；圆点滑块**平时隐藏、悬停或键盘聚焦才出现**；两端显示 `当前 / 总时长`（超过一小时自动 `h:mm:ss`）。鼠标悬停时**跟随指针显示目标时间气泡**，点击任意位置即定位。**拖动中只预览**（气泡与滑块跟随，左端标签保持"已确认位置"不动），**松手才真正跳转**——所以拖动不会卡音。跳转后**歌词同步到目标那一句**。
- **播放控制搬到曲目列表下方**（`0.7.0-dev.14`）：顶栏那组「歌名、暂无歌词／歌词、播放、停止」整体搬到**曲目列表让出来的那一条带**里、**居中**排列（上面是内容、下面是控制，和主流播放器一样）；该行用**实测**定位（专辑栏左右边界 + 制作人员块顶边 + 让行量），所以永远落在那条带里。**「歌词」按钮改为常驻**（只要在播放就显示）并成为歌词卡的**唯一开关**：单击展开歌词、再单击关闭（关闭＝卡片完全不显示，专辑详情原样回来）；展开态卡片里那个重复的"收起歌词"按钮已删除，只留字号 `A－/A＋` 与对齐 `⇤`。**专辑架页不显示这组控制**（原来它在那儿只是"点了放歌、什么都不显示"）。
- **启动窗口按显示器取适中的 16:9**（`0.7.0-dev.13`）：双击打开时以 **16:9、屏幕居中** 打开，不再是最大化——大小取工作区高度的约 80%（不超过 1920×1080，窄屏再按宽度收敛），所以 **1920×1080 的显示器不会又变成全屏**；之前最大化启动会让"还原"落到左上角，现在最大化再还原回到居中位置。

### 暂定后续

专辑信息自动收纳、背景虚化、逐字（卡拉OK）歌词。

## 下载与运行

想要官方稳定版，请到上游 [Bong712 的 Releases](https://github.com/Bong712/Rhine-Music-Windows/releases) 下载对应版本的 Windows x64 `.exe`。本仓库（Rhine Lab 版）当前以开发为主，从源码运行见下方"开发与构建"。需要 Windows 10/11 和 Microsoft Edge WebView2 Evergreen Runtime。程序首次启动时会解压运行资源到 `%LOCALAPPDATA%\Rhine Music\app-v<version>`。

在“音乐库”中添加本机音乐文件夹并扫描。播放器读取原位置的音频，不上传或复制歌曲。曲库索引、歌单、封面缓存和设置存放在 `%LOCALAPPDATA%\Rhine Music\music-data-v3`。还没有曲库时，可以直接进入演示封面。

## 支持的音频格式与音质

**播放器不做转码：直接播放你的原文件。** 所以音质就是源文件的音质——程序不会解码后重编码、不降采样、不改变位深，也不会为了体积或兼容而"压一档"。能播什么由 Windows 上 Edge WebView2（Chromium）的解码能力决定。

| | 格式 | 说明 |
|---|---|---|
| ✅ **无损** | **FLAC**、**WAV**、**ALAC**（装在 `.m4a` 里） | 采样率与位深上限取决于 Chromium 解码器；本项目不设限也不改写 |
| ✅ **有损** | **MP3**、**AAC**、**Ogg Vorbis**、**Opus**（`.ogg` / `.opus`） | 常见码率均可 |
| ❌ **不能播** | **DSD**（`.dsf` / `.dff`）、**AIFF**（`.aiff` / `.aif`） | 会扫描入库并在列表中标出，但点击播放时会提示当前版本不支持 |

也就是说：**最高支持到无损（FLAC / WAV / ALAC），最低支持到常见有损（MP3 / AAC / Vorbis / Opus）**；DSD 与 AIFF 暂不支持。
以上能力是在 Edge WebView2（Chromium 155）上**实测**的（`canPlayType` 与真实解码双重验证），复现方法见[技术文档](docs/technical/README.md)。

## 功能与 Windows 版改进

- 将 macOS／浏览器原型移植为 Windows x64 桌面程序，使用 WinForms 启动器、内置本机音乐服务和 WebView2 窗口。
- 将专辑标题经去首尾空白、Unicode NFC 规范化和忽略大小写后作为归档身份。同名专辑可以跨歌手标签、唱片编号和音乐根目录归并；曲目仍从各自原路径读取，多碟顺序保持稳定。
- 添加本机歌单管理、可编辑播放队列、上一首／下一首，以及与音频文件同名的 LRC 歌词、播放同步、偏移解析和歌词点击定位。
- 优化三维专辑架的封面传输：使用普通 2D 纹理图集和每张专辑独立的 UV 区域，专辑架采用实例化绘制；更新封面只上传变化的图块。冷切换时的选中封面和离场封面改用 CanvasTexture 路径，避免 GPU 纹理读回后再复制。
- 设置页提供专辑与画面偏好、音量和动效选项。支持 F11 无边框全屏及 Per-Monitor V2 DPI。
- 图形路径为 **WebView2 → Chromium/ANGLE → WebGL 2 → Three.js**，并请求高性能 GPU。实际 GPU 选择和呈现能力取决于 Windows、WebView2 与显卡驱动。

## 发行说明

当前发行使用 `0.7.0-dev.16` 版本号。应用界面显示实际的 WebView2 / WebGL 2 图形路径及 Bong712 维护者信息。帧率由具体设备的显示器、显卡和驱动决定；项目不以开发原型数据代替最终用户设备上的性能承诺。

详细改动见 [发行说明](RELEASE_NOTES_0.7.0-dev.16.md) 和 [CHANGELOG.md](CHANGELOG.md)。

## 开发与构建

需要 Windows 10/11、Node.js 22.12+、npm、.NET Framework 4.6.2+ x64 编译工具和 WebView2 Evergreen Runtime。仓库包含构建所需的 WebView2 SDK 程序集及对应许可文件。

```powershell
npm ci
$releaseDir = Join-Path (Get-Location) 'outputs'
./scripts/build-windows.ps1 -WebView2Dir (Join-Path (Get-Location) 'sdk/lib') -OutputDirectory $releaseDir
```

构建脚本会按 `version.json` 分配新的开发版本号并同步到各处，保留已有发行文件，并将 EXE 与版本清单输出到 `outputs/`。前端开发模式可用 `npm run dev`；独立音乐服务可用 `npm run music`。音乐服务只绑定本机 `127.0.0.1`。

## 来源、署名与许可

Windows 版开发者：[Bong712](https://github.com/Bong712)；特别鸣谢：[RonaldDeng](https://github.com/RonaldDeng)，感谢其 Rhine-Music-Demo 项目。原版界面基础来自 [LBEILC/RhineLabUI](https://github.com/LBEILC/RhineLabUI)。本项目保留各自作者署名与 MIT 许可。直接依赖包括 Three.js、Rolling Number、music-metadata、OpenCC-JS，另使用 WebView2 SDK 与 MiSans 字体，版本和许可见 [第三方开源库与许可清单](THIRD-PARTY-NOTICES.md)、[NOTICE.md](NOTICE.md) 及 `public/licenses/`、`sdk/lib/`。

代码许可不自动覆盖原作模型、图标、音频采样、字体或其他非代码素材。上游说明明确指出，部分原作相关素材不属于 MIT 授权范围，来源标注也不构成再分发许可。完整资源来源和适用边界见 [NOTICE.md](NOTICE.md)。

## English

Rhine Music for Windows is a Windows desktop port of [RonaldDeng/Rhine-Music-Demo](https://github.com/RonaldDeng/Rhine-Music-Demo), with synchronized LRC lyric display added alongside playlist and playback-queue management. It is developed by [Bong712](https://github.com/Bong712), with special thanks to RonaldDeng. The 3D archive UI builds on [LBEILC/RhineLabUI](https://github.com/LBEILC/RhineLabUI). This fork (the Rhine Lab edition) is maintained by [lzxac](https://github.com/lzxac): it fixes the local album-artwork mixing bug and reworks the synchronized lyrics panel. See the notices for third-party licenses and asset attribution.

### Supported audio formats

There is **no transcoding**: the player streams your original file bytes and lets the Edge WebView2 (Chromium) decoder handle them, so audio quality is whatever your file is — no downsampling, no bit-depth change, no re-encoding.

- **Lossless** — FLAC, WAV, ALAC (inside `.m4a`)
- **Lossy** — MP3, AAC, Ogg Vorbis, Opus (`.ogg` / `.opus`)
- **Not supported** — DSD (`.dsf` / `.dff`), AIFF (`.aiff` / `.aif`); these are indexed and shown, but playback reports that the current version cannot play them

In other words the ceiling is lossless and the floor is the common lossy codecs; DSD and AIFF are the exceptions. Verified on Edge WebView2 (Chromium 155) by both `canPlayType` and real decoding — see the [technical notes](docs/technical/README.md).
