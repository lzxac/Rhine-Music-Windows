# Rhine Music Windows port changelog

## 0.6.0-dev.57 (2026-10-04)

- Leave the Windows executable CompanyName field blank so the independent developer is not presented as a company.
- Keep Bong712 in the in-app developer credit and copyright metadata.
- Package this correction as a new version; preserve all previous EXE files.

## 0.6.0-dev.56 (2026-10-04)

- Update the in-app developer panel to identify Bong712 as the Windows port maintainer and describe the actual WebView2 / WebGL 2 (ANGLE) renderer.
- Remove internal FPS acceptance wording from the user settings panel; retain upstream and asset attribution in the app and repository notices.
- Update the repository attribution and release documentation to name Bong712 as the Windows developer and RonaldDeng as the project receiving special thanks.
- Rebuild as a new versioned package; earlier executables remain untouched.

## 0.6.0-dev.39 (2026-10-04)

- Replace the custom `sampler2DArray` cover path with ordinary 2D texture pages and per-instance UV rectangles. Each album keeps its own atlas cell while the shelf remains instanced.
- Update a changed cover by copying its 256×256 cell into the existing page, keeping the same per-page GPU memory footprint as the previous array atlas.
- `npm run check:music` and the Windows package build pass. Automated visual confirmation remains pending because WebView2's GPU and render child processes fail to start on this machine (exit codes `-1073741790` and `49`); the same failure reproduces with dev.37 and SwiftShader. Genuine 4K displayed-frame performance acceptance remains pending.

## 0.6.0-dev.30 (2026-10-04)

- When the local music service is unavailable and the library is empty, show the empty-library panel so the bundled demo-cover action remains reachable. Keep the service-disconnected status visible.
- Add a scene check to prevent this demo-entry regression. `npm run check:music` passed; the production build and Windows package succeeded.
- Built `outputs/Rhine-Music-Desktop-0.6.0-dev.30.exe`; PE FileVersion `0.6.0.30`, ProductVersion `0.6.0-dev.30`, SHA-256 `9a6b1c62a2e37e34281253f9bea2948dd3430c0452176e4951ed971627e058f3`. Performance acceptance remains `PENDING`.
- The no-service demo page was closed before the fix; the WebView2 blank host still exits before scene startup with `STATUS_ACCESS_DENIED`, so displayed-frame performance is unverified.

## 0.6.0-dev.28 (2026-10-04)

- Replace the 5×4 canvas cover pages with WebGL2 texture-array pages. Each 256×256 cover now uploads as one 256 KiB layer instead of retransmitting its roughly 5 MiB page; 432 album slots use four instanced pages when the adapter supports 128 layers.
- Query the active GPU's array-layer limit and cap page depth at 128; retain the existing 256×256 shelf print and the 1024×1024 cold selected-cover path.
- Add checks for changed-layer isolation and vertical cover orientation. `npm run check:music` passes all 49 checks and `npm run build` succeeds.
- Direct visual and displayed-frame verification is still pending because the local WebView2 blank host exits with `STATUS_ACCESS_DENIED`. This remains a 0.6.0 development candidate.

## 0.6.0-dev.1 (2026-10-04)

- Merge albums across configured roots using normalized album title as the only identity; preserve each track's actual source path, cover owner, stable multi-disc order, and migrated manual genre rules.
- Add persistent custom playlists with edit, ordering, playback, and visible missing-track state; add an editable playback queue.
- Add same-folder LRC loading, common timestamp and offset parsing, synchronized lyrics, and click-to-seek.
- Use a device-pixel-ratio-aware original-quality buffer, including native 3840×2160 output at common 4K Windows display scales; remove the software-rendering 30 FPS cap.
- Add Per-Monitor V2 DPI awareness and F11 borderless full-screen support to the standalone Windows host.
- Keep 4K real displayed-frame performance acceptance pending. This development candidate is not the final 0.6.0 release.

## 0.5.0 (2026-10-04)

- Package the Windows desktop application as `Rhine-Music-Desktop-0.5.0.exe`.
- Keep the album-switch cover atlas reuse and 5×4 atlas pages from 0.4.1. The user reviewed the demo and reported that album changes no longer stutter.
- Instrumented present-frame performance acceptance and full native D3D11 scene integration remain pending; this remains a development candidate.

