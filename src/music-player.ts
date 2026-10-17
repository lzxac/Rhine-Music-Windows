import type { MusicTrack } from "./music-types";

/** 播放模式. `list` wraps the queue, `single` repeats the current track, `shuffle` picks a
 *  random other track, `sequential` stops at the end instead of wrapping. */
export type PlayMode = "list" | "single" | "shuffle" | "sequential";

export interface MusicPlayerState {
  transport: "idle" | "loading" | "playing" | "paused" | "error";
  currentTrack: MusicTrack | null;
  queue: readonly MusicTrack[];
  currentIndex: number;
  playMode: PlayMode;
  playing: boolean;
  loading: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  songFadeEnabled: boolean;
  bgmVolume: number;
  bgmEnabled: boolean;
  bgmPlaying: boolean;
  error: string | null;
  bgmError: string | null;
  /** This preview uses browser decoding; it does not imply a foobar2000 connection. */
  backend: "browser";
}

type Listener = (state: MusicPlayerState) => void;
type Transport = MusicPlayerState["transport"];
type Fade = { timer: ReturnType<typeof setTimeout>; finish: () => void };
const SONG_FADE_MS = 450;
/**
 * 淡变曲线。线性增益在 t=0 处斜率最大（1/DURATION），听感是"音量被硬推上来"——主人反馈
 * 起播那一下过渡不自然，就是这个原因。改为感知曲线，两端斜率都为 0：
 *   淡入 p²            （开头极平缓，中点 0.25，听感像"自然浮现"）
 *   淡出 1-(1-p)²      （末尾平缓收敛，不会"突然刹住"）
 * 两个函数都从 0 单调升到 1，作为"完成度"直接乘进 start + (target-start)*t。
 * 注意：这里必须返回**完成度**而不是"剩余比例"——早先写成淡出返回 (1-p)²，那个值从 1 降到 0，
 * 代进公式就把淡出算成了淡入（增益从 0 涨到满值），实测曲线 0→0.071→0.147… 一路上升。
 */
const fadeCurve = (progress: number, rising: boolean) => {
  const p = unit(progress);
  return rising ? p * p : 1 - (1 - p) * (1 - p);
};
const unit = (value: number) => Math.max(0, Math.min(1, value));
const seconds = (value: number) =>
  Number.isFinite(value) && value > 0 ? value : 0;
const uniqueTracks = (tracks: readonly MusicTrack[]): MusicTrack[] => {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    if (seen.has(track.id)) return false;
    seen.add(track.id);
    return true;
  });
};

/** Music transport is independent from TerminalAudio and the Three.js scene lifecycle. */
export class MusicPlayer {
  private value: Omit<MusicPlayerState, "transport">;
  private listeners = new Set<Listener>();
  private song?: HTMLAudioElement;
  private songTrackId?: string;
  private songGain = 1;
  private songFade?: Fade;
  private readonly bgm: HTMLAudioElement;
  private transport: Transport = "idle";
  private operation = 0;
  private bgmOperation = 0;
  private bgmTarget = 0;
  private bgmTask: Promise<void> = Promise.resolve();
  private fade?: Fade;
  private gestureReceived = false;
  private disposed = false;
  private pendingSeek: number | null = null;

  constructor(
    options: {
      volume?: number;
      songFadeEnabled?: boolean;
      bgmVolume?: number;
      bgmEnabled?: boolean;
    } = {},
  ) {
    this.value = {
      currentTrack: null,
      queue: [],
      currentIndex: -1,
      playMode: "list",
      playing: false,
      loading: false,
      duration: 0,
      currentTime: 0,
      // 兜底值与设置里的默认值保持一致（100%）：早先是 0.7，与偏好默认值 0.65 又不一致，
      // 属于"三处各写一个数"的历史遗留。真正生效的永远是调用方传入的 preferences.volume。
      volume: Number.isFinite(options.volume) ? unit(options.volume!) : 1,
      songFadeEnabled: options.songFadeEnabled ?? true,
      bgmVolume: Number.isFinite(options.bgmVolume)
        ? unit(options.bgmVolume!)
        : 0.18,
      bgmEnabled: options.bgmEnabled ?? true,
      bgmPlaying: false,
      error: null,
      bgmError: null,
      backend: "browser",
    };
    this.bgm = new Audio("/audio/atmosphere.ogg");
    this.bgm.loop = true;
    this.bgm.preload = "none";
    this.bgm.volume = 0;
    this.bgm.addEventListener("error", this.onBgmError);
    document.addEventListener("pointerdown", this.onGesture, { capture: true });
    document.addEventListener("keydown", this.onGesture, { capture: true });
    // Intentionally no visibilitychange handler: music must continue in the background.
  }

