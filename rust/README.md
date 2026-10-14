# rust/ — Rust 桌面外壳（M1 阶段）

> **B1**：空窗口（winit）——已完成，见文末。
> **B2**：wgpu 渲染管线 + 载入 `archive-assembly.glb` + 最简光照 + 性能测量——已完成，见下。
> **B3 未启动**（等确认）。

## 技术栈

| 项 | 值 |
|---|---|
| 工具链 | `rustup` + `stable-x86_64-pc-windows-gnu`（rustc/cargo 1.99.0） |
| 目标三元组 | `x86_64-pc-windows-gnu`（本机无 VC/VS，见 `docs/technical/README.md` §10） |
| 二进制依赖 | `winit` 0.30.13、`wgpu` 0.20.1（**Vulkan** 后端）、`glam` 0.28、`gltf` 1.4.1、`bytemuck` 1、`pollster` 0.3 |

**构建前提（重要）**：GNU 目标需要 `dlltool.exe` **且需要 `as.exe`**（rust-mingw 自包含目录里没有 `as.exe`）。本机通过 WinLibs（`winget install -e --id BrechtSanders.WinLibs.POSIX.UCRT`）提供，构建时需把它的 `mingw64\bin` 加入 PATH：

```powershell
$mingw = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin"
$env:PATH = "$env:USERPROFILE\.cargo\bin;$mingw;$env:PATH"
cd rust; cargo build --release
```

## B2 做了什么

1. **wgpu 初始化**：`Instance` → `Surface`(Bgra8UnormSrgb, Fifo) → `Adapter`(HighPerformance) → `Device/Queue`；无边框窗口、客户区 **3440×1370**（与 M0 采集协议一致）。
2. **glb 载入**：`gltf::import` 读取 `public/assets/archive-assembly.glb`（**只读**），按节点层级把变换展平成单顶点/索引缓冲。
3. **3D 显示 + 最简光照**：一个方向光 + 0.38 环境项（Lambert），WGSL 着色器，深度缓冲 `Depth32Float`；相机使用 `src/scene.ts` 的基线参数（position `(-62.26,35.98,43.28)`、aim `(-0.5,1.1,0.4)`、fov `6.15°`、near 5/far 300），并按 `scene.ts:1544` 的 settled `span=7.33` 反算距离做**尺度对齐**。
4. **测量**：沿用 M0 的 `_verify\perf\measure-usage.ps1`（GPU Engine 3D 计数器按进程树求和、内存为工作集）与 M0 的冷启动协议。

模型统计（实测）：22 mesh / 22 primitive / 22 node，**91,692 顶点 / 247,038 索引 = 82,346 三角**，16 材质、0 内嵌贴图；包围盒 `(-2.500,0.000,-0.130)~(2.510,3.700,0.246)`。

## B2 实测结果（release 构建，同机同分辨率）

| 判据 | M0 门槛 | B2 实测 | 结论 |
|---|---|---|---|
| 静止 GPU | ≤10% | **0%**（avg/peak 0；单帧渲染后不再重绘） | **通过** |
| 内存（工作集） | ≤400 MB | **168 MB**（静止）/ 213 MB（持续重绘） | **通过** |
| 冷启动到首帧可视 | ≤2169 ms | **1338 ms**（3 次：1338/1195/1264，中位数） | **通过**（比 3099 ms 快 56.8%） |

补充数据（非门槛）：持续重绘（vsync）GPU **22.7%**（峰值 29%）——已低于 M0 基线的 33.5%（无 WebView2 合成地板）；CPU 0.3%。

**同角度对照**：与 `_verify\m0\covers-real\cover-startup.png` 的网格亮度相关 **-0.089**（未匹配）。
原因：基线帧是 app 的**静止态场景**（200×200 地面 Plane + Fog `#eae5e1` + 进场后的 settled 取景），B2 按范围**未复刻地面/雾/后处理**，因此画面以清屏色为主。取景方向与尺度已按源码参数对齐，**像素级匹配需复刻场景组合（M3+ 范围）**。

## 隔离性

- 只改 `rust/` 内文件；未改 `src/`、`scripts/`、`DesktopProgram.cs`、`package.json`、`build-windows.ps1`、`version.mjs`。
- 只读使用 `public/assets/archive-assembly.glb`；`rust/target/` 由 `rust/.gitignore` 排除。

## B1 记录（空窗口）

见 git 历史（`0224865`、`1dd9ee2`）：winit 空窗口、编译 29.72s、窗口 1280×720、`WM_CLOSE` 干净退出。
