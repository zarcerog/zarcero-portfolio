// Gaudí's hanging model, as a rope simulation. A board overhead; from it, for
// every tower, a ring of strings gathered at the bottom on one heavy sack,
// with a little sack of shot part-way down each; and between the towers,
// loose chains that sag into arches. Nothing here is shaped by hand: the
// strings are only given their lengths, and gravity does the arithmetic.

import { RopeSim, type RopeOpts } from "./rope";

/** [x, z, R, H] of each tower, as built (the model hangs mirrored in z). */
export const TOWERS: [number, number, number, number][] = [
  [-2.15, 3.6, 0.4, 9.8],
  [-0.8, 3.6, 0.44, 10.7],
  [0.8, 3.6, 0.44, 10.7],
  [2.15, 3.6, 0.4, 9.8],
  [-2.15, -3.3, 0.4, 10.7],
  [-0.8, -3.3, 0.44, 11.2],
  [0.8, -3.3, 0.44, 11.2],
  [2.15, -3.3, 0.4, 10.7],
  [-1.25, 1.25, 0.56, 13.5],
  [1.25, 1.25, 0.56, 13.5],
  [-1.25, -1.25, 0.56, 13.5],
  [1.25, -1.25, 0.56, 13.5],
  [1.95, -0.35, 0.72, 13.8],
  [0, 0, 1.08, 17.25],
];

/** Chains between towers (indices into TOWERS): the arches of the nave and crossing. */
const ARCHES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [4, 5],
  [5, 6],
  [6, 7],
  [8, 9],
  [9, 11],
  [11, 10],
  [10, 8],
  [13, 8],
  [13, 9],
  [13, 10],
  [13, 11],
  [13, 12],
];

export const BOARD = 18.5;
const STRINGS = 8;

export interface Sack {
  i: number;
  size: number;
}

export interface CatenaryModel {
  sim: RopeSim;
  sacks: Sack[];
  /** where each free particle starts when the strings are let down */
  gathered: Float32Array;
  /** the shape it hangs in once still: what the curves harden into when turned over */
  rest: Float32Array;
  /** the hanging shape it settles into, for tests and a warm start */
  opts: RopeOpts;
  towers: number;
}

// masses: waxed cord is light; the shot is not
const M_CORD = 0.06;
const M_SACK = 0.5;
const M_KNOT = 0.25;
const M_WEIGHT = 1.1;

