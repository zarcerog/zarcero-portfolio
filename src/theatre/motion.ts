// Small, dependency-free motion helpers. Everything is a pure function of the
// current beat so the show plays identically forwards and backwards.

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Progress of `t` through [a, b], clamped to 0..1. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export const easeInOut = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

export const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

export const easeIn = (p: number) => p * p * p;

/** A stage-hand's pull: quick start, soft landing with a tiny overshoot. */
export const easeBack = (p: number) => {
  const c1 = 1.35;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

/**
 * In / hold / out envelope: 0 before `a`, rises to 1 by `b`,
 * holds until `c`, falls back to 0 by `d`.
 */
export const envelope = (t: number, a: number, b: number, c: number, d: number) => {
  if (t <= a || t >= d) return 0;
  if (t < b) return easeInOut(seg(t, a, b));
  if (t <= c) return 1;
  return 1 - easeInOut(seg(t, c, d));
};

/**
 * A flown piece of scenery: returns the vertical offset (in %) of something
 * that drops in from the flies over [a, b] and flies out over [c, d].
 * 0 = in position, negative = up in the flies.
 */
export const flyY = (t: number, a: number, b: number, c: number, d: number, away = -115) => {
  if (t <= a) return away;
  if (t < b) return lerp(away, 0, easeBack(seg(t, a, b)));
  if (t <= c) return 0;
  if (t < d) return lerp(0, away, easeIn(seg(t, c, d)));
  return away;
};

/** Damped pendulum swing for things hung on ropes, driven by beats. */
export const swing = (t: number, since: number, amount = 3, freq = 9) => {
  const k = Math.max(0, t - since);
  return amount * Math.exp(-k * 4.2) * Math.sin(k * freq);
};

export const px = (n: number) => `${n.toFixed(2)}px`;
export const pct = (n: number) => `${n.toFixed(3)}%`;
