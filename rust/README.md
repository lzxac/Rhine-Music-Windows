# rust/ — B1 里程碑（空窗口）

> **B1 范围**：只验证"Rust 窗口技术栈在本机可用"。空窗口能开、能关，**不载入任何 3D 内容、不访问音乐库、不启动本地服务**。
> **B2 未启动**（等用户指令）。

## 技术栈

| 项 | 值 |
|---|---|
| 工具链 | `rustup` + `stable-x86_64-pc-windows-gnu`（rustc/cargo 1.99.0） |
| 目标三元组 | `x86_64-pc-windows-gnu` |
| 窗口库 | `winit` 0.30.13 |

**为什么用 GNU 而不是 MSVC**：本机**没有安装 Visual Studio / MSVC 链接器**（`vswhere`、`link.exe` 均不存在），而 rustup 的 `windows-gnu` 目标自带 `rust-mingw` 组件（含链接器），**自包含、无需 VS**。若将来要用 MSVC，需先装 VS Build Tools 的 C++ 工作负载。

## 构建与运行

```powershell
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
cd rust
cargo build          # 首次会拉取 crates.io 依赖
cargo run            # 或直接运行 target\debug\rhine-desktop.exe
# 关闭：点窗口关闭按钮，或按 Esc
```

## 隔离性（不污染现有构建链）

- 不修改 `package.json`、`build-windows.ps1`、`version.mjs`；不读 `version.json` / `src` / `dist` / `public`。
- `rust/target/` 由 `rust/.gitignore` 排除，不入库。
- 现有 Node/C# 构建与运行完全不受影响。

## B1 验证结果（2026-10-14）

| 验证项 | 结果 |
|---|---|
| 编译 | ✅ `cargo build` 成功，`Finished dev profile in 29.72s`（winit 0.30.13，Cargo.lock 1751 行） |
| 窗口创建 | ✅ 标题 `Rhine Music — Rust B1 (empty window)`，客户区 1280×720（外框 1296×759） |
| 能显示 | ✅ 枚举到可见顶层窗口，截图见仓库外 `B:\RHINE LAB_DEV\_verify\m1-b1\b1-window.png` |
| 能关闭 | ✅ 发送 `WM_CLOSE` → 程序日志 `B1: close requested, exiting` + `B1: event loop finished`，进程正常退出 |

程序日志（stdout）：

```
B1: starting empty-window check
B1: window created (1280x720)
B1: close requested, exiting
B1: event loop finished
```

## 说明

- 空窗口没有绘制内容（未引入任何渲染 API），窗口内容由系统默认绘制；B1 只验证"窗口能开能关"。
- 未做：渲染、3D、音频、服务、打包、图标、无边框窗口（均属后续阶段）。