  get state(): MusicPlayerState {
    return { ...this.value, transport: this.transport, queue: [...this.value.queue] };
  }

  /** Read the audio element's live clock without emitting player state each frame. */
  get playbackTime(): number {
    if (this.song && this.songTrackId === this.value.currentTrack?.id) {
      if (this.pendingSeek !== null) return this.pendingSeek;
      try {
        return seconds(this.song.currentTime);
      } catch {
        // Fall back to the last state update if the browser clock is unavailable.
      }
    }
    return this.value.currentTime;
  }

  subscribe(listener: Listener): () => void {
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  setQueue(tracks: readonly MusicTrack[]): void {
    if (this.disposed) return;
    const queue = uniqueTracks(tracks);
    const id = this.value.currentTrack?.id;
    const index = queue.findIndex((track) => track.id === id);
    this.value.queue = queue;
    if (id && index === -1) {
      this.stop();
      this.value.currentTrack = null;
      this.value.duration = 0;
    } else if (index !== -1) {
      this.value.currentTrack = queue[index];
    }
    this.value.currentIndex = index;
    this.emit();
  }

  enqueue(tracks: readonly MusicTrack[]): number {
    if (this.disposed) return 0;
    const queue = [...this.value.queue];
    const known = new Set(queue.map((track) => track.id));
    let added = 0;
    for (const track of tracks) {
      if (known.has(track.id)) continue;
      known.add(track.id);
      queue.push(track);
      added += 1;
    }
    if (!added) return 0;
    const currentId = this.value.currentTrack?.id;
    this.value.queue = queue;
    this.value.currentIndex = currentId
      ? queue.findIndex((track) => track.id === currentId)
      : -1;
    this.emit();
    return added;
  }

  removeQueuedTrack(trackId: string): boolean {
    if (this.disposed || this.value.currentTrack?.id === trackId) return false;
    const index = this.value.queue.findIndex((track) => track.id === trackId);
    if (index < 0) return false;
    const queue = [...this.value.queue];
    queue.splice(index, 1);
    this.value.queue = queue;
    if (this.value.currentIndex > index) this.value.currentIndex -= 1;
    this.emit();
    return true;
  }

  moveQueuedTrack(trackId: string, direction: -1 | 1): boolean {
    if (this.disposed) return false;
    const from = this.value.queue.findIndex((track) => track.id === trackId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= this.value.queue.length) return false;
    const queue = [...this.value.queue];
    [queue[from], queue[to]] = [queue[to], queue[from]];
    const currentId = this.value.currentTrack?.id;
    this.value.queue = queue;
    this.value.currentIndex = currentId
      ? queue.findIndex((track) => track.id === currentId)
      : -1;
    this.emit();
    return true;
  }

  async play(id: string, tracks?: readonly MusicTrack[]): Promise<void> {
    if (this.disposed) return;
    const queue = tracks ? uniqueTracks(tracks) : this.value.queue;
    const index = queue.findIndex((track) => track.id === id);
    if (index === -1) {
      this.value.error = "这首歌曲已不在播放队列中，请重新选择。";
      this.emit();
      return;
    }
    const track = queue[index];
    // Updating the queue in a play request keeps cross-album switches in the same fade.
    this.value.queue = queue;
    const request = ++this.operation;
    this.cancelSongFade();
    const resume =
      this.songTrackId === id && this.song && !this.song.ended
        ? this.song
        : undefined;
    this.value.currentTrack = track;
    this.value.currentIndex = index;
    this.value.error = null;
    this.value.loading = true;
    this.transport = "loading";
    this.value.playing = !!resume && !resume.paused;
    this.value.currentTime = resume
      ? this.pendingSeek ?? seconds(resume.currentTime)
      : 0;
    this.value.duration =
      (resume ? seconds(resume.duration) : 0) || seconds(track.duration);
    if (!resume) this.pendingSeek = null;
    const unsupported = this.unsupported(track);
    if (unsupported) {
      this.fail(unsupported);
      return;
    }
    this.emit();
    if (request !== this.operation || this.disposed) return;

    if (!resume) {
      const outgoing = this.song;
      if (
        outgoing &&
        !outgoing.paused &&
        !outgoing.ended &&
        this.value.songFadeEnabled
      ) {
        await this.fadeSong(outgoing, 0);
        if (request !== this.operation || this.disposed) return;
      }
      // Release the outgoing source before the next one can start: songs never overlap.
      this.releaseSong();
    }
    const audio = this.song ?? this.createSong(track);
    // 继续播放也要淡入。元素此刻还是暂停的，而 fadeSong 在 audio.paused 时会直接跳到
    // 目标值，所以起点必须在这里设好；等 play() 之后元素就不再暂停了，那时才设置会被跳过。
    if (resume && this.value.songFadeEnabled) this.setSongGain(0);

    // A shared transition promise keeps rapid BGM toggles from bypassing this silence gate.
    await this.reconcileBgm();
    if (request !== this.operation || this.disposed || this.song !== audio)
      return;
    try {
      await audio.play();
      if (request !== this.operation || this.disposed || this.song !== audio) {
        if (this.song !== audio || !this.expectsSong()) audio.pause();
        return;
      }
      if (!audio.paused) {
        this.transport = "playing";
        this.value.playing = true;
        this.value.loading = false;
        this.emit();
        if (request !== this.operation || this.disposed || this.song !== audio)
          return;
        if (this.value.songFadeEnabled) {
          // On RESUME the gain was reset to 0 just above so the fade has somewhere to come
          // from; on a fresh load createSong() already parked it at 0. Either way the sound
          // ramps up instead of appearing at full level.
          await this.fadeSong(audio, 1);
        } else this.setSongGain(1);
      }
    } catch (error) {
      if (request !== this.operation || this.disposed || this.song !== audio)
        return;
      this.fail(this.playbackError(track, error));
    }
  }

  async toggle(): Promise<void> {
    if (this.disposed) return;
    if (this.transport === "loading" || this.transport === "playing") {
      ++this.operation;
      const song = this.song;
      // 淡出后再暂停, so the click does not clip the sound off mid-note. The fade's promise
      // settles even when it is cancelled (its `finish` resolves), so awaiting it cannot hang;
      // releaseSong() cancels any fade anyway, hence the `.catch`.
      if (song && !song.paused && !song.ended && this.value.songFadeEnabled) {
        await this.fadeSong(song, 0).catch(() => {});
      }
      this.cancelSongFade();
      this.transport = "paused";
      this.song?.pause();
      if (this.songTrackId !== this.value.currentTrack?.id) this.releaseSong();
      // 暂停后不要用 setSongGain(1) 把音量恢复：那会撤销刚做完的淡出，让暂停瞬间"跳回"
      // 满音量，继续播放时也就只能靠 play() 里补设 0 才有淡入。停在淡出的终点才是对的 ——
      // 元素是暂停的，增益为 0 听不见，而 play() 会从这个 0 一路淡回来。
      this.value.playing = false;
      this.value.loading = false;
      this.emit();
      await this.reconcileBgm();
      return;
    }
    const track = this.value.currentTrack ?? this.value.queue[0];
    if (track) await this.play(track.id);
  }

  /** Which track follows the current one, by 播放模式. Returns null when nothing should
   *  follow — the end of the queue in `sequential`, or an empty/one-track queue in
   *  `shuffle` (there is no OTHER track to pick). */
  /**
   * 下一首是谁。`manual` 区分**用户点的「下一首」**与**曲目自然播完**：
   *
   * 单曲循环只该决定"唱完之后自动做什么"，不该限制用户手动切歌 —— 主流播放器都是这样，
   * 主人也明确指出了这一点（原先共用一个分支，导致单曲循环下点「下一首」毫无反应）。
   * 手动切歌在队尾**回绕**，与 `list` 的语义一致：按了就该有下一首。
   */
  private advanceTrackId(manual = false): string | null {
    const queue = this.value.queue;
    const index = this.value.currentIndex;
    const current = this.value.currentTrack;
    if (!current || index < 0 || !queue.length) return null;
    if (manual) return queue[index + 1]?.id ?? queue[0]?.id ?? null;
    switch (this.value.playMode) {
      case "single":
        return current.id;
      case "shuffle": {
        const others = queue.filter((track) => track.id !== current.id);
        if (!others.length) return null;
        return others[Math.floor(Math.random() * others.length)].id;
      }
      case "sequential":
        return queue[index + 1]?.id ?? null;
      case "list":
      default:
        // Wrap at the end, which is what makes a queue loop.
        return queue[index + 1]?.id ?? queue[0]?.id ?? null;
    }
  }

  setPlayMode(mode: PlayMode): void {
    if (this.disposed || this.value.playMode === mode) return;
    this.value.playMode = mode;
    this.emit();
  }

  async next(): Promise<void> {
    if (this.disposed) return;
    // manual: 用户点的「下一首」，不受单曲循环限制（见 advanceTrackId）。
    const id = this.advanceTrackId(true);
    if (id) await this.play(id);
    else this.stop();
  }

  /**
   * 上一首。**直接切歌**，不因当前进度而"先回到开头"。
   *
   * 原先有一条常见播放器的规则：播放超过 3 秒时按「上一首」先回到本曲开头（`currentTime > 3`
   * 就 seek(0)），要点到进度归零之后才会切歌。主人明确不要这个行为 —— "正常切上一首，不管当前
   * 播放进度到哪，直接切了"，车载播放器也是这样。
   *
   * 代价说清楚：原规则是"重播当前曲"的唯一入口（停止按钮已经不在界面上了），删掉它就没有这个
   * 快捷方式了 —— 想重播可以用进度条拖回开头，或者用播放模式里的单曲循环。
   * 保留 shuffle 的随机回退：向前是随机的，向后不该反而沿着历史倒着走回去。
   */
  async previous(): Promise<void> {
    if (this.disposed) return;
    // 随机步进, so going back is also random rather than retracing the forward history.
    if (this.value.playMode === "shuffle") {
      const others = this.value.queue.filter((track) => track.id !== this.value.currentTrack?.id);
      if (others.length) {
        await this.play(others[Math.floor(Math.random() * others.length)].id);
        return;
      }
    }
    const track = this.value.queue[Math.max(0, this.value.currentIndex - 1)];
    if (!track) return;
    // 队首按「上一首」＝**重播本曲**（没有上一首可去）。这里必须显式要求回到开头：
    // play() 对同一首歌走的是"继续播放"分支（resume 会保留当前进度），所以只调 play(id)
    // 等于什么都没发生 —— 主人报的正是"第一首按上一首不会重播"。
    //
    // 注意**不要**在这里把 pendingSeek 清掉：这个值是由运行时的 media 事件异步消费的
    // （见 applyPendingSeek 的调用点），play() 返回时它还没被用上；早先我在这里写了一句
    // `this.pendingSeek = null`，等于把"回到开头"的意图擦掉，于是跳到 61 秒后按上一首
    // 仍然是 61 秒（实测 61→63）。清理交给运行时那条路径。
    if (track.id === this.value.currentTrack?.id) {
      // 必须走 seek()，不能只写 pendingSeek：play() 对同一首歌走 resume 分支，那个分支
      // **不会调用 seek()**，所以 pendingSeek 永远不会被应用到音频元素上 —— 实测状态里的
      // currentTime 归零了，而 audio.currentTime 仍在 61 秒（就是"看着重播了、其实没有"）。
      this.seek(0);
      return;
    }
    await this.play(track.id);
  }

  seek(position: number): void {
    if (
      this.disposed ||
      !this.song ||
      this.songTrackId !== this.value.currentTrack?.id ||
      !Number.isFinite(position)
    )
      return;
    const duration = seconds(this.song.duration) || this.value.duration;
    const target = Math.max(
      0,
      duration > 0 ? Math.min(duration, position) : position,
    );
    this.pendingSeek = target;
    if (this.song.readyState >= 1) this.applySeek(this.song);
    this.value.currentTime = target;
    this.emit();
  }

  stop(): void {
    if (this.disposed) return;
    ++this.operation;
    this.transport = "idle";
    this.releaseSong();
    this.value.playing = false;
    this.value.loading = false;
    this.value.currentTime = 0;
    this.value.error = null;
    this.emit();
    void this.reconcileBgm();
  }

  setVolume(volume: number): void {
    if (this.disposed || !Number.isFinite(volume)) return;
    this.value.volume = unit(volume);
    this.setSongGain(this.songGain);
    this.emit();
  }

  setSongFadeEnabled(enabled: boolean): void {
    if (this.disposed) return;
    this.value.songFadeEnabled = enabled;
    if (!enabled) {
      this.cancelSongFade();
      // A pending switch will release the old song as soon as its fade resolves.
      if (this.songTrackId === this.value.currentTrack?.id) this.setSongGain(1);
    }
    this.emit();
  }

  setBgmVolume(volume: number): void {
    if (this.disposed || !Number.isFinite(volume)) return;
    this.value.bgmVolume = unit(volume);
    this.emit();
    void this.reconcileBgm();
  }

  setBgmEnabled(enabled: boolean): void {
    if (this.disposed) return;
    this.value.bgmEnabled = enabled;
    this.value.bgmError = null;
    this.emit();
    void this.reconcileBgm();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    ++this.operation;
    ++this.bgmOperation;
    this.cancelFade();
    this.releaseSong();
    this.bgm.pause();
    this.bgm.removeEventListener("error", this.onBgmError);
    this.bgm.removeAttribute("src");
    this.bgm.load();
    document.removeEventListener("pointerdown", this.onGesture, {
      capture: true,
    });
    document.removeEventListener("keydown", this.onGesture, { capture: true });
    this.listeners.clear();
  }

  private createSong(track: MusicTrack): HTMLAudioElement {
    const audio = new Audio();
    this.song = audio;
    this.songTrackId = track.id;
    this.songGain = this.value.songFadeEnabled ? 0 : 1;
    audio.preload = "metadata";
    this.setSongGain(this.songGain);
    const active = () =>
      !this.disposed &&
      this.song === audio &&
      this.value.currentTrack?.id === track.id;
    audio.addEventListener("loadedmetadata", () => {
      if (!active()) return;
      this.value.duration = seconds(audio.duration) || seconds(track.duration);
      this.applySeek(audio);
      this.emit();
    });
    audio.addEventListener("durationchange", () => {
      if (!active()) return;
      this.value.duration = seconds(audio.duration) || seconds(track.duration);
      this.emit();
    });
    audio.addEventListener("timeupdate", () => {
      if (!active() || this.pendingSeek !== null) return;
      this.value.currentTime = seconds(audio.currentTime);
      this.emit();
    });
    audio.addEventListener("playing", () => {
      if (!active() || audio.paused) return;
      if (this.transport !== "loading" && this.transport !== "playing") {
        audio.pause();
        return;
      }
      this.transport = "playing";
      this.value.playing = true;
      this.value.loading = false;
      this.emit();
    });
    audio.addEventListener("waiting", () => {
      if (!active() || this.transport !== "playing") return;
      this.value.loading = true;
      this.emit();
    });
    audio.addEventListener("pause", () => {
      if (!active() && this.song === audio && audio.paused) {
        this.cancelSongFade();
        return;
      }
      if (
        !active() ||
        this.transport !== "playing" ||
        audio.ended ||
        !audio.paused
      )
        return;
      ++this.operation;
      this.cancelSongFade();
      // 这里原先调 setSongGain(1)：元素是暂停的，没有声音，所以当时看不出问题。但那会让
      // 暂停期间的增益停在满值，继续播放时 sound 会立刻以满音量出现（淡入失效）。改为保留
      // 淡出的终点 0，play() 再从 0 淡回来。
      if (this.songTrackId !== this.value.currentTrack?.id) this.setSongGain(1);
      this.transport = "paused";
      this.value.playing = false;
      this.value.loading = false;
      this.value.currentTime = seconds(audio.currentTime);
      this.emit();
    });
    audio.addEventListener("ended", () => {
      if (!active() && this.song === audio && audio.ended) {
        // The outgoing song can finish naturally during its fade-out.
        this.cancelSongFade();
        return;
      }
      if (!active() || this.transport !== "playing") return;
      this.cancelSongFade();
      this.value.playing = false;
      this.value.loading = false;
      this.value.currentTime = this.value.duration;
      const nextId = this.advanceTrackId();
      if (nextId) {
        // No idle intermediate state, so BGM never appears between songs. What comes next
        // is 播放模式's job, so a single-track 单曲循环 really does loop and a `sequential`
        // queue really does stop.
        void this.play(nextId);
      } else {
        ++this.operation;
        this.transport = "idle";
        this.emit();
        void this.reconcileBgm();
      }
    });
    audio.addEventListener("error", () => {
      if (active()) this.fail(this.playbackError(track, audio.error));
      else if (this.song === audio) this.cancelSongFade();
    });
    audio.src = `/api/audio/${encodeURIComponent(track.id)}`;
    return audio;
  }

  private applySeek(audio: HTMLAudioElement): void {
    if (this.pendingSeek === null || audio.readyState < 1) return;
    const target = Math.max(
      0,
      seconds(audio.duration) > 0
        ? Math.min(audio.duration, this.pendingSeek)
        : this.pendingSeek,
    );
    try {
      audio.currentTime = target;
      this.pendingSeek = null;
      this.value.currentTime = target;
    } catch {
      // Metadata may still be arriving; retain the user's seek until it is available.
    }
  }

  private releaseSong(): void {
    this.cancelSongFade();
    const old = this.song;
    this.song = undefined;
    this.songTrackId = undefined;
    this.songGain = 1;
    this.pendingSeek = null;
    if (!old) return;
    old.pause();
    old.removeAttribute("src");
    old.load();
  }

  private setSongGain(gain: number): void {
    this.songGain = unit(gain);
    if (this.song) this.song.volume = unit(this.value.volume * this.songGain);
  }

  private fadeSong(audio: HTMLAudioElement, target: number): Promise<void> {
    this.cancelSongFade();
    if (this.song !== audio) return Promise.resolve();
    const start = this.songGain;
    if (audio.paused || audio.ended || Math.abs(start - target) < 0.001) {
      this.setSongGain(target);
      return Promise.resolve();
    }
    const startedAt = performance.now();
    return new Promise((resolve) => {
      const fade: Fade = {
        timer: 0 as unknown as ReturnType<typeof setTimeout>,
        finish: resolve,
      };
      const step = () => {
        if (this.songFade !== fade) return;
        const progress = Math.min(1, (performance.now() - startedAt) / SONG_FADE_MS);
        this.setSongGain(start + (target - start) * fadeCurve(progress, target >= start));
        if (progress < 1) fade.timer = setTimeout(step, 16);
        else {
          this.songFade = undefined;
          resolve();
        }
      };
      this.songFade = fade;
      step();
    });
  }

  private cancelSongFade(): void {
    if (!this.songFade) return;
    const fade = this.songFade;
    this.songFade = undefined;
    clearTimeout(fade.timer);
    fade.finish();
  }

  private expectsSong(): boolean {
    return this.transport === "loading" || this.transport === "playing";
  }

  private unsupported(track: MusicTrack): string | null {
    if (
      /^(DSD|DSF|DFF)$/i.test(track.format) ||
      /\.(dsf|dff)$/i.test(track.relativePath)
    ) {
      return "当前版本暂不支持 DSF / DFF（DSD）播放，请选择浏览器支持的音频文件。";
    }
    if (!track.browserPlayable)
      return `${track.format} 无法在当前浏览器中播放，请选择浏览器支持的音频文件。`;
    return null;
  }

  private playbackError(track: MusicTrack, error: unknown): string {
    const name = error instanceof DOMException ? error.name : "";
    if (name === "NotAllowedError")
      return "浏览器暂未允许播放，请点击播放按钮重试。";
    const media = this.song?.error;
    if (media?.code === 2)
      return "音频读取失败：请检查本地服务和音乐文件是否仍然可用。";
    if (name === "AbortError") return "歌曲播放被中断，请点击播放按钮重试。";
    if (/M4A|ALAC/i.test(`${track.format} ${track.codec ?? ""}`)) {
      return "此 M4A / ALAC 文件未能由当前浏览器解码，或文件已不可用。请检查原文件，或尝试支持该编码的浏览器。";
    }
    if (
      media?.code === 3 ||
      media?.code === 4 ||
      name === "NotSupportedError"
    ) {
      return `无法播放此 ${track.format} 文件：当前浏览器不支持它的编码，或文件已损坏、不可读取。`;
    }
    return `播放失败，请检查 ${track.format} 文件及本地音乐服务后重试。`;
  }

  private fail(message: string): void {
    ++this.operation;
    this.transport = "error";
    this.releaseSong();
    this.value.playing = false;
    this.value.loading = false;
    this.value.error = message;
    this.emit();
    void this.reconcileBgm();
  }

  private onGesture = (): void => {
    if (this.disposed) return;
    this.gestureReceived = true;
    void this.reconcileBgm();
  };

  private onBgmError = (): void => {
    if (this.disposed) return;
    ++this.bgmOperation;
    this.cancelFade();
    this.bgm.pause();
    this.bgm.volume = 0;
    this.bgmTarget = -1;
    this.value.bgmPlaying = false;
    this.value.bgmError = "氛围配乐无法加载，歌曲播放功能仍可使用。";
    this.emit();
  };

  private reconcileBgm(): Promise<void> {
    const idle = this.transport === "idle" || this.transport === "error";
    const target =
      !this.disposed && this.gestureReceived && this.value.bgmEnabled && idle
        ? this.value.bgmVolume
        : 0;
    if (target === this.bgmTarget) return this.bgmTask;
    this.bgmTarget = target;
    const request = ++this.bgmOperation;
    this.cancelFade();
    this.bgmTask = (async () => {
      if (target > 0) {
        try {
          await this.bgm.play();
          if (this.disposed || request !== this.bgmOperation) {
            if (this.disposed || this.bgmTarget <= 0) this.bgm.pause();
            return;
          }
          this.value.bgmError = null;
          this.value.bgmPlaying = true;
          this.emit();
        } catch {
          if (!this.disposed && request === this.bgmOperation) {
            this.bgmTarget = -1;
            this.value.bgmPlaying = false;
            this.value.bgmError =
              "氛围配乐暂未获准播放或无法读取，请再次点击界面重试。";
            this.emit();
          }
          return;
        }
      }
      if (this.disposed || request !== this.bgmOperation) return;
      await this.fadeBgm(target, target > 0 ? 650 : 220);
      if (this.disposed || request !== this.bgmOperation) return;
      if (target === 0) this.bgm.pause();
      this.value.bgmPlaying = target > 0 && !this.bgm.paused;
      this.emit();
    })();
    return this.bgmTask;
  }

  private fadeBgm(target: number, duration: number): Promise<void> {
    this.cancelFade();
    const start = this.bgm.volume;
    if (this.bgm.paused || Math.abs(start - target) < 0.001) {
      this.bgm.volume = target;
      return Promise.resolve();
    }
    const startedAt = performance.now();
    return new Promise((resolve) => {
      const fade: Fade = {
        timer: 0 as unknown as ReturnType<typeof setTimeout>,
        finish: resolve,
      };
      const step = () => {
        if (this.fade !== fade) return;
        const progress = Math.min(
          1,
          (performance.now() - startedAt) / duration,
        );
        this.bgm.volume = unit(start + (target - start) * progress);
        if (progress < 1) fade.timer = setTimeout(step, 24);
        else {
          this.fade = undefined;
          resolve();
        }
      };
      this.fade = fade;
      step();
    });
  }

  private cancelFade(): void {
    if (!this.fade) return;
    const fade = this.fade;
    this.fade = undefined;
    clearTimeout(fade.timer);
    fade.finish();
  }

  private emit(): void {
    if (this.disposed) return;
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (error) {
        console.error("MusicPlayer state listener failed", error);
      }
    }
  }
}