## 0.4.1 (2026-10-03)

- Set the Windows application version to 0.4.1 and synchronized package and UI metadata.
- Rebind the rising selected cover to its existing shelf-atlas tile when resident, avoiding a second 1024×1024 canvas upload on warm album switches; retain the full-size fallback for covers not yet in the shelf pool.
- Split the shelf atlas into 5×4 cover pages so updating a cover invalidates a roughly 5 MiB page instead of one very large atlas.
- Reuse the cover atlas for outgoing album covers and skip canvas texture creation for hidden music labels during album switches.
- Added album-switch frame, scene CPU, GPU, and cover readiness measurements; performance acceptance remains pending.

## 0.4.0-dev.1 (2026-10-03)

- Start the native Direct3D 11 renderer work from the 0.3.1 WebView2 build.
- Current graphics target and product integration are prototypes; 1080p/60 FPS acceptance is pending.

## 0.6.0-dev.2 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.3 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.4 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.5 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.6 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.7 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.8 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.9 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.10 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.11 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.12 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.13 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.14 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.15 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.16 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.17 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.18 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.19 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.20 (2026-10-03)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.21 (2026-10-03)

- Keeps the final 3840×2160 canvas while bounding transmission, SSAO, and depth-of-field buffers to about 2 MP; depth-of-field is upscaled into the full-resolution composer target.
- Added readable per-pass and longer-window switch diagnostics. Genuine displayed-frame acceptance remains pending.

## 0.6.0-dev.22 (2026-10-03)

- Split camera-visible album instances from off-camera shadow-only casters. The same shadow-frustum coverage remains in the shadow map while off-camera glass shells leave the main color and post-processing passes.
- Built as a local Windows development candidate. Real displayed-frame and visual comparison acceptance remains pending.

## 0.6.0-dev.23 (2026-10-03)

- Hide cover-atlas pages with no camera-visible album, reducing empty page draw calls without reducing cover texture resolution.
- Retain the dev22 shadow-caster split. WebView2/GPU initialization and real displayed-frame acceptance remain pending.

## 0.6.0-dev.24 (2026-10-04)

- Move off-camera shadow casters to a shadow-only Three.js layer. The main camera skips their otherwise unnecessary zero-write draw while the directional shadow camera retains them.
- Keep visual and 4K performance acceptance pending because WebView2 currently crashes before the demo scene initializes.

## 0.6.0-dev.25 (2026-10-04)

- Stage cover transforms for camera-visible albums and upload only atlas pages that contain visible covers. Visible pages still zero hidden slots so stale transforms cannot reappear.
- Real-scene visual comparison and 4K present-frame acceptance remain pending while the local WebView2 host fails before scene startup.

## 0.6.0-dev.26 (2026-10-04)

- Defer cover-atlas record lookup, canvas painting and texture invalidation for camera-hidden slots. Refresh each tile before it becomes visible; keep the visible shelf, selected artwork and 4K output resolution unchanged.
- `npm run check:music` passed all 49 checks before packaging. The Windows build succeeded, and the version check passed for this candidate.
- Visual and displayed-frame performance acceptance remain pending because the local WebView2 host fails before scene startup.


## 0.6.0-dev.31 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.32 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.33 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.34 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.35 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.36 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.37 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.38 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.


## 0.6.0-dev.40 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.41 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.42 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.43 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.44 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.45 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.46 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.47 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.48 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.49 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.50 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.51 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.52 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.53 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.54 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.55 (2026-10-04)

- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.6.0-dev.58 (2026-10-12)

