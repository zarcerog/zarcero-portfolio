// Sound effects, from the prompt book: every one is made from noise and
// oscillators on the spot. Beds (surf, clocks…) are rendered once into
// looping buffers.

import { clocks, coins, crackle, projector, surf } from "./dsp";
import type { Orchestra } from "./orchestra";
import { SIXTEENTH, flourish, midiOf, type Inst } from "./score";

export type SfxName =
  | "curtain"
  | "sceneryIn"
  | "sceneryOut"
  | "trap"
  | "train"
  | "schoolBell"
  | "horn"
  | "kaching"
  | "beep"
  | "typewriter"
  | "sparkle"
  | "blip"
  | "shutter"
  | "chime"
  | "bulbs"
  | "creak"
  | "step"
  | "thunk"
  | "telegraph"
  | "whoosh"
  | "page"
  | "tick"
  | "hello"
  | "bravo"
  | "fin";

export type BedName = "surf" | "crackle" | "coins" | "projector" | "clocks";

export const BEDS: Record<BedName, { make: (sr: number) => [Float32Array, Float32Array]; gain: number }> = {
  surf: { make: (sr) => surf(sr), gain: 0.22 },
  crackle: { make: (sr) => crackle(sr), gain: 0.35 },
  coins: { make: (sr) => coins(sr), gain: 0.25 },
  projector: { make: (sr) => projector(sr), gain: 0.3 },
  clocks: { make: (sr) => clocks(sr), gain: 0.35 },
};

export interface SfxOpts {
  /** -1 … 1 */
  pan?: number;
  /** how much of it reaches the hall's reverb */
  verb?: number;
  gain?: number;
}

export class Effects {
  private o: Orchestra;
  constructor(o: Orchestra) {
    this.o = o;
  }

  private get ctx() {
    return this.o.ctx;
  }

