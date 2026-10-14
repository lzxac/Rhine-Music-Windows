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
const themeSwitchSource = await readFile(new URL('../src/music-theme-switch.css', import.meta.url), 'utf8');
assert.ok(sceneSource.includes('this.light.shadow.camera.layers.enable(1)'), 'the shadow camera must include the shadow-only layer');
assert.ok(sceneSource.includes('shadowOnly.layers.set(1)'), 'off-camera casters must not enter the main camera layer');
assert.ok(sceneSource.includes('this.renderer.capabilities.maxTextureSize'), 'atlas pages must honor the active WebGL2 texture-size limit');
assert.ok(atlasSource.includes('new THREE.DataTexture'), 'cover atlas pages must use ordinary 2D textures');
assert.ok(atlasSource.includes('vMapUv = vMapUv * coverTile.zw + coverTile.xy'), 'each cover must map into its own 2D atlas cell');
assert.ok(atlasSource.includes('copyTextureToTexture'), 'cover updates must copy only the changed atlas cell to the GPU');
assert.ok(!atlasSource.includes('uniform highp sampler2DArray map'), 'cover shader must use Three.js standard 2D texture sampling');
assert.ok(musicAppSource.includes('if (!albums.length) $("#music-empty").hidden = false;'), 'the bundled demo-cover entry must remain visible when the local music service is unavailable');
assert.ok(musicAppSource.includes('id="music-lyrics-panel"'), 'synchronized lyrics must render in the persistent right-hand panel');
assert.ok(musicAppSource.includes('const hasLyrics = transportActive && lyricLines.length > 0;'), 'the lyrics panel may only appear once a track with real lyric lines is playing');
assert.ok(/panelElement\.hidden = !hasLyrics/.test(musicAppSource), 'the lyrics panel must hide itself when the current track has no lyrics');
assert.ok(musicAppSource.includes('$("#lyrics-panel-body").hidden = collapsed;'), 'collapsing the lyrics panel must hide its scrolling body');
assert.ok(musicAppSource.includes('toggle.setAttribute("aria-expanded", String(!collapsed));'), 'the lyrics toggle must expose its expanded state to assistive technology');
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
assert.ok(musicAppSource.includes('if (Number.isInteger(index) && lyricLines[index]) player.seek(lyricLines[index].time);'), 'clicking a lyric line must seek to its timestamp');
assert.ok(musicAppSource.includes('preferences.lyricsCollapsed'), 'the collapsed lyric state must persist between sessions');
assert.ok(!musicAppSource.includes('openPanel("lyrics")'), 'lyrics must no longer open as a modal panel');
assert.ok(!musicAppSource.includes('renderLyricsPanel'), 'the modal lyrics renderer must be gone now that the panel is persistent');
assert.ok(musicAppSource.includes('type Theme = "day" | "dusk" | "night"'), 'the tested dusk scene theme must be selectable in the app');
assert.ok(!musicAppSource.includes('music-lyric-previous'), 'the primary lyric view must not retain a third previous-line row');
assert.ok(!musicAppSource.includes('LIVE LYRICS'), 'the primary lyric view must not retain the large bilingual card heading');
assert.ok(!musicAppSource.includes('id="music-lyric-dock"'), 'the two-line lyric dock must be replaced by the scrolling panel');
assert.ok(musicAppSource.includes('case "lyrics-toggle":'), 'the collapse button must be handled by the click dispatcher, not by an input handler');
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
assert.ok(musicStyleSource.includes('calc(clamp(15px, 1.05vw, 21px) * var(--lyrics-font-scale, 1))'), 'the collapsed card live line must keep the responsive clamp and the size factor; the lyric lines themselves are covered above');
assert.ok(musicStyleSource.includes('@media (max-width: 780px)'), 'compact windows need a documented fallback for the lyrics panel');
assert.ok(!musicStyleSource.includes('.music-app[data-lyrics-visible="true"][data-mode="detail"] #album-detail-content'), 'showing lyrics must not change the album column padding, which shifted the detail page content sideways');
assert.ok(musicStyleSource.includes('#album-detail-content .album-detail-body'), 'the lyrics panel must hide only the album block it covers, not the whole column');
assert.ok(/data-lyrics-playing="true"\][\s\S]{0,80}\.album-detail-body\s*\{[\s\S]{0,80}visibility: hidden;/.test(musicStyleSource), 'the covered album block must be hidden with visibility, not display:none, which pulled the credits up into the panel');
assert.ok(musicStyleSource.includes('.lyric-line.active'), 'the active lyric line must be visually distinguished');
assert.ok(musicStyleSource.includes('@media (prefers-reduced-motion: reduce)'), 'lyric styling must honor the operating-system reduced-motion setting');
// The panel's top is measured from the album title's own box and is only written
// when that box is real. Both boxes collapse to zero together while the detail
// pane is entering or the column is not laid out, and summing them then produced
// "0 + cached offset" — a plausible number no measurement could contradict, which
// parked the panel above the top of the window (measured: --lyrics-top -17px).
assert.ok(musicAppSource.includes('lyricsTitleTop = Math.round(albumTitle.getBoundingClientRect().top)'), 'the panel top must be measured from the album title box itself');
assert.ok(/if \(lyricsTitleTop !== null\) \{[\s\S]{0,120}setProperty\("--lyrics-top"/.test(musicAppSource), 'the panel top must only be written from a real measurement, never from an unlaid-out box');
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
assert.ok(/panelElement\.hidden = !hasLyrics \|\| stage\.dataset\.mode === "archive"/.test(musicAppSource), 'the card must be hidden while the archive is showing');
assert.ok(musicAppSource.includes('function applyLyricsCollapsed()'), 'the card state must be applied from one place, so the boot paint and the toggle cannot disagree');
assert.ok(/wasHidden !== panelElement.hidden[\s\S]{0,200}requestAnimationFrame\(\(\) => syncLyricsPanelAlignment\(\)\)/.test(musicAppSource), 'the panel must re-measure on the frame it first appears: hidden, its band has no box, so the rule and the list were left at the last values until the next album switch');
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
