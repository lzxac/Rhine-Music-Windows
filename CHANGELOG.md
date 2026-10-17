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

## 0.7.0-dev.5 (2026-10-13)

- First packaged Windows build of the Rhine Lab line: single-file x64 `Rhine-Music-Desktop-0.7.0-dev.5.exe` (frontend, local music service and WinForms launcher embedded).
- No application-code changes since `0.7.0-dev.4`; everything between dev.4 and this build is documentation (README, handoff notes, upstream PR record) and build tooling.
- `scripts/build-windows.ps1` now also runs on Windows PowerShell 5.1: the `ConvertFrom-Json -AsHashtable` call was replaced with regex checks of the same package-lock fields.
- Packaging now takes `NODE-LICENSE.txt` from `-RuntimeTemplateDir` because this machine's Node.js install ships without a license file.
- Packaging failures now roll the version number back before the next attempt, so development versions stay contiguous (three earlier attempts on 2026-10-13 failed during tooling setup and were renumbered into this release; nothing was ever published under a skipped number).
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.7.0-dev.6 (2026-10-13)

- Integrate the window title bar with the application (user request, NetEase-style borderless window). `DesktopWindow` strips the standard frame via `WM_NCCALCSIZE` so the web content reaches the window edge; `WM_NCHITTEST` keeps the eight resize grips working on the borders; a maximized borderless window is pushed back inside the monitor by the hidden frame width. Win11 rounded corners are requested through `DWMWA_WINDOW_CORNER_PREFERENCE` (ignored on Win10).
- The page sends `rhine-window:min|max|close|drag` over the WebView2 host bridge: dragging the top strip or the empty header space moves the window, double-clicking them toggles maximize, and three small buttons at the right end of the header minimize, maximize/restore and close. F11 fullscreen behaviour is unchanged.
- Browser and PWA builds are untouched: every window-control affordance is gated behind `data-host-window`, which is only set when the WebView2 host bridge exists.
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.7.0-dev.7 (2026-10-13)

- Fix the light strip that appeared around the client on the first restore from maximized. The maximized inset in `WM_NCCALCSIZE` was keyed on WinForms' `WindowState`, which lags behind the rects in the message during maximize/restore transitions; the inset was therefore applied to restored bounds and the light form background showed through. The inset is now decided from geometry: it applies only when the proposed window rect actually covers the nearest monitor's work area (the approach used by Chromium and Windows Terminal). Verified programmatically: after `SC_RESTORE` the top row of the restored window reads dark page content, not the form background.
- Packaging lessons recorded: `scripts/build-windows.ps1` publishes only after all native compilation succeeds, and two mid-development compile failures burned dev numbers before the rollback procedure was applied.
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.7.0-dev.8 (2026-10-13)

- Give the application a real icon (user request). The build now compiles `desktop/app.ico` into the executable with `/win32icon` so Explorer shows it, and embeds the same file as the `RhineMusicIcon.ico` resource so `DesktopWindow` can set `Form.Icon` for the taskbar and Alt-Tab. Both were verified on the built package by extracting the executable icon and reading the window icon back through `WM_GETICON`.
- `desktop/app-icon-source.png` keeps the owner's source artwork next to the generated `desktop/app.ico`; the multi-size ico holds 16/20/24/32/40/48/64/128/256 (bitmap entries up to 64, PNG entries above).
- The artwork itself is provisional: the owner is preparing a final design, and replacing it only means regenerating `desktop/app.ico` and rebuilding.
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.7.0-dev.9 (2026-10-13)

- Ship the final application icon: the owner's second design ("RLAB" wordmark over the archive-shelf texture). Its corners are now genuinely transparent. The artwork carried a painted dark vignette rather than an alpha channel, so a rounded-rectangle mask was applied using the radius measured from the artwork itself (161px on a 1254px canvas, 12.84%).
- Emit every icon size as an uncompressed bitmap entry (16/20/24/32/40/48/64/128/256). The earlier PNG-compressed 128/256 entries were dropped because System.Drawing cannot read PNG-compressed icon entries and the plain bitmap form is the most widely compatible.
- Verified: the .ico's 32px entry and the running window icon both read alpha 0 at the corners and 235 at the edge midpoints; the 256 entry was decoded straight from the file bytes to confirm both artwork and transparency.
- The icon artwork shipped provisionally in `0.7.0-dev.8`, which was never released; this is the released form of the icon change.
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.7.0-dev.10 (2026-10-13)

