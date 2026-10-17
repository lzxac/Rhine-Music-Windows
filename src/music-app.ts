import "@kitlangton/rolling-number/styles.css";
import "./style.css";
import "./quality-settings.css";
import "./document-decryption.css";
import "./decryption.css";
import "./music.css";
import "./music-playlists.css";
import "./music-navigation-motion.css";
import "./music-navigation-ruler.css";
import "./music-theme.css";
import "./music-theme-switch.css";
import { DocumentDecryption } from "./document-decryption";
import { ContentTransition, SurfaceTransition } from "./ui-transitions";
import { qualityMarkup, syncQualityUI } from "./quality-settings";
import { ArchiveScene } from "./scene";
import {
  records,
  archiveColumns,
  columnFiles,
  fileLocation,
  musicLibrary,
  setMusicAlbums,
  orderMusicAlbums,
  type MusicSortMode,
} from "./data";
import { wrap, type ArchiveNavigation } from "./archive-loop";
import {
  normalizeQuality,
  qualityPresets,
  type QualityPreset,
  type RenderQuality,
} from "./render-quality";
import { MusicPlayer, type MusicPlayerState, type PlayMode } from "./music-player";
import { ModelViewer } from "./model-viewer";
import { TerminalAudio } from "./audio";
import type {
  MusicAlbum,
  MusicGenre,
  MusicLibrary,
  MusicPlaylist,
  MusicTrack,
  ListeningComment,
  GenreRules,
} from "./music-types";
import { demoAlbums, demoGenres } from "./demo-library";
import { escapeHtml as esc } from "./html";
import { albumTitleMarkup, setupMusicTitleLayout } from "./music-title";
import { setupMusicTextMotion } from "./music-text-motion";
import { setupMusicTicks } from "./music-ticks";
import { setupMusicRuler } from "./music-ruler";
import { MusicPresentation, type AlbumSelection } from "./music-presentation";
import { MusicTrackFocus } from "./music-track-focus";
import { MusicBoot } from "./music-boot";
import { viewportLayout } from "./viewport-layout";
import { probeGpuCapability } from "./gpu-capability";
import { BUILD_VERSION } from "./build-version";
import { activeLyricIndex, parseLrc, type LyricLine } from "./lyrics";

type Theme = "day" | "dusk" | "night";
type Panel = "library" | "search" | "settings" | "playlists" | "queue" | null;
document.title = `Rhine Music ${BUILD_VERSION}`;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const svg = (path: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const icons = {
  play: svg('<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>'),
  pause: svg('<path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" stroke="none"/>'),
  stop: svg('<rect x="6" y="6" width="12" height="12" rx="1"/>'),
  search: svg(
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  ),
  playlist: svg('<path d="M4 6h12M4 12h12M4 18h8"/><path d="M19 15v6l-2-1.2-2 1.2v-6a2 2 0 1 1 4 0Z"/>'),
  queue: svg('<path d="M4 6h16M4 12h16M4 18h9"/><path d="m17 16 4 2-4 2v-4Z" fill="currentColor" stroke="none"/>'),
  // 播放模式四个图标：形状用最标准、最常见的样式（圆环双向箭头 / 加 1 / 交叉波浪 / 双直线箭头），
  // 只在**尺寸**上做归一化 —— 外接盒面积一律 = 200 并居中到 20×20 画布，缩放始终等比
  // （sx = sy），所以形状绝不拉伸。目标是"常见的标准图标 + 分量一致"，不要为了对齐数字
  // 去改形状（曾把圆环压成方框、把缺口做成毛球，两次都被用户看出"长歪了"）。
  repeat: svg('<g transform="translate(0.02 0.02) scale(0.8319)"><path d="M17 3.5 20.5 7 17 10.5"/><path d="M20.5 7H8.5A4.5 4.5 0 0 0 4 11.5"/><path d="M7 20.5 3.5 17 7 13.5"/><path d="M3.5 17h12A4.5 4.5 0 0 0 20 12.5"/></g>'),
  repeatOne: svg('<g transform="translate(0.02 0.02) scale(0.8319)"><path d="M17 3.5 20.5 7 17 10.5"/><path d="M20.5 7H8.5A4.5 4.5 0 0 0 4 11.5"/><path d="M7 20.5 3.5 17 7 13.5"/><path d="M3.5 17h12A4.5 4.5 0 0 0 20 12.5"/><path d="M11.6 10.6 13 9.9V15"/></g>'),
  shuffle: svg('<g transform="translate(-1.44 -0.40) scale(0.9458)"><path d="M3.5 7h3.2c1.2 0 2.2.6 2.9 1.6l3 4.8c.7 1 1.7 1.6 2.9 1.6h4"/><path d="M17 12.5 20.5 15 17 17.5"/><path d="M3.5 17h3.2c1.2 0 2.2-.6 2.9-1.6l.7-1.1"/><path d="m13.3 8.9.5-.7c.7-1 1.7-1.6 2.9-1.6h4"/><path d="M17 4.5 20.5 7 17 9.5"/></g>'),
  sequential: svg('<g transform="translate(-0.04 0.16) scale(0.8199)"><path d="M3.5 7h17"/><path d="M17.5 3.5 21 7l-3.5 3.5"/><path d="M3.5 17h17"/><path d="M17.5 13.5 21 17l-3.5 3.5"/></g>'),
  // 收藏到歌单: a list with a plus. Distinct from both the queue list and the top bar's
  // "add to playlist" music-note glyph.
  playlistAdd: svg('<path d="M4 6h11M4 12h11M4 18h7"/><path d="M18 13v7M14.5 16.5h7"/>'),
  prev: svg('<path d="M18 6v12L9 12Z" fill="currentColor" stroke="none"/><rect x="5" y="6" width="2.5" height="12" rx="1" fill="currentColor" stroke="none"/>'),
  next: svg('<path d="M6 6v12l9-6Z" fill="currentColor" stroke="none"/><rect x="16.5" y="6" width="2.5" height="12" rx="1" fill="currentColor" stroke="none"/>'),
  heart: svg('<path d="M12 20s-7-4.5-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.5 12 20 12 20Z"/>'),
  // 「更多」菜单的图标，按网易云那一列补齐：下载 / 分享 / 一起听 / 倍速 / 歌手 / 专辑 /
  // 音效 / 购买 / 减少推荐。这些项当前都不可用（见 renderMoreMenu），但图标先备齐，
  // 将来平台化时直接在既有结构上接功能即可。
  download: svg('<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>'),
  share: svg('<circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><circle cx="17.5" cy="18" r="2.5"/><path d="m8.8 10.8 6.4-3.6M8.8 13.2l6.4 3.6"/>'),
  together: svg('<circle cx="9" cy="8.5" r="3"/><path d="M3.8 19.5a5.4 5.4 0 0 1 10.4 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6"/><path d="M17.2 14.6a5.4 5.4 0 0 1 3 4.9"/>'),
  speed: svg('<path d="M5.2 18.5a7.5 7.5 0 1 1 13.6 0Z"/><path d="m12 15 3.4-4"/>'),
  artist: svg('<circle cx="12" cy="8" r="3.5"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/>'),
  album: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.2"/><path d="M12 4a8 8 0 0 0 0 16"/>'),
  effects: svg('<path d="M6 4v14.2"/><path d="M6 20.2a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8Z"/><path d="M6 8.4C10.5 8.4 12 4 18 4v5c-6 0-7.5 4.4-12 4.4"/>'),
  cart: svg('<path d="M4 5h2.2l2 9.5h9.3l2-6.8H7"/><circle cx="9" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/>'),
  reduce: svg('<circle cx="12" cy="12" r="8"/><path d="m6.5 17.5 11-11"/>'),
  comment: svg('<path d="M4 6h16v10H9l-4 3v-3H4Z"/>'),
  volume: svg('<path d="M4 10v4h3l4 3V7L7 10H4Z" fill="currentColor" stroke="none"/><path d="M14 9.2A3.6 3.6 0 0 1 14 14.8"/><path d="M16.8 7A7.2 7.2 0 0 1 16.8 17"/>'),
  // 静音：同一个喇叭，波弧换成叉。0% 时用它替换上面的图标，所以喇叭本体必须逐点一致 ——
  // 切换时才只有"波弧变叉"，锥体不会跳动。
  volumeMuted: svg('<path d="M4 10v4h3l4 3V7L7 10H4Z" fill="currentColor" stroke="none"/><path d="M13.6 10.4 18.4 15.2"/><path d="M18.4 10.4 13.6 15.2"/>'),
  more: svg('<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>'),
  settings: svg(
    '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5" fill="var(--surface)"/><circle cx="15" cy="17" r="2.5" fill="var(--surface)"/>',
  ),
  folder: svg('<path d="M3 7V5h6l2 2h10v13H3Z"/>'),
  windowMin: svg('<path d="M5 12h14"/>'),
  windowMax: svg('<rect x="6" y="6" width="12" height="12" rx="1"/>'),
  windowClose: svg('<path d="m6 6 12 12M18 6 6 18"/>'),
};
/** 播放模式 in the order the button cycles them, with the label it announces. Order matters:
 *  it is both the cycle and the list the transport button walks. */
const PLAY_MODES: { mode: PlayMode; label: string; icon: string }[] = [
  { mode: "list", label: "循环播放", icon: icons.repeat },
  { mode: "single", label: "单曲循环", icon: icons.repeatOne },
  { mode: "shuffle", label: "随机播放", icon: icons.shuffle },
  { mode: "sequential", label: "顺序播放", icon: icons.sequential },
];
const read = <T>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
const preferences = {
  ...{
    theme: "day" as Theme,
    sortMode: "genre" as MusicSortMode,
    quality: "original" as QualityPreset,
    // Bumped when the default render quality changes, so an untouched old default is
    // migrated once instead of being treated as a deliberate choice.
    qualityRevision: 1,
    // 与 qualityRevision 同一个用途：音量滑块的默认值从 65% / 22% 改成 100% 之后，
    // 把"还停在旧默认值"的存档一次性迁移过去 —— 否则只有全新安装才会变，已经存过值的
    // 安装（包括老板自己的那套）会一直停在 65%，看起来像没改。
    volumeRevision: 1,
    reduced: false,
    // 音量滑块的默认值都是 **100%**：让"滑块拉满"等于"真的最大"，否则用户会以为当前就是上限。
    // 觉得大再自己调小。BGM 是氛围声（专辑开始前淡出、停止后淡入），刻意保持很低，不属于同一口径。
    volume: 1,
    // 静音前的音量。单击喇叭切换静音；恢复时回到这个值, as NetEase does. Kept in the
    // preferences so a reload while muted still restores the level the user had chosen.
    volumeBeforeMute: 1,
    songFade: true,
    bgm: true,
    bgmVolume: 0.18,
    sound: true,
    soundVolume: 1,
    renderQuality: undefined as RenderQuality | undefined,
    // Multiplier on the lyric text, kept as an index so the steps are the ones
    // listed in LYRIC_SIZES rather than an arbitrary slider value.
    lyricsSize: 0,
    // "left" (the layout the panel shipped with) or "center".
    lyricsAlign: "left" as LyricAlign,
    // 播放模式, restored across sessions. `list` wraps the queue, which is what the player
    // did before the button existed.
    playMode: "list" as PlayMode,
  },
  ...read<
    Partial<{
      theme: Theme;
      sortMode: MusicSortMode;
      quality: QualityPreset;
      reduced: boolean;
      volume: number;
      volumeBeforeMute: number;
      songFade: boolean;
      bgm: boolean;
      bgmVolume: number;
      sound: boolean;
      soundVolume: number;
      renderQuality: RenderQuality;
      lyricsSize: number;
      lyricsAlign: LyricAlign;
      playMode: PlayMode;
    }>
  >("rhine-music-preferences", {}),
};
// Lyric text sizes. The first entry is the size the panel has always used, and it
// is the floor on purpose: anything smaller reads badly at this weight and column
// width. Each step is applied as a multiplier, because the stylesheet sizes the
// lines with `clamp()` that is different at every breakpoint — multiplying keeps
// that responsive behaviour instead of replacing it with one fixed size.
const LYRIC_SIZES = [1, 1.15, 1.3, 1.45, 1.6, 1.75];
const lyricSizeIndex = () => {
  const stored = preferences.lyricsSize;
  return Number.isInteger(stored) && stored >= 0 && stored < LYRIC_SIZES.length
    ? stored
    : 0;
};
// Lyric alignment. Written to a data attribute on the panel and matched by the
// stylesheet, so adding a third mode later is one rule plus one entry here rather
// than another branch inside the render path. `left` is the default the panel
// shipped with.
type LyricAlign = "left" | "center";
const LYRIC_ALIGNS: LyricAlign[] = ["left", "center"];
const LYRIC_ALIGN_LABELS: Record<LyricAlign, string> = {
  left: "左对齐",
  center: "居中对齐",
};
const LYRIC_ALIGN_GLYPHS: Record<LyricAlign, string> = {
  left: "≡",
  center: "☰",
};
const lyricAlign = (): LyricAlign => {
  const stored = preferences.lyricsAlign;
  return stored && (LYRIC_ALIGNS as string[]).includes(stored)
    ? (stored as LyricAlign)
    : "left";
};
function applyLyricAlign() {
  const panel = document.querySelector<HTMLElement>("#music-lyrics-panel");
  if (!panel) return;
  const mode = lyricAlign();
  panel.dataset.lyricsAlign = mode;
  const button = document.querySelector<HTMLButtonElement>("#lyrics-align-toggle");
  if (!button) return;
  // The button shows the mode it will switch TO, so its own label reads as the
  // action rather than the current state.
  const next = LYRIC_ALIGNS[(LYRIC_ALIGNS.indexOf(mode) + 1) % LYRIC_ALIGNS.length];
  button.textContent = LYRIC_ALIGN_GLYPHS[next];
  button.title = `切换为${LYRIC_ALIGN_LABELS[next]}`;
  button.setAttribute("aria-label", `切换歌词对齐方式，当前${LYRIC_ALIGN_LABELS[mode]}`);
}
function stepLyricAlign() {
  const next = LYRIC_ALIGNS[(LYRIC_ALIGNS.indexOf(lyricAlign()) + 1) % LYRIC_ALIGNS.length];
  preferences.lyricsAlign = next;
  savePrefs();
  applyLyricAlign();
  // Alignment does not change row heights, but the active line's transform is
  // origin-sensitive under centring, so re-centre for a clean state.
  activeLyric = -2;
  syncLyricsPosition(player.playbackTime);
}
function applyLyricSize() {
  const panel = document.querySelector<HTMLElement>("#music-lyrics-panel");
  if (!panel) return;
  const index = lyricSizeIndex();
  panel.style.setProperty("--lyrics-font-scale", String(LYRIC_SIZES[index]));
  const smaller = document.querySelector<HTMLButtonElement>("#lyrics-size-down");
  const larger = document.querySelector<HTMLButtonElement>("#lyrics-size-up");
  if (smaller) smaller.disabled = index === 0;
  if (larger) larger.disabled = index === LYRIC_SIZES.length - 1;
}
function stepLyricSize(direction: number) {
  const next = Math.max(0, Math.min(LYRIC_SIZES.length - 1, lyricSizeIndex() + direction));
  if (next === lyricSizeIndex()) return;
  preferences.lyricsSize = next;
  savePrefs();
  applyLyricSize();
  // The rows change height with the size, so re-centre the active line.
  activeLyric = -2;
  syncLyricsPosition(player.playbackTime);
}
// Applied after the panel markup is in the document (it is written by the
// `stage.innerHTML` assignment below), and after the `const` declarations above —
// calling it earlier would either miss the element or hit a temporal-dead-zone
// ReferenceError, and that exact mistake has stopped this app's boot once before.
//
// Quality revision 2: the default preset moved to the performance tier and the render
// loop is paced, so paying for a full-quality render on an otherwise idle screen is no
// longer worth it. This runs before the effective quality is resolved, so the new
// default applies in this same boot. A stored `original` — including the per-parameter
// block the legacy migration below writes itself — is not a deliberate choice the
// settings panel can produce (that would read `custom`), so it is migrated; every
// preset, and every custom parameter set, stays one click away.
const QUALITY_REVISION = 6;
if ((preferences.qualityRevision ?? 1) < QUALITY_REVISION) {
  preferences.qualityRevision = QUALITY_REVISION;
  // Revisions 3 and 5 briefly shipped the cheaper preset as the default. It lowers the
  // render scale, which the owner could see as a softer picture, and the aggressive
  // variant of it also erased the album covers, so the default is the original preset
  // again. The render-loop pacing is what actually removed the fan noise and it costs no
  // image quality at all, so that stays. A quality preset is a deliberate choice here, so
  // nothing else is touched.
  if (preferences.quality === "performance") {
    preferences.quality = "original";
    preferences.renderQuality = undefined;
  }
  save("rhine-music-preferences", preferences);
}
// 音量默认值从 65% / 22% 改成 100%（见上面的 defaults）。改默认只对全新安装生效，已存过值的
// 安装会一直停在旧值 —— 而那正好是"看起来没改"的样子。所以照 qualityRevision 的做法做一次性迁移：
// **只有仍然精确等于旧默认值**的项才被抬到 100%，用户自己调过的其它值一律不动。
const VOLUME_REVISION = 2;
if ((preferences.volumeRevision ?? 1) < VOLUME_REVISION) {
  preferences.volumeRevision = VOLUME_REVISION;
  if (preferences.volume === 0.65) preferences.volume = 1;
  if (preferences.volumeBeforeMute === 0.65) preferences.volumeBeforeMute = 1;
  if (preferences.soundVolume === 0.22) preferences.soundVolume = 1;
  save("rhine-music-preferences", preferences);
}
let renderQuality = normalizeQuality(
  preferences.quality === "original" &&
    preferences.renderQuality?.pixelRatio === 1.5 &&
    Object.entries(qualityPresets.original).every(([key, value]) =>
      key === "pixelRatio" || preferences.renderQuality?.[key as keyof RenderQuality] === value,
    )
    ? qualityPresets.original
    : preferences.renderQuality || qualityPresets[preferences.quality],
);
if (preferences.quality === "original" && preferences.renderQuality?.pixelRatio === 1.5) {
  preferences.renderQuality = renderQuality;
  save("rhine-music-preferences", preferences);
}
if (!["day", "dusk", "night"].includes(preferences.theme)) {
  preferences.theme = "day";
  save("rhine-music-preferences", preferences);
}
if (!Object.hasOwn(qualityPresets, preferences.quality))
  preferences.quality = "performance";
const gpuCapability = probeGpuCapability();
if (!["genre", "artist", "album"].includes(preferences.sortMode))
  preferences.sortMode = "genre";
const sortLabels: Record<MusicSortMode, { name: string; column: string; code: string }> = {
  genre: { name: "按流派", column: "流派", code: "GENRE" },
  artist: { name: "按歌手名字", column: "歌手", code: "ARTIST" },
  album: { name: "按专辑名字", column: "分组", code: "ALBUMS" },
};
const sortLabel = sortLabels[preferences.sortMode];
let libraryReceived = false,
  scanSubmitting = false;
let scanRefreshTimer: ReturnType<typeof setTimeout> | undefined;
let library: MusicLibrary = {
  version: 1,
  albums: [],
  genres: [],
  roots: [],
  scan: { running: false },
  onlineEnabled: false,
};
let albums: MusicAlbum[] = [],
  genres: MusicGenre[] = [],
  demo = false,
  selected = 0;
let mode: "archive" | "detail" = "archive",
  activeTab: "tracks" | "about" = "tracks",
  panel: Panel = null;
let scene: ArchiveScene | undefined,
  ready = false,
  apiAvailable = true,
  refreshing = false;
let introductionsStarting = false,
  libraryStateVersion = 0,
  introductionRequestError = "";
let viewer: ModelViewer | undefined;
let boot: MusicBoot | undefined;
const effects = new TerminalAudio();
effects.configure({
  sound: preferences.sound,
  music: false,
  soundVolume: preferences.soundVolume,
  musicVolume: 0,
});
document.addEventListener("pointerdown", () => void effects.unlock(), {
  once: true,
});
document.addEventListener("keydown", () => void effects.unlock(), {
  once: true,
});
let toastTimer: ReturnType<typeof setTimeout>,
  pollTimer: ReturnType<typeof setTimeout> | undefined;
let columnMemory = new Map<string, string>();
let playerState: MusicPlayerState;
let playlists: MusicPlaylist[] = [];
let selectedPlaylistId = "";
let pendingPlaylistTrackId = "";
let lyricTrackId: string | null = null;
let lyricRequestVersion = 0;
let lyricLines: LyricLine[] = [];
let lyricStateText = "尚未载入歌词。";
// -2 is the "force a repaint after a track change" sentinel: the first line of a
// new track must be applied even when its index happens to equal the old one.
let activeLyric = -2;
let lyricClockFrame = 0;
// Declared up here with the rest of the lyric state, not beside its function
// further down: syncLyricsPanel() already runs while this module is still being
// evaluated (the player's own initialiser calls it), and a `let` below that point
// is in its temporal dead zone, which threw and aborted the whole boot.
let lyricsSongTrackId: string | null = null;
const player = new MusicPlayer({
  volume: preferences.volume,
  songFadeEnabled: preferences.songFade,
  bgmEnabled: preferences.bgm,
  bgmVolume: preferences.bgmVolume,
});
// The stored mode has to reach the player before anything can advance, or a restored
// 单曲循环 would behave like a list queue until the button was pressed once.
player.setPlayMode(preferences.playMode);
const themeNames: Record<Theme, string> = {
  day: "暖昼",
  dusk: "薄暮",
  night: "深夜",
};
const themeDescriptions: Record<Theme, string> = {
  day: "暖白玻璃与日光",
  dusk: "雾蓝暮色与柔光",
  night: "极简星空与透光白卡",
};
const stage = $("#stage");
stage.className = "music-app";
// The lyric line a viewer just clicked, held as active until the player's clock reaches it
// (see syncLyricsPosition). Declared up here with the other boot-time state on purpose: the
// player notifies its subscribers while the module is still evaluating, that path reaches
// syncLyricsPosition, and a `let` declared further down would throw a TDZ ReferenceError at
// boot instead.
let lyricJump: { index: number; time: number; deadline: number } | null = null;
// 两个右列面板（歌词 / 听后感）的开关状态与"正在收起"标志，**同样必须留在模块顶部**。
//
// 原因和上面 `lyricJump` 一模一样：`syncLyricsPanel()` 在模块求值期间就会被播发器的 subscribe
// 回调调用一次，而它会读这几个标志（并调用 syncCommentsView）。任何一个 `let` 声明写在那个
// 调用点之后，初始化那次就会撞上 TDZ —— 实测症状是整个应用卡在启动转圈，控制台报
// `Cannot access '…' before initialization`。我为此连续错了两轮（先挪到函数前，仍然不够早）。
//
// 另外：这些是**内存标志**，故意不做成持久化偏好。歌词那边早先用持久化标志当开关，那个值一旦
// 被置为 true 就会永久挡住面板（重启也不恢复），主人遇到过"有歌词的歌点了词没反应"。
let lyricsPanelRequested = false;
/**
 * 歌词面板是否**被允许**显示。听后感面板打开时置 false —— 两者占同一块区域，必须互斥。
 *
 * 之所以用一个独立标志、而不是"互相调用去收掉对方"：那种写法在 syncCommentsView 与
 * syncLyricsPanel 之间成环，实测直接 `RangeError: Maximum call stack size exceeded`。
 * 现在是单向的：评论打开 → 把歌词的许可收回 → 调用一次 syncLyricsPanel 让它按新许可对账。
 */
let lyricsAllowed = true;
let lyricsClosing = false;
let commentsRequested = false;
let commentsClosing = false;
// 听后感面板的其余状态。**全部必须在这里声明**，理由同上：`syncCommentsButton()` 会被播放器的
// 状态监听器在**模块求值期间**调用一次，它读这几个值。声明写在下面就会 TDZ —— 我为此连踩三次，
// 而这次的症状尤其隐蔽：监听器抛错后**曲库渲染中断**（页面显示 0 ALBUMS、0 张专辑卡片），
// 表现完全不像面板的问题，我花了一轮才定位到。
/** 当前曲目的听后感条数，供控制栏角标显示（面板没开也要准）。 */
let transportCommentCount = 0;
/** 面板加载的代次（防止并发加载把新列表覆盖成旧的）。 */
let commentsLoadToken = 0;
/** 角标计数的代次（连续换歌时只允许最后一次请求的结果写入）。 */
let commentsCountToken = 0;
/** 已经为哪一首取过条数，避免每次同步都重复请求。 */
let commentsCountTrackId: string | null | undefined = undefined;
/** 面板当前显示的是哪一首（换歌时用它判断要不要重新加载）。 */
let commentsTrackId: string | null = null;
stage.dataset.mode = "archive";
stage.dataset.theme = preferences.theme;
// Running inside the Windows launcher (WebView2) exposes the host bridge; the
// plain browser build keeps every window-control affordance hidden.
const hostBridge = (window as unknown as {
  chrome?: { webview?: { postMessage(message: string): void } };
}).chrome?.webview;
stage.dataset.hostWindow = hostBridge ? "1" : "0";
stage.innerHTML = `
  <div id="three-scene" class="three-scene"></div>
  <div class="music-vignette" aria-hidden="true"></div>
  ${hostBridge ? '<div id="window-caption" aria-hidden="true"></div>' : ""}
  <header class="music-header">
    <div class="music-identity"><a class="music-brand" href="/" aria-label="Rhine Music 音乐库"><strong>RHINE LAB</strong><span>MUSIC ARCHIVE <i>／</i> 私人音乐终端</span></a></div>
    <nav class="music-topnav" aria-label="音乐终端导航">
      <button data-action="library" aria-label="音乐库">${icons.folder}<span>音乐库</span></button>
      <button data-action="search" aria-label="搜索">${icons.search}<span>搜索</span></button>
      <button data-action="playlists" aria-label="我的歌单">${icons.playlist}<span>歌单</span></button>
      <button data-action="queue" aria-label="播放队列">${icons.queue}<span>队列</span><small id="queue-count">0</small></button>
      <div class="theme-switch" role="group" aria-label="主题">${(["day", "dusk", "night"] as Theme[]).map((t) => `<button data-theme="${t}" title="${themeNames[t]}主题" aria-label="${themeNames[t]}主题" aria-pressed="${preferences.theme === t}"><i class="theme-dot ${t}"></i><span>${themeNames[t]}</span></button>`).join("")}</div>
      <button data-action="settings" class="icon-button" aria-label="播放与画质设置">${icons.settings}</button>
      ${hostBridge ? `<div class="window-controls" role="group" aria-label="窗口控制"><button type="button" data-window="min" aria-label="最小化窗口">${icons.windowMin}</button><button type="button" data-window="max" aria-label="最大化或还原窗口">${icons.windowMax}</button><button type="button" data-window="close" class="window-close" aria-label="关闭窗口">${icons.windowClose}</button></div>` : ""}
    </nav>
  </header>
  <aside id="music-lyrics-panel" class="music-lyrics-panel" aria-label="同步滚动歌词" hidden>
    <div class="lyrics-band">
      <div id="lyrics-song-info" class="lyrics-song-info" hidden><strong id="lyrics-song-title"></strong><span id="lyrics-song-artist"></span></div>
      <div class="lyrics-band-controls">
        <div class="lyrics-size" role="group" aria-label="歌词字号">
          <button type="button" id="lyrics-size-down" data-action="lyrics-size-down" aria-label="缩小歌词字号" title="缩小歌词字号">A－</button>
          <button type="button" id="lyrics-size-up" data-action="lyrics-size-up" aria-label="放大歌词字号" title="放大歌词字号">A＋</button>
        </div>
        <div class="lyrics-align" role="group" aria-label="歌词对齐">
          <button type="button" id="lyrics-align-toggle" data-action="lyrics-align" aria-label="切换歌词对齐方式" title="切换歌词对齐方式">⇤</button>
        </div>
      </div>
    </div>
    <div id="lyrics-panel-body" class="lyrics-panel-body">
      <div id="lyric-list" class="lyric-list" tabindex="0" role="group" aria-label="歌词，点击一行可跳转到该时间"></div>
    </div>
  </aside>
  <!--
    听后感（评论）面板：和歌词面板**并列的第三个视图**，占同一块区域（专辑详情 ↔ 歌词 ↔ 评论）。
    结构照网易云评论页的元素排：顶部曲目信息 + 条数 → 中间评论列表 → 底部发布区。
    网易云是整页，我们只占右列那个区域（主人的要求）。
    本地化差异照实处理：只有本机自己写的评论，所以没有点赞/回复/分享这类需要社区的入口
    （不做死图标），每条只留删除。
  -->
  <aside id="music-comments-panel" class="music-comments-panel" aria-label="听后感" hidden>
    <div class="comments-head">
      <div class="comments-song">
        <strong id="comments-song-title"></strong>
        <span id="comments-song-artist"></span>
      </div>
      <span class="comments-count" id="comments-count">全部评论 0</span>
    </div>
    <div class="comments-body" id="comments-body"></div>
    <div class="comments-compose">
      <label class="field-label" for="comment-text">写点什么<span>最多 2000 字</span></label>
      <textarea id="comment-text" rows="2" maxlength="2000" placeholder="这一首给你的感觉…"></textarea>
      <div class="comments-compose-actions">
        <p id="comment-status" class="comments-status" role="status" aria-live="polite">正在读取…</p>
        <button class="primary-button" data-action="add-comment">发布评论</button>
      </div>
    </div>
  </aside>
  <div id="library-status" class="library-status"><i></i><span>正在读取本地音乐索引</span></div>
  <section id="music-browse" class="music-browse" aria-label="专辑浏览">
    <div class="music-browse-veil" aria-hidden="true"></div>
    <div class="album-callout"><p class="music-eyebrow">MUSIC ARCHIVE <span>／</span> <span id="selection-genre"></span></p>
      <div class="selection-rule"><span id="selection-code">ALBUM <span id="selection-code-number">001</span></span><span id="selection-format"></span></div>
      <h1 id="selection-title"></h1><p id="selection-artist" class="selection-artist"></p>
      <div class="selection-meta" id="selection-meta"></div>
      <button class="open-album" data-action="open">打开专辑 <span>↗</span></button>
    </div>
    <div class="music-navigation">
      <div class="music-counter"><span class="music-eyebrow">ALBUM / SELECT</span><div><b id="selection-number">01</b><span>/ <i id="selection-total">00</i></span></div></div>
      <div class="album-stepper"><button data-action="prev" aria-label="上一个专辑">↑</button><div id="album-ticks"></div><button data-action="next" aria-label="下一个专辑">↓</button></div>
      <div class="genre-stepper"><button data-action="genre-prev" aria-label="上一个${sortLabel.column}">←</button><div><small id="genre-position">${sortLabel.code} <span id="genre-index">01</span> / <span id="genre-total">00</span></small><button data-action="genres" id="genre-name"></button></div><button data-action="genre-next" aria-label="下一个${sortLabel.column}">→</button></div>
    </div>
    <div class="music-keyhint">← → ${sortLabel.column} <span>／</span> ↑ ↓ 专辑 <span>／</span> ENTER 打开专辑</div>
  </section>
  <section id="music-detail" class="music-detail" aria-label="专辑详情" hidden>
    <button class="music-back" data-action="back">← 返回专辑架 <kbd>ESC</kbd></button>
    <div class="minimal-transport detail-transport" role="group" aria-label="音乐播放"><button type="button" id="track-more" class="track-more" data-action="track-more" aria-label="下面还有曲目" hidden><svg viewBox="0 0 12 7" aria-hidden="true" focusable="false"><path d="M1 1l5 5 5-5" /></svg></button><div class="detail-seek" id="detail-seek"><span class="detail-seek-time" id="detail-seek-current">00:00</span><div class="detail-seek-field"><input type="range" id="detail-seek-range" min="0" max="0" step="0.1" value="0" aria-label="播放进度"><span class="detail-seek-bubble" id="detail-seek-bubble">00:00</span></div><span class="detail-seek-time" id="detail-seek-total">00:00</span></div><span id="transport-lyric-status" class="transport-lyric-status is-silent" role="status" aria-live="polite" aria-hidden="true"></span><div class="detail-transport-controls"><div class="transport-side transport-side-left"><span class="transport-track" id="transport-track"><strong id="transport-track-title"></strong><small id="transport-track-artist"></small></span><button type="button" class="transport-icon-button" data-action="like" id="transport-like" aria-label="我喜欢的音乐" aria-pressed="false" disabled>${icons.heart}<span class="transport-badge" id="transport-like-badge" hidden></span></button><button type="button" class="transport-icon-button" data-action="comments" id="transport-comments" aria-label="听后感" aria-expanded="false" disabled>${icons.comment}<span class="transport-badge" id="transport-comments-badge" hidden></span></button><button type="button" class="transport-icon-button" data-action="play-mode" id="transport-play-mode" data-mode="list" aria-label="播放模式：循环播放" title="播放模式：循环播放">${icons.repeat}</button></div><div class="transport-side transport-main"><button type="button" data-action="track-prev" id="track-prev" class="transport-icon-button" aria-label="上一首">${icons.prev}</button><button data-action="play-pause" id="play-pause" aria-label="播放" aria-pressed="false"><span class="transport-glyph transport-play" aria-hidden="true">${icons.play}</span><span class="transport-glyph transport-pause" aria-hidden="true">${icons.pause}</span></button><button type="button" data-action="track-next" id="track-next" class="transport-icon-button" aria-label="下一首">${icons.next}</button></div><div class="transport-side transport-side-right"><button type="button" data-action="queue" id="transport-queue" class="transport-icon-button" aria-label="播放队列" aria-expanded="false">${icons.queue}</button><span class="transport-format is-empty" id="transport-format" aria-label="音质">音质</span><button type="button" data-action="add-to-playlist" id="transport-add-playlist" class="transport-icon-button" aria-label="收藏到歌单" aria-expanded="false" disabled>${icons.playlistAdd}</button><button type="button" id="transport-lyrics-open" class="transport-lyrics-open" data-action="lyrics-panel" aria-expanded="false">词</button><span class="transport-volume"><button type="button" id="transport-volume-button" class="transport-icon-button" aria-label="${`音量：${Math.round(preferences.volume * 100)}%`}" aria-expanded="false">${icons.volume}</button><span class="transport-volume-bridge" aria-hidden="true"></span><span class="transport-volume-popover" id="transport-volume-popover" hidden><span class="transport-volume-track"><input type="range" id="transport-volume" min="0" max="100" step="1" value="${Math.round(preferences.volume * 100)}" aria-label="音量"></span><output class="transport-volume-value" id="transport-volume-value">${Math.round(preferences.volume * 100)}%</output></span></span><button type="button" class="transport-icon-button" data-action="more" id="transport-more" aria-label="更多" aria-expanded="false">${icons.more}</button></div></div></div>
    <div class="card-caption"><span id="detail-card-id"></span><small>拖动卡片，查看完整封面</small></div>
    <article id="album-detail-content" tabindex="-1"></article>
  </section>
  <div id="music-empty" class="music-empty" hidden><small>YOUR PRIVATE COLLECTION</small><h1>让音乐进入这座档案馆。</h1><p>选择本地音乐文件夹，专辑封面会出现在每一张卡片上。</p><button data-action="library">设置音乐文件夹 ↗</button><button data-action="demo" class="subtle">先查看演示封面</button></div>
  <div class="music-bottomline"><span>LOCAL COLLECTION <i>·</i> <span id="library-count">0 ALBUMS</span></span><span id="runtime-info">THREE.JS / LOCAL</span></div>
  <div id="music-panel-root"></div><div id="music-toast" role="status" aria-live="polite"></div>
  <div id="transport-menu" class="transport-menu" role="menu" aria-label="收藏到歌单" hidden></div>
  <div id="transport-more-menu" class="transport-menu transport-more-menu" role="menu" aria-label="更多" hidden></div>
  <div id="music-dialog" class="music-dialog" hidden></div>
  <div id="music-loading"><span class="loading-orbit"></span><strong>OPENING THE ARCHIVE</strong><small>正在载入三维专辑架</small></div>
`;
// Apply the stored collapsed state once, before the first paint of the panel.
if (hostBridge) {
  const sendWindowAction = (action: string) => hostBridge.postMessage("rhine-window:" + action);
  const isInteractive = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest("button, a, input, select, .theme-switch, .window-controls"));
  /**
   * 双击标题栏才最大化的**落点范围**。
   *
   * 这个手势本来是为了模仿 Windows 的"双击标题栏最大化/还原"，但早先（dev.6 引入、dev.10 扩展）
   * 落点判定是**整个 stage**，只要双击处不是按钮/输入框就触发 —— 于是**双击界面任何空白处都会
   * 最大化或还原**，老板把它当成误触（他的原话："双击界面的任何位置都可以全屏放大或者缩小"）。
   *
   * 现在只认真正承担标题栏角色的两块：顶栏 `.music-header` 与窗口标题条 `#window-caption`
   * —— 也就是本文件里已经挂了 `drag` 手势的那两处。内容区（专辑架、专辑详情、控制栏、面板）
   * 一律不再响应双击最大化。
   */
  const isTitleBar = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest(".music-header, #window-caption"));
  // The frameless window leaves no non-client border for Windows to hit, and the
  // web view covers the whole client area, so the shell never sees the pointer at
  // the window edge. Detect the edge here and ask the host to start the native
  // resize loop, exactly like the drag request above.
  const resizeZone = 6;
  const edgeDiagnostics = new URLSearchParams(location.search).get("edgediag") === "1";
  let lastReportedEdge: string | null | undefined;
  const describeElement = (target: EventTarget | null) => {
    const element = target as HTMLElement | null;
    if (!element) return "none";
    const cls = typeof element.className === "string" ? element.className.split(" ").filter(Boolean).slice(0, 2).join(".") : "";
    return element.tagName.toLowerCase() + (cls ? "." + cls : "") + (element.id ? "#" + element.id : "");
  };
  const edgeAt = (event: MouseEvent): string | null => {
    // the window controls live in the corner and must stay clickable
    if (event.target instanceof Element && event.target.closest(".window-controls")) return null;
    const vertical = event.clientY <= resizeZone ? "top" : event.clientY >= window.innerHeight - resizeZone ? "bottom" : "";
    const horizontal = event.clientX <= resizeZone ? "left" : event.clientX >= window.innerWidth - resizeZone ? "right" : "";
    if (vertical && horizontal) return `${vertical}-${horizontal}`;
    return vertical || horizontal || null;
  };
  const resizeCursors: Record<string, string> = {
    left: "ew-resize",
    right: "ew-resize",
    top: "ns-resize",
    bottom: "ns-resize",
    "top-left": "nwse-resize",
    "bottom-right": "nwse-resize",
    "top-right": "nesw-resize",
    "bottom-left": "nesw-resize",
  };
  stage.addEventListener("mousemove", (event) => {
    const edge = edgeAt(event);
    if (edgeDiagnostics && edge !== lastReportedEdge) {
      lastReportedEdge = edge;
      sendWindowAction(
        `diag-edge-${edge ?? "none"}-${window.innerWidth}x${window.innerHeight}-${event.clientX},${event.clientY}-${describeElement(event.target)}`,
      );
    }
    // The 3D canvas sets its own cursor while hovering the scene, so a cursor on
    // the root alone would be overridden. The stylesheet takes over inside the
    // edge zone (see the data-window-edge rules in music.css).
    if (edge) stage.dataset.windowEdge = edge;
    else delete stage.dataset.windowEdge;
    document.documentElement.style.cursor = edge ? resizeCursors[edge] : "";
  });
  // The drag/resize gesture starts a native modal loop, which owns the first
  // click's release, so the page never sees a complete click pair and a normal
  // `dblclick` listener never fires. Detect the double click from the mousedown
  // stream instead, matching Windows: double-click on the title bar or on the
  // window border toggles the maximized state.
  let lastPointerDownAt = 0;
  let lastPointerDownX = 0;
  let lastPointerDownY = 0;
  const isDoubleClick = (event: MouseEvent) => {
    if (event.timeStamp <= lastPointerDownAt) return false;
    return (
      event.timeStamp - lastPointerDownAt <= 450 &&
      Math.abs(event.clientX - lastPointerDownX) <= 5 &&
      Math.abs(event.clientY - lastPointerDownY) <= 5
    );
  };
  const rememberPointerDown = (event: MouseEvent) => {
    lastPointerDownAt = event.timeStamp;
    lastPointerDownX = event.clientX;
    lastPointerDownY = event.clientY;
  };
  stage.addEventListener(
    "mousedown",
    (event) => {
      if (event.button !== 0) return;
      const edge = edgeAt(event);
      const doubleClick = isDoubleClick(event);
      rememberPointerDown(event);
      if (edge) {
        event.preventDefault();
        event.stopPropagation();
        sendWindowAction(doubleClick ? "max" : "resize-" + edge.replace("-", ""));
        return;
      }
      if (doubleClick && isTitleBar(event.target) && !isInteractive(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        sendWindowAction("max");
      }
    },
    true,
  );
  stage.querySelectorAll<HTMLButtonElement>("[data-window]").forEach((button) => {
    button.addEventListener("click", () => sendWindowAction(button.dataset.window!));
  });
  const caption = $("#window-caption");
  caption.addEventListener("mousedown", (event) => {
    if (event.button === 0) sendWindowAction("drag");
  });
  const header = $(".music-header");
  header.addEventListener("mousedown", (event) => {
    if (event.button === 0 && !isInteractive(event.target)) sendWindowAction("drag");
  });
}
stage.dataset.lyricsPlaying = "false";
// Nothing shows a focus ring until the viewer has actually pressed a key or clicked:
// opening the detail view focuses its own content, which Chromium treats as keyboard
// focus and rings — a ring nobody asked for on a fresh launch.
{
  const markInput = () => {
    stage.dataset.input = "1";
  };
  window.addEventListener("keydown", markInput, { once: true, capture: true });
  window.addEventListener("pointerdown", markInput, { once: true, capture: true });
}
// 不再需要在启动时设置"收起态外观"：收起态已删除，面板初始就是 hidden（见模板里的 hidden 属性）。
// The panel now exists, so the stored lyric size can be applied before its first
// paint instead of flashing at the default size.
applyLyricSize();
applyLyricAlign();
const titleMotion = setupMusicTitleLayout(stage);
const textMotion = setupMusicTextMotion(stage);
// Keep the previous navigation available while the ruler version is on trial.
const tickMotion = new URLSearchParams(location.search).get("nav") === "previous"
  ? setupMusicTicks($("#album-ticks"))
  : setupMusicRuler($("#album-ticks"));
