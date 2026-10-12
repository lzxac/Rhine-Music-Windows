# Rhine Music for Windows 0.6.0-dev.58

此版本是 [RonaldDeng/Rhine-Music-Demo](https://github.com/RonaldDeng/Rhine-Music-Demo) 的 Windows 桌面移植版。Windows 版开发者为 [Bong712](https://github.com/Bong712)，特别鸣谢 RonaldDeng。

## 本次更新

- **修复专辑封面串台。** 位于歌手文件夹或合辑文件夹中的散装歌曲，此前会被合并成同一个扫描单元，导致该文件夹里**第一个文件的内嵌封面**被当成其中每张专辑的封面。在 666 首的实测曲库中，这使 41 张互不相关的专辑显示同一张图片。原因、证据与修复细节见 [BUG-REPORT-album-artwork.md](BUG-REPORT-album-artwork.md)。
- 当同一文件夹内的文件**专辑标签不一致**时，改为逐文件读取内嵌封面，再由专辑归并逻辑挑选真正属于该专辑的图片。专辑标签一致的文件夹维持原有「一次读取、共用一张封面」的行为，不增加扫描开销。
- 归并同名专辑时，只允许**标题与该专辑一致**的来源提供封面，避免同名但不同版本、不同封面的专辑互相借用图片。
- 当专辑归并规则发生变化时，使旧的逐文件元数据缓存失效，因此**已有曲库索引会在下一次扫描时自动修正**，不会继续沿用旧的错误封面。
- 新增两项回归测试：歌手文件夹中的散装单曲在首次扫描与重新扫描后都保持各自封面；专辑标签一致的多曲目专辑仍然共用一张封面。
- 实测曲库（666 首）验证结果：169 张专辑、118 张有封面、**118 张互不相同，封面复用为 0**（修复前为 41 张共用一张）。`scripts/check-music-library.mjs` 14 项全部通过。

## 已知问题

- `node scripts/check-music-scene.mjs` 会以 `TypeError: Cannot read properties of undefined (reading 'getImageData')`（`src/cover-atlas.ts:351`）中断，因为该检查在没有浏览器 canvas 的情况下驱动封面图集。此问题在**未修改的 0.6.0-dev.57 上同样存在**（已通过暂存改动对照确认），并非本次改动引入，但它会使 `npm run check:music` 在当前环境无法跑完。
- 本机曲库中另有 51 张专辑没有封面，原因是这些文件**本身不含内嵌图片**且所在文件夹没有图片文件（已逐文件读取元数据确认），程序显示「无封面」占位图是正确的。这部分需要补标签，不是程序缺陷。

## 项目功能

- Windows x64 桌面播放器，基于 Rhine-Music-Demo 移植并新增同步歌词显示。
- 以规范化专辑名归并同名专辑，支持本机歌单、播放队列和 LRC 歌词定位。
- 使用 Three.js、WebGL 2、实例化绘制和封面纹理图集显示三维专辑架。
- 本机音乐文件留在原路径；歌曲、私人曲库和介绍缓存不包含在发行包中。

代码来源、开源库与素材许可说明见 [README.md](README.md)、[NOTICE.md](NOTICE.md) 和 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