- Fix edge resizing, which had been broken since the frameless window landed in `0.7.0-dev.6`. The frame is stripped through `WM_NCCALCSIZE`, so the whole window is client area and the WebView2 child covers it; the shell therefore hit-tests the child, never the form, and the form's `WM_NCHITTEST` grips were unreachable from real mouse input. A synthetic `SendMessage(WM_NCHITTEST)` test reported the right codes and hid the problem.
- The page now detects the window edge itself (6px zone) and asks the host for the native resize loop over the host bridge, the same mechanism the existing drag-to-move uses. The window-control buttons sit inside that corner, so they are excluded from the zone and keep their own clicks and cursors.
- Make the resize cursor actually visible: the 3D canvas assigns its own cursor while hovering the scene, so a cursor on the root element alone was overridden everywhere except the top strip. Inside the edge zone the stylesheet now takes over (`#stage[data-window-edge] ... cursor: inherit !important`).
- Verified with real synthetic mouse input (cursor position, button press, move, release) at all eight positions: every one reports the matching resize cursor (`SIZENWSE` / `SIZENS` / `SIZENESW` / `SIZEWE`) and resizes the window (right 1600->1760, bottom 900->1020, top 1020->920 with the top moving 40->140, corners similar), and the header drag still moves the window.
- Add `RHINE_EDGE_DIAG=1`: the launcher then loads the page with `&edgediag=1` and appends every window message plus every reported edge zone to `%TEMP%\rhine-edge-diag.log`. That hook is what turned "the corners do not work" into the cursor-override finding; it is off by default.
- Make double-click work again. The drag and resize requests start a native modal loop that owns the first click's release, so the page never sees a complete click pair and a `dblclick` listener never fires — the handlers added in `0.7.0-dev.6` had therefore never run. Double clicks are now detected from the mousedown stream (450ms, 5px) and toggle the maximized state, matching Windows on both the header and the window border. Verified: windowed plus a double click on the header or the border maximises; maximised plus a double click restores; a single click leaves the state untouched.
- A maximized window still ignores edge resizing, matching Windows; the header drag restores and moves it like a normal title bar.
- This entry replaces the first `0.7.0-dev.10` build, which shipped the resize bridge but no cursor feedback.
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.7.0-dev.11 (2026-10-14)

- Add the reference-machine performance acceptance harness and pace the render loop, so the app stops pinning the GPU while nothing moves. This single version covers the whole batch of work; the intermediate numbers it took are folded in here rather than leaving gaps in the release line.
- Performance acceptance harness: `DesktopProgram.cs` gains an environment-gated scenario driver (`RHINE_PERF_SCENARIOS`, `RHINE_PERF_OUT`, `RHINE_PERF_EXIT`, `RHINE_FULLSCREEN`) that runs the six acceptance scenarios and writes phase markers carrying both a UTC timestamp and a QueryPerformanceCounter value, so a PresentMon capture can be sliced per scenario, with per-phase evidence (click failures, whether the album actually changed, camera-ready, themes applied). `scripts/version.mjs` now accepts either of two standards at the release gate: the original upstream one (`performance-acceptance.json`, native 3840x2160) or a new reference-machine one (`performance-acceptance-reference.json`, backbuffer at least 2560x1440 and equal to the documented measurement, same six scenarios and thresholds, hardware recorded). Neither can be satisfied by upscaling, and neither was weakened. The harness lives outside the repository at `_verify\perf` (PresentMon 2.6.0, `run-acceptance.ps1`, `analyze-capture.mjs`), with the procedure written up for the owner.
- Render pacing: the archive loop used to redraw on every display refresh even with a static picture, which is why an idle library held the GPU at 88%. It now keeps the display rate while the user interacts — pointer, key or wheel events hold it for 0.4 s, an album step for the camera flight, transitions and play-state changes for 4 s, plus the fullscreen model viewer and the boot sequence — and drops to 30 fps once the picture settles. The scene integrates from the frame timestamp and clamps its step at 50 ms, so a 30 fps cadence stays exact. Measured idle load after the change: about 33% of the 3D engine, with image quality untouched.
- Tried, measured and then reverted inside this version: making the `performance` preset the default and lowering the render cost (render scale 80%, halved transmission resolution, and in the aggressive variant SSAO and depth of field off). It took the frame from 8.74 ms to 5.9 ms, but the owner saw the picture soften and the aggressive variant additionally erased the album covers, so the default is the original preset again and the `performance` preset is back to its upstream definition. A quality revision marker (6) moves a stored `performance` back to `original` once.
- Kept from that work because it costs nothing visually: `CoverAtlas.repaintAll()`, called by `ArchiveScene.setQuality()` after the render-quality pass. The atlas holds its painted tiles only on the GPU (they are copied with `copyTextureToTexture` and the CPU-side array stays empty), so any texture re-upload used to leave blank cards; it now repaints from the decoded images after a quality change.
- Recorded for a later attempt, because it needs the underlying bug understood rather than a preset tweak: turning SSAO and depth of field off makes the frosted glass render white and hides the artwork, and a full-quality frame costs 8.74 ms at 3440x1440 against a 6.94 ms budget for 144 fps, so 144 fps and full quality cannot both hold on this GPU. Both are written up in the handoff notes.
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.7.0-dev.12 (2026-10-14)

