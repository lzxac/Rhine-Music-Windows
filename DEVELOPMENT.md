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

提交记录里用的是你的 GitHub 隐私邮箱（`<your-noreply-email>`），不会暴露你的真实邮箱。这是好事，别改。

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

## 9. 交接说明（2026-10-13 第三版，给下一个会话的我）

> 这一节是**给 AI 助手看的**。用户不需要读。

### 一句话状态

**歌词面板的显示效果改造已全部完工并逐项验收。** 本轮做了九件事：面板透明化、展开时隐藏下层专辑信息、制作人员区块保留、歌词与专辑文字竖向对齐、修掉制作人员横线变宽、去掉状态文案句号、收起态三行靠右、两态按钮位置一致、歌词居中位置修正。**下一步等用户提新需求**（他说"还有东西要加"，尚未说明）。

### 本轮已完成并确认的效果

| 改动 | 验收结果 |
|---|---|
| 面板去掉背景/投影/毛玻璃，与专辑页一样透明 | ✅ 内部几何 0 位移（保留 1px 透明边框当占位） |
| 展开时隐藏下层专辑信息 | ✅ 精确只藏面板覆盖的那一块 |
| 制作人员区块（ALBUM CREDITS / 补充在线资料）保留可见 | ✅ 分毫不移 |
| 歌词与专辑文字同一条竖线 | ✅ 左右各 1px（占位边框所致） |
| 制作人员横线不再变宽 9px | ✅ 展开前后 0.00 位移 |
| 状态文案去掉句末句号 | ✅ |
| 收起态三行（按钮/状态行/当前歌词行）整体靠右 | ✅ 三行右边界 0.00px |
| 收起/展开的按钮水平位置一致 | ✅ 0.00px |
| 收起/展开首行都对齐专辑大标题 | ✅ 都在 y=200 |
| 歌词居中句落在面板中心 | ✅ 5 个视口高度下偏离 ≤0.5px |
| 收起卡片首行与大标题同线；横线不再压歌手名 | ✅ 横线余量 16.33px |
| 制作人员块与左下角卡片说明同一条水平线、随窗口同步缩放 | ✅ 4 视口 × 3 种曲目数下差 0.0px |
| 制作人员块与左下角卡片说明**同高**（各 38px，六个宽度下高差与底边差都是 0） | ✅ 文字未被裁切 |
| 专辑详情页行悬停蓝条铺满整行（与页签栏、与行横线齐平） | ✅ 左右端差 0.00px |
| 点击歌曲跳转时的脉冲浅黄条也铺满整行（含正常动效与降低动效两条路径） | ✅ 左右端差 0.00px，左侧 3px 竖线同在整行上 |
| 歌单很长时滚动的行不会跑到制作人员文字后面 | ✅ 3 视口 × 3 曲目数 × 21 个滚动位置，实际可见重叠 0.00px |

### 关键设计约束（改动前必读）

1. **面板是 `.music-detail` 的兄弟节点，不是子节点。** CSS 自定义属性不能跨兄弟继承——这个坑已经踩过一次（`--detail-content-top`）。**任何新变量必须声明在 `#stage` 上。**
2. **几何一律实测，不要写死。** `syncLyricsPanelAlignment()` 会设：`--lyrics-top`、`--lyrics-bottom`、`--lyrics-collapsed-offset`、`--lyrics-left-pad`、`--lyrics-right-pad`。
   **两个内缩值必须从「样式表」读，绝不能读元素的实时 computed style** —— 变量是展开/收起两态共用的，读实时值会让结果取决于"最后一次重算发生在哪个态"，差 2px。用 `--lyrics-top-inset`(16px) 和 `--lyrics-collapsed-pad-top`(14px)。
   **`--lyrics-top` 直接量大标题自己的视口位置**（`lyricsTitleTop = round(h1.getBoundingClientRect().top)`），再减去 `border + --lyrics-top-inset`。**不要写成「专辑栏位置 + 标题偏移」的加法**：进入详情页的过程中专辑栏和大标题会同时量成 0，那个加法就悄悄变成「0 + 缓存偏移」，写出一个看起来合理但完全错误的数字 —— 实测被写成 `-17px`，卡片跑到页面顶边之上，而且进入详情页后不会被纠正。
   **写入必须和测量受同一个守卫保护**：`measurable()` 只判断「要不要测量」是不够的，`if (lyricsTitleTop !== null)` 才决定「要不要写」。量不到时保留上一次的值，绝不凭空造一个。`check-music-scene.mjs` 里有 3 条断言守着这一点。