export function buildCatenary(segments = 16): CatenaryModel {
  const pts: [number, number, number, number][] = []; // x, y, z, mass (0 = pinned)
  const links: [number, number, number][] = [];
  const sacks: Sack[] = [];
  const add = (x: number, y: number, z: number, m: number) => pts.push([x, y, z, m]) - 1;
  const dist = (a: number, b: number) => Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1], pts[a][2] - pts[b][2]);

  for (const [x, zReal, R, H] of TOWERS) {
    const z = -zReal;
    // the strings meet on a knot under the tower's centre, and a sack hangs from it
    const knot = add(x, BOARD - H, z, M_KNOT);
    const weight = add(x, BOARD - H - 0.3, z, M_WEIGHT);
    links.push([knot, weight, 0.3]);
    sacks.push({ i: weight, size: 1.5 + R * 0.6 });
    // each string's length follows the designed profile; its hang is up to physics
    const prof = (u: number) => R * 1.1 * Math.pow(Math.max(0, 1 - Math.pow(u, 2.2)), 0.55);
    for (let k = 0; k < STRINGS; k++) {
      const a = (k / STRINGS) * Math.PI * 2;
      const at = (u: number): [number, number, number] => [x + Math.cos(a) * prof(u), BOARD - u * H, z + Math.sin(a) * prof(u)];
      let prev = add(...at(0), 0);
      const mid = Math.round(segments * 0.55);
      for (let s = 1; s < segments; s++) {
        const heavy = s === mid;
        const cur = add(...at(s / segments), heavy ? M_SACK : M_CORD);
        links.push([prev, cur, dist(prev, cur)]);
        if (heavy) sacks.push({ i: cur, size: 1 });
        prev = cur;
      }
      links.push([prev, knot, dist(prev, knot)]);
    }
  }

  // the arches: pinned at both ends, a third longer than the gap, so they sag
  const ARCH_SEG = Math.max(8, Math.round(segments * 0.8));
  const archFrom = pts.length;
  for (const [ia, ib] of ARCHES) {
    const [xa, za] = [TOWERS[ia][0], -TOWERS[ia][1]];
    const [xb, zb] = [TOWERS[ib][0], -TOWERS[ib][1]];
    const span = Math.hypot(xb - xa, zb - za);
    const len = span * 1.45;
    let prev = add(xa, BOARD, za, 0);
    for (let s = 1; s <= ARCH_SEG; s++) {
      const u = s / ARCH_SEG;
      const last = s === ARCH_SEG;
      const heavy = s === Math.floor(ARCH_SEG / 2);
      const cur = add(xa + (xb - xa) * u, BOARD - Math.sin(u * Math.PI) * span * 0.55, za + (zb - za) * u, last ? 0 : heavy ? M_SACK * 0.6 : M_CORD);
      links.push([prev, cur, len / ARCH_SEG]);
      if (heavy) sacks.push({ i: cur, size: 0.75 });
      prev = cur;
    }
  }

  const sim = new RopeSim(pts.length, links);
  pts.forEach(([x, y, z, m], i) => {
    sim.set(i, x, y, z);
    sim.inv[i] = m === 0 ? 0 : 1 / m;
  });

  // gathered up under the board, ready to be let down: every free particle
  // bunched just below where its string is tied
  const gathered = new Float32Array(pts.length * 3);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.12;
  for (let i = 0; i < pts.length; i++) {
    gathered[i * 3] = pts[i][0];
    gathered[i * 3 + 1] = pts[i][1];
    gathered[i * 3 + 2] = pts[i][2];
  }
  // strings: follow each link from its pinned end, so every free particle sits
  // just under its predecessor (twice round, for the knots and their sacks)
  for (let pass = 0; pass < 2; pass++)
    for (const [a, b] of links) {
      if (sim.inv[b] === 0 || b >= archFrom) continue;
      gathered[b * 3] = gathered[a * 3] + rnd();
      gathered[b * 3 + 1] = Math.max(BOARD - 0.6, gathered[a * 3 + 1] - 0.03);
      gathered[b * 3 + 2] = gathered[a * 3 + 2] + rnd();
    }
  // arches: pulled straight between their pins, just under the board
  for (const [a, b] of links) {
    if (b < archFrom || sim.inv[b] === 0) continue;
    gathered[b * 3 + 1] = BOARD - 0.08;
    void a;
  }

  const model: CatenaryModel = {
    sim,
    sacks,
    gathered,
    rest: new Float32Array(0),
    towers: TOWERS.length,
    opts: { gravity: 26, damping: 0.993, iterations: 14, substeps: 2 },
  };
  // find the still shape once, quickly (heavily damped), from the designed one
  settle(model, 1.6, 1 / 30, 0.8);
  // then small steps, so the strings pull back to their true lengths
  settle(model, 0.35, 1 / 150, 0.8);
  model.rest = sim.pos.slice();
  return model;
}

/** Ease every free particle toward the still shape by `k` (0…1), and stop it moving. */
export function harden(m: CatenaryModel, k: number) {
  const { sim, rest } = m;
  const P = sim.pos;
  for (let i = 0; i < sim.n * 3; i++) {
    P[i] += (rest[i] - P[i]) * k;
    sim.prev[i] += (P[i] - sim.prev[i]) * k;
  }
}

/** Put every free particle back up under the board, at rest. */
export function gather(m: CatenaryModel) {
  const { sim, gathered } = m;
  for (let i = 0; i < sim.n; i++) {
    if (sim.inv[i] === 0) continue;
    sim.set(i, gathered[i * 3], gathered[i * 3 + 1], gathered[i * 3 + 2]);
  }
}

/** Run the model until it hangs still (for a warm start, and for the tests). */
export function settle(m: CatenaryModel, seconds = 8, dt = 1 / 60, damping = 0.96) {
  const o = { ...m.opts, damping, substeps: 1 };
  for (let t = 0; t < seconds; t += dt) m.sim.step(dt, o);
}
