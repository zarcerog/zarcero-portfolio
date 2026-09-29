import { describe, expect, it } from "vitest";

import { BOARD, buildCatenary, gather, harden, TOWERS } from "./catenary";
import { RopeSim } from "./rope";

const OPTS = { gravity: 26, damping: 0.97, iterations: 30, substeps: 2 };

/** A chain of n links between two pins, a given distance apart. */
function chain(n: number, span: number, slack: number) {
  const links: [number, number, number][] = [];
  for (let i = 0; i < n; i++) links.push([i, i + 1, (span * slack) / n]);
  const sim = new RopeSim(n + 1, links);
  for (let i = 0; i <= n; i++) sim.set(i, (i / n) * span, 0, 0);
  sim.inv[0] = sim.inv[n] = 0;
  return sim;
}

describe("rope", () => {
  it("hangs a chain in a symmetric sag, pins fixed, lengths kept", () => {
    const sim = chain(20, 4, 1.4);
    for (let k = 0; k < 600; k++) sim.step(1 / 60, OPTS);
    const y = (i: number) => sim.pos[i * 3 + 1];
    expect(sim.pos[0]).toBe(0);
    expect(y(0)).toBe(0);
    expect(sim.pos[20 * 3]).toBeCloseTo(4, 6);
    // lowest in the middle, mirror-symmetric
    const mid = y(10);
    for (let i = 0; i <= 20; i++) expect(y(i)).toBeGreaterThanOrEqual(mid - 1e-3);
    for (let i = 0; i <= 10; i++) expect(y(i)).toBeCloseTo(y(20 - i), 2);
    expect(sim.stretch()).toBeLessThan(0.01);
    // and still
    expect(sim.maxSpeed(1 / 120)).toBeLessThan(0.05);
  });

  it("is string, not wire: it never pushes", () => {
    const sim = new RopeSim(2, [[0, 1, 1]]);
    sim.set(0, 0, 0, 0);
    sim.set(1, 0.2, 0, 0);
    sim.inv[0] = 0;
    sim.step(1 / 60, { ...OPTS, gravity: 0 });
    expect(sim.pos[3]).toBeCloseTo(0.2, 6);
  });

  it("gets out of the way of a hand", () => {
    const sim = new RopeSim(1, []);
    sim.set(0, 0, 0, 0);
    // a ray along z, passing 0.1 to the side
    const hit = sim.push(0.1, 0, -5, 0, 0, 1, 0.5);
    expect(hit).toBeGreaterThan(0.5);
    expect(sim.pos[0]).toBeLessThan(-0.05);
  });
});

describe("Gaudí's model", () => {
  const m = buildCatenary(12);

  it("finds a still shape with true string lengths", () => {
    expect(m.sim.stretch()).toBeLessThan(0.01);
    expect(m.rest.length).toBe(m.sim.n * 3);
  });

  it("hangs close to the towers it was drawn from, without being told their shape", () => {
    // the central tower: its strings, halfway down, stay near the designed profile
    const [x, zr, R, H] = TOWERS[13];
    const base = 13 * (2 + 8 * 12);
    const i = base + 2 + 5; // first string, ~halfway
    const px = m.rest[i * 3];
    const py = m.rest[i * 3 + 1];
    const pz = m.rest[i * 3 + 2];
    const u = (BOARD - py) / H;
    const design = R * 1.1 * Math.pow(1 - Math.pow(u, 2.2), 0.55);
    expect(Math.hypot(px - x, pz + zr)).toBeGreaterThan(design * 0.8);
    expect(Math.hypot(px - x, pz + zr)).toBeLessThan(design * 1.1);
  });

  it("can be gathered up, let down, and hardened back into shape", () => {
    gather(m);
    const fresh = m.sim.pos.slice();
    for (let k = 0; k < 30; k++) m.sim.step(1 / 60, m.opts);
    // it fell
    let dropped = 0;
    for (let i = 1; i < m.sim.n * 3; i += 3) dropped = Math.max(dropped, fresh[i] - m.sim.pos[i]);
    expect(dropped).toBeGreaterThan(3);
    for (let k = 0; k < 60; k++) harden(m, 0.3);
    let err = 0;
    for (let i = 0; i < m.sim.n * 3; i++) err = Math.max(err, Math.abs(m.sim.pos[i] - m.rest[i]));
    expect(err).toBeLessThan(1e-3);
  });
});
