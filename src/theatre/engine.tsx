"use client";

/**
 * The stage engine.
 *
 * The whole production is driven by one number: `t`, the scroll position
 * measured in *beats* (one beat ≈ 0.8 of a viewport height). Components
 * register "ticks" over a beat range; each tick receives `t` clamped to that
 * range and writes styles straight to the DOM through refs. React renders the
 * set once — scrolling never re-renders the tree, it only moves the scenery.
 */

import Lenis from "lenis";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { TOTAL_BEATS } from "./timeline";

type TickFn = (t: number) => void;

interface Tick {
  a: number;
  b: number;
  fn: TickFn;
  last: number;
}

const BEAT_RATIO = 0.8;

export class StageEngine {
  t = 0;
  beatPx = 800;
  reducedMotion = false;
  lenis: Lenis | null = null;
  private ticks = new Set<Tick>();
  private subs = new Set<() => void>();

  add(a: number, b: number, fn: TickFn) {
    const tick: Tick = { a, b, fn, last: Number.NaN };
    this.ticks.add(tick);
    this.run(tick, true);
    return () => {
      this.ticks.delete(tick);
    };
  }

  private run(tick: Tick, force = false) {
    const c = this.t < tick.a ? tick.a : this.t > tick.b ? tick.b : this.t;
    if (force || c !== tick.last) {
      tick.last = c;
      tick.fn(c);
    }
  }

  setT(t: number) {
    if (Math.abs(t - this.t) < 0.00005) return;
    this.t = t;
    this.ticks.forEach((tick) => this.run(tick));
    this.subs.forEach((s) => s());
  }

  subscribe = (cb: () => void) => {
    this.subs.add(cb);
    return () => {
      this.subs.delete(cb);
    };
  };

  /** Attach to the page: measure, start smooth scrolling and the frame loop. */
  mount(root: HTMLElement, beats: number = TOTAL_BEATS) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.reducedMotion = reduced;
    root.dataset.motion = reduced ? "reduced" : "full";

    let lastW = window.innerWidth;
    let lastH = window.innerHeight;

    const measure = () => {
      this.beatPx = Math.max(420, Math.round(window.innerHeight * BEAT_RATIO));
      root.style.setProperty("--beat-px", `${this.beatPx}px`);
      root.style.setProperty("--beats", String(beats));
    };
    measure();

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Ignore the small height jitter of mobile browser toolbars.
      if (w === lastW && Math.abs(h - lastH) < 140) return;
      lastW = w;
      lastH = h;
      const t = this.t;
      measure();
      window.scrollTo({ top: t * this.beatPx, behavior: "auto" });
      this.lenis?.resize();
    };
    window.addEventListener("resize", onResize);

    if (!reduced) {
      this.lenis = new Lenis({
        lerp: 0.085,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.35,
        smoothWheel: true,
      });
    }

    let raf = 0;
    const loop = (time: number) => {
      this.lenis?.raf(time);
      const y = this.lenis ? this.lenis.animatedScroll : window.scrollY;
      this.setT(y / this.beatPx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    root.dataset.ready = "true";

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      this.lenis?.destroy();
      this.lenis = null;
    };
  }

  /** Scroll to a beat. Used by the programme and the encore button. */
  jump(beat: number, immediate = false) {
    const y = Math.max(0, beat * this.beatPx);
    if (this.lenis && !immediate) {
      // the programme stops Lenis while it's open; a stopped Lenis ignores scrollTo
      this.lenis.start();
      const distance = Math.abs(beat - this.t);
      this.lenis.scrollTo(y, {
        duration: Math.min(4.5, 1.2 + distance * 0.09),
        easing: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
      });
    } else {
      window.scrollTo({ top: y, behavior: "auto" });
    }
  }
}

const StageContext = createContext<StageEngine | null>(null);

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useStage() {
  const stage = useContext(StageContext);
  if (!stage) throw new Error("useStage must be used inside <StageProvider>");
  return stage;
}

/** Run `fn(t)` whenever the clamped beat inside [a, b] changes. */
export function useTick(a: number, b: number, fn: TickFn) {
  const stage = useStage();
  const fnRef = useRef(fn);
  useIsoLayoutEffect(() => {
    fnRef.current = fn;
  });
  useIsoLayoutEffect(() => stage.add(a, b, (t) => fnRef.current(t)), [stage, a, b]);
}

/**
 * Hide a scene (visibility + pointer events) outside its beat range so the
 * browser doesn't paint scenery nobody can see.
 */
export function useOnStage(ref: React.RefObject<HTMLElement | null>, a: number, b: number) {
  const shown = useRef<boolean | null>(null);
  useTick(-1, 1e6, (t) => {
    const el = ref.current;
    if (!el) return;
    const on = t >= a && t <= b;
    if (on === shown.current) return;
    shown.current = on;
    el.style.visibility = on ? "visible" : "hidden";
    el.dataset.onstage = on ? "true" : "false";
  });
}

/** Subscribe to a derived, discrete value (re-renders only when it changes). */
export function useStageValue<T>(select: (t: number) => T, serverValue: T): T {
  const stage = useStage();
  const selectRef = useRef(select);
  useIsoLayoutEffect(() => {
    selectRef.current = select;
  });
  const get = useCallback(() => selectRef.current(stage.t), [stage]);
  return useSyncExternalStore(stage.subscribe, get, () => serverValue);
}

export function StageProvider({
  children,
  rootRef,
  beats = TOTAL_BEATS,
}: {
  children: ReactNode;
  rootRef: React.RefObject<HTMLElement | null>;
  /** Length of the performance in beats (sets the scroll height). */
  beats?: number;
}) {
  const [stage] = useState(() => new StageEngine());

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return stage.mount(root, beats);
  }, [stage, rootRef, beats]);

  return <StageContext.Provider value={stage}>{children}</StageContext.Provider>;
}