3. **不要在 `.lyric-list` 上加 `scroll-behavior: smooth`**，也不要给活动行加 `font-size` 过渡——两者都已证实会破坏滚动动画。
4. **隐藏被面板覆盖的那一块，用 `visibility: hidden`，绝不用 `display: none`。** `display:none` 会让后面的制作人员区块上浮进面板区域（实测 y 547 → 200，被面板压掉 325px）。隐藏目标是 `#album-detail-content > .album-detail-body`，**制作人员区块和 overline 必须留在外面**。
5. **`.lyric-list` 必须 `position: absolute; inset: 0` 钉死成容器尺寸。** 用 `height: 100%` 会被内容顶开：`padding-block` 本身超过容器高度时列表退回内容高、溢出容器，**它自己的中心就跑到容器中心下方**，于是"居中的那句偏下"（实测偏 94px）。跟随动画对的是**列表中心**，不是面板中心。
6. **`.lyric-list` 的 `padding-block` 不能用百分比。** 对绝对定位元素百分比内边距按**容器宽度**解析、再**加到钉死的高度上**（实测 30% 把列表顶到 405px vs 容器 299px），中心又跑了。用视口单位 `max(140px, 17vh)`：下限≈13.5vh（任意行要能滚到中心）、上限≈24vh（两个内边距要装进容器），17vh 落在中间。
7. **`.lyric-line` 这个类名被两个组件共用！** `music-playlists.css` 里有一组**死代码**（`.lyrics-header/.lyrics-lines/.lyrics-current/.lyrics-status`，源码里没有任何地方生成这些类名），其中裸的 `.lyric-line` 规则排在后面、特异性相同，**一直在覆盖面板的样式**（把面板歌词压成 13px/10px 内边距）。已给它加上 `.lyrics-lines` 作用域。
8. **不要加回 `[data-lyrics-visible] #album-detail-content { padding-right: 0 }`。** 它会把栏内容区撑宽 9px，让标题/发行信息/页签/制作人员横线全部右移 9px。
9. **`.lyrics-song-info` 是绝对定位在 `.lyrics-band` 左上角**（与收起按钮同一行）。它是上下两行的竖排（歌名+歌手），**不要改成并排** —— 用户明确要求保持竖排。横线靠 `--lyrics-rule-drop: 14px` + 等量负 `margin-bottom` 单独下移（只有边框动，其他 0 位移）。
10. **专辑栏现在是「overline + 可滚动区 + 固定底栏」结构**，不再是一个滚动盒：
    ```
    #album-detail-content          position:relative; flex column; overflow:hidden（自己不再滚动）
      ├─ .detail-overline          常驻（flex item）
      ├─ .album-detail-scroll      flex:1 1 auto; min-height:0; overflow:auto（滚动条与 padding-right:9px 在这里）
      │    └─ .album-detail-body   ← 被歌词面板隐藏的那一块（h1 等都在里面）
      └─ .album-detail-footer      position:absolute; bottom:var(--credits-bottom)（不在 flex 流里！）
           └─ .producer-section
    ```
    **底栏必须绝对定位，不能用 flex 项 + 负 margin**：flex 项无法被推到容器内容盒之外，制作人员块会停在卡片说明线上方（实测差 −10px，反复调 margin 都不对）。
    **它和左下角 `.card-caption` 要同高同底**，全部由挂在 `#album-detail-content` 上的三个变量驱动：
    - `--credits-h`（高度，基准 38px；`max-width:1100px` 那一档是 36px，因为卡片说明自己的提示行在那档变成 8px）
    - `--credits-gap`（两行间距，10px）
    - `--credits-bottom`（基准 30px = 卡片说明的 82px − 栏的 52px；`max-width:1180px` 档 7px、`max-width:1100px` 档 42px）
    高度构成：标签行 = `--credits-h − --credits-gap − 12px`，说明行固定 12px。**改动这些变量要同时核对卡片说明那两行的高度**，否则两块会错开。
    **`.album-detail-scroll` 必须 `margin-bottom: calc(var(--credits-h) + var(--credits-bottom))`**，让滚动区自己的盒子止于底栏顶边。它是撑满栏高的 flex 项，不给这个 margin 就会一直延伸到栏底、**压在绝对定位的底栏身上**，任何滚到那一段的歌单行都会从制作人员文字后面透出来（实测：任意滚动位置有 1~2 行、最多一整行高度）。**用 `padding-bottom` 不管用** —— 内边距不缩小盒子，重叠照旧；必须是 margin。这一条我在同一个坑里来回试了四次才找对。
    **专辑栏必须 `overflow: visible`**（不是 `hidden`）：滚动区故意往外溢出滚动条那 10px（见下），`hidden` 会把这段整个裁掉，滚动条不是被压住而是**直接消失**（实测 `elementsFromPoint` 在溢出区只取到专辑栏的裁剪边）。
    **专辑栏的 `right` 不能动**：`detail-album-navigation`（「上一张/下一张」）和面板的垂直间隙只有 **1px**（导航底 182、面板顶 183），把栏的右边界外推会把导航推进面板区域。所以「让滚动条离开歌词卡」不能靠加宽专辑栏。
    **滚动条靠这三个属性一起配合才落在卡片外、且文字与卡片右边界齐平**（缺一个就错位）：
    - `.album-detail-scroll { scrollbar-gutter: stable; margin-right: calc(-1 * var(--detail-scrollbar)); padding-right: 0; }`
    - `--detail-scrollbar` 为 10px。
    **为什么是「只外溢 gutter，不外溢滚动条宽度」**：滚动条会从内容盒扣掉自己的宽度，所以滚动区右边界在卡片右边界时，专辑文字会比卡片短 19px（9px padding + 10px 滚动条），而卡片不动 —— 这就是用户看到的现象。外溢 10px 后文字正好落在卡片右边界、滚动条在其外侧；**外溢 19px 会过头**（实测文字超出卡片 19px）。
    **`scrollbar-gutter: stable` 是让它确定的关键**：不加它，滚动条只在歌单真的溢出时才占位，于是**同一张专辑在曲目多少不同时专辑文字有两种宽度**；而且在「滚动条覆盖式」的平台上文字会超出卡片。加上后不论溢不溢出，内容盒宽度恒定（实测：1 首与 11 首、3 个断点下结果完全一致）。
    `.album-detail-footer` 里的 `.producer-section` 规则**必须限定在底栏作用域内**：同一个 `.producer-section` 也用在「专辑介绍」页签里，那里要保持原来的宽松排版（24px/18px 内边距、1.9 行高，共 94px）。
    **`.album-detail-scroll` 这个 wrapper 不能省**：`.album-detail-body` 必须仍是「被隐藏的那一块」且不含制作人员块，且 h1 选择器是 `#album-detail-content .album-detail-body > h1`（后代，不是直接子选择器——直接子选择器会连带命中隐藏的 `.music-title-probe`）。
11. **专辑详情页的悬停蓝条画在 `.track-item` 上，不在 `.track-row` 上。** `music-playlists.css` 里 `.track-item` 是 `display:flex`（行按钮 + 右侧两个常驻小按钮），`.track-row` 只有 `flex:1 1 auto; width:0`，只占「整行减去右侧 71px」；而那条横线画在 `.track-item` 上是整宽的。所以背景若留在 `.track-row` 上，**蓝条右端会比横线短 71px**（用户报过这个现象）。现在背景在 `.track-item:hover` 上、`.track-row:hover` 和工具按钮的 hover 背景都置空（只保留颜色变化），并**限定在 `#album-detail-content` 作用域内**——歌单面板里的行保持原样。
    注意 `.music-detail` 是 `pointer-events: none`，只有内部交互元素单独打开，所以**用 CDP 合成指针测不到行悬停**；测这个要用 `CSS.forcePseudoState` 强制 `:hover`。
12. **行上的两种高亮（悬停浅蓝、跳转脉冲浅黄）都画在 `.track-item` 上，不画在 `.track-row` 上。** 原因同第 11 条：按钮只占整行减去右侧 71px。脉冲由 `MusicTrackFocus.reveal()` 直接 `element.animate()`，所以它作用的是 `row.parentElement`（即 `.track-item`），class 也叫作 `.track-item.search-track-highlight`。
    **`--search-track-tint` 必须声明在 `#album-detail-content` 上，不能留在 `.track-row` 上** —— 自定义属性**只向下继承**，被染色的元素是按钮的父级，声明在按钮上会让父级解析为空：背景变透明，而且 `box-shadow: inset 3px 0 var(--accent)` 里那个失效的 `var()` 会被当成原始颜色值用。这个 bug 在改动时真实出现过，表现为「只剩一条错误颜色的竖线、没有背景」。
13. **左边界统一用 `--page-margin`（`#stage.music-app` 上，基准 40px；≥1700 为 60、≤1100 为 25、≤700 为 22）。** 这个变量**必须声明在 `#stage.music-app` 上，不能在媒体查询里只写 `.music-app`** —— 基础声明的选择器是 `#stage.music-app`（1-1-0），只写 `.music-app`（0-1-0）**优先级不够，断点永远不生效**（实测：1920 宽时仍读到 40px）。这个坑真实踩过。
    之前 header 用 `40/60/25/20`，而「返回专辑架」「ALBUM/093 说明」「library-status」「music-navigation」「music-bottomline」各自用 `42/62/27/22` —— **4 个断点 × 6 个元素 = 24 个数字各写各的**，导致左下方两块比左上角标题**往外凸 2px**，≥1700 时说明更是**凸 18px**。现在全部改为引用同一个变量。
    顶层左边界的元素清单（改 `--page-margin` 会同时影响它们）：`.music-header`(left/right)、`.music-back`、`.card-caption`、`.library-status`、`.music-navigation`、`.music-bottomline`(left/right)。
    **`viewer-*` 那一套（全屏查看器）有自己的 40/22px，故意不动**；`progress-area` 在 TS 源码里已无引用，属死代码。
    **注意竖屏（`data-layout="portrait"`）下这些元素各有自己的值**（如 caption 32.39px），那是另一套布局，不在本变量的覆盖范围内。