  /** A channel for one effect: pan, a reverb send, a gain. */
  private out(when: number, o: SfxOpts = {}) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = o.gain ?? 1;
    const p = ctx.createStereoPanner();
    p.pan.value = o.pan ?? 0;
    g.connect(p).connect(this.o.sfx);
    const s = ctx.createGain();
    s.gain.value = o.verb ?? 0.2;
    p.connect(s).connect(this.o.verb);
    // unplug it once it has surely finished, so the graph doesn't keep growing
    if (typeof AudioContext !== "undefined" && ctx instanceof AudioContext) {
      setTimeout(() => g.disconnect(), Math.max(0, (when - ctx.currentTime) * 1000) + 8000);
    }
    return g;
  }

  /** A burst of filtered noise. */
  private hiss(
    dest: AudioNode,
    when: number,
    o: { dur: number; attack?: number; tau?: number; gain?: number; type?: BiquadFilterType; freq?: number; freqEnd?: number; q?: number; hold?: number },
  ) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.o.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type ?? "bandpass";
    f.frequency.setValueAtTime(o.freq ?? 1000, when);
    if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, when + o.dur);
    f.Q.value = o.q ?? 0.8;
    const g = ctx.createGain();
    const a = o.attack ?? 0.005;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(o.gain ?? 1, when + a);
    if (o.hold) g.gain.setValueAtTime(o.gain ?? 1, when + a + o.hold);
    g.gain.setTargetAtTime(0, when + a + (o.hold ?? 0), o.tau ?? o.dur / 4);
    src.connect(f).connect(g).connect(dest);
    src.onended = () => g.disconnect();
    src.start(when, Math.random() * 1.5);
    src.stop(when + o.dur + 0.2);
  }

  /** An oscillator with an envelope (and optionally a glide). */
  private tone(
    dest: AudioNode,
    when: number,
    o: { freq: number; freqEnd?: number; type?: OscillatorType; dur: number; attack?: number; tau?: number; gain?: number; hold?: number },
  ) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(o.freq, when);
    if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, when + o.dur);
    const g = ctx.createGain();
    const a = o.attack ?? 0.003;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(o.gain ?? 1, when + a);
    if (o.hold) g.gain.setValueAtTime(o.gain ?? 1, when + a + o.hold);
    g.gain.setTargetAtTime(0, when + a + (o.hold ?? 0), o.tau ?? o.dur / 5);
    osc.connect(g).connect(dest);
    osc.onended = () => g.disconnect();
    osc.start(when);
    osc.stop(when + o.dur + 0.1);
    return osc;
  }

  /** A struck bell: a few inharmonic partials. */
  private bell(dest: AudioNode, when: number, freq: number, gain = 0.3, decay = 1.4) {
    (
      [
        [1, 1, decay],
        [2.01, 0.5, decay * 0.6],
        [2.76, 0.3, decay * 0.4],
        [5.4, 0.12, decay * 0.2],
      ] as const
    ).forEach(([r, a, d]) => this.tone(dest, when, { freq: freq * r, dur: d, gain: gain * a, tau: d / 5 }));
  }

  /** A crash cymbal: six square waves at clashing pitches, filtered to a shimmer, and a splash of noise. */
  private cymbal(when: number, gain = 0.4, decay = 2.4) {
    const ctx = this.ctx;
    const d = this.out(when, { pan: 0.35, verb: 0.45, gain });
    const bp = ctx.createBiquadFilter();
    bp.type = "highpass";
    bp.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.35, when + 0.004);
    g.gain.setTargetAtTime(0, when + 0.004, decay / 5);
    bp.connect(g).connect(d);
    for (const f of [205.3, 304.4, 369.6, 522.7, 540, 800]) {
      const o = ctx.createOscillator();
      o.type = "square";
      o.frequency.value = f * 1.9;
      o.connect(bp);
      o.onended = () => o.disconnect();
      o.start(when);
      o.stop(when + decay + 0.1);
    }
    this.hiss(d, when, { dur: decay, attack: 0.003, tau: decay / 6, type: "highpass", freq: 4500, gain: 0.5 });
  }

  /** The whole band on one chord (names like "D4"), held for `secs`. */
  private tutti(when: number, chord: [Inst, string[], number][], secs: number) {
    const dur = secs / SIXTEENTH;
    for (const [inst, notes, vel] of chord) for (const n of notes) this.o.note({ inst, step: 0, midi: midiOf(n), dur, vel }, when);
  }

  play(name: SfxName, at = this.ctx.currentTime + 0.02, o: SfxOpts = {}) {
    const ctx = this.ctx;
    const when = Math.max(at, ctx.currentTime);
    switch (name) {
      case "curtain": {
        // velvet on velvet: the two halves of the curtain, one in each ear
        for (const pan of [-0.65, 0.65]) {
          const d = this.out(when, { pan, verb: 0.35, gain: 0.5 });
          this.hiss(d, when, { dur: 2.2, attack: 0.5, hold: 0.6, tau: 0.35, type: "lowpass", freq: 700, freqEnd: 1500, q: 0.5, gain: 0.6 });
          this.hiss(d, when + 0.1, { dur: 2, attack: 0.6, hold: 0.4, tau: 0.3, type: "bandpass", freq: 3200, q: 0.7, gain: 0.12 });
        }
        break;
      }
      case "sceneryIn":
      case "sceneryOut": {
        const up = name === "sceneryIn";
        // the cloth on its lines from the flies
        const fly = this.out(when, { verb: 0.3, gain: 0.35 });
        this.hiss(fly, when, { dur: 1.1, attack: 0.25, tau: 0.25, freq: up ? 1600 : 500, freqEnd: up ? 450 : 1500, q: 1.2, gain: 0.5 });
        // the trucks rolling on from both wings
        for (const pan of [-0.8, 0.8]) {
          const w = this.out(when, { pan, verb: 0.15, gain: 0.4 });
          this.hiss(w, when + 0.15, { dur: 1.3, attack: 0.3, hold: 0.5, tau: 0.2, type: "lowpass", freq: 220, q: 0.7, gain: 0.9 });
          for (let k = 0; k < 5; k++) this.hiss(w, when + 0.25 + k * 0.19, { dur: 0.05, tau: 0.012, freq: 900, q: 3, gain: 0.25 });
        }
        this.play("trap", when + (up ? 0.35 : 0.1), { gain: 0.8 });
        break;
      }
      case "trap": {
        const d = this.out(when, { verb: 0.25, gain: o.gain ?? 1 });
        // the lids unlatch and slide, then the lift's motor hums
        this.hiss(d, when, { dur: 0.08, tau: 0.02, freq: 700, q: 2.5, gain: 0.7 });
        this.hiss(d, when + 0.06, { dur: 0.35, attack: 0.05, tau: 0.08, freq: 1300, freqEnd: 800, q: 1.5, gain: 0.25 });
        this.tone(d, when + 0.1, { freq: 48, freqEnd: 66, type: "sawtooth", dur: 1.2, attack: 0.2, hold: 0.6, tau: 0.15, gain: 0.08 });
        break;
      }
      case "train": {
        // a little steam engine crossing the coast, left to right
        const n = 16;
        let t = when;
        for (let k = 0; k < n; k++) {
          const pan = -0.9 + (1.8 * k) / (n - 1);
          const loud = Math.sin((Math.PI * (k + 0.5)) / n);
          const d = this.out(t, { pan, verb: 0.2, gain: 0.35 * loud });
          this.hiss(d, t, { dur: 0.16, attack: 0.008, tau: 0.05, freq: k % 2 ? 900 : 650, q: 0.9, gain: 1 });
          t += 0.26 - k * 0.004;
        }
        // toot-toot
        const w = this.out(when + 0.9, { pan: -0.2, verb: 0.45, gain: 0.12 });
        for (const [start, len] of [
          [0.9, 0.28],
          [1.28, 0.5],
        ]) {
          for (const f of [554, 659, 831]) this.tone(w, when + start, { freq: f, type: "triangle", dur: len, attack: 0.03, hold: len - 0.08, tau: 0.04, gain: 0.35 });
        }
        break;
      }
      case "schoolBell": {
        // an electric bell: the hammer rattling a small dome
        const d = this.out(when, { pan: -0.3, verb: 0.4, gain: 0.14 });
        const amp = ctx.createGain();
        amp.gain.value = 0.5;
        const lfo = ctx.createOscillator();
        lfo.type = "square";
        lfo.frequency.value = 19;
        const lg = ctx.createGain();
        lg.gain.value = 0.5;
        lfo.connect(lg).connect(amp.gain);
        amp.connect(d);
        for (const [f, a] of [
          [1760, 1],
          [2650, 0.5],
          [4150, 0.25],
        ]) this.tone(amp, when, { freq: f, dur: 1.4, attack: 0.01, hold: 1.0, tau: 0.12, gain: a });
        lfo.onended = () => amp.disconnect();
        lfo.start(when);
        lfo.stop(when + 1.6);
        break;
      }
      case "horn": {
        // meep-meep
        const d = this.out(when, { pan: 0.2, verb: 0.2, gain: 0.07 });
        for (const s of [0, 0.22]) for (const f of [415, 523]) this.tone(d, when + s, { freq: f, type: "square", dur: 0.16, attack: 0.005, hold: 0.12, tau: 0.02, gain: 0.5 });
        break;
      }
      case "kaching": {
        const d = this.out(when, { pan: 0.25, verb: 0.35, gain: 0.35 });
        this.hiss(d, when, { dur: 0.25, attack: 0.01, tau: 0.06, type: "lowpass", freq: 900, gain: 0.8 });
        this.bell(d, when + 0.12, 2093, 0.35, 1.6);
        this.bell(d, when + 0.12, 2637, 0.2, 1.4);
        break;
      }
      case "beep": {
        const d = this.out(when, { pan: 0.4, verb: 0.2, gain: 0.08 });
        for (const s of [0, 0.3]) this.tone(d, when + s, { freq: 1046, dur: 0.14, attack: 0.005, hold: 0.1, tau: 0.02, gain: 1 });
        break;
      }
      case "typewriter": {
        const d = this.out(when, { pan: -0.3, verb: 0.2, gain: 0.4 });
        let t = when;
        for (let k = 0; k < 9; k++) {
          this.hiss(d, t, { dur: 0.05, tau: 0.01, freq: 2400 + Math.random() * 800, q: 2, gain: 0.8 });
          this.tone(d, t, { freq: 140, dur: 0.05, tau: 0.012, gain: 0.3 });
          t += 0.075 + Math.random() * 0.06;
        }
        this.bell(d, t + 0.1, 3520, 0.3, 0.9);
        break;
      }
      case "sparkle": {
        const d = this.out(when, { pan: 0.3, verb: 0.5, gain: 0.25 });
        [88, 91, 95, 100, 103].forEach((m, i) => this.bell(d, when + i * 0.07, 440 * Math.pow(2, (m - 69) / 12), 0.25, 0.9));
        break;
      }
      case "blip": {
        const d = this.out(when, { pan: 0.1, verb: 0.15, gain: 0.05 });
        [659, 784, 988, 1319].forEach((f, i) => this.tone(d, when + i * 0.07, { freq: f, type: "square", dur: 0.07, hold: 0.05, tau: 0.01, gain: 1 }));
        break;
      }
      case "shutter": {
        const d = this.out(when, { pan: 0.35, verb: 0.2, gain: 0.5 });
        this.hiss(d, when, { dur: 0.03, tau: 0.006, type: "highpass", freq: 2500, gain: 1 });
        this.hiss(d, when + 0.07, { dur: 0.04, tau: 0.008, type: "highpass", freq: 1800, gain: 0.8 });
        // the flash charging
        this.tone(d, when + 0.15, { freq: 2200, freqEnd: 7400, dur: 0.9, attack: 0.1, tau: 0.3, gain: 0.03 });
        break;
      }
      case "chime": {
        // front-of-house chime: three notes, down
        const d = this.out(when, { verb: 0.55, gain: 0.3 });
        [784, 659, 523].forEach((f, i) => this.bell(d, when + i * 0.42, f, 0.4, 2));
        break;
      }
      case "bulbs": {
        const d = this.out(when, { verb: 0.2, gain: 0.35 });
        for (let k = 0; k < 8; k++) this.hiss(d, when + k * 0.06 + Math.random() * 0.02, { dur: 0.03, tau: 0.005, freq: 3000, q: 1.5, gain: 0.6 });
        this.tone(d, when, { freq: 100, dur: 1.5, attack: 0.4, tau: 0.4, gain: 0.02 });
        break;
      }
      case "creak": {
        // a door on dry hinges: a slow buzz whose pitch wanders
        const d = this.out(when, { pan: 0.45, verb: 0.35, gain: 0.12 });
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        const curve = new Float32Array(32);
        for (let i = 0; i < curve.length; i++) {
          const p = i / (curve.length - 1);
          curve[i] = 38 + 70 * Math.sin(Math.PI * p) + Math.sin(i * 1.7) * 9;
        }
        osc.frequency.setValueCurveAtTime(curve, when, 1.2);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1100;
        bp.Q.value = 4;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(1, when + 0.1);
        g.gain.setValueAtTime(1, when + 1.0);
        g.gain.linearRampToValueAtTime(0, when + 1.25);
        osc.connect(bp).connect(g).connect(d);
        osc.onended = () => g.disconnect();
        osc.start(when);
        osc.stop(when + 1.3);
        break;
      }
      case "step": {
        const d = this.out(when, { pan: o.pan ?? 0, verb: o.verb ?? 0.25, gain: o.gain ?? 0.5 });
        this.tone(d, when, { freq: 95, freqEnd: 60, dur: 0.12, tau: 0.03, gain: 0.8 });
        this.hiss(d, when, { dur: 0.06, tau: 0.012, type: "lowpass", freq: 1400, gain: 0.5 });
        this.hiss(d, when + 0.07, { dur: 0.05, tau: 0.01, freq: 2200, q: 1.5, gain: 0.12 });
        break;
      }
      case "thunk": {
        // the lighting board's master switch
        const d = this.out(when, { verb: 0.3, gain: 0.5 });
        this.hiss(d, when, { dur: 0.2, tau: 0.04, type: "lowpass", freq: 500, gain: 1 });
        this.tone(d, when, { freq: 70, freqEnd: 45, dur: 0.4, tau: 0.08, gain: 0.6 });
        this.tone(d, when, { freq: 50, type: "sawtooth", dur: 0.5, tau: 0.1, gain: 0.05 });
        break;
      }
      case "telegraph": {
        // Z T in Morse, then the bell of the office
        const d = this.out(when, { pan: -0.1, verb: 0.2, gain: 0.1 });
        const dit = 0.07;
        let t = when;
        for (const c of "--.. -") {
          if (c === " ") {
            t += dit * 3;
            continue;
          }
          const len = c === "-" ? dit * 3 : dit;
          this.tone(d, t, { freq: 740, dur: len, attack: 0.004, hold: len - 0.01, tau: 0.006, gain: 1 });
          t += len + dit;
        }
        const b = this.out(t + 0.15, { verb: 0.4, gain: 0.3 });
        this.bell(b, t + 0.15, 1568, 0.4, 1.4);
        break;
      }
      case "whoosh": {
        const d = this.out(when, { pan: o.pan ?? 0, verb: 0.3, gain: o.gain ?? 0.35 });
        this.hiss(d, when, { dur: 0.45, attack: 0.15, tau: 0.08, freq: 400, freqEnd: 2200, q: 1.4, gain: 1 });
        break;
      }
      case "page": {
        const d = this.out(when, { verb: 0.1, gain: 0.25 });
        for (let k = 0; k < 4; k++) this.hiss(d, when + k * 0.05 + Math.random() * 0.03, { dur: 0.09, attack: 0.01, tau: 0.03, freq: 3500 + k * 400, q: 0.8, gain: 0.7 - k * 0.12 });
        break;
      }
      case "tick":
        this.o.note({ inst: "wood", step: 0, midi: 84, dur: 1, vel: 0.45 }, when);
        break;
      case "hello":
        for (const e of flourish()) this.o.note(e, when + e.step * 0.065);
        break;
      case "bravo": {
        // the bow: a drum roll that swells, a cymbal, and the band on D major
        const roll = 1.4;
        for (let t = 0; t < roll; t += 1 / 26) this.o.note({ inst: "snare", step: 0, midi: 60, dur: 0.5, vel: 0.12 + 0.7 * (t / roll) ** 1.5 }, when + t);
        for (let t = 0.6; t < roll; t += 1 / 14) this.o.note({ inst: "timp", step: 0, midi: 45, dur: 1, vel: 0.15 + 0.35 * (t / roll) }, when + t);
        const hit = when + roll;
        this.cymbal(hit, 0.38);
        this.tutti(
          hit,
          [
            ["bass", ["D2"], 0.9],
            ["timp", ["D3"], 0.8],
            ["guitar", ["D4", "F#4", "A4", "D5"], 0.5],
            ["cimbalom", ["D5", "F#5", "A5"], 0.6],
            ["glock", ["D6", "F#6", "A6", "D7"], 0.42],
            ["organ", ["D3", "A3", "D4", "F#4"], 0.45],
          ],
          2.6,
        );
        break;
      }
      case "fin": {
        // the last cadence: dominant, then home, and the cymbal let ring
        const beat = SIXTEENTH * 4;
        this.tutti(
          when,
          [
            ["bass", ["A2"], 0.8],
            ["guitar", ["A3", "C#4", "E4", "G4"], 0.5],
            ["organ", ["A3", "C#4", "E4", "G4"], 0.4],
          ],
          beat * 1.5,
        );
        const home = when + beat * 2;
        this.tutti(
          home,
          [
            ["bass", ["D2"], 1],
            ["timp", ["D3"], 0.8],
            ["guitar", ["D4", "F#4", "A4", "D5"], 0.55],
            ["cimbalom", ["F#5", "A5", "D6"], 0.6],
            ["organ", ["D3", "A3", "D4", "F#4"], 0.45],
          ],
          3.5,
        );
        ["D6", "F#6", "A6", "D7"].forEach((n, i) => this.o.note({ inst: "glock", step: 0, midi: midiOf(n), dur: 6, vel: 0.5 }, home + 0.1 + i * 0.09));
        this.cymbal(home, 0.25, 3.2);
        break;
      }
    }
  }
}

