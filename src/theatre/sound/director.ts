// The sound department on the night: follows the scroll, keeps the band
// playing a bar ahead, fires the effects the prompt book asks for and rides
// the ambient beds. Only loaded once somebody turns the sound on.

import type { StageEngine } from "../engine";
import { SOUND_EVENT } from "./bus";
import { Orchestra } from "./orchestra";
import { crossed, stepsCrossed, type SoundProgram } from "./program";
import { BAR_SECONDS, SECTIONS, SIXTEENTH, barEvents, cycleOf, flourish, type SectionId } from "./score";
import { Bed, Effects, type BedName, type SfxName } from "./sfx";

const LOOKAHEAD = 0.3;
const VOLUME = 0.85;

export class Director {
  readonly ctx: AudioContext;
  private orch: Orchestra;
  private fx: Effects;
  private beds = new Map<BedName, Bed>();
  private program: SoundProgram;
  private stage: StageEngine;
  private timer = 0;
  private unsub: () => void;
  private lastT: number;
  private nextBar = 0;
  private bar = 0;
  private section: { id: SectionId; room: number } | null = null;
  private recent: number[] = [];
  private on = false;
  private step = 0;

  constructor(ctx: AudioContext, stage: StageEngine, program: SoundProgram) {
    this.ctx = ctx;
    this.stage = stage;
    this.program = program;
    this.orch = new Orchestra(ctx);
    this.orch.master.gain.value = 0;
    this.fx = new Effects(this.orch);
    this.lastT = stage.t;
    this.unsub = stage.subscribe(this.onScroll);
    window.addEventListener(SOUND_EVENT, this.onCue);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  /** Turn the sound on or off (fading, then resting the audio thread). */
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
    window.removeEventListener(SOUND_EVENT, this.onCue);
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

  private onCue = (e: Event) => {
    if (!this.on) return;
    this.fx.play((e as CustomEvent<SfxName>).detail);
  };

  /** Schedule the band a little ahead of time. */
  private pump = () => {
    if (!this.on || this.ctx.state !== "running") return;
    const t = this.stage.t;
    const now = this.ctx.currentTime;
    this.orch.music.gain.setTargetAtTime(this.program.musicLevel(t), now, 0.15);
    for (const b of this.program.beds) this.bed(b.name).level(b.level(t));

    if (this.nextBar < now) this.nextBar = now + 0.05;
    while (this.nextBar < now + LOOKAHEAD) {
      const want = this.program.sectionAt(t);
      if (!this.section || want.id !== this.section.id || want.room !== this.section.room) {
        const first = !this.section;
        const fresh = first || want.id !== this.section!.id;
        this.section = want;
        // a new act starts its variation from the top, with a little flourish
        // (not when the sound has only just been turned on: "hello" did that)
        if (fresh) {
          this.bar = 0;
          if (!first) {
            const at = Math.max(now, this.nextBar - 0.35);
            for (const e of flourish(!!SECTIONS[want.id].major)) this.orch.note(e, at + e.step * 0.06, 0.8);
          }
        }
      }
      const events = barEvents(this.section.id, this.bar, this.section.room);
      this.orch.warm(events);
      for (const e of events) {
        // a touch of human unsteadiness
        const jitter = (Math.random() - 0.5) * 0.008;
        this.orch.note({ ...e, vel: e.vel * (0.92 + Math.random() * 0.12) }, this.nextBar + e.step * SIXTEENTH + jitter);
      }
      this.bar = (this.bar + 1) % cycleOf(this.section.id);
      this.nextBar += BAR_SECONDS;
    }
  };

  private bed(name: BedName) {
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

    // no more than a few effects at once, however fast the scroll
    this.recent = this.recent.filter((x) => now - x < 0.4);
    for (const c of crossed(this.program.cues, from, t)) {
      if (this.recent.length >= 3) break;
      this.recent.push(now);
      this.fx.play(c.name, now + 0.02, c.opts);
    }

    for (const s of this.program.steps ?? []) {
      const n = Math.min(2, stepsCrossed(s.a, s.b, s.every, from, t));
      for (let i = 0; i < n; i++) {
        this.step++;
        this.fx.play("step", now + 0.02 + i * 0.12, { pan: this.step % 2 ? -0.15 : 0.15, verb: s.verb?.(t) ?? 0.25, gain: 0.45 });
      }
    }
  };
}

export function startDirector(ctx: AudioContext, stage: StageEngine, program: SoundProgram) {
  return new Director(ctx, stage, program);
}