14. **专辑栏与歌词面板的右边界也读 `--page-margin`（原来是 `4.5%` / ≤1100 档 `4%`）。** 这样右边界等于「视口 − 页面边距」，与顶栏右端（`.music-header` 的 `right`）**落在同一条竖线上**，速率也从 0.955 变成 1.000，与顶栏同步。
    **栏和面板必须一起改**：面板的 `--lyrics-right` 是栏 `right` 的镜像，只改栏会让面板比栏右出 20~30px。要改的地方一共 4 处 —— 栏的基准 + `.music-detail #album-detail-content`（≤1100 档，**注意选择器带 `.music-detail` 前缀**）+ 面板的基准 + 面板在 `@media (min-width: 1181px)` 里的那份（**它会覆盖基础值，最容易漏**）。
    **竖屏的 `clamp(18px, 4vw, 42px)` 保留不动。**
    实测：1600 栏 `832→1560`（= 1600−40）、1400 栏 `728→1360`（= 1400−40）、1200 栏 `624→1160`（= 1200−40），栏目与面板左右差均为 0。
15. **右侧的基准是「滚动条」，不是栏的内容边界。** 栏的右内缩是 `calc(var(--page-margin) + var(--detail-scrollbar))`，比页面边距**多让出滚动条那 10px**。
    原因：滚动条画在滚动区盒子的最右侧、也就是栏右边界**之外**那 10px（滚动区靠 `margin-right: calc(-1 * var(--detail-scrollbar))` 外溢）。所以**视觉上这一栏的右边缘是滚动条**。早先只把栏对齐页面边距时，栏的内容边界确实和「播放/暂停」「停止」按钮右边界重合（都是距右 40px），但滚动条落在距右 30px 处、**比按钮多出 10px** —— 用户就是看到这 10px 说「太靠右了」。现在滚动条右边界距右 40px，与停止按钮**精确对齐**（实测差 0）。
    **`--detail-scrollbar` 必须声明在 `#stage.music-app` 上**（不能在 `.album-detail-scroll` 上）：栏和面板都要读它，而自定义属性**不向上继承**，声明在滚动区上会让栏的 `calc()` 解析失败、`right` 变成无效值。
    面板的 `--lyrics-right` 用同一个表达式，所以歌词卡的右边界始终等于栏的内容右边界。
16. **归档架首页（进入详情之前那一屏）的说明块与导航行也用同一个右侧基准。** 两条规则：
    - `.music-app:not([data-layout="portrait"]) .album-callout` 的 `right` 从 `max(24px, 2.2%)` 改为 `calc(var(--page-margin) + var(--detail-scrollbar))`。
    - `.music-navigation` 的 `right` 从 `6.2%` 改为同一个表达式，并给它里面的 `.genre-stepper` 加 `justify-self: end`（它默认在网格格里居中，右箭头落不到线上）。
    **为什么之前找不到**：这条 callout 规则的选择器是 `.music-app:not([data-layout="portrait"]) .album-callout`，优先级高于样式表里那两条 `.album-callout`（后者写着 `left: 57%` / `right: 6.2%` / `max-width: 520px`，**但全是输的、完全不起作用**）。排查这类问题要用 CDP 的 `CSS.getMatchedStylesForNode` 直接问浏览器哪条规则赢了，不要靠遍历 `document.styleSheets` 猜。
    实测（1600）：callout 右 1550、导航行右 1550、流派步进右 1550，全部等于 `1600 − 40 − 10`；1400/1200/1920 同样成立。
    底部行 `.music-bottomline` 用的是 `--page-margin`（右边界比上面多 10px），那是**左对齐的文字信息行**、不是同一组，保持不动。
17. **流派步进（`← GENRE 03 / 03 流派 →`）只改左边界、宽度保持自适应（`left: 70%; right: auto`，不写 width）。**
    它是**整组平移**：左箭头落到「说明块左边界」上，两个箭头之间保持原本的紧凑间距（宽 224px），不是把右箭头拉到导航行右边界。
    **为什么是 70% 这个怪数字**：它所属的定位参照（导航行的 padding box）和上面说明块的参照（视口）**不是同一个**，所以不能用同一个百分比。`70%` 是**试算出来的**（实测 1600 时左箭头 1097、说明块左 1098.13，差 1.13px；1400/1200 同样在 7px 内）。
    **看起来对、实际错的写法**（都实测过，别再试）：
    - 只写 `left: 68.6333%`（照抄说明块的百分比）：短掉导航行自身的内缩，1600 时短 21.77px。
    - 百分比 `padding-left`：**这个元素上的百分比内边距按「它自己的宽度」解析**（不是包含块宽度），复利成 986px 而不是 1058px，左箭头反被推到 1326。
    - `left` + `right`（不给 width）：**shrink-to-fit** 到内容宽 224px，拉不开；而 `left`+`right` 再加 `width: calc(100% - 70%)` 会把整组拉到 452px 宽、右箭头比原本**多出 230px**（用户明确要求不要这个）。
    - `left` 里加 `--page-margin` / `--detail-scrollbar`：两个元素的百分比由**不同包含块**解析，没有单一表达式能在所有宽度同时对上。
    改这个之前**先跑 `_verify/css-diff/sweep-left.mjs`**（就是为这件事写的试算器），别手工推。
18. **歌词字号调节（面板上的 `A－` / `A＋`）**：面板通过 `--lyrics-font-scale` 这个**倍数**缩放歌词文字，`LYRIC_SIZES = [1, 1.15, 1.3, 1.45, 1.6, 1.75]`，偏好存在 `preferences.lyricsSize`（存的是**下标**，不是倍数）。
    **必须写成 `calc(clamp(...) * var(--lyrics-font-scale, 1))` 而不是换成固定字号**：那句 `clamp` 在每个断点都不一样，换掉就把响应式丢了。最小值 `1` 就是面板一直以来的字号，也是下限（更小在 600px 栏宽、这个字重下不好看）。
    **选择器必须是 `.music-app .lyric-line`，不能是裸的 `.lyric-line`** —— 歌词行是 `<button>`，而本项目有一条 `.music-app button { font-size: inherit }`（**两个类**），裸选择器输给它，控制就会**完全没反应**（实测：每一步都停在继承来的 16px）。这个坑真实踩过一次。
    **两个按钮外面必须包一层 `.lyrics-band-controls`**：`.lyrics-band` 是纵向 flex，按钮若直接作为它的子元素会多出一行，**把收起卡片撑高**（那个高度是和左下角卡片说明对齐的）。
    验证脚手架：`_verify/css-diff/lyric-size.mjs`（各步的字号/行高/按钮禁用/是否同一行）、`size-persist.mjs`（刷新后是否沿用、大字号下是否仍居中）。
19. **歌词对齐同样是属性驱动**：面板上写 `data-lyrics-align`（`left` / `center`），样式表按属性匹配。**`left` 是原有的默认，所以它不需要任何规则**；以后要加右对齐/两端对齐，就是 `LYRIC_ALIGNS` 加一项 + 样式表加一条规则，**不用改渲染路径**。
    - **选择器必须穿过 `.music-app`**（`.music-app .music-lyrics-panel[data-lyrics-align="center"] .lyric-line`）—— 原因同第 18 条：歌词行是 `<button>`，`.music-app button { font-size: inherit }` 有两个类。
    - **居中时活动行的 `transform-origin` 必须改成 `center center`**：它是靠 `transform: scale()` 强调的，默认 `left center` 会让它只往右长，看起来偏右。
    - **只作用于歌词行**，不要写「让整个面板居中」：收起卡片是靠 `.lyrics-band` 的 `text-align: right` 靠右的，面板层级的 `text-align` 会把它一起改掉。
    - 按钮显示的是**将要切换到的**模式字形（`≡` 左对齐 / `☰` 居中），不是当前模式。
    验证脚手架：`_verify/css-diff/lyric-align.mjs`（模式切换、实际居中量测、收起态是否受影响、刷新后是否沿用）。
