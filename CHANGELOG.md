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

## 0.7.0-dev.3 (2026-10-13)

Display pass on the album detail page and the synchronized lyrics panel. Every
item below was verified by measuring the live DOM in a real browser, not by
reading the CSS.

- Make the lyrics panel a transparent text layer. Its background, shadow,
  backdrop blur, border radius and dusk/night backgrounds are gone, so it reads
  as content on the page like the album column it replaces. The 1px border stays
  but is transparent: with `box-sizing: border-box` it is what holds the inner
  geometry, and dropping it moved every lyric 1px left and up and widened the
  rows by 2px.
- Hide only the album block the expanded panel actually covers. The album column
  keeps the overline (with the album switcher) and the producer credits outside
  that block, and the block is hidden with `visibility: hidden`, never
  `display: none` — taking it out of flow collapsed the surrounding layout and
  pulled the credits up into the panel (measured: y 547 → 200 against a panel
  spanning 200-572).
- Remove the rule that zeroed the column's `padding-right` while lyrics showed.
  It widened the column's content box by 9px, sliding the title, facts, tabs and
  the credits rule 9px right and the "补充在线资料" button with them.
- Put the lyric text on the album column's own vertical lines. The panel's
  horizontal padding is now measured from the column at runtime (including its
  scrollbar allowance) instead of being a number of its own, and the lyric list
  reserves no scrollbar track, so the rows end on the same edge as the credits
  rule (within the 1px spacer border).
- Align both states of the panel to the album title line. `--lyrics-top` is the
  title line minus the panel's first-line inset (a measurement, not the title
  line itself), and the collapsed card's offset is the difference between the two
  states' top insets. Both insets are read from the stylesheet, never from the
  live computed style: `--lyrics-collapsed-offset` is one value shared by both
  states, and reading the live padding produced −15px collapsed against −17px
  expanded, so the card landed 2px off depending on which state was on screen
  when the last re-measure ran.
- Move the collapse toggle to the right edge and, while collapsed, the whole
  stack with it. The song playing is shown on that same row on the left, in the
  space the toggle gave up. Title and artist stay stacked; the band's closing
  rule is lowered by exactly the amount its bottom padding gains, via a matching
  negative margin, so only the rule moves.
- Fix the centred lyric line sitting low. `.lyric-list` used `height: 100%`,
  which content overrides: with head/tail padding of `clamp(140px, 30vh, 340px)`
  the two paddings alone (485px) exceeded the container (299px), so the list's
  content box grew past it and the list ended up 186px taller than the box
  holding it. The follow animation centres on the list's own centre, which was
  therefore 94px below the panel's. The list is now pinned with
  `position: absolute; inset: 0` and its head/tail room is in viewport units
  (a percentage padding resolves from the containing block's width and then adds
  to the pinned height, which put the centre out again). Verified across five
  window heights: list height equals container height and lines 2-48 land on the
  container's centre within 0.5px.
- Make the credits a pinned footer so it shares a line with the cover caption in
  the opposite corner and scales with the window. The column is now an overline,
  one scrolling region and that footer. The footer is absolutely positioned —
  a flex item cannot be pushed past its container's content edge, so it stopped
  short of the caption's line — and both blocks are the same height (38px, 36px
  at the width where the caption's hint line drops to 8px), driven by
  `--credits-h`, `--credits-gap` and `--credits-bottom`. Verified across six
  widths: height difference 0, bottom difference 0.
- Stop track rows scrolling behind the credits. The scrolling region is a flex
  item filling the column, so its box ran the full column height, past the
  absolutely positioned footer; every row that scrolled into that band was
  painted behind the credits. A bottom padding does not fix this — padding does
  not shrink a box — so it takes a matching bottom margin. Verified over 21
  scroll positions × 3 window sizes × 3 track counts: 0.00px of visible overlap.
- Give the row highlights the full row width. Both the hover band and the
  click-to-play reveal pulse were painted on `.track-row`, which is a flex item
  beside the two always-visible tool buttons, so they stopped 71px short of the
  rule running under the row (measured: 606px against 677px). Both now paint
  `.track-item`, including the pulse, which `MusicTrackFocus` drives directly.
  `--search-track-tint` moved up to the column with them: custom properties
  inherit downwards only, so leaving it on the button left the row's parent
  resolving it to nothing.
- Scope the dead `.lyric-line` rule in `music-playlists.css`. It belongs to a
  component whose markup this project no longer generates, but the unscoped rule
  loaded after `music.css` and silently overrode the lyrics panel's own padding,
  font-size and line-height.
