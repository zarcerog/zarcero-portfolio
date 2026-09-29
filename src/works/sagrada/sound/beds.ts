// Ambient beds for the film, rendered once into seamless stereo loops:
// wind over the sky, cicadas in the Poblet, masons at their stone, the city
// of 1926, the fire, the modern street, and 120,000 people. Pure functions
// over Float32Arrays, like the theatre's dsp.

import { rand } from "@/theatre/sound/dsp";

type Stereo = [Float32Array, Float32Array];
const stereo = (len: number): Stereo => [new Float32Array(len), new Float32Array(len)];

/** Add a short event into a loop, wrapping at the end so there's no seam. */
function stamp(buf: Stereo, at: number, s: Float32Array, pan: number, gain: number) {
  const len = buf[0].length;
  const l = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const r = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < s.length; i++) {
    const j = (((at + i) % len) + len) % len;
    buf[0][j] += s[i] * l;
    buf[1][j] += s[i] * r;
  }
}

/** A loop-friendly slow modulation: `n` whole cycles per loop. */
const slow = (t: number, n: number, ph = 0) => 0.5 + 0.5 * Math.sin(2 * Math.PI * (t * n + ph));

/** Wind high over the city: gusting, whistling a little in the gaps. */
export function wind(sr: number, seconds = 10, seed = 101): Stereo {
  const len = Math.round(sr * seconds);
  const out = stereo(len);
  for (let c = 0; c < 2; c++) {
    const r = rand(seed + c);
    let b = 0;
    let lp = 0;
    let bp1 = 0;
    let bp2 = 0;
    for (let n = 0; n < len; n++) {
      const t = n / len;
      const gust = 0.35 + 0.65 * Math.pow(slow(t, 2, c * 0.1) * slow(t, 3, 0.3 + c * 0.05), 1.3);
      const w = r() * 2 - 1;
      b = (b + 0.02 * w) * 0.997;
      lp += (0.02 + 0.05 * gust) * (w - lp);
      // a resonant whistle that rises with the gusts (a crude two-pole bandpass)
      const f = 0.02 + 0.03 * gust;
      bp1 += f * (w - bp1 - bp2 * 0.6);
      bp2 += f * bp1;
      out[c][n] = (b * 4 + lp * 0.9) * gust + bp2 * 0.05 * gust * gust;
    }
  }
  return out;
}

/** A summer afternoon in the fields: cicadas in waves, a few birds. */
export function countryside(sr: number, seconds = 8, seed = 111): Stereo {
  const len = Math.round(sr * seconds);
  const out = stereo(len);
  const r = rand(seed);
  // cicadas: bright noise, pulsing, swelling and fading in each ear
  for (let c = 0; c < 2; c++) {
    let hp = 0;
    let prev = 0;
    for (let n = 0; n < len; n++) {
      const t = n / len;
      const w = r() * 2 - 1;
      hp = 0.6 * (hp + w - prev);
      prev = w;
      const pulse = 0.55 + 0.45 * Math.sin((2 * Math.PI * n * 46) / sr);
      const swell = Math.pow(slow(t, 1, c * 0.45), 2.2);
      out[c][n] += hp * 0.05 * pulse * (0.15 + swell);
    }
  }
  // birds: little chirps, two or three notes at a time
  const chirps = Math.round(seconds * 2.2);
  for (let i = 0; i < chirps; i++) {
    const f0 = 2600 + r() * 2200;
    const notes = 2 + Math.floor(r() * 3);
    const pan = r() * 1.6 - 0.8;
    let at = Math.floor(r() * len);
    for (let k = 0; k < notes; k++) {
      const size = Math.round(sr * (0.05 + r() * 0.05));
      const s = new Float32Array(size);
      const f1 = f0 * (1 + (r() - 0.3) * 0.25);
      let ph = 0;
      for (let j = 0; j < size; j++) {
        const u = j / size;
        ph += (2 * Math.PI * (f1 * (1 + 0.25 * Math.sin(Math.PI * u)))) / sr;
        s[j] = Math.sin(ph) * Math.sin(Math.PI * u);
      }
      stamp(out, at, s, pan, 0.05 + r() * 0.04);
      at += size + Math.round(sr * (0.03 + r() * 0.06));
    }
  }
  return out;
}

