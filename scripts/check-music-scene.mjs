import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { setMusicAlbums, records, archiveColumns, columnFiles, fileAtSlot, fileLocation } from '../src/data.ts';
import { fileAtCell, selectionCell, visibleCell, cellKey, LOOP_COLUMNS, LOOP_ROWS, wrap } from '../src/archive-loop.ts';
import { CoverAtlas, containCover } from '../src/cover-atlas.ts';

for (const genreCount of [1, 2, 7]) for (const albumCount of [1, 3, 40]) {
  const genres = Array.from({ length: genreCount }, (_, i) => ({ id: `g${i}`, name: `流派 ${i}` }));
  const albums = genres.flatMap((genre) => Array.from({ length: albumCount }, (_, i) => ({ id: `${genre.id}-${i}`, title: `${genre.name} / ${i}`, artist: '测试', genreId: genre.id, rawGenres: [], folder: '', tracks: [], producers: [], offline: false })));
  setMusicAlbums(albums, genres);
  assert.equal(archiveColumns.length, genreCount);
  for (let index = 0; index < records.length; index++) {
    const location = fileLocation(index);
    assert.equal(fileAtSlot(location.slot), index, 'slots must not collide for > 20 albums');
    assert.equal(fileAtCell(location), index);
    for (const direction of [-1, 1]) {
      const files = columnFiles(location.lane);
      const nextIndex = files[wrap(files.indexOf(index) + direction, files.length)];
      const next = selectionCell(nextIndex, location, { axis: 'row', direction });
      assert.equal(next.row - location.row, direction, 'boundary crossing preserves motion direction');
      assert.equal(fileAtCell(next), nextIndex);
      const nextLane = wrap(location.lane + direction, genreCount);
      const targetIndex = columnFiles(nextLane)[0];
      const laneCell = selectionCell(targetIndex, location, { axis: 'lane', direction });
      assert.equal(laneCell.lane - location.lane, direction);
      assert.equal(fileAtCell(laneCell), targetIndex);
    }
  }
  for (const center of [{ lane: -300.3, row: -111.2 }, { lane: 0, row: 12 }, { lane: 301.6, row: 10000.8 }]) {
    const cells = Array.from({ length: LOOP_COLUMNS * LOOP_ROWS }, (_, i) => visibleCell(i, center));
    assert.equal(new Set(cells.map(cellKey)).size, LOOP_COLUMNS * LOOP_ROWS);
    assert.ok(cells.every((cell) => Number.isFinite(cell.row) && records[fileAtCell(cell)]));
  }
}
setMusicAlbums([], []);
assert.equal(records.length, 0);
assert.equal(fileAtCell({ lane: -1, row: -1 }), -1);
assert.equal(fileAtSlot(12), -1);
assert.ok(Object.values(selectionCell(0, { lane: 0, row: 12 })).every(Number.isFinite));
const sceneSource = await readFile(new URL('../src/scene.ts', import.meta.url), 'utf8');
const atlasSource = await readFile(new URL('../src/cover-atlas.ts', import.meta.url), 'utf8');
const musicAppSource = await readFile(new URL('../src/music-app.ts', import.meta.url), 'utf8');
const musicStyleSource = await readFile(new URL('../src/music.css', import.meta.url), 'utf8');
const musicPlayerSource = await readFile(new URL('../src/music-player.ts', import.meta.url), 'utf8');
const themeSwitchSource = await readFile(new URL('../src/music-theme-switch.css', import.meta.url), 'utf8');
const librarySource = await readFile(new URL('../scripts/music-library.mjs', import.meta.url), 'utf8');
const musicServerSource = await readFile(new URL('../scripts/music-server.mjs', import.meta.url), 'utf8');
const commentsSource = await readFile(new URL('../scripts/comments.mjs', import.meta.url), 'utf8');
assert.ok(sceneSource.includes('this.light.shadow.camera.layers.enable(1)'), 'the shadow camera must include the shadow-only layer');
assert.ok(sceneSource.includes('shadowOnly.layers.set(1)'), 'off-camera casters must not enter the main camera layer');
assert.ok(sceneSource.includes('this.renderer.capabilities.maxTextureSize'), 'atlas pages must honor the active WebGL2 texture-size limit');
assert.ok(atlasSource.includes('new THREE.DataTexture'), 'cover atlas pages must use ordinary 2D textures');
assert.ok(atlasSource.includes('vMapUv = vMapUv * coverTile.zw + coverTile.xy'), 'each cover must map into its own 2D atlas cell');
assert.ok(atlasSource.includes('copyTextureToTexture'), 'cover updates must copy only the changed atlas cell to the GPU');
assert.ok(!atlasSource.includes('uniform highp sampler2DArray map'), 'cover shader must use Three.js standard 2D texture sampling');
assert.ok(musicAppSource.includes('if (!albums.length) $("#music-empty").hidden = false;'), 'the bundled demo-cover entry must remain visible when the local music service is unavailable');
assert.ok(musicAppSource.includes('id="music-lyrics-panel"'), 'synchronized lyrics must render in the persistent right-hand panel');
assert.ok(musicAppSource.includes('const hasLyrics = !!track && lyricLines.length > 0;'), 'the lyrics card follows the track\'s lyrics, not the transport: a stopped track with lyrics can be read');
// 歌词页的显隐由 syncLyricsPanel 统一裁决：有歌词 **且用户点了「词」** 且不在专辑架时才显示。
// 这个标志是**内存里的**，不是持久化偏好 —— 早先用持久化的 `lyricsCollapsed` 当开关，它一旦
// 被置为 true 就会永久挡住歌词页（重启也不恢复），主人遇到过"有歌词的歌、点了词没反应"。
// 那张卡也没有"收起态"了：要么是歌词页，要么不存在（相关样式已从源码删除）。
// `lyricsAllowed`：听后感面板打开时会把它置 false（两者占同一块区域，互斥）。断言里带上它，
// 否则"歌词面板会不会让位给评论面板"这件事就没被钉住 —— 而它曾经漏写，导致两个面板叠在一起。
assert.ok(/const shouldShow = hasLyrics && lyricsPanelRequested && lyricsAllowed && stage\.dataset\.mode !== "archive"/.test(musicAppSource) && musicAppSource.includes("lyricsPanelTransition.show("), 'the lyrics panel must show only with lyrics AND a request from the 词 button AND permission (the comments panel revokes it), and must hide itself by driving its own transition');
assert.ok(musicAppSource.includes('let lyricsPanelRequested = false;'), 'the lyrics toggle must be in-memory intent, not a persisted preference: a stored flag can strand the panel shut');
assert.ok(!musicAppSource.includes('lyricsCollapsed') || !/preferences\.lyricsCollapsed/.test(musicAppSource), 'the retired collapsed preference must not be read again — it is what stranded the panel');
// 注意断言的是**调用/定义形态**，不是名字本身：说明"已删除"的注释里会提到这两个名字。
assert.ok(!/function setLyricsCollapsed\s*\(/.test(musicAppSource) && !/function applyLyricsCollapsed\s*\(/.test(musicAppSource), 'the retired collapsed helpers must be gone, not merely hidden');
assert.ok(!/setLyricsCollapsed\s*\(!/.test(musicAppSource), 'nothing may still call the retired collapsed helper');
assert.ok(!musicAppSource.includes('"lyrics-toggle":'), 'the dead lyrics-toggle branch must be removed: no button dispatches it any more');
assert.ok(musicAppSource.includes('lyricsPanelRequested = !lyricsPanelRequested;'), 'the 词 button must flip the in-memory intent and re-sync, not touch the DOM directly (the transition owns `hidden`)');
assert.ok(musicAppSource.includes('openLyrics.setAttribute("aria-expanded", String(shouldShow));'), 'the 词 button must carry the CARD state, from the intended state, not a stored preference');
assert.ok(musicAppSource.includes('function centerLyricLine(snap: boolean) {'), 'scrolling lyrics must centre the active line inside its own container');
assert.ok(musicAppSource.includes('list.scrollTop = start + (target - start) * eased;'), 'the lyric follow must animate the list scroll itself so moves cannot stack');
assert.ok(musicAppSource.includes('function holdLyricFollow()'), 'a manual lyric scroll must be able to defer the automatic centring');
assert.ok(musicAppSource.includes('$("#lyric-list").addEventListener(event, holdLyricFollow, { passive: true });'), 'lyric scrolling must yield while the viewer scrolls the list themselves');
assert.ok(musicAppSource.includes('let lyricFollowUntil = 0;'), 'the follow deferral must be a single deadline, not a flag plus timer that can strand it');
assert.ok(musicAppSource.includes('player.playbackTime'), 'the lyric view must read the live audio clock');
assert.ok(musicAppSource.includes('activeLyric = -2'), 'rebuilding lyric rows must force the current line to be reapplied');
assert.ok(musicAppSource.includes('id="transport-lyric-status"'), 'missing LRC status must stay beside the current track title');
assert.ok(musicAppSource.includes('id="transport-lyrics-open"'), 'the lyrics panel must remain reachable when an LRC is missing');
assert.ok(musicAppSource.includes('active.getAnimations().forEach((animation) => animation.cancel())'), 'lyric line changes must cancel stale transitions');
assert.ok(musicAppSource.includes('window.matchMedia("(prefers-reduced-motion: reduce)").matches'), 'lyric transitions must honor the operating-system reduced-motion setting');
assert.ok(musicAppSource.includes('duration: 200, easing: "ease-out"'), 'lyric line animation must stay within the short transition budget');
assert.ok(musicAppSource.includes('active.setAttribute("aria-current", "true");'), 'the active lyric line must be marked for assistive technology');
assert.ok(musicAppSource.includes('row.textContent = line.text;'), 'lyric text must stay literal text and never become markup');
assert.ok(musicAppSource.includes("const jumpTime = lyricLines[index].time + 0.05;") && musicAppSource.includes("centerLyricLine(true);"), 'clicking a lyric line must nudge past its timestamp, mark it pending while the seek takes effect, and centre it at once');
// 歌词页的开合**不再跨会话保存**：它是一个视图状态（像专辑页/歌词页的切换），不是一个偏好。
// 早先保存它反而造成过故障 —— 存下的 true 会在下次启动时把歌词页永久挡住。
assert.ok(!musicAppSource.includes('preferences.lyricsCollapsed'), 'the lyrics-panel open state must NOT persist: a stored flag strands the panel shut across restarts');
assert.ok(!musicAppSource.includes('openPanel("lyrics")'), 'lyrics must no longer open as a modal panel');
assert.ok(!musicAppSource.includes('renderLyricsPanel'), 'the modal lyrics renderer must be gone now that the panel is persistent');
assert.ok(musicAppSource.includes('type Theme = "day" | "dusk" | "night"'), 'the tested dusk scene theme must be selectable in the app');
assert.ok(!musicAppSource.includes('music-lyric-previous'), 'the primary lyric view must not retain a third previous-line row');
assert.ok(!musicAppSource.includes('LIVE LYRICS'), 'the primary lyric view must not retain the large bilingual card heading');
assert.ok(!musicAppSource.includes('id="music-lyric-dock"'), 'the two-line lyric dock must be replaced by the scrolling panel');
// 旧「收起」按钮已随收起态一起退休：现在开合歌词页由控制栏的「词」按钮（case "lyrics-panel"）负责。
assert.ok(musicAppSource.includes('case "lyrics-panel":'), 'the 词 button must be the one that opens and closes the lyrics page');
assert.ok(!/\.music-app\[data-lyrics-playing="true"\]\[data-mode="detail"\] #album-detail-content\s*\{\s*visibility: hidden;/.test(musicStyleSource), 'the album column must not be hidden, or its credits and cover caption disappear with it');
assert.ok(!musicStyleSource.includes('box-shadow: 0 10px 34px rgb(0 0 0 / 0.07)'), 'the lyrics panel must not paint a card shadow: it is a transparent text layer over the page');
assert.ok(!musicStyleSource.includes('background: rgb(247 246 241 / 0.9)'), 'the lyrics panel must not paint an opaque background: the album page shows through it');
assert.ok(!musicStyleSource.includes('backdrop-filter: blur(12px)'), 'the lyrics panel must not blur the page behind it');
assert.ok(musicStyleSource.includes('border: 1px solid transparent'), 'the panel must keep a transparent border as a geometry spacer, so hiding its paint cannot shift the text inside it');
assert.ok(musicStyleSource.includes('scrollbar-width: none'), 'the lyric list must not reserve a scrollbar track, which would pull the lyric text short of the album text edge');
assert.ok(musicAppSource.includes('--lyrics-left-pad') && musicAppSource.includes('--lyrics-right-pad'), 'the panel horizontal insets must be measured from the album column at runtime, including its scrollbar allowance');
assert.ok(musicStyleSource.includes('--lyrics-left: 58%'), 'the lyrics panel must mirror the album column geometry');
assert.ok(!musicStyleSource.includes('.lyric-list::after'), 'the lyric list must not use head/tail spacers, which push the first lines out of view');
assert.ok(!musicStyleSource.includes('.music-lyric-dock'), 'the retired lyric dock must not leave layout rules behind');
assert.ok(musicStyleSource.includes('mask-image: linear-gradient('), 'the lyrics list must fade out at the panel edges');
assert.ok(musicStyleSource.includes("calc(clamp(15px, 1.05vw, 20px) * var(--lyrics-font-scale, 1))"), 'the lyric lines must keep the responsive clamp and the size factor; the retired collapsed card live line needed no check of its own');
assert.ok(musicStyleSource.includes('@media (max-width: 780px)'), 'compact windows need a documented fallback for the lyrics panel');
assert.ok(!musicStyleSource.includes('.music-app[data-lyrics-visible="true"][data-mode="detail"] #album-detail-content'), 'showing lyrics must not change the album column padding, which shifted the detail page content sideways');
assert.ok(musicStyleSource.includes('#album-detail-content .album-detail-body'), 'the lyrics panel must hide only the album block it covers, not the whole column');
// 双击最大化只认标题栏。dev.6 引入时把落点挂在**整个 stage** 上，于是双击界面任何空白处都会
// 最大化/还原（老板当作误触报了上来）。落点必须经过 isTitleBar —— 它只认 .music-header 与
// #window-caption，也就是已经挂了 drag 手势的那两块。
assert.ok(/const isTitleBar = \(target: EventTarget \| null\) =>[\s\S]{0,200}closest\("\.music-header, #window-caption"\)/.test(musicAppSource), 'double-click to maximize must be limited to the title-bar regions');
assert.ok(musicAppSource.includes('if (doubleClick && isTitleBar(event.target) && !isInteractive(event.target))'), 'the stage-wide double-click maximize must stay removed: it made dblclick anywhere resize the window');
assert.ok(/data-lyrics-playing="true"\][\s\S]{0,80}\.album-detail-body\s*\{[\s\S]{0,80}visibility: hidden;/.test(musicStyleSource), 'the covered album block must be hidden with visibility, not display:none, which pulled the credits up into the panel');
assert.ok(musicStyleSource.includes('.lyric-line.active'), 'the active lyric line must be visually distinguished');
assert.ok(musicStyleSource.includes('@media (prefers-reduced-motion: reduce)'), 'lyric styling must honor the operating-system reduced-motion setting');
// The panel's top is measured from the album title's own box and is only written
// when that box is real. Both boxes collapse to zero together while the detail
// pane is entering or the column is not laid out, and summing them then produced
// "0 + cached offset" — a plausible number no measurement could contradict, which
// parked the panel above the top of the window (measured: --lyrics-top -17px).
assert.ok(musicAppSource.includes('lyricsTitleTop = Math.round(albumTitle.getBoundingClientRect().top)'), 'the panel top must be measured from the album title box itself');
assert.ok(/if \(lyricsTitleTop !== null\) \{[\s\S]{0,160}setSharedGeometry\("--lyrics-top"/.test(musicAppSource), 'the panel top must only be written from a real measurement, never from an unlaid-out box');
assert.ok(!musicAppSource.includes('columnTop + lyricsTitleOffset'), 'the panel top must not add the title offset to the column position, which writes a wrong number while the column has no layout');
// The album text and the lyrics card must end on the same right edge whether or
// not the track list overflows. A scrollbar takes its width out of the content
// box, so the scroller reserves the gutter always and grows past the column by
// exactly that gutter; the column must not clip that overhang away.
assert.ok(musicStyleSource.includes('scrollbar-gutter: stable'), 'the scrolling region must reserve the scrollbar gutter always, so the album text keeps one width whether or not the list overflows');
assert.ok(musicStyleSource.includes('margin-right: calc(-1 * var(--detail-scrollbar))'), 'the scrolling region must overhang the column by exactly the scrollbar gutter: not overhanging left the album text short of the card edge, and overhanging further pushed it past');
assert.ok(musicStyleSource.includes('padding-right: 0;'), 'the scrolling region must not add a gutter of its own on top of the reserved scrollbar track');
assert.ok(/#album-detail-content\s*\{[\s\S]{0,400}overflow: visible/.test(musicStyleSource), 'the album column must not clip the scrolling region overhang, which hid the scrollbar entirely');
// The track list and the expanded lyrics card must end on ONE line, and that line
// has to be the list's own: the scroller gives up a row of its own height at its
// foot (the band the transport controls are meant to move into), and the panel
// reads the same edge. Both sides work from one measured value, so the visible
// area stops changing with the album's track count.
assert.ok(musicStyleSource.includes('var(--credits-h) + var(--credits-bottom) + var(--track-reserve'), 'the scrolling region must give up the reserved row-band under the track list');
assert.ok(musicAppSource.includes('stage.style.setProperty("--track-reserve"'), 'the reserved row must be measured from the track list at runtime, never written down: the row height steps with the viewport');
assert.ok(musicAppSource.includes('Math.floor(space / rowHeight)') && musicAppSource.includes('creditsTop - trackRows[0].top'), 'the reserved row must be read off the row grid anchored at the first row, never against the box bottom it is about to change, and never against the track list length');
assert.ok(musicAppSource.includes('creditsTop - (trackReserve ?? 0)'), 'the panel bottom must be the credits edge less the reserved row, so the list and the card share one line');
// Browsing the archive must not leave the expanded card drawn over the archive
// text: the card stands in for the album column, and the archive page has none
// (measured: 430px of overlap with the callout block). Browsing shows it collapsed
// without touching the stored preference, so returning to an album restores it.
// Browsing the archive must not have the card drawn over the archive text: the card
// stands in for the album column, and the archive page has none (measured: 430px of
// overlap with the callout block before this). It is hidden there and shown again on
// the album page, where it is re-measured as it appears.
assert.ok(musicAppSource.includes('stage.dataset.mode !== "archive"') && musicAppSource.includes("lyricsPanelTransition.hide("), 'the card must be hidden while the archive is showing, through the same transition that animates every other close');
// 歌词页的显隐只有一个裁决点：syncLyricsPanel。它同时负责启动时、换歌、进/退专辑架三处的对账，
// 所以这些路径不可能各自给出矛盾的状态（早先"收起态"另有一套写入路径，正是故障来源）。
assert.ok(musicAppSource.includes('function syncLyricsPanel()'), 'the lyrics page state must be decided in one place so every path agrees');
assert.ok(musicAppSource.includes("lyricsPanelTransition.show(preferences.reduced, syncLyricsPanelAlignment)"), 'the panel must re-measure when it appears: while hidden its band has no box, so the rule and the list would keep the old values');
// The lyrics card's song block carries the album column's own type sizes, and its
// rule is placed on the album column's rule by measuring the distance — a wrapped
// album title moves that rule, and a written-down height would miss it.
assert.ok(/\.lyrics-song-info > strong \{[\s\S]{0,340}clamp\(24px, 2\.45vw, 39px\)/.test(musicStyleSource), 'the song title must take the album title size — the album rule that actually wins, not the one it overrides');
assert.ok(/\.lyrics-song-info > span \{[\s\S]{0,320}font-size: 14px/.test(musicStyleSource), 'the song artist must take the album artist size');
// The line rules must not match the copies inside a sliding line: matched, every copy
// took the artist size and the ellipsis, and the song title came out the same size as
// the artist with a third of its name hidden behind "…".
assert.ok(/\.lyrics-song-info > strong,\s*\.lyrics-song-info > span,/.test(musicStyleSource), 'the line rules must be scoped to the lines themselves, not the sliding copies');
assert.ok(/\.lyrics-slide-copy \{[\s\S]{0,200}max-width: none/.test(musicStyleSource), 'a sliding copy must keep its natural width, or the name is clipped instead of shown');
assert.ok(musicStyleSource.includes('min-height: var(--lyrics-band-min'), 'the lyrics rule must be placed by a measured band height, in the expanded state only');
assert.ok(musicAppSource.includes('facts.getBoundingClientRect().top - band.getBoundingClientRect().top'), 'that height must be measured against the album facts rule, never written down');
// A name wider than its line slides instead of wrapping: a second line would push
// the rule off the album's rule, which is the whole point of the block above.
assert.ok(musicAppSource.includes('LYRIC_SLIDE_SPEED') || musicAppSource.includes('SLIDE_SPEED'), 'a name wider than its line must slide, and only then be measured for it');
assert.ok(musicStyleSource.includes('@keyframes lyrics-slide') && musicStyleSource.includes('.lyrics-slide-copy'), 'the slide needs its two copies to loop seamlessly');
assert.ok(musicStyleSource.includes('#album-detail-content .detail-artist-name'), 'the album page artist line must slide too, or a long artist name pushes the album rule down');
assert.ok(!musicAppSource.includes('.album-callout .selection-artist'), 'the archive page must be left untouched: its artist is wrapped into spans by the text-motion machinery, and sliding it showed one stale artist on every album');
assert.ok(musicStyleSource.includes('.album-detail-body > h1 .music-title-main'), 'the album page title must slide too, or a long album name pushes its rule down over the card');
assert.ok(/data-lyrics-align="center"\] \.lyrics-song-info[\s\S]{0,200}max-width: max\(140px, calc\(100% - 400px\)\)/.test(musicStyleSource), 'a centred song block must keep clear of the toggle on BOTH sides');
assert.ok(/prefers-reduced-motion[\s\S]{0,200}\.lyrics-slide-copy[\s\S]{0,80}animation: none/.test(musicStyleSource), 'the slide must stop for a viewer who asked for reduced motion');
// The panel's 1px spacer border must not put the card 1px off the album text's left
// edge, and centred lyrics must take the song block with them.
assert.ok(musicStyleSource.includes('margin-left: -1px'), 'the card content must be nudged back onto the album text left edge, cancelling the spacer border');
assert.ok(/data-lyrics-align="center"\] \.lyrics-song-info[\s\S]{0,160}translateX\(-50%\)/.test(musicStyleSource), 'centred lyrics must centre the song block too');
// The lyric size control scales the lines by MULTIPLYING the responsive clamp, and
// the rule must be scoped to the app: a lyric line is a `<button>`, and the app's
// own `.music-app button { font-size: inherit }` carries two classes, so a bare
// `.lyric-line` rule lost to it and the control did nothing at all.
assert.ok(musicStyleSource.includes("var(--lyrics-font-scale"), 'the lyric lines must be scaled by the stored size factor');
assert.ok(/\.music-app \.lyric-line \{[\s\S]{0,900}calc\(clamp\(15px, 1\.05vw, 20px\) \* var\(--lyrics-font-scale/.test(musicStyleSource), 'the size factor must multiply the responsive clamp, and be scoped to the app so it outranks the app-wide button font-size rule');
assert.ok(musicAppSource.includes("const LYRIC_SIZES = [1,"), 'the smallest lyric size must be the size the panel shipped with, which is why the list starts at 1');
assert.ok(musicAppSource.includes('id="lyrics-size-up"') && musicAppSource.includes('id="lyrics-size-down"'), 'the lyric size control must be reachable in the panel');
assert.ok(musicAppSource.includes("panel.style.setProperty(\"--lyrics-font-scale\""), 'the stored size must be applied as a custom property on the panel');
assert.ok(musicAppSource.includes("preferences.lyricsSize"), 'the lyric size choice must persist between sessions');
assert.ok(musicStyleSource.includes(".lyrics-band-controls"), 'the size buttons must share the toggle row, not add a row that would grow the collapsed card');
// Lyric alignment is state-driven: a data attribute on the panel, matched by the
// stylesheet, so a third mode is one rule rather than another branch in the render
// path. It must not touch the collapsed card, which is right-aligned by its band.
assert.ok(musicAppSource.includes('panel.dataset.lyricsAlign = mode'), 'the lyric alignment must be written to a data attribute on the panel');
assert.ok(musicAppSource.includes('const LYRIC_ALIGNS: LyricAlign[] = ["left", "center"]'), 'the lyric alignment modes must live in one list, so adding a mode is one entry');
assert.ok(musicAppSource.includes('id="lyrics-align-toggle"') && musicAppSource.includes('case "lyrics-align"'), 'the alignment control must be reachable in the panel');
assert.ok(musicAppSource.includes("preferences.lyricsAlign"), 'the alignment choice must persist between sessions');
assert.ok(/\.music-lyrics-panel\[data-lyrics-align="center"\] \.lyric-line/.test(musicStyleSource), 'centring must be scoped to the lyric lines so the collapsed card keeps its right alignment');
assert.ok(musicStyleSource.includes('transform-origin: center center'), 'the active line must re-anchor its transform when centred, or it grows to one side');
assert.ok(themeSwitchSource.includes('.music-app[data-theme="dusk"] .theme-switch::before'), 'the top theme selector must place its active pill on dusk');
assert.ok(themeSwitchSource.includes('translateX(calc(200% + 8px))'), 'the top theme selector must place its active pill on night');
// The seek row sits in the transport band, in the owner's order: chevron (below the list),
// then the seek row, then the status line, then the controls. The order is the point — the
// status line nearly touches the play button, so the free space is above it.
assert.ok(/id="track-more"[\s\S]*?class="detail-seek"[\s\S]*?id="transport-lyric-status"[\s\S]*?class="detail-transport-controls"/.test(musicAppSource), 'the band must be ordered chevron → seek row → status line → controls');
assert.ok(/document\.querySelector<HTMLElement>\("#detail-seek"\)/.test(musicAppSource), 'the seek row must be looked up by the id the markup gives it');
assert.ok(/id="detail-seek"[\s\S]{0,220}id="detail-seek-current"[\s\S]{0,220}type="range"[\s\S]{0,220}id="detail-seek-bubble"[\s\S]{0,220}id="detail-seek-total"/.test(musicAppSource), 'the seek row is elapsed label, slider, hover bubble, total label, in that order');
// The clock drives the slider, and while the pointer is on it the slider is the source of
// truth; a drag only PREVIEWS, so nothing is written back and the seek waits for release.
// That is what keeps scrubbing from stuttering the audio.
assert.ok(musicAppSource.includes('syncSeekRow(currentTime, playerState?.duration ?? 0);'), 'the audio clock must drive the seek row on every lyric sync');
assert.ok(musicAppSource.includes('const shown = seekingDrag ? Number(range.value) : Math.min(currentTime, duration);'), 'while dragging the slider must be the source of truth, not the audio clock');
assert.ok(musicAppSource.includes('if (!seekingDrag) range.value = String(shown);'), 'a drag must not write the clock back over the slider it is holding');
assert.ok(musicAppSource.includes('range.addEventListener("change", () => {') && musicAppSource.includes('player.seek(Number(range.value));'), 'the seek must happen on release/commit, not during the drag');
// The row is part of the band's layout, not something that appears once a track loads:
// it ships visible in the markup and an unusable (or not-yet-started) track dims it and
// blocks the drag instead of removing it. A row that arrived later read as the band
// rearranging itself.
assert.ok(/class="detail-seek" id="detail-seek">/.test(musicAppSource) && !/id="detail-seek" hidden/.test(musicAppSource), 'the seek row must ship visible: opening an album shows it, it does not wait for a track');
assert.ok(/row\.dataset\.empty = !usable \|\| \(currentTime <= 0 && !seekingDrag\) \? "true" : "false";/.test(musicAppSource), 'an unusable or not-yet-started row must be dimmed rather than removed');
assert.ok(musicAppSource.includes('range.disabled = !usable;'), 'with no duration the slider must actually be disabled, not just dimmed');
assert.ok(!musicAppSource.includes('row.hidden = !usable;'), 'the row must not hide itself when there is no duration: it is part of the layout');
assert.ok(/const usable = Number\.isFinite\(duration\) && duration > 0;/.test(musicAppSource), 'a zero or unknown duration must count as unusable, so the row cannot offer a live slider');
// Entering the album detail stocks the row, so it never needs a track to appear.
assert.ok(musicAppSource.includes('syncSeekRow(player.playbackTime, playerState?.duration ?? 0);'), 'entering the album detail must stock the seek row, so it is on screen before any track loads');
// Nothing to preview on a dead slider: no bubble over it.
assert.ok(/row\?\.dataset\.empty === "true"\) return;/.test(musicAppSource), 'the hover bubble must stay away while the row is empty');
// The bubble's visibility belongs to the hover rule, so the JS guard above cannot suppress
// it: the empty row needs its own rule or a dead slider raises a 00:00 bubble on hover.
assert.ok(/\.detail-seek\[data-empty="true"\] \.detail-seek-bubble \{[\s\S]{0,60}opacity: 0;/.test(musicStyleSource), 'an empty seek row must suppress the hover bubble, which its JS-side guard cannot do alone');
// The time text carries the hours branch; a track past an hour must not read "72:05".
assert.ok(musicAppSource.includes('return `${hours ? `${hours}:` : ""}${mm}:${String(rest).padStart(2, "0")}`;'), 'the elapsed and total labels must switch to h:mm:ss past an hour');
// Styling contracts: a 2px track with the played part in the accent colour, and a thumb that
// stays hidden until hover or focus so the band reads calm at rest.
assert.ok(/\.detail-seek \{[\s\S]{0,220}display: flex/.test(musicStyleSource), 'the seek row must lay its labels and track out on one line');
assert.ok(/\.detail-seek input\[type="range"\]::-webkit-slider-runnable-track \{[\s\S]{0,260}height: 2px/.test(musicStyleSource), 'the seek track must stay a hairline');
assert.ok(/var\(--accent\) var\(--seek-progress, 0%\)/.test(musicStyleSource), 'the played part of the track must be the accent colour, sized by --seek-progress');
assert.ok(/::-webkit-slider-thumb \{[\s\S]{0,300}opacity: 0;/.test(musicStyleSource), 'the thumb must be invisible at rest or the band never looks settled');
assert.ok(/\.detail-seek-field:hover input\[type="range"\]::-webkit-slider-thumb,[\s\S]{0,120}:focus-visible::-webkit-slider-thumb \{[\s\S]{0,60}opacity: 1;/.test(musicStyleSource), 'the thumb must appear on hover and on keyboard focus, never on hover alone');
assert.ok(/\.detail-seek\[data-empty="true"\] input\[type="range"\] \{[\s\S]{0,120}opacity: 0\.4;/.test(musicStyleSource), 'with nothing to seek through the row must read as unavailable rather than broken');
assert.ok(/prefers-reduced-motion[\s\S]{0,220}\.detail-seek[\s\S]{0,160}transition: none/.test(musicStyleSource), 'the seek affordances must drop their transitions for a viewer who asked for reduced motion');
// The control row is a flex row: a left group, the transport, a right group.
assert.ok(/\.detail-transport-controls \{[\s\S]{0,900}display: flex;/.test(musicStyleSource), 'the control row must lay its three groups out in one flex row');
// The play button must be the ROW's geometric centre, and it must be that by construction.
// The grid version this replaced was fragile twice over: a `1fr` track's minimum is `auto`,
// so a narrow window grew the tracks past the container and pushed the right group's tail
// onto a SECOND ROW (measured at 863px, and what the owner saw as a two-line bar); forcing
// it back with `grid-auto-flow: column` then collapsed the centre group's own `1fr auto 1fr`
// and left play 138px off-centre. `left: 50%` + `translateX(-50%)` cannot drift, because it
// is the row's centre by definition — so the sides absorb the squeeze instead, and the row
// must never wrap.
assert.ok(/\.detail-transport-controls > \.transport-main \{[\s\S]{0,160}position: absolute;[\s\S]{0,120}left: 50%;[\s\S]{0,80}transform: translateX\(-50%\);/.test(musicStyleSource), 'the centre group must be pinned to the row centre by geometry, not by track sizing');
assert.ok(musicStyleSource.includes('justify-content: space-between;'), 'the two side groups must take the ends, so the transport sits alone in the middle');
assert.ok(musicStyleSource.includes('position: relative;'), 'the row must be a positioning context for the centred transport');
assert.ok(!/\.detail-transport-controls \{[^}]*grid-template-columns/.test(musicStyleSource), 'the row must not go back to grid tracks: a 1fr minimum is auto, which wrapped the row');
// The two side groups carry the controls either side of the transport.
assert.ok(/class="transport-side transport-side-left"/.test(musicAppSource) && /class="transport-side transport-main"/.test(musicAppSource) && /class="transport-side transport-side-right"/.test(musicAppSource), 'the control row must be three groups: left side, transport, right side');
assert.ok(/transport-main"><button[^>]*id="track-prev"[\s\S]{0,400}id="play-pause"[\s\S]{0,400}id="track-next"/.test(musicAppSource), 'prev · play/pause · next must sit together in the centre group, in that order');
assert.ok(musicAppSource.includes('data-action="track-prev"') && musicAppSource.includes('data-action="track-next"'), 'the row must offer previous and next');
assert.ok(musicAppSource.includes('case "track-prev":') && musicAppSource.includes('case "track-next":'), 'previous and next must be wired to the player, not merely drawn');
assert.ok(musicAppSource.includes('data-action="queue" id="transport-queue"'), 'the right side must carry the queue button');
assert.ok(musicAppSource.includes('id="transport-format"'), 'the right side must carry the format label');
assert.ok(musicAppSource.includes('data-action="add-to-playlist" id="transport-add-playlist"'), 'the right side must carry add-to-playlist');
assert.ok(musicAppSource.includes('id="transport-volume-button"') && musicAppSource.includes('id="transport-volume" min=') && musicAppSource.indexOf('id="transport-volume-button"') < musicAppSource.indexOf('id="transport-volume" min='), 'volume must be a button that opens a slider — the agreed shape');
assert.ok(musicAppSource.includes('player.setVolume(preferences.volume);'), 'the volume sliders must drive the player through the stored preference, not a private value');
// Both volume controls in the app (the transport chip and the settings page) must write the
// SAME preference and remember the pre-mute level, or muting from one of them would restore a
// stale value set by the other. Counted rather than text-matched, so a renamed local such as
// `level` cannot silently satisfy the check.
const volumeWrites = (musicAppSource.match(/preferences\.volume = (?:Number\(el\.value\) \/ 100|level);/g) ?? []).length;
assert.ok(volumeWrites >= 2, `both volume sliders must write preferences.volume (found ${volumeWrites})`);
const beforeMuteWrites = (musicAppSource.match(/preferences\.volumeBeforeMute = (?:preferences\.volume|level);/g) ?? []).length;
assert.ok(beforeMuteWrites >= 2, `both volume sliders must remember the level for 取消静音 (found ${beforeMuteWrites})`);
assert.ok(musicAppSource.includes('function toggleVolumeMute()') && musicAppSource.includes('volumeBeforeMute'), '单clicking the speaker must toggle mute and restore the remembered level');
assert.ok(/\.transport-volume-popover \{[\s\S]{0,900}position: fixed;/.test(musicStyleSource), 'the volume chip must be out of flow (fixed), or opening it reflows the row and moves the centred play button');
// The chip opens on HOVER, as NetEase does, and closes when the pointer leaves — the owner
// asked for that explicitly, so the click handler is gone on purpose.
assert.ok(!musicAppSource.includes('data-action="volume"'), 'opening the volume chip must not depend on a click any more: it opens on hover');
assert.ok(/transportVolume\.addEventListener\("pointerenter"/.test(musicAppSource) && /transportVolumePanel\.addEventListener\("pointerenter"/.test(musicAppSource), 'both the speaker and the panel must keep the chip open, or the pointer cannot travel into it');
assert.ok(musicAppSource.includes('followVolumeButton') && musicAppSource.includes('requestAnimationFrame(followVolumeButton)'), 'the chip must follow the speaker while it is open: the control row slides a few pixels as the album column settles, so a single measurement lands it off centre');
// 收藏到歌单 is a REAL control: a menu anchored on the icon, and each row really writes to the
// playlist API. The menu must be out of flow (fixed) for the same reason as the volume chip —
// the transport band is `overflow: hidden`, so an absolutely-positioned menu would be clipped
// and its clipped part would not be hoverable or clickable.
assert.ok(!/data-action="add-to-playlist" id="transport-add-playlist"[^>]*title="即将支持"/.test(musicAppSource), '收藏到歌单 must no longer advertise itself as 即将支持');
assert.ok(musicAppSource.includes('data-action="add-to-playlist" id="transport-add-playlist"') && /id="transport-add-playlist"[^>]*aria-expanded="false"/.test(musicAppSource), 'the playlist button must carry aria-expanded, which is what the toggling and the styles read');
assert.ok(musicAppSource.includes('case "add-to-playlist":') && musicAppSource.includes('case "add-to-playlist-pick":') && musicAppSource.includes('case "add-to-playlist-new":'), 'the playlist menu needs all three actions: open, pick, and create');
assert.ok(/\.transport-menu \{[\s\S]{0,400}position: fixed;/.test(musicStyleSource), 'the playlist menu must be out of flow (fixed), or the transport band would clip it');
assert.ok(musicAppSource.includes('if (transportMenuOpen) return closeTransportMenu();'), 'Esc must close the menu before it closes the panel or leaves the detail page');
assert.ok(musicAppSource.includes('if (!inside && !onSwitch) closeTransportMenu();'), 'a click outside the menu must close it — including on non-button whitespace');
// The server SILENTLY ignores tracks already in a playlist (`if (known.has(id)) continue`), so a
// duplicate add returns { added: 0, skipped: 0 }. Reading only that return value reports "failed"
// for a track that is in fact already saved, so the client has to check the playlist contents.
assert.ok(musicAppSource.includes('alreadyIn') && /entry\.trackId === track\.id/.test(musicAppSource), 'a duplicate add must be recognised from the playlist contents, not from the all-zero server counts');
// 我喜欢的音乐 is a REAL control now. It is carried by a special playlist, which is what makes
// the liked songs available in the sidebar for free — and also what makes the guards necessary:
// renaming or deleting that playlist would silently destroy every like the user has.
assert.ok(!/data-action="like"[^>]*title="即将支持"/.test(musicAppSource), 'the heart must no longer advertise itself as 即将支持');
assert.ok(/data-action="like" id="transport-like"[^>]*aria-pressed="false"/.test(musicAppSource), 'the heart needs an id and aria-pressed for its state to be readable');
assert.ok(musicAppSource.includes('case "like":') && musicAppSource.includes('function toggleLike()'), 'the heart must be wired to a real toggle');
assert.ok(musicAppSource.includes('const LIKES_PLAYLIST_NAME = "我喜欢的音乐";'), 'the likes list must be a named constant, not a literal repeated at each use site');
assert.ok(/if \(target && isLikesPlaylist\(target\)\)/.test(musicAppSource), 'renaming the likes playlist must be refused: its name is how the heart finds it');
assert.ok(/if \(isLikesPlaylist\(playlist\)\) \{[\s\S]{0,160}不能删除/.test(musicAppSource), 'deleting the likes playlist must be refused: it would destroy every like with no undo');
assert.ok(musicAppSource.includes('playlist-protected'), 'the sidebar must say why the likes playlist has no rename/delete controls');
assert.ok(musicAppSource.includes('void refreshLikedTracks();'), 'the liked set must be loaded at startup, or the heart would be dark after a reload');
// A feature that does not exist yet must be visibly disabled with the reason in its tooltip:
// never clickable-but-dead. 更多 is the last unwired one — the heart, 收藏到歌单 and 听后感 have
// since become real controls, so they are asserted as such here and above.
assert.ok(!/data-action="like"[\s\S]{0,120}title="即将支持"/.test(musicAppSource), 'the heart works now: it must not still claim 即将支持');
assert.ok(!/data-action="comments"[\s\S]{0,120}title="即将支持"/.test(musicAppSource), 'the comments button works now: it must not still claim 即将支持');
// The control bar no longer contains any unwired button: 播放模式 / 上一首 / 播放 / 下一首 /
// 队列 / 音质 / 收藏到歌单 / 词 / 音量 / 更多 all do something, and the heart and 听后感 became
// real controls. What remains "not yet available" lives INSIDE the 更多 menu and is asserted there
// — so there is no clickable-but-dead control left to check for.
assert.ok(!/data-action="more"[\s\S]{0,120}title="即将支持"/.test(musicAppSource), '更多 works now: it must not still claim 即将支持');
// 听后感 is a REAL control: a panel that reads and writes per-track notes in the app's own data
// directory. It must NOT be stored next to the audio — the music roots are the user's own library
// (possibly read-only or synced), and lyrics are only ever READ from there, never written.
assert.ok(/data-action="comments" id="transport-comments"[^>]*aria-expanded="false"/.test(musicAppSource), 'the comments button needs an id and aria-expanded');
assert.ok(musicAppSource.includes('case "comments":') && musicAppSource.includes('function renderCommentsPanel()'), 'the comments button must open a real panel');
// 听后感是**第三个右列视图**（专辑详情 ↔ 歌词 ↔ 评论），不再是模态弹窗。
// 主人按网易云的评论页描述了排版，但明确"我们只占那个区域，不是整页"。
assert.ok(musicAppSource.includes('id="music-comments-panel"') && musicStyleSource.includes('.music-comments-panel {'), '听后感 must be a real right-column panel, not a modal');
assert.ok(!musicAppSource.includes('openPanel("comments")') && !/"comments" \| null/.test(musicAppSource), 'the old modal route for 听后感 must be gone, not left alongside the panel');
assert.ok(musicAppSource.includes('function syncCommentsView()'), 'the comments view needs its own single place to decide visibility');
assert.ok(musicAppSource.includes('lyricsAllowed'), 'the two right-column panels must be mutually exclusive: they occupy the same region');
assert.ok(musicStyleSource.includes('[data-comments-visible="true"] #album-detail-content'), 'the album column must stand down while the comments panel is up, or the panel would draw over the album title');
// 板面的**底边必须与曲目列表底边（也就是歌词面板的底边）一致**，不能伸到控制栏上。
// 主人指出过：我最初让它占"整块区域"，结果它压到了控制区（实测评论底 880，控制栏 757…880）。
assert.ok(musicStyleSource.includes('var(--detail-region-top') && musicStyleSource.includes('bottom: var(--lyrics-bottom'), 'the comments panel must take the region\'s left/top but the track list\'s bottom, so it never covers the transport band');
assert.ok(musicStyleSource.includes('.comments-compose') && musicStyleSource.includes('.comments-body'), 'the panel needs a scrolling body and a pinned compose area, like NetEase\'s');
// 角标：图标右上角叠**一段文本**，不是给每个数字准备图形（那要画到 999+）。
// 没有内容时整块隐藏 —— 主人的要求是"有的话显示条数，没有就是一个完整的气泡图标"。
assert.ok(musicAppSource.includes('id="transport-comments-badge"') && musicAppSource.includes('id="transport-like-badge"'), 'both the heart and the comments button need a count badge');
assert.ok(/function setTransportBadge\(/.test(musicAppSource) && musicAppSource.includes('badge.hidden = !shown'), 'a zero count must hide the badge entirely rather than print 0');
assert.ok(musicAppSource.includes('count > 999 ? "999+"'), 'long counts must collapse to 999+ instead of widening the badge without bound');
assert.ok(/\.transport-badge \{[\s\S]{0,700}position: absolute;/.test(musicStyleSource), 'the badge must be absolutely positioned over the icon, not a separate glyph');
assert.ok(musicAppSource.includes('/api/comments/${track.id}') && musicAppSource.includes('data-action="add-comment"') && musicAppSource.includes('data-action="delete-comment"'), 'the panel must read, add and delete comments through the API');
assert.ok(musicAppSource.includes('function syncCommentsButton()'), 'the comments button must follow the current track like the heart does');
// 听后感按**元数据标识**（歌名|歌手|专辑|时长）存，不按文件路径：曲目 id 是路径哈希
// （`track-${hash(file)}`），挪动文件就会变，评论会失联。标识必须由服务端算（它持有曲库索引），
// 客户端始终只传 trackId —— 这样路由和前端都不用改。迁移必须幂等，且**不静默丢弃**索引里
// 找不到的旧桶（用户可能只是暂时移除了那个目录）。
assert.ok(librarySource.includes('export const commentIdentity ='), 'the comment identity must be a pure function over metadata');
assert.ok(/commentIdentity =[\s\S]{0,400}join\('\|'\)/.test(librarySource), 'the identity must join its parts, so it cannot silently collapse two different songs');
assert.ok(/commentIdentity =[\s\S]{0,400}\.normalize\('NFKC'\)[\s\S]{0,200}\.toLowerCase\(\)/.test(librarySource), 'the identity must normalise case and width so a re-tagged file still matches');
assert.ok(!/commentIdentity =[\s\S]{0,400}\\p\{P\}/.test(librarySource), 'the identity must KEEP punctuation: stripping it would merge "Song (Live)" with "Song Live", and merging two songs is worse than losing the link');
assert.ok(musicServerSource.includes('commentIdentityOf(store, trackId)'), 'the server must inject the identity resolver, since only it holds the library index');
assert.ok(commentsSource.includes('async migrate()') && commentsSource.includes('identifyByBucket'), 'the store must migrate path-keyed buckets onto identity keys');
assert.ok(/if \(moved \|\| merged\) await this\.save\(\)/.test(commentsSource), 'the migration must only write when something actually moved');
assert.ok(/const buckets = Object\.keys\(this\.value\.tracks\)/.test(commentsSource), 'the migration must snapshot its keys first: adding and deleting keys while iterating them changes the enumerated set');
// 更多菜单：结构照网易云那一列先搭好，**每一项都如实置灰**（不是伪装可点）。
// 下载/分享/一起听/购买单曲/减少推荐需要账号与云端，本机播放器做不到；歌手/专辑/音效/
// 播放倍速是尚未开发。用 title 区分这两种原因，避免用"即将支持"暗示以后都会有。
assert.ok(musicAppSource.includes('case "more":') && musicAppSource.includes('function renderMoreMenu()'), '更多 must open a real menu');
assert.ok(musicAppSource.includes('id="transport-more"') && !/data-action="more"[\s\S]{0,120}disabled/.test(musicAppSource), '更多 must ship enabled: it opens a menu, the menu items are what is unavailable');
assert.ok(/\.transport-more-menu \{[\s\S]{0,200}min-width/.test(musicStyleSource), 'the more menu must be a real styled menu, not a bare list');
assert.ok(musicStyleSource.includes('.transport-more-item .transport-menu-name'), 'the more menu label must hug its icon: `.transport-menu-item` is space-between, so without this the items with no right-hand value push their text to the far edge');
assert.ok(musicAppSource.includes('transport-menu-group') && /\.transport-more-menu \.transport-menu-group \+ \.transport-menu-group/.test(musicStyleSource), 'the more menu must keep NetEase\'s grouped structure with dividers between groups');
for (const label of ["下载", "分享", "一起听", "播放倍速", "歌手", "专辑", "音效", "购买单曲", "减少推荐"]) {
  assert.ok(musicAppSource.includes(`label: "${label}"`), `the 更多 menu must keep the ${label} entry so the structure can be built on later`);
}
// 该贴左的贴左、该贴右的贴右。这条曾被写反（左组 flex-end、右组 flex-start），两组都往中间
// 挤，实测左右各差 138.7px —— 是主人用肉眼在截图里发现的，断言当时全绿。所以这里钉住两端：
// 左侧 flex-start、右侧 flex-end，并各用 margin:auto 兜住（容器的 space-between 在这个容器上
// 没有按预期分配，实测把它设成 space-between 与不设结果相同，而 margin:auto 确定有效）。
assert.ok(/\.transport-side-left \{[\s\S]{0,600}justify-content: flex-start;/.test(musicStyleSource), 'the left group must hug the left edge');
assert.ok(/\.transport-side-left \{[\s\S]{0,600}margin-right: auto;/.test(musicStyleSource), 'the left group must be pushed left by margin, not by the container\'s space-between');
assert.ok(/\.transport-side-right \{[\s\S]{0,600}justify-content: flex-end;/.test(musicStyleSource), 'the right group must hug the right edge');
assert.ok(/\.transport-side-right \{[\s\S]{0,600}margin-left: auto;/.test(musicStyleSource), 'the right group must be pushed right by margin, not by the container\'s space-between');
// 对齐的是**视觉元素**，不是按钮盒子。最右侧可见的是「更多」的图标本体，它在 29px 的按钮里
// 居中后离盒子右缘还差 6.5px —— 于是"按钮贴边了、圆点却没贴边"。这一条同样是主人肉眼发现的。
assert.ok(/#transport-more \{[\s\S]{0,200}margin-right: -6\.5px;/.test(musicStyleSource), 'the rightmost icon must be pulled onto the row edge; the button box hugging the edge is not enough because the icon is centred inside it');
// 两组之间不靠容器的 gap：那个 gap 会在**绝对定位的中央组**前后各留一份，实测两端各多缩 8px。
assert.ok(!/\.detail-transport-controls \{[\s\S]{0,900}gap:/.test(musicStyleSource), 'the controls row must not use gap: it also lands before/after the absolutely-positioned centre group and insets both ends');
// 单曲循环只该决定**自动续播**，不该限制用户手动切歌：主流播放器都是这样，主人也指出过
// （原先两者共用一个分支，单曲循环下点「下一首」毫无反应）。所以 advanceTrackId 必须能区分
// 「用户点的下一首」与「曲目自然播完」，手动切歌在队尾回绕。
assert.ok(/private advanceTrackId\(manual = false\)/.test(musicPlayerSource), 'advanceTrackId must distinguish a manual skip from the track ending by itself');
assert.ok(/if \(manual\) return queue\[index \+ 1\]\?\.id \?\? queue\[0\]\?\.id \?\? null;/.test(musicPlayerSource), 'a manual skip must move on (and wrap) in every play mode, including 单曲循环');
assert.ok(/const id = this\.advanceTrackId\(true\);/.test(musicPlayerSource), 'the 下一首 button must take the manual path');
assert.ok(/const nextId = this\.advanceTrackId\(\);/.test(musicPlayerSource), 'the natural end of a track must keep honouring 单曲循环');
// 上一首**直接切歌**，不因当前进度而"先回到开头"。原先是常见的 3 秒规则（播放超过 3 秒就先
// seek(0)），主人明确不要 —— 车载播放器也是直接切。断言的字符串故意不写出那个表达式，
// 否则会匹配到说明它的注释本身。
assert.ok(!/currentTime\s*>\s*3/.test(musicPlayerSource.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "")), 'the previous button must not replay the current track first: the 3-second rule made one click seek to 0 instead of switching');
assert.ok(/const track = this\.value\.queue\[Math\.max\(0, this\.value\.currentIndex - 1\)\];\s*\n\s*if \(!track\) return;/.test(musicPlayerSource), 'previous must switch tracks in one click, whatever the position');
// 队首按「上一首」＝重播本曲，而且必须走 seek(0)：play() 对同一首歌走 resume 分支，那个分支
// 不会调用 seek()，所以只写 pendingSeek 永远不会落到音频元素上（实测状态 currentTime 归零了、
// audio.currentTime 仍停在 61 秒）。
assert.ok(/if \(track\.id === this\.value\.currentTrack\?\.id\) \{\s*\n\s*\/\/[\s\S]{0,700}?this\.seek\(0\);\s*\n\s*return;/.test(musicPlayerSource), 'at the head of the queue, previous must replay the current track through seek(0)');
// 曲目列表的序号必须是**列表位置**（01,02,03… 唯一且连续），不能拿文件里的 trackNumber 当行号。
// 那个值表达的是"在原版专辑里的第几首"，混进列表会出三类问题：同一首歌的不同格式各带同一个编号
// （两行都写 06 —— 主人遇到的「十一月的萧邦」`枫` FLAC/WAV）、专辑只收录一部分时显示 05、
// 有标签与无标签混在一列。曲目**顺序**仍由服务端的 trackNumber 排序决定，丢的只是"把它当行号"。
assert.ok(musicAppSource.includes('const label = String(index + 1).padStart(2, "0");'), 'the track number column must be the list position, so it is always unique and sequential');
assert.ok(!musicAppSource.includes('String(t.trackNumber || index + 1)'), 'the track number must not fall back to the file tag: that mixes tag values and positions in one column');
// 行号之外还要给出**原专辑编号**：排序按原编号、显示用行号，只给一个会有歧义 ——
// 「枫」排在最前（行号 01）而它的原编号是 06。字面按主人要求写成「编号：06」/「编号：未知」
// （含全角冒号），不留空白（空白像渲染出错）。
assert.ok(musicAppSource.includes('class="track-original"'), 'each row must also show the tag number, so the sort order is explainable');
assert.ok(musicAppSource.includes('const originalText = `编号：${original}`;'), 'the tag number must be labelled 编号：… exactly as the owner asked, not a bare number');
assert.ok(/typeof t\.trackNumber === "number" && t\.trackNumber > 0/.test(musicAppSource) && musicAppSource.includes(': "未知";'), 'a missing tag number must read 未知 rather than blank');
assert.ok(/grid-template-columns: 23px minmax\(0, 1fr\) 40px 38px 72px;/.test(musicStyleSource), 'the row grid must size the fifth column for the longest label (编号：未知), or the row would overflow');
// 控制组（进度条 → 歌词状态 → 控制栏）在保留带内**垂直居中**，于是视觉上落在
// 「曲目列表底边 ↔ 制作人员顶边」的中间 —— 主人要求的"整体上移一点、更和谐"。
// 带子的底边与高度由 --transport-bottom / --track-reserve 在运行时算出，所以"带子里居中"
// 与"这两条线之间居中"是同一个意思。**只改对齐，不动带子的位置与高度**，因此列表可见区
// 与歌词卡的对齐都不受影响（这也是这条断言只钉 justify-content 的原因）。
assert.ok(/\.detail-transport \{[\s\S]{0,3000}?justify-content: center;/.test(musicStyleSource), 'the control group must be vertically centred inside the reserved band, not pinned to its bottom');
assert.ok(!/\.detail-transport \{[\s\S]{0,3000}?justify-content: flex-end;/.test(musicStyleSource), 'the control group must no longer be pinned to the band bottom');
// 播放模式按钮**只在模式真的变了时才写 DOM**。
// 原先是无条件 `modeButton.innerHTML = active.icon`：播放中 timeupdate 会高频触发状态同步，
// 指针下面的 <svg> 被不停销毁重建 → 点击常落在已被替换的元素上。主人报的现象正是
// "播放中点播放模式时灵时不灵，暂停后特别迅速"。同一个函数里音质那一格本来就有守卫，这里漏了。
assert.ok(/if \(modeButton\.dataset\.mode !== active\.mode\) \{/.test(musicAppSource), 'the play-mode button must only be rewritten when the mode actually changes: rewriting it on every playback sync destroys the glyph under the pointer and makes clicks miss');
assert.ok(!/if \(modeButton\) \{\s*\n\s*modeButton\.innerHTML = active\.icon;/.test(musicAppSource), 'the play-mode icon must not be re-assigned unconditionally');
assert.ok(musicAppSource.includes('data-action="play-mode" id="transport-play-mode" data-mode="list"'), 'the button needs its initial data-mode so the first sync can skip a redundant rewrite');
// 播放模式 is a REAL control now: enabled, cycling four modes, each with its own glyph.
assert.ok(/data-action="play-mode" id="transport-play-mode" data-mode="list" aria-label="播放模式：循环播放"/.test(musicAppSource), '播放模式 must ship enabled and announce its current mode');
assert.ok(!/data-action="play-mode"[^>]*disabled/.test(musicAppSource), '播放模式 must not be left disabled now that it works');
assert.ok(/const PLAY_MODES: \{ mode: PlayMode; label: string; icon: string \}\[\] = \[[\s\S]{0,400}"list"[\s\S]{0,200}"single"[\s\S]{0,200}"shuffle"[\s\S]{0,200}"sequential"/.test(musicAppSource), 'the four modes must live in one ordered list, in the order the button cycles them');
assert.ok(musicAppSource.includes('preferences.playMode = next.mode;') && musicAppSource.includes('player.setPlayMode(next.mode);') && musicAppSource.includes('savePrefs();'), 'cycling must reach the player and persist the choice');
assert.ok(musicAppSource.includes('player.setPlayMode(preferences.playMode);'), 'the restored mode must reach the player before anything advances');
assert.ok(musicPlayerSource.includes('private advanceTrackId(manual = false): string | null'), 'the player must own what "next" means, in one place, and be able to tell a manual skip from a natural end');
assert.ok(musicPlayerSource.includes('export type PlayMode = "list" | "single" | "shuffle" | "sequential";'), 'the modes must be one union type');
// The four glyphs must be four different shapes — 循环/单曲 used to be one icon, and the
// owner read the repeatable pair as a mix-up with the queue.
{
  const glyphs = ["repeat", "repeatOne", "shuffle", "sequential"].map((name) => {
    const match = musicAppSource.match(new RegExp(`${name}: svg\\('([^']+)'`));
    return { name, body: match ? match[1] : null };
  });
  assert.ok(glyphs.every((glyph) => glyph.body), 'all four play-mode icons must be defined');
  assert.equal(new Set(glyphs.map((glyph) => glyph.body)).size, 4, '循环 / 单曲循环 / 随机 / 顺序 must be four different icons');
  // Geometry is deliberately NOT re-derived here. Parsing path text to compute a drawn box
  // proved wrong three times in one session (arc sampling, relative-command arguments, path
  // attribute order), and a second implementation of the same maths only adds false alarms.
  // The real check is at runtime, where the browser does the maths:
  //   node _verify/css-diff/playmode-probe.mjs   → compares each icon's getBBox() for the
  //   same drawn weight and the same centre, and exits non-zero when they diverge.
  // What IS checked here is that every play-mode icon carries a generated normalising
  // transform, so nobody can quietly replace one with an untransformed glyph.
  for (const name of ["repeat", "repeatOne", "shuffle", "sequential"]) {
    const whole = musicAppSource.match(new RegExp(`${name}: svg\\('([^']+)'`))?.[1] ?? "";
    assert.ok(/^<g transform="translate\(-?[\d.]+ -?[\d.]+\) scale\([\d.]+\)">/.test(whole),
      `${name} must carry the normalising <g transform> the generator emits, or it will render at the wrong weight`);
  }
}
// The three list-ish controls must not share a glyph. 播放模式 and 播放队列 used to render the
// SAME icon and sit one group apart, which the owner read as a mix-up; play mode is now the
// circular repeat arrow (NetEase's shape) and add-to-playlist its own list-with-plus.
assert.ok(musicAppSource.includes('playlistAdd: svg(') && musicAppSource.includes('repeat: svg('), 'play mode and add-to-playlist each need their own icon');
assert.ok(/data-action="play-mode"[\s\S]{0,160}\$\{icons\.repeat\}/.test(musicAppSource), '播放模式 must draw the repeat arrow, not the queue list');
assert.ok(/data-action="add-to-playlist"[\s\S]{0,220}\$\{icons\.playlistAdd\}/.test(musicAppSource), '收藏到歌单 must draw its own list-with-plus');
{
  const glyphs = ["queue", "repeat", "playlistAdd"].map((name) => {
    const match = musicAppSource.match(new RegExp(`${name}: svg\\('([^']+)'`));
    return { name, body: match ? match[1] : null };
  });
  assert.ok(glyphs.every((glyph) => glyph.body), 'each of the three icons must be defined');
  assert.equal(new Set(glyphs.map((glyph) => glyph.body)).size, glyphs.length, '播放模式 / 播放队列 / 收藏到歌单 must be three different icons');
}
// 更多 is enabled because it opens a menu; what is unavailable lives inside that menu (asserted above).
assert.ok(/data-action="more" id="transport-more" aria-label="更多" aria-expanded="false"/.test(musicAppSource), '更多 must ship enabled with aria-expanded, since it opens a menu');
assert.ok(/\.detail-transport \.transport-icon-button:disabled \{[\s\S]{0,60}opacity: 0\.35;/.test(musicStyleSource), 'a disabled control must be visibly dimmed');
assert.ok(musicAppSource.includes('function syncTransportControls()'), 'the new controls must be stocked from one place on every player change');
// The control bar's left end shows 歌名·歌手 again, at the owner's request (its own screenshot of
// NetEase puts the track info there). What must STAY gone is the old rolling-title machinery: the
// `setupTransportTitle` module and its hidden button. The earlier note in DEVELOPMENT.md records
// why it was removed — it drove a button that no longer existed and would throw on a missing node.
assert.ok(!musicAppSource.includes('setupTransportTitle') && !musicAppSource.includes('music-transport-title'), 'the retired rolling-title module must stay deleted');
assert.ok(musicAppSource.includes('id="transport-track-title"') && musicAppSource.includes('id="transport-track-artist"') && musicAppSource.includes('function syncTransportTrack()'), 'the track name and artist must be a plain synced display, not a resurrected rolling button');
assert.ok(/\.transport-track \{[\s\S]{0,400}flex-direction: column;/.test(musicStyleSource), 'the track name block must stack title over artist');
const mainCamera = new THREE.PerspectiveCamera();
const shadowCamera = new THREE.OrthographicCamera();
shadowCamera.layers.enable(1);
const offCameraCaster = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
offCameraCaster.layers.set(1);
const visibleCaster = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
assert.equal(offCameraCaster.layers.test(mainCamera.layers), false, 'shadow-only casters must be culled from the main render');
assert.equal(offCameraCaster.layers.test(shadowCamera.layers), true, 'shadow-only casters must remain in the shadow render');
assert.equal(visibleCaster.layers.test(shadowCamera.layers), true, 'normal layer-0 casters must remain in the shadow render');
const atlasWrites = [[], []];
const atlasPages = atlasWrites.map((writes) => ({
  visible: true,
  count: 2,
  instanceMatrix: { needsUpdate: false },
  setMatrixAt(slot, matrix) { writes.push([slot, matrix.clone()]); },
}));
const atlas = Object.create(CoverAtlas.prototype);
const visibleCoverMatrix = new THREE.Matrix4().makeTranslation(2, 3, 4);
Object.assign(atlas, {
  arrays: atlasPages,
  instancesPerPage: 2,
  slotMatrices: Array.from({ length: 4 }, () => new THREE.Matrix4()),
  visibleSlots: new Uint8Array(4),
  hiddenMatrix: new THREE.Matrix4().makeScale(0, 0, 0),
});
atlas.hideArrayPages();
atlas.setVisibleMatrixAt(0, visibleCoverMatrix, true);
atlas.setVisibleMatrixAt(1, new THREE.Matrix4().makeTranslation(9, 9, 9), false);
atlas.setVisibleMatrixAt(2, new THREE.Matrix4().makeTranslation(8, 8, 8), false);
atlas.commitMatrices();
assert.equal(atlasPages[0].visible, true);
assert.equal(atlasPages[0].instanceMatrix.needsUpdate, true);
assert.deepEqual(atlasWrites[0].map(([slot]) => slot), [0, 1]);
assert.ok(atlasWrites[0][0][1].equals(visibleCoverMatrix));
assert.ok(atlasWrites[0][1][1].elements.slice(0, 15).every((value) => value === 0));
assert.equal(atlasWrites[0][1][1].elements[15], 1, 'off-camera cover slots in a visible page must use a zero-scale matrix');
assert.equal(atlasPages[1].visible, false);
assert.equal(atlasPages[1].instanceMatrix.needsUpdate, false);
assert.equal(atlasWrites[1].length, 0, 'off-camera atlas pages must not upload instance matrices');
let offscreenRecordLookups = 0;
const deferredAtlas = Object.create(CoverAtlas.prototype);
deferredAtlas.recordKey = () => { offscreenRecordLookups++; return ''; };
deferredAtlas.setSlot(0, undefined, false);
assert.equal(offscreenRecordLookups, 0, 'off-camera cover tiles must defer record lookup and atlas painting');
const pageUploadData = new Uint8Array(4 * 4 * 4);
let textureNeedsUpdate = false;
const mockTexture = { set needsUpdate(value) { textureNeedsUpdate = value; } };
const topDownPixels = new Uint8ClampedArray([
  255, 0, 0, 255, 0, 255, 0, 255,
  0, 0, 255, 255, 255, 255, 0, 255,
]);
const fakeCanvas = { getContext: () => ({ getImageData: () => ({ data: topDownPixels }) }) };
const tileUploadData = new Uint8Array(2 * 2 * 4);
const atlasUpload = Object.assign(Object.create(CoverAtlas.prototype), {
  tileWidth: 2, tileHeight: 2, pageColumns: 2, pageRows: 2,
  tileData: tileUploadData, renderer: undefined,
});
atlasUpload.writeCanvasData(fakeCanvas, tileUploadData, 2, 2);
atlasUpload.writePageTile({ data: pageUploadData, texture: mockTexture }, 1);
assert.equal(textureNeedsUpdate, true, 'a cover update must upload the atlas page when no renderer is supplied');
assert.ok(pageUploadData.slice(0, 8).every((value) => value === 0), 'other atlas cells must retain their data');
assert.deepEqual([...pageUploadData.slice(8, 16)], [
  0, 0, 255, 255, 255, 255, 0, 255,
], 'the first atlas row must contain the bottom canvas row');
assert.deepEqual([...pageUploadData.slice(24, 32)], [
  255, 0, 0, 255, 0, 255, 0, 255,
], 'the next atlas row must contain the top canvas row');

const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
const previousImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
const fakeCoverColors = new Map([
  ['cover:sun', [240, 36, 72, 255]],
  ['cover:night', [24, 78, 226, 255]],
  ['cover:mountain', [32, 204, 122, 255]],
]);
class FakeCanvasContext {
  pixel = [0, 0, 0, 0];
  setTransform() {}
  clearRect() { this.pixel = [0, 0, 0, 0]; }
  drawImage(image) {
    this.pixel = image.pixel ?? image.getContext('2d').pixel;
  }
  fillRect() { this.pixel = [120, 120, 120, 255]; }
  stroke() {}
  beginPath() {}
  arc() {}
  fillText() {}
  createImageData(width, height) { return { data: new Uint8ClampedArray(width * height * 4) }; }
  putImageData(image) { this.pixel = [...image.data.slice(0, 4)]; }
  getImageData(_x, _y, width, height) {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let index = 0; index < data.length; index += 4) data.set(this.pixel, index);
    return { data };
  }
}
class FakeCanvas {
  width = 0;
  height = 0;
  context = new FakeCanvasContext();
  getContext() { return this.context; }
}
class FakeImage {
  src = '';
  crossOrigin = '';
  naturalWidth = 8;
  naturalHeight = 8;
  pixel = [0, 0, 0, 0];
  async decode() { this.pixel = fakeCoverColors.get(this.src) ?? [0, 0, 0, 0]; }
}
Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: () => new FakeCanvas() } });
Object.defineProperty(globalThis, 'Image', { configurable: true, value: FakeImage });
try {
  const imageAtlas = new CoverAtlas(3, 512, 1);
  const imageRecords = [
    { id: 'album-sun', title: '日光留声', album: { coverUrl: 'cover:sun' } },
    { id: 'album-night', title: '夜间航线', album: { coverUrl: 'cover:night' } },
    { id: 'album-mountain', title: '远山来信', album: { coverUrl: 'cover:mountain' } },
  ];
  imageRecords.forEach((record, slot) => imageAtlas.setSlot(slot, record));
  await Promise.all(imageRecords.map((record) => imageAtlas.loadImage(record.album.coverUrl)));
  const coverDiagnostics = imageAtlas.diagnostics();
  assert.equal(coverDiagnostics.albums.length, 3);
  assert.ok(coverDiagnostics.albums.every((album) => album.imageStatus === 'decoded'));
  assert.equal(new Set(coverDiagnostics.albums.map((album) => album.layerHash)).size, 3, 'distinct decoded covers must occupy distinct atlas layer contents');
  assert.deepEqual(coverDiagnostics.albums.map((album) => [album.page, album.layer]), [[0, 0], [0, 1], [0, 2]], 'global slots must map to separate 2D atlas cells');
  imageAtlas.dispose();
} finally {
  if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
  else delete globalThis.document;
  if (previousImage) Object.defineProperty(globalThis, 'Image', previousImage);
  else delete globalThis.Image;
}
for (const [width, height] of [[1000, 1000], [600, 1000], [1200, 500]]) {
  const box = containCover(width, height, 1024, 768);
  assert.ok(Math.abs(box.width / box.height - width / height) < 1e-10);
  assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 1024 && box.y + box.height <= 768);
}
console.log('Music scene checks passed: 1/2/7 genres × 1/3/40 albums, independent atlas cells, cover orientation, empty library, uncropped image aspect ratios.');
