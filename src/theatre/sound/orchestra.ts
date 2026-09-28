// The pit orchestra: turns the score's note events into sound with the Web
// Audio API. Plucked and struck strings are rendered once as samples
// (Karplus–Strong); bells, organ and whistle are oscillators; percussion is
// shaped noise. Nothing is downloaded: every sound is made here.

import { hall, mtof, pluck, whiteNoise, type PluckOpts } from "./dsp";
import { SIXTEENTH, type Inst, type NoteEv } from "./score";

interface Strip {
  input: GainNode;
}

const MIX: Record<Inst, { gain: number; pan: number; verb: number; filter?: [BiquadFilterType, number, number?] }> = {
  balalaika: { gain: 0.42, pan: 0.3, verb: 0.22, filter: ["peaking", 900, 1] },
  guitar: { gain: 0.36, pan: -0.35, verb: 0.24, filter: ["lowpass", 3200] },
  bass: { gain: 0.85, pan: -0.1, verb: 0.08, filter: ["lowpass", 1300] },
  harpsi: { gain: 0.26, pan: -0.45, verb: 0.2, filter: ["highpass", 180] },
  cimbalom: { gain: 0.34, pan: 0.4, verb: 0.3 },
  glock: { gain: 0.16, pan: 0.5, verb: 0.35 },
  celesta: { gain: 0.2, pan: 0.2, verb: 0.4 },
  organ: { gain: 0.11, pan: 0, verb: 0.3, filter: ["lowpass", 1400] },
  whistle: { gain: 0.16, pan: 0.1, verb: 0.35 },
  brush: { gain: 0.16, pan: -0.2, verb: 0.1, filter: ["bandpass", 4200, 0.6] },
  snare: { gain: 0.2, pan: -0.25, verb: 0.15, filter: ["highpass", 900] },
  wood: { gain: 0.2, pan: 0.35, verb: 0.2 },
  timp: { gain: 0.45, pan: -0.3, verb: 0.3 },
  tri: { gain: 0.05, pan: 0.55, verb: 0.4 },
};

const PLUCKED: Partial<Record<Inst, Omit<PluckOpts, "seed">>> = {
  balalaika: { bright: 0.72, decay: 1.1, pick: 0.17, seconds: 1.1 },
  guitar: { bright: 0.38, decay: 2.2, pick: 0.22, seconds: 1.6 },
  bass: { bright: 0.2, decay: 1.6, pick: 0.3, seconds: 1.4 },
  harpsi: { bright: 0.96, decay: 1.2, pick: 0.1, seconds: 1.0 },
  cimbalom: { bright: 0.82, decay: 2.4, pick: 0.12, seconds: 1.8 },
};

/** Samples are rendered every three semitones and repitched in between. */
const GRID = 3;
const PLUCK_SR = 32000;

export class Orchestra {
  readonly ctx: BaseAudioContext;
  readonly master: GainNode;
  readonly music: GainNode;
  readonly sfx: GainNode;
  readonly beds: GainNode;
  readonly verb: GainNode;
  readonly noise: AudioBuffer;
  private strips = new Map<Inst, Strip>();
  private samples = new Map<string, { buf: AudioBuffer; freq: number }>();

  constructor(ctx: BaseAudioContext, destination: AudioNode = ctx.destination) {
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.25;
    comp.connect(destination);

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(comp);

    const ir = hall(ctx.sampleRate);
    const irBuf = ctx.createBuffer(2, ir[0].length, ctx.sampleRate);
    irBuf.copyToChannel(ir[0] as Float32Array<ArrayBuffer>, 0);
    irBuf.copyToChannel(ir[1] as Float32Array<ArrayBuffer>, 1);
    const conv = ctx.createConvolver();
    conv.buffer = irBuf;
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    this.verb = ctx.createGain();
    this.verb.connect(conv).connect(wet).connect(this.master);

    this.music = ctx.createGain();
    this.sfx = ctx.createGain();
    this.beds = ctx.createGain();
    this.music.connect(this.master);
    this.sfx.connect(this.master);
    this.beds.connect(this.master);

    const n = whiteNoise(ctx.sampleRate, 2);
    this.noise = ctx.createBuffer(1, n.length, ctx.sampleRate);
    this.noise.copyToChannel(n as Float32Array<ArrayBuffer>, 0);
  }