/** A looping ambient bed whose level follows the scroll. */
export class Bed {
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode;
  private quietSince = 0;
  private o: Orchestra;
  private name: BedName;
  private static cache = new Map<string, AudioBuffer>();

  constructor(o: Orchestra, name: BedName) {
    this.o = o;
    this.name = name;
    this.gain = o.ctx.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(o.beds);
    const send = o.ctx.createGain();
    send.gain.value = 0.15;
    this.gain.connect(send).connect(o.verb);
  }

  private buffer() {
    const ctx = this.o.ctx;
    const key = `${this.name}:${ctx.sampleRate}`;
    let b = Bed.cache.get(key);
    if (!b) {
      const [l, r] = BEDS[this.name].make(ctx.sampleRate);
      let peak = 0;
      for (let i = 0; i < l.length; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
      const k = peak > 0 ? 0.8 / peak : 1;
      for (let i = 0; i < l.length; i++) {
        l[i] *= k;
        r[i] *= k;
      }
      b = ctx.createBuffer(2, l.length, ctx.sampleRate);
      b.copyToChannel(l as Float32Array<ArrayBuffer>, 0);
      b.copyToChannel(r as Float32Array<ArrayBuffer>, 1);
      Bed.cache.set(key, b);
    }
    return b;
  }

  /** Set the level (0…1); starts the loop when needed and stops it after a while in silence. */
  level(v: number) {
    const ctx = this.o.ctx;
    const now = ctx.currentTime;
    const target = v * BEDS[this.name].gain;
    if (v > 0.001 && !this.src) {
      const src = ctx.createBufferSource();
      src.buffer = this.buffer();
      src.loop = true;
      src.connect(this.gain);
      src.start(now, Math.random() * src.buffer.duration);
      this.src = src;
    }
    this.gain.gain.setTargetAtTime(target, now, 0.12);
    if (v <= 0.001) {
      if (!this.quietSince) this.quietSince = now;
      else if (this.src && now - this.quietSince > 2) {
        this.src.stop();
        this.src.disconnect();
        this.src = null;
      }
    } else this.quietSince = 0;
  }
}
