// The box office's little noises: the bell on the counter, the ticket
// printer, the punch, the tear, the pigeon. All made up on the spot with
// oscillators and noise; nothing to download.
//
// The choice of sound is shared with the theatre and the pictures ("zt-sound").
// The bell is the one exception: somebody who rings a bell expects a ding,
// unless they have told us, somewhere in the house, that they want silence.

import { setSoundPref } from "@/theatre/sound/bus";

export type BoothSfx =
  | "ding"
  | "print"
  | "punch"
  | "tear"
  | "curtain"
  | "projector"
  | "coo"
  | "flap"
  | "chimeTheatre"
  | "chimePicture"
  | "switch";

type Ctor = typeof AudioContext;

function readPref(): "on" | "off" | null {
  try {
    const v = window.localStorage.getItem("zt-sound");
    return v === "on" || v === "off" ? v : null;
  } catch {
    return null;
  }
}

class BoothSound {
  ctx: AudioContext | null = null;
  out: GainNode | null = null;
  noise: AudioBuffer | null = null;
  pref: "on" | "off" | null = null;

  load() {
    this.pref = readPref();
    return this.pref;
  }

  get on() {
    return this.pref === "on";
  }

  set(on: boolean) {
    this.pref = on ? "on" : "off";
    setSoundPref(on);
    if (on) this.unlock();
  }

  /** Must be called inside a click or key press. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return this.ctx;
    }
    const C: Ctor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
    if (!C) return null;
    const ctx = new C({ latencyHint: "interactive" });
    void ctx.resume();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    const out = ctx.createGain();
    out.gain.value = 0.8;
    out.connect(comp).connect(ctx.destination);
    // a second of white noise, for everything that isn't a tone
    const n = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = n.getChannelData(0);
    let s = 12345;
    for (let i = 0; i < d.length; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      d[i] = s / 2147483648 - 1;
    }
    this.ctx = ctx;
    this.out = out;
    this.noise = n;
    return ctx;
  }

  play(name: BoothSfx, force = false) {
    const allowed = this.on || (force && this.pref !== "off");
    if (!allowed) return;
    const ctx = this.unlock();
    if (!ctx || !this.out) return;
    const t = ctx.currentTime + 0.01;
    switch (name) {
      case "ding":
        return this.bell(t);
      case "print":
        return this.print(t);
      case "punch":
        return this.punch(t);
      case "tear":
        return this.tear(t);
      case "curtain":
        return this.swish(t, 1.4, 700, 0.35);
      case "projector":
        return this.projector(t);
      case "coo":
        return this.coo(t);
      case "flap":
        return this.flap(t);
      case "chimeTheatre":
        // a major third, warm, like a theatre's call chime
        this.tone(t, 523.25, 1.3, 0.06, "sine");
        this.tone(t + 0.16, 659.25, 1.5, 0.06, "sine");
        return;
      case "chimePicture":
        // the picture's G minor, in two plucked notes
        this.tone(t, 392, 0.9, 0.06, "triangle");
        this.tone(t + 0.13, 466.16, 1.1, 0.055, "triangle");
        return;
      case "switch":
        this.click(t, 3200, 0.25, 0.012);
        this.click(t + 0.05, 1800, 0.2, 0.015);
        return;
    }
  }

  private env(t: number, peak: number, attack: number, decay: number) {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(this.out!);
    return g;
  }

  private tone(t: number, f: number, dur: number, gain: number, type: OscillatorType, pan = 0) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    const g = this.env(t, gain, 0.005, dur);
    if (pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      o.connect(p).connect(g);
    } else o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private burst(t: number, dur: number, gain: number, type: BiquadFilterType, f: number, q = 1, rate = 1) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = rate;
    const bq = ctx.createBiquadFilter();
    bq.type = type;
    bq.frequency.value = f;
    bq.Q.value = q;
    const g = this.env(t, gain, 0.002, dur);
    src.connect(bq).connect(g);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
    return bq;
  }

  private click(t: number, f: number, gain: number, dur = 0.02) {
    this.burst(t, dur, gain, "bandpass", f, 2.5);
  }

  /** A service bell: a bright, slightly out-of-tune brass ring. */
  private bell(t: number) {
    const f = 2093;
    const partials: [number, number, number][] = [
      [1, 0.22, 2.4],
      [2.02, 0.06, 1.4],
      [2.76, 0.07, 1.1],
      [5.4, 0.03, 0.5],
    ];
    for (const [m, g, d] of partials) {
      this.tone(t, f * m, d, g, "sine");
      this.tone(t, f * m * 1.003, d * 0.9, g * 0.5, "sine");
    }
    this.click(t, 5000, 0.2, 0.01);
  }