/** Masons dressing stone: chisels ringing, a mallet now and then. */
export function masons(sr: number, seconds = 6, seed = 121): Stereo {
  const len = Math.round(sr * seconds);
  const out = stereo(len);
  const r = rand(seed);
  // a faint breeze under it
  for (let c = 0; c < 2; c++) {
    let lp = 0;
    for (let n = 0; n < len; n++) {
      lp += 0.03 * (r() * 2 - 1 - lp);
      out[c][n] += lp * 0.35;
    }
  }
  const workers = [
    { pan: -0.6, f: 3100, every: 0.52 },
    { pan: 0.35, f: 2500, every: 0.71 },
    { pan: 0.75, f: 3600, every: 0.44 },
  ];
  for (const w of workers) {
    let t = r() * w.every;
    while (t < seconds) {
      const size = Math.round(sr * 0.09);
      const s = new Float32Array(size);
      const f = w.f * (0.96 + r() * 0.08);
      for (let j = 0; j < size; j++) {
        const u = j / sr;
        s[j] = (Math.sin(2 * Math.PI * f * u) * 0.6 + Math.sin(2 * Math.PI * f * 1.51 * u) * 0.3 + (r() * 2 - 1) * 0.5 * Math.exp(-u * 400)) * Math.exp(-u * 60);
      }
      stamp(out, Math.round(t * sr), s, w.pan, 0.08 + r() * 0.05);
      t += w.every * (0.8 + r() * 0.5);
    }
  }
  // the mallet
  for (let k = 0; k < Math.round(seconds / 1.7); k++) {
    const size = Math.round(sr * 0.2);
    const s = new Float32Array(size);
    for (let j = 0; j < size; j++) {
      const u = j / sr;
      s[j] = (Math.sin(2 * Math.PI * 110 * u) + (r() * 2 - 1) * 0.6 * Math.exp(-u * 90)) * Math.exp(-u * 26);
    }
    stamp(out, Math.floor(r() * len), s, r() - 0.5, 0.12);
  }
  return out;
}

/** The street in 1926: a murmur, carriage wheels, hooves on cobbles. */
export function street(sr: number, seconds = 8, seed = 131): Stereo {
  const len = Math.round(sr * seconds);
  const out = stereo(len);
  const r = rand(seed);
  for (let c = 0; c < 2; c++) {
    let lp = 0;
    let lp2 = 0;
    for (let n = 0; n < len; n++) {
      const t = n / len;
      lp += 0.06 * (r() * 2 - 1 - lp);
      lp2 += 0.2 * (lp - lp2);
      out[c][n] += lp2 * 0.6 * (0.6 + 0.4 * slow(t, 2, c * 0.2));
    }
  }
  // hooves: a horse trotting past, left to right, twice a loop
  for (const [start, dir] of [
    [0.1, 1],
    [0.6, -1],
  ] as const) {
    const steps = 22;
    for (let k = 0; k < steps; k++) {
      const u = k / (steps - 1);
      const size = Math.round(sr * 0.06);
      const s = new Float32Array(size);
      const f = 420 + r() * 120;
      for (let j = 0; j < size; j++) {
        const x = j / sr;
        s[j] = (Math.sin(2 * Math.PI * f * x) * 0.7 + (r() * 2 - 1) * 0.5) * Math.exp(-x * 90);
      }
      const at = Math.round((start + u * 0.3) * len + (k % 2) * sr * 0.07);
      stamp(out, at, s, dir * (u * 1.6 - 0.8), 0.07 * Math.sin(Math.PI * u) + 0.02);
    }
  }
  return out;
}

/** A building on fire: a roar, and wood snapping. */
export function fire(sr: number, seconds = 5, seed = 141): Stereo {
  const len = Math.round(sr * seconds);
  const out = stereo(len);
  const r = rand(seed);
  for (let c = 0; c < 2; c++) {
    let b = 0;
    let lp = 0;
    for (let n = 0; n < len; n++) {
      const t = n / len;
      const w = r() * 2 - 1;
      b = (b + 0.03 * w) * 0.996;
      lp += 0.08 * (w - lp);
      const flick = 0.6 + 0.4 * slow(t, 7, c * 0.3) * slow(t, 3, 0.2);
      out[c][n] += (b * 5 + lp * 0.5) * flick;
    }
  }
  const pops = Math.round(seconds * 22);
  for (let i = 0; i < pops; i++) {
    const size = 20 + Math.floor(r() * 300);
    const s = new Float32Array(size);
    const amp = Math.pow(r(), 2.5);
    for (let k = 0; k < size; k++) s[k] = (r() * 2 - 1) * amp * Math.exp(-k / (size * 0.25));
    stamp(out, Math.floor(r() * len), s, r() * 1.4 - 0.7, 0.9);
  }
  return out;
}

