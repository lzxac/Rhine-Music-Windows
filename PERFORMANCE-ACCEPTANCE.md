# 性能验收标准（两套并存）

发布**正式版**（去掉 `-dev` 的版本号，例如 `0.7.0`）时，`scripts/version.mjs` 会强制校验一份性能验收报告。
本项目现在接受**两套标准中的任意一套**；两套都必须有 PresentMon 的真实"显示帧"数据、不得降低画质、不得把低分辨率画面放大冒充。

| 标准 | 报告文件 | 要求 |
|---|---|---|
| **① 上游原生 4K**（原项目自带，保持不变） | `performance-acceptance.json` | 渲染缓冲区为 **3840×2160**，6 个场景各 ≥60 显示帧/秒、p95 帧间隔 ≤16.67ms |
| **② 参考机标准**（本项目新增） | `performance-acceptance-reference.json` | 渲染缓冲区 ≥ **2560×1440**、且与报告里写明的实测 backbuffer 一致；同样 6 场景、同样阈值；必须写明实测硬件 |

两套共用同一批场景名：`cold-switch`、`warm-switch`、`rapid-switch`、`album-detail`、`theme-switch`、`large-library`。

## 参考机（标准 ② 的测量对象）

- 显示器：3440×1440 @ 144Hz（21:9 带鱼屏）
- 显卡：NVIDIA GeForce RTX 2070 SUPER
- 曲库：`D:\Music\林子汐的车载电台`（169 张专辑 / 666 首）
- 采集在**全屏**下进行（否则任务栏会让渲染高度只剩 1370，不满足 ≥1440 的下限）

## 怎么跑（一次命令）

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "B:\RHINE LAB_DEV\_verify\perf\run-acceptance.ps1"
```

流程（脚本自己完成）：

1. **弹一次 UAC**——PresentMon 启动 ETW 采集必须有管理员权限（或把当前用户加入 *Performance Log Users* 组），脚本会自动以管理员身份重启自己
2. 第一轮：启动程序（`RHINE_PERF_SCENARIOS=cold-switch,warm-switch,rapid-switch,album-detail,theme-switch`，全屏），同时 PresentMon 采集
3. 第二轮：单独跑 `large-library`（在真实大曲库上连续切专辑 8 次）
4. 用程序写下的 QPC/UTC 阶段标记把采集**按场景切片**，算出每场景的显示帧率与 p95 帧间隔
5. 写出报告 `Rhine-Music-Windows\performance-acceptance-reference.json`，并打印逐场景结论

产物都在 `_verify\perf\`：`capture-main.csv`、`capture-library.csv`、`phases-*.jsonl`、`run-acceptance.log`。

## 拿到 `status: passed` 之后

```powershell
node scripts/version.mjs --finalize      # 版本号变为 0.7.0，channel 变为 release
```

随后照常打包（`scripts/build-windows.ps1` 会拒绝 dev 之外的版本号，需要用正式版的流程）、发布 Release。
**注意**：`--finalize` 会改写 `version.json` 等 7 处元数据，属于正式版动作，必须经用户确认后执行。

## 相关实现位置

| 位置 | 作用 |
|---|---|
| `DesktopProgram.cs` | `RHINE_PERF_SCENARIOS` / `RHINE_PERF_OUT` / `RHINE_PERF_EXIT`（性能模式）、`RHINE_FULLSCREEN`（全屏） |
| `_verify\perf\run-acceptance.ps1` | 编排：PresentMon + 两轮运行 + 调用分析器 |
| `_verify\perf\analyze-capture.mjs` | 按阶段标记切片、算指标、写报告 |
| `scripts/version.mjs` | 发布闸门：接受上面两套标准中的任意一套 |
| `_verify\perf\PresentMon.exe` | PresentMon 2.6.0（测量工具，仓库外保存） |

## 诚实性要求（重要）

- 报告里的 `referenceHardware`、`backbuffer`、`renderResolution` 必须是**实测值**，不得手改
- 若某场景没跑起来（比如切专辑失败），阶段标记里会带 `failures` / `albumChanged` 等证据字段，分析器会把该场景判为 FAIL
- 不满足标准时**宁可继续标开发版**，也不要伪造报告去通过闸门