- Give the album's track list and the expanded synchronized-lyrics card one shared bottom line, so the two views stop moving when the owner switches between them. The scrolling region now hands over a row of its own height at its foot, and that band stays free — it is where the transport controls are meant to move later. The lyrics panel's bottom is that same edge, and both sides are derived from one measured value, so the list's visible area and the card's visible area no longer change with the album's track count.
- `--track-reserve` holds the handed-over row. It is measured, never written down, because the row height steps with the viewport (52px at 1440x900, 66px at 1920x1080): the space available to the list is measured from the first track row's own top to the credits footer's top, one whole row plus whatever slice of a row the scroller was cutting through is reserved, and the cut therefore lands on a row's bottom rule instead of through its text. Measuring against the scroller's current bottom instead fed the reserve back into its own measurement (measured: it settled between 0 and 7px and the list kept cutting a row in half). A list too short to reach the band gives up the row's height only, and a window too short to hold two whole rows keeps its list.
- `.album-detail-scroll`'s bottom margin adds the reserve to the credits block's height and overhang; `syncLyricsPanelAlignment()` derives the panel bottom as the credits footer's top edge less the reserve, so the scroller's box and the card's box agree by construction rather than by a second measurement.
- The measurement is re-taken when the detail pane finishes entering: `SurfaceTransition.show()` gained the completion callback its `hide()` already had, and `showMenu` passes the panel sync. The render that builds the pane runs while the pane is still hidden, so that sync measured nothing, and nothing re-ran it afterwards — the alignment stayed at the stylesheet default until a resize. The same hook corrects the panel's top line on first entry (measured: `--lyrics-top` used to sit at the 170px default instead of the album title's measured 183px).
- Measured in a real browser before and after, with the longest track list in the sample library (32 rows) and a short one (3 rows), at three viewports: at 1440x900 the reserve is 79px and the shared line y701 (the list drops 4 whole rows to 3); at 1920x1080, 73px and y887 (5 to 4); at 2560x1440, 103px and y1217 (10 to 9). The lyrics card's bottom edge on a short list moves down to the shared line as the owner asked (820.6 -> 887 at 1920x1080, 820.6 -> 1217 at 2560x1440), and on a full list it comes up to it (1005 -> 887, 1365 -> 1217), because it used to hang up to 45px past the list and into the credits band. The card's bottom edge and the list's visible bottom are byte-identical in every measurement.
- Verification: `npm run build`; the library, introduction, lyric, quality and viewport stages of `npm run check:music` pass, and so do the player, motion, camera, lighting, presentation, model and version checks run individually afterwards, because `check-music-scene.mjs` still aborts at the pre-existing cover-atlas canvas failure recorded for dev.56-dev.58 (its source assertions, including four new ones for this line, run before that abort and pass). Geometry was measured in a real browser at three viewports on two albums, before and after, and a screenshot of the album page confirms the reserved band is empty and the credits block is untouched.
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.7.0-dev.13 (2026-10-14)