  private strip(inst: Inst): Strip {
    let s = this.strips.get(inst);
    if (s) return s;
    const ctx = this.ctx;
    const m = MIX[inst];
    const input = ctx.createGain();
    input.gain.value = m.gain;
    let node: AudioNode = input;
    if (m.filter) {
      const f = ctx.createBiquadFilter();
      f.type = m.filter[0];
      f.frequency.value = m.filter[1];
      if (m.filter[2] !== undefined) f.Q.value = m.filter[2];
      if (m.filter[0] === "peaking") f.gain.value = 5;
      node.connect(f);
      node = f;
    }
    const pan = ctx.createStereoPanner();
    pan.pan.value = m.pan;
    node.connect(pan).connect(this.music);
    const send = ctx.createGain();
    send.gain.value = m.verb;
    pan.connect(send).connect(this.verb);
    s = { input };
    this.strips.set(inst, s);
    return s;
  }

  /** The nearest rendered sample for a plucked note, and how far to repitch it. */
  private sample(inst: Inst, midi: number) {
    const root = Math.round(midi / GRID) * GRID;
    const key = `${inst}:${root}`;
    let s = this.samples.get(key);
    if (!s) {
      const o = PLUCKED[inst]!;
      const { data, freq } = pluck(PLUCK_SR, mtof(root), { ...o, seed: root * 13 + inst.length });
      const buf = this.ctx.createBuffer(1, data.length, PLUCK_SR);
      buf.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
      s = { buf, freq };
      this.samples.set(key, s);
    }
    return { buf: s.buf, rate: mtof(midi) / s.freq };
  }

  /** Render the samples a section is about to need, so the first bar doesn't stutter. */
  warm(events: NoteEv[]) {
    for (const e of events) if (PLUCKED[e.inst]) this.sample(e.inst, e.midi);
  }

  /** Play one note of the score at `when` (seconds, on the context's clock). */
  note(e: NoteEv, at: number, level = 1) {
    const ctx = this.ctx;
    // Web Audio refuses times in the past (or before zero)
    const when = Math.max(at, ctx.currentTime);
    const out = this.strip(e.inst).input;
    const vel = Math.max(0, Math.min(1, e.vel)) * level;
    const dur = e.dur * SIXTEENTH;
    const freq = mtof(e.midi);

    const env = (a: number, peak: number) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(peak, when + a);
      g.connect(out);
      return g;
    };

    if (PLUCKED[e.inst]) {
      const { buf, rate } = this.sample(e.inst, e.midi);
      const play = (r: number, gain: number) => {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = r;
        const g = env(0.002, gain);
        // the player damps the string when the note ends
        const hold = e.inst === "guitar" || e.inst === "cimbalom" ? dur * 1.6 : dur;
        g.gain.setTargetAtTime(0, when + Math.max(0.06, hold), e.inst === "bass" ? 0.06 : 0.04);
        src.connect(g);
        src.onended = () => g.disconnect();
        src.start(when);
        src.stop(when + Math.min(buf.duration / r, Math.max(0.06, hold) + 0.4));
      };
      play(rate, vel);
      // the cimbalom has courses of strings, never quite in tune with each other
      if (e.inst === "cimbalom") play(rate * 1.0021, vel * 0.55);
      return;
    }

    const partials = (list: [number, number, number][], attack: number) => {
      for (const [ratio, amp, decay] of list) {
        const o = ctx.createOscillator();
        o.frequency.value = freq * ratio;
        const g = env(attack, vel * amp);
        g.gain.setTargetAtTime(0, when + attack, decay / 5);
        o.connect(g);
        o.onended = () => g.disconnect();
        o.start(when);
        o.stop(when + decay + 0.05);
      }
    };

