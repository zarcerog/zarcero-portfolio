// A small rope simulator for Gaudí's string model: Verlet particles joined by
// rope constraints (they resist stretching, never compression — it is string,
// not wire), with pins, gravity, wind, damping and a hand to push them about.
// Pure maths, no three.js: the scene reads `pos` and draws what it finds.

export interface RopeOpts {
  /** units / s², along −y */
  gravity: number;
  /** velocity kept per substep (0…1) */
  damping: number;
  iterations: number;
  substeps: number;
}

export class RopeSim {
  readonly n: number;
  pos: Float32Array;
  prev: Float32Array;
  /** 0 = pinned */
  inv: Float32Array;
  private a: Uint32Array;
  private b: Uint32Array;
  private rest: Float32Array;
  readonly links: number;
  /** external acceleration this step (wind, the model turning over) */
  accel = { x: 0, y: 0, z: 0 };
  /** a per-particle push, set by the scene and cleared after each step */
  wind: ((x: number, y: number, z: number, out: Float32Array) => void) | null = null;
  private tmp = new Float32Array(3);

  constructor(n: number, links: [number, number, number][]) {
    this.n = n;
    this.pos = new Float32Array(n * 3);
    this.prev = new Float32Array(n * 3);
    this.inv = new Float32Array(n).fill(1);
    this.links = links.length;
    this.a = new Uint32Array(links.length);
    this.b = new Uint32Array(links.length);
    this.rest = new Float32Array(links.length);
    links.forEach(([a, b, r], k) => {
      this.a[k] = a;
      this.b[k] = b;
      this.rest[k] = r;
    });
  }

  set(i: number, x: number, y: number, z: number) {
    this.pos[i * 3] = this.prev[i * 3] = x;
    this.pos[i * 3 + 1] = this.prev[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = this.prev[i * 3 + 2] = z;
  }

  linkA(k: number) {
    return this.a[k];
  }
  linkB(k: number) {
    return this.b[k];
  }
  restOf(k: number) {
    return this.rest[k];
  }

  /** Advance by `dt` seconds (clamped: a dropped frame must not explode it). */
  step(dt: number, o: RopeOpts) {
    const h = Math.min(dt, 1 / 30) / o.substeps;
    if (h <= 0) return;
    const { pos, prev, inv, n } = this;
    const h2 = h * h;
    for (let s = 0; s < o.substeps; s++) {
      // integrate
      for (let i = 0; i < n; i++) {
        if (inv[i] === 0) continue;
        const k = i * 3;
        let ax = this.accel.x;
        let ay = this.accel.y - o.gravity;
        let az = this.accel.z;
        if (this.wind) {
          this.wind(pos[k], pos[k + 1], pos[k + 2], this.tmp);
          ax += this.tmp[0];
          ay += this.tmp[1];
          az += this.tmp[2];
        }
        for (let c = 0; c < 3; c++) {
          const p = pos[k + c];
          const v = (p - prev[k + c]) * o.damping;
          prev[k + c] = p;
          pos[k + c] = p + v + (c === 0 ? ax : c === 1 ? ay : az) * h2;
        }
      }
      // satisfy the ropes
      for (let it = 0; it < o.iterations; it++) this.relax();
    }
  }

  private relax() {
    const { pos, inv, a, b, rest } = this;
    for (let k = 0; k < this.links; k++) {
      const i = a[k] * 3;
      const j = b[k] * 3;
      const dx = pos[j] - pos[i];
      const dy = pos[j + 1] - pos[i + 1];
      const dz = pos[j + 2] - pos[i + 2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const r = rest[k];
      // string: only pulls
      if (d <= r || d === 0) continue;
      const wi = inv[a[k]];
      const wj = inv[b[k]];
      const w = wi + wj;
      if (w === 0) continue;
      const f = (d - r) / (d * w);
      pos[i] += dx * f * wi;
      pos[i + 1] += dy * f * wi;
      pos[i + 2] += dz * f * wi;
      pos[j] -= dx * f * wj;
      pos[j + 1] -= dy * f * wj;
      pos[j + 2] -= dz * f * wj;
    }
  }

  /**
   * A hand passing through: particles within `radius` of the ray (origin o,
   * unit direction d) are pushed out of its way, and keep some of the push as
   * velocity. Returns how hard anything was hit (0 = nothing).
   */
  push(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, radius: number, strength = 0.6) {
    const { pos, inv, n } = this;
    let hit = 0;
    for (let i = 0; i < n; i++) {
      if (inv[i] === 0) continue;
      const k = i * 3;
      const px = pos[k] - ox;
      const py = pos[k + 1] - oy;
      const pz = pos[k + 2] - oz;
      const t = px * dx + py * dy + pz * dz;
      if (t < 0) continue;
      // nearest point on the ray, and the way out
      const qx = px - dx * t;
      const qy = py - dy * t;
      const qz = pz - dz * t;
      const d = Math.sqrt(qx * qx + qy * qy + qz * qz);
      if (d >= radius || d < 1e-5) continue;
      const m = ((radius - d) / d) * strength;
      pos[k] += qx * m;
      pos[k + 1] += qy * m;
      pos[k + 2] += qz * m;
      hit = Math.max(hit, (radius - d) / radius);
    }
    return hit;
  }

  /** Largest speed over the last substep of length `h` seconds. */
  maxSpeed(h: number) {
    const { pos, prev, n } = this;
    let m = 0;
    for (let i = 0; i < n * 3; i += 3) {
      const dx = pos[i] - prev[i];
      const dy = pos[i + 1] - prev[i + 1];
      const dz = pos[i + 2] - prev[i + 2];
      m = Math.max(m, dx * dx + dy * dy + dz * dz);
    }
    return Math.sqrt(m) / Math.max(1e-4, h);
  }

  /** Worst stretch of any rope, as a fraction of its length. */
  stretch() {
    let m = 0;
    for (let k = 0; k < this.links; k++) {
      const i = this.a[k] * 3;
      const j = this.b[k] * 3;
      const d = Math.hypot(this.pos[j] - this.pos[i], this.pos[j + 1] - this.pos[i + 1], this.pos[j + 2] - this.pos[i + 2]);
      m = Math.max(m, d / this.rest[k] - 1);
    }
    return m;
  }
}
