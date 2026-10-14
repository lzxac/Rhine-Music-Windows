# M1 · B2 结果 —— 性能门槛通过

> 层：需求变更层（`specs/`）。记录 **M1 阶段 B2 子步骤**的范围、实测数字与结论。
> 基线定义与门槛见 `specs/rust-rewrite/M0-baseline.md`（本档不重复，只做结果对照）。
> 代码位于 `rust-port` 分支的 `rust/`；**未合并回 `rhine-lab`**。

---

## 1. B2 范围（实际做了什么）

| 项 | 内容 |
|---|---|
| 渲染管线 | `wgpu` 0.20.1，**Vulkan** 后端；无边框窗口、客户区 **3440×1370**（与 M0 采集协议一致） |
| 模型 | `gltf::import` 读取 `public/assets/archive-assembly.glb`（**只读**），按节点层级展平为单顶点/索引缓冲 |
| 场景 | 仅三维货架；1 个方向光 + 0.38 环境项（Lambert，WGSL）；深度缓冲 `Depth32Float` |
| 相机 | 取 `src/scene.ts` 基线参数：position `(-62.26,35.98,43.28)`、aim `(-0.5,1.1,0.4)`、fov `6.15°`、near 5 / far 300；按 `scene.ts:1544` 的 settled `span=7.33` 反算距离做尺度对齐 |
| 工具链 | `rustup` + `stable-x86_64-pc-windows-gnu` 1.99.0；另需 WinLibs 的 `as.exe`（见 `docs/technical/README.md` §10） |
| 测量工具 | 复用 M0 的 `_verify\perf\measure-usage.ps1`（GPU Engine 3D 计数器按进程树求和；内存为工作集）与 M0 冷启动协议 |

**模型实测**：22 mesh / 22 primitive / 22 node，**91,692 顶点 / 247,038 索引 = 82,346 三角**，16 材质、0 内嵌贴图；包围盒 `(-2.500,0.000,-0.130)~(2.510,3.700,0.246)`（与 `src/scene.ts` 的 `MUSIC_MODEL` 一致）。

**明确未做**（留给 M2/M3+）：封面图集、曲库扫描、音频、歌词、UI 面板、相机控制、动画、后处理（SSAO/景深/阴影）、地面/雾、打包、版本生成器、PWA。

---

## 2. 三项门槛对比（release 构建，同机同分辨率）

| 判据 | M0 门槛 | M0 基线（dev.11） | **B2 实测** | 结论 |
|---|---|---|---|---|
| 静止 GPU | ≤ 10% | 33.5% | **0%**（avg 0 / peak 0，单帧渲染后不再重绘） | **通过** |
| 内存（工作集） | ≤ 400 MB | 1,091 MB（治理前）/ ~1,050 MB | **168 MB**（静止）／213 MB（持续重绘） | **通过** |
| 冷启动到首帧可视 | ≤ 2,169 ms | **3,099 ms** | **1,338 ms**（1338 / 1195 / 1264 三次中位数） | **通过**（比基线快 **56.8%**） |

冷启动定义完全沿用 M0 §3.3 的协议：从 `Start-Process` 返回，到日志出现"首帧可视"标记（M0 为 `startup` 阶段，B2 为 `B2: first frame presented`）；进程冷、OS/磁盘缓存热、无其它实例、同机同分辨率。

---

## 3. 合成地板消失的证据（M1 核心假设）

M0 §3.1 判断：治理后静止态剩下的约 33% 中，有 **15–20 个百分点不随帧率变化**，属 WebView2/Chromium 在 3440×1440 全屏的合成"地板"。

B2 在同一台机器、同一分辨率下测得的独立数据：

| 模式 | GPU（3D 引擎，进程树） | CPU |
|---|---|---|
| 静止（单帧后不重绘） | **0%** | 0% |
| **持续重绘（vsync 满速）** | **22.7%**（峰值 29%） | 0.3% |