let selectionInitialized = false;
const selectionMotionEnabled = () =>
  ready &&
  !boot?.active &&
  mode === "archive" &&
  !$("#music-browse").hidden &&
  !preferences.reduced;
function syncSelectionMotion() {
  // Build static reels during the hidden camera movement, before the text fades in.
  const enabled = selectionMotionEnabled() ||
    (mode === "archive" && !!albums.length && !preferences.reduced);
  textMotion.setEnabled(enabled);
  if (!enabled) titleMotion.finish();
  else {
    const album = currentAlbum();
    if (album) titleMotion.update(album.title, true);
  }
}

function notify(message: string) {
  $("#music-toast").textContent = message;
  $("#music-toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(
    () => $("#music-toast").classList.remove("visible"),
    5500,
  );
}
function time(value: number) {
  const n = Math.max(0, Math.floor(value || 0));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

// ── ♥ 我喜欢的音乐 ────────────────────────────────────────────────────────────
// 用一张**特殊歌单**承载"喜欢"，而不是新造一种存储：这样"喜欢的歌"天然出现在歌单侧栏里、
// 能直接播放、能手写排序，也不必为它单独做一套导出。代价是它和普通歌单同源，所以：
//   · 侧栏不给它改名/删除（被删掉等于丢掉全部喜欢）
//   · 它只在第一次点红心时才创建，没点过就不会凭空出现在侧栏里
const LIKES_PLAYLIST_NAME = "我喜欢的音乐";
/** 当前曲目是否已被喜欢。缓存的是 trackId 集合，红心状态由它同步，避免每次状态更新都发请求。 */
const likedTrackIds = new Set<string>();

async function fetchPlaylists(): Promise<MusicPlaylist[]> {
  const result = await request<{ version: number; playlists: MusicPlaylist[] }>("/api/playlists");
  return result.playlists;
}

function isLikesPlaylist(playlist: MusicPlaylist): boolean {
  return playlist.name === LIKES_PLAYLIST_NAME;
}

/** 重算喜欢集合。歌单不存在时即为空集（还没喜欢过任何歌）。 */
async function refreshLikedTracks(): Promise<MusicPlaylist | undefined> {
  likedTrackIds.clear();
  try {
    const likes = (await fetchPlaylists()).find(isLikesPlaylist);
    for (const entry of likes?.tracks ?? []) likedTrackIds.add(entry.trackId);
    syncLikeButton();
    return likes;
  } catch {
    // 读不到就当作"未知"，红心回到未点亮，而不是停在上一次的错觉上。
    syncLikeButton();
    return undefined;
  }
}

/** 红心按钮的视觉与可访问性状态，都由当前曲目是否在喜欢集合里决定。 */
function syncLikeButton() {
  const button = document.querySelector<HTMLButtonElement>("#transport-like");
  if (!button) return;
  const track = playerState?.currentTrack;
  const liked = !!track && likedTrackIds.has(track.id);
  button.classList.toggle("is-liked", liked);
  button.disabled = !track;
  button.setAttribute("aria-pressed", String(liked));
  button.setAttribute("aria-label", liked ? "取消喜欢" : "我喜欢的音乐");
  button.title = track
    ? liked
      ? "取消喜欢"
      : "加入我喜欢的音乐"
    : "播放一首歌后才能喜欢";
  // 角标：本机只可能是 0/1。以后做成在线版时，这里换成服务端的人数即可（结构不用改）。
  setTransportBadge("#transport-like-badge", liked ? 1 : 0);
}
// ── 「收藏到歌单」菜单 ──────────────────────────────────────────────────────────
// 挂在 data-action="add-to-playlist" 上的小菜单：单击图标 → 选一张歌单 → 把当前曲目加进去。
// 用 position: fixed，因为控制带是 overflow: hidden（音量条那里已经踩过这个坑：浮层会被裁剪，
// 被裁剪的部分连指针都落不到）。
let transportMenuOpen = false;
let transportMenuClosing = 0;
let moreMenuOpen = false;
const transportMenuElement = () => $("#transport-menu");

/** 把菜单放到锚点按钮附近。fixed 定位：控制带是 overflow: hidden，绝对定位的浮层会被裁剪，
 *  而**被裁掉的部分连指针都落不到**（音量条那里已经踩过一次）。 */
function positionTransportMenu(anchor: HTMLElement, menu: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const width = menu.offsetWidth;
  const height = menu.offsetHeight;
  // 水平优先与按钮**右对齐**：菜单比按钮宽，左对齐时如果靠近视口右缘就会被夹住而整体左移，
  // 看起来像飘在按钮左边。右对齐既能贴住按钮，又只要按钮本身可见就不会越界；最后再兜一层夹取。
  const rightAligned = rect.right - width;
  const left = Math.min(Math.max(4, rightAligned), Math.max(4, window.innerWidth - width - 4));
  // 垂直优先向下弹；下方放不下就翻到上方，保证整块可见（被裁剪的部分点不到）。
  const below = rect.bottom + 6;
  const top = below + height <= window.innerHeight - 4 ? below : Math.max(4, rect.top - height - 6);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function renderTransportMenu(playlists: MusicPlaylist[]) {
  const menu = transportMenuElement();
  if (!menu) return;
  const rows = playlists.length
    ? playlists
        .map((playlist) => {
          const count = playlist.tracks?.length ?? 0;
          return `<button type="button" class="transport-menu-item" role="menuitem" data-action="add-to-playlist-pick" data-playlist="${esc(playlist.id)}"><span class="transport-menu-name">${esc(playlist.name)}</span><span class="transport-menu-count">${count} 首</span></button>`;
        })
        .join("")
    : `<p class="transport-menu-empty">还没有歌单。新建一个即可收藏当前曲目。</p>`;
  menu.innerHTML = `${rows}<button type="button" class="transport-menu-item transport-menu-new" role="menuitem" data-action="add-to-playlist-new">＋ 新建歌单并收藏</button>`;
}

async function openTransportMenu(anchor: HTMLElement) {
  const menu = transportMenuElement();
  if (!menu) return;
  if (transportMenuClosing) {
    clearTimeout(transportMenuClosing);
    transportMenuClosing = 0;
  }
  transportMenuOpen = true;
  menu.hidden = false;
  menu.innerHTML = `<p class="transport-menu-empty">正在读取歌单…</p>`;
  positionTransportMenu(anchor, menu);
  try {
    const result = await request<{ version: number; playlists: MusicPlaylist[] }>("/api/playlists");
    renderTransportMenu(result.playlists);
    positionTransportMenu(anchor, menu);
  } catch (error) {
    menu.innerHTML = `<p class="transport-menu-empty">歌单读取失败：${esc((error as Error).message)}</p>`;
  }
}

function closeTransportMenu() {
  const menu = transportMenuElement();
  transportMenuOpen = false;
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  $("#transport-add-playlist")?.setAttribute("aria-expanded", "false");
}

/** 把当前曲目加入指定歌单，并把结果用 toast 说清楚（重复曲目由服务端报 skipped）。 */
async function addCurrentTrackToPlaylist(playlistId: string, playlistName: string) {
  const track = playerState?.currentTrack;
  if (!track) {
    notify("当前没有在放的曲目，先播放一首再收藏。");
    return;
  }
  try {
    // 先取一次歌单，好在"服务端什么都没加"时区分两种情况：
    // 服务端对**已在歌单里的曲目**是静默跳过的（`if (known.has(id)) continue`），既不计入
    // added 也不计入 skipped，所以重复收藏会返回 { added: 0, skipped: 0 } —— 光看返回值
    // 分不清"已经有了"和"确实没加成"，会把重复收藏误报成失败。
    const current = await request<{ playlists: MusicPlaylist[] }>("/api/playlists");
    const target = current.playlists.find((entry) => entry.id === playlistId);
    const alreadyIn = !!target?.tracks?.some((entry) => entry.trackId === track.id);
    const result = await request<{ added: number; skipped: number }>(
      `/api/playlists/${playlistId}/tracks`,
      { trackIds: [track.id] },
    );
    if (result.added > 0) notify(`已收藏到「${playlistName}」。`);
    else if (result.skipped > 0 || alreadyIn) notify(`「${playlistName}」里已经有这首了。`);
    else notify(`没有加入「${playlistName}」，请稍后重试。`);
    // 歌单侧栏正开着就刷新它，否则用户切过去看到的还是旧内容。
    if (panel === "playlists") void loadPlaylistPanel();
    // 如果加进去的正是「我喜欢的音乐」，红心必须跟着亮起来：它是另一条入口，但改的是同一份
    // 数据。这里按**歌单名**判断（而不是 id），因为红心认的就是这个名字（见 isLikesPlaylist）。
    if (playlistName === LIKES_PLAYLIST_NAME) await refreshLikedTracks();
  } catch (error) {
    notify(`收藏失败：${(error as Error).message}`);
  }
}

/** 新建歌单并把当前曲目放进去（一步完成，省得先建再找回来收藏）。 */
async function createPlaylistWithCurrentTrack(name: string) {
  const track = playerState?.currentTrack;
  if (!track) {
    notify("当前没有在放的曲目，先播放一首再收藏。");
    return;
  }
  try {
    const created = await request<{ playlist: MusicPlaylist }>("/api/playlists", { name });
    await request(`/api/playlists/${created.playlist.id}/tracks`, { trackIds: [track.id] });
    notify(`已新建「${name}」并收藏当前曲目。`);
    if (panel === "playlists") void loadPlaylistPanel();
  } catch (error) {
    notify(`新建歌单失败：${(error as Error).message}`);
  }
}

/**
 * 点亮/取消红心。第一次点亮时才创建「我喜欢的音乐」那张歌单，所以没用过这个功能的人
 * 不会在侧栏里看到一张空歌单。取消喜欢走 remove-playlist-track 的删除接口。
 */
async function toggleLike() {
  const track = playerState?.currentTrack;
  if (!track) {
    notify("当前没有在放的曲目，先播放一首再喜欢。");
    return;
  }
  try {
    const likes = await refreshLikedTracks();
    const alreadyLiked = likedTrackIds.has(track.id);
    if (!likes) {
      const created = await request<{ playlist: MusicPlaylist }>("/api/playlists", {
        name: LIKES_PLAYLIST_NAME,
      });
      await request(`/api/playlists/${created.playlist.id}/tracks`, { trackIds: [track.id] });
      notify("已加入我喜欢的音乐。");
    } else if (alreadyLiked) {
      // 取消喜欢：按条目 id 删除（服务端的 refId，客户端算不出来，只能从条目里取）。
      const entry = likes.tracks.find((item) => item.trackId === track.id);
      if (!entry) {
        notify("这首歌不在我喜欢的音乐里。");
        return;
      }
      await request(`/api/playlists/${likes.id}/tracks/${entry.id}`, undefined, "DELETE");
      notify("已从我喜欢的音乐中移除。");
    } else {
      await request(`/api/playlists/${likes.id}/tracks`, { trackIds: [track.id] });
      notify("已加入我喜欢的音乐。");
    }
    await refreshLikedTracks();
    if (panel === "playlists") void loadPlaylistPanel();
  } catch (error) {
    notify(`操作失败：${(error as Error).message}`);
  }
}
function genreName(id: string) {
  return genres.find((g) => g.id === id)?.name || "未分类";
}
function currentAlbum() {
  return albums.find((a) => a.id === records[selected]?.id);
}
function formatList(a: MusicAlbum) {
  return (
    [
      ...new Set(
        a.tracks.map((t) => (t.codec ? `${t.format} / ${t.codec}` : t.format)),
      ),
    ].join(" · ") || (demo ? "封面演示" : "未提供")
  );
}
function albumDuration(a: MusicAlbum) {
  return a.tracks.reduce((sum, t) => sum + t.duration, 0);
}
function valueRange(
  values: (number | undefined)[],
  format: (n: number) => string,
) {
  const n = [
    ...new Set(values.filter((v): v is number => !!v && Number.isFinite(v))),
  ].sort((a, b) => a - b);
  return n.length
    ? n.length === 1
      ? format(n[0])
      : `${format(n[0])}–${format(n[n.length - 1])}`
    : "未提供";
}
function cover(a: MusicAlbum, className = "") {
  return a.coverUrl
    ? `<img class="${className}" src="${esc(a.coverUrl)}" alt="${esc(a.title)}专辑封面" loading="lazy">`
    : `<span class="cover-placeholder">♪</span>`;
}
const documentDecryption = new DocumentDecryption(
  "h1, .detail-artist, .album-facts span, .track-name strong, .album-about p",
  0.35,
);
const tabTransition = new ContentTransition();
const detailTransition = new SurfaceTransition(
  $("#music-detail"),
  $("#album-detail-content"),
  360,
  240,
  "right",
);
// The lyrics card enters and leaves with the same kind of movement as the album page
// itself (from and back to the right). The transition owns the panel's `hidden` flag, so
// closing animates first and only then hides the card — a plain `hidden = true` would cut
// it off mid-flight. Its `show` completion is also where the card re-measures itself.
const lyricsPanelTransition = new SurfaceTransition(
  $("#music-lyrics-panel"),
  $("#music-lyrics-panel"),
  320,
  // The exit mirrors the entry exactly: the same 320ms, the same ease-out curve and the
  // same 36px, instead of the app's default exit (240ms, an ease-in, 52px) which read as
  // slower to start and barely moving.
  320,
  "right",
  "cubic-bezier(0.22, 1, 0.36, 1)",
  undefined,
  "cubic-bezier(0.22, 1, 0.36, 1)",
  36,
);
// 听后感面板用**与歌词面板完全相同**的进出参数：同一块区域的两个视图，切换手感必须一致，
// 否则"从歌词切到评论"会比"进歌词"慢半拍，看起来像卡了一下。
const commentsPanelTransition = new SurfaceTransition(
  $("#music-comments-panel"),
  $("#music-comments-panel"),
  320,
  320,
  "right",
  "cubic-bezier(0.22, 1, 0.36, 1)",
  undefined,
  "cubic-bezier(0.22, 1, 0.36, 1)",
  36,
);
const browseTransition = new SurfaceTransition(
  $("#music-browse"),
  undefined,
  // Keep the existing reveal timing, but fade each overlay in its own layer.
  // Fading the parent traps its text below the night vignette until opacity=1.
  720,
  140,
  "up",
  "cubic-bezier(0.45, 0, 0.25, 1)",
  [$(".music-browse-veil"), $(".album-callout"), $(".music-navigation"), $(".music-keyhint")],
);
let detailIdentity = "",
  pendingDetailFocus = false;
const trackFocus = new MusicTrackFocus();
let pendingTrackReveal: { albumId: string; trackId: string } | undefined;
function cancelTrackReveal() {
  pendingTrackReveal = undefined;
  trackFocus.cancel();
}
// The pane is interactive while its entrance is finishing. Cancel a queued
// reveal too, so a click/scroll in that interval is never pulled back later.
for (const event of ["wheel", "pointerdown", "touchstart", "keydown"] as const) {
  $("#album-detail-content").addEventListener(event, () => {
    if (pendingTrackReveal) cancelTrackReveal();
  }, { passive: true });
}
let libraryRebuilding = false;
type LibraryIntent = AlbumSelection & { openAfter: boolean } |
  { mode: "archive" | "detail" };
let libraryIntent: LibraryIntent | undefined;
const presentation = new MusicPresentation({
  presentationReady: () => scene?.musicPresentationReady ?? false,
  archiveReady: () => scene?.musicArchiveReady ?? false,
  archiveInteractive: () => scene?.musicArchiveInteractive ?? false,
  enterCamera: () => {
    scene?.setMode("detail");
    effects.setScene("detail");
    effects.play("open");
  },
  returnCamera: () => {
    scene?.setMode("archive");
    effects.setScene("archive");
    effects.play("back");
  },
  select: ({ index, navigation }) => commitSelection(index, navigation),
  switchDetail: ({ index, navigation }) => commitSelection(index, navigation, true),
  mode: (next) => {
    mode = next;
    stage.dataset.mode = next;
    syncSelectionMotion();
    syncLyricsPanel();
    syncCommentsView();
  },
  prepareMenu: () => {
    activeTab = "tracks";
    detailTransition.hide(true);
    renderDetail();
    const content = $("#album-detail-content");
    content.style.removeProperty("opacity");
    content.style.removeProperty("transform");
    $("#music-detail").inert = true;
    $("#music-detail").setAttribute("aria-hidden", "true");
  },
  showMenu: () => {
    const detail = $("#music-detail"), content = $("#album-detail-content");
    // Re-measure once the pane has finished entering. While it is still animating —
    // or still hidden — the album column has no usable box, so the sync the render
    // triggered measured nothing and nothing else would retry it. The track list's
    // reserved row and the lyrics card's bottom edge both come from that measurement.
    detailTransition.show(preferences.reduced, syncLyricsPanelAlignment,
      [document.querySelector<HTMLElement>(".detail-transport")].filter((el): el is HTMLElement => !!el));
    // And once more the moment the pane has a layout again: the reveal above un-hides it,
    // so the reservation (which is what the list's bottom edge and the transport row's
    // height both come from) can be measured NOW instead of after the 360ms entrance.
    // Measuring here is exact even mid-animation: the reservation is the distance between
    // the first track row and the credits line, and the entrance transform shifts both by
    // the same amount. Without it the first album opened painted the fallback reservation
    // and then visibly corrected itself.
    syncLyricsPanelAlignment();
    // 视图切换后**重新对账两个右列面板**。挂在 setMode 里是刻意为之：面板的可见性同时依赖
    // "当前是专辑架还是详情页"，而这条依赖只有这里知道得最准。早先只靠间接的调用点，结果是
    // "退回专辑架再切回详情"时听后感面板不会自动恢复（实测 commentsHidden: true 一直不回来）。
    syncLyricsPanel();
    syncCommentsView();
    detail.inert = !!panel;
    detail.setAttribute("aria-hidden", "false");
    content.inert = false;
    content.scrollTop = 0;
    documentDecryption.reset(content, preferences.reduced);
    pendingDetailFocus = true;
  },
  hideMenu: (done) => {
    trackFocus.cancel();
    pendingDetailFocus = false;
    tabTransition.cancel();
    $("#music-detail").inert = true;
    $("#music-detail").setAttribute("aria-hidden", "true");
    detailTransition.hide(preferences.reduced, done);
  },
  hideBrowse: (done) => {
    $("#music-browse").inert = true;
    $("#music-browse").setAttribute("aria-hidden", "true");
    browseTransition.hide(preferences.reduced, done);
  },
  showBrowse: showBrowseSurface,
});
boot = new MusicBoot(stage, {
  reduced: () => preferences.reduced,
  onStart: () => {
    cancelTrackReveal();
    presentation.reset();
    detailTransition.hide(true);
    browseTransition.hide(true);
    scene?.setMode("hidden");
    syncSelectionMotion();
  },
  onComplete: (reason) => {
    const now = performance.now() / 1000;
    if (reason === "skip") scene?.showMusicArchiveImmediately(now);
    else scene?.finishMusicIntro(now);
    effects.setScene("archive");
    showBrowseSurface();
  },
});
function showBrowseSurface() {
  if (!albums.length || boot?.active) return;
  browseTransition.show(preferences.reduced);
  $("#music-browse").inert = !!panel;
  $("#music-browse").setAttribute("aria-hidden", "false");
  syncSelectionMotion();
  if (!panel) $("[data-action=open]").focus({ preventScroll: true });
}
function savePrefs() {
  save("rhine-music-preferences", preferences);
}
function setTheme(theme: Theme) {
  if (theme !== "day" && theme !== "dusk" && theme !== "night") theme = "day";
  if (theme === preferences.theme) return;
  preferences.theme = theme;
  stage.dataset.theme = theme;
  scene?.setTheme(theme, !preferences.reduced);
  viewer?.setTheme(theme);
  document
    .querySelectorAll<HTMLButtonElement>("button[data-theme]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.theme === theme)),
    );
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      "content",
      theme === "night" ? "#0a1220" : theme === "dusk" ? "#cbd6df" : "#e8e5e1",
    );
  savePrefs();
}
function fit() {
  // Use the same stage dimensions and aspect boundary as the scene framing.
  stage.dataset.layout = viewportLayout(stage.clientWidth, stage.clientHeight, false).kind;
  scene?.resize();
  viewer?.resize();
  if (mode === "detail") {
    syncTabIndicator(false);
    documentDecryption.refresh();
  }
}
window.addEventListener("resize", fit);

async function request<T>(url: string, body?: unknown, method?: string): Promise<T> {
  const response = await fetch(
    url,
    body === undefined && method === undefined
      ? {}
      : {
          method: method || "POST",
          ...(body === undefined ? {} : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          }),
        },
  );
  const data = await response.json().catch(() => null);
  if (!response.ok || !data)
    throw new Error(data?.error || `本地服务请求失败 (${response.status})`);
  return data as T;
}
async function loadLibrary(force = false) {
  // Keep the selected cards and cover atlas stable for the opening shot.
  if (boot?.active) {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(() => void loadLibrary(force), 1000);
    return;
  }
  if (refreshing) return;
  refreshing = true;
  const stateVersion = libraryStateVersion;
  try {
    const next = await request<MusicLibrary>("/api/library");
    apiAvailable = true;
    if (stateVersion === libraryStateVersion && !boot?.active) await receiveLibrary(next, force);
  } catch (error) {
    apiAvailable = false;
    // The bundled demo is local and does not depend on the music service.
    // Keep its entry point available when an empty library cannot be fetched.
    if (!albums.length) $("#music-empty").hidden = false;
    updateStatus();
    updateIntroductionStatus();
    if (force)
      notify(
        `${(error as Error).message}。请使用 npm run music 启动本地音乐服务。`,
      );
  } finally {
    refreshing = false;
  }
  clearTimeout(pollTimer);
  pollTimer = setTimeout(
    () => void loadLibrary(),
    library.scan.running ||
      library.enrich?.running ||
      library.introductions?.running
      ? 1400
      : 12000,
  );
}
async function receiveLibrary(next: MusicLibrary, force = false) {
  const previousScan = library.scan;
  const scanCompleted = libraryReceived && !next.scan.running && !next.scan.error &&
    !!next.scan.finishedAt && next.scan.finishedAt !== previousScan.finishedAt;
  const scanFailed = libraryReceived && previousScan.running && !next.scan.running && !!next.scan.error;
  libraryReceived = true;
  const previousIntroductionRun = library.introductions;
  const changed =
    JSON.stringify(next.albums) !== JSON.stringify(library.albums) ||
    JSON.stringify(next.genres) !== JSON.stringify(library.genres);
  library = next;
  if (library.introductions?.running) introductionRequestError = "";
  if (changed || force) await applyLibrary();
  updateStatus();
  if (panel === "library") updateScanStatus();
  updateIntroductionStatus();
  if (
    previousIntroductionRun?.running &&
    library.introductions &&
    !library.introductions.running
  ) {
    const result = library.introductions;
    notify(
      result.error ||
        `专辑介绍查询完成：更新 ${result.updated} 张，未找到可靠资料 ${result.notFound} 张，查询失败 ${result.failed} 张。`,
    );
  }
  if (scanFailed) notify(`音乐库扫描失败：${next.scan.error}`);
  if (scanCompleted && !scanRefreshTimer) {
    notify("音乐库扫描完成，2 秒后自动刷新页面。");
    scanRefreshTimer = setTimeout(() => location.reload(), 2000);
  }
}
async function applyLibrary() {
  const hadAlbums = albums.length > 0;
  const previousId = currentAlbum()?.id;
  const previousDetail = JSON.stringify(currentAlbum());
  const visualKey = (items: MusicAlbum[], groups: MusicGenre[]) =>
    JSON.stringify([
      items.map((a) => [a.id, a.title, a.artist, a.genreId, a.coverUrl]),
      groups.map((g) => [g.id, g.name]),
    ]);
  const oldVisual = visualKey(albums, genres);
  if (library.albums.length) demo = false;
  let visualSamples = demoAlbums;
  if (demo && new URLSearchParams(location.search).get("profile") === "1") {
    const requestedCount = Number(new URLSearchParams(location.search).get("stress"));
    const count = Number.isInteger(requestedCount) ? Math.max(0, Math.min(500, requestedCount)) : 0;
    if (count > demoAlbums.length) {
      visualSamples = Array.from({ length: count }, (_, index) => {
        const source = demoAlbums[index % demoAlbums.length];
        return {
          ...source,
          id: `${source.id}-stress-${index + 1}`,
          title: `${source.title} ${String(index + 1).padStart(2, "0")}`,
          folder: `${source.folder} · 合成压力样本`,
        };
      });
    }
  }
  albums = orderMusicAlbums(demo ? visualSamples : library.albums, preferences.sortMode);
  genres = demo ? demoGenres : library.genres;
  setMusicAlbums(albums, genres, preferences.sortMode);
  selected = Math.max(
    0,
    records.findIndex((r) => r.id === previousId),
  );
  columnMemory = new Map(
    archiveColumns.map((name, lane) => [
      name,
      records[columnFiles(lane)[0]]?.id,
    ]),
  );
  if (scene && ready && oldVisual !== visualKey(albums, genres)) {
    const reopen = presentation.openingOrDetail;
    cancelTrackReveal();
    libraryRebuilding = true;
    libraryIntent = undefined;
    presentation.reset();
    detailTransition.hide(true);
    browseTransition.hide(true);
    try {
      if (scene.isMusicLibraryScene !== musicLibrary) {
        scene.dispose();
        scene = new ArchiveScene($("#three-scene"));
        if (new URLSearchParams(location.search).get("lighting") !== "baseline")
          scene.enableSelectionLighting();
        await Promise.all([
          scene.load(),
          document.fonts.load("400 20px MiSans"),
          document.fonts.load("600 20px MiSans"),
        ]);
        ready = true;
        $("#three-scene canvas").setAttribute(
          "aria-label",
          `三维专辑阵列，左右切${sortLabel.column}，上下切专辑`,
        );
        stage.classList.toggle("reduce-motion", preferences.reduced);
        scene.setTheme(preferences.theme);
        scene.setQuality(renderQuality);
        scene.setReduced(preferences.reduced);
        bindSceneNavigation(scene);
      }
      await scene.refreshLibrary(selected);
    }
    finally { libraryRebuilding = false; }
    const intent = libraryIntent as LibraryIntent | undefined;
    libraryIntent = undefined;
    scene.setMode("archive");
    if (intent && "index" in intent)
      select(intent.index, intent.navigation, intent.openAfter, intent.route);
    else if ((intent ? intent.mode === "detail" : reopen) && albums.length)
      presentation.open();
    else showBrowseSurface();
  }
  if (!albums.length) {
    cancelTrackReveal();
    presentation.reset();
  }
  stage.dataset.mode = mode;
  syncLyricsPanel();
  syncCommentsView();
  $("#music-empty").hidden = albums.length > 0;
  // Ordinary index refreshes must not reveal a page while its peer is exiting.
  if (!ready || !hadAlbums || !albums.length) {
    if (albums.length && mode === "archive") browseTransition.show(true);
    else browseTransition.hide(true);
    // Detail is revealed exclusively by the camera completion gate.
    if (presentation.phase !== "detail") detailTransition.hide(true);
    $("#music-browse").inert = !albums.length || mode !== "archive" || !!panel;
    $("#music-detail").inert = !albums.length || mode !== "detail" || !!panel;
    $("#music-browse").setAttribute(
      "aria-hidden",
      String(!albums.length || mode !== "archive"),
    );
    $("#music-detail").setAttribute(
      "aria-hidden",
      String(!albums.length || mode !== "detail"),
    );
  }
  updateSelection();
  if (mode === "detail" && previousDetail !== JSON.stringify(currentAlbum()))
    renderDetail();
  updateStatus();
  // 喜欢集合要在这里读一次，否则刷新后红心是灭的（它读的是缓存，不查库就不会亮）。
  // 不 await：红心晚一拍点亮可以接受，但不能拖慢专辑架的首帧。
  void refreshLikedTracks();
}
function updateStatus() {
  const n = library.albums.length,
    tracks = library.albums.reduce((sum, a) => sum + a.tracks.length, 0);
  const label = !apiAvailable
    ? "本地音乐服务尚未连接"
    : library.scan.running
      ? "正在扫描音乐库…"
      : library.enrich?.running
        ? `补充在线资料 ${library.enrich.completed}/${library.enrich.total}`
        : library.introductions?.running
          ? `查询专辑介绍 ${library.introductions.completed}/${library.introductions.total}`
          : demo
            ? "演示专辑 · 加入音乐后显示真实封面"
            : "";
  $("#library-status span").textContent = label;
  $("#library-status").hidden = !label;
  $("#library-status").classList.toggle(
    "working",
    !!library.scan.running ||
      !!library.enrich?.running ||
      !!library.introductions?.running,
  );
  $("#library-count").textContent = demo
    ? "DEMONSTRATION"
    : `${n} ALBUMS / ${tracks} TRACKS`;
}
function updateSelection(navigation?: ArchiveNavigation) {
  const a = currentAlbum();
  if (!a) {
    selectionInitialized = false;
    textMotion.finish();
    titleMotion.finish();
    return;
  }
  const location = fileLocation(selected),
    files = columnFiles(location.lane),
    idx = files.indexOf(selected);
  const animated = selectionInitialized && selectionMotionEnabled();
  selectionInitialized = true;
  textMotion.update(
    {
      number: idx + 1,
      total: files.length,
      genresTotal: archiveColumns.length,
      code: selected + 1,
      genreIndex: location.lane + 1,
      genre: archiveColumns[location.lane],
      genreName: archiveColumns[location.lane],
      format: demo
        ? "DEMO"
        : [...new Set(a.tracks.map((t) => t.format))].join(" / "),
      artist: a.artist,
      meta: [
        a.year ? String(a.year) : "年份未提供",
        demo ? "演示封面" : `${a.tracks.length} 首曲目`,
        a.tracks.length ? time(albumDuration(a)) : "",
      ]
        .filter(Boolean)
        .join("  /  "),
    },
    animated,
    navigation,
  );
  titleMotion.update(a.title, animated);
  $("#selection-title").title = a.title;
  tickMotion.update(
    files.map((index) => ({ index, id: records[index].id, title: records[index].title })),
    selected,
    preferences.reduced,
    navigation,
  );
  $("#detail-card-id").textContent =
    `ALBUM / ${String(selected + 1).padStart(3, "0")}`;
  // Hidden archive content can prepare its static reels before the reveal.
  if (!animated) syncSelectionMotion();
}
function commitSelection(index: number, navigation?: ArchiveNavigation, keepDetail = false) {
  selected = wrap(index, records.length);
  columnMemory.set(
    archiveColumns[fileLocation(selected).lane],
    records[selected].id,
  );
  if (keepDetail) scene?.switchMusicAlbum(selected, navigation);
  else scene?.select(selected, navigation);
  updateSelection(navigation);
  effects.play(
    navigation && "axis" in navigation && navigation.axis === "lane"
      ? "column"
      : "tick",
  );
}
function select(index: number, navigation?: ArchiveNavigation, openAfter = presentation.openingOrDetail, route?: AlbumSelection["route"]) {
  if (!records.length || !ready || boot?.active || index < 0) return;
  if (route !== "archive") cancelTrackReveal();
  const pending = libraryRebuilding && libraryIntent && "index" in libraryIntent
    ? libraryIntent : presentation.pendingSelection;
  const previous = pending?.navigation;
  if (pending) {
    // Coalesced key presses still reach the matching physical loop cell.
    navigation = previous && navigation && "axis" in previous && "axis" in navigation && previous.axis === navigation.axis
      ? { axis: navigation.axis, direction: previous.direction + navigation.direction }
      : undefined;
  }
  if (libraryRebuilding) {
    libraryIntent = { index: wrap(index, records.length), navigation, openAfter, route };
    return;
  }
  presentation.select({ index: wrap(index, records.length), navigation, route }, openAfter);
}
function bindSceneNavigation(target: ArchiveScene) {
  target.onSelect = (index, cell) => {
    if (!boot?.active && presentation.phase === "archive" && !panel)
      select(index, cell ? { cell } : undefined);
  };
  target.onNavigate = (axis, direction) => {
    if (!boot?.active && presentation.phase === "archive" && !panel)
      axis === "lane" ? stepGenre(direction) : stepAlbum(direction);
  };
}
/** Playback can reuse its open album; other targets take the archive route. */
function revealAlbum(albumId: string, trackId?: string, options: { reuseOpenAlbum?: boolean } = {}) {
  closePanel(() => {
    cancelTrackReveal();
    if (!ready || boot?.active) return;
    const index = records.findIndex((record) => record.id === albumId);
    const album = albums.find((item) => item.id === albumId);
    if (index < 0 || !album || (trackId && !album.tracks.some((track) => track.id === trackId))) {
      notify("这张专辑或歌曲已不在当前音乐库中，请刷新音乐库后重试。");
      return;
    }
    if (options.reuseOpenAlbum && trackId && !libraryRebuilding &&
      currentAlbum()?.id === albumId && presentation.openingOrDetail &&
      !presentation.pendingSelection &&
      ["detail", "opening", "switching"].includes(presentation.phase)) {
      // Preserve the camera and current scroll position. If the album is still
      // entering, the usual detail gate below will wait before revealing it.
      setTab("tracks");
      pendingTrackReveal = { albumId, trackId };
      return;
    }
    if (trackId) pendingTrackReveal = { albumId, trackId };
    select(index, undefined, true, "archive");
  });
}
function navigationSelection() {
  if (libraryRebuilding && libraryIntent && "index" in libraryIntent) return libraryIntent.index;
  return presentation.pendingSelection?.index ?? selected;
}
function stepAlbum(direction: number) {
  if (!records.length) return;
  // An album step moves the camera and the selection light over the next couple of
  // seconds; hold the display rate for that flight instead of dropping to the idle
  // cadence the moment the pointer stops.
  keepActive(TRANSITION_HOLD_MS);
  const cursor = navigationSelection();
  const files = columnFiles(fileLocation(cursor).lane);
  if (files.length > 1)
    select(files[wrap(files.indexOf(cursor) + direction, files.length)], {
      axis: "row",
      direction,
    });
}
function stepGenre(direction: number) {
  if (!records.length || archiveColumns.length < 2) return;
  const lane = wrap(
    fileLocation(navigationSelection()).lane + direction,
    archiveColumns.length,
  );
  const remembered = columnMemory.get(archiveColumns[lane]);
  const index = records.findIndex((r) => r.id === remembered);
  select(index >= 0 ? index : columnFiles(lane)[0], {
    axis: "lane",
    direction,
  });
}
function setMode(next: "archive" | "detail") {
  if (boot?.active) return;
  if (next === "archive") cancelTrackReveal();
  if (libraryRebuilding) { libraryIntent = { mode: next }; return; }
  if (next === "detail") {
    if (currentAlbum()) presentation.open();
  } else presentation.back();
}
function syncTabIndicator(animate = true) {
  const button = document.querySelector<HTMLElement>(`#tab-${activeTab}`);
  const indicator = document.querySelector<HTMLElement>(".music-tab-indicator");
  if (!button || !indicator) return;
  indicator.style.transition = animate && !preferences.reduced ? "" : "none";
  indicator.style.transform = `translateX(${button.offsetLeft}px) scaleX(${button.offsetWidth})`;
}
function setTab(tab: "tracks" | "about") {
  if (activeTab === tab) return;
  cancelTrackReveal();
  activeTab = tab;
  document.querySelectorAll<HTMLElement>("[data-tab]").forEach((button) => {
    const active = button.dataset.tab === tab;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  syncTabIndicator();
  const a = currentAlbum();
  if (!a) return;
  const content = $("#album-tab-content");
  content.innerHTML =
    tab === "tracks" ? trackList(a, a.discCount || 1) : albumAbout(a);
  content.setAttribute("aria-labelledby", `tab-${tab}`);
  documentDecryption.refresh();
  tabTransition.reveal(content, preferences.reduced);
  updatePlayingRows();
  effects.play("ui-tick");
}
function renderDetail() {
  const a = currentAlbum();
  if (!a) return;
  trackFocus.cancel();
  const discs =
    a.discCount || Math.max(1, ...a.tracks.map((t) => t.discNumber || 1));
  const bits =
    a.tracks.length && a.tracks.every((t) => t.lossless === false)
      ? "有损编码"
      : valueRange(
          a.tracks.map((t) => t.bitsPerSample),
          (n) => `${n} bit`,
        );
  const rate = valueRange(
    a.tracks.map((t) => t.sampleRate),
    (n) => `${Number((n / 1000).toFixed(1))} kHz`,
  );
  const bitrate = valueRange(
    a.tracks.map((t) => t.bitrate),
    (n) => `${Math.round(n / 1000)} kbps`,
  );
  const fields = [
    ["RELEASE / 发行年份", a.year || "未提供"],
    ["ARTIST / 歌手", a.artist],
    ["GENRE / 流派", genreName(a.genreId)],
    ["VOLUMES / 内含 CD", demo ? "—" : `${discs} CD · ${a.tracks.length} 首`],
    ["FORMAT / 文件格式", formatList(a)],
    ["RESOLUTION / 位深与采样率", `${bits} / ${rate}`],
    ["BITRATE / 码率", bitrate],
    ["DURATION / 总时长", time(albumDuration(a))],
  ];
  const article = $("#album-detail-content"),
    sameAlbum = detailIdentity === a.id,
    scroll = sameAlbum ? article.scrollTop : 0;
  detailIdentity = a.id;
  // The lyrics panel covers the column from the album title down to the last
  // track row, so only that span is wrapped and hidden while the panel is up.
  // Three blocks deliberately stay outside it:
  //   - the overline, whose album switcher sits above the panel's top edge;
  //   - the scrolling region (it only ever holds the covered span);
  //   - the producer credits, which are a pinned footer.
  // The column is one scroll box, so the credits follow the track list and their
  // position changes with the album. Pinning them as a footer instead puts them
  // on the same bottom line as the cover caption in the opposite corner, and
  // makes both move together as the window resizes.
  article.innerHTML = `<div class="detail-overline"><span>ALBUM ${String(selected + 1).padStart(3, "0")}</span><div class="detail-album-navigation" role="group" aria-label="切换专辑"><button data-action="prev" aria-label="上一张专辑">↑ 上一张</button><button data-action="next" aria-label="下一张专辑">下一张 ↓</button></div></div>
    <div class="album-detail-scroll">
    <div class="album-detail-body">
    <h1 title="${esc(a.title)}">${albumTitleMarkup(a.title)}</h1><p class="detail-artist"><span class="detail-artist-name">${esc(a.artist)}</span>${a.offline ? '<span class="offline-badge">目录离线</span>' : ""}</p>
    <div class="album-facts">${fields.map(([name, value]) => `<div><small>${name}</small><span>${esc(String(value))}</span></div>`).join("")}</div>
    <div class="music-tabs" role="tablist" aria-label="专辑信息"><button role="tab" id="tab-tracks" data-tab="tracks" tabindex="${activeTab === "tracks" ? 0 : -1}" aria-selected="${activeTab === "tracks"}" aria-controls="album-tab-content"><span>01</span> 歌单</button><button role="tab" id="tab-about" data-tab="about" tabindex="${activeTab === "about" ? 0 : -1}" aria-selected="${activeTab === "about"}" aria-controls="album-tab-content"><span>02</span> 专辑介绍</button><i class="music-tab-indicator" aria-hidden="true"></i></div>
    <div id="album-tab-content" role="tabpanel" aria-labelledby="tab-${activeTab}">${activeTab === "tracks" ? trackList(a, discs) : albumAbout(a)}</div>
    </div>
    </div>
    <footer class="album-detail-footer">${producerBlock(a)}</footer>`;
  article.scrollTop = scroll;
  syncTabIndicator(false);
  documentDecryption.reset(
    article,
    preferences.reduced || scene?.decryptionFrame.phase === "clear",
  );
  updatePlayingRows();
  // The tab content decides where the first track row sits, so re-measure the
  // collapsed-card alignment after every detail render and tab switch.
  syncLyricsPanelAlignment();
  // And quietly prepare this album's lyrics while its track list is being read.
  void prefetchAlbumLyrics(currentAlbum());
}
function trackList(a: MusicAlbum, discs: number) {
  if (!a.tracks.length)
    return `<div class="empty-tracks"><strong>${demo ? "这是一张封面演示卡片" : "这个专辑还没有可播放曲目"}</strong><p>${demo ? "用于检查封面原始比例与卡片材质。扫描本地音乐库后，这里会显示真实曲目。" : "请检查音乐文件是否完整，并重新扫描音乐库。"}</p><button data-action="library">打开音乐库设置 ↗</button></div>`;
  let disc = -1;
  // 序号 = **列表里的位置**，永远是 01,02,03… 唯一且连续。
  //
  // 为什么不用文件里的 trackNumber 显示：那个值表达的是"在原版专辑里的第几首"，用在**列表**
  // 里会出三类问题，主人正好撞上第一类：
  //   ① 同一首歌的不同格式各带同一个编号 → 两行都写 06（「十一月的萧邦」的 `枫` FLAC/WAV）；
  //   ② 专辑只收录了原专辑的一部分 → 一行显示 05，看起来像丢了 01–04；
  //   ③ 缺标签的与带标签的混在一列 → 一半空白一半有数字。
  // 列表序号本来就该回答"这是列表里第几行"。曲目顺序仍由服务端的 trackNumber 排序决定
  // （见 music-library 的 tracks.sort），所以"专辑内的正确次序"没有丢，只是不再拿它当行号。
  return `<div class="track-list" aria-label="专辑歌曲列表">${a.tracks
    .map((t, index) => {
      const discNo = t.discNumber || 1;
      const head =
        discs > 1 && discNo !== disc
          ? `<div class="disc-heading">DISC ${String(discNo).padStart(2, "0")}</div>`
          : "";
      disc = discNo;
      const label = String(index + 1).padStart(2, "0");
      // 行号回答"列表第几行"，这里再给出**原专辑编号**，两者并存才不会有歧义 ——
      // 排序按原编号、显示用行号，所以「枫」会排在最前却是 01，而它的原编号是 06。
      // 主人要求写成 `编号：06` 这种字面样式（含那个全角冒号），没有标签就写"编号：未知"，
      // 不留空白（空白看起来像渲染出错）。
      const original =
        typeof t.trackNumber === "number" && t.trackNumber > 0
          ? String(t.trackNumber).padStart(2, "0")
          : "未知";
      const originalText = `编号：${original}`;
      return `${head}<div class="track-item"><button class="track-row" data-track="${esc(t.id)}" ${t.offline ? "disabled" : ""} aria-label="播放 ${esc(t.title)}，${esc(originalText)}"><span class="track-number">${label}</span><span class="track-name"><strong>${esc(t.title)}</strong><small>${esc(t.artist)}</small></span><span class="track-format">${esc(t.format)}${!t.browserPlayable ? '<i title="需要兼容的播放内核"> ↗</i>' : ""}</span><span class="track-duration">${time(t.duration)}</span><span class="track-original">${esc(originalText)}</span></button>${!demo ? `<div class="track-tools"><button data-action="enqueue-track" data-track-id="${esc(t.id)}" ${t.offline ? "disabled" : ""} aria-label="加入播放队列：${esc(t.title)}" title="加入播放队列">＋</button><button data-action="choose-playlist" data-track-id="${esc(t.id)}" aria-label="加入歌单：${esc(t.title)}" title="加入歌单">♫</button></div>` : ""}</div>`;
    })
    .join("")}</div>`;
}
function albumAbout(a: MusicAlbum) {
  return `<section class="album-about"><small>ABOUT THIS ALBUM</small>
    ${a.description ? `<p>${esc(a.description)}</p>${a.descriptionSource ? `<a class="text-button" href="${esc(a.descriptionSource.url)}" target="_blank" rel="noopener">来源：${esc(a.descriptionSource.name)} ↗</a>${a.descriptionSource.license ? `<small class="introduction-license">${esc(a.descriptionSource.license)}</small>` : ""}` : ""}` : `<h3>专辑介绍待补充</h3><p>从公开百科核对专辑与歌手后读取介绍，附上来源并保存在本机。无法确认对应专辑时保留空白。</p>`}
    ${!demo ? `<button data-action="introduction-album" class="text-button" ${introductionsStarting || library.introductions?.running ? "disabled" : ""}>${a.description ? "更新" : "查询"}专辑介绍 ↗</button><p class="introduction-feedback" data-introduction-feedback="${esc(a.id)}" role="status">${esc(introductionAlbumStatus(a))}</p>` : ""}
    <div class="source-note"><span>本地目录</span><code>${esc(a.folder)}</code></div><div class="genre-tags">${a.rawGenres.map((g) => `<span>${esc(g)}</span>`).join("")}</div></section>`;
}
function introductionAlbumStatus(a: MusicAlbum) {
  const lookup = a.introduction;
  if (lookup?.status === "error")
    return `介绍查询失败：${lookup.error || "资料来源暂时无法访问，请稍后重试。"}${a.description ? " 已有介绍仍然保留。" : ""}`;
  if (lookup?.status === "uncertain")
    return `找到可能的同名专辑，尚无法可靠确认，暂未采用介绍。${a.description ? " 已保留原有介绍。" : ""}`;
  if (lookup?.status === "not-found")
    return a.description
      ? "本次未找到可靠更新，已保留原有介绍。"
      : "未找到可核实的专辑介绍，可以稍后重试。";
  if (a.description) return "介绍已保存在本机，可离线阅读。";
  return "尚未查询专辑介绍。";
}
function updateIntroductionStatus() {
  const job = library.introductions;
  const running = introductionsStarting || !!job?.running;
  const button = document.querySelector<HTMLButtonElement>(
    "#introduction-refresh",
  );
  if (button) {
    button.disabled = running || !apiAvailable || !library.albums.length;
    button.textContent = running
      ? "正在查询专辑介绍…"
      : "查询 / 更新专辑介绍 ↗";
  }
  for (const control of document.querySelectorAll<HTMLButtonElement>(
    '[data-action="introduction-album"]',
  ))
    control.disabled = running || !apiAvailable;
  for (const feedback of document.querySelectorAll<HTMLElement>(
    "[data-introduction-feedback]",
  )) {
    const album = albums.find(
      (a) => a.id === feedback.dataset.introductionFeedback,
    );
    if (album)
      feedback.textContent = running
        ? "正在查询专辑介绍，已有资料仍可阅读。"
        : introductionAlbumStatus(album);
  }
  const progress = document.querySelector<HTMLProgressElement>(
    "#introduction-progress",
  );
  if (progress) {
    progress.hidden = !running;
    progress.max = Math.max(1, job?.total || 0);
    progress.value = job?.completed || 0;
    if (introductionsStarting && !job?.running)
      progress.removeAttribute("value");
  }
  const missing = library.albums.filter((album) => !album.description?.trim());
  const coverage = document.querySelector<HTMLElement>(
    "#introduction-coverage",
  );
  if (coverage)
    coverage.textContent = `已有介绍 ${library.albums.length - missing.length} / ${library.albums.length} 张 · 尚缺 ${missing.length} 张`;
  const status = document.querySelector<HTMLElement>("#introduction-status");
  if (status)
    status.textContent = !apiAvailable
      ? "本地音乐服务尚未连接，连接后可查询介绍。"
      : introductionRequestError
        ? `无法开始查询：${introductionRequestError}`
        : !library.albums.length
          ? "扫描本地音乐文件夹后，即可查询专辑介绍。"
          : introductionsStarting
            ? "正在提交专辑介绍查询…"
            : job?.running
              ? `已处理 ${job.completed} / ${job.total} 张 · 更新 ${job.updated} 张${job.currentAlbum ? `\n正在查询：${job.currentAlbum}` : ""}`
              : job?.error
                ? `查询未完成：${job.error}`
                : job && job.total > 0
                  ? `上次查询：处理 ${job.completed} / ${job.total} 张 · 更新 ${job.updated} 张 · 未找到可靠资料 ${job.notFound} 张 · 查询失败 ${job.failed} 张`
                  : "查询会核对专辑、歌手与年份；无法确认的结果不会覆盖已有介绍。";
  const details = document.querySelector<HTMLDetailsElement>(
    "#introduction-missing",
  );
  if (details) {
    details.hidden = !missing.length;
    details.querySelector("summary")!.textContent =
      `查看尚缺介绍的 ${missing.length} 张专辑`;
    details.querySelector("ul")!.innerHTML = missing
      .map(
        (album) =>
          `<li><strong>${esc(album.title)}</strong><span>${esc(album.artist)} · ${esc(introductionAlbumStatus(album))}</span></li>`,
      )
      .join("");
  }
}
function producerBlock(a: MusicAlbum) {
  return `<section class="producer-section"><div><small>ALBUM CREDITS / 制作人员</small>${!demo ? '<button data-action="enrich-album">补充在线资料 ↗</button>' : ""}</div>${a.producers.length ? `<dl>${a.producers.map((p) => `<div><dt>${esc(p.role)}${p.trackTitle ? ` · ${esc(p.trackTitle)}` : ""}</dt><dd>${esc(p.name)}</dd></div>`).join("")}</dl>` : "<p>暂无制作资料。本地标签优先，MusicBrainz 资料可查询并缓存在本机。</p>"}${a.online?.status === "uncertain" ? "<p>找到多个可能的发行版本，暂未自动采用资料。</p>" : ""}${a.online?.error ? `<p>${esc(a.online.error)}</p>` : ""}</section>`;
}
function updatePlayingRows() {
  document
    .querySelectorAll<HTMLButtonElement>("[data-track]")
    .forEach((row) => {
      const active = row.dataset.track === playerState?.currentTrack?.id;
      row.classList.toggle("playing", active);
      row.setAttribute("aria-current", String(active));
    });
}
let lastPlayerError = "";
player.subscribe((state) => {
  playerState = state;
  if ((state.currentTrack?.id ?? null) !== lyricTrackId)
    void loadLyrics(state.currentTrack);
  else syncLyricsPosition(player.playbackTime);
  syncLyricsPanel();
  syncCommentsView();
  syncLyricClock();
  syncQueuePanel();
  syncTransportControls();
  // 红心跟着当前曲目走：换歌就要重新点亮/熄灭，而它读的是本地缓存的喜欢集合，不发请求。
  syncLikeButton();
  syncCommentsButton();
  syncMoreMenu();
  syncTransportTrack();
  $("#play-pause").setAttribute("aria-pressed", String(state.playing));
  $("#play-pause").setAttribute(
    "aria-label",
    state.playing ? "暂停" : "播放",
  );
  $("#play-pause").title = state.currentTrack
    ? `${state.playing ? "暂停" : "播放"}：${state.currentTrack.title}`
    : "播放当前专辑";
  if (state.error && state.error !== lastPlayerError) notify(state.error);
  lastPlayerError = state.error || "";
  updatePlayingRows();
});

let panelFocus: HTMLElement | null = null;
let panelTransition: SurfaceTransition | undefined,
  panelClosing = false,
  pendingPanelAfter: (() => void) | undefined;
function closePanel(after?: () => void) {
  if (!panel) {
    after?.();
    return;
  }
  pendingPanelAfter = after;
  if (panelClosing) return;
  panelClosing = true;
  panelTransition?.hide(preferences.reduced, () => {
    panel = null;
    panelClosing = false;
    panelTransition?.dispose();
    panelTransition = undefined;
    $("#music-panel-root").innerHTML = "";
    for (const node of [
      $("#music-browse"),
      $("#music-detail"),
      $(".music-header"),
      $("#three-scene"),
    ])
      node.inert = false;
    $("#music-browse").inert = presentation.phase !== "archive";
    $("#music-detail").inert = presentation.phase !== "detail";
    panelFocus?.focus({ preventScroll: true });
    const next = pendingPanelAfter;
    pendingPanelAfter = undefined;
    next?.();
  });
}
function openPanel(next: Panel) {
  if (!next) return closePanel();
  cancelTrackReveal();
  panelTransition?.dispose();
  pendingPanelAfter = undefined;
  panelClosing = false;
  if (!panel) panelFocus = document.activeElement as HTMLElement;
  panel = next;
  const titles = {
    library: ["MUSIC LIBRARY", "本地音乐库"],
    search: ["FIND MUSIC", "搜索专辑与歌曲"],
    settings: ["SYSTEM SETTINGS", "播放与画质"],
    playlists: ["YOUR PLAYLISTS", "我的歌单"],
    queue: ["UP NEXT", "播放队列"],
    comments: ["LISTENING NOTES", "听后感"],
  };
  $("#music-panel-root").innerHTML =
    `<div class="music-panel-scrim" data-action="dismiss-panel"><section class="music-panel" role="dialog" aria-modal="true" aria-labelledby="music-panel-title"><div class="panel-heading"><div><small>${titles[next][0]}</small><h2 id="music-panel-title">${titles[next][1]}</h2></div><button data-action="close-panel" aria-label="关闭">×</button></div><div id="panel-body"></div></section></div>`;
  for (const node of [
    $("#music-browse"),
    $("#music-detail"),
    $(".music-header"),
    $("#three-scene"),
  ])
    node.inert = true;
  const scrim = $(".music-panel-scrim");
  scrim.hidden = true;
  panelTransition = new SurfaceTransition(scrim, $(".music-panel"));
  panelTransition.show(preferences.reduced);
  effects.play("page-open");
  if (next === "library") renderLibraryPanel();
  if (next === "search") renderSearchPanel();
  if (next === "settings") renderSettingsPanel();
  if (next === "playlists") renderPlaylistPanel();
  if (next === "queue") renderQueuePanel();
  // 听后感不再走这套模态面板：它是和歌词并列的第三个右列视图（见 syncCommentsView）。
  (
    document.querySelector<HTMLElement>("#album-search") ||
    $("#music-panel-root button")
  )?.focus({ preventScroll: true });
}
function renderLibraryPanel() {
  $("#panel-body").innerHTML =
    `<p class="panel-intro">根目录中的每首单曲各是一张卡片，优先使用自身内嵌封面。子文件夹按专辑展示，优先使用文件夹封面。</p><label class="field-label" for="music-roots">音乐文件夹<span>多个目录各占一行</span></label><textarea id="music-roots" rows="3" placeholder="/Users/你的用户名/Music">${esc(library.roots.map((r) => r.path).join("\n"))}</textarea><div class="panel-actions"><button class="primary-button" data-action="scan">保存目录并扫描 ↗</button><button data-action="rescan">重新扫描</button></div><div id="scan-status" class="scan-status"></div><div class="library-metrics"><div><b>${library.albums.length}</b><span>专辑</span></div><div><b>${library.albums.reduce((n, a) => n + a.tracks.length, 0)}</b><span>曲目</span></div><div><b>${library.genres.filter((g) => library.albums.some((a) => a.genreId === g.id)).length}</b><span>流派</span></div></div><section class="panel-section"><h3>在线资料与本地分类</h3><p>向 MusicBrainz 查询专辑名称与艺术家，补充流派和制作人员；音乐文件留在本机。已有资料使用缓存，人工分类优先保留。</p><button data-action="enrich-library" class="text-button">补充缺失的在线资料 ↗</button><button data-action="edit-genres" class="text-button">编辑流派归并规则 ↗</button></section><section class="panel-section"><h3>封面显示</h3><p>方形、竖版、横版封面均保持原始比例，完整放入卡片正面。没有封面时显示专辑名称占位，不使用其他专辑的图片。</p>${!library.albums.length ? '<button data-action="demo" class="text-button">查看演示封面 ↗</button>' : ""}</section>`;
  updateScanStatus();
  const configSection = document.createElement("section");
  configSection.className = "panel-section";
  configSection.id = "online-config";
  $("#panel-body").append(configSection);
  void (async () => {
    try {
      const config = await request<{
        musicBrainzContact?: string;
        musicBrainzConfigured?: boolean;
        onlineEnabled?: boolean;
      }>("/api/config");
      if (!configSection.isConnected) return;
      configSection.innerHTML = `<h3>资料库连接</h3><label class="field-label" for="metadata-contact">MusicBrainz 联系邮箱或项目网址</label><input id="metadata-contact" type="text" value="${esc(config.musicBrainzContact || "")}" placeholder="你的联系邮箱或公开项目网址"><p>按 MusicBrainz 要求用于标识本应用的资料请求，不用于注册或订阅。</p><label class="settings-row"><span>扫描后自动补充新专辑资料<small>已有缓存不重复查询；断网仍可浏览与播放</small></span><input type="checkbox" id="online-enabled" ${config.onlineEnabled ? "checked" : ""}></label><button class="text-button" data-action="save-online">保存资料库设置 ↗</button><p>${config.musicBrainzConfigured ? "资料库请求标识已配置。" : "尚未配置；本地曲库和播放已可使用。"}</p>`;
    } catch (error) {
      if (configSection.isConnected)
        configSection.innerHTML = `<p>${esc((error as Error).message)}</p>`;
    }
  })();
}
function updateScanStatus() {
  const el = document.querySelector("#scan-status");
  if (el)
    el.textContent = library.scan.running
      ? "正在扫描，已有曲库可以继续浏览…"
      : library.scan.error ||
        library.roots
          .filter((r) => r.status === "offline")
          .map((r) => `${r.path} 暂时离线，原索引已保留。`)
          .join("\n") ||
        (library.scan.finishedAt
          ? `上次扫描 ${new Date(library.scan.finishedAt).toLocaleString("zh-CN")}`
          : "尚未扫描音乐目录。");
}
function renderSearchPanel() {
  $("#panel-body").innerHTML =
    `<input class="album-search" id="album-search" type="search" placeholder="专辑、歌曲、歌手、流派…" aria-label="搜索专辑与歌曲"><div class="genre-filters"><button data-filter="" class="active">全部</button>${genres
      .filter((g) => albums.some((a) => a.genreId === g.id))
      .map((g) => `<button data-filter="${esc(g.id)}">${esc(g.name)}</button>`)
      .join("")}</div><div id="album-results"></div>`;
  renderSearchResults();
}
let searchGenre = "";
function renderSearchResults() {
  const query = ($<HTMLInputElement>("#album-search")?.value || "")
    .trim()
    .toLocaleLowerCase();
  const results: string[] = [];
  for (const a of albums) {
    if (searchGenre && a.genreId !== searchGenre) continue;
    if (!query || `${a.title} ${a.artist} ${genreName(a.genreId)}`.toLocaleLowerCase().includes(query)) {
      results.push(`<button class="album-result" data-album="${esc(a.id)}"><span class="result-cover">${cover(a)}</span><span class="result-copy"><strong>${esc(a.title)}</strong><small>${esc(a.artist)} · ${esc(genreName(a.genreId))}</small></span><em>专辑</em><i>↗</i></button>`);
    }
    if (!query) continue;
    for (const track of a.tracks) {
      if (!`${track.title} ${track.artist}`.toLocaleLowerCase().includes(query)) continue;
      // Preserve the exact song identity; selecting a result navigates without playing.
      results.push(`<button class="album-result song-result" data-album="${esc(a.id)}" data-search-track="${esc(track.id)}" aria-label="定位歌曲 ${esc(track.title)}，${esc(a.title)}"><span class="result-cover">${cover(a)}</span><span class="result-copy"><strong>${esc(track.title)}</strong><small>${esc(track.artist)} · ${esc(a.title)}</small></span><em>歌曲</em><i>↗</i></button>`);
    }
  }
  $("#album-results").innerHTML = results.length
    ? results.join("")
    : '<div class="no-results">没有找到专辑或歌曲。</div>';
}
function renderSettingsPanel() {
  $("#panel-body").innerHTML =
    `<section class="panel-section"><h3>外观主题</h3><div class="theme-cards">${(["day", "dusk", "night"] as Theme[]).map((t) => `<button data-theme="${t}" aria-pressed="${preferences.theme === t}" class="${t}"><i></i><strong>${themeNames[t]}</strong><span>${themeDescriptions[t]}</span></button>`).join("")}</div></section>
    <section class="panel-section"><h3>音乐库排列</h3><label class="settings-row"><span>排列方式<small>切换后自动刷新页面</small></span><select id="music-sort" aria-label="音乐库排列方式">${(["genre", "artist", "album"] as MusicSortMode[]).map((value) => `<option value="${value}" ${preferences.sortMode === value ? "selected" : ""}>${sortLabels[value].name}</option>`).join("")}</select></label><p>按歌手时，同一歌手的专辑放在同一列；按专辑名时，按拼音或字母顺序排列，每 12 张一列。</p></section>
    <section class="panel-section" id="introduction-settings"><h3>专辑介绍</h3><p>从公开百科查询并更新专辑介绍，附上资料来源。介绍保存在本机，不需要配置 MusicBrainz 联系信息；音乐文件不会上传。</p><p id="introduction-coverage"></p><button class="primary-button" id="introduction-refresh" data-action="introductions-library">查询 / 更新专辑介绍 ↗</button><progress id="introduction-progress" aria-label="专辑介绍查询进度" max="1" value="0" hidden></progress><p id="introduction-status" class="scan-status" role="status" aria-live="polite"></p><details id="introduction-missing" hidden><summary></summary><ul></ul></details></section>
    ${qualityMarkup(renderQuality)}
    <section class="panel-section"><h3>动效与显示</h3><label class="settings-row"><span>减少动态效果<small>简化镜头、文字加载和页签过渡</small></span><input type="checkbox" id="reduced-motion" ${preferences.reduced ? "checked" : ""}></label><button class="text-button" data-action="fullscreen">切换全屏 ↗</button></section>
    <section class="panel-section"><h3>声音</h3><label class="settings-row"><span>歌曲音量</span><input type="range" id="volume" aria-label="歌曲音量" min="0" max="100" value="${Math.round(preferences.volume * 100)}"></label><label class="settings-row"><span>切歌淡入淡出<small>当前歌曲先淡出，再淡入下一首</small></span><input type="checkbox" id="song-fade-setting" ${preferences.songFade ? "checked" : ""}></label><label class="settings-row"><span>界面音效<small>玻璃卡片与终端操作</small></span><input type="checkbox" id="sound-setting" ${preferences.sound ? "checked" : ""}></label><label class="settings-row"><span>音效音量</span><input type="range" id="sound-volume" aria-label="音效音量" min="0" max="100" value="${Math.round(preferences.soundVolume * 100)}"></label><label class="settings-row"><span>氛围 BGM<small>专辑开始前淡出，停止后淡入</small></span><input type="checkbox" id="bgm-setting" ${preferences.bgm ? "checked" : ""}></label><label class="settings-row"><span>BGM 音量</span><input type="range" id="bgm-volume" aria-label="BGM 音量" min="0" max="100" value="${Math.round(preferences.bgmVolume * 100)}"></label><button class="text-button" data-action="sound-preview">试听界面音效 ↗</button><p>当前版本支持 Windows 与 macOS，使用浏览器播放本地音乐。DSF / DFF 暂不支持播放，其他格式取决于浏览器解码能力。</p></section>
    <section class="panel-section"><h3>开发与资源</h3><p>Rhine Music · Windows 桌面版 · WebView2 / WebGL 2（ANGLE）图形渲染。</p><p>Windows 版开发者：<a href="https://github.com/Bong712" target="_blank" rel="noopener">Bong712 ↗</a><br>特别鸣谢：<a href="https://github.com/RonaldDeng/Rhine-Music-Demo" target="_blank" rel="noopener">RonaldDeng ↗</a><br>原版界面：<a href="https://github.com/LBEILC/RhineLabUI" target="_blank" rel="noopener">LBEILC / RhineLabUI ↗</a></p><p><a href="/licenses/project-mit.txt" target="_blank" rel="noopener">代码 MIT 许可 ↗</a> · <a href="https://github.com/Bong712/Rhine-Music-Windows/blob/main/NOTICE.md" target="_blank" rel="noopener">版权与资源说明 ↗</a></p><a href="/?original=1&scene=archive" target="_blank" rel="noopener">打开原版档案界面 ↗</a><p><a href="/fonts/MiSans-license.pdf" target="_blank" rel="noopener">MiSans 字体许可 ↗</a></p></section>`;
  updateQuality();
  updateIntroductionStatus();
}

function renderPlaylistPanel() {
  $("#panel-body").innerHTML = `<p class="panel-intro">歌单只保存曲目路径和显示信息，不复制、移动或修改音乐文件。移除歌曲后，歌单会保留缺失项目并标明不可用。</p>
    <div class="playlist-create"><label class="field-label" for="playlist-new-name">新建歌单</label><div><input id="playlist-new-name" type="text" maxlength="100" placeholder="例如：夜间驾驶"><button class="primary-button" data-action="create-playlist">创建</button></div></div>
    <p id="playlist-status" class="scan-status" role="status" aria-live="polite">正在读取歌单…</p><div id="playlist-list"></div>`;
  void loadPlaylistPanel();
}

async function loadPlaylistPanel() {
  const status = document.querySelector<HTMLElement>("#playlist-status");
  try {
    const result = await request<{ version: number; playlists: MusicPlaylist[] }>("/api/playlists");
    playlists = result.playlists;
    if (!playlists.some((playlist) => playlist.id === selectedPlaylistId))
      selectedPlaylistId = playlists[0]?.id || "";
    renderPlaylistList();
    if (status?.isConnected)
      status.textContent = pendingPlaylistTrackId
        ? "选择一个歌单来添加这首歌曲。"
        : `${playlists.length} 个歌单 · 歌单保存在本机。`;
  } catch (error) {
    if (status?.isConnected) status.textContent = `读取歌单失败：${(error as Error).message}`;
  }
}

function renderPlaylistList() {
  const container = document.querySelector<HTMLElement>("#playlist-list");
  if (!container) return;
  if (!playlists.length) {
    container.innerHTML = '<div class="playlist-empty">还没有歌单。先创建一个，再从专辑曲目旁添加歌曲。</div>';
    return;
  }
  container.innerHTML = playlists.map((playlist) => {
    const availableCount = playlist.tracks.filter((track) => track.available).length;
    const selected = selectedPlaylistId === playlist.id;
    const entries = selected
      ? `<div class="playlist-track-list">${playlist.tracks.length ? playlist.tracks.map((track, index) => `<div class="playlist-track ${track.available ? "" : "unavailable"}"><button class="playlist-track-play" data-action="play-playlist-track" data-playlist-id="${esc(playlist.id)}" data-track-id="${esc(track.trackId)}" ${track.available ? "" : "disabled"}><span class="playlist-track-index">${String(index + 1).padStart(2, "0")}</span><span><strong>${esc(track.title)}</strong><small>${esc(track.artist)} · ${esc(track.album || "未知专辑")}</small></span><em>${track.available ? time(track.duration) : "文件不可用"}</em></button><div class="playlist-track-actions"><button data-action="move-playlist-track" data-playlist-id="${esc(playlist.id)}" data-item-id="${esc(track.id)}" data-direction="-1" ${index === 0 ? "disabled" : ""} aria-label="上移 ${esc(track.title)}">↑</button><button data-action="move-playlist-track" data-playlist-id="${esc(playlist.id)}" data-item-id="${esc(track.id)}" data-direction="1" ${index === playlist.tracks.length - 1 ? "disabled" : ""} aria-label="下移 ${esc(track.title)}">↓</button><button data-action="remove-playlist-track" data-playlist-id="${esc(playlist.id)}" data-item-id="${esc(track.id)}" aria-label="从歌单移除 ${esc(track.title)}">×</button></div></div>`).join("") : '<p class="playlist-empty">歌单里还没有歌曲。</p>'}</div>`
      : "";
    // 「我喜欢的音乐」不允许改名或删除：它承载红心状态，删掉等于把用户的喜欢全丢掉。
    // 这里只是不给入口，真正的拦截在 rename/delete 两个 action 里（按钮可以没有，动作必须防）。
    const likes = isLikesPlaylist(playlist);
    const editControls = likes
      ? `<p class="playlist-protected">由红心 ♥ 自动维护，不可改名或删除。</p>`
      : `<div class="playlist-card-edit"><input type="text" maxlength="100" value="${esc(playlist.name)}" data-playlist-name="${esc(playlist.id)}" aria-label="修改歌单名称"><button data-action="rename-playlist" data-playlist-id="${esc(playlist.id)}">重命名</button><button data-action="delete-playlist" data-playlist-id="${esc(playlist.id)}">删除歌单</button></div>`;
    return `<article class="playlist-card ${selected ? "selected" : ""} ${likes ? "is-likes" : ""}" data-playlist-card="${esc(playlist.id)}"><div class="playlist-card-heading"><button class="playlist-select" data-action="select-playlist" data-playlist-id="${esc(playlist.id)}" aria-expanded="${selected}"><strong>${esc(playlist.name)}</strong><small>${playlist.tracks.length} 首 · ${availableCount} 首可播放</small></button><button data-action="play-playlist" data-playlist-id="${esc(playlist.id)}" ${availableCount ? "" : "disabled"} aria-label="播放歌单 ${esc(playlist.name)}">${icons.play}</button>${pendingPlaylistTrackId ? `<button data-action="add-pending-playlist" data-playlist-id="${esc(playlist.id)}">添加歌曲</button>` : ""}</div>${editControls}${entries}</article>`;
  }).join("");
}

/** 评论按钮的可用性，以及"面板开着时换歌要跟着换"。
 *  它读的状态（commentsTrackId 等）声明在**模块顶部**，因为本函数会被播放器监听器在模块求值
 *  期间调用一次（见那边的注释）。 */
function syncCommentsButton() {
  const button = document.querySelector<HTMLButtonElement>("#transport-comments");
  const track = playerState?.currentTrack;
  if (button) {
    button.disabled = !track;
    // 展开态看面板是否真的可见。真正写入的权威在 syncCommentsView（它同时管 hidden 与过渡），
    // 这里只做兜底同步，所以不在这里翻转任何状态。
    const visible = document.querySelector<HTMLElement>("#music-comments-panel")?.hidden === false;
    button.setAttribute("aria-expanded", String(visible));
    button.setAttribute("aria-label", track ? `听后感：${track.title}` : "听后感");
    button.title = track ? "听后感" : "播放一首歌后才能写听后感";
  }
  // 面板开着时换了曲目，就换成那一首的听后感；没换就不动，免得把正在输入的内容冲掉。
  const currentId = track?.id ?? null;
  if (commentsRequested && currentId !== commentsTrackId) {
    commentsTrackId = currentId;
    void loadCommentsPanel();
  }
  // 角标：换曲目就重新取一次条数（面板没开也要准）。同一首不重复请求。
  if (currentId !== commentsCountTrackId) {
    commentsCountTrackId = currentId;
    void refreshCommentCount();
  }
}

/**
 * 听后感面板。跟**当前曲目**走，不是跟专辑走 —— 换歌就换成那一首的听后感。
 * 数据存在应用数据目录（comments.json），不动用户的音乐文件夹，也不扫描、不上传。
 */
function renderCommentsPanel() {
  const track = playerState?.currentTrack;
  const body = document.querySelector<HTMLElement>("#comments-body");
  const compose = document.querySelector<HTMLElement>(".comments-compose");
  const title = document.querySelector<HTMLElement>("#comments-song-title");
  const artist = document.querySelector<HTMLElement>("#comments-song-artist");
  const count = document.querySelector<HTMLElement>("#comments-count");
  if (!body) return;
  // 顶部曲目信息跟着当前曲目走（和歌词面板的 song-info 同一角色）。
  if (title) title.textContent = track?.title ?? "";
  if (artist) artist.textContent = track?.artist ?? "";
  if (!track) {
    // 没有曲目就没有"这首歌的听后感"可言 —— 说明白，并把发布区收起来。
    if (compose) compose.hidden = true;
    if (count) count.textContent = "全部评论 0";
    body.innerHTML = `<p class="comments-empty">先在专辑里播放一首歌，再写下你对它的听后感。听后感只保存在这台机器上。</p>`;
    return;
  }
  if (compose) compose.hidden = false;
  void loadCommentsPanel();
}

/**
 * 控制栏图标的**角标**（右上角条数），主人要的是"有的话显示条数，没有就是完整图标"。
 * 所以 `count <= 0` 时整个角标隐藏，不显示 `0`。
 *
 * 收藏的条数只能是 0/1（本机只有你自己收藏），但仍然走同一个函数 —— 主人提过以后可能做成
 * 在线版，那时这里直接换成服务端返回的人数即可，不必改结构。
 */
function setTransportBadge(id: string, count: number) {
  const badge = document.querySelector<HTMLElement>(id);
  if (!badge) return;
  const shown = Number.isFinite(count) && count > 0;
  badge.hidden = !shown;
  if (shown) {
    // 三位数以上收成 `999+`（主人说的"一般最高是 999+"）。这是**文本截断**，不是画图标 ——
    // 网易云也是同一个做法：图标固定、数字是叠在右上角的一段文本，所以不需要为每个数字准备图形。
    const text = count > 999 ? "999+" : String(count);
    if (badge.textContent !== text) badge.textContent = text;
  }
}

/**
 * 控制栏最左侧的「歌名 · 歌手」。没有曲目时整块隐藏，不留空白占位。 */
function syncTransportTrack() {
  const block = document.querySelector<HTMLElement>("#transport-track");
  const titleEl = document.querySelector<HTMLElement>("#transport-track-title");
  const artistEl = document.querySelector<HTMLElement>("#transport-track-artist");
  if (!block || !titleEl || !artistEl) return;
  const track = playerState?.currentTrack;
  block.hidden = !track;
  if (!track) {
    titleEl.textContent = "";
    artistEl.textContent = "";
    return;
  }
  if (titleEl.textContent !== track.title) titleEl.textContent = track.title;
  if (artistEl.textContent !== track.artist) artistEl.textContent = track.artist;
  // 名称过长时用 title 兜底（悬停可看全），主显示交给 CSS 截断。
  block.title = `${track.title}${track.artist ? ` · ${track.artist}` : ""}`;
}

/**
 * 取当前曲目的听后感条数并更新角标。
 *
 * 为什么单独发一个轻量请求、而不是复用面板的加载：角标要**面板没开也准**（主人要的是"有的话就
 * 显示条数，没有就是完整气泡"）。只取条数、不渲染列表，开销很小。
 * 带代次守卫：连续换歌时只有最后一次的结果允许写入，否则角标会显示上一首的条数。
 */
async function refreshCommentCount() {
  const track = playerState?.currentTrack;
  if (!track) {
    transportCommentCount = 0;
    setTransportBadge("#transport-comments-badge", 0);
    return;
  }
  const token = ++commentsCountToken;
  try {
    const result = await request<{ comments: ListeningComment[] }>(`/api/comments/${track.id}`);
    if (token !== commentsCountToken) return;
    // 期间换了曲目 → 这次的结果属于上一首，丢弃。
    if (playerState?.currentTrack?.id !== track.id) return;
    transportCommentCount = result.comments.length;
  } catch {
    // 取不到就保持原值并直接返回：角标只是提示，不该因一次请求失败而清空。
    return;
  }
  setTransportBadge("#transport-comments-badge", transportCommentCount);
}
/**
 * 听后感面板的显隐裁决点。与歌词面板互斥：只在"自己该显示"时才去收掉对方，
 * 因此两者不会互相无限递归。开关状态（commentsRequested / commentsClosing）声明在**模块顶部**，
 * 因为本函数会在模块求值期间被 syncLyricsPanel 调用一次（理由见那边的注释）。
 */
function syncCommentsView() {
  const panel = document.querySelector<HTMLElement>("#music-comments-panel");
  if (!panel) return;
  const hasTrack = !!playerState?.currentTrack;
  // 互斥由**调用方**设置 `lyricsAllowed` / `commentsRequested` 维护（见两个按钮的 case），
  // 本函数只负责按当前标志渲染自己。两个 sync 函数因此**互不调用**，不成环 —— 我最初写成
  // "打开一个就去调另一个收掉对方"，实测直接 `RangeError: Maximum call stack size exceeded`。
  const shouldShow = hasTrack && commentsRequested && stage.dataset.mode !== "archive";
  const wasHidden = panel.hidden;
  if (shouldShow) {
    if (wasHidden) {
      commentsPanelTransition.show(preferences.reduced);
      renderCommentsPanel();
    }
  } else if (!wasHidden && !commentsClosing) {
    commentsClosing = true;
    commentsPanelTransition.hide(preferences.reduced, () => {
      commentsClosing = false;
      syncCommentsView();
    });
  }
  stage.dataset.commentsVisible = String(shouldShow);
  const button = document.querySelector<HTMLButtonElement>("#transport-comments");
  button?.setAttribute("aria-expanded", String(shouldShow));
}

/**
 * 拉取并渲染当前曲目的听后感。
 *
 * **必须带代次守卫**：保存一条后会触发两次加载（保存成功后一次、曲目同步里一次），两个请求
 * 并发时，**先发出的那个可能后返回**，会把面板覆盖成旧列表 —— 实测到的症状是"刚保存完面板
 * 还显示没有听后感，下一次操作才补上"，即整体慢一拍。只有最后一次请求的结果才允许写入。
 */
async function loadCommentsPanel() {
  const status = document.querySelector<HTMLElement>("#comment-status");
  const list = document.querySelector<HTMLElement>("#comments-body");
  const count = document.querySelector<HTMLElement>("#comments-count");
  if (!status || !list) return;
  const track = playerState?.currentTrack;
  if (!track) {
    status.textContent = "没有正在播放的曲目。";
    list.innerHTML = "";
    return;
  }
  const token = ++commentsLoadToken;
  try {
    const result = await request<{ comments: ListeningComment[] }>(`/api/comments/${track.id}`);
    // 期间又发起了新的加载（或换了曲目）→ 这次的结果已过期，丢弃。
    if (token !== commentsLoadToken) return;
    if (count) count.textContent = `全部评论 ${result.comments.length}`;
    status.textContent = result.comments.length ? `${result.comments.length} 条听后感` : "还没有听后感，写下第一条吧。";
    list.innerHTML = result.comments.length
      ? result.comments
          .map(
            (comment) =>
              `<article class="comment-card"><p class="comment-text">${esc(comment.text)}</p><div class="comment-meta"><time>${esc(formatCommentTime(comment.createdAt))}</time><button data-action="delete-comment" data-comment-id="${esc(comment.id)}" aria-label="删除这条听后感">删除</button></div></article>`,
          )
          .join("")
      : `<p class="comments-empty">还没有听后感，写下第一条吧。</p>`;
  } catch (error) {
    if (token !== commentsLoadToken) return;
    status.textContent = `读取失败：${(error as Error).message}`;
    list.innerHTML = "";
  }
}

/** 时间用本地格式显示；解析不出来就原样显示，不显示 Invalid Date。 */
function formatCommentTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

async function addComment() {
  const track = playerState?.currentTrack;
  const input = document.querySelector<HTMLTextAreaElement>("#comment-text");
  if (!track) {
    notify("先播放一首歌，再写听后感。");
    return;
  }
  const body = input?.value.trim() ?? "";
  if (!body) {
    notify("写点内容再保存。");
    input?.focus();
    return;
  }
  try {
    await request(`/api/comments/${track.id}`, { text: body });
    if (input) input.value = "";
    notify("听后感已保存在本机。");
    await loadCommentsPanel();
    // 角标跟着条数走；用刚保存后的真实条数，不必再多发一个请求。
    transportCommentCount += 1;
    setTransportBadge("#transport-comments-badge", transportCommentCount);
  } catch (error) {
    notify(`保存失败：${(error as Error).message}`);
  }
}

async function deleteComment(commentId: string) {
  const track = playerState?.currentTrack;
  if (!track || !commentId) return;
  try {
    await request(`/api/comments/${track.id}/${commentId}`, undefined, "DELETE");
    notify("这条听后感已删除。");
    await loadCommentsPanel();
    transportCommentCount = Math.max(0, transportCommentCount - 1);
    setTransportBadge("#transport-comments-badge", transportCommentCount);
  } catch (error) {
    notify(`删除失败：${(error as Error).message}`);
  }
}

// ── 程序内弹窗 ────────────────────────────────────────────────────────────────
// 取代 window.prompt / window.confirm：原生弹窗是**浏览器**样式的，和这套界面不是一回事，
// 而且会阻塞整个页面（连滚动都停）。两种形态共用一层遮罩：
//   输入框（detail.input）—— 新建歌单；确认（detail.confirm）—— 删除歌单这类不可撤销操作。
// 返回 Promise：输入框给字符串或 null（取消），确认给 true 或 false。
type DialogDetail = {
  title: string;
  description?: string;
  /** 有输入框时的初始值；没有就只显示确认按钮。 */
  input?: { value: string; maxLength: number; placeholder?: string };
  confirmLabel: string;
  danger?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

function showMusicDialog(detail: DialogDetail) {
  const dialog = document.querySelector<HTMLElement>("#music-dialog");
  if (!dialog) {
    detail.onCancel();
    return;
  }
  const isInput = !!detail.input;
  dialog.innerHTML = `<div class="music-dialog-scrim" data-dialog="cancel"><section class="music-dialog-card" role="dialog" aria-modal="true" aria-labelledby="music-dialog-title">
    <h2 id="music-dialog-title">${esc(detail.title)}</h2>
    ${detail.description ? `<p class="music-dialog-text">${esc(detail.description)}</p>` : ""}
    ${isInput ? `<input id="music-dialog-input" type="text" maxlength="${detail.input!.maxLength}" value="${esc(detail.input!.value)}" placeholder="${esc(detail.input!.placeholder ?? "")}" aria-label="${esc(detail.title)}">` : ""}
    <div class="music-dialog-actions">
      <button type="button" data-dialog="cancel">取消</button>
      <button type="button" class="primary-button${detail.danger ? " is-danger" : ""}" data-dialog="confirm">${esc(detail.confirmLabel)}</button>
    </div>
  </section></div>`;
  dialog.hidden = false;
  const input = document.querySelector<HTMLInputElement>("#music-dialog-input");
  input?.focus();
  input?.select();
  const submit = () => {
    const value = input ? input.value.trim() : "";
    if (isInput && !value) {
      // 服务端要求名称非空，这里先挡住，并把焦点放回输入框，而不是弹一个错误提示。
      input?.focus();
      return;
    }
    close();
    detail.onConfirm(value);
  };
  const close = () => {
    dialog.hidden = true;
    dialog.innerHTML = "";
    document.removeEventListener("keydown", onKey, true);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      detail.onCancel();
    } else if (event.key === "Enter" && isInput) {
      event.preventDefault();
      submit();
    }
  };
  document.addEventListener("keydown", onKey, true);
  dialog.querySelector(".music-dialog-scrim")?.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).dataset.dialog === "cancel") {
      close();
      detail.onCancel();
    }
  });
  dialog.querySelector('[data-dialog="confirm"]')?.addEventListener("click", submit);
  dialog.querySelector('[data-dialog="cancel"]')?.addEventListener("click", () => {
    close();
    detail.onCancel();
  });
}