20. **音频格式支持：本项目不转码，播放能力由运行时的 Chromium/WebView2 解码栈决定。**
    `/api/audio/<id>` 是 `createReadStream(...).pipe(response)` 的**原样字节**返回（带 Range，所以进度条能拖）；
    元数据里的码率/采样率/位深只是 `music-metadata` 从文件读出的显示值，**不是"音质档位"**（设置页的 `qualityPresets` 是 3D 渲染参数，别混）。
    扫描入库认 13 种扩展名（`AUDIO_EXTENSIONS`），其中 8 种可播（`BROWSER_EXTENSIONS`，决定 `browserPlayable`）；
    **`.dsf`/`.dff`(DSD)、`.aiff`/`.aif`、独立 `.alac` 只入库不能播**，播放时提示见 `src/music-player.ts` 的 `unsupported()`。
    验证脚手架：`_verify/css-diff/codec-support-probe.mjs`（让运行中的解码器自报 `canPlayType`）、
    `decode-support-probe.mjs`（把真实文件交给 `decodeAudioData` 与 `<audio>` **实解**，这才是可信判据 ——
    `canPlayType` 只是声明）。WAV/AIFF 样本用同目录 `make-audio-fixtures.py` 现造；FLAC 需要真实样本且**不入库**，缺失时跳过。
    实测结论（Edge/WebView2 Chromium 155）：FLAC / WAV / OGG / MP3 实解通过；**AIFF 实解失败**（`Unable to decode audio data`，`<audio>` 报错码 4）。

### 版本与提交

- 分支 `rhine-lab`（**自有功能线**）。`main` 上只有封面串台修复（`0.6.0-dev.58`），按第 2、3 节的规则两条线分开处理，互不牵连。
- 版本号 **`0.7.0-dev.4`**，由 `node scripts/version.mjs --allocate-dev` 分配，自动同步到 7 处（`version.json`、`package.json`、`package-lock.json`、`README.md`、`src/build-version.ts`、`app.manifest`、`DesktopProgram.cs`）。**不要手改版本号。**
  - 该命令会在 `CHANGELOG.md` 末尾插入一条占位条目，**必须手动补全内容**。README 会引用 `RELEASE_NOTES_<版本>.md`，**该文件要自己写**。
  - 版本的划分：`0.7.0-dev.3` = 纯显示修复；`0.7.0-dev.4` = 在 dev.3 之上新增歌词字号与对齐两个开关。两个条目**分开写**，别把功能塞进修复条目。
- **打包 EXE 可用**（2026-10-13）：`node scripts/…` 不用管，直接跑 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-windows.ps1 -WebView2Dir <repo>\sdk\lib -RuntimeTemplateDir <repo>\work\runtime-template -OutputDirectory "<outputs>"`。产物在 `<outputs>\`（README/构建文档写的"工作区根目录 outputs"在本机会解析到 `B:\`，所以显式传 `-OutputDirectory`）。`work\runtime-template\NODE-LICENSE.txt` 是本机 Node 安装缺失的许可文件，已在 .gitignore 的 work/ 下，别删。构建脚本已改为兼容 Windows PowerShell 5.1（原脚本要 PowerShell 7）。
- **窗口与顶栏融合**（2026-10-13，dev.6）：启动器去掉系统标题栏（`WM_NCCALCSIZE` 置空 + `WM_NCHITTEST` 保留八向缩放），网页顶栏右上角带 最小化/最大化/关闭 三键，顶栏空白区可拖动窗口、双击切换最大化。**`WM_NCCALCSIZE` 的最大化内缩必须按几何判断**（`CoversWorkArea()`：窗口矩形是否盖满最近显示器的工作区），**绝不能看 `WindowState`**——它在最大化/还原过渡期滞后于消息里的矩形，曾导致首次还原时窗口四周露出浅色底边（dev.7 修复）。网页端一切窗口控制都由 `[data-host-window]` 控制，浏览器端不出现。宿主消息协议是 `rhine-window:min|max|close|drag`。**强制杀启动器进程会孤儿化 node 服务**（finally 不执行），孤儿服务占着端口且 projectDir 不匹配会让下一版 EXE 全端口 Busy，务必用 CloseMainWindow 或界面关闭。
- **无边框窗口的缩放必须由网页侧驱动**（2026-10-13，dev.10 修复）：`WM_NCCALCSIZE` 去掉边框后整个窗口都是客户区、被 WebView2 子窗口覆盖，**Windows 的边缘缩放判定永远到不了窗体**——窗体里的 `WM_NCHITTEST` 代码再正确也不会有真实鼠标到达（这是本轮最大的验证盲区：`SendMessage(WM_NCHITTEST)` 得到的返回值完全正确，但真实鼠标不走这条路）。正确做法与拖动一致：网页检测 6px 边缘热区 → `rhine-window:resize-left|right|top|bottom|topleft|topright|bottomleft|bottomright` → 宿主 `ReleaseCapture()` + `SendMessage(WM_NCLBUTTONDOWN, HT*, 0)` 进入原生缩放循环。**验证方式必须是真实鼠标输入**（`SetCursorPos` + `mouse_event` 按下/移动/松开），不能只用发消息问 hit test；探测时若用户正在操作鼠标会互相干扰，且**窗口被最小化时 `GetWindowRect` 读出 0x0**，会伪装成"没反应"。
  **光标必须一起处理**：三维 canvas 在悬停场景时自己设置光标，**只把光标设在根元素上会被覆盖**（表现为"贴边没有缩放光标，像是没生效"）。解决办法是在热区内用样式表接管：`#stage[data-window-edge], #stage[data-window-edge] * { cursor: inherit !important; }`，并由 JS 维护 `data-window-edge`（无热区时删除属性）。另外**窗口控制按钮（✕□─）位于右上角热区之内**，必须在热区判定里排除（`.window-controls`），否则会被缩放抢走点击。
  **双击不能用普通 `dblclick` 监听**（2026-10-14，dev.10 修复）：拖动/缩放的第一次按下会进入原生模态循环，**那一次点击的松开事件被循环接管**，网页永远收不到完整的一对"按下+松开"，所以 `dblclick` 监听器一次都不会触发（dev.6 写的那两个处理器其实从未生效）。正确做法是自己按时间+位置在 mousedown 流里判定双击（450ms / 5px），命中就切最大化、不启动拖动或缩放。行为对齐 Windows：双击顶栏或**双击窗口边框**都切换最大化；单击绝不误触发。
  **诊断开关 `RHINE_EDGE_DIAG=1`**：启动器会给页面加 `&edgediag=1`，并把收到的每条窗口消息与网页上报的边缘区域追加到 `%TEMP%\rhine-edge-diag.log`（默认关闭）。排查这类问题时先用它，比猜快得多。
