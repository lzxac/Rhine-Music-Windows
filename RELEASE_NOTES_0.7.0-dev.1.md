# Rhine Music for Windows 0.7.0-dev.1

此版本是 [Bong712/Rhine-Music-Windows](https://github.com/Bong712/Rhine-Music-Windows) 的衍生版本，而后者是 [RonaldDeng/Rhine-Music-Demo](https://github.com/RonaldDeng/Rhine-Music-Demo) 的 Windows 桌面移植版。原始项目作者为 RonaldDeng，Windows 版开发者为 Bong712，本项目在其基础上继续开发。

项目结构、分支用法与版本号规则见 [DEVELOPMENT.md](DEVELOPMENT.md)。

## 本次更新

- **开启本项目自己的 `0.7.0` 版本线。** 此前版本沿用上游的 `0.6.0-dev.N` 编号；从本版起，本项目新增的功能使用 `0.7.0-dev.N`，与上游版本号明确区分，避免混淆。
- 继承 `0.6.0-dev.58` 的专辑封面修复：歌手文件夹中的散装单曲与合辑文件夹不再共用第一个文件的封面。
- 本版**不包含新功能**。`0.7.0` 线的功能开发从下一个版本开始。

## 版本线说明

| 版本范围 | 含义 |
|---|---|
| `0.6.0-dev.N` | 与上游共有的修复，可反馈给 Bong712 |
| `0.7.0-dev.N` | 本项目自己的功能开发 |
| `0.7.0` | 本项目正式版（尚未发布） |

## 项目功能

- Windows x64 桌面播放器，基于 Rhine-Music-Demo 移植并新增同步歌词显示。
- 以规范化专辑名归并同名专辑，支持本机歌单、播放队列和 LRC 歌词定位。
- 使用 Three.js、WebGL 2、实例化绘制和封面纹理图集显示三维专辑架。
- 本机音乐文件留在原路径；歌曲、私人曲库和介绍缓存不包含在发行包中。

## 来源、署名与许可

本项目代码基于 MIT 许可的上述项目继续开发。原项目 [NOTICE.md](NOTICE.md) 明确指出：**模型、图标、音频采样、字体等非代码素材不在 MIT 授权范围内**，来源标注不构成再分发许可。因此本项目的代码改动可按 MIT 使用，但再分发打包好的程序前，需单独确认这些素材的授权情况。

代码来源、开源库与素材许可说明见 [README.md](README.md)、[NOTICE.md](NOTICE.md) 和 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