- Remove the trailing full stop from the lyric load status line.
- Stop the lyrics panel being parked above the top of the window when the album
  changes. The panel's top was computed as the album column's position plus the
  title's cached offset, but both boxes report a zero rect while the detail pane
  is entering, so the sum quietly became "0 + cached offset" — a plausible number
  that no measurement could contradict. In a real switch the column measured 0
  wide and the title 0 wide, and the panel was written to `--lyrics-top: -17px`;
  entering the detail pane afterwards did not correct it, so the card appeared
  above the top of the page the next time lyrics were shown. The title's own
  viewport position is now measured directly, and that measurement is only
  committed when the title box is real; an unmeasurable title keeps the previous
  value instead of inventing one. Verified: the same live layout produces the
  identical value from both formulas (181px, first line on the title row at
  198px), and the zero-layout case now writes nothing at all.
- Make the album text and the lyrics card end on the same right edge, with the
  track list's scrollbar outside both. A scrollbar takes its width out of the
  content box, so on an album long enough to scroll the album text sat 19px short
  of the edge it shares with the lyrics card (its own 9px gutter plus the 10px
  scrollbar), while the card did not move — and on a short album it did not, so
  the same page had two different widths. The scrolling region now reserves the
  scrollbar gutter always (`scrollbar-gutter: stable`) and overhangs the column by
  exactly that gutter, with no gutter of its own, which puts the text on the
  card's right edge and the scrollbar past it. Measured identical at 1600, 1400
  and 1200 wide with 1 track and with 11: text right edge equals card right edge
  to 0.00px, scrollbar in the 10px beyond it.
  - The overhang required the album column to stop clipping (`overflow: visible`,
    not `hidden`): `hidden` removed the overhang entirely, so the scrollbar was
    not merely overlapped but absent.
  - Widening the column was not an option, which is what made this awkward: the
    album switcher above the panel clears it by only 1px (navigation bottom 182,
    panel top 183), so pushing the column's right edge out would drive the
    switcher into the panel.
  - Overhanging by more than the gutter is also wrong: growing by the scrollbar
    as well as the gutter pushed the album text 19px PAST the card's edge.
- Put every left-hand element on one page margin. The header used 40/60/25/20px
  while the back link, cover caption, library status, archive navigation row and
  bottom line each used 42/62/27/22px — twenty-four numbers written out
  separately — so the cover caption and the back link sat 2px further out than the
  brand, and at 1700 and wider the caption was 18px further out still. They now
  all read one `--page-margin` (40px, 60px from 1700, 25px to 1100, 22px to 700).
  Measured at 1920/1700/1610/1400/1200/1100/1000: brand, caption and back link are
  identical at every width, and the two page margins still match each other.
  - The variable must be declared on `#stage.music-app`, not on `.music-app`:
    matching the base declaration's specificity is what makes the breakpoints
    apply. Written as `.music-app` they silently lost to `#stage.music-app`
    (1-1-0 against 0-1-0) and the margin stayed 40px at every width.
  - The full-screen viewer keeps its own 40/22px insets, and portrait keeps its
    per-element values; neither is part of this margin.
- Put the album column's and lyrics panel's right edge on that same page margin.
  They used `4.5%` (`4%` below 1100), so the column's right edge sat at a
  width-proportional inset while the header's sat at the page margin — the two
  right-hand lines only coincided at one width, and the column moved at a
  different rate from the header (0.955 against 1.000) as the window was resized.
  Both now read `--page-margin`, so the column's right edge lands on the header's
  right edge at every width: measured 832→1560 at 1600 wide, 728→1360 at 1400,
  624→1160 at 1200, each exactly the viewport less the margin, with the panel
  sharing both edges to 0.00px.
  - The column and the panel had to change together: `--lyrics-right` mirrors the
    column's `right`, so changing only the column left the panel 20-30px wider.
    Four declarations in all, including the panel's copy inside
    `@media (min-width: 1181px)`, which overrides its base value.
  - Portrait keeps its own `clamp(18px, 4vw, 42px)`.
- Put the track list's scrollbar — not the column's content edge — on that margin.
  Insetting the column by the page margin alone aligned its content edge with the
  play/stop buttons exactly (both 40px from the right), but the scrollbar is drawn
  in the 10px beyond that edge, where the scroller overhangs so the scrollbar sits
  outside the lyrics card, so the visible right-hand edge still stood 10px past the
  buttons. The column and the panel now inset by the page margin plus the
  scrollbar's width, which puts the scrollbar's right edge on the buttons' line:
  measured at 1600 wide, column right 1550, scrollbar 1550–1560, stop button right
  1560 — a 0.00px difference.
  - `--detail-scrollbar` moved to `#stage.music-app`: the column and the panel both
    read it, and a custom property does not inherit upwards, so on the scroller the
    column's `calc()` resolved to nothing.
