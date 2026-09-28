// Sample-level recipes: plucked strings, the concert hall's echo, and the
// ambient beds (surf, vinyl, coins…). Pure functions over Float32Arrays,
// no Web Audio, so they can run anywhere and be tested.

/** A small, seedable random generator (mulberry32). */
export function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export interface PluckOpts {
  /** 0 (dull, thumb) … 1 (bright, plectrum) */
  bright: number;
  /** seconds for the fundamental to fall by 60 dB */
  decay: number;
  /** where along the string it is plucked, 0…0.5 */
  pick: number;
  seconds: number;
  seed?: number;
}

/**
 * Karplus–Strong plucked string. Returns the samples and the frequency the
 * delay line actually produces (the integer delay rounds it), so the player
 * can correct the pitch with its playback rate.
 */
export function pluck(sr: number, freq: number, o: PluckOpts) {
  const period = Math.max(2, Math.round(sr / freq - 0.5));
  const actual = sr / (period + 0.5);
  const len = Math.round(sr * o.seconds);
  const out = new Float32Array(len);
  const r = rand(o.seed ?? 7);

  // the excitation: a burst of noise, softened for a duller pluck, with a
  // comb notch for where the string was struck
  const ex = new Float32Array(period);
  let lp = 0;
  const a = 0.08 + o.bright * 0.92;
  for (let i = 0; i < period; i++) {
    lp += a * (r() * 2 - 1 - lp);
    ex[i] = lp;
  }
  const notch = Math.max(1, Math.round(o.pick * period));
  let mean = 0;
  for (let i = 0; i < period; i++) {
    ex[i] = ex[i] - (i >= notch ? ex[i - notch] * 0.9 : 0);
    mean += ex[i];
  }
  mean /= period;
  for (let i = 0; i < period; i++) ex[i] -= mean;

  // loss per round trip so the fundamental dies away in `decay` seconds
  const g = Math.pow(10, -3 / (o.decay * actual));
  for (let n = 0; n < len; n++) {
    if (n < period) out[n] = ex[n];
    else out[n] = g * 0.5 * (out[n - period] + (n - period - 1 >= 0 ? out[n - period - 1] : 0));
  }

  let peak = 0;
  for (let n = 0; n < Math.min(len, period * 6); n++) peak = Math.max(peak, Math.abs(out[n]));
  const k = peak > 0 ? 0.9 / peak : 1;
  const fade = Math.round(sr * 0.04);
  for (let n = 0; n < len; n++) {
    out[n] *= k;
    if (n > len - fade) out[n] *= (len - n) / fade;
  }
  return { data: out, freq: actual };
}

/** A stereo impulse response for a small, warm theatre: 1.6 s, darkening as it dies. */
export function hall(sr: number, seconds = 1.6, seed = 3): [Float32Array, Float32Array] {
  const len = Math.round(sr * seconds);
  const pre = Math.round(sr * 0.012);
  const chans: [Float32Array, Float32Array] = [new Float32Array(len), new Float32Array(len)];
  chans.forEach((ch, c) => {
    const r = rand(seed + c * 101);
    let lp = 0;
    for (let n = pre; n < len; n++) {
      const t = (n - pre) / sr;
      const env = Math.pow(1 - (n - pre) / (len - pre), 2.2) * Math.exp(-t * 2.2);
      // the tail loses its treble faster than its bass
      const cut = 0.9 - 0.75 * Math.min(1, t / seconds);
      lp += cut * (r() * 2 - 1 - lp);
      ch[n] = lp * env * 0.5;
    }
    // a couple of early reflections off the proscenium
    ch[pre + Math.round(sr * (0.011 + c * 0.004))] += 0.35;
    ch[pre + Math.round(sr * (0.023 + c * 0.006))] += 0.22;
  });
  return chans;
}

/** White noise, for the percussion and effects to cut shapes out of. */
export function whiteNoise(sr: number, seconds = 2, seed = 11) {
  const r = rand(seed);
  const out = new Float32Array(Math.round(sr * seconds));
  for (let i = 0; i < out.length; i++) out[i] = r() * 2 - 1;
  return out;
}

type Stereo = [Float32Array, Float32Array];
const stereo = (len: number): Stereo => [new Float32Array(len), new Float32Array(len)];

/** Add a short event into a looping buffer (wrapping at the end, so the loop has no seam). */
function stamp(buf: Stereo, at: number, samples: Float32Array, pan: number, gain: number) {
  const len = buf[0].length;
  const l = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const r = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < samples.length; i++) {
    const j = (at + i) % len;
    buf[0][j] += samples[i] * l;
    buf[1][j] += samples[i] * r;
  }
}