/** 询问一个名称（新建歌单）。返回 null 表示取消。 */
function askMusicName(options: { title: string; value: string; confirmLabel: string; placeholder?: string }): Promise<string | null> {
  return new Promise((resolve) => {
    showMusicDialog({
      title: options.title,
      input: { value: options.value, maxLength: 100, placeholder: options.placeholder },
      confirmLabel: options.confirmLabel,
      onConfirm: (value) => resolve(value),
      onCancel: () => resolve(null),
    });
  });
}

/** 确认一次不可撤销的操作（删除歌单）。 */
function confirmMusicAction(options: { title: string; description?: string; confirmLabel: string; danger?: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    showMusicDialog({
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel,
      danger: options.danger,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

// ── 「更多」菜单 ──────────────────────────────────────────────────────────────
// 结构照网易云那一列先搭好（下载 / 分享 / 一起听 / 播放倍速 · 歌手 / 专辑 / 音效 / 购买单曲 ·
// 减少推荐），将来平台化时在这个骨架上接功能即可。
//
// **每一项都如实置灰**，不伪装成能点：下载 / 分享 / 一起听 / 购买单曲 / 减少推荐依赖账号与云端，
// 本机播放器做不到；歌手 / 专辑 / 音效 / 播放倍速是尚未开发。用 title 说清是哪一种，
// 避免用户点了没反应，也避免用"即将支持"暗示所有项都会实现。
type MoreMenuItem = {
  /** data-action；没有就表示这一项当前不可用。 */
  action?: string;
  icon: string;
  label: string;
  /** 右侧附加信息（歌手名、专辑名、音质等）。 */
  value?: string;
  /** 不可用时的原因，写进 title 与 aria。 */
  reason?: string;
  /** true = 依赖账号/云端，本机版本不提供。 */
  remote?: boolean;
};

function moreMenuItem(item: MoreMenuItem): string {
  const disabled = !item.action;
  const reason = item.reason ?? (disabled ? "当前版本尚未提供" : "");
  const attributes = [
    `type="button"`,
    `class="transport-menu-item transport-more-item${item.remote ? " is-remote" : ""}"`,
    `role="menuitem"`,
    item.action ? `data-action="${item.action}"` : "",
    disabled ? "disabled" : "",
    reason ? `title="${esc(reason)}" aria-label="${esc(`${item.label}${item.value ? `：${item.value}` : ""}（${reason}）`)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<button ${attributes}><span class="transport-more-leading">${item.icon}</span><span class="transport-menu-name">${esc(item.label)}</span>${item.value ? `<span class="transport-more-value">${esc(item.value)}</span>` : ""}</button>`;
}

function renderMoreMenu() {
  const menu = document.querySelector<HTMLElement>("#transport-more-menu");
  if (!menu) return;
  const track = playerState?.currentTrack;
  const album = albums.find((entry) => entry.id === track?.albumId);
  const quality = track
    ? [track.format, track.bitsPerSample ? `${track.bitsPerSample}bit` : "", track.sampleRate ? `${Math.round(track.sampleRate / 1000)}kHz` : ""]
        .filter(Boolean)
        .join(" · ")
    : "";
  const local: MoreMenuItem[] = [
    { icon: icons.download, label: "下载", reason: "本机播放器无需下载；联网版本再提供", remote: true },
    { icon: icons.share, label: "分享", reason: "分享需要联网服务，本机版本不提供", remote: true },
    { icon: icons.together, label: "一起听", reason: "一起听需要联网服务，本机版本不提供", remote: true },
    { icon: icons.speed, label: "播放倍速", reason: "播放倍速尚未开发" },
  ];
  const info: MoreMenuItem[] = [
    { icon: icons.artist, label: "歌手", value: track?.artist || "—" },
    { icon: icons.album, label: "专辑", value: album?.title || "—" },
    { icon: icons.effects, label: "音效", reason: "音效尚未开发" },
    { icon: icons.cart, label: "购买单曲", reason: "购买需要联网服务，本机版本不提供", remote: true },
  ];
  const tail: MoreMenuItem[] = [
    { icon: icons.reduce, label: "减少推荐", reason: "推荐需要联网服务，本机版本不提供", remote: true },
  ];
  const section = (items: MoreMenuItem[]) => items.map(moreMenuItem).join("");
  menu.innerHTML = `<div class="transport-menu-group">${section(local)}</div><div class="transport-menu-group">${section(info)}</div><div class="transport-menu-group transport-menu-last">${section(tail)}</div>`;
}

function openMoreMenu(anchor: HTMLElement) {
  const menu = document.querySelector<HTMLElement>("#transport-more-menu");
  if (!menu) return;
  moreMenuOpen = true;
  closeTransportMenu();
  renderMoreMenu();
  menu.hidden = false;
  positionTransportMenu(anchor, menu);
}

function closeMoreMenu() {
  const menu = document.querySelector<HTMLElement>("#transport-more-menu");
  moreMenuOpen = false;
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  document.querySelector("#transport-more")?.setAttribute("aria-expanded", "false");
}

/** 菜单里显示当前曲目的歌手/专辑，所以换歌时要重画（菜单开着才需要）。 */
function syncMoreMenu() {
  const button = document.querySelector<HTMLButtonElement>("#transport-more");
  const track = playerState?.currentTrack;
  if (button) {
    button.setAttribute("aria-expanded", String(moreMenuOpen));
    button.setAttribute("aria-label", track ? `更多：${track.title}` : "更多");
  }
  if (moreMenuOpen) renderMoreMenu();
}

async function createPlaylist() {
  const input = document.querySelector<HTMLInputElement>("#playlist-new-name");
  if (!input) return;
  try {
    const result = await request<{ playlist: MusicPlaylist }>("/api/playlists", { name: input.value });
    selectedPlaylistId = result.playlist.id;
    if (pendingPlaylistTrackId) await addPendingTrack(result.playlist.id);
    else {
      await loadPlaylistPanel();
      input.value = "";
      notify("歌单已创建并保存在本机。");
    }
  } catch (error) {
    notify(`创建歌单失败：${(error as Error).message}`);
  }
}

async function addPendingTrack(playlistId: string) {
  const trackId = pendingPlaylistTrackId;
  if (!trackId) return;
  try {
    const result = await request<{ added: number; skipped: number }>(`/api/playlists/${playlistId}/tracks`, { trackIds: [trackId] });
    pendingPlaylistTrackId = "";
    await loadPlaylistPanel();
    notify(result.added ? "歌曲已加入歌单。" : result.skipped ? "歌曲当前不在曲库中，暂时无法加入。" : "这首歌曲已在歌单里。");
  } catch (error) {
    notify(`添加歌曲失败：${(error as Error).message}`);
  }
}

async function renamePlaylist(id: string) {
  const input = document.querySelector<HTMLInputElement>(`[data-playlist-name="${CSS.escape(id)}"]`);
  if (!input) return;
  // 名字就是「我喜欢的音乐」的身份标识（红心靠它找这张歌单），改名会让红心从此找不到它，
  // 所以这里必须拦住。侧栏本来就不给它改名入口，但动作层面也要防。
  const target = playlists.find((entry) => entry.id === id);
  if (target && isLikesPlaylist(target)) {
    notify("「我喜欢的音乐」由红心自动维护，不能改名。");
    return;
  }
  try {
    await request(`/api/playlists/${id}`, { name: input.value }, "PATCH");
    await loadPlaylistPanel();
    notify("歌单名称已更新。");
  } catch (error) {
    notify(`重命名失败：${(error as Error).message}`);
  }
}

async function deletePlaylist(id: string) {
  const playlist = playlists.find((entry) => entry.id === id);
  if (!playlist) return;
  // 删掉「我喜欢的音乐」等于把用户的喜欢全部丢掉，而且没有撤销。侧栏不给入口，动作层也拦。
  if (isLikesPlaylist(playlist)) {
    notify("「我喜欢的音乐」不能删除；要清空请逐首取消喜欢。");
    return;
  }
  // 确认也用程序内弹窗（同样是浏览器样式的原生 confirm 的问题）；删除不可撤销，标为危险操作。
  const confirmed = await confirmMusicAction({
    title: `删除歌单「${playlist.name}」？`,
    description: "歌单里的曲目列表会被移除，音乐文件本身不受影响。此操作无法撤销。",
    confirmLabel: "删除歌单",
    danger: true,
  });
  if (!confirmed) return;
  try {
    await request(`/api/playlists/${id}`, undefined, "DELETE");
    if (selectedPlaylistId === id) selectedPlaylistId = "";
    await loadPlaylistPanel();
    notify("歌单已删除。");
  } catch (error) {
    notify(`删除歌单失败：${(error as Error).message}`);
  }
}

async function movePlaylistTrack(playlistId: string, itemId: string, direction: -1 | 1) {
  const playlist = playlists.find((entry) => entry.id === playlistId);
  if (!playlist) return;
  const itemIds = playlist.tracks.map((track) => track.id);
  const index = itemIds.indexOf(itemId);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= itemIds.length) return;
  [itemIds[index], itemIds[next]] = [itemIds[next], itemIds[index]];
  try {
    await request(`/api/playlists/${playlistId}/tracks`, { itemIds }, "PUT");
    await loadPlaylistPanel();
  } catch (error) {
    notify(`调整歌单顺序失败：${(error as Error).message}`);
  }
}

async function removePlaylistTrack(playlistId: string, itemId: string) {
  try {
    await request(`/api/playlists/${playlistId}/tracks/${itemId}`, undefined, "DELETE");
    await loadPlaylistPanel();
  } catch (error) {
    notify(`移除歌曲失败：${(error as Error).message}`);
  }
}

function playPlaylist(playlistId: string, selectedTrackId?: string) {
  const playlist = playlists.find((entry) => entry.id === playlistId);
  const tracks = playlist?.tracks.filter((entry) => entry.available && entry.track).map((entry) => entry.track!) ?? [];
  if (!tracks.length) {
    notify("这个歌单里没有当前可播放的歌曲。");
    return;
  }
  player.setQueue(tracks);
  void player.play(tracks.some((track) => track.id === selectedTrackId) ? selectedTrackId! : tracks[0].id);
}

function renderQueuePanel() {
  $("#panel-body").innerHTML = `<div class="queue-toolbar"><span id="queue-current-status"></span><div><button data-action="queue-prev" aria-label="上一首">上一首</button><button data-action="play-pause" aria-label="播放或暂停">${playerState.playing ? "暂停" : "播放"}</button><button data-action="queue-next" aria-label="下一首">下一首</button><button data-action="lyrics-panel">同步歌词 ↗</button></div></div><div id="queue-list" class="queue-list"></div>`;  syncQueuePanel(true);
}

function syncQueuePanel(force = false) {
  const list = document.querySelector<HTMLElement>("#queue-list");
  const count = document.querySelector<HTMLElement>("#queue-count");
  if (count) count.textContent = String(playerState?.queue.length ?? 0);
  if (!list || !playerState) return;
  const signature = playerState.queue.map((track) => track.id).join("\0");
  if (force || list.dataset.signature !== signature) {
    list.dataset.signature = signature;
    list.innerHTML = playerState.queue.length
      ? playerState.queue.map((track, index) => `<div class="queue-track" data-queue-track="${esc(track.id)}"><button class="queue-track-main" data-action="play-queue-track" data-track-id="${esc(track.id)}"><span class="playlist-track-index">${String(index + 1).padStart(2, "0")}</span><span><strong>${esc(track.title)}</strong><small>${esc(track.artist)}</small></span><em>${time(track.duration)}</em></button><div class="queue-track-actions"><button data-action="move-queue-track" data-track-id="${esc(track.id)}" data-direction="-1" ${index === 0 ? "disabled" : ""} aria-label="上移 ${esc(track.title)}">↑</button><button data-action="move-queue-track" data-track-id="${esc(track.id)}" data-direction="1" ${index === playerState.queue.length - 1 ? "disabled" : ""} aria-label="下移 ${esc(track.title)}">↓</button><button data-action="remove-queue-track" data-track-id="${esc(track.id)}" ${playerState.currentTrack?.id === track.id ? "disabled" : ""} aria-label="从队列移除 ${esc(track.title)}">×</button></div></div>`).join("")
      : '<div class="playlist-empty">队列为空。打开专辑后点击曲目旁的“＋”即可排队。</div>';
  }
  list.querySelectorAll<HTMLElement>("[data-queue-track]").forEach((row) => {
    const current = row.dataset.queueTrack === playerState.currentTrack?.id;
    row.classList.toggle("current", current);
    const remove = row.querySelector<HTMLButtonElement>('[data-action="remove-queue-track"]');
    if (remove) remove.disabled = current;
  });
  const status = document.querySelector<HTMLElement>("#queue-current-status");
  if (status) status.textContent = playerState.currentTrack ? `正在播放：${playerState.currentTrack.title}` : "尚未播放歌曲";
  const playButton = document.querySelector<HTMLButtonElement>('.queue-toolbar [data-action="play-pause"]');
  if (playButton) playButton.textContent = playerState.playing ? "暂停" : "播放";
  const previousButton = document.querySelector<HTMLButtonElement>('.queue-toolbar [data-action="queue-prev"]');
  const nextButton = document.querySelector<HTMLButtonElement>('.queue-toolbar [data-action="queue-next"]');
  if (previousButton) previousButton.disabled = !playerState.currentTrack;
  if (nextButton) nextButton.disabled = playerState.currentIndex < 0 || playerState.currentIndex >= playerState.queue.length - 1;
}

// The card stands in for the album column while a song with lyrics plays, so it
// has nothing to stand in for while the viewer browses the archive — and being
// hidden there is what the owner asked for, rather than a collapsed strip over the
// archive text (that overlap measured 430px at 1440x900). The panel is shown again
// on the album page, where syncLyricsPanel re-measures it as it appears.
// 旧「收起态」歌词卡的最后一处残留（`applyLyricsCollapsed` / `setLyricsCollapsed`）已删除。
// 那张卡现在只有两种状态：**歌词页**或**不存在**（由 SurfaceTransition 的滑入/滑出掌管 hidden）。
// 之前两套机制并存，而旧的持久化标志 `lyricsCollapsed` 仍然参与 shouldShow 的判断 —— 它一旦为
// true，词按钮就再也打不开歌词页，且重启后依然如此。主人报告过"有歌词的歌、停止后点词没反应"，
// 根源就在这里。相关代码没有保留的必要，故直接删除而不是隐藏。

// Lyrics are read from a small local .lrc file beside the track and cannot change without
// that file changing, so a hit is served from memory instead of asking the service again.
const lyricCache = new Map<string, { found: boolean; text: string }>();

async function lyricsFor(trackId: string): Promise<{ found: boolean; text: string }> {
  const cached = lyricCache.get(trackId);
  if (cached) return cached;
  const result = await request<{ found: boolean; text: string }>(
    `/api/lyrics/${encodeURIComponent(trackId)}`,
  );
  lyricCache.set(trackId, result);
  return result;
}

// Preparing a whole album's lyrics while the viewer is still reading its track list: they
// are tiny local files, and it means pressing play on any of them shows lyrics at once
// instead of starting a lookup then. Sequential, bounded, and cancellable — opening
// another album stops the walk, so nothing is fetched for a list nobody is looking at.
let lyricPrefetch = 0;
const LYRIC_PREFETCH_LIMIT = 40;
async function prefetchAlbumLyrics(album: MusicAlbum | undefined): Promise<void> {
  const generation = ++lyricPrefetch;
  if (!album) return;
  for (const track of album.tracks.slice(0, LYRIC_PREFETCH_LIMIT)) {
    if (generation !== lyricPrefetch) return;
    if (lyricCache.has(track.id)) continue;
    try {
      await lyricsFor(track.id);
    } catch {
      // No LRC, or an unreadable one: the panel already reports that when it matters.
    }
  }
}

async function loadLyrics(track: MusicTrack | null) {
  // Align the panel with the album column it replaces, and the collapsed card
  // with that column's first track row. Both are measured from the live layout
  // rather than written down, because --detail-content-top and the headings are
  // all responsive: a fixed offset is wrong at other sizes.
  syncLyricsPanelAlignment();  lyricTrackId = track?.id ?? null;
  const requestVersion = ++lyricRequestVersion;
  lyricLines = [];
  lyricStateText = track ? "正在查找与歌曲同名的 .lrc 文件…" : "尚未载入歌词。";
  activeLyric = -2;
  renderLyricRows();
  updateLyricFocus(-1);
  syncLyricsPanel();
  syncCommentsView();
  syncLyricClock();
  if (!track) return;
  try {
    const result = await lyricsFor(track.id);
    if (requestVersion !== lyricRequestVersion || lyricTrackId !== track.id) return;
    lyricLines = result.found ? parseLrc(result.text) : [];
    lyricStateText = !result.found ? "歌曲所在文件夹里没有同名 LRC 歌词。" : lyricLines.length ? "点击歌词可跳转到对应时间" : "LRC 文件没有可识别的时间戳歌词。";
    activeLyric = -2;
    renderLyricRows();
    updateLyricFocus(-1);
    syncLyricsPanel();
    syncCommentsView();
    syncLyricsPosition(player.playbackTime);
    syncLyricClock();
  } catch (error) {
    if (requestVersion !== lyricRequestVersion) return;
    lyricStateText = `读取歌词失败：${(error as Error).message}`;
    activeLyric = -2;
    renderLyricRows();
    updateLyricFocus(-1);
    syncLyricsPanel();
    syncCommentsView();
  }
}

function renderLyricRows() {
  const list = document.querySelector<HTMLElement>("#lyric-list");
  if (!list) return;
  list.replaceChildren();
  list.classList.toggle("lyric-list-empty", !lyricLines.length);
  if (!lyricLines.length) return;
  const fragment = document.createDocumentFragment();
  lyricLines.forEach((line, index) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "lyric-line";
    row.dataset.action = "seek-lyric";
    row.dataset.lyricIndex = String(index);
    row.textContent = line.text;
    row.setAttribute("aria-current", "false");
    fragment.append(row);
  });
  list.append(fragment);
  // Re-centre once the new rows have been laid out.
  requestAnimationFrame(() => {
    centerLyricLine(true);
  });
}

function updateLyricFocus(index: number) {
  const list = document.querySelector<HTMLElement>("#lyric-list");
  if (!list) return;
  list.querySelector<HTMLElement>(".lyric-line.active")?.classList.remove("active");
  list.querySelectorAll<HTMLElement>(".lyric-line[aria-current='true']").forEach((row) => row.setAttribute("aria-current", "false"));
  if (index < 0) return;
  const active = list.querySelector<HTMLElement>(`.lyric-line[data-lyric-index="${index}"]`);
  if (!active) return;
  active.classList.add("active");
  active.setAttribute("aria-current", "true");
  if (!preferences.reduced && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    active.getAnimations().forEach((animation) => animation.cancel());
    active.animate(
      [
        { opacity: 0.55 },
        { opacity: 1 },
      ],
      { duration: 200, easing: "ease-out" },
    );
  }
}

// Follow the song, but yield to the viewer: a manual scroll or a click pauses
// the auto-centring, which resumes once they stop interacting.
//
// This is a single deadline rather than a pause flag plus a timer. The earlier
// flag/timer pair could be left paused forever: whichever handler ran last
// cleared the timer without restoring the flag, and the recorded samples showed
// exactly that (held=true, pending=false, permanently).
let lyricFollowUntil = 0;
let lyricFollowResumeTimer = 0;
const LYRIC_FOLLOW_RESUME_MS = 4000;
function lyricFollowReduced() {
  return preferences.reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/** Defer the follow, and re-centre the moment the deferral expires. */
function holdLyricFollow() {
  lyricFollowUntil = Date.now() + LYRIC_FOLLOW_RESUME_MS;
  window.clearTimeout(lyricFollowResumeTimer);
  lyricFollowResumeTimer = window.setTimeout(() => {
    lyricFollowResumeTimer = 0;
    if (activeLyric >= 0) centerLyricLine(false);
  }, LYRIC_FOLLOW_RESUME_MS + 40);
}
for (const event of ["wheel", "pointerdown", "touchstart"] as const)
  $("#lyric-list").addEventListener(event, holdLyricFollow, { passive: true });
$("#lyric-list").addEventListener("pointerup", holdLyricFollow, { passive: true });
$("#lyric-list").addEventListener("pointercancel", holdLyricFollow, { passive: true });
$("#lyric-list").addEventListener("keydown", holdLyricFollow);

function activeLyricLine(): HTMLElement | null {
  if (activeLyric < 0) return null;
  return document.querySelector<HTMLElement>(`#lyric-list .lyric-line[data-lyric-index="${activeLyric}"]`);
}

/**
 * The lyrics panel stands in for the album column, so it takes that column's
 * measured top edge, and the collapsed card drops to the column's big album
 * title — the album name heading directly under the overline. Measuring keeps
 * both correct across the responsive `--detail-content-top` steps and the
 * responsive heading size, which a hand-written offset is not.
 */
// Last measurement of the album title's own top edge, taken while the album block
// was actually laid out. While the expanded lyrics panel stands in for that block,
// or while the detail pane is still entering, the title reports a zero rect —
// measuring then would throw the panel out of place (measured: --lyrics-top
// resolved to -17px, which parks it above the top of the window). The write below
// is guarded by the same test as the measurement: an unmeasurable title keeps the
// previous value instead of committing a number built from a zero box.
let lyricsTitleTop: number | null = null;
// Same idea for the panel's bottom: only accept a reading taken from a laid-out
// album column.
let lyricsBottomInset: number | null = null;
// How tall the lyrics band has to be for its bottom border — the card's own rule —
// to land on the album column's rule. Measured (see syncLyricsPanelAlignment); a
// wrapped album title moves the album's rule and this follows it.
let lyricsBandMin: number | null = null;
// The row-band the track list keeps free at its foot. Measured, never written
// down: the row height steps with the viewport (52px at 1440x900, 66px at
// 1920x1080). The album column's scroller reads it as an extra bottom margin and
// the panel reads the same number to land on the same line, so it is written onto
// the stage — the two boxes that share it are not parent and child.
let trackReserve: number | null = null;
function syncLyricsPanelAlignment() {
  const panel = document.querySelector<HTMLElement>("#music-lyrics-panel");
  const column = document.querySelector<HTMLElement>("#album-detail-content");
  const stage = document.querySelector<HTMLElement>("#stage");
  if (!panel || !column || !stage) return;
  /**
   * 这些定位变量原先只写在**歌词面板自身**上。现在听后感面板是同一块区域里的第二个视图，
   * 所以必须由更上一级来定义这块"区域" —— 否则评论面板会退回样式表里的默认值。实测的后果：
   * 评论面板量到 `l:0 r:157`（因为 --lyrics-left/right/width 只写在 `.music-lyrics-panel`
   * 的规则里，只有歌词面板自己吃得到），而歌词面板是 `l:832 r:1550`，切换时明显"跳一下"。
   *
   * 写法上：写到 **`#stage`**（两个面板的共同祖先），一次写入两边都继承、且与面板是否隐藏无关。
   * 面板自身那份也保留 —— 歌词卡的对齐逻辑会用 `getComputedStyle(panel)` 读 `--lyrics-top-inset`
   * 之类的默认值做校准。
   */
  const setSharedGeometry = (name: string, value: string) => {
    panel.style.setProperty(name, value);
    stage.style.setProperty(name, value);
  };
  /**
   * **区域**的水平范围与高度。歌词面板只占用其中一部分（它自己还有 band 高度、底部内缩），
   * 而听后感面板要占**整块**，所以两者不能共用同一套 bottom/height 值 —— 这就是为什么
   * `--lyrics-bottom` 不能给评论面板用（那是"给歌词卡留了高度"之后的值，实测 243px）。
   */
  const setRegion = (name: string, value: string) => stage.style.setProperty(name, value);
  // The seek row is part of this band, so entering the album detail (and every re-measure)
  // stocks it: visible at 00:00 / 00:00 while no track is loaded, live once one is.
  syncSeekRow(player.playbackTime, playerState?.duration ?? 0);
  const stageHeight = stage.clientHeight;
  // A zero-width box on an element that exists means it is not being laid out.
  const measurable = (element: HTMLElement | null): element is HTMLElement =>
    !!element && element.getBoundingClientRect().width > 0;
  const body = column.querySelector<HTMLElement>(".album-detail-body");
  const albumTitle = column.querySelector<HTMLElement>(".album-detail-body > h1");
  // The panel starts level with the album's big title, not with the column's top
  // edge: the overline above it is not part of the lyrics area.
  //
  // Take the title's own viewport position rather than adding its offset to the
  // column's. Both boxes go to zero together while the pane is not laid out, so
  // the old sum quietly produced "0 + cached offset" — a plausible-looking but
  // wrong number that no measurement could contradict.
  if (measurable(albumTitle)) {
    lyricsTitleTop = Math.round(albumTitle.getBoundingClientRect().top);
  }
  // Both states put their first line on the album title's line, so collapsing
  // only changes the height and nothing moves vertically. The panel's first line
  // sits `firstLineInset` below its own top edge (border plus padding), so the
  // edge belongs that far above the title line — putting the edge exactly on the
  // title leaves the first line a whole inset too low, which is what made both
  // states sit below the title.
  //
  // The insets come from the stylesheet, never from the element's measured box:
  // reading the live box made this circular, since the measurement depended on
  // the position this code had just set.
  const panelStyles = getComputedStyle(panel);
  const parsedInset = (name: string, fallback: number) => {
    const value = parseFloat(panelStyles.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };
  // The column's own left edge is measured from the header nav, so re-take it
  // here: this runs on every detail render, tab switch and resize, which is
  // exactly when the nav can have changed size.
  const borderTop = parseFloat(panelStyles.borderTopWidth) || 0;
  const firstLineInset = borderTop + parsedInset("--lyrics-top-inset", 16);
  if (lyricsTitleTop !== null) {
    setSharedGeometry("--lyrics-top", `${lyricsTitleTop - firstLineInset}px`);
  }
  // The panel's own horizontal padding mirrors the column's, so the lyrics sit
  // on the same two vertical lines as the album title and its credits rule. The
  // column's padding is not one number: it carries a scrollbar allowance that
  // only bites once the track list is tall enough to scroll, so it is measured
  // rather than written down. The panel's box already spans the column's, so
  // copying the inner insets lines the two content boxes up. The lyrics list
  // reserves no scrollbar track of its own (see .lyric-list), so there is
  // nothing further to compensate for here.
  const columnStyles = getComputedStyle(column);
  const paddingLeft = parseFloat(columnStyles.paddingLeft) || 0;
  const paddingRight = parseFloat(columnStyles.paddingRight) || 0;
  const borderLeft = parseFloat(columnStyles.borderLeftWidth) || 0;
  const borderRight = parseFloat(columnStyles.borderRightWidth) || 0;
  setSharedGeometry("--lyrics-left-pad", `${paddingLeft + borderLeft}px`);
  setSharedGeometry("--lyrics-right-pad", `${paddingRight + borderRight}px`);
  // The track list and the expanded lyrics card end on ONE line, and the line
  // belongs to the list: the scroller keeps one row of its own height free at its
  // foot (that band is where the transport controls are meant to move later), so
  // both views show the same visible area whatever the track count — which is what
  // makes switching between them stand still. The list is never asked to give up a
  // row it is not showing: a list too short to reach the band only loses the row's
  // height. The row grid is read from the first row's own top, which does not move
  // with the box: measuring against the box's current bottom instead would make the
  // reserve feed back into its own measurement (measured: it settled anywhere
  // between 0 and 7px and the list kept cutting a row in half).
  const trackRows = [...column.querySelectorAll<HTMLElement>("#album-tab-content .track-item")]
    .map((row) => row.getBoundingClientRect())
    .filter((box) => box.width > 0);
  // The credits block is pinned to the column's foot, so it is the fixed edge the
  // line is measured against. Never run past the column itself.
  const credits = column.querySelector<HTMLElement>(".album-detail-footer")
    ?? column.querySelector<HTMLElement>(".producer-section");
  const creditsTop = measurable(credits) ? Math.round(credits.getBoundingClientRect().top) : null;
  if (creditsTop !== null && trackRows.length > 0) {
    const rowHeight = trackRows[0].height;
    const space = creditsTop - trackRows[0].top;
    const wholeRows = rowHeight > 0 ? Math.floor(space / rowHeight) : 0;
    // Two whole rows are handed over, plus the slice of a row the scroller was cutting
    // through, so the cut still lands on a row's bottom rule and the list shows exactly
    // one row fewer than one reservation did (the owner asked for the extra room). A
    // short window gives up what it can: the reservation never eats the list's last
    // whole row, and never drops to zero — with no band at all the transport row had
    // nothing to sit in and its buttons spilled onto the credits line (measured on a
    // 827x877 window: reserve 0px, the row 0px tall, the buttons over the credits).
    const wanted = space - (wholeRows - 2) * rowHeight;
    const ceiling = space - rowHeight;
    trackReserve = wholeRows >= 1 ? Math.round(Math.max(0, Math.min(wanted, ceiling))) : 0;
  }
  // Written under the same guard as the measurements above: an album with no
  // measurable track row (the introduction tab, an empty album) keeps the last
  // reserve instead of letting the list jump back to full height for one frame.
  if (trackReserve !== null) stage.style.setProperty("--track-reserve", `${trackReserve}px`);
  // The line is that footer's own top edge less the reserved row — the same
  // expression the stylesheet builds the scroller's bottom margin from, so the card
  // and the list agree by construction instead of by a second measurement.
  if (measurable(body)) {
    const columnBottom = Math.round(column.getBoundingClientRect().bottom);
    const listBottom = creditsTop === null ? columnBottom : creditsTop - (trackReserve ?? 0);
    lyricsBottomInset = Math.max(0, stageHeight - Math.min(listBottom, columnBottom));
  }
  if (lyricsBottomInset !== null) {
    setSharedGeometry("--lyrics-bottom", `${lyricsBottomInset}px`);
  }
  // **区域**：听后感面板与歌词面板**共用同一块区域的左右与顶边**（底边则用 `--lyrics-bottom`，
  // 也就是与歌词面板同一条底边 —— 曲目列表底边，正好在控制栏之上）。
  // 为什么不能直接复用歌词面板那套 `--lyrics-*`：那几个变量只写在 `.music-lyrics-panel` 的规则里，
  // 评论面板拿不到（实测退成 l:0 r:157，而歌词是 l:832 r:1550）。
  if (creditsTop !== null) {
    const columnBox = column.getBoundingClientRect();
    setRegion("--detail-region-left", `${Math.round(columnBox.left)}px`);
    setRegion("--detail-region-right", `${Math.round(stage.clientWidth - columnBox.right)}px`);
    setRegion("--detail-region-top", `${Math.round(columnBox.top)}px`);
  }
  // The lyrics card's own rule is the band's bottom border, and it belongs on the
  // album column's rule — the top border of its facts block — so the song block
  // above it can carry the album title's type size without the two views' rules
  // drifting apart. The band is handed the distance from its own top as a minimum
  // height, which is the same number, because the rule IS its bottom edge. Measured
  // rather than written down: a wrapped album title moves the album's rule down.
  const facts = column.querySelector<HTMLElement>(".album-facts");
  const band = document.querySelector<HTMLElement>("#music-lyrics-panel .lyrics-band");
  if (measurable(facts) && measurable(band)) {
    lyricsBandMin = Math.max(
      0,
      Math.round(facts.getBoundingClientRect().top - band.getBoundingClientRect().top),
    );
  }
  if (lyricsBandMin !== null) panel.style.setProperty("--lyrics-band-min", `${lyricsBandMin}px`);
  // The transport row's box: the column's own left and right edges, and the credits
  // line it sits above. Measured, so it follows the responsive column and the reserved
  // row without a second set of numbers to keep in step.
  const transport = document.querySelector<HTMLElement>(".detail-transport");
  if (transport && measurable(column) && creditsTop !== null) {
    const columnBox = column.getBoundingClientRect();
    const stageWidth = stage.clientWidth;
    transport.style.setProperty("--transport-left", `${Math.round(columnBox.left)}px`);
    transport.style.setProperty("--transport-right", `${Math.round(stageWidth - columnBox.right)}px`);
    transport.style.setProperty("--transport-bottom", `${Math.round(stageHeight - creditsTop)}px`);
  }
  // The sliding names are sized by the line they sit on, so they are re-measured
  // with everything else here (window resize included).
  applyNameSlides();
  // The "more tracks below" chevron belongs to this same render: leaving it to the
  // ResizeObserver alone meant it kept a stale state after an album was opened (the stage
  // does not resize when the pane appears), so a long album hid it until the first scroll
  // and a single-track album — which cannot be scrolled — kept showing it.
  syncTrackMore();
  // No width cap: the album switcher sits above the panel's top edge, so
  // spanning the column's full width cannot cover it.
}
// Both measurements are layout-dependent, so keep them correct on resize. Once per
// frame, NOT on a 150ms debounce: while the window is being dragged, a debounced run
// leaves the reservation, the shared bottom line and the transport row's measured box
// holding values from different window heights, and the list's visible bottom visibly
// jumps away from the control row (and overshoots past it) until the timer lands.
let lyricAlignFrame = 0;
window.addEventListener("resize", () => {
  if (lyricAlignFrame) return;
  lyricAlignFrame = requestAnimationFrame(() => {
    lyricAlignFrame = 0;
    syncLyricsPanelAlignment();
  });
});
// The resize event can arrive before the browser has laid the new size out, which left
// every measurement one layout behind: the list's visible bottom then sat over the
// transport row until something else happened to move. A ResizeObserver fires after
// layout, so the numbers are always taken from the size that is actually on screen.
new ResizeObserver(() => {
  syncLyricsPanelAlignment();
  syncTrackMore();
}).observe(stage);
// The "more tracks below" chevron is shown while the track list really has rows below its
// visible bottom, and hidden again at the end of the list. The list itself is rebuilt for
// every album, so its scrolling is watched from the stage with a capture listener (scroll
// does not bubble) rather than on the element, which would be thrown away.
function syncTrackMore() {
  const more = document.querySelector<HTMLElement>("#track-more");
  if (!more) return;
  const scroller = document.querySelector<HTMLElement>("#album-detail-content .album-detail-scroll");
  // The TRACK ROWS are what matters, not the scroller's content: the album column also
  // holds the title, the facts and the tabs, so `scrollHeight > clientHeight` was true
  // for an album with a single track and the chevron showed for it. Compare the last
  // row's own bottom with the scroller's visible bottom instead — the same row geometry
  // the reservation uses.
  const lastRow = scroller?.querySelector<HTMLElement>("#album-tab-content .track-item:last-of-type");
  if (!scroller || !lastRow) {
    more.hidden = true;
    return;
  }
  const room = lastRow.getBoundingClientRect().bottom - scroller.getBoundingClientRect().bottom;
  more.hidden = room <= 8;
}
stage.addEventListener("scroll", syncTrackMore, { capture: true, passive: true });

// The seek row's own labels and its slider. The clock drives the slider (see
// syncLyricsPosition); while the pointer is on it, the slider is the source of truth and
// dragging only PREVIEWS the time — the seek happens on release, so scrubbing cannot stutter
// the audio. Left/right arrows work because it is a real range input; no course is added.
function seekTimeText(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  const hours = Math.floor(minutes / 60);
  const mm = String(hours ? minutes % 60 : minutes).padStart(2, "0");
  return `${hours ? `${hours}:` : ""}${mm}:${String(rest).padStart(2, "0")}`;
}

let seekingDrag = false;
function syncSeekRow(currentTime: number, duration: number): void {
  const row = document.querySelector<HTMLElement>("#detail-seek");
  const range = document.querySelector<HTMLInputElement>("#detail-seek-range");
  const current = document.querySelector<HTMLElement>("#detail-seek-current");
  const total = document.querySelector<HTMLElement>("#detail-seek-total");
  if (!row || !range || !current || !total) return;
  // The row is part of the band's layout, so it is ALWAYS on screen: opening an album shows
  // it at 00:00 / 00:00, dimmed and not draggable, rather than letting it appear only once a
  // track loads. A later arrival would read as the band rearranging itself.
  const usable = Number.isFinite(duration) && duration > 0;
  row.dataset.empty = !usable || (currentTime <= 0 && !seekingDrag) ? "true" : "false";
  range.disabled = !usable;
  if (!usable) {
    range.max = "0";
    range.value = "0";
    current.textContent = seekTimeText(0);
    total.textContent = seekTimeText(0);
    range.style.setProperty("--seek-progress", "0%");
    return;
  }
  const shown = seekingDrag ? Number(range.value) : Math.min(currentTime, duration);
  range.max = String(duration);
  if (!seekingDrag) range.value = String(shown);
  current.textContent = seekTimeText(shown);
  total.textContent = seekTimeText(duration);
  range.style.setProperty("--seek-progress", `${(shown / duration) * 100}%`);
}
function seekRowTimeFromEvent(range: HTMLInputElement, clientX: number): number {
  const box = range.getBoundingClientRect();
  const ratio = box.width > 0 ? Math.min(1, Math.max(0, (clientX - box.left) / box.width)) : 0;
  return ratio * Number(range.max || 0);
}
{
  const range = document.querySelector<HTMLInputElement>("#detail-seek-range");
  const bubble = document.querySelector<HTMLElement>("#detail-seek-bubble");
  const field = document.querySelector<HTMLElement>(".detail-seek-field");
  if (range && bubble && field) {
    const showBubble = (clientX: number) => {
      const seconds = seekRowTimeFromEvent(range, clientX);
      bubble.textContent = seekTimeText(seconds);
      bubble.style.left = `${Math.min(100, Math.max(0, ((clientX - range.getBoundingClientRect().left) / Math.max(1, range.getBoundingClientRect().width)) * 100))}%`;
    };
    field.addEventListener("pointermove", (event) => {
      // Nothing to preview while the row is empty: no bubble over a dead slider.
      const row = document.querySelector<HTMLElement>("#detail-seek");
      if (row?.dataset.empty === "true") return;
      showBubble(event.clientX);
    });
    range.addEventListener("pointerdown", () => {
      seekingDrag = true;
    });
    range.addEventListener("input", () => {
      seekingDrag = true;
      bubble.textContent = seekTimeText(Number(range.value));
    });
    range.addEventListener("change", () => {
      seekingDrag = false;
      player.seek(Number(range.value));
    });
    range.addEventListener("pointerup", () => {
      seekingDrag = false;
      player.seek(Number(range.value));
    });
    range.addEventListener("blur", () => {
      seekingDrag = false;
    });
  }
}

let lyricScrollFrame = 0;
// Smooth scrolling here is hand-rolled on purpose. scrollIntoView({smooth}) is
// retargeted while the previous animation is still running at every line change,
// which reads as "jump down, then drift back". Owning the scrollTop animation
// makes each move a single continuous glide.
function centerLyricLine(snap: boolean) {
  const list = document.querySelector<HTMLElement>("#lyric-list");
  if (!list) return;
  const line = activeLyricLine();
  if (!line) return;
  const start = list.scrollTop;
  const lineTop = line.getBoundingClientRect().top - list.getBoundingClientRect().top + start;
  const max = Math.max(0, list.scrollHeight - list.clientHeight);
  const target = Math.max(0, Math.min(max,
    lineTop - Math.max(0, (list.clientHeight - line.offsetHeight) / 2),
  ));
  if (lyricScrollFrame) cancelAnimationFrame(lyricScrollFrame);
  lyricScrollFrame = 0;
  if (snap || lyricFollowReduced() || Math.abs(target - start) < 2) {
    list.scrollTop = target;
    return;
  }
  // Short and front-loaded: the lyric must look settled as the line starts, not
  // a third of a second later, which reads as the text lagging the song.
  const duration = Math.min(300, 150 + Math.abs(target - start) * 0.1);
  const started = performance.now();
  const step = (now: number) => {
    lyricScrollFrame = 0;
    if (!line.isConnected) return;
    const progress = Math.min(1, (now - started) / duration);
    const eased = 1 - (1 - progress) ** 3;
    list.scrollTop = start + (target - start) * eased;
    if (progress < 1) lyricScrollFrame = requestAnimationFrame(step);
  };
  lyricScrollFrame = requestAnimationFrame(step);
}

function syncLyricsPosition(currentTime: number) {
  syncSeekRow(currentTime, playerState?.duration ?? 0);
  // A jump the player has not caught up with yet. While it is set, the line the viewer
  // clicked stays the active one even though the reported time is still before it — during
  // playback the seek takes a moment to take effect, and computing from the stale time
  // flicked the active line to the previous one first (paused, the clock stands still, so
  // it was always right). It clears as soon as the clock reaches that line, or after a
  // deadline in case the seek never lands.
  if (lyricJump && (currentTime >= lyricJump.time || performance.now() > lyricJump.deadline)) {
    lyricJump = null;
  }
  const computed = activeLyricIndex(lyricLines, currentTime);
  // Harder judge than the app's own clock, which reports the target optimistically and then
  // travels through everything in between on a long seek: the AUDIO ELEMENT's own currentTime
  // is the authority. The guard is dropped only when the element has really reached the line
  // AND the line computed from the clock agrees; the deadline is only a way out if a seek
  // never lands.
  const audioTime = document.querySelector<HTMLAudioElement>("audio")?.currentTime ?? 0;
  if (
    lyricJump &&
    ((audioTime >= lyricJump.time && computed >= lyricJump.index) ||
      performance.now() > lyricJump.deadline)
  ) {
    lyricJump = null;
  }
  const index = lyricJump && computed < lyricJump.index ? lyricJump.index : computed;
  if (index === activeLyric) return;
  activeLyric = index;
  updateLyricFocus(index);
  if (index < 0 || Date.now() < lyricFollowUntil) return;
  centerLyricLine(false);
}

// True while the lyrics card's close animation is running. The panel's own `hidden` is set
// by the transition at the END of that animation, so without this any sync in between (the
// lyric clock fires on every line while a song plays) started the close all over again and
// it never finished.
// （`lyricsClosing` / `lyricsPanelRequested` 的声明在模块顶部，理由见那边。）
// 用户是否要求显示歌词页 —— 也就是「词」按钮的开关状态。
//
// 为什么需要一个单独的标志、而不是直接看面板的 `hidden`：面板的 `hidden` 由 SurfaceTransition
// 在**动画结束时**才设置，所以关闭动画进行到一半时它仍是 false。早先用的是一个**持久化偏好**
// （`lyricsCollapsed`）当开关，那个值一旦在某种路径下被置为 true 就会永久挡住歌词页（重启也不
// 恢复），主人遇到的就是"有歌词的歌、点了词没反应"。现在这个标志只活在内存里、只由按钮翻转，
// 且每条会改变可见性的路径（换歌、进/退专辑页、播放状态变化）都会经由 syncLyricsPanel 重新对账。
// 标志本身的声明在**模块顶部**（见 lyricJump 旁的说明）：本组函数会在模块求值期间被调用一次。
function syncTransportControls() {
  const track = playerState?.currentTrack;
  // 播放模式: the button shows the CURRENT mode, exactly as NetEase's does, and says it in
  // its label so the glyph is never the only clue.
  const modeButton = document.querySelector<HTMLButtonElement>("#transport-play-mode");
  const active = PLAY_MODES.find((entry) => entry.mode === preferences.playMode) ?? PLAY_MODES[0];
  if (modeButton) {
    // **只在模式真的变了时才写 DOM。**
    // 早先这里是无条件 `modeButton.innerHTML = active.icon`：播放中音频的 timeupdate 会高频
    // 触发状态同步，于是指针下面的 <svg> 被不停销毁重建，点击经常落在一个"已被替换掉"的元素上
    // —— 表现就是"播放中点播放模式时灵时不灵，暂停后特别迅速"（主人报的正是这个）。
    // 同一个函数里音质那一格本来就有 `textContent !== label` 这道守卫，这里漏了。
    if (modeButton.dataset.mode !== active.mode) {
      modeButton.dataset.mode = active.mode;
      modeButton.innerHTML = active.icon;
      modeButton.setAttribute("aria-label", `播放模式：${active.label}`);
      modeButton.title = `播放模式：${active.label}`;
    }
  }
  // 音质/格式 chip: shows the track's format once one is loaded, and the word 音质 before
  // that — the owner's call, because an empty slot read as "missing" even though it was
  // reserving its width. Shaped like NetEase's 本地 chip (see .transport-format).
  const format = document.querySelector<HTMLElement>("#transport-format");
  if (format) {
    const label = track?.format || "音质";
    if (format.textContent !== label) format.textContent = label;
    format.classList.toggle("is-empty", !track?.format);
    format.setAttribute("aria-label", track?.format ? `音质：${track.format}` : "音质");
  }
  // 收藏到歌单 and the two skips follow the track: with nothing loaded the row says so
  // rather than offering controls that cannot act.
  for (const id of ["#transport-add-playlist", "#track-prev", "#track-next"]) {
    const button = document.querySelector<HTMLButtonElement>(id);
    if (button) button.disabled = !track;
  }
}

function syncLyricsPanel() {
  const panelElement = document.querySelector<HTMLElement>("#music-lyrics-panel");
  const status = document.querySelector<HTMLElement>("#transport-lyric-status");
  const openLyrics = document.querySelector<HTMLButtonElement>("#transport-lyrics-open");
  if (!panelElement || !status || !openLyrics) return;
  const state = playerState;
  const track = state?.currentTrack;
  const transportActive = !!track &&
    (state.transport === "playing" || state.transport === "paused" || state.transport === "loading");
  // Relaxed on the owner's call: the card is about the track's LYRICS, not about the
  // transport running, so a track that is not playing can still be read (its follow
  // clock simply does not advance until it plays again). The 词 button opens and closes it.
  const hasLyrics = !!track && lyricLines.length > 0;
  // `lyricsAllowed`：听后感面板打开时会把它置 false（两者占同一块区域，互斥）。
  // 这里**不**去调用 syncCommentsView 来"收掉对方" —— 那会成环（见 lyricsAllowed 的说明）。
  const shouldShow = hasLyrics && lyricsPanelRequested && lyricsAllowed && stage.dataset.mode !== "archive";
  const wasHidden = panelElement.hidden;
  // The card enters and leaves from and back to the right (see lyricsPanelTransition):
  // it owns `hidden`, so the close animates out before the card disappears. The panel
  // re-measures when the show finishes, which is also when its band finally has a box.
  if (shouldShow) {
    if (wasHidden) {
      // 歌词**真的要转为可见**时才收回听后感面板的展示权（改标志，不调用 syncCommentsView，
      // 避免成环；它会在自己的下一次 sync 里按这个标志收起来）。
      // 注意：这一句原先被我写在 `if (wasHidden)` 里但**位置对了、条件错了** —— 它会在每次
      // "歌词需要显示"时都清掉评论的意图，于是"退回专辑架再回来"时评论面板不再自动恢复
      // （实测 `切回详情后 commentsHidden: true`）。
      if (document.querySelector<HTMLElement>("#music-comments-panel")) commentsRequested = false;
      lyricsPanelTransition.show(preferences.reduced, syncLyricsPanelAlignment);
      // Measure NOW as well, not only when the entrance finishes: the panel is laid out
      // the moment `show` un-hides it, and its entrance only moves it sideways, so the
      // vertical measurements taken here are already exact. Without this the card painted
      // its first frame from the previous values — its content and top rule a little too
      // high — and only settled when the animation ended.
      syncLyricsPanelAlignment();
    }
  } else if (!wasHidden && !lyricsClosing) {
    // Only kick off a close when the card is actually up AND one is not already running:
    // the panel's `hidden` is set by the transition at the END of the animation, so any
    // sync in between (the lyric clock fires on every line while playing) used to start
    // the close again and again, and it never finished.
    lyricsClosing = true;
    lyricsPanelTransition.hide(preferences.reduced, () => {
      lyricsClosing = false;
      syncLyricsPanel();
      syncCommentsView();
    });
  }
  // The card slides OUT over the album column, so the column must start coming back the
  // moment the close is asked for — not when the animation ends. Computing these from the
  // intended state is what makes the two overlap instead of leaving the page blank for the
  // length of the exit.
  const panelVisible = shouldShow ? true : panelElement.hidden === false && lyricsClosing;
  syncLyricsSongInfo(track, !hasLyrics);
  stage.dataset.lyricsVisible = String(shouldShow || panelVisible);
  stage.dataset.lyricsPlaying = String(shouldShow);
  openLyrics.setAttribute("aria-expanded", String(shouldShow));
  openLyrics.setAttribute("aria-label", shouldShow ? "收起歌词" : "展开歌词");
  openLyrics.disabled = !hasLyrics;
  // The status line ALWAYS occupies its row, so the seek row above it never shifts. It used
  // to be `hidden` whenever there was nothing to say, which meant opening an album showed no
  // status line and pressing play inserted one — pushing the seek row up and moving the
  // progress bar the owner was aiming at. It is now kept in the layout and made INVISIBLE
  // when it has nothing to say: `visibility` reserves the space `display: none` gives up.
  const statusText = lyricStateText.startsWith("正在查找")
    ? "查找歌词…"
    : lyricStateText.startsWith("读取歌词失败")
      ? "歌词读取失败"
      : "暂无歌词";
  const statusSilent =
    !transportActive || lyricLines.length > 0 || lyricStateText.startsWith("尚未载入");
  status.classList.toggle("is-silent", statusSilent);
  status.setAttribute("aria-hidden", String(statusSilent));
  if (status.textContent !== statusText) status.textContent = statusText;
}

// The song playing, shown in the space the collapse toggle leaves on its left.
// The text is written as literal text, never markup: track metadata is
// third-party data.
// A name wider than the line it sits on slides across instead of wrapping, so the
// block keeps ONE line and the rule under it stays on the album column's rule (see
// syncLyricsPanelAlignment for that measurement). Both the overflow and the distance
// travelled are measured, and the second copy of the text is what makes the loop
// seamless. A viewer who asked for reduced motion keeps the plain ellipsis.
//
// Two places share this: the lyrics card's song title and artist, and the album page's
// own title and artist line. The archive page is deliberately left alone — its title
// is laid out by the per-character reel machinery (one reel per line, fitted type) and
// its artist is wrapped into spans by the text-motion machinery, so a horizontal line
// does not fit either; the owner kept that page as it is.
const SLIDE_SPEED = 36; // px per second
const SLIDE_GAP = 40; // px of blank between the two copies
const SLIDE_SELECTORS = [
  "#lyrics-song-title",
  "#lyrics-song-artist",
  "#album-detail-content .album-detail-body > h1 .music-title-main",
  "#album-detail-content .detail-artist-name",
];

function lyricsReducedMotion() {
  return preferences.reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function applyNameSlides() {
  for (const selector of SLIDE_SELECTORS) {
    const line = document.querySelector<HTMLElement>(selector);
    if (!line) continue;
    // Rebuilt from re-rendered content each time: once shadowed by the copies, the
    // element's own text is the copies' text, so the plain text is kept in a dataset.
    const shadowed = !!line.querySelector(".lyrics-slide-copy");
    const text = (shadowed ? line.dataset.slideText : line.textContent) ?? "";
    line.dataset.slideText = text;
    line.classList.remove("lyrics-sliding");
    line.style.removeProperty("--lyrics-slide-shift");
    line.style.removeProperty("--lyrics-slide-duration");
    line.textContent = text;
    if (!text || lyricsReducedMotion()) continue;
    const available = line.clientWidth;
    const needed = line.scrollWidth;
    // `+1` absorbs sub-pixel rounding: a name that only just fits must stay put.
    if (available <= 0 || needed <= available + 1) continue;
    const shift = needed + SLIDE_GAP;
    line.style.setProperty("--lyrics-slide-shift", `${shift}px`);
    line.style.setProperty("--lyrics-slide-duration", `${(shift / SLIDE_SPEED).toFixed(2)}s`);
    line.textContent = "";
    for (let copy = 0; copy < 2; copy += 1) {
      const span = document.createElement("span");
      span.className = "lyrics-slide-copy";
      span.textContent = text;
      line.append(span);
    }
    line.classList.add("lyrics-sliding");
  }
}

function syncLyricsSongInfo(track: MusicTrack | null | undefined, hide: boolean) {  const info = document.querySelector<HTMLElement>("#lyrics-song-info");
  if (!info) return;
  if (!track || hide) {
    info.hidden = true;
    lyricsSongTrackId = null;
    return;
  }
  info.hidden = false;
  if (lyricsSongTrackId === track.id) return;
  lyricsSongTrackId = track.id;
  const title = document.querySelector<HTMLElement>("#lyrics-song-title");
  const artist = document.querySelector<HTMLElement>("#lyrics-song-artist");
  if (title) title.textContent = track.title;
  if (artist) artist.textContent = track.artist;
  applyNameSlides();
}

function syncLyricClock() {
  if (!playerState?.playing || !lyricLines.length || document.hidden) {
    if (lyricClockFrame) cancelAnimationFrame(lyricClockFrame);
    lyricClockFrame = 0;
    return;
  }
  if (lyricClockFrame) return;
  const tick = () => {
    lyricClockFrame = 0;
    if (!playerState?.playing || !lyricLines.length || document.hidden) return;
    syncLyricsPosition(player.playbackTime);
    lyricClockFrame = requestAnimationFrame(tick);
  };
  lyricClockFrame = requestAnimationFrame(tick);
}

document.addEventListener("visibilitychange", syncLyricClock);

function updateQuality() {
  renderQuality = normalizeQuality(renderQuality);
  preferences.renderQuality = renderQuality;
  scene?.setQuality(renderQuality);
  viewer?.setQuality(renderQuality);
  syncQualityUI(renderQuality);
  const summary = document.querySelector("#quality-summary");
  if (summary)
    summary.textContent = `渲染 ${renderQuality.scale}% · 像素上限 ${renderQuality.pixelRatio}× · ${renderQuality.antialias === "off" ? "原始抗锯齿" : "SMAA"}`;
  savePrefs();
}
async function editGenres() {
  const body = document.querySelector("#panel-body");
  try {
    const rules = await request<GenreRules>("/api/genre-rules");
    if (!body?.isConnected || panel !== "library") return;
    body.innerHTML = `<p class="panel-intro">这里编辑展示流派、别名和专辑人工分类。保存后重新归并本地索引，不修改音频标签。</p><label class="field-label" for="genre-json">本地流派规则</label><textarea id="genre-json" class="json-editor" spellcheck="false">${esc(JSON.stringify(rules, null, 2))}</textarea><div class="panel-actions"><button data-action="save-genres" class="primary-button">保存并应用</button><button data-action="library">返回音乐库</button></div><p id="genre-error" role="alert"></p>`;
  } catch (error) {
    notify((error as Error).message);
  }
}
async function scan(saveRoots = false) {
  if (scanSubmitting || library.scan.running) return;
  scanSubmitting = true;
  clearTimeout(scanRefreshTimer);
  scanRefreshTimer = undefined;
  ++libraryStateVersion;
  const scanStartedAt = performance.now();
  try {
    const roots = saveRoots
      ? $<HTMLTextAreaElement>("#music-roots")
          .value.split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    const next = await request<MusicLibrary>("/api/library/scan", roots ? { roots } : {});
    scene?.recordProfileScan(performance.now() - scanStartedAt);
    ++libraryStateVersion; // Discard polls started before this accepted scan.
    notify("开始扫描音乐库，已有专辑可以继续浏览。");
    await receiveLibrary(next);
    clearTimeout(pollTimer);
    pollTimer = setTimeout(() => void loadLibrary(), 600);
  } catch (error) {
    notify((error as Error).message);
  } finally {
    scanSubmitting = false;
  }
}
async function enrich(one = false) {
  if (demo) return;
  try {
    await request(
      "/api/library/enrich",
      one ? { albumIds: [currentAlbum()!.id] } : {},
    );
    notify("已开始补充流派和制作资料，结果将缓存在本机。");
    await loadLibrary();
  } catch (error) {
    notify((error as Error).message);
  }
}
async function queryIntroductions(one = false) {
  const album = currentAlbum();
  if (demo || !library.albums.length || (one && !album)) return;
  if (introductionsStarting || library.introductions?.running) {
    notify("专辑介绍正在查询，进度可在设置中查看。");
    return;
  }
  introductionsStarting = true;
  introductionRequestError = "";
  updateIntroductionStatus();
  try {
    const next = await request<MusicLibrary>("/api/library/introductions", {
      ...(one ? { albumIds: [album!.id] } : {}),
      force: true,
    });
    // A GET started before this accepted job must not restore an older snapshot.
    libraryStateVersion++;
    apiAvailable = true;
    await receiveLibrary(next);
    const job = next.introductions;
    notify(
      job?.running
        ? `${one ? "这张专辑" : "音乐库"}的介绍查询已开始，可在设置中查看进度。`
        : job?.error ||
            (job && job.total > 0
              ? `专辑介绍查询完成：更新 ${job.updated} 张，未找到可靠资料 ${job.notFound} 张，查询失败 ${job.failed} 张。`
              : "当前没有需要查询的专辑。"),
    );
    clearTimeout(pollTimer);
    pollTimer = setTimeout(() => void loadLibrary(), 800);
  } catch (error) {
    introductionRequestError = (error as Error).message;
    notify(introductionRequestError);
  } finally {
    introductionsStarting = false;
    updateIntroductionStatus();
  }
}
function playAlbum(id?: string) {
  const a = currentAlbum();
  const tracks = a?.tracks.filter((track) => !track.offline) ?? [];
  if (!tracks.length) return;
  void player.play(id || tracks[0].id, tracks);
}

document.addEventListener("click", (e) => {
  if (boot?.active) return;
  const target = (e.target as HTMLElement).closest<HTMLElement>(
    "button, [data-action]",
  );
  // 点到别处就收起歌单菜单。这一步必须在 `if (!target)` 之前：点在非按钮的空白处时
  // target 为空，若放在后面就永远不会收起。
  if (transportMenuOpen) {
    const inside = (e.target as HTMLElement).closest("#transport-menu");
    const onSwitch = target?.dataset.action === "add-to-playlist";
    if (!inside && !onSwitch) closeTransportMenu();
  }
  if (moreMenuOpen) {
    const insideMore = (e.target as HTMLElement).closest("#transport-more-menu");
    const onMoreSwitch = target?.dataset.action === "more";
    if (!insideMore && !onMoreSwitch) closeMoreMenu();
  }
  if (!target) return;
  if (target.dataset.action === "dismiss-panel" && e.target !== target) return;
  if (target.dataset.theme) {
    setTheme(target.dataset.theme as Theme);
    return;
  }
  if (target.dataset.track) {
    playAlbum(target.dataset.track);
    return;
  }
  if (target.dataset.select) {
    const rulerStep = Number(target.dataset.rulerStep);
    select(Number(target.dataset.select),
      target.dataset.rulerStep !== undefined && Number.isInteger(rulerStep)
        ? { axis: "row", direction: rulerStep } : undefined);
    return;
  }
  if (target.dataset.album) {
    revealAlbum(target.dataset.album, target.dataset.searchTrack);
    return;
  }
  if (target.dataset.tab) {
    setTab(target.dataset.tab as "tracks" | "about");
    return;
  }
  if (target.dataset.filter !== undefined) {
    searchGenre = target.dataset.filter;
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) =>
        b.classList.toggle(
          "active",
          (b as HTMLElement).dataset.filter === searchGenre,
        ),
      );
    renderSearchResults();
    return;
  }
  const action = target.dataset.action;
  if (["library", "search", "settings", "playlists", "queue"].includes(action || "")) {
    searchGenre = "";
    openPanel(action as Panel);
    return;
  }
  switch (action) {
    case "choose-playlist":
      pendingPlaylistTrackId = target.dataset.trackId || "";
      openPanel("playlists");
      break;
    case "enqueue-track": {
      const track = library.albums.flatMap((album) => album.tracks).find((entry) => entry.id === target.dataset.trackId);
      if (!track || track.offline) notify("这首歌曲当前不可用。");
      else notify(player.enqueue([track]) ? "已加入播放队列。" : "这首歌曲已在播放队列中。");
      break;
    }
    case "create-playlist":
      void createPlaylist();
      break;
    case "select-playlist":
      selectedPlaylistId = target.dataset.playlistId || "";
      renderPlaylistList();
      break;
    case "add-pending-playlist":
      if (target.dataset.playlistId) void addPendingTrack(target.dataset.playlistId);
      break;
    case "play-playlist":
      if (target.dataset.playlistId) playPlaylist(target.dataset.playlistId);
      break;
    case "play-playlist-track":
      if (target.dataset.playlistId && target.dataset.trackId)
        playPlaylist(target.dataset.playlistId, target.dataset.trackId);
      break;
    case "rename-playlist":
      if (target.dataset.playlistId) void renamePlaylist(target.dataset.playlistId);
      break;
    case "delete-playlist":
      if (target.dataset.playlistId) void deletePlaylist(target.dataset.playlistId);
      break;
    case "move-playlist-track":
      if (target.dataset.playlistId && target.dataset.itemId)
        void movePlaylistTrack(target.dataset.playlistId, target.dataset.itemId, target.dataset.direction === "-1" ? -1 : 1);
      break;
    case "remove-playlist-track":
      if (target.dataset.playlistId && target.dataset.itemId)
        void removePlaylistTrack(target.dataset.playlistId, target.dataset.itemId);
      break;
    case "play-queue-track":
      if (target.dataset.trackId) void player.play(target.dataset.trackId);
      break;
    case "move-queue-track":
      if (target.dataset.trackId)
        player.moveQueuedTrack(target.dataset.trackId, target.dataset.direction === "-1" ? -1 : 1);
      break;
    case "remove-queue-track":
      if (target.dataset.trackId && !player.removeQueuedTrack(target.dataset.trackId))
        notify("正在播放的歌曲会保留在队列中。");
      break;
    // 没有 "lyrics-toggle" 分支：那是旧「展开/收起态」模型的入口，已无任何按钮派发它。
    // 现在歌词页的开与关都走 "lyrics-panel"（控制栏的「词」按钮）。
    case "lyrics-size-down":
      stepLyricSize(-1);
      break;
    case "lyrics-size-up":
      stepLyricSize(1);
      break;
    case "lyrics-align":
      stepLyricAlign();
      break;
    case "lyrics-panel": {
      // 控制栏的「词」按钮：在专辑页与歌词页之间切换。
      // 这里只记住**用户意图**，真正的显隐仍由 syncLyricsPanel + SurfaceTransition 执行 ——
      // 面板的 `hidden` 是动画结束时才被设置的，所以这里翻它会让关闭动画半路失效。
      // 只有"有曲目且有歌词"时才理会这次点击，否则按钮本来就该是暗的。
      const state = playerState;
      const track = state?.currentTrack;
      if (!track || lyricLines.length === 0) break;
      lyricsPanelRequested = !lyricsPanelRequested;
      // 用户要开/关歌词页 → 许可歌词显示，并收回听后感面板的展示权（两者占同一块区域）。
      // 这里是**单向**赋值、只调各自的 sync，不会在两个 sync 之间成环。
      if (lyricsPanelRequested) lyricsAllowed = true;
      commentsRequested = false;
      syncCommentsView();
      syncLyricsPanel();
      syncCommentsView();
      break;
    }
    case "queue-panel":
      openPanel("queue");
      break;
    case "seek-lyric": {
      const index = Number(target.dataset.lyricIndex);
      if (Number.isInteger(index) && lyricLines[index]) {
        // Jump to the line, mark it pending while the seek takes effect (see
        // syncLyricsPosition), and centre at once — a click is a jump, not a scroll.
        // The 50ms nudge is because a seek to the exact timestamp leaves the player
        // reporting a time a little before it, which is what flipped the active line.
        // The deadline is generous on purpose: the farther the jump, the longer the player
        // takes to actually arrive (the reported time travels through everything in
        // between), and dropping the guard early is what made far jumps land on the
        // previous line. Only a seek that never lands waits this long.
        const jumpTime = lyricLines[index].time + 0.05;
        lyricJump = { index, time: jumpTime, deadline: performance.now() + 3000 };
        player.seek(jumpTime);
        activeLyric = -2;
        syncLyricsPosition(jumpTime);
        centerLyricLine(true);
      }
      break;
    }
    case "queue-prev":
    case "track-prev":
      void player.previous();
      break;
    case "queue-next":
    case "track-next":
      void player.next();
      break;
    // The control bar's own queue button. The top bar's uses the generic panel opener
    // above; this one has to keep its aria-expanded honest for the new row.
    case "queue":
      openPanel("queue");
      $("#transport-queue")?.setAttribute("aria-expanded", "true");
      break;
    // 播放模式 cycles the four modes in order. The player owns what "next" means; the app
    // only owns the choice, which is remembered across sessions.
    case "play-mode": {
      const index = PLAY_MODES.findIndex((entry) => entry.mode === preferences.playMode);
      const next = PLAY_MODES[(index + 1) % PLAY_MODES.length];
      preferences.playMode = next.mode;
      player.setPlayMode(next.mode);
      savePrefs();
      syncTransportControls();
      break;
    }
    case "locate-playing": {
      const track = playerState.currentTrack;
      if (track) revealAlbum(track.albumId, track.id, { reuseOpenAlbum: true });
      break;
    }
    case "close-panel":
    case "dismiss-panel":
      closePanel();
      break;
    case "track-more": {
      // The chevron's own click: one screen further down the list. Kept deliberately
      // small and out of the way — the owner is trying the feel of it and will say if it
      // should go.
      const scroller = document.querySelector<HTMLElement>("#album-detail-content .album-detail-scroll");
      if (!scroller) break;
      scroller.scrollBy({
        top: Math.round(scroller.clientHeight * 0.9),
        behavior: lyricsReducedMotion() ? "auto" : "smooth",
      });
      break;
    }
    case "open":
      setMode("detail");
      break;
    case "back":
      setMode("archive");
      break;
    case "model-viewer":
      // Temporarily unavailable for the simplified CD shell (no inner assembly).
      break;
    case "sound-preview":
      effects.play("page-open");
      break;
    case "fullscreen":
      void (
        document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen()
      ).catch(() => notify("当前浏览器无法进入全屏。"));
      break;
    case "prev":
      stepAlbum(-1);
      break;
    case "next":
      stepAlbum(1);
      break;
    case "genre-prev":
      stepGenre(-1);
      break;
    case "genre-next":
      stepGenre(1);
      break;
    case "genres":
      openPanel("search");
      break;
    case "play-pause":
      playerState.currentTrack || playerState.queue.length ? void player.toggle() : playAlbum();
      break;
    case "like":
      void toggleLike();
      break;
    case "comments":
      // 听后感**不再是模态弹窗**，而是和歌词并列的第三个右列视图（专辑详情 ↔ 歌词 ↔ 评论）。
      // 这里和「词」按钮同样只记用户意图，真正的显隐交给 syncCommentsView()。
      if (!playerState?.currentTrack) {
        notify("先播放一首歌，再写听后感。");
        break;
      }
      commentsRequested = !commentsRequested;
      // 打开听后感时收回歌词的显示许可（两者占同一块区域）。关掉时不动歌词 ——
      // 歌词本来就该保持"用户上次的意图"，不该被这次点击顺带改变。
      if (commentsRequested) lyricsAllowed = false;
      syncCommentsView();
      syncLyricsPanel();
      syncCommentsView();
      break;
    // 「更多」：图标本身是开关；菜单里的项当前全部置灰（见 renderMoreMenu 的说明），
    // 所以这里只有开与关两种结果。
    case "more": {
      const button = document.querySelector<HTMLElement>("#transport-more");
      if (moreMenuOpen) closeMoreMenu();
      else if (button) {
        button.setAttribute("aria-expanded", "true");
        openMoreMenu(button);
      }
      break;
    }
    case "add-comment":
      void addComment();
      break;
    case "delete-comment":
      if (target.dataset.commentId) void deleteComment(target.dataset.commentId);
      break;
    // 收藏到歌单：图标本身是个开关（开/关菜单），菜单里的每一项才是真正的动作。
    // 菜单开着的期间把 aria-expanded 同步成 true，读屏与样式都靠它。
    case "add-to-playlist": {
      const anchor = e.target as HTMLElement | null;
      const button = $("#transport-add-playlist");
      if (!button) break;
      if (transportMenuOpen) {
        closeTransportMenu();
      } else {
        button.setAttribute("aria-expanded", "true");
        void openTransportMenu(anchor?.closest("button") ?? button);
      }
      break;
    }
    case "add-to-playlist-pick": {
      const button = e.target as HTMLElement | null;
      const playlistId = button?.dataset.playlist;
      const name = button?.querySelector(".transport-menu-name")?.textContent ?? "歌单";
      closeTransportMenu();
      if (playlistId) void addCurrentTrackToPlaylist(playlistId, name);
      break;
    }
    case "add-to-playlist-new": {
      closeTransportMenu();
      const track = playerState?.currentTrack;
      if (!track) {
        notify("当前没有在放的曲目，先播放一首再收藏。");
        break;
      }
      // 用程序内弹窗而不是 window.prompt：原生弹窗是浏览器样式的，和这套界面不是一回事。
      // 给一个默认名是因为服务端要求名称非空，用户可直接改。
      void askMusicName({ title: "新建歌单", value: "我的歌单", confirmLabel: "创建并收藏", placeholder: "例如：夜间驾驶" })
        .then((name) => {
          if (name) void createPlaylistWithCurrentTrack(name);
        });
      break;
    }
    // 没有 "stop" 分支：界面不再提供停止按钮。暂停已覆盖"停下声音"，而"回到开头"由进度条
    // 承担（拖到最左即可）。原先这里的分支在 dev.14 搬动控制栏后就没有任何按钮会派发它，
    // 属于死代码；player.stop() 方法本身仍被播放器内部使用（换队列、释放资源），故保留。
    case "scan":
      void scan(true);
      break;
    case "rescan":
      void scan();
      break;
    case "enrich-album":
      void enrich(true);
      break;
    case "enrich-library":
      void enrich();
      break;
    case "introduction-album":
      void queryIntroductions(true);
      break;
    case "introductions-library":
      void queryIntroductions();
      break;
    case "edit-genres":
      void editGenres();
      break;
    case "save-online":
      void (async () => {
        try {
          await request("/api/config", {
            musicBrainzContact:
              $<HTMLInputElement>("#metadata-contact").value.trim(),
            onlineEnabled: $<HTMLInputElement>("#online-enabled").checked,
          });
          notify("资料库设置已保存。可以开始补充专辑资料。");
        } catch (error) {
          notify((error as Error).message);
        }
      })();
      break;
    case "save-genres":
      void (async () => {
        const editor = $<HTMLTextAreaElement>("#genre-json");
        try {
          const body = JSON.parse(editor.value);
          await request("/api/genre-rules", body);
          await loadLibrary(true);
          notify("分类规则已保存并应用。");
          if (editor.isConnected && panel === "library") renderLibraryPanel();
        } catch (error) {
          const errorNode = document.querySelector("#genre-error");
          if (editor.isConnected && errorNode)
            errorNode.textContent = (error as Error).message;
          else notify((error as Error).message);
        }
      })();
      break;
    case "demo":
      demo = true;
      closePanel(() => void applyLibrary());
      break;
  }
});
const transportVolume = document.querySelector<HTMLElement>(".transport-volume");
const transportVolumePanel = document.querySelector<HTMLElement>("#transport-volume-popover");
const transportVolumeSlider = document.querySelector<HTMLInputElement>("#transport-volume");
const transportVolumeValue = document.querySelector<HTMLElement>("#transport-volume-value");
const transportVolumeButton = document.querySelector<HTMLButtonElement>("#transport-volume-button");
// 0% 时换上带叉的静音喇叭（NetEase 也有这个状态）。两处会调用：面板打开时的同步、
// 以及 input 事件（拖拽与键盘方向键都走这条）。只在状态真正翻转时才改 innerHTML，
// 否则每次 input 都会重建图标节点。
function applyVolumeMutedIcon(percent: number) {
  if (!transportVolumeButton) return;
  const muted = percent <= 0;
  if (transportVolumeButton.dataset.muted === String(muted)) return;
  transportVolumeButton.dataset.muted = String(muted);
  transportVolumeButton.innerHTML = muted ? icons.volumeMuted : icons.volume;
}

// 单击喇叭 = 静音/取消静音。静音时把当前音量存进 volumeBeforeMute，恢复时用它还原,
// which is the behaviour the owner asked for. Declared as a function so the preference read
// at boot can call it before this point in the module.
function toggleVolumeMute() {
  const slider = document.querySelector<HTMLInputElement>("#transport-volume");
  const value = document.querySelector<HTMLElement>("#transport-volume-value");
  const restingLevel = preferences.volumeBeforeMute > 0 ? preferences.volumeBeforeMute : 1;
  // 判断"是否静音"用 preferences.volume，它是唯一的真实来源。
  const nextVolume = preferences.volume > 0 ? 0 : restingLevel;
  if (preferences.volume > 0) preferences.volumeBeforeMute = preferences.volume;
  preferences.volume = nextVolume;
  player.setVolume(nextVolume);
  savePrefs();
  const percent = Math.round(nextVolume * 100);
  if (slider) {
    slider.value = String(percent);
    slider.style.setProperty("--volume-fill", `${percent}%`);
  }
  if (value) value.textContent = `${percent}%`;
  transportVolumeButton?.setAttribute("aria-label", `音量：${percent}%`);
  applyVolumeMutedIcon(percent);
}
if (transportVolume && transportVolumePanel && transportVolumeSlider && transportVolumeButton) {
  // 悬停即出、移开即收, as NetEase does — no click, and the slider is vertical. `focusin`
  // covers the keyboard path (tabbing to the button opens it; blur closes it again), so the
  // control is not mouse-only. The panel sits inside `.transport-volume`, so moving the
  // pointer from the button up into the slider keeps the pointer inside and does not close it.
  // The filled part of the track. One custom property drives the gradient stop; the native
  // thumb already sits at the value, so both ends agree without any measurement.
  const syncVolumeFill = () => {
    const percent = Math.max(0, Math.min(100, Number(transportVolumeSlider.value) || 0));
    transportVolumeSlider.style.setProperty("--volume-fill", `${percent}%`);
    applyVolumeMutedIcon(percent);
  };
  syncVolumeFill();
  const setVolumePanel = (open: boolean) => {
    transportVolumePanel.hidden = !open;
    transportVolumeButton.setAttribute("aria-expanded", String(open));
    if (!open) {
      if (volumeFollowFrame) cancelAnimationFrame(volumeFollowFrame);
      volumeFollowFrame = 0;
      return;
    }
    if (transportVolumeValue) {
      transportVolumeValue.textContent = `${Math.round(preferences.volume * 100)}%`;
    }
    // The track's filled portion tracks the slider, so the dialled-in volume is readable from
    // the bar itself rather than only from the readout under it.
    syncVolumeFill();
    // Positions AFTER the panel is laid out: measuring while it was still `hidden` returned
    // offsetWidth 0, so the centring formula degraded to "button centre − 0". The follow loop
    // then keeps it centred for as long as it is open.
    positionVolumePanel();
    if (!volumeFollowFrame) volumeFollowFrame = requestAnimationFrame(followVolumeButton);
  };
  // The panel is `position: fixed`, so it is NOT a DOM descendant of `.transport-volume` —
  // a `pointerleave` on the wrapper fires the moment the pointer enters the panel. The close
  // decision is therefore made from where the pointer actually is, not from which element
  // owns it: hovering any of the three live regions keeps the panel up.
  let closeTimer = 0;
  // Places the fixed panel just above the speaker, CENTRED on it — a centred chip is what the
  // owner asked for and what NetEase does (right-aligned, it read as an off-centre chip even
  // though its right edge matched the button's).
  // Centred on the last control, the chip can reach past the viewport's right edge, where
  // `.detail-transport`'s overflow would clip it again — and a clipped chip is also a
  // dead hover target, which is how the slider first vanished under the owner's cursor. So
  // the position is centred first and then pulled back on-screen if it overflows.
  const positionVolumePanel = () => {
    const buttonRect = transportVolumeButton.getBoundingClientRect();
    const width = transportVolumePanel.offsetWidth;
    const height = transportVolumePanel.offsetHeight;
    const centred = buttonRect.left + buttonRect.width / 2 - width / 2;
    const maxLeft = Math.max(4, window.innerWidth - width - 4);
    const left = Math.min(Math.max(4, centred), maxLeft);
    transportVolumePanel.style.left = `${left}px`;
    transportVolumePanel.style.right = "auto";
    transportVolumePanel.style.top = `${Math.max(4, buttonRect.top - height - 8)}px`;
  };
  // The speaker is not where it will stay when the panel opens: the detail column is still
  // settling (the scroll gutter lands a moment after the album opens) and it slides the whole
  // control row a few pixels sideways. A single measurement therefore lands the chip off
  // centre — measured, the button's left was 1352.20 when the chip was positioned and 1349.33
  // by the time the owner looked at it, which is the "偏左了一点点" he reported. ResizeObserver
  // does NOT help: the button only MOVES, its box never changes size, so no resize event fires.
  // While the panel is open it therefore follows the button frame by frame. It is one rect read
  // and two style writes per frame, and it cannot drift.
  let volumeFollowFrame = 0;
  const followVolumeButton = () => {
    if (transportVolumePanel.hidden) { volumeFollowFrame = 0; return; }
    positionVolumePanel();
    volumeFollowFrame = requestAnimationFrame(followVolumeButton);
  };
  const pointerInVolumeRegion = () => {
    const hovered = document.querySelectorAll(":hover");
    if (transportVolume.matches(":hover") || transportVolumePanel.matches(":hover")) return true;
    // Fixed descendants report `:hover` on their nearest positioned ancestor rather than on
    // the panel itself in some engines, so check the chain as well as the box.
    for (const node of hovered) if (transportVolumePanel.contains(node)) return true;
    return false;
  };
  const openVolumePanel = () => {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = 0; }
    setVolumePanel(true);
  };
  // 单击喇叭切换静音，拖动滑块调音量 —— 同一个控件要同时支持两种手势，就得把它们分开。
  // 滑块是拖动用的，所以那里只记录"是否移动过"；按钮上的单击若伴随位移就不算点击。
  // 滑块由 CDP 驱动时 click 不会触发，这个标记只用于真实指针（含按钮上的抖动）。
  let volumeDragged = false;
  let volumeDragStart: { x: number; y: number } | null = null;
  const noteVolumeDragStart = (event: PointerEvent) => {
    volumeDragStart = { x: event.clientX, y: event.clientY };
    volumeDragged = false;
  };
  const noteVolumeDragMove = (event: PointerEvent) => {
    if (!volumeDragStart) return;
    if (Math.hypot(event.clientX - volumeDragStart.x, event.clientY - volumeDragStart.y) > 4) {
      volumeDragged = true;
    }
  };
  transportVolumePanel.addEventListener("pointerdown", noteVolumeDragStart);
  transportVolumePanel.addEventListener("pointermove", noteVolumeDragMove);
  transportVolumeButton.addEventListener("pointerdown", noteVolumeDragStart);
  transportVolumeButton.addEventListener("pointermove", noteVolumeDragMove);
  transportVolumeButton.addEventListener("click", () => {
    if (volumeDragged) { volumeDragged = false; return; }
    toggleVolumeMute();
  });
  const closeVolumePanelSoon = () => {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      closeTimer = 0;
      // The delay covers the travel between regions; this check is what makes it correct —
      // if the pointer arrived anywhere in the volume region, the panel stays.
      if (!pointerInVolumeRegion()) setVolumePanel(false);
    }, 200);
  };
  transportVolume.addEventListener("pointerenter", openVolumePanel);
  transportVolume.addEventListener("pointermove", openVolumePanel);
  transportVolume.addEventListener("pointerleave", closeVolumePanelSoon);
  // The panel lives outside the wrapper once it is fixed, so it needs its own enter/reopen
  // handlers — otherwise moving into it counts as "leaving" the control.
  transportVolumePanel.addEventListener("pointerenter", openVolumePanel);
  transportVolumePanel.addEventListener("pointermove", openVolumePanel);
  transportVolumePanel.addEventListener("pointerleave", closeVolumePanelSoon);
  transportVolumeButton.addEventListener("focus", openVolumePanel);
  transportVolume.addEventListener("focusout", (event) => {
    if (!transportVolume.contains(event.relatedTarget as Node | null)) setVolumePanel(false);
  });
}

document.addEventListener("input", (e) => {
  const el = e.target as HTMLInputElement;
  // The control bar's volume slider drives the same preference and player method as the
  // settings page's, so the two stay in step while this one is dragged.
  if (el.id === "transport-volume") {
    const level = Number(el.value) / 100;
    preferences.volume = level;
    // Remember the level the user deliberately dialled in, or 取消静音 would restore a stale
    // value: dial 40% → mute → unmute must come back to 40%, not to whatever was set before.
    if (level > 0) preferences.volumeBeforeMute = level;
    player.setVolume(preferences.volume);
    savePrefs();
    if (transportVolumeValue) transportVolumeValue.textContent = `${el.value}%`;
    transportVolumeButton?.setAttribute("aria-label", `音量：${el.value}%`);
    el.style.setProperty("--volume-fill", `${el.value}%`);
    applyVolumeMutedIcon(Number(el.value));
    return;
  }
  if (el.dataset.quality && el.type === "range") {
    renderQuality = normalizeQuality({
      ...renderQuality,
      [el.dataset.quality]: Number(el.value),
    });
    updateQuality();
  }
  if (el.id === "bgm-volume") {
    preferences.bgmVolume = Number(el.value) / 100;
    player.setBgmVolume(preferences.bgmVolume);
    savePrefs();
  }
  if (el.id === "sound-volume") {
    preferences.soundVolume = Number(el.value) / 100;
    effects.configure({
      sound: preferences.sound,
      music: false,
      soundVolume: preferences.soundVolume,
      musicVolume: 0,
    });
    savePrefs();
  }
  if (el.id === "album-search") renderSearchResults();
  if (el.id === "volume") {
    const level = Number(el.value) / 100;
    preferences.volume = level;
    // 与播放栏的滑块同口径：这里也要记下用户设定的音量，否则从设置页改完再静音会还原成旧值。
    if (level > 0) preferences.volumeBeforeMute = level;
    player.setVolume(preferences.volume);
    savePrefs();
    // 设置页改音量后，播放栏的滑块/读数/图标要跟着走（两个控件共用一个偏好）
    const slider = document.querySelector<HTMLInputElement>("#transport-volume");
    if (slider) {
      slider.value = String(Math.round(level * 100));
      slider.style.setProperty("--volume-fill", `${Math.round(level * 100)}%`);
    }
    const readout = document.querySelector<HTMLElement>("#transport-volume-value");
    if (readout) readout.textContent = `${Math.round(level * 100)}%`;
    transportVolumeButton?.setAttribute("aria-label", `音量：${Math.round(level * 100)}%`);
    applyVolumeMutedIcon(Math.round(level * 100));
  }
});
document.addEventListener("change", (e) => {
  const el = e.target as HTMLInputElement;
  if (el.id === "music-sort" && ["genre", "artist", "album"].includes(el.value)) {
    if (preferences.sortMode === el.value) return;
    preferences.sortMode = el.value as MusicSortMode;
    savePrefs();
    location.reload();
    return;
  }
  if (el.id === "quality-preset") {
    preferences.quality = el.value as QualityPreset;
    renderQuality = normalizeQuality(qualityPresets[preferences.quality]);
    updateQuality();
  }
  if (el.dataset.quality) {
    renderQuality = normalizeQuality({
      ...renderQuality,
      [el.dataset.quality]:
        el.dataset.quality === "antialias" ? el.value : Number(el.value),
    });
    updateQuality();
  }
  if (el.id === "sound-setting") {
    preferences.sound = el.checked;
    effects.configure({
      sound: el.checked,
      music: false,
      soundVolume: preferences.soundVolume,
      musicVolume: 0,
    });
    savePrefs();
  }
  if (el.id === "song-fade-setting") {
    preferences.songFade = el.checked;
    player.setSongFadeEnabled(el.checked);
    savePrefs();
  }
  if (el.id === "reduced-motion") {
    preferences.reduced = el.checked;
    if (el.checked) {
      browseTransition.finish();
      detailTransition.finish();
    }
    syncSelectionMotion();
    scene?.setReduced(el.checked);
    stage.classList.toggle("reduce-motion", el.checked);
    updateSelection();
    savePrefs();
  }
  if (el.id === "bgm-setting") {
    preferences.bgm = el.checked;
    player.setBgmEnabled(el.checked);
    savePrefs();
  }
});
document.addEventListener("keydown", (e) => {
  if (boot?.active) return;
  if (viewer?.isOpen) return;
  if (e.key === "Escape") {
    // 先关小菜单，再关侧栏，最后才退回专辑架：Esc 的含义随"当前最上层的浮层"递进，
    // 这样打开菜单时按一次 Esc 不会把整个详情页也一起退掉。
    if (moreMenuOpen) return closeMoreMenu();
    if (transportMenuOpen) return closeTransportMenu();
    panel ? closePanel() : setMode("archive");
    return;
  }
  if (panel) {
    if (e.key === "Tab") {
      const items = [
        ...document.querySelectorAll<HTMLElement>(
          "#music-panel-root button:not([disabled]), #music-panel-root input, #music-panel-root textarea, #music-panel-root select, #music-panel-root a",
        ),
      ];
      if (!items.length) return;
      const first = items[0],
        last = items.at(-1)!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    return;
  }
  if (
    (e.target as HTMLElement).matches("[role=tab]") &&
    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
  ) {
    e.preventDefault();
    setTab(
      e.key === "Home"
        ? "tracks"
        : e.key === "End"
          ? "about"
          : activeTab === "tracks"
            ? "about"
            : "tracks",
    );
    $(`#tab-${activeTab}`).focus();
    return;
  }
  if (
    (e.target as HTMLElement).matches(
      "input, textarea, select, [contenteditable=true]",
    )
  )
    return;
  if (e.key === "/") {
    e.preventDefault();
    searchGenre = "";
    openPanel("search");
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    stepGenre(-1);
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    stepGenre(1);
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    stepAlbum(-1);
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    stepAlbum(1);
  }
  if (e.key === "Enter" && !(e.target as HTMLElement).closest("button, a")) {
    e.preventDefault();
    setMode("detail");
  }
  if (e.code === "Space" && !(e.target as HTMLElement).closest("button, a")) {
    e.preventDefault();
    playerState.currentTrack ? void player.toggle() : playAlbum();
  }
});

let lastFrame = 0,
  frameCount = 0;

// Render pacing. The archive scene is redrawn on every display refresh even when
// nothing moves, which pins the GPU at the panel's refresh rate while the user just
// reads the shelf or listens to music. Frames are now paced: display rate while the
// user is interacting or something is visibly transitioning, and a low rate once the
// picture settles. scene.update() integrates from the frame timestamp and clamps its
// step at 50 ms, so a 30 fps idle cadence stays exact.
const IDLE_INTERVAL_MS = 1000 / 30;
const ACTIVITY_HOLD_MS = 400;
const TRANSITION_HOLD_MS = 4000;
let activeUntil = 0;
let lastRenderedAt = 0;
let lastPlayerSignature = "";
const keepActive = (hold = ACTIVITY_HOLD_MS) => {
  activeUntil = Math.max(activeUntil, performance.now() + hold);
};
for (const eventName of ["pointermove", "pointerdown", "pointerup", "keydown", "wheel"]) {
  window.addEventListener(eventName, () => keepActive(), { passive: true });
}
window.addEventListener("resize", () => keepActive(TRANSITION_HOLD_MS));
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) keepActive();
});