- Put the archive page's text block and navigation row on that same right edge.
  The selected album's callout used `max(24px, 2.2%)` and the archive navigation
  row used `6.2%`, so on the page shown before a detail view is opened the text
  block's right edge and the genre stepper's right arrow stood about 15px and 59px
  short of the line the detail page's content and the transport buttons use. Both
  now use `calc(var(--page-margin) + var(--detail-scrollbar))`, and the genre
  stepper is end-aligned in its grid cell rather than centred, so its arrow lands
  on that line: measured 1550 at 1600 wide, 1350 at 1400, 1150 at 1200, 1850 at
  1920 — each the viewport less the margin and the scrollbar.
  - Worth recording: the rule that actually placed the callout was
    `.music-app:not([data-layout="portrait"]) .album-callout`, which beat the two
    plain `.album-callout` rules that declare `left: 57%`, `right: 6.2%` and
    `max-width: 520px` — those never applied at all. Finding it needed
    `CSS.getMatchedStylesForNode`; walking `document.styleSheets` and filtering by
    selector text missed it.
  - The bottom information line keeps `--page-margin` and stays 10px wider; it is a
    left-aligned text row, not part of this group.
- Shift the genre stepper's group left so its left arrow sits on the text block's
  left edge, keeping its own compact width. Its left arrow stood about 228px short
  of that edge while its right arrow was already where it belonged, so the pair
  simply moves: measured at 1600 wide the group lands at 1097 with its original
  224px width, against the block's 1098.13.
  - `left: 70%` is a percentage of this element's containing block (the navigation
    row), not of the page the text block is measured against, so it is not that
    block's `68.633333%`. The value was found by sweeping candidates against
    measurement (`sweep-left.mjs` in the verification directory).
  - Recorded because they look correct and are not: copying the block's percentage
    falls short by the row's inset; a percentage `padding-left` resolves against the
    element's own width rather than the containing block's and compounds to the
    wrong place; `left` plus `right` with no width shrinks to fit the content and
    cannot spread; and stretching to the row's right edge (which an earlier pass
    did) put the right arrow 230px further right than the group has ever been.
- `check-music-scene.mjs` assertions were rewritten for the new design: the panel
  must have no background, shadow or blur; it must keep the transparent spacer
  border; the lyric list must not reserve a scrollbar track; the covered block
  must be hidden with `visibility`; the row highlights must be painted on the
  row; the panel top must be committed only from a real title measurement; and the
  scrolling region must reserve the scrollbar gutter, overhang the column by
  exactly that gutter, add no gutter of its own, and not be clipped by the
  column.

Deliberately left for later versions, as agreed: moving the album information into its own collapse, background blur, and per-word (karaoke) lyrics. Windows real-present frame-rate acceptance remains pending.


## 0.7.0-dev.4 (2026-10-13)

Two additions on top of `0.7.0-dev.3`'s display fixes.

- Add a lyric text size control: `A－` and `A＋` on the panel's control row, six
  steps from the size the panel has always used up to 1.75×, disabled at each end
  and remembered between sessions.
  - The factor multiplies the existing responsive `clamp()` rather than replacing
    it, because that clamp is different at every breakpoint. The smallest step is
    the size the panel shipped with, and is the floor on purpose.
  - The rule has to be scoped to the app. A lyric line is a `<button>`, and this
    project's own `.music-app button { font-size: inherit }` carries two classes, so
    a bare `.lyric-line` rule lost to it and the first build of this control did
    nothing at all — the line stayed at the inherited 16px at every step.
  - The size buttons share the collapse toggle's row through a wrapper. As separate
    children of the band, which stacks in a column, they added a row and grew the
    collapsed card — the card's height is matched to the cover caption in the
    opposite corner.
  - The collapsed card's live line scales with the list, so the two stay the same
    size. Verified: the factor applies across all six steps (16.8px → 29.4px at
    1600 wide), the ends disable, the choice survives a reload, and at 1.45× the
    lyric list still measures exactly its container's height and the active line
    still centres within 0.89px.
- Add a lyric alignment control: a button on the same row cycles left and centre,
  and the choice persists.
  - It is state-driven — the panel carries `data-lyrics-align` and the stylesheet
    matches on it — so a third mode later is one entry in `LYRIC_ALIGNS` plus one
    rule, not another branch in the render path. `left` is the layout the panel
    shipped with, so it needs no rule of its own.
  - Centring is scoped to the lyric lines rather than the panel: the collapsed card
    is right-aligned through its band, and a panel-level `text-align` would take
    that with it. Verified the collapsed card still reports right alignment while
    centre mode is active.
  - The active line's `transform-origin` moves to the centre with it, since it is
    emphasised by `scale()` and a left-anchored origin made it grow to one side.
  - Measured in centre mode: an ordinary line's left and right insets are equal
    (299.4px against 299.4px where left-aligned it is 0 against 598.8), and the
    choice survives a reload.
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.