- Put the album detail pane's first text line on one line with the "← 返回专辑架" link, so the two corners of that row read as one row instead of the right-hand one hanging 41-66px lower. The column's top edge now sits 5px below the link's own top edge — half the difference between the two rows' heights (22px for the link, whose ESC chip is 19px, against 12px for the overline) — which puts the two lines of *text* on one line rather than their boxes. Measured in a real browser at four viewports (1024x768, 1440x900, 1920x1080, 2560x1440): the two row centres agree to 0.00px at every one of them, where they were 36-61px apart before.
- `--detail-top-line` holds that shared line (112/144/91/87px per breakpoint) and both `.music-back`'s `top` and `--detail-content-top` read it, the latter as `calc(var(--detail-top-line) + 5px)`, so the link and the column can never drift apart again. The per-breakpoint overrides now name the stage as `#stage.music-app`: written as a bare `.music-app` they lost to the base declaration of the same property on `#stage.music-app` (1-1-0 against 0-1-0), which CDP's matched styles confirmed — the stage had stayed at 170px at every breakpoint while `.music-detail` stepped to 210/132. The lyrics panel's stylesheet fallback for `--lyrics-top` reads that variable, so it had been reading an unstepped value; it is measured from the album title at runtime, which is why nothing visible changed, and it now reads the stepped value too. Portrait is deliberately untouched: that layout puts the column at 50% and the link at 118px.
- Consequences, measured rather than assumed: the album title moves up 53-61px (200 -> 147 at 1440x900) and the lyrics card's top follows it (`--lyrics-top` 183 -> 130 there), the credits block does not move at all (780/960/1320 in the three desktop test viewports), the taller column gives the track list one more visible row at the larger steps (4 -> 5 at 1920x1080), and dev.12's reserved row still lands the cut on a row boundary: the shared line moved by 1px at 1440x900 (701 -> 700) and by 5px at 1920x1080 and 2560x1440 (887 -> 892, 1217 -> 1222), with the list's visible bottom and the lyrics card's bottom edge still byte-identical at every measurement.
- The card is not shown on the archive page at all — the owner asked for hidden rather than the collapsed strip that the first attempt left there. It stands in for the album column, and the archive page has no such column; shown there it drew over the archive text (measured at 1440x900: 430px of vertical and 402px of horizontal overlap with the callout block). `syncLyricsPanel()` hides it while `stage.dataset.mode` is `archive` and shows it again on the album page, where the "appears" re-measure below puts it right. The stored collapse preference is untouched, so the card comes back in whichever state the viewer left it.
- The card's content now sits on the album column's own left edge. The panel keeps a 1px transparent border as a geometry spacer, and that border also pushed the card's content 1px right of the album's text — measured: song block 749.8 against album title 748.8 at 1440x900, and the same 1px at 1920x1080, which the eye reads on a 35px title line. `.lyrics-band` and `.lyrics-panel-body` take a `-1px` left margin for exactly that pixel; the panel's right edge, which rides the scrollbar line, is untouched. Measured after: the song title, the song artist and the first lyric line all at 748.8, i.e. 0.00px from the album title.
- Centred lyrics take the song block with them: with `data-lyrics-align="center"` the title and artist centre on the card (and their text centres) instead of staying on the left while the lines move to the middle. Measured: the block's centre against the band's centre differs by 0.01px. Only the song block moves — the collapsed card is right-aligned by its band, and this block is hidden in that state.
- The card's song block now carries the album column's own type sizes, and its computed style is identical to the album block's in every property: the song title takes `clamp(24px, 2.45vw, 39px)` — the album title rule that actually wins, since `#album-detail-content .album-detail-body > h1` is declared twice and the second declaration is the effective one — and the artist 14px, 17px at 1700 and wider, 12px below 700, **in the album's ink colour rather than the muted one**. Measured at 1440x900: 35.28px/35.28px for the two titles and 14px/14px for the two artists, same colour, weight, letter spacing and line height, with the two boxes at the same top and height; at 1920x1080, 39px/39px and 17px/17px. (Mirroring the superseded 2.5vw rule was what made the song title read a shade larger than the album title, and `--muted` on the artist was what made it read lighter than the album's.)
- The card is measured again on the frame it first appears. Hidden, its band has no box, so the alignment that `loadLyrics()` runs found nothing measurable and the rule and the lyric list kept the previous values until some later render — measured: on the first expansion the rule sat through the middle of the song block, and only an album switch put it right. `syncLyricsPanel()` now re-measures when the panel goes from hidden to shown, and the first expansion lands at -0.03px with the list at rule + 2px, unchanged 2.5s later.
- The card's own rule — the band's bottom border — is placed on the album column's rule, the top border of its facts block, by measuring that distance and handing the band the same value as a minimum height (in `border-box`, since the number is a distance between two box edges). Measured: -0.03px at 1440x900 and 0.42px at 1920x1080, with two screenshots of the same strip showing the rule at one height in both states. The lyric text area loses that 42-51px; the panel's own bottom is unchanged, so the list and the card still share one line.
- A song or artist name wider than its line slides across instead of wrapping: a second line would push the rule off the album's rule, which is the whole point of the sizes above. The overflow is measured (never guessed), the distance travelled is the text plus a 40px gap, the speed 36px/s, and a second copy of the text is what makes the loop seamless. A viewer who asked for reduced motion keeps the static ellipsis, and a line that fits stays still. Verified in a real browser by narrowing the line to 90px: two copies, a 195px shift and a 5.42s cycle, and removing the narrowing tore it back down to the single line.
- An untagged single file is its own album, and its album title now comes from the file's own **title tag** rather than from a stored fallback that was just its file name — which is what made the album page read "long-name-slide-test" while the track list read the real, much longer name. The grouping is untouched: such entries are already keyed by track id (`single:trackId`), so nothing is merged or split by this, and every album that carries an album tag keeps the title it had. Measured with the app's own scanner on the test fixture: the album title is now the title tag. `check-music-library` still passes 14/14.
- The sliding names were scoped too widely: the two line rules matched the **copies** inside a sliding line as well as the lines themselves, so every copy took the artist's `font-size: 14px` and the line's `max-width: 100%` with `text-overflow: ellipsis`. That is why the song title came out the same size as the artist, and why a third of a long name was hidden behind "…" while it travelled. The line rules are now `> strong` / `> span`, and each copy keeps its own width (`max-width: none; overflow: visible; text-overflow: clip`), inheriting the type size of the line it belongs to. Measured in the forced-slide state at 1920x1080: both copies 168px of visible width against 168px of text, i.e. nothing clipped, both at 39px, with the artist line at 17px.
- The album page's own title takes the same treatment: one line, sliding when too long, instead of wrapping. Wrapping pushed the album's rule down and, with a very long name, ran the title down over the lyrics card (it is the same rule the card's own rule is aligned to). Its artist line does too, wrapped in a span of its own so the offline badge is not part of the sliding text. Measured with a long name injected at 1440x900: the title stays one line high (43px), and the album rule stays at 241.03 against the card's rule at 241, i.e. -0.03px, with both copies sliding; the artist line keeps its normal height.
- The archive page is deliberately left exactly as it was. Its title is laid out by the per-character reel machinery (one reel per line, type fitted to the space) and its artist is wrapped into spans by the text-motion machinery, so a horizontal line does not fit either — and sliding the artist there showed one stale artist on every album (the first pass cached the text and the text-motion machinery replaced the copies underneath it). The owner chose to keep that page untouched, which also removed the bug.
- Centred lyrics: the song block's width cap now drops the collapse toggle's 200px from BOTH sides (`max-width: max(140px, calc(100% - 400px))`). Centred with the old one-sided cap, a long name reached straight under the toggle's own label (measured after: the block's right edge 1144.8 against the toggle's left 1237.6, i.e. clear).
- The desktop launcher opens as a centred window instead of maximized, sized from the display and always 16:9: about 80% of the working area's height, never taller than 1920x1080's, and squeezed by the width on a narrow screen, so it is neither a fullscreen window on a 1920x1080 display nor bigger than the screen. Starting maximized also made the first restore fall back to Windows' own default bounds — the top-left corner — so the window had to be dragged back by hand; a normal window at this size is the bounds Windows restores to after a maximize.
- Verification: `npm run build`; the library, introduction, lyric, quality and viewport stages of `npm run check:music` pass, as do the player, motion, camera, lighting, presentation, model and version checks; `check-music-scene.mjs` still aborts at the pre-existing cover-atlas canvas failure recorded for dev.56-dev.58, after its source assertions pass. Geometry measured in a real browser at four viewports before and after, plus screenshots of the album page, of the aligned row and of the rule in both states, the sliding names measured in the forced-slide state, and the test fixture scanned with the app's own library scanner.
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.7.0-dev.14 (2026-10-14)

- Move the transport into the row the track list gives up under itself, and make the 歌词 button the card's one switch. The top bar's group — the current track, the lyric status, the 歌词 button, play/pause and stop — now sits centred in that reserved band, on the album page only: browsing the archive has no album column and the detail section is hidden there, so the row is simply not drawn. The result is the layout the owner asked for: content above, controls below.
  - The row lives in `#music-detail`, not in `#album-detail-content`: that element's content is rebuilt with `innerHTML` for every album, which would throw away the listeners on the player buttons. It is a `.detail-transport` sibling of `.music-back` and the column.
  - Its box is measured: `--transport-left/right/bottom` come from the column's own rect and the credits line it sits above, and its height IS `--track-reserve`, so the row, the reservation and dev.12's shared bottom line cannot disagree. Measured at 1440x900: the row's top 700 and bottom 780 against the list's visible bottom 700 and the credits top 780, centred within 0.1px of the column's centre.
  - Collapsed now means CLOSED: `panelElement.hidden = !hasLyrics || collapsed || archive`. Expanding and closing is therefore the switch between the album page and the lyrics page (measured: `data-lyrics-playing` goes false and the album column's visibility returns), with nothing of the card drawn over the title and artist.
  - The 歌词 button was `openLyrics.hidden = status.hidden`, i.e. visible only when the file had NO lyrics, and pressing it did nothing (it only asked for an expansion that the no-lyrics state suppressed). It is now `!transportActive`: on screen for as long as a track is loaded, and it toggles the card.
  - The card's own 收起歌词 button is gone — its job belongs to the transport row now — while the size `A－/A＋` and alignment `⇤` controls stay. `case "lyrics-toggle"` and its styles are unreachable now and are left for a later cleanup.
  - Portrait and the narrow docked layout are deliberately untouched (`.detail-transport` stands down there); the owner is having that layout looked at separately.
  - Follow-ups the owner asked for after trying it, all in this same version: the control row's buttons needed the base `.minimal-transport` styles (without them the play button's absolutely-positioned glyphs left it near 0x0, so it could not be clicked, and stop had no button box); the 词 button is the card's one switch and holds the hover colour while the card is on screen, taking that state from the card itself rather than from the stored preference; the status line moved above the row and the row became a `1fr/auto/1fr` grid so the PLAY button is the row's centre; the current track's name is hidden; the card now follows the TRACK'S LYRICS rather than the transport running (a stopped track can be read), while the stop button also closes it; and no focus ring is drawn anywhere until the first real key or click, because the boot sequence focuses its own buttons and Chromium rings a programmatic focus.
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.7.0-dev.15 (2026-10-15)

- **Polish batch on top of the reservation** (after the owner tried it): the transport row, the lyrics card, the measurements around them, and the transport band's new seek row. Each item was measured in a real browser and the owner verified the visible behaviour.
  - **Live resize**: the reservation, the shared bottom line and the transport row were re-measured on a 150ms debounce, so while the window was dragged they held values from different window heights — the list's visible bottom visibly jumped away from the control row and could sit over the credits. They are now taken once per frame AND from a ResizeObserver on the stage (which fires after layout, so the numbers match what is on screen).
  - **First paint**: the stylesheet's pre-measurement reservation was 0, so the first album opened showed the old layout for about half a second. It is now about two rows at the common sizes, so the first frame is already close.
  - **Short windows**: the reservation never eats the list's last whole row and never drops to zero (at zero the transport row had no band and its buttons spilled onto the credits line — measured on an 827x877 window).
  - **Entrance animation**: the transport row is a sibling of the column, so it only faded with the section while everything around it slid. It is now a second slide target of the SAME entrance call — same keyframes, same options, same frame (verified: identical `startTime` to 15 decimal places).
  - **Lyrics card transitions**: the card slides in from the right and back out the same way, with the entry's own duration, easing and distance (its exit used to be a shorter ease-in over a longer distance, which read as slower to start and barely moving). Closing now also reveals the album column as it starts, instead of after the animation — the blank half-second between the card leaving and the page returning is gone — and the close is guarded so the playing lyric clock cannot restart it forever. The no-lyrics status no longer flashes "暂无歌词" during the half second the .lrc lookup takes.
  - **Lyric lookup**: a memory cache plus a quiet prefetch of the opened album's tracks (bounded to 40, cancelled when the album changes), so pressing play shows lyrics at once.
  - **Clicking a lyric line**: the active line no longer flickers to the previous one. A seek is nudged 50ms past the line's timestamp, the clicked line is held as active while the player catches up, and that guard is released only when the AUDIO ELEMENT's own currentTime has reached it AND the line computed from the clock agrees (the player reports the target optimistically and then travels through everything in between; a pause/resume could flip it too). Clicking a line also centres at once — the manual-scroll deferral used to swallow clicks and hold the card off-centre for four seconds.
  - **"More tracks below" chevron**: shown only while the track list really has rows below its visible bottom (compared against the last row's own box, not the scroller's whole content, which includes the title, facts and tabs), hidden at the end of the list, drawn as a shape, bobbing gently, clear of the controls, with a click that scrolls one screen.
  - **Empty state**: with no track loaded the 词 button is disabled rather than looking broken.
  - **Alignment button**: fixed width, so toggling ⇤/☰ no longer shoves `A－`/`A＋` sideways.
- **The retired collapsed card is gone for good**: the lyrics card is only ever open or closed, so its elements, styles, the `--lyrics-collapsed-*` variables, the `data-lyrics-collapsed` attribute and the checks bound to them were all removed (CSS and TS references at zero). One rule that keyed on the retired attribute but was still doing work — the compact layout's lyric-list max-height — was re-keyed onto the panel being drawn, so its behaviour is unchanged.
- The track list gives up a SECOND row, so the transport row below it has room to grow into. The reservation is now two whole rows plus the slice of a row the scroller was cutting through, so the cut still lands on a row's bottom rule rather than through its text, and the list shows exactly one row fewer than it did. Measured in a real browser: the reserve goes 80 -> 132px at 1440x900, 68 -> 134px at 1920x1080 and 98 -> 164px at 2560x1440, with the visible rows going 4 -> 3, 5 -> 4 and 10 -> 9. dev.12's shared bottom line still holds: the list's visible bottom and the lyrics card's bottom edge are the same pixel (measured 648 / 826 / 1156, each equal to that window's height minus the reserve), and the credits block and the cover caption do not move.
- A window too short to hold three whole rows keeps its list: with fewer rows than that there is no row to give up without emptying it.
- Nothing else changed in this version: the transport row's contents and behaviour, the focus ring, the launch window and the lyrics card's type and alignment are all as dev.14 left them. Portrait and the narrow docked layout are still deliberately untouched.
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

- **Add the seek row to the transport band**, in the owner's vertical order: the "more tracks" chevron, then the seek row, then the status line, then the control row. The controls stay pinned to the foot of the band, so showing or hiding the row cannot move them.
  - The row is a real range input, so the played part, the thumb and the elapsed/total labels are one control: a 2px track with the played part in the accent colour, a thumb hidden until hover or keyboard focus, `mm:ss` labels at either end that switch to `h:mm:ss` past an hour, and a time bubble that tracks the pointer.
  - **A drag only previews.** While the pointer holds the thumb the slider is the source of truth and nothing is written back to it; the seek happens on release/commit, which is what keeps scrubbing from stuttering the audio. The elapsed label keeps the committed position until the seek lands, so the bubble shows the target while the label states where playback actually is.
  - With no duration to seek through the row stays on screen and is dimmed (`data-empty`), rather than hiding itself — see the always-visible note below; the affordances also drop their transitions under reduced motion.
  - Corrected while verifying: the bubble overhangs the track by 18–19px at either end, because it is centred on the pointer with `translateX(-50%)` while its position comes from the track's own ratio. The owner confirmed that reads fine, so the row keeps it.
  - Checks were added for the band's order, the drag semantics (`const shown = seekingDrag ? ...`, the guarded `if (!seekingDrag) range.value = ...`), the hide-when-unusable rule, the `h:mm:ss` branch, the styling contracts (hairline track, accent fill, thumb hidden at rest and shown on hover OR focus, the `data-empty` dim, reduced motion) and the `1fr auto 1fr` control grid that centres the play button on the row.
  - Verified in a real browser over CDP, reading the audio element's own `currentTime` (the element is made with `new Audio()` and never enters the DOM, so a page-init hook captured it): a click at the row's middle moved playback 1.22s → 114.13s; a drag to the left held the audio at 114.46s throughout and seeked to 32.90s on release; after the click the highlighted lyric matched the line computed independently from the LRC for that time; no page exceptions. **Keyboard ←/→ and Home/End were not confirmed**: a targeted attempt left the slider at 0 with the audio unplaying, so no claim is made here.
- **The seek row is now on screen from the moment an album opens.** It used to hide itself until a track with a known duration was loaded, so the band grew a row the moment playback started and the controls appeared to shift. The row is part of that band's layout, so an unusable (or not-yet-started) track dims it and blocks the drag instead of removing it: `00:00 / 00:00`, `data-empty="true"`, `disabled` on the slider, and it is stocked on entry to the detail view rather than waiting for the audio clock.
  - Measured before any track is chosen: the row is a real 718×22 box at its usual place in the band, `display: flex`, not hidden, slider `disabled` with `max` 0, labels reading `00:00 / 00:00`, slider opacity 0.4 and `cursor: default`. No page exceptions.
  - Hovering the empty row no longer raises a `00:00` bubble over a dead slider. The JS guard that fills the bubble cannot suppress it on its own — the bubble's visibility belongs to the `.detail-seek-field:hover` rule — so the empty state carries its own rule to keep it down.
  - Checks were updated rather than added blindly: the old "the row must hide itself when there is no duration" assertion is gone, replaced by ones for the shipped-visible markup, the dim-instead-of-remove rule, the real `disabled`, the absence of `row.hidden = !usable`, the detail-entry stocking call, and both halves of the bubble suppression.
- **Packaged once, as dev.15.** The packager assigns a fresh sequence on every run, and two intermediate assemblies of this batch were allocated their own numbers; both were removed and the state rolled back each time, so the batch ships as a single dev.15 and the outputs stay 14 → 15. The runtime payload cache `%LOCALAPPDATA%\Rhine Music\app-v<version>` has to be removed alongside the artifact: the launcher reuses an extracted payload whenever its marker and six key files are present and never compares contents, so a rebuilt executable would otherwise keep serving the old page.
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.

## 0.7.0-dev.16 (2026-10-17)

- **The transport bar is rebuilt to the owner's NetEase layout**, in one left → centre → right pass: `song · artist → ♥ → comments → play mode` on the left, `previous / play / next` in the centre, `queue → format → add to playlist → 词 → volume → …more` on the right.
  - **Both ends align with the seek row's content bounds**, not with a container box. Two things had to be fixed to get there: `space-between` refused to hug the edges on this container (the sides use `margin: auto` instead), and the container's `gap` left one 8px strip on *each* side of the absolutely-positioned centre group (the gap is gone).
  - **"Button edge" is not "visible edge"**: the rightmost `…` glyph sits 6.5px inside its 29px box, so it takes a negative margin of its own to bring the *dots* to the boundary rather than the button.
  - The play button stays horizontally centred at `left: 50%` with a translate (deviation 0 across five widths), and the whole control group is centred vertically between the track list's bottom and the credits — it read ~20px low before.
  - Verified at 1920/1600/1400/1200/1100: no wrapping, no clipping, play button not offset.
- **The track · artist block returns to the left end** of the transport bar (two lines, title larger, ellipsis with a `title` fallback, hidden outright when nothing is loaded). It had been removed in dev.14 when the row could not fit it; the new layout has room.
- **The track list's row number becomes the list position** (`01, 02, 03…`), and a separate **原编号** column shows what the track really is in its album (`编号：06` / `编号：未知`).
  - Row number had to stop using `trackNumber` because the same song in two formats carried the same label, so the list printed **two rows starting `06`**, while albums with no tags left the column blank. Position is unique and always present.
  - Ordering is unchanged: the server still sorts by `disc`/`track` and keeps untagged tracks last, so "sort by original number, display the row number" is no longer ambiguous.
- **Playback fixes**, all four found by the owner in use:
  - **`previous` now steps back immediately.** The old "3 seconds in → restart the track" rule meant clicking it several times before anything changed; it is gone. At the head of the queue it restarts the track, and that path has to call `seek(0)` rather than set `pendingSeek`, because `play()`'s resume branch never seeks (measured: the UI went to 0 while the element stayed at 61s).
  - **`next` works under 单曲循环.** Single-track repeat is about *automatic* advance only; it no longer swallows a manual skip (automatic end-of-track still obeys the mode — both halves verified).
  - **Play-mode switching no longer dies while playing.** The sync wrote `modeButton.innerHTML` unconditionally, and `timeupdate` fires several times a second, so the `<svg>` under the pointer was destroyed and rebuilt constantly and clicks landed on nothing. It is written only when the mode actually changes (verified: six clicks while playing all take effect, innerHTML rebuilds == clicks).
- **听后感 (local listening notes) becomes the third right-column view** — album detail ↔ lyrics ↔ comments — instead of a modal.
  - It occupies the same region as the lyrics card and **ends on the track list's bottom edge**, so it never draws over the transport band (an earlier cut used the region's own bottom and reached 880px, over a band starting at 757).
  - Layout follows NetEase's comment page: song + artist and `全部评论 N` at the top, the comment list scrolling in the middle, the composer pinned at the bottom.
  - The two right-column panels are **mutually exclusive** through a single permission flag (`lyricsAllowed`). Driving exclusivity by having each panel call the other's sync function recursed to `RangeError: Maximum call stack size exceeded`, so neither sync function calls the other.
  - Closing on the way back to the album shelf and **restoring the panel on the way back in** both work; `setMode` re-reconciles the panels because it is the one place that knows which view is active.
  - Identity moved from a hash of the file path to `title|artist|album|duration`, so **moving or renaming a file no longer loses its notes**; existing data is migrated once at boot, and records whose track is not in the index are kept rather than dropped.
  - No community affordances: likes, replies and sharing need an account and a network, so each note only offers **delete** — consistent with this port's "no dead icons" rule.
- **Count badges** on the comments and heart icons: the note count for the current track, `1` for liked.
  - A zero count **hides the badge entirely** instead of printing `0`, so an unused icon stays a clean glyph; three digits and beyond collapse to `999+` as **truncated text**, not a glyph per number.
  - The badge is text absolutely positioned over the icon's top-right corner. Its offset was chosen by rendering four candidate values side by side and comparing them, because reading the numbers off the CSS kept landing it either above the icon or over the middle of the bubble.
- **The … menu is built out as structure only**: `下载 / 分享 / 一起听 / 播放倍速 ｜ 歌手 / 专辑 / 音效 / 购买单曲 ｜ 减少推荐`, every row disabled and saying **why** in its tooltip (needs an account or cloud vs. not built yet) rather than a single "coming soon" that conflates the two. Hover uses the active theme's accent.
- **Playlist naming and deletion use in-app dialogs** instead of `window.prompt` / `window.confirm`: native ones are browser-styled, sit outside this interface entirely, and block the whole page. The replacements autofocus and select the default name, submit on Enter, cancel on Escape or a backdrop click, refuse an empty name, and give the destructive action its own colour.
- **The retired lyrics "collapsed" state is deleted from the source**, not just hidden: a **persisted preference** was still taking part in the visibility decision, and once it had been set true it kept the lyrics panel shut across restarts — which is what the owner hit as "a song with lyrics does nothing when I click 词". The preference, its two helpers and a dead branch with no button behind it are all gone; visibility is now in-memory intent plus one decision point.
- **A note on the TDZ trap in this batch**, because it cost three rounds: `syncLyricsPanel` and `syncCommentsButton` are both reached by the player's subscribe callbacks **while the module is still evaluating**. Any `let` they read must be declared above them. Placing the comments state next to the functions was not early enough, and the resulting `ReferenceError` was especially misleading — it broke the player's state listener, so the album grid rendered **zero cards** and the symptom looked nothing like a panel bug. All of the panel state now sits at the top of the module beside `lyricJump`.
- Verification: `npm run build` clean, `check:version` clean, scene assertions **0 failures** (new ones pin the panel structure, the badge rules, the mutual-exclusion flag and the 999+ cut-off). Browser probes over CDP cover the transport layout and alignment, the vertical centring, row numbers and the 原编号 column, previous/next/auto-advance, play-mode clicking while playing, the full comments flow, badges including three digits, the … menu and theme-accented hover. `_verify/run-probes.mjs` reruns them all.
- Data and compatibility: the data directory and schema are unchanged (`music-data-v3`); the comments key change migrates automatically at boot and preserves orphaned records; the 原编号 column is display-only and changes no file; the music folders are still read-only in every path this version adds.
- **Double-click no longer resizes the window from the content area.** With the frameless title bar (dev.6, extended in dev.10) the "double-click to maximize" gesture was detected on the whole stage and only skipped buttons and inputs, so a double click on the album shelf, the credits line or the album detail column toggled the maximized state - reported by the owner as an easy mis-trigger. The gesture now requires the target to be inside `.music-header` or `#window-caption`, the two regions that already carry the window drag gesture; the content area does not react at all. Double-clicking the 6px window border still toggles the maximized state, which is the standard border behaviour and cannot be reached accidentally from inside the page. Verified by a probe that stubs `window.chrome.webview.postMessage` before the page script runs (the whole block sits behind `if (hostBridge)`, which is why an ordinary browser probe never saw this), with a control run against the old condition that fails all three content-area verdicts.
- **Under "按歌手名字", a collaboration album is filed under every artist who appears on it.** A duet used to collapse into a single artist string, so `林俊杰/周杰伦` became a column of its own and the album could be found under neither artist; each album now contributes one shelf entry per participating artist and shows up in both lists. Splitting is deliberately narrow: only the half-width slash separates names - `&` is never a separator because it is part of band names in this library (`Steve Aoki/林俊杰/Lucas & Steve` stays three artists, not four) - and sentinels that already mean "many people" (`多位艺人`, `未知艺术家`) are left whole.
  - Entries are expanded instead of reusing one index across lanes, because `fileLocation()` returns the first lane holding an index: a shared index makes "open from the second lane" jump back to the first. One entry per (album, artist) pair keeps every index unique, so the 3D layout, slot maths and arrow-key navigation are untouched.
  - The album card still prints the full original string, so an album opened from 周杰伦's column reads `周杰伦/蔡依林` and cannot be mistaken for a solo record.
  - Consequence, accepted by the owner: an artist who only ever features on one album gets a column holding that one album. In this library that is 39 of 52 columns, up from 35 of 43. The alternative - only giving a column to artists who have a solo album - was rejected because it means the program decides someone is not worth an entry while they are demonstrably in the library, and the column fills itself once their own work is added.
  - The bottom line keeps reporting unique albums (170) while the shelf holds 210 positions; the two numbers mean different things on purpose.
  - Verified on the real library: 林俊杰 47 albums and 周杰伦 45 (all 15 and 1 collaborations respectively), the twelve-artist `新年到` appears in twelve columns, no lane lists an album twice, every entry locates back into its own lane, and genre/album ordering still totals exactly 170 positions. A browser smoke test with `sortMode=artist` renders the archive without exceptions and lane switching works.
- **Packaged as dev.16, then re-packaged onto the same number.** `scripts/build-windows.ps1` runs `version.mjs --allocate-dev` unconditionally, so every packaging run takes the next sequence. The first run of this batch allocated dev.17 and produced `Rhine-Music-Desktop-0.7.0-dev.17.exe`; that artifact, its manifest and its README were deleted and the state rolled back to 0.7.0-dev.15 so the next allocation landed on dev.16, which is the number the tree, this entry and the tag carry. The stray `## 0.7.0-dev.17` heading the first run appended here was removed with it.
- **Song and effect volume default to 100%, and each volume row now prints its exact percentage.** The two sliders sat at 65% and 22%, so a slider at its maximum did not mean the loudest - the owner read the resting state as the ceiling. Both now start at 100% and are lowered by hand; the ambient BGM keeps its own 18%, because it is background sound that fades out before an album starts rather than programme material. Because preferences live in localStorage, changing a default only reaches a fresh install, so `volumeRevision` joins `qualityRevision` in the defaults and a one-time restart migration lifts values still exactly equal to the old defaults (0.65 / 0.65 / 0.22) to 100%, leaving every other stored value alone. Two stale fallbacks went with it: the mute-restore path fell back to 0.65 and `MusicPlayer`'s own default was 0.7. The rows also gained a right-aligned readout, because the thumb's position cannot distinguish 90% from 100% - the transport volume popover already printed a percentage and this brings the settings page to the same footing. The readout uses a fixed width with tabular numerals so "9%" -> "100%" does not shove the slider sideways mid-drag.
- **The window double-click fix was folded into dev.16 rather than taking a number of its own**, at the owner's request. Double-clicking anywhere that was not a button used to toggle the maximized state, because the pseudo-title-bar gesture added in dev.6 (and extended in dev.10) listened on the whole stage instead of the title bar; it now goes through `isTitleBar()`, which accepts only `.music-header` and `#window-caption`.
- **dev.16 has been re-packaged twice under the same number**, which needs care: `scripts/build-windows.ps1` calls `version.mjs --allocate-dev` unconditionally, and that run scans the output directories for collisions, so each rebuild starts by clearing the previous artifacts and rolling the state back to dev.15 before the packager re-allocates dev.16.
  - The first rebuild replaced the published asset while its download count was still **0**, so no copy of the unfixed build was ever in circulation.
  - The **runtime payload cache** must go with it: the launcher reuses `%LOCALAPPDATA%\Rhine Music\app-v<version>` whenever `.payload-ready` is present and never compares contents, so after the first rebuild the owner ran both the local executable and a fresh download and saw the old page. The packager now clears that folder itself and warns loudly if a running process holds it.
  - A closed window can leave the payload's own `node.exe` running (its music server survives the launcher on port 5175), and that orphan is what locks the cache directory; it has to be terminated before the folder can be removed.
- Package: `outputs/Rhine-Music-Desktop-0.7.0-dev.16.exe` (65.8 MB).
- SHA-256: `3950f6ee7f1ec3e8103c8433d60690fbbe4f83fb2fbc8fce266df270adf2e030`
- Windows desktop development package; 3840×2160 real-present 60 FPS acceptance is pending.