- Fix local album artwork bleeding across releases. Files sitting loose in an artist folder (or in a compilation folder) were pooled into one source entry, so the first file's embedded picture became the cover of every album derived from that folder. In a 666-track library this made 41 unrelated albums display the same image. Full cause, evidence and fix: [BUG-REPORT-album-artwork.md](BUG-REPORT-album-artwork.md).
- Extract artwork per file whenever a folder's files do not share a single album tag, and let album grouping pick the image that belongs to each release. Folders whose files agree on the album tag keep the previous single-pass one-cover behaviour.
- Only let a source that is itself titled like the album lend its artwork, so a same-titled release merged from another folder can no longer inherit an unrelated cover.
- Invalidate cached per-file metadata when album grouping changed, so an existing index repairs itself on the next scan instead of keeping the pooled cover.
- Add two regression tests: loose singles in an artist folder keep distinct covers before and after a rescan, and tracks sharing one album tag still share one cover.
- Verification on a real 666-track library: 169 albums, 118 with artwork, 118 distinct images, 0 reused images (previously 41 albums shared one image). `check-music-library.mjs` passes 14/14.
- Known pre-existing failure, not introduced by this change: `node scripts/check-music-scene.mjs` aborts with `TypeError: Cannot read properties of undefined (reading 'getImageData')` at `src/cover-atlas.ts:351`, because that check drives the canvas atlas without a browser canvas. It fails identically on the unmodified 0.6.0-dev.57 tree, so `npm run check:music` cannot complete in this environment.

## 0.7.0-dev.1 (2026-10-12)

This is the first version of this fork's own line, split from the upstream Windows port so features developed here can diverge freely without complicating anything that is offered back upstream. See [DEVELOPMENT.md](DEVELOPMENT.md).

- Start the `0.7.0` version line here; `0.6.0-dev.58` and earlier stay on the upstream-compatible line.
- Carry over the album artwork fix from `0.6.0-dev.58` (loose singles and compilation folders no longer share the first file's cover).
- No feature changes in this entry. Feature work for this line begins with the next version.

## 0.7.0-dev.2 (2026-10-13)

Synchronized lyrics become the main view instead of a two-line subtitle.

- Replace the two-line lyric dock with a persistent right-hand card that shows the scrolling lyrics. It appears only while a track with lyric lines is playing.
- Centre the active line with a hand-rolled eased scroll. Two CSS rules had been fighting it: `scroll-behavior: smooth` animated every `scrollTop` write a second time (which read as "jump down, then drift back"), and a `font-size` transition on the active line changed row heights mid-animation. CSS smooth scrolling is gone and the active line is emphasised with `transform: scale()`, which does not change layout.
- Defer the follow while the viewer scrolls or clicks the list, and re-centre the moment the deferral expires. The first attempt used a pause flag plus a timer; whichever handler ran last could clear the timer while leaving the flag set, so the follow stayed paused permanently — the recorded samples showed exactly that. It is now a single deadline.
- Add a collapse toggle as a compact card that shares the panel's border, radius and shadow. Collapsed keeps the live line and the load status, and the state persists.
- Remove the lyrics modal, its seek slider and its entry in the shared modal shell.
- Layout fixes found by measuring the live DOM rather than reading the CSS:
  - `--detail-content-top` was declared on `.music-detail`, but the panel is its **sibling**, and a custom property does not inherit across siblings. `top: calc(var(--detail-content-top) - 14px)` therefore resolved to nothing, `top` fell back to `auto`, and the panel grew to its content — 2611px inside a 958px viewport. Its list then had `clientHeight` equal to `scrollHeight`, so no scroll viewport existed and the panel looked like a blank page that never scrolled. The variable now lives on `#stage`, and the `210px` and `132px` breakpoints target both selectors.
  - `--lyrics-top`, `--lyrics-bottom` and the collapsed-card offset are measured from the album column at render, on tab switch and on resize, so they stay correct across the responsive steps.
  - The panel was hidden outright with `visibility: hidden` on the whole album column while lyrics showed, which also removed the cover caption and the credits block. Those rules are gone; the panel is opaque and sized from measured geometry instead.
  - The panel ends at the rule that closes the track list — the last track row's `border-bottom` — so the credits area stays visible beneath it.
- `check-music-scene.mjs` assertions were rewritten for the new structure and now cover the measured alignment and the visible album column. The check still stops later at the pre-existing `CoverAtlas.writePageTile` canvas failure documented in `0.6.0-dev.58`.

Deliberately left for later versions, as agreed: moving the album information into its own collapse, background blur, and per-word (karaoke) lyrics.
