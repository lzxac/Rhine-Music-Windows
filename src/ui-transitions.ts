const enterEase = "cubic-bezier(0.22, 1, 0.36, 1)";
const exitEase = "cubic-bezier(0.4, 0, 1, 1)";

/** Owns the visible lifetime, including a close that interrupts an opening. */
export class SurfaceTransition {
  private animations: Animation[] = [];
  private revision = 0;

  constructor(
    private root: HTMLElement,
    private panel?: HTMLElement,
    private enterDuration = 300,
    private exitDuration = 200,
    private direction: "up" | "right" = "up",
    private enterEasing = enterEase,
    // Separate overlays can fade together without changing their common
    // ancestor's stacking context or flattening them into a full-screen layer.
    private fadeTargets: readonly HTMLElement[] = [root],
    // The exit's timing and distance default to the app's own (a quicker ease-in, 52px
    // right / 8px up). A caller that wants the exit to be an exact mirror of its entry
    // passes the entry's easing and distance here — the lyrics card does, because its
    // exit read as slower and shorter than its entry.
    private exitEasing = exitEase,
    private exitDistance = direction === "right" ? 52 : 8,
  ) {}

  show(
    reduced: boolean,
    finished: () => void = () => {},
    // Elements that slide with the panel: the album detail's transport row is a sibling
    // of the column it belongs to (the column's markup is rebuilt per album, so the row
    // cannot live inside it), and it should read as ONE movement with the page — same
    // keyframes, same options, same frame, issued from here rather than from an animation
    // of its own.
    slideTargets: readonly HTMLElement[] = [],
  ) {
    this.run(true, reduced, finished, slideTargets);
  }

  hide(reduced: boolean, finished: () => void = () => {}) {
    this.run(false, reduced, finished);
  }

  finish() {
    this.animations.forEach((animation) => animation.finish());
  }

  dispose() {
    this.revision++;
    this.animations.forEach((animation) => animation.cancel());
    this.animations = [];
  }

  private run(show: boolean, reduced: boolean, finished?: () => void, slideTargets: readonly HTMLElement[] = []) {
    const revision = ++this.revision;
    const hidden = this.root.hidden;
    const opacities = this.fadeTargets.map((target) =>
      hidden ? "0" : getComputedStyle(target).opacity,
    );
    const transform = this.panel
      ? hidden
        ? this.direction === "right" ? "translateX(36px)" : "translateY(12px)"
        : getComputedStyle(this.panel).transform
      : undefined;
    this.animations.forEach((animation) => animation.cancel());
    this.animations = [];
    this.root.hidden = false;
    this.root.dataset.transition = show ? "opening" : "closing";
    const complete = () => {
      if (revision !== this.revision) return;
      this.root.hidden = !show;
      this.root.dataset.transition = show ? "open" : "closed";
      this.animations.forEach((animation) => animation.cancel());
      this.animations = [];
      finished?.();
    };
    if (reduced || (!show && hidden)) {
      complete();
      return;
    }
    const options: KeyframeAnimationOptions = {
      duration: show ? this.enterDuration : this.exitDuration,
      easing: show ? this.enterEasing : this.exitEasing,
      fill: "both",
    };
    const fades = this.fadeTargets.map((target, index) => target.animate(
      [{ opacity: opacities[index] }, { opacity: show ? 1 : 0 }],
      options,
    ));
    this.animations.push(...fades);
    // The panel and anything asked to slide with it (see show()): one set of keyframes and
    // one set of options, so they cannot drift apart.
    const sliding = this.panel ? [this.panel, ...slideTargets] : [...slideTargets];
    for (const element of sliding) {
      this.animations.push(
        element.animate(
          [
            { transform },
            { transform: this.direction === "right"
              ? show ? "translateX(0)" : `translateX(${this.exitDistance}px)`
              : show ? "translateY(0)" : `translateY(${this.exitDistance}px)` },
          ],
          options,
        ),
      );
    }
    void Promise.all(fades.map((fade) => fade.finished)).then(complete).catch(() => {});
  }
}

export class ContentTransition {
  private animation?: Animation;

  reveal(element: HTMLElement, reduced: boolean) {
    const opacity =
      this.animation?.playState === "running"
        ? getComputedStyle(element).opacity
        : "0.35";
    this.cancel();
    if (!reduced)
      this.animation = element.animate([{ opacity }, { opacity: 1 }], {
        duration: 150,
        easing: enterEase,
      });
  }

  cancel() {
    this.animation?.cancel();
    this.animation = undefined;
  }
}