**证据链**：B2 在"持续重绘"下仍只有 **22.7%**，**已低于 M0 静止态基线的 33.5%**；而 B2 场景只做了货架 + 简单光照（无封面图集、无后处理、无地面/雾）。也就是说：**去掉 WebView2/Chromium 这层合成后，即便满速重绘，GPU 也低于原栈的静止水平**——与"存在一层不随帧率变化的合成地板"的判断一致，且该地板在原生渲染路径下不复存在。

静止态则为 **0%**（不重绘即不耗 GPU），远低于"只做帧率治理"时的 20–30% 天花板，印证了 M0 §3.1 的结论（那一档是 WebView2 栈的性能上限）。

---

## 4. 已知局限（诚实记录）

1. **视觉未匹配**：B2 截图与 M0 `covers-real/cover-startup.png` 的网格亮度相关仅 **-0.089**（未匹配）。
   原因：基线帧是 app 的**静止态完整场景**（200×200 地面 Plane + Fog `#eae5e1` + 进场后的 settled 取景），B2 按范围未复刻地面/雾/后处理，因此画面以清屏色为主（均值 238.8 vs 基线 48.3）。取景方向与尺度已按源码参数对齐；**像素级匹配需复刻场景组合（M3+）**。
2. **未测满帧/满负载场景**：未测 144 fps 满帧、多专辑切换、封面图集上传等负载（B2 范围外）。
3. **未测交互态**：无相机控制、无动画（B2 范围外）。
4. **发布形态未验证**：release 22 MB，含 winit/wgpu/gltf；未做静态 CRT、体积优化、杀软误报验证（属打包阶段）。
5. **模型覆盖度**：只载入 `archive-assembly.glb`（未载入 `archive-cassette.glb`、`music-cd.glb`）。

---

## 5. 结论

**B2 通过**：三项门槛全部达标（静止 GPU 0%、内存 168 MB、冷启动 1,338 ms），且给出了"合成地板消失"的量化证据（满速重绘 22.7% < 原栈静止 33.5%）。

**M1 核心问题已有答案**：换掉渲染层能吃到原栈吃不到的收益。B3 不启动；M2 决策待审阅本结果与预算后另行确认。

## 6. 复现

```powershell
# 构建（GNU 目标需要 WinLibs 的 as.exe）
$mingw = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin"
$env:PATH = "$env:USERPROFILE\.cargo\bin;$mingw;$env:PATH"
cd rust; cargo build --release

# 采集/截图（脚本在仓库外）
powershell -NoProfile -ExecutionPolicy Bypass -File B:\RHINE LAB_DEV\_verify\m1-b2\run-and-capture.ps1 `
  -Exe B:\RHINE LAB_DEV\Rhine-Music-Windows\rust\target\release\rhine-desktop.exe `
  -OutDir B:\RHINE LAB_DEV\_verify\m1-b2 -Tag b2-recheck -WaitSeconds 6

# 性能（静止用 -OneFrame；持续重绘去掉该开关）
$env:B2_ONE_FRAME = '1'
powershell -NoProfile -ExecutionPolicy Bypass -File B:\RHINE LAB_DEV\_verify\perf\measure-usage.ps1 `
  -Exe B:\RHINE LAB_DEV\Rhine-Music-Windows\rust\target\release\rhine-desktop.exe -Label b2-idle -WarmupSeconds 12 -SampleSeconds 20

# 同角度对照
powershell -NoProfile -ExecutionPolicy Bypass -File B:\RHINE LAB_DEV\_verify\m1-b2\compare-angle.ps1 `
  -A B:\RHINE LAB_DEV\_verify\m1-b2\b2-stepC-render.png `
  -B B:\RHINE LAB_DEV\_verify\m0\covers-real\cover-startup.png
```

`rust-port` 提交：`0224865`(B1 crate)、`1dd9ee2`(B1 记录)、`6b25064`(B2 代码)、`109e87a`(B2 记录)。