- **程序图标**（2026-10-13，dev.8 接入 / dev.9 定型）：图标在 `desktop/`（`app.ico` 多尺寸 + `app-icon-source.png` 原始设计图）。构建脚本用 `/win32icon` 编译进 exe（资源管理器显示），同时用 `/resource:...,RhineMusicIcon.ico` 嵌入，`DesktopWindow` 构造时读该资源设置 `Form.Icon`（任务栏/Alt-Tab 显示）。换图标只需重新生成 `app.ico` 再打包，代码不用改。
  **重新生成**：`powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-app-icon.ps1`（源图默认 `desktop\app-icon-source.png`，已实测与发布产物逐字节一致）。脚本要点：源图无 alpha（四角是画上去的暗角），必须自己加圆角遮罩——半径按原图实测（1254px 画布上 161px = 12.84%，内缩 0.717%），用 4 倍超采样遮罩获得平滑边缘，否则在白色背景上会显示成黑方块。**所有尺寸都用未压缩 DIB 条目**（16–256）：`System.Drawing` 读不了 PNG 压缩条目，会导致大图标回退到 128。验证方法：`new Icon(ico, size, size)` 读四角 alpha（应为 0）+ 直接按字节解码 256 条目确认内容。
- **改同一个版本号重打包时，必须删掉已解压目录** `%LOCALAPPDATA%\Rhine Music\app-v<版本>`：启动器只看 `.payload-ready` 标记，不比对内容，否则会继续跑旧 payload。同理**删除 outputs 里的旧产物前必须先关闭正在运行的程序**——exe 被占用时删除会静默失败，残留的产物会让版本分配器认为该序号已用，从而跳号（本轮真实踩到：dev.9 残留导致分配出 dev.10）。另外分配器还会扫描 `work/` 的目录名，构建临时目录残留也会造成跳号。
- **版本号保持连续（用户要求，2026-10-13 起）**：构建脚本每次运行内部都会 `--allocate-dev` 递增一号，所以**构建前 version.json 必须停在"上一个已发布版本"**，让脚本分配出下一个号；**不要**手动预分配。若构建失败，回滚流程：把 `version.json` 退回上一个已发布版本 → `node scripts/version.mjs --sync` → 删掉 CHANGELOG 末尾的占位条目 → 清空 `outputs\` 里失败产生的文件 → 再跑构建。这样 dev 序号永不跳号。
- `CHANGELOG.md` 与 `RELEASE_NOTES_0.7.0-dev.4.md` 已按第 5 节的规范写好。CHANGELOG 条目从旧到新排在**文件末尾**（注意顺序）。
- **⚠️ 未知陷阱：切换画质档位会抹掉封面（2026-10-14，dev.11 回退）**：封面图集的内容**只存在于 GPU**（图块走 `copyTextureToTexture` 写入，`AtlasPage.data` 那份 CPU 数组始终是空的）。`applyTextureQuality()`（`quality-renderer.ts`）会把与"档位值不一致"的纹理标记 `needsUpdate = true`，一旦对图集纹理生效，**重传就会把封面全部抹白**（图集自己的诊断仍显示"已解码、无待处理"，看不出问题）。触发条件不是 `scale`／`transmission`／`anisotropy`（图集按 `min(4, anisotropy)` 创建，性能档正好是 4）也不是节流，**范围缩小到性能档剩余差异（`aoSamples: 0`、`depthOfField: 0`、`shadows: 1024`、`pixelRatio: 1`）**，尚未定位。因此**画质预设的默认值保持 `original`**，并在迁移里用 `qualityRevision = 4` 把已存的 `performance` 回退。**在修好之前不要让预设默认值改回 `performance`**；正确方向是让 `applyTextureQuality` 跳过图集纹理（或改完各向异性后让图集重绘），并把该 bug 纳入回归验证（切档位后截图确认封面仍在）。
- **渲染节流（dev.11，用户要求的"风扇治理"）**：主循环不再无条件满帧重绘。`music-app.ts` 里 `frame()` 用 `IDLE_INTERVAL_MS = 1000/30` 做静止节流，靠 `keepActive()` 维持满帧：任何 pointer/key/wheel 事件给 1.5s，转场（`presentation.phase` / `scene.musicPresentationPhase` 变化）与播放状态变化给 4s；全屏模型查看器与开机动画期间恒为满帧。**新增任何动画/转场时必须让它调用 `keepActive()`（或落在上面的判定里），否则那段动画在静止状态下会被压到 30fps。** 实测：静止 GPU 88% → 33.5%（其中约 15–20 个百分点不随帧率变化，判断是 WebView2 合成开销的"地板"，见 `RUST-REWRITE-ANALYSIS.md`）。界面右下角"rAF诊断"可直接自检：静止约 30 FPS、一交互跳 100+。
- **曲目列表与歌词卡共用一条底边（dev.12，2026-10-14 用户要求）**：曲目列表在底部**让出一整行**（那条留白以后用来放播放控制按钮），**展开的歌词卡底边就是这条线**。于是两种状态切换时那条边界不动，列表可见区与歌词卡可见区也**不再随专辑的曲目数量变化**。
  实现三处：`#stage` 上的 `--track-reserve`、`.album-detail-scroll` 的 `margin-bottom` 加上它、`syncLyricsPanelAlignment()` 的歌词卡底边 = `.album-detail-footer` 顶边 − 该让出行。让出行**必须实测**：行高随窗口变化（1440×900 是 52px、1920×1080 是 66px），算法是「从**第一行曲目的顶边**量到制作人员块顶边，让出『一整行 + 滚动区正在切掉的那半行』」，切线因此落在整行的底边上、不会从文字中间切过去。
  **绝不能拿滚动区当前的底边去算让出行**：那会让让出行反过来影响自己的测量（实测在 0–7px 之间来回、列表仍然切掉半行）。列表短到够不着这条带时只让出一行的高度；窗口矮到装不下两整行时不让行。
  **必须等详情页入场动画结束后再补测一次**：`SurfaceTransition.show()` 现在带完成回调（与 `hide()` 对称），`showMenu` 用它重跑 `syncLyricsPanelAlignment()`。原因：构建页面的那次 render 发生在面板还隐藏时（量不到盒子，按守卫跳过），此后没有任何东西会重跑它 —— 表现为**首次打开专辑时 `--lyrics-top` 停在样式表默认的 170px**，曲目列表也不让行。用真实应用实测（入场结束后不触发任何 resize）：应用自己写出 `--track-reserve: 79px`、`--lyrics-bottom: 199px`、列表底边 701（1440×900）。
  实测（32 首与 3 首各一张 × 三种窗口）：让出 79 / 73 / 103px；共用底边线 y701 / y887 / y1217；列表可见行数 4→3、5→4、10→9。曲目多到撑满列表的专辑，歌词卡底边**上收**到这条线（此前会垂到列表下面最多约 45px、压进制作人员那块字）；曲目少的专辑则**下移**。