function frame(ms: number) {
  if (!document.hidden && scene) {
    const now = performance.now();
    const fullRate = Boolean(viewer?.isOpen) || Boolean(boot?.active) || now < activeUntil;
    if (!fullRate && now - lastRenderedAt < IDLE_INTERVAL_MS) {
      requestAnimationFrame(frame);
      return;
    }
    lastRenderedAt = now;
    const playerSignature = `${playerState.playing ? 1 : 0}:${playerState.currentTrack?.id ?? ""}`;
    if (playerSignature !== lastPlayerSignature) {
      lastPlayerSignature = playerSignature;
      keepActive(TRANSITION_HOLD_MS);
    }
    const frameStartedAt = performance.now();
    const opening = boot?.update(ms / 1000);
    if (!viewer?.isOpen) scene.update(ms / 1000, opening?.cinema);
    viewer?.update(ms / 1000);
    if (!viewer?.isOpen && !boot?.active) presentation.update();
    const phase = presentation.phase;
    if (stage.dataset.presentation !== phase) {
      stage.dataset.presentation = phase;
      keepActive(TRANSITION_HOLD_MS);
    }
    const cameraPhase = scene.musicPresentationPhase;
    if (stage.dataset.cameraPhase !== cameraPhase) {
      stage.dataset.cameraPhase = cameraPhase;
      keepActive(TRANSITION_HOLD_MS);
    }
    if (presentation.phase === "detail") {
      documentDecryption.update(
        ms / 1000,
        scene.decryptionFrame,
        preferences.reduced,
        !viewer?.isOpen,
      );
      if (pendingDetailFocus && !panel && !viewer?.isOpen) {
        $("#album-detail-content").focus({ preventScroll: true });
        pendingDetailFocus = false;
      }
      if (pendingTrackReveal && !panel && !viewer?.isOpen &&
        $("#music-detail").dataset.transition === "open" &&
        currentAlbum()?.id === pendingTrackReveal.albumId) {
        const content = $("#album-detail-content");
        const trackId = pendingTrackReveal.trackId;
        pendingTrackReveal = undefined;
        const row = Array.from(content.querySelectorAll<HTMLButtonElement>(".track-row"))
          .find((item) => item.dataset.track === trackId);
        if (row) trackFocus.reveal(content, row, preferences.reduced);
      }
    }
    frameCount++;
    if (ms - lastFrame > 1500) {
      const buffer = document.querySelector<HTMLCanvasElement>("#three-scene canvas");
      $("#runtime-info").textContent =
        `rAF诊断 ${Math.round((frameCount * 1000) / (ms - lastFrame))} FPS / ${buffer?.width ?? 0}×${buffer?.height ?? 0} / ${themeNames[preferences.theme]} / ${gpuCapability.api}${gpuCapability.mode === "software" ? " 软件渲染" : gpuCapability.mode === "hardware" ? " 显卡加速" : ""}`;
      // Keep read-only render diagnostics alongside the existing resolution
      // attributes, without adding controls or per-frame DOM work.
      if (!viewer?.isOpen) {
        const { drawCalls, triangles, selectionLight } = scene.getStats();
        const sceneElement = $("#three-scene");
        sceneElement.dataset.renderStats = JSON.stringify({
          drawCalls,
          triangles,
        });
        sceneElement.dataset.selectionLight =
          JSON.stringify(selectionLight);
        if (new URLSearchParams(location.search).get("profile") === "1") {
          const profile = scene.getPerformanceProfile();
          sceneElement.dataset.performanceProfile = JSON.stringify(profile);
          const latestSwitch = profile.albumSwitches.at(-1);
          const canvas = sceneElement.querySelector("canvas");
          if (latestSwitch && canvas) {
            const format = (value: number | null) =>
              value === null ? "n/a" : `${value.toFixed(2)} ms`;
            canvas.setAttribute(
              "aria-description",
              `Switch ${latestSwitch.previousIndex} to ${latestSwitch.index}; ` +
                `selection ${format(latestSwitch.synchronousMs)}; ` +
                `cover selection ${format(latestSwitch.coverSelectSynchronousMs)}; ` +
                `cover ready ${format(latestSwitch.coverReadyAfterMs)}; ` +
                `rAF P95/P99 ${format(latestSwitch.rafP95Ms)} / ${format(latestSwitch.rafP99Ms)}; ` +
                `GPU P95/P99 ${format(latestSwitch.gpuP95Ms)} / ${format(latestSwitch.gpuP99Ms)} ` +
                `(${latestSwitch.gpuSamples} samples); ` +
                `buffer ${profile.viewport.backBufferWidth}x${profile.viewport.backBufferHeight}`,
            );
          }
        }
      }
      frameCount = 0;
      lastFrame = ms;
    }
    scene.recordProfileFrame(ms, performance.now() - frameStartedAt);
  } else {
    frameCount = 0;
    lastFrame = ms;
  }
  requestAnimationFrame(frame);
}
async function start() {
  $("#three-scene").dataset.gpuCapability = JSON.stringify(gpuCapability);
  // This local application owns its live index. An old archive PWA must not serve stale UI.
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }
  await loadLibrary(true);
  try {
    fit();
    scene = new ArchiveScene($("#three-scene"));
    // Keep a direct visual comparison URL without adding another user setting.
    if (new URLSearchParams(location.search).get("lighting") !== "baseline")
      scene.enableSelectionLighting();
    await Promise.all([
      scene.load(),
      document.fonts.load("400 20px MiSans"),
      document.fonts.load("600 20px MiSans"),
    ]);
    ready = true;
    $("#three-scene canvas").setAttribute(
      "aria-label",
      `三维专辑阵列，左右切${sortLabel.column}，上下切专辑`,
    );
    stage.classList.toggle("reduce-motion", preferences.reduced);
    await scene.refreshLibrary(selected);
    scene.setTheme(preferences.theme);
    scene.setQuality(renderQuality);
    scene.setReduced(preferences.reduced);
    bindSceneNavigation(scene);
    $("#music-loading").remove();
    updateSelection();
    if (albums.length && new URLSearchParams(location.search).get("scene") !== "archive") {
      boot?.start(performance.now() / 1000);
    } else {
      scene.showMusicArchiveImmediately(performance.now() / 1000);
      effects.setScene("archive");
      if (albums.length) showBrowseSurface();
      else browseTransition.hide(true);
      $("#music-browse").inert = !albums.length;
      $("#music-browse").setAttribute("aria-hidden", String(!albums.length));
    }
    syncSelectionMotion();
    requestAnimationFrame((ms) => {
      stage.classList.add("theme-motion-ready");
      frame(ms);
    });
  } catch (error) {
    console.error(error);
    $("#music-loading").innerHTML =
      `<strong>三维资源未能加载</strong><small>${esc((error as Error).message)}</small><button data-action="library">检查音乐库</button>`;
  }
}
void start();
Object.assign(window, {
  rhineMusic: {
    get library() {
      return library;
    },
    get selectedAlbum() {
      return currentAlbum();
    },
    get player() {
      return player.state;
    },
    get playbackTime() {
      return player.playbackTime;
    },
    stats: () => scene?.getStats(),
    profile: () => ({
      version: BUILD_VERSION,
      gpuCapability,
      renderer: scene?.getPerformanceProfile(),
      scene: scene?.getStats(),
    }),
    coverDiagnostics: () => scene?.getCoverDiagnostics(),
    coverPreviewDataUrl: () => scene?.getCoverPreviewDataUrl(),
    get presentation() {
      return { phase: presentation.phase, cameraPhase: scene?.musicPresentationPhase,
        pendingIndex: presentation.pendingSelection?.index,
        menuVisible: !$("#music-detail").hidden,
        cameraReady: scene?.musicPresentationReady,
        archiveReady: scene?.musicArchiveReady };
    },
  },
});
