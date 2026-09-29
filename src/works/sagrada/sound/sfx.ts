// The film's effects, from the shooting script. Made on the spot from noise
// and oscillators, through the theatre's orchestra (its reverb, its mix).

import { projector } from "@/theatre/sound/dsp";
import type { Orchestra } from "@/theatre/sound/orchestra";
import { SIXTEENTH as THEATRE_SIXTEENTH } from "@/theatre/sound/score";

import { countryside, crowd, fire, masons, street, traffic, wind } from "./beds";
import { flourish, midiOf, toMajor, type Inst } from "./score";

export type FilmSfx =
  | "hello"
  | "roll" // the projector starts
  | "splice" // a chapter card
  | "scribble" // the director's red marker
  | "gull"
  | "stakes"
  | "sign"
  | "bells"
  | "toll"
  | "applause"
  | "unroll"
  | "rip"
  | "clink"
  | "pluck" // a string of the model, brushed by the visitor
  | "twang" // the strings let down, snapping taut
  | "whoosh"
  | "tramBell"
  | "tramBy"
  | "ignite"
  | "shatter"
  | "mend"
  | "boot"
  | "crane"
  | "tapeStop"
  | "tapeStart"
  | "sparkle"
  | "choir"
  | "cheer"
  | "launch"
  | "boom"
  | "glitter"
  | "fin";

export type FilmBed = "projector" | "wind" | "countryside" | "masons" | "street" | "fire" | "traffic" | "crowd";

export const BEDS: Record<FilmBed, { make: (sr: number) => [Float32Array, Float32Array]; gain: number }> = {
  projector: { make: (sr) => projector(sr), gain: 0.26 },
  wind: { make: (sr) => wind(sr), gain: 0.3 },
  countryside: { make: (sr) => countryside(sr), gain: 0.32 },
  masons: { make: (sr) => masons(sr), gain: 0.3 },
  street: { make: (sr) => street(sr), gain: 0.3 },
  fire: { make: (sr) => fire(sr), gain: 0.42 },
  traffic: { make: (sr) => traffic(sr), gain: 0.26 },
  crowd: { make: (sr) => crowd(sr), gain: 0.34 },
};

export interface SfxOpts {
  pan?: number;
  verb?: number;
  gain?: number;
  /** seconds of delay (sound travelling from far away) */
  delay?: number;
}

export class Effects {
  private o: Orchestra;
  constructor(o: Orchestra) {
    this.o = o;
  }

  private get ctx() {
    return this.o.ctx;
  }