- **专辑详情页首行与「← 返回专辑架」同线（dev.13，2026-10-14 用户要求）**：右侧整块（overline + 大标题 + 发行信息 + 页签 + 曲目表 + 歌词卡）**整体上移**，让「ALBUM 001 / 上一张 下一张」那一行与左边的返回键**落在同一条文字线上**。
  - 两行**行框高度不同**：返回键那行 22px（ESC 键帽 19px 撑着），overline 那行 12px —— 只对齐外框上边缘的话两行文字仍差 5px。现在按**文字中线**对齐：`--detail-content-top = calc(var(--detail-top-line) + 5px)`，那个 5px 就是两行高度差的一半。实测四档（1024×768 / 1440×900 / 1920×1080 / 2560×1440）两行行框中心差 **0.00px**。
  - `--detail-top-line` 各档 112 / 144 / 91 / 87px；**.music-back 的 `top` 与 `--detail-content-top` 都读它** —— 不要再给 `.music-back` 写单独的 `top`，否则两行会漂开。
  - **顺手修掉一个潜伏的优先级 bug**：`--detail-content-top` 的基础声明在 `#stage.music-app`（1-1-0），而断点里写的是裸 `.music-app`（0-1-0）→ **在 stage 上永远不生效**（CDP matched styles 实测：stage 各档都停在 170px，只有 `.music-detail` 跟着 210/132 走）。现在断点写成 `#stage.music-app, .music-detail`。面板 `--lyrics-top` 的 CSS 兜底读的就是这个值（运行时会被实测覆盖，所以此前没有可见症状）。**以后再改跨兄弟的自定义属性，先查一遍这种"基础写 `#stage.music-app`、断点写裸 `.music-app`"的组合。**
  - **副作用（已知且已实测）**：栏整体上移后曲目列表变高，**大档位下多显示一行**（1920×1080：4 → 5 行）；dev.12 的让行线随之移动 1–5px（701→700、887→892、1217→1222），但**列表可见底边与歌词卡底边仍逐像素同线**；制作人员块与左下角卡片说明**分毫未动**（780 / 960 / 1320）；专辑大标题上移 53–61px，歌词卡顶边同步上抬（1440×900：183 → 130）。
  - 竖屏**故意不动**：那边 `#album-detail-content` 是 `top: 50%`、返回键 118px（`music-theme-switch.css`），与桌面这套无关。
  - **同一个 dev.13 里还修了两处（2026-10-14 用户验收后提出）**：
    1. **点「返回专辑架」歌词卡不收**，展开的卡片直接压在归档页文字上（实测与说明块重叠 430px × 402px）。**用户的最终选择是"专辑架页完全不显示"**（比收起态更干净）：`syncLyricsPanel()` 里 `panelElement.hidden = !hasLyrics || stage.dataset.mode === "archive"`，回到专辑页再显示；**不修改记忆的设置**。DOM 状态由唯一的 `applyLyricsCollapsed()` 统一写（启动首次绘制也走它），按钮文案与画出来的状态不可能不一致。
    2. **歌词卡展开态的歌名/歌手字号与专辑详情不一致**（15.12/11px vs 35.28/14px）。现在歌名 `clamp(24px, 2.45vw, 39px)`、歌手 14px（≥1700 为 17px、≤700 为 12px），间距照抄专辑标题块的 10px。
       **那条长横线改为落在专辑「发行信息」块顶边上**：`--lyrics-band-min` = `.album-facts` 顶边 − `.lyrics-band` 顶边，作为展开态 band 的 `min-height`（**必须 `box-sizing: border-box`**，否则 padding+border 会叠上去、横线落到目标下方 25px）。实测差 0.03 / 0.42px。
       **歌名/歌手放不下时改为横向滚动**（`.lyrics-sliding` + 两份 `.lyrics-slide-copy`，`--lyrics-slide-shift/duration` 由 JS 实测：位移 = 文字宽 + 40px、速度 36px/s），**不能换行**——换行会顶掉横线对齐；`prefers-reduced-motion` 时不滚、退回省略号。
       **坑：这两个字号的基础规则在样式表末尾，断点镜像必须写在它后面**（写在前面会被基础规则盖掉——实测 ≥1700 的歌手字号一度仍是 14px）。
       **坑 2（2026-10-14 用户复验发现"略大一丢丢"）**：`#album-detail-content .album-detail-body > h1` 在样式表里**声明了两次**（`clamp(25px, 2.5vw, 39px)` 与靠后的 `clamp(24px, 2.45vw, 39px)`），**生效的是后者**；照抄前者会让歌名在每个 <1700 宽度下都比专辑标题大一丁点（1440 时 36 vs 35.28）。歌词歌手还必须用**墨色**（专辑 `.detail-artist` 没有颜色声明、继承 `--ink`），用 `--muted` 会显得比专辑那边淡。
       **坑 3（同日复验发现"首次展开横线在歌名歌手中间"）**：**隐藏状态的元素没有盒子** —— `loadLyrics()` 里那次 `syncLyricsPanelAlignment()` 跑在 `syncLyricsPanel()` 把面板显示出来**之前**，于是 `.lyrics-band` 量不到、`--lyrics-band-min` 保持上次的值（首次为 0），横线与歌词整体就停在旧位置，直到下一次 render（例如切专辑）才纠正。现在 `syncLyricsPanel()` 在**面板由隐藏变可见**时补一次 `requestAnimationFrame(syncLyricsPanelAlignment)`。**任何"量隐藏元素"的测量都要先确认它已经在布局里。**
       **坑 4（同日复验发现"左边界差一丢丢"）**：面板那 1px 透明占位边框（`border: 1px solid transparent`，当初为保持内部几何而保留）会把内容整体推到专辑文字**右边 1px**。现在 `.lyrics-band`、`.lyrics-panel-body` 各加 `margin-left: -1px` 让回这一像素（歌名/歌手/歌词与专辑标题左边界差 0.00px）；**面板右边界不要一起动**，那条线是压着滚动条对齐的。
       **居中歌词要带上歌名块**：`data-lyrics-align="center"` 下把 `.lyrics-song-info` 也居中（`left: 50%` + `translateX(-50%)` + `text-align: center`），否则会出现"歌名在左、歌词在中间"的错位。
       **坑 5（2026-10-14 复验：滚动时出现省略号、且歌名与歌手同字号）**：那两条"单行"规则（`display: block; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis`）**选择器写宽了**，连滚动用的 `.lyrics-slide-copy` **副本**一起命中 → 每份副本都被 `max-width: 100%` + 省略号截断，而且副本是 `<span>`、又吃到歌手那条 `font-size: 14px`，于是歌名显示成歌手的字号。**结论：行级规则一律用 `> strong` / `> span` 只作用于两行本身，副本单独声明 `max-width: none; overflow: visible; text-overflow: clip`（字号靠继承）。** 实测强制滚动：两份副本可视宽 = 文字宽（168/168，不截断）、字号 39px（歌手 17px）。
       **坑 6（同日复验：详情页标题显示文件名）**：`combineAlbums()` 里 `fallbackTitle = text(track._albumFallback) || ...`，而**无标签单文件**的 `_albumFallback` 就是**文件名**（`path.parse(file).name`），优先级高于曲目自己的标题标签 → 详情页标题变成文件名。已改为「无标签单文件优先用 `track.title`」。**分组不受影响**（这类文件本来就走 `single:${track.id}` 独立成组）；`check-music-library` 14/14 仍过。
       **长名称的肉眼验证工具**：`_verify/longname-fixture/`（20 秒静音 WAV + 同名 .lrc，标题与歌手都超长；用应用自己的扫描器验证过会被正常索引、`browserPlayable: true`）。
       **滚动机制现在覆盖四处**：歌词卡的歌名/歌手、**专辑页的大标题**（`.album-detail-body > h1 .music-title-main`）、**专辑页的歌手行**（`.detail-artist-name`，新包的一层 span，离线徽标在它外面）——它们共用 `.lyrics-sliding` / `.lyrics-slide-copy` 与 `--lyrics-slide-*`。**专辑架页（`.album-callout`）不要接进来**：标题由 `music-title-reels`（每行一个卷轴 + 逐字动画 + 自适应字号，最多两行）排版，歌手名由 `music-text-motion.ts` 的 `wrappingText` 包成 span，横向滚动与两者都不兼容；用户已确认该页保持原样。
       **别把 `.album-callout .selection-artist` 加进滚动**：实测会出现"切哪张专辑都显示同一个歌手"——`applyNameSlides()` 在滚动状态下从 `dataset.slideText` 取文本，而那一行的文字是**别的机制在更新**（先替换掉我的副本、我再按缓存重建），于是缓存就把首张专辑的歌手锁死了。**凡是文本由别处更新的元素，都不能用这种"缓存 + 重建"的滚动。**
       **专辑页大标题必须单行**：它换行会把 `.album-facts` 那条横线挤下去（歌词卡横线是对齐它的），名字过长时标题还会压到歌词卡上。实测注入超长名字：标题仍 43px 一行、两线相差 −0.03px。
       **居中歌词的歌名块两侧都要让位**：`data-lyrics-align="center"` 下 `max-width` 必须是 `max(140px, calc(100% - 400px))`（右边那 200px 是收起按钮），只用 `100% - 200px` 会让长名字直接压到按钮文字上。
       **启动窗口默认值**（`DesktopProgram.cs`）：曾以 `WindowState = FormWindowState.Maximized` 启动，导致"还原"落到 Windows 默认位置（左上角）。现改为普通窗口 + `StartPosition = CenterScreen`，尺寸**按显示器算**：工作区高度的 80%（上限 1920×1080），宽度不足时再按宽度收敛，**保持 16:9**——固定的 1920×1080 在 1080 屏上等于又全屏了一次。**改窗口默认大小时别把 `WindowState` 改回 Maximized。**
