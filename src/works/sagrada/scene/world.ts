// The per-frame state of the world, computed once and read by every set piece.

import * as THREE from "three";

import { LIGHT, SHOTS, yearAt, type CamKey, type LightKey } from "../script";

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const smooth = (p: number) => p * p * (3 - 2 * p);
export const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
export const easeIn = (p: number) => p * p * p;
export const env = (t: number, a: number, b: number, c: number, d: number) =>
  t <= a || t >= d ? 0 : t < b ? easeInOut(seg(t, a, b)) : t <= c ? 1 : 1 - easeInOut(seg(t, c, d));
/** 0 → 1 over [a, b] (eased) */
export const ramp = (t: number, a: number, b: number) => easeInOut(seg(t, a, b));
/** construction progress of a piece for the current year */
export const built = (year: number, span: readonly [number, number]) => seg(year, span[0], span[1]);

export interface Light {
  zenith: THREE.Color;
  horizon: THREE.Color;
  sunDir: THREE.Vector3;
  sun: THREE.Color;
  sunI: number;
  sky: THREE.Color;
  ground: THREE.Color;
  hemiI: number;
  fog: THREE.Color;
  fogD: number;
  night: number;
  sepia: number;
  exposure: number;
}

function blank(): Light {
  return {
    zenith: new THREE.Color(),
    horizon: new THREE.Color(),
    sunDir: new THREE.Vector3(),
    sun: new THREE.Color(),
    sunI: 1,
    sky: new THREE.Color(),
    ground: new THREE.Color(),
    hemiI: 1,
    fog: new THREE.Color(),
    fogD: 0.002,
    night: 0,
    sepia: 0,
    exposure: 1,
  };
}

/** Everything shared: the beat, the year, the light and a free-running clock. */
export const W = {
  t: 0,
  year: 1881,
  /** seconds, free running (waves, wings, smoke, fireworks) */
  time: 0,
  light: blank(),
  /** a flash from the fireworks, 0..~2, and its colour */
  flash: 0,
  flashColor: new THREE.Color("#ffd9a0"),
};

const _a = new THREE.Color();
const _b = new THREE.Color();
const cache = new Map<string, THREE.Color>();
function col(hex: string) {
  let c = cache.get(hex);
  if (!c) {
    c = new THREE.Color(hex);
    cache.set(hex, c);
  }
  return c;
}

function mixColor(out: THREE.Color, a: string, b: string, p: number) {
  _a.copy(col(a));
  _b.copy(col(b));
  out.copy(_a).lerp(_b, p);
}

function sunVector(out: THREE.Vector3, elev: number, azim: number) {
  const e = (elev * Math.PI) / 180;
  const z = (azim * Math.PI) / 180;
  out.set(Math.sin(z) * Math.cos(e), Math.sin(e), Math.cos(z) * Math.cos(e)).normalize();
}

const _v = new THREE.Vector3();

export function sampleLight(t: number, out: Light) {
  let i = 0;
  while (i < LIGHT.length - 2 && t > LIGHT[i + 1].at) i++;
  const a: LightKey = LIGHT[i];
  const b: LightKey = LIGHT[i + 1];
  const p = smooth(seg(t, a.at, b.at));
  mixColor(out.zenith, a.zenith, b.zenith, p);
  mixColor(out.horizon, a.horizon, b.horizon, p);
  mixColor(out.sun, a.sun, b.sun, p);
  mixColor(out.sky, a.sky, b.sky, p);
  mixColor(out.ground, a.ground, b.ground, p);
  mixColor(out.fog, a.fog, b.fog, p);
  sunVector(out.sunDir, a.elev, a.azim);
  sunVector(_v, b.elev, b.azim);
  out.sunDir.lerp(_v, p).normalize();
  out.sunI = lerp(a.sunI, b.sunI, p);
  out.hemiI = lerp(a.hemiI, b.hemiI, p);
  out.fogD = lerp(a.fogD, b.fogD, p);
  out.night = lerp(a.night, b.night, p);
  out.sepia = lerp(a.sepia, b.sepia, p);
  out.exposure = lerp(a.exposure, b.exposure, p);
}

export function updateWorld(t: number, dt: number) {
  W.t = t;
  W.year = yearAt(t);
  W.time += Math.min(dt, 0.1);
  sampleLight(t, W.light);
}

// ---------------------------------------------------------------------------
// Camera sampling: Catmull-Rom through the keys of each shot.
// ---------------------------------------------------------------------------

interface BuiltShot {
  from: number;
  to: number;
  keys: CamKey[];
  pos: THREE.CatmullRomCurve3;
  look: THREE.CatmullRomCurve3;
}

const built_: BuiltShot[] = SHOTS.map((s) => ({
  from: s.keys[0].at,
  to: s.keys[s.keys.length - 1].at,
  keys: s.keys,
  pos: new THREE.CatmullRomCurve3(s.keys.map((q) => new THREE.Vector3(...q.pos)), false, "centripetal", 0.5),
  look: new THREE.CatmullRomCurve3(s.keys.map((q) => new THREE.Vector3(...q.look)), false, "centripetal", 0.5),
}));

export function sampleCamera(t: number, pos: THREE.Vector3, look: THREE.Vector3) {
  let s = built_[0];
  for (const b of built_) if (t >= b.from - 0.001) s = b;
  const keys = s.keys;
  const n = keys.length;
  let i = 0;
  while (i < n - 2 && t > keys[i + 1].at) i++;
  const a = keys[i];
  const b = keys[i + 1];
  let f = seg(t, a.at, b.at);
  // soften the start and end of each shot; constant pace in between
  if (i === 0 && n > 2) f = f * f * (2 - f) * 0.5 + f * 0.5;
  if (i === n - 2) f = easeOut(f) * 0.6 + f * 0.4;
  if (n === 2) f = easeInOut(f);
  const u = (i + f) / (n - 1);
  s.pos.getPoint(u, pos);
  s.look.getPoint(u, look);
  const fa = a.fov ?? 40;
  const fb = b.fov ?? fa;
  return lerp(fa, fb, smooth(f));
}


/**
 * Write a property of a memoised three.js object. A function call, so that
 * frame loops may animate materials and uniforms without the React compiler
 * mistaking it for mutating render state.
 */
export function put<T extends object, K extends keyof T>(o: T, k: K, v: T[K]) {
  o[k] = v;
}