    const noise = (gain: number, attack: number, tau: number, length: number, rate = 1) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.playbackRate.value = rate;
      const g = env(attack, gain);
      g.gain.setTargetAtTime(0, when + attack, tau);
      src.connect(g);
      src.onended = () => g.disconnect();
      const off = Math.random() * (this.noise.duration - length - 0.1);
      src.start(when, off, length);
    };

    switch (e.inst) {
      case "glock":
        partials(
          [
            [1, 1, 1.3],
            [2.756, 0.32, 0.45],
            [5.404, 0.12, 0.18],
          ],
          0.002,
        );
        noise(vel * 0.25, 0.001, 0.004, 0.02, 1.5);
        break;
      case "celesta":
        partials(
          [
            [1, 1, 1.5],
            [2, 0.2, 0.5],
            [3.98, 0.08, 0.2],
          ],
          0.004,
        );
        break;
      case "tri":
        partials(
          [
            [1, 1, 1.6],
            [1.37, 0.6, 1.2],
            [1.83, 0.4, 0.9],
          ].map(([r, a, d]) => [r * (5200 / freq), a, d] as [number, number, number]),
          0.002,
        );
        break;
      case "wood":
        partials(
          [
            [1, 1, 0.12],
            [2.72, 0.3, 0.05],
          ],
          0.001,
        );
        break;
      case "organ": {
        const g = env(0.09, vel);
        g.gain.setValueAtTime(vel, when + Math.max(0.1, dur - 0.05));
        g.gain.setTargetAtTime(0, when + Math.max(0.1, dur - 0.05), 0.09);
        const detune = (Math.random() - 0.5) * 8;
        (
          [
            ["sawtooth", 1, 0.6],
            ["triangle", 2, 0.5],
          ] as const
        ).forEach(([type, mult, amp]) => {
          const o = ctx.createOscillator();
          o.type = type;
          o.frequency.value = freq * mult;
          o.detune.value = detune;
          const a = ctx.createGain();
          a.gain.value = amp;
          o.connect(a).connect(g);
          o.onended = () => {
            a.disconnect();
            g.disconnect();
          };
          o.start(when);
          o.stop(when + dur + 0.6);
        });
        break;
      }
      case "whistle": {
        const g = env(0.035, vel);
        const end = when + Math.max(0.08, dur);
        g.gain.setValueAtTime(vel, Math.max(when + 0.04, end - 0.06));
        g.gain.setTargetAtTime(0, Math.max(when + 0.04, end - 0.06), 0.04);
        const o = ctx.createOscillator();
        // a little scoop up into each note, then a lazy vibrato
        o.frequency.setValueAtTime(freq * 0.965, when);
        o.frequency.exponentialRampToValueAtTime(freq, when + 0.07);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 5.3;
        const depth = ctx.createGain();
        depth.gain.setValueAtTime(0, when);
        depth.gain.linearRampToValueAtTime(freq * 0.007, when + Math.min(0.35, dur));
        lfo.connect(depth).connect(o.frequency);
        o.connect(g);
        // breath
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = freq * 2;
        bp.Q.value = 3;
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const bg = ctx.createGain();
        bg.gain.value = 0.18;
        src.connect(bp).connect(bg).connect(g);
        [o, lfo].forEach((n) => {
          n.start(when);
          n.stop(end + 0.3);
        });
        o.onended = () => {
          depth.disconnect();
          bg.disconnect();
          g.disconnect();
        };
        src.start(when, Math.random(), dur + 0.3);
        break;
      }
      case "brush":
        noise(vel, 0.012, 0.05, 0.25);
        break;
      case "snare": {
        noise(vel, 0.001, 0.04, 0.2);
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.setValueAtTime(200, when);
        o.frequency.exponentialRampToValueAtTime(160, when + 0.05);
        const g = env(0.001, vel * 0.5);
        g.gain.setTargetAtTime(0, when + 0.001, 0.025);
        o.connect(g);
        o.onended = () => g.disconnect();
        o.start(when);
        o.stop(when + 0.2);
        break;
      }
      case "timp": {
        for (const [ratio, amp, decay] of [
          [1, 1, 1.8],
          [1.5, 0.45, 1.1],
          [1.98, 0.22, 0.7],
        ] as const) {
          const o = ctx.createOscillator();
          o.frequency.setValueAtTime(freq * ratio * 1.025, when);
          o.frequency.exponentialRampToValueAtTime(freq * ratio, when + 0.09);
          const g = env(0.004, vel * amp);
          g.gain.setTargetAtTime(0, when + 0.004, decay / 5);
          o.connect(g);
          o.onended = () => g.disconnect();
          o.start(when);
          o.stop(when + decay + 0.05);
        }
        noise(vel * 0.3, 0.002, 0.02, 0.1, 0.3);
        break;
      }
    }
  }
}