- **推送/发布前必须得到用户明确确认**（2026-10-14 用户要求，之前写的"每次交付默认推送"作废）：改完先交给用户试用，**用户说"可以"之后才推送、才发 Release**。用户是产品角色，他要用真实手感验收（本轮的缩放光标问题就是他试用后发现的，而我自己的自动化测试没发现）。
- **正式版（去掉 `-dev` 的版本）的门槛与决定**（2026-10-14 明确，2026-10-14 二次更新为"两套标准"）：`scripts/version.mjs` 的 `releaseAcceptance()` 硬性要求 PresentMon 的真实显示帧证据，**接受两套标准中的任意一套**：
  1. **上游原生 4K 标准**（原项目自带，保持不变）：`performance-acceptance.json`，渲染缓冲区 3840×2160，6 个场景（cold-switch / warm-switch / rapid-switch / album-detail / theme-switch / large-library）各 ≥60 显示帧、p95 `MsBetweenDisplayChange` ≤16.67ms（见 `BUILD-WINDOWS.md` 的"4K 性能验收"一节）
  2. **参考机标准（本项目新增）**：`performance-acceptance-reference.json`，渲染缓冲区 ≥2560×1440 且必须等于报告里实测的 backbuffer，同样 6 场景/同样阈值，必须写明实测硬件
  两套都不允许降低画质或把低分辨率放大。**完整说明与运行方式见 `PERFORMANCE-ACCEPTANCE.md`**。
  - 用户参考机是 **3440×1440 @144Hz + RTX 2070 SUPER**：**全屏**下 backbuffer 3440×1440（达标），最大化时只有 3440×1370（任务栏占 70px，不达标）→ 验收必须在全屏下跑。无 4K 显示设备，因此当前**仍不发正式版**，继续开发版线（dev.N）。
  - 验收脚手架在仓库外 `<verify>\perf\`：`run-acceptance.ps1`（编排两轮运行 + PresentMon，需一次 UAC）、`analyze-capture.mjs`（按阶段标记切片、出报告）、`PresentMon.exe` 2.6.0。程序侧钩子：`RHINE_PERF_SCENARIOS` / `RHINE_PERF_OUT` / `RHINE_PERF_EXIT` / `RHINE_FULLSCREEN`，阶段标记（QPC + UTC）写在 `RHINE_PERF_OUT` 的 JSONL 里。**PresentMon 必须管理员权限**（ETW），否则报 `access denied`；脚本会自动提权重启自己。
  - 发布闸门已实测（临时目录里跑 `--finalize`）：4K 标准有效 → 放行；参考机标准有效 → 放行；backbuffer 过小 / 无硬件块 / 只有 45fps / 无报告 → 全部拦截。`node scripts/check-version.mjs` 通过（覆盖原拦截路径）。
  - 场景驱动已实测（无需管理员）：`cold-switch` 切换成功（`albumChanged:true`、`failures:0`）、`theme-switch` 三个主题全部应用（`applied:3/3`）、`album-detail` 打开并进入相机就绪（`opened:true,detailReady:true`）、metadata 记录到 backbuffer/GPU/曲库规模。
- **GitHub Releases 的排序规律**（2026-10-14 实测确认，用于让"最新版排在最上面"）：
  - GitHub **不按时间排**。同一分组内是按**标签名字符串倒序**：`0.7.0-dev.9` > `0.7.0-dev.7` > … > `0.7.0-dev.5` > `0.7.0-dev.10`（字符串里 `"10" < "5"`），所以 `dev.10` 会掉到最下面。
  - **最新/非预发布的那个会排在最前**：把最新版的 `prerelease` 取消（`prerelease:false` + `make_latest:"true"`）后，它立刻置顶并被标为 Latest，`/releases/latest` 也返回它。
  - 因此**以后想让新版本置顶，就把它作为正式发布（不加 Pre-release）**；若继续标 Pre-release，它会因名字文本排序而落在单数版本之下。等宽标签（`0.7.0-dev.05`）也能修好顺序，但会让标签与程序内版本号不一致，非必要不用。
  - 发布 API 相关的脚本经验：**每个 curl 调用只能有一个 `--max-time`**（重复时 curl 取较短的，65MB 上传会被 40 秒掐断）；上传域名是 `uploads.github.com`，DELETE/GET 用 `api.github.com`。
- **已推送到 GitHub**（2026-10-13，用户要求）：`main`（→ `7071b16`）和 `rhine-lab` 推到 `origin`，`rhine-lab` 已设好上游跟踪。
- **封面修复已反馈上游**：从 `lzxac:main` 向 `Bong712:main` 发了 PR（[Bong712/Rhine-Music-Windows#4](https://github.com/Bong712/Rhine-Music-Windows/pull/4)，2026-10-13，mergeable 状态 clean）。等 Bong712 处理；他若提修改意见，改 `main` 分支的代码即可（PR 会自动带上）。
- **GitHub 仓库默认分支是 `rhine-lab`**（2026-10-13 应用户要求从 `main` 改过来），所以仓库首页展示的是 rhine-lab 的 README（含"Rhine Lab 版的更新内容"一节）。README 里的"当前版本"行由 `scripts/version.mjs` 重写，已改成维护者 lzxac 的格式，别改回去。给上游的 PR 只含 main 上的代码提交，README 改动只在 rhine-lab，不会互相污染。
- `scripts/check-music-scene.mjs` 里有 4 条断言原本要求"面板必须不透明/有投影/有毛玻璃"，**已改写成对新设计的断言**（不得有背景/投影/毛玻璃、必须保留透明占位边框、歌词列表不得预留滚动条槽、隐藏范围只针对被覆盖那一块且用 `visibility`）。别改回去。

### 恢复验证环境

1. 代理必须开着：`127.0.0.1:10810`（Whale）。**代理关闭时任何 GitHub 结论都不可信**（曾因此误判仓库被删除）。
   **Git 走这个代理必须用 TLS 1.2**：schannel 的 TLS 1.3 在此代理下握手会失败（`schannel: failed to receive handshake`），已用 `http.https://github.com/.sslVersion=tlsv1.2` 修在仓库本地配置里，别删。换 OpenSSL 后端也不行（`unexpected eof`），只有锁 TLS 1.2 有效。