  /** The ticket printer: a motor and a ratchet. */
  private print(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = 96;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.05);
    g.gain.setValueAtTime(0.05, t + 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    o.connect(lp).connect(g).connect(this.out!);
    o.start(t);
    o.stop(t + 0.9);
    for (let k = 0; k < 18; k++) this.click(t + 0.04 + k * 0.042, 2400 + (k % 3) * 400, 0.18, 0.012);
  }

  private punch(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    o.connect(this.env(t, 0.4, 0.002, 0.14));
    o.start(t);
    o.stop(t + 0.2);
    this.click(t, 3800, 0.45, 0.018);
    this.click(t + 0.03, 1500, 0.2, 0.03);
  }

  /** Paper tearing along a perforation: a run of tiny rips. */
  private tear(t: number) {
    for (let k = 0; k < 14; k++) {
      const at = t + k * 0.022 + Math.random() * 0.01;
      this.burst(at, 0.03, 0.14 + Math.random() * 0.1, "bandpass", 1800 + k * 160 + Math.random() * 600, 1.5);
    }
    this.burst(t, 0.36, 0.05, "highpass", 2500, 0.7);
  }

  private swish(t: number, dur: number, f: number, gain: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const bq = ctx.createBiquadFilter();
    bq.type = "bandpass";
    bq.Q.value = 0.8;
    bq.frequency.setValueAtTime(f * 0.5, t);
    bq.frequency.exponentialRampToValueAtTime(f * 2, t + dur * 0.5);
    bq.frequency.exponentialRampToValueAtTime(f * 0.6, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bq).connect(g).connect(this.out!);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  /** A projector starting up: the claw, faster and faster, and the lamp hum. */
  private projector(t: number) {
    let at = t;
    let gap = 0.11;
    while (at < t + 1.6) {
      this.click(at, 1100, 0.16, 0.015);
      at += gap;
      gap = Math.max(0.042, gap * 0.9);
    }
    this.tone(t + 0.2, 50, 1.4, 0.04, "sawtooth");
  }

  /** A Barcelona pigeon, unimpressed. */
  private coo(t: number) {
    const ctx = this.ctx!;
    const notes: [number, number, number][] = [
      [0, 0.18, 360],
      [0.24, 0.42, 420],
      [0.72, 0.22, 340],
    ];
    for (const [at, d, f] of notes) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f * 0.9, t + at);
      o.frequency.linearRampToValueAtTime(f, t + at + d * 0.3);
      o.frequency.linearRampToValueAtTime(f * 0.85, t + at + d);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 26;
      const lg = ctx.createGain();
      lg.gain.value = 12;
      lfo.connect(lg).connect(o.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + at);
      g.gain.exponentialRampToValueAtTime(0.12, t + at + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      o.connect(lp).connect(g).connect(this.out!);
      o.start(t + at);
      o.stop(t + at + d + 0.05);
      lfo.start(t + at);
      lfo.stop(t + at + d + 0.05);
    }
  }

  private flap(t: number) {
    for (let k = 0; k < 9; k++) this.burst(t + k * 0.075, 0.06, 0.3 * Math.pow(0.82, k), "lowpass", 900, 0.8);
  }
}

export const booth = new BoothSound();
