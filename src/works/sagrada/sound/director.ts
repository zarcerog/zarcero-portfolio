// The film's sound department: follows the scroll, keeps the band a bar
// ahead, fires the script's effects and rides the ambient beds. Built on the
// theatre's orchestra (its instruments, its hall); only loaded once somebody
// turns the sound on.

import type { StageEngine } from "@/theatre/engine";
import { Orchestra } from "@/theatre/sound/orchestra";

import { FILM_SOUND_EVENT } from "./bus";
import { BEDS_PLOT, CUES, musicLevel, sectionAt } from "./program";
import { BAR_SECONDS, DUR_SCALE, SECTIONS, SIXTEENTH, barEvents, cycleOf, flourish, type SectionId } from "./score";
import { Bed, Effects, type FilmBed, type FilmSfx, type SfxOpts } from "./sfx";

const LOOKAHEAD = 0.3;
const VOLUME = 0.85;

export class FilmDirector {
  readonly ctx: AudioContext;
  private orch: Orchestra;
  private fx: Effects;
  private beds = new Map<FilmBed, Bed>();
  private stage: StageEngine;
  private timer = 0;
  private unsub: () => void;
  private lastT: number;
  private nextBar = 0;
  private bar = 0;
  private section: SectionId | null = null;
  private recent: number[] = [];
  private booms: number[] = [];
  private on = false;

  constructor(ctx: AudioContext, stage: StageEngine) {
    this.ctx = ctx;
    this.stage = stage;
    this.orch = new Orchestra(ctx);
    this.orch.master.gain.value = 0;
    this.fx = new Effects(this.orch);
    this.lastT = stage.t;
    this.unsub = stage.subscribe(this.onScroll);
    window.addEventListener(FILM_SOUND_EVENT, this.onCue);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  async setOn(on: boolean) {
    this.on = on;
    const now = this.ctx.currentTime;
    const g = this.orch.master.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    if (on) {
      if (this.ctx.state !== "running") await this.ctx.resume();
      g.linearRampToValueAtTime(VOLUME, this.ctx.currentTime + 0.4);
      this.nextBar = this.ctx.currentTime + 0.15;
      this.section = null;
      this.fx.play("hello");
      this.pump();
      window.clearInterval(this.timer);
      this.timer = window.setInterval(this.pump, 60);
    } else {
      g.linearRampToValueAtTime(0, now + 0.25);
      window.clearInterval(this.timer);
      window.setTimeout(() => {
        if (!this.on) void this.ctx.suspend();
      }, 350);
    }
  }

  dispose() {
    window.clearInterval(this.timer);
    this.unsub();
    window.removeEventListener(FILM_SOUND_EVENT, this.onCue);
    document.removeEventListener("visibilitychange", this.onVisibility);
    void this.ctx.close();
  }

  private onVisibility = () => {
    if (!this.on) return;
    if (document.hidden) void this.ctx.suspend();
    else
      void this.ctx.resume().then(() => {
        this.nextBar = Math.max(this.nextBar, this.ctx.currentTime + 0.1);
      });
  };

  /** Effects asked for by the scene itself (the fireworks). */
  private onCue = (e: Event) => {
    if (!this.on || this.ctx.state !== "running") return;
    const { name, opts } = (e as CustomEvent<{ name: FilmSfx; opts?: SfxOpts }>).detail;
    const now = this.ctx.currentTime;
    // however many shells go up at once, no more than a few bangs at a time
    if (name === "boom" || name === "launch" || name === "glitter") {
      this.booms = this.booms.filter((x) => now - x < 0.35);
      if (this.booms.length >= 4) return;
      this.booms.push(now);
    }
    this.fx.play(name, now + 0.02, opts);
  };

  private pump = () => {
    if (!this.on || this.ctx.state !== "running") return;
    const t = this.stage.t;
    const now = this.ctx.currentTime;
    this.orch.music.gain.setTargetAtTime(musicLevel(t), now, 0.12);
    for (const b of BEDS_PLOT) this.bed(b.name).level(b.level(t));

    if (this.nextBar < now) this.nextBar = now + 0.05;
    while (this.nextBar < now + LOOKAHEAD) {
      const want = sectionAt(t);
      if (want !== this.section) {
        const first = !this.section;
        this.section = want;
        this.bar = 0;
        if (!first) {
          const at = Math.max(now, this.nextBar - 0.35);
          for (const e of flourish(!!SECTIONS[want].major)) this.orch.note(e, at + e.step * 0.06, 0.7);
        }
      }
      const events = barEvents(this.section, this.bar);
      this.orch.warm(events);
      for (const e of events) {
        const jitter = (Math.random() - 0.5) * 0.008;
        this.orch.note({ ...e, dur: e.dur * DUR_SCALE, vel: e.vel * (0.92 + Math.random() * 0.12) }, this.nextBar + e.step * SIXTEENTH + jitter);
      }
      this.bar = (this.bar + 1) % cycleOf(this.section);
      this.nextBar += BAR_SECONDS;
    }
  };

  private bed(name: FilmBed) {
    let b = this.beds.get(name);
    if (!b) {
      b = new Bed(this.orch, name);
      this.beds.set(name, b);
    }
    return b;
  }

  private onScroll = () => {
    const t = this.stage.t;
    const from = this.lastT;
    this.lastT = t;
    if (!this.on || this.ctx.state !== "running") return;
    const now = this.ctx.currentTime;
    this.recent = this.recent.filter((x) => now - x < 0.4);
    for (const c of crossed(CUES, from, t)) {
      if (this.recent.length >= 3) break;
      this.recent.push(now);
      this.fx.play(c.name, now + 0.02, c.opts);
    }
  };
}

/**
 * Which cues the scroll passed going from `from` to `to`. A long jump (the
 * reel's chapter links) fires nothing: nobody wants every effect at once.
 */
export function crossed<T extends { at: number; dir?: "fwd" | "both" }>(cues: T[], from: number, to: number, maxJump = 2.5): T[] {
  if (from === to || Math.abs(to - from) > maxJump) return [];
  const forward = to > from;
  return cues.filter((c) => (forward ? c.at > from && c.at <= to : c.at <= from && c.at > to && c.dir === "both"));
}

export function startFilmDirector(ctx: AudioContext, stage: StageEngine) {
  return new FilmDirector(ctx, stage);
}