2. 构建并启动本地服务（**注意：8099 上通常已经有一个在跑的服务，它用的是用户真实曲库 `<music-root>`，不是 `_verify` 副本；别再起第二个**）：
   ```powershell
   npm run build
   node scripts/music-server.mjs     # 服务每次请求现读 dist，改完只需 build + 浏览器 Ctrl+Shift+R
   ```
3. 测试歌曲：**`林子汐 - NUNA3.0`**（track id `track-3885ff186af821e6c45ba7d8`，专辑 `NUNA3.0`，49 行歌词）。
   > 注：`林子汐` 为测试样例数据（测试曲目/复现样例的一部分），非真实个人信息；如需对外分发请另行评估。
4. **验证脚手架在仓库外**：`<verify>\css-diff\`（CDP 驱动 Edge headless 的量测脚本）。仓库里不留任何临时文件。
   **每次改完先跑 `boot-diag.mjs`** —— 它监控未捕获异常/boot 状态。本轮曾因一个 `let` 声明在函数之后（TDZ）导致整个应用启动中断、卡在"正在载入三维专辑架"，而当时所有"只看几个盒子"的脚本全部漏过。

### 下一步：原生重构（2026-10-14 用户决定）

**用户的决定**：现有分支的迭代**暂停**在 `0.7.0-dev.13`（帧率调度随 dev.11 交付，曲目列表与歌词卡统一底边随 dev.12，专辑详情页首行与返回键同线随 dev.13；画质与上游一致），**接下来着手用 Rust 重构整个项目**（原作者也打算改用 C++，理由是同一套 WebView2/Three.js 栈的性能与资源占用）。

**重构前的分析与决策材料**：`<workspace>\RUST-REWRITE-ANALYSIS.md`（含实测的性能账本、两套技术选型 A/B/C、以及"网页栈的地板"结论）。**待用户明确四点后才能选型**：① 首要目标（性能/内存启动/单纯换栈）② 时间预期（能否接受数月、是否并行）③ 界面是否允许与现版有差异 ④ 3D 场景是否可简化。

**重构时必须继承的既有约定**：`DEVELOPMENT.md` 第 2/3 节（main 与 rhine-lab 两条线、bug 归属判断）、版本号规则与两套验收标准、以及"用户确认后才推送/发布"。

**今天查出来的两个上游代码问题（重构时自然消失，但要写进交接以免在旧栈里再踩）**：
1. 关掉 SSAO/景深后，卡片的磨砂玻璃渲染成白色并盖住封面（触发点已定位，根因在渲染管线深处）
2. 封面图集的内容**只存在于 GPU**（图块走 `copyTextureToTexture`，CPU 数组为空），任何纹理重传都会抹掉它 → 已在 `ArchiveScene.setQuality()` 后调用 `CoverAtlas.repaintAll()` 加固

**性能账本（3440×1440，满画质）**：每帧 GPU 8.74ms（主渲染 6.56 + SSAO 1.19 + 景深 0.88 + 输出 0.11），而 144fps 的预算是 6.94ms → **满帧与满画质在这块显卡上物理上不可能同时成立**；帧率调度把静止占用从 88% 降到约 33%。这两条是"是否值得重构"的核心数据。

### 工作方式（用户明确要求过）

- **基于源码，不基于截图。** 截图只用来确认"看到了什么现象"；参数、位置、对齐一律去源码查，或让页面实测上报。
- **用户只付得起有限的 token**，所以：回复要短、动代码前把相关源码规则一次读完、配对关系先想清楚再写。
- 用户是产品角色，不懂代码。方案要讲清取舍，**设计选择由他定**。
- **不要自作主张。** 用户说"把线往下移"，就只动那条线；把排版一起改了会被明确批评（本轮发生过）。改动前如果可能影响别的元素，先用 CDP 做对照实验证明"只有目标元素动了"。

### 下一步

- **播放控制搬进预留带 + 歌词按钮当开关（dev.14，2026-10-15，用户要求）**：顶栏的 `歌名／暂无歌词·歌词／播放·停止` 整组搬进 dev.12 预留的那条带（曲目表让出来的一行），**居中**；「歌词」按钮改为**常驻**并作为歌词卡唯一开关（单击展开、再单击关闭＝卡片完全不显示）；展开态卡片里重复的"收起歌词"按钮删除，只留字号与对齐。
  - **实现要点：控制行放在 `#music-detail` 里，不要放进 `#album-detail-content`**——后者每次换专辑都会 `innerHTML` 重建，会销毁播放按钮上的监听器。它作为 `.detail-transport` 与 `.music-back`、`#album-detail-content` 平级。
  - **位置全部实测**：`--transport-left/right/bottom` 由 `syncLyricsPanelAlignment()` 从专辑栏的 rect 与制作人员块顶边算出，高度直接用 `--track-reserve` —— 所以控制行、预留带、以及 dev.12 的共用底线三者不可能不同步。实测：控制行 `t=700, b=780` 正好等于「列表可见底边 700 / 制作人员块顶 780」，水平中心与专辑栏中心差 0.1px。
  - **收起＝关闭**：`panelElement.hidden = !hasLyrics || collapsed || 归档页`；因此展开/关闭就等于"专辑详情 ↔ 歌词"的切换（`data-lyrics-playing` 随之为 false，专辑正文恢复 visible）。
  - **「歌词」按钮的旧逻辑**是 `openLyrics.hidden = status.hidden`（只在**没有**歌词时出现，有歌词反而消失、点了还是空操作）——现已改为 `!transportActive`（有歌曲在播放/暂停就常驻）。
  - **别把控制行放进专辑栏**：专辑架页没有专辑栏，而 `.music-detail` 在专辑架页是 hidden 的 → 控制行自然不显示（用户确认专辑架页不需要它）。
  - 竖屏/窄窗口**暂不处理**：`.music-app[data-layout="portrait"] .detail-transport { display: none }`（那边是另一套布局，用户说以后一起修）。
  - **遗留小尾巴**：`case "lyrics-toggle"`（旧卡片按钮的 action）现在已无对应元素，属死代码；检查脚本里还断言它存在，下次清理时一并处理。

用户说"还有东西要加"，**尚未说明内容**，等他提。已知他关注的方向：显示效果、录屏观感。

**之前约定留到后续的**：专辑信息自动收纳、背景虚化、逐字（卡拉OK）歌词。