/** The street today: traffic, a scooter or two, a bus sighing. */
export function traffic(sr: number, seconds = 10, seed = 151): Stereo {
  const len = Math.round(sr * seconds);
  const out = stereo(len);
  const r = rand(seed);
  for (let c = 0; c < 2; c++) {
    let b = 0;
    for (let n = 0; n < len; n++) {
      b = (b + 0.015 * (r() * 2 - 1)) * 0.998;
      out[c][n] += b * 3;
    }
  }
  // cars passing: a filtered whoosh across the stereo field
  for (let k = 0; k < 7; k++) {
    const dur = 2.2 + r() * 1.5;
    const size = Math.round(sr * dur);
    const dir = r() < 0.5 ? -1 : 1;
    const at = Math.floor(r() * len);
    let lp = 0;
    const L = new Float32Array(size);
    const R = new Float32Array(size);
    for (let j = 0; j < size; j++) {
      const u = j / size;
      lp += (0.04 + 0.1 * Math.sin(Math.PI * u)) * (r() * 2 - 1 - lp);
      const a = Math.pow(Math.sin(Math.PI * u), 2) * 0.35;
      const p = dir * (u * 2 - 1);
      L[j] = lp * a * (1 - p) * 0.5;
      R[j] = lp * a * (1 + p) * 0.5;
    }
    for (let j = 0; j < size; j++) {
      const idx = (at + j) % len;
      out[0][idx] += L[j];
      out[1][idx] += R[j];
    }
  }
  // a scooter buzzing by (this is Barcelona)
  for (let k = 0; k < 2; k++) {
    const dur = 2.6;
    const size = Math.round(sr * dur);
    const at = Math.floor(r() * len);
    let ph = 0;
    const s = new Float32Array(size);
    for (let j = 0; j < size; j++) {
      const u = j / size;
      const f = 95 + 40 * u + 8 * Math.sin(u * 40);
      ph += (2 * Math.PI * f) / sr;
      const saw = (ph / Math.PI) % 2 - 1;
      s[j] = saw * Math.pow(Math.sin(Math.PI * u), 2) * 0.12;
    }
    stamp(out, at, s, r() - 0.5, 0.6);
  }
  return out;
}

/** A great crowd on a warm evening: many voices, never a word. */
export function crowd(sr: number, seconds = 8, seed = 161): Stereo {
  const len = Math.round(sr * seconds);
  const out = stereo(len);
  const r = rand(seed);
  // voices: noise shaped by a few formants, each with its own chatter rhythm
  const voices = 14;
  for (let v = 0; v < voices; v++) {
    const f = [520, 780, 1150, 1700][v % 4] * (0.85 + r() * 0.3);
    const rate = 3 + r() * 3;
    const pan = r() * 1.6 - 0.8;
    const s = new Float32Array(len);
    let y1 = 0;
    let y2 = 0;
    const w0 = (2 * Math.PI * f) / sr;
    const q = 6;
    const alpha = Math.sin(w0) / (2 * q);
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha;
    const b0 = alpha;
    const a0 = 1 + alpha;
    let x1 = 0;
    let x2 = 0;
    const cycles = Math.round(rate * seconds);
    for (let n = 0; n < len; n++) {
      const x = r() * 2 - 1;
      const y = (b0 * x - b0 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      const t = n / len;
      const syll = Math.pow(Math.max(0, Math.sin(2 * Math.PI * (t * cycles + v * 0.13))), 2);
      const phrase = slow(t, 1 + (v % 3), v * 0.21);
      s[n] = y * syll * (0.3 + 0.7 * phrase);
    }
    stamp(out, 0, s, pan, 0.5);
  }
  // under it, the rumble of the square
  for (let c = 0; c < 2; c++) {
    let b = 0;
    for (let n = 0; n < len; n++) {
      b = (b + 0.02 * (r() * 2 - 1)) * 0.997;
      out[c][n] += b * 2.5;
    }
  }
  return out;
}