/** Surf on the Maresme: brown noise breathing in slow swells. */
export function surf(sr: number, seconds = 8, seed = 21): Stereo {
  const len = Math.round(sr * seconds);
  const out = stereo(len);
  for (let c = 0; c < 2; c++) {
    const r = rand(seed + c);
    let b = 0;
    let lp = 0;
    for (let n = 0; n < len; n++) {
      b = (b + 0.02 * (r() * 2 - 1)) * 0.998;
      const t = n / len;
      // two waves per loop, one bigger than the other, a little apart in each ear
      const ph = t * 2 + c * 0.08;
      const swell = Math.pow(Math.sin(Math.PI * ph) ** 2, 1.6) * (Math.floor(ph) % 2 ? 0.65 : 1);
      const hiss = r() * 2 - 1;
      lp += 0.12 * (hiss - lp);
      out[c][n] = b * 6 * (0.25 + swell) + lp * 0.35 * swell;
    }
  }
  return out;
}

/** The surface noise of a record: sparse crackle over a faint hiss. */
export function crackle(sr: number, seconds = 4, seed = 31): Stereo {
  const len = Math.round(sr * seconds);
  const out = stereo(len);
  const r = rand(seed);
  for (let n = 0; n < len; n++) {
    const h = (r() * 2 - 1) * 0.012;
    out[0][n] += h;
    out[1][n] += h;
  }
  const pops = Math.round(seconds * 26);
  for (let i = 0; i < pops; i++) {
    const size = 2 + Math.floor(r() * 30);
    const click = new Float32Array(size);
    const amp = Math.pow(r(), 3) * 0.9 + 0.05;
    for (let k = 0; k < size; k++) click[k] = (r() * 2 - 1) * amp * Math.exp(-k / (size * 0.3));
    stamp(out, Math.floor(r() * len), click, (r() - 0.5) * 0.4, 1);
  }
  return out;
}

/** Coins raining in the bank: small bright pings. */
export function coins(sr: number, seconds = 4, seed = 51): Stereo {
  const len = Math.round(sr * seconds);
  const out = stereo(len);
  const r = rand(seed);
  const n = Math.round(seconds * 9);
  for (let i = 0; i < n; i++) {
    const f1 = 3200 + r() * 3600;
    const f2 = f1 * (1.47 + r() * 0.2);
    const size = Math.round(sr * 0.14);
    const s = new Float32Array(size);
    for (let k = 0; k < size; k++) {
      const t = k / sr;
      s[k] = (Math.sin(2 * Math.PI * f1 * t) + 0.5 * Math.sin(2 * Math.PI * f2 * t)) * Math.exp(-t * (28 + r() * 10));
    }
    // a coin often lands twice
    const at = Math.floor(r() * len);
    const pan = r() * 1.6 - 0.8;
    stamp(out, at, s, pan, 0.12 + r() * 0.1);
    if (r() < 0.5) stamp(out, at + Math.round(sr * (0.05 + r() * 0.06)), s, pan, 0.06);
  }
  return out;
}

/** A film projector: the sprocket's clatter at 24 frames a second over the motor. */
export function projector(sr: number, seconds = 2, seed = 61): Stereo {
  const len = Math.round(sr * seconds);
  const out = stereo(len);
  const r = rand(seed);
  for (let n = 0; n < len; n++) {
    const t = n / sr;
    const hum = Math.sin(2 * Math.PI * 100 * t) * 0.02 + Math.sin(2 * Math.PI * 200 * t) * 0.008;
    out[0][n] += hum;
    out[1][n] += hum;
  }
  const frames = Math.round(seconds * 24);
  for (let i = 0; i < frames; i++) {
    const size = Math.round(sr * 0.012);
    const c = new Float32Array(size);
    let lp = 0;
    for (let k = 0; k < size; k++) {
      lp += 0.5 * (r() * 2 - 1 - lp);
      c[k] = lp * Math.exp(-k / (size * 0.2));
    }
    stamp(out, Math.round((i / frames) * len), c, 0.1, i % 2 ? 0.14 : 0.24);
  }
  return out;
}

/** Three wall clocks (Sofia, Madrid, Stockholm), none quite in step with the others. */
export function clocks(sr: number, seconds = 2, seed = 71): Stereo {
  const len = Math.round(sr * seconds);
  const out = stereo(len);
  const r = rand(seed);
  const tick = (f: number) => {
    const size = Math.round(sr * 0.03);
    const s = new Float32Array(size);
    for (let k = 0; k < size; k++) {
      const t = k / sr;
      s[k] = (Math.sin(2 * Math.PI * f * t) * 0.6 + (r() * 2 - 1) * 0.4) * Math.exp(-t * 180);
    }
    return s;
  };
  [
    { off: 0, f: 2600, pan: -0.6, g: 0.3 },
    { off: 0.31, f: 3300, pan: 0, g: 0.22 },
    { off: 0.67, f: 2100, pan: 0.6, g: 0.26 },
  ].forEach((c) => {
    for (let k = 0; k < seconds; k++) {
      // tick, then a slightly lower tock
      stamp(out, Math.round((c.off + k) * sr) % len, tick(k % 2 ? c.f * 0.84 : c.f), c.pan, c.g);
    }
  });
  return out;
}
