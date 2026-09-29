// Mr Cerdà's plan: the grid of the Eixample, and the year each block is built.
// One unit is ten metres. The basilica's block sits at the origin; the camera
// looks south-west from the Nativity side (+z), towards Montjuïc.

import * as THREE from "three";

import { rng } from "@/stage3d/lib/canvas";

/** block pitch: a 113 m block plus a 20 m street */
export const P = 13.3;
/** half a block */
export const B = 5.65;
/** the chamfer ("xamfrà") cut off each corner */
export const CH = 1.6;
/** how many cells the birth map covers in each direction */
export const G = 24;
export const N = G * 2 + 1;
/** how far out real buildings are modelled (beyond that the ground paints them) */
export const REACH = 7;

/** never built on: the basilica, and the two squares either side of it */
export const isSpecial = (i: number, j: number) => i === 0 && (j === 0 || j === 1 || j === -1);

/** Where the city comes from: roughly the direction of the old town. */
const ORIGIN = new THREE.Vector2(-40, -150);

const births: Float32Array = (() => {
  const out = new Float32Array(N * N);
  const r = rng(1897);
  for (let j = -G; j <= G; j++) {
    for (let i = -G; i <= G; i++) {
      const x = i * P;
      const z = j * P;
      const d = Math.hypot(x - ORIGIN.x, z - ORIGIN.y);
      let y = 1862 + d * 0.26 + r() * 16 - 4;
      // the mountain side filled in later
      y += Math.max(0, x) * 0.03;
      // a few stubborn plots held out for decades
      if (r() < 0.06) y += 18 + r() * 20;
      if (isSpecial(i, j)) y = 9999;
      out[(j + G) * N + (i + G)] = Math.min(1990, y);
    }
  }
  // the blocks right round the site: built up between the wars, one by one
  const near: [number, number, number][] = [
    [-1, 0, 1911],
    [1, 0, 1916],
    [-1, 1, 1921],
    [1, 1, 1907],
    [-1, -1, 1904],
    [1, -1, 1913],
    [0, 2, 1928],
    [0, -2, 1909],
    [-2, 0, 1918],
    [2, 0, 1924],
  ];
  for (const [i, j, y] of near) out[(j + G) * N + (i + G)] = y;
  return out;
})();

export function birth(i: number, j: number) {
  if (Math.abs(i) > G || Math.abs(j) > G) return 2100;
  return births[(j + G) * N + (i + G)];
}

/** The same map as a texture, for the ground shader (years since 1850, in bytes). */
export function birthTexture() {
  const data = new Uint8Array(N * N * 4);
  for (let k = 0; k < N * N; k++) {
    const v = Math.max(0, Math.min(255, Math.round(births[k] - 1850)));
    data[k * 4] = v;
    data[k * 4 + 1] = 0;
    data[k * 4 + 2] = 0;
    data[k * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

export const cellOf = (x: number, z: number) => [Math.round(x / P), Math.round(z / P)] as const;

/** Is the point inside a block (not in a street)? */
export function inBlock(x: number, z: number) {
  const [i, j] = cellOf(x, z);
  const lx = Math.abs(x - i * P);
  const lz = Math.abs(z - j * P);
  return lx < B && lz < B && lx + lz < 2 * B - CH;
}

/** The coast: the sea lies at x < coastX(z). */
export const coastX = (z: number) => -150 - 0.225 * (z - 100);

/** The chamfered block outline (for extrusion). */
export function blockShape(half = B, ch = CH) {
  const s = new THREE.Shape();
  const h = half;
  const c = ch;
  s.moveTo(-h + c, -h);
  s.lineTo(h - c, -h);
  s.lineTo(h, -h + c);
  s.lineTo(h, h - c);
  s.lineTo(h - c, h);
  s.lineTo(-h + c, h);
  s.lineTo(-h, h - c);
  s.lineTo(-h, -h + c);
  s.closePath();
  return s;
}