  private out(when: number, o: SfxOpts = {}) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = o.gain ?? 1;
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, o.pan ?? 0));
    g.connect(p).connect(this.o.sfx);
    const s = ctx.createGain();
    s.gain.value = o.verb ?? 0.2;
    p.connect(s).connect(this.o.verb);
    if (typeof AudioContext !== "undefined" && ctx instanceof AudioContext) {
      setTimeout(() => g.disconnect(), Math.max(0, (when - ctx.currentTime) * 1000) + 9000);
    }
    return g;
  }

  private hiss(
    dest: AudioNode,
    when: number,
    o: { dur: number; attack?: number; tau?: number; gain?: number; type?: BiquadFilterType; freq?: number; freqEnd?: number; q?: number; hold?: number; rate?: number },
  ) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.o.noise;
    src.loop = true;
    if (o.rate) src.playbackRate.value = o.rate;
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
    src.stop(when + o.dur + 0.3);
  }

  private tone(
    dest: AudioNode,
    when: number,
    o: { freq: number; freqEnd?: number; type?: OscillatorType; dur: number; attack?: number; tau?: number; gain?: number; hold?: number; vibrato?: number },
  ) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(o.freq, when);
    if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, when + o.dur);
    let lfo: OscillatorNode | null = null;
    if (o.vibrato) {
      lfo = ctx.createOscillator();
      lfo.frequency.value = 6;
      const d = ctx.createGain();
      d.gain.value = o.freq * o.vibrato;
      lfo.connect(d).connect(osc.frequency);
      lfo.start(when);
      lfo.stop(when + o.dur + 0.1);
    }
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

  /** A struck bell. Church bells get the hum and the "tierce" a minor third up. */
  private bell(dest: AudioNode, when: number, freq: number, gain = 0.3, decay = 1.4, church = false) {
    const partials: [number, number, number][] = church
      ? [
          [0.5, 0.5, decay * 1.3],
          [1, 1, decay],
          [1.19, 0.55, decay * 0.8],
          [1.5, 0.35, decay * 0.6],
          [2, 0.3, decay * 0.5],
          [2.52, 0.14, decay * 0.3],
        ]
      : [
          [1, 1, decay],
          [2.01, 0.5, decay * 0.6],
          [2.76, 0.3, decay * 0.4],
          [5.4, 0.12, decay * 0.2],
        ];
    partials.forEach(([r, a, d]) => this.tone(dest, when, { freq: freq * r, dur: d, gain: gain * a, tau: d / 5 }));
  }

  private tutti(when: number, chord: [Inst, string[], number][], secs: number, major = false) {
    const dur = secs / THEATRE_SIXTEENTH;
    for (const [inst, notes, vel] of chord)
      for (const n of notes) this.o.note({ inst, step: 0, midi: major ? toMajor(midiOf(n)) : midiOf(n), dur, vel }, when);
  }

  play(name: FilmSfx, at = this.ctx.currentTime + 0.02, o: SfxOpts = {}) {
    const ctx = this.ctx;
    const when = Math.max(at, ctx.currentTime) + (o.delay ?? 0);
    switch (name) {
      case "hello":
        for (const e of flourish()) this.o.note(e, when + e.step * 0.065);
        break;
      case "roll": {
        // the projector's motor winding up, the gate clacking into step
        const d = this.out(when, { pan: 0.2, verb: 0.15, gain: 0.35 });
        this.tone(d, when, { freq: 30, freqEnd: 100, type: "sawtooth", dur: 1.4, attack: 0.3, hold: 0.8, tau: 0.3, gain: 0.08 });
        for (let k = 0; k < 18; k++) {
          const t = when + 0.9 * (1 - Math.pow(1 - k / 18, 1.6));
          this.hiss(d, t, { dur: 0.03, tau: 0.006, freq: 1800, q: 1.2, gain: 0.5 });
        }
        break;
      }
      case "splice": {
        // a hard cut: a splice clacks through the gate, a low thump, a flutter
        const d = this.out(when, { verb: 0.25, gain: 0.55 });
        this.tone(d, when, { freq: 72, freqEnd: 42, dur: 0.45, tau: 0.09, gain: 0.9 });
        this.hiss(d, when, { dur: 0.04, tau: 0.01, type: "highpass", freq: 1800, gain: 0.8 });
        for (let k = 0; k < 6; k++) this.hiss(d, when + 0.05 + k * 0.042, { dur: 0.025, tau: 0.006, freq: 2600, q: 1.5, gain: 0.35 - k * 0.04 });
        break;
      }
      case "scribble": {
        // a felt-tip squeaking across paper, back and forth
        const d = this.out(when, { pan: (Math.random() - 0.5) * 0.6, verb: 0.08, gain: 0.3 });
        const strokes = 5 + Math.floor(Math.random() * 3);
        let t = when;
        for (let k = 0; k < strokes; k++) {
          const len = 0.07 + Math.random() * 0.06;
          this.hiss(d, t, { dur: len, attack: 0.012, hold: len * 0.5, tau: 0.015, freq: 1700 + Math.random() * 900, freqEnd: 2400 + Math.random() * 900, q: 3, gain: 0.8 });
          t += len + 0.015;
        }
        break;
      }
      case "gull": {
        // "kee-ow": a harsh cry that bends down, twice
        const d = this.out(when, { pan: o.pan ?? 0, verb: 0.45, gain: o.gain ?? 0.3 });
        for (const [s, len] of [
          [0, 0.32],
          [0.42, 0.26],
        ]) {
          const f0 = 1450 + Math.random() * 200;
          this.tone(d, when + s, { freq: f0, freqEnd: f0 * 0.62, type: "sawtooth", dur: len, attack: 0.03, hold: len * 0.5, tau: 0.05, gain: 0.25, vibrato: 0.02 });
          this.tone(d, when + s, { freq: f0 * 2.02, freqEnd: f0 * 1.3, type: "triangle", dur: len, attack: 0.03, hold: len * 0.4, tau: 0.05, gain: 0.12 });
        }
        break;
      }
      case "stakes": {
        // a surveyor's mallet on wooden stakes, across the field
        for (let k = 0; k < 5; k++) {
          const d = this.out(when, { pan: -0.7 + k * 0.35, verb: 0.3, gain: 0.35 });
          this.tone(d, when + k * 0.16, { freq: 330 + k * 25, freqEnd: 200, dur: 0.12, tau: 0.03, gain: 0.7 });
          this.hiss(d, when + k * 0.16, { dur: 0.05, tau: 0.01, freq: 1200, q: 2, gain: 0.3 });
        }
        break;
      }
      case "sign": {
        const d = this.out(when, { pan: 0.35, verb: 0.2, gain: 0.5 });
        this.tone(d, when, { freq: 180, freqEnd: 110, dur: 0.2, tau: 0.04, gain: 0.8 });
        this.hiss(d, when, { dur: 0.08, tau: 0.02, type: "lowpass", freq: 900, gain: 0.6 });
        break;
      }
      case "bells": {
        // the parish bells ringing changes: four bells, round and round
        const notes = [587, 523, 440, 392];
        for (let k = 0; k < 12; k++) {
          const f = notes[k % 4] * (Math.floor(k / 4) % 2 && k % 4 === 2 ? 523 / 440 : 1);
          const d = this.out(when, { pan: -0.3 + (k % 4) * 0.2, verb: 0.55, gain: o.gain ?? 0.14 });
          this.bell(d, when + k * 0.36, f, 0.4, 2.6, true);
        }
        break;
      }
      case "toll": {
        const d = this.out(when, { verb: 0.7, gain: 0.3 });
        this.bell(d, when, 196, 0.5, 5.5, true);
        break;
      }
      case "applause": {
        for (let k = 0; k < 90; k++) {
          const t = when + Math.pow(Math.random(), 0.7) * 2.6;
          const swell = Math.sin(Math.PI * ((t - when) / 2.8));
          const pd = this.out(t, { pan: Math.random() * 1.6 - 0.8, verb: 0.3, gain: 0.5 * swell });
          this.hiss(pd, t, { dur: 0.04, tau: 0.008, freq: 900 + Math.random() * 1500, q: 1.2, gain: 0.7 });
        }
        break;
      }
      case "unroll": {
        // a big sheet of paper unrolled on a table
        const d = this.out(when, { verb: 0.15, gain: 0.4 });
        this.hiss(d, when, { dur: 0.9, attack: 0.1, hold: 0.4, tau: 0.12, freq: 2800, freqEnd: 1500, q: 0.7, gain: 0.5 });
        for (let k = 0; k < 6; k++) this.hiss(d, when + 0.1 + k * 0.12, { dur: 0.05, tau: 0.01, freq: 3500, q: 1, gain: 0.3 });
        break;
      }
      case "rip": {
        const d = this.out(when, { verb: 0.2, gain: 0.55 });
        let t = when;
        for (let k = 0; k < 22; k++) {
          this.hiss(d, t, { dur: 0.03, tau: 0.008, freq: 1400 + Math.random() * 2600, q: 1.6, gain: 0.5 + Math.random() * 0.4 });
          t += 0.018 + Math.random() * 0.02;
        }
        break;
      }
      case "clink": {
        // little sacks of shot swinging on their strings, touching
        for (let k = 0; k < 9; k++) {
          const d = this.out(when, { pan: Math.random() * 1.4 - 0.7, verb: 0.5, gain: 0.12 });
          this.bell(d, when + k * 0.11 + Math.random() * 0.05, 2200 + Math.random() * 1800, 0.3, 0.6);
        }
        break;
      }
      case "pluck": {
        // a waxed cord, plucked: a soft low note and the rasp of the string
        const d = this.out(when, { pan: o.pan ?? 0, verb: 0.45, gain: o.gain ?? 0.2 });
        const f = 150 + Math.random() * 170;
        this.tone(d, when, { freq: f * 1.01, freqEnd: f, type: "triangle", dur: 0.9, tau: 0.22, gain: 0.55 });
        this.tone(d, when, { freq: f * 2, type: "sine", dur: 0.5, tau: 0.08, gain: 0.18 });
        this.hiss(d, when, { dur: 0.05, tau: 0.012, freq: 2600, q: 2, gain: 0.25 });
        // and, now and then, a sack knocking a neighbour
        if (Math.random() < 0.5) this.bell(d, when + 0.08 + Math.random() * 0.1, 2400 + Math.random() * 1400, 0.12, 0.4);
        break;
      }
      case "twang": {
        // a hundred strings pulled taut at once, and the sacks swinging
        for (let k = 0; k < 6; k++) {
          const d = this.out(when, { pan: (k / 5) * 1.2 - 0.6, verb: 0.5, gain: (o.gain ?? 0.3) * 0.5 });
          const f = 90 + k * 23 + Math.random() * 10;
          this.tone(d, when + k * 0.018, { freq: f * 1.12, freqEnd: f, type: "triangle", dur: 1.4, tau: 0.35, gain: 0.6 });
        }
        for (let k = 0; k < 7; k++) {
          const d = this.out(when, { pan: Math.random() * 1.4 - 0.7, verb: 0.5, gain: 0.1 });
          this.bell(d, when + 0.12 + k * 0.09 + Math.random() * 0.05, 2200 + Math.random() * 1800, 0.3, 0.5);
        }
        break;
      }
      case "whoosh": {
        const d = this.out(when, { pan: o.pan ?? 0, verb: 0.3, gain: o.gain ?? 0.4 });
        this.hiss(d, when, { dur: 0.7, attack: 0.25, tau: 0.12, freq: 350, freqEnd: 2000, q: 1.4, gain: 1 });
        break;
      }
      case "tramBell": {
        // ding-ding: the conductor's foot bell
        for (const s of [0, 0.28]) {
          const d = this.out(when + s, { pan: 0.5, verb: 0.35, gain: 0.22 });
          this.bell(d, when + s, 1660, 0.5, 1.2);
        }
        break;
      }
      case "tramBy": {
        // the tram rumbling past, right to left, wheels clacking over the joints
        const len = 2.6;
        for (let k = 0; k < 10; k++) {
          const u = k / 9;
          const d = this.out(when, { pan: 0.9 - u * 1.8, verb: 0.15, gain: 0.5 * Math.sin(Math.PI * (0.1 + u * 0.8)) });
          const t = when + u * len;
          this.hiss(d, t, { dur: 0.35, attack: 0.06, tau: 0.1, type: "lowpass", freq: 260, q: 0.8, gain: 1 });
          if (k % 2 === 0) for (const off of [0, 0.09]) this.hiss(d, t + off, { dur: 0.04, tau: 0.01, freq: 1300, q: 2, gain: 0.45 });
        }
        // the trolley pole hissing on the wire
        const w = this.out(when, { pan: 0, verb: 0.2, gain: 0.08 });
        this.hiss(w, when + 0.3, { dur: len, attack: 0.5, hold: 1, tau: 0.4, freq: 5200, q: 4, gain: 0.8 });
        break;
      }
      case "ignite": {
        const d = this.out(when, { verb: 0.3, gain: 0.7 });
        this.hiss(d, when, { dur: 1.2, attack: 0.08, tau: 0.3, type: "lowpass", freq: 300, freqEnd: 1400, q: 0.7, gain: 1 });
        this.tone(d, when, { freq: 60, freqEnd: 38, dur: 0.8, tau: 0.2, gain: 0.5 });
        break;
      }
      case "shatter": {
        // plaster: a crash, then hundreds of little pieces coming down
        const d = this.out(when, { verb: 0.45, gain: 0.7 });
        this.hiss(d, when, { dur: 0.6, attack: 0.002, tau: 0.12, type: "lowpass", freq: 2500, gain: 1 });
        this.tone(d, when, { freq: 90, freqEnd: 40, dur: 0.5, tau: 0.08, gain: 0.7 });
        for (let k = 0; k < 70; k++) {
          const t = when + 0.05 + Math.pow(Math.random(), 1.8) * 1.8;
          const pd = this.out(t, { pan: Math.random() * 1.8 - 0.9, verb: 0.35, gain: 0.25 });
          if (Math.random() < 0.3) this.bell(pd, t, 1800 + Math.random() * 3000, 0.25, 0.25);
          else this.hiss(pd, t, { dur: 0.03, tau: 0.008, freq: 2000 + Math.random() * 4000, q: 2, gain: 0.6 });
        }
        break;
      }
      case "mend": {
        // the pieces flying home: a long rising shimmer
        const d = this.out(when, { verb: 0.6, gain: 0.3 });
        const scale = [67, 70, 74, 79, 82, 86, 91, 94, 98];
        scale.forEach((m, k) => this.o.note({ inst: "glock", step: 0, midi: m, dur: 8, vel: 0.25 + k * 0.03 }, when + k * 0.18));
        this.hiss(d, when, { dur: 1.8, attack: 1.2, tau: 0.3, freq: 3000, freqEnd: 7000, q: 0.8, gain: 0.25 });
        break;
      }
      case "boot": {
        // a computer of about 1985, thinking out loud
        const d = this.out(when, { pan: -0.2, verb: 0.15, gain: 0.07 });
        const notes = [523, 659, 784, 1047, 784, 1319, 1047, 1568];
        notes.forEach((f, k) => this.tone(d, when + k * 0.06, { freq: f, type: "square", dur: 0.055, hold: 0.04, tau: 0.01, gain: 1 }));
        const m = this.out(when + 0.6, { pan: 0.2, verb: 0.1, gain: 0.04 });
        this.tone(m, when + 0.6, { freq: 1200, freqEnd: 2400, type: "square", dur: 0.25, hold: 0.2, tau: 0.02, gain: 1 });
        this.hiss(m, when + 0.9, { dur: 0.35, hold: 0.25, tau: 0.03, freq: 2200, q: 3, gain: 1.5 });
        break;
      }
      case "crane": {
        // a tower crane reversing, high above
        const d = this.out(when, { pan: -0.4, verb: 0.5, gain: 0.08 });
        for (let k = 0; k < 4; k++) this.tone(d, when + k * 0.5, { freq: 1180, dur: 0.28, hold: 0.24, tau: 0.02, gain: 1 });
        break;
      }
      case "tapeStop": {
        // everything winds down, like a tape machine switched off
        const d = this.out(when, { verb: 0.1, gain: 0.3 });
        this.tone(d, when, { freq: 392, freqEnd: 40, type: "triangle", dur: 0.9, hold: 0.6, tau: 0.1, gain: 0.5 });
        this.tone(d, when, { freq: 98, freqEnd: 20, type: "sawtooth", dur: 0.9, hold: 0.6, tau: 0.1, gain: 0.25 });
        break;
      }
      case "tapeStart": {
        const d = this.out(when, { verb: 0.1, gain: 0.25 });
        this.tone(d, when, { freq: 40, freqEnd: 392, type: "triangle", dur: 0.6, attack: 0.05, hold: 0.45, tau: 0.08, gain: 0.5 });
        break;
      }
      case "sparkle": {
        const d = this.out(when, { pan: 0.35, verb: 0.55, gain: 0.22 });
        [91, 95, 98, 103, 107].forEach((m, i) => this.bell(d, when + i * 0.08, 440 * Math.pow(2, (m - 69) / 12), 0.25, 1.1));
        break;
      }
      case "choir": {
        // a swell of voices ("aah"), for the cross: sawtooths through vowel formants
        const d = this.out(when, { verb: 0.8, gain: 0.5 });
        const chord = ["G3", "D4", "G4", "B4", "D5"].map(midiOf);
        const formants = [
          [730, 1.2],
          [1090, 0.6],
          [2440, 0.25],
        ];
        for (const m of chord) {
          for (const detune of [-6, 6]) {
            const osc = ctx.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
            osc.detune.value = detune;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, when);
            g.gain.linearRampToValueAtTime(0.12, when + 1.4);
            g.gain.setValueAtTime(0.12, when + 3);
            g.gain.linearRampToValueAtTime(0, when + 5);
            for (const [f, a] of formants) {
              const bp = ctx.createBiquadFilter();
              bp.type = "bandpass";
              bp.frequency.value = f;
              bp.Q.value = 8;
              const ga = ctx.createGain();
              ga.gain.value = a;
              osc.connect(bp).connect(ga).connect(g);
            }
            g.connect(d);
            osc.onended = () => g.disconnect();
            osc.start(when);
            osc.stop(when + 5.2);
          }
        }
        break;
      }
      case "cheer": {
        // a roar from the street, rising and settling
        const d = this.out(when, { verb: 0.4, gain: 0.5 });
        this.hiss(d, when, { dur: 3, attack: 0.6, hold: 0.8, tau: 0.5, freq: 900, q: 0.5, gain: 0.6 });
        this.hiss(d, when + 0.1, { dur: 3, attack: 0.5, hold: 0.9, tau: 0.5, freq: 2100, q: 0.9, gain: 0.25 });
        this.play("applause", when + 0.4);
        break;
      }
      case "launch": {
        // a shell climbing, whistling
        const d = this.out(when, { pan: o.pan ?? 0, verb: 0.4, gain: (o.gain ?? 1) * 0.06 });
        this.tone(d, when, { freq: 700, freqEnd: 2300, dur: 1.1, attack: 0.05, hold: 0.9, tau: 0.08, gain: 1, vibrato: 0.01 });
        this.hiss(d, when, { dur: 1.1, attack: 0.1, hold: 0.8, tau: 0.1, freq: 2500, q: 0.6, gain: 1.2 });
        break;
      }
      case "boom": {
        // the burst, from some way off: a thump, a crack, a long rumble down the streets
        const g = o.gain ?? 1;
        const d = this.out(when, { pan: o.pan ?? 0, verb: 0.6, gain: 0.55 * g });
        this.tone(d, when, { freq: 64, freqEnd: 30, dur: 1.2, tau: 0.22, gain: 1 });
        this.hiss(d, when, { dur: 0.25, tau: 0.05, type: "lowpass", freq: 1600, gain: 0.8 });
        this.hiss(d, when + 0.05, { dur: 2.2, attack: 0.05, tau: 0.5, type: "lowpass", freq: 260, gain: 0.5 });
        break;
      }
      case "glitter": {
        const d = this.out(when, { pan: o.pan ?? 0, verb: 0.4, gain: (o.gain ?? 1) * 0.3 });
        for (let k = 0; k < 26; k++) this.hiss(d, when + 0.3 + Math.random() * 1.6, { dur: 0.02, tau: 0.004, type: "highpass", freq: 3500, gain: Math.random() });
        break;
      }
      case "fin": {
        // the last cadence, in G major, and the music box let ring
        const beat = 60 / 96;
        this.tutti(
          when,
          [
            ["bass", ["D2"], 0.8],
            ["guitar", ["D4", "F#4", "A4", "C5"], 0.5],
            ["organ", ["D3", "A3", "C4", "F#4"], 0.35],
          ],
          beat * 1.5,
        );
        const home = when + beat * 2;
        this.tutti(
          home,
          [
            ["bass", ["G2"], 1],
            ["timp", ["G2"], 0.7],
            ["guitar", ["G3", "B3", "D4", "G4"], 0.55],
            ["cimbalom", ["B4", "D5", "G5"], 0.6],
            ["organ", ["G2", "D3", "G3", "B3"], 0.4],
          ],
          3.5,
        );
        ["G6", "B6", "D7", "G7"].forEach((n, i) => this.o.note({ inst: "glock", step: 0, midi: midiOf(n), dur: 20, vel: 0.45 }, home + 0.1 + i * 0.09));
        break;
      }
    }
  }
}

/** A looping bed whose level follows the scroll. */
export class Bed {
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode;
  private quietSince = 0;
  private o: Orchestra;
  private name: FilmBed;
  private static cache = new Map<string, AudioBuffer>();

  constructor(o: Orchestra, name: FilmBed) {
    this.o = o;
    this.name = name;
    this.gain = o.ctx.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(o.beds);
    const send = o.ctx.createGain();
    send.gain.value = 0.12;
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
    this.gain.gain.setTargetAtTime(target, now, 0.15);
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
