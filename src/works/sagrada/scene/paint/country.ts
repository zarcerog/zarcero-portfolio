// The props department: one atlas of painted cut-outs for everything that
// stands on the ground — trees, farmhouses, the tile works, haystacks, the
// works' stones and hut. (The people have their own sheet: cast.ts.) Each tile is painted at its real proportions with
// the ground line at the bottom centre.

import { rng } from "@/stage3d/lib/canvas";

import { circle, hex, ink, mix, type Ctx } from "./kit";

export interface Tile {
  /** world size of the cut-out */
  w: number;
  h: number;
}

type Painter = (c: Ctx, w: number, h: number, seed: number) => void;

const COLS = 8;
const ROWS = 4;
const TILE = 256;

// ---------------------------------------------------------------------------
// Trees, in gouache: clusters of leaves, lit from the left.
// ---------------------------------------------------------------------------

function foliage(c: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number, pal: { hi: string; mid: string; lo: string }, lumps = 26) {
  const r = rng(seed);
  // the dark mass first, then lighter clusters towards the light
  c.fillStyle = pal.lo;
  for (let i = 0; i < lumps; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    circle(c, cx + Math.cos(a) * d * rx * 0.85, cy + Math.sin(a) * d * ry * 0.8, (0.28 + r() * 0.22) * Math.min(rx, ry));
    c.fill();
  }
  c.fillStyle = pal.mid;
  for (let i = 0; i < lumps; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 0.8;
    circle(c, cx - rx * 0.12 + Math.cos(a) * d * rx * 0.7, cy + ry * 0.08 + Math.sin(a) * d * ry * 0.65, (0.2 + r() * 0.18) * Math.min(rx, ry));
    c.fill();
  }
  c.fillStyle = pal.hi;
  for (let i = 0; i < lumps * 0.6; i++) {
    const a = Math.PI * (0.45 + r() * 0.6);
    const d = 0.35 + r() * 0.5;
    circle(c, cx + Math.cos(a) * d * rx * 0.7, cy + Math.sin(a) * d * ry * 0.7, (0.1 + r() * 0.12) * Math.min(rx, ry));
    c.fill();
  }
  // leaf flecks
  for (let i = 0; i < 90; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    c.fillStyle = r() > 0.5 ? hex(pal.hi, 0.7) : hex(pal.lo, 0.6);
    c.fillRect(cx + Math.cos(a) * d * rx * 0.9, cy + Math.sin(a) * d * ry * 0.85, rx * 0.04, ry * 0.03);
  }
}

function trunk(c: Ctx, x: number, y0: number, y1: number, w: number, lean = 0) {
  const g = c.createLinearGradient(x - w, 0, x + w, 0);
  g.addColorStop(0, "#8a6a4c");
  g.addColorStop(1, "#3e2a1c");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - w, y0);
  c.quadraticCurveTo(x - w * 0.6 + lean * 0.5, (y0 + y1) / 2, x - w * 0.4 + lean, y1);
  c.lineTo(x + w * 0.4 + lean, y1);
  c.quadraticCurveTo(x + w * 0.6 + lean * 0.5, (y0 + y1) / 2, x + w, y0);
  c.closePath();
  c.fill();
}

const OLIVE = { hi: "#b9c28a", mid: "#7f8f57", lo: "#4d5a36" };
const ALMOND = { hi: "#c8d28a", mid: "#8fa05a", lo: "#566938" };
const PINE = { hi: "#8fa66a", mid: "#56713f", lo: "#2f4526" };
const CYPRESS = { hi: "#6c8f5a", mid: "#3d5f3a", lo: "#1f3522" };
const PLANE = { hi: "#b8cf7a", mid: "#7a9a4a", lo: "#42602e" };

const olive: Painter = (c, w, h, s) => {
  trunk(c, 0, 0, h * 0.45, w * 0.06, w * 0.04);
  foliage(c, 0, h * 0.62, w * 0.46, h * 0.34, s, OLIVE);
};
const almond: Painter = (c, w, h, s) => {
  trunk(c, 0, 0, h * 0.4, w * 0.05, -w * 0.03);
  foliage(c, 0, h * 0.62, w * 0.44, h * 0.33, s, ALMOND, 30);
  // blossom
  const r = rng(s + 3);
  for (let i = 0; i < 40; i++) {
    c.fillStyle = r() > 0.4 ? "rgba(255,240,244,0.85)" : "rgba(245,200,210,0.8)";
    circle(c, (r() - 0.5) * w * 0.8, h * (0.4 + r() * 0.5), w * 0.02);
    c.fill();
  }
};
const pine: Painter = (c, w, h, s) => {
  trunk(c, 0, 0, h * 0.72, w * 0.035, w * 0.08);
  c.strokeStyle = "#4a3222";
  c.lineWidth = w * 0.025;
  c.beginPath();
  c.moveTo(w * 0.07, h * 0.62);
  c.lineTo(w * 0.24, h * 0.78);
  c.moveTo(w * 0.06, h * 0.66);
  c.lineTo(-w * 0.18, h * 0.8);
  c.stroke();
  foliage(c, w * 0.05, h * 0.84, w * 0.47, h * 0.13, s, PINE, 30);
};
const cypress: Painter = (c, w, h, s) => {
  const shape = () => {
    c.beginPath();
    c.moveTo(-w * 0.28, h * 0.04);
    c.bezierCurveTo(-w * 0.36, h * 0.45, -w * 0.12, h * 0.85, 0, h);
    c.bezierCurveTo(w * 0.12, h * 0.85, w * 0.36, h * 0.45, w * 0.28, h * 0.04);
    c.closePath();
  };
  shape();
  const g = c.createLinearGradient(-w * 0.3, 0, w * 0.3, 0);
  g.addColorStop(0, CYPRESS.hi);
  g.addColorStop(0.5, CYPRESS.mid);
  g.addColorStop(1, CYPRESS.lo);
  c.fillStyle = g;
  c.fill();
  c.save();
  shape();
  c.clip();
  const r = rng(s);
  for (let i = 0; i < 260; i++) {
    c.fillStyle = r() > 0.5 ? hex(CYPRESS.hi, 0.6) : hex(CYPRESS.lo, 0.6);
    c.beginPath();
    c.ellipse((r() - 0.5) * w * 0.7, r() * h, w * 0.05, h * 0.012, 0.8, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
};
const plane: Painter = (c, w, h, s) => {
  trunk(c, 0, 0, h * 0.5, w * 0.05);
  // plane-tree bark: grey-green patches
  const r = rng(s + 5);
  for (let i = 0; i < 12; i++) {
    c.fillStyle = r() > 0.5 ? "rgba(200,200,170,0.7)" : "rgba(120,130,100,0.6)";
    c.fillRect(-w * 0.04 + r() * w * 0.06, r() * h * 0.45, w * 0.025, h * 0.03);
  }
  foliage(c, 0, h * 0.66, w * 0.47, h * 0.32, s, PLANE, 34);
};

// ---------------------------------------------------------------------------
// Buildings of the Poblet: masies and the tile works.
// ---------------------------------------------------------------------------

function stucco(c: Ctx, x: number, y: number, w: number, h: number, base: string, seed: number) {
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, mix(base, "#ffffff", 0.25));
  g.addColorStop(1, mix(base, "#8a6a4a", 0.25));
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  const r = rng(seed);
  for (let i = 0; i < 70; i++) {
    c.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.18)" : "rgba(110,80,50,0.12)";
    c.fillRect(x + r() * w, y + r() * h, w * 0.05, h * 0.03);
  }
  // exposed stone where the render has fallen away
  for (let i = 0; i < 5; i++) {
    const sx = x + r() * w * 0.9;
    const sy = y + r() * h * 0.8;
    c.fillStyle = "rgba(150,120,90,0.35)";
    c.beginPath();
    c.ellipse(sx, sy, w * 0.05, h * 0.04, r(), 0, Math.PI * 2);
    c.fill();
  }
}

function tiles(c: Ctx, pts: [number, number][], seed: number) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = "#b4634a";
  c.fill();
  c.save();
  c.clip();
  const r = rng(seed);
  const minY = Math.min(...pts.map((p) => p[1]));
  const maxY = Math.max(...pts.map((p) => p[1]));
  for (let y = minY; y < maxY; y += (maxY - minY) / 8) {
    c.fillStyle = "rgba(90,40,25,0.35)";
    c.fillRect(-10, y, 20, (maxY - minY) / 40);
  }
  for (let i = 0; i < 40; i++) {
    c.fillStyle = r() > 0.5 ? "rgba(230,150,110,0.4)" : "rgba(120,60,40,0.3)";
    c.fillRect((r() - 0.5) * 3, minY + r() * (maxY - minY), 0.08, 0.03);
  }
  c.restore();
}

function arched(c: Ctx, x: number, y: number, w: number, h: number, fill: string) {
  c.beginPath();
  c.moveTo(x - w / 2, y);
  c.lineTo(x - w / 2, y + h - w / 2);
  c.arc(x, y + h - w / 2, w / 2, Math.PI, 0, true);
  c.lineTo(x + w / 2, y);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function shutterWindow(c: Ctx, x: number, y: number, w: number, h: number) {
  c.fillStyle = "#e9dcc2";
  c.fillRect(x - w * 0.62, y - h * 0.1, w * 1.24, h * 1.2);
  c.fillStyle = "#2a211b";
  c.fillRect(x - w / 2, y, w, h);
  c.fillStyle = "#5c7a64";
  c.fillRect(x - w / 2, y, w * 0.3, h);
  c.fillRect(x + w * 0.2, y, w * 0.3, h);
}

/** The classic masia: three bays, the ridge towards you, an arched stone door. */
const masia: Painter = (c, w, h, s) => {
  const ww = w * 0.8;
  const wall = h * 0.58;
  stucco(c, -ww / 2, 0, ww, wall, "#efe3c9", s);
  // the gable and its roof
  c.beginPath();
  c.moveTo(-ww / 2, wall);
  c.lineTo(0, h * 0.86);
  c.lineTo(ww / 2, wall);
  c.closePath();
  c.fillStyle = "#e8dcc2";
  c.fill();
  tiles(c, [
    [-ww / 2 - w * 0.04, wall - h * 0.01],
    [0, h * 0.88],
    [ww / 2 + w * 0.04, wall - h * 0.01],
    [ww / 2 + w * 0.04, wall + h * 0.03],
    [0, h * 0.92],
    [-ww / 2 - w * 0.04, wall + h * 0.03],
  ], s);
  // the voussoirs of the door
  const dw = ww * 0.2;
  arched(c, 0, 0, dw * 1.5, h * 0.36, "#cdbb98");
  for (let k = 0; k < 9; k++) {
    const a = Math.PI * (k / 8);
    c.strokeStyle = "rgba(80,60,40,0.6)";
    c.lineWidth = w * 0.006;
    c.beginPath();
    c.moveTo(Math.cos(a) * dw * 0.5, h * 0.36 - dw * 0.75 + Math.sin(a) * dw * 0.5);
    c.lineTo(Math.cos(a) * dw * 0.75, h * 0.36 - dw * 0.75 + Math.sin(a) * dw * 0.75);
    c.stroke();
  }
  arched(c, 0, 0, dw, h * 0.32, "#3a2a1e");
  shutterWindow(c, -ww * 0.3, h * 0.38, w * 0.07, h * 0.1);
  shutterWindow(c, ww * 0.3, h * 0.38, w * 0.07, h * 0.1);
  shutterWindow(c, 0, h * 0.44, w * 0.08, h * 0.1);
  shutterWindow(c, -ww * 0.3, h * 0.15, w * 0.05, h * 0.07);
  shutterWindow(c, ww * 0.3, h * 0.15, w * 0.05, h * 0.07);
  // a sundial under the eaves
  c.fillStyle = "#f6efe0";
  c.fillRect(-w * 0.06, h * 0.62, w * 0.12, h * 0.08);
  c.strokeStyle = "#3a2a1e";
  c.lineWidth = w * 0.004;
  for (let k = 0; k < 7; k++) {
    c.beginPath();
    c.moveTo(0, h * 0.68);
    c.lineTo(-w * 0.05 + (k / 6) * w * 0.1, h * 0.625);
    c.stroke();
  }
  // a lean-to on one side
  stucco(c, ww / 2, 0, w * 0.18, wall * 0.62, "#e6d6b8", s + 1);
  tiles(c, [
    [ww / 2, wall * 0.62],
    [ww / 2 + w * 0.19, wall * 0.5],
    [ww / 2 + w * 0.19, wall * 0.56],
    [ww / 2, wall * 0.7],
  ], s + 2);
  c.beginPath();
  c.rect(-ww / 2, 0, ww, wall);
  ink(c, "#4a3626", w * 0.006);
};

/** A masia with its defensive tower. */
const masiaTower: Painter = (c, w, h, s) => {
  c.save();
  c.translate(-w * 0.08, 0);
  c.scale(0.86, 0.86);
  masia(c, w, h, s);
  c.restore();
  const tx = w * 0.3;
  const tw = w * 0.2;
  stucco(c, tx - tw / 2, 0, tw, h * 0.86, "#e3d3b3", s + 4);
  for (let k = 0; k < 5; k++) {
    c.fillStyle = "#cdbb98";
    c.fillRect(tx - tw / 2 + k * (tw / 4.5), h * 0.86, tw / 9, h * 0.05);
  }
  shutterWindow(c, tx, h * 0.62, w * 0.05, h * 0.08);
  arched(c, tx, h * 0.3, w * 0.04, h * 0.08, "#2a211b");
  c.beginPath();
  c.rect(tx - tw / 2, 0, tw, h * 0.86);
  ink(c, "#4a3626", w * 0.006);
};

/** The bòbila: a brick kiln, its tall chimney, and tiles drying in rows. */
const bobila: Painter = (c, w, h) => {
  const kw = w * 0.55;
  const kh = h * 0.28;
  const brick = (x: number, y: number, bw: number, bh: number) => {
    c.fillStyle = "#a55a3e";
    c.fillRect(x, y, bw, bh);
    c.save();
    c.beginPath();
    c.rect(x, y, bw, bh);
    c.clip();
    const rows = Math.max(4, Math.floor(bh / (h * 0.012)));
    for (let i = 0; i < rows; i++) {
      c.fillStyle = "rgba(60,25,15,0.3)";
      c.fillRect(x, y + (i * bh) / rows, bw, h * 0.002);
      for (let k = 0; k < 20; k++) c.fillRect(x + ((k + (i % 2) * 0.5) * bw) / 20, y + (i * bh) / rows, w * 0.002, bh / rows);
    }
    c.restore();
  };
  brick(-w * 0.45, 0, kw, kh);
  arched(c, -w * 0.3, 0, w * 0.1, kh * 0.6, "#2a1510");
  arched(c, -w * 0.05, 0, w * 0.1, kh * 0.6, "#2a1510");
  c.fillStyle = "rgba(255,160,70,0.8)";
  c.fillRect(-w * 0.33, 0, w * 0.06, kh * 0.12);
  // chimney, tapering, with a banded crown
  c.beginPath();
  c.moveTo(w * 0.12, 0);
  c.lineTo(w * 0.15, h * 0.96);
  c.lineTo(w * 0.23, h * 0.96);
  c.lineTo(w * 0.26, 0);
  c.closePath();
  c.save();
  c.clip();
  brick(w * 0.1, 0, w * 0.18, h);
  c.restore();
  c.fillStyle = "#6a3424";
  c.fillRect(w * 0.14, h * 0.93, w * 0.1, h * 0.03);
  // stacks of tiles drying
  for (let k = 0; k < 4; k++) {
    const x = w * (0.3 + k * 0.045);
    c.fillStyle = k % 2 ? "#c47a58" : "#b86a4a";
    c.fillRect(x, 0, w * 0.035, h * 0.08);
    c.fillStyle = "rgba(90,40,25,0.4)";
    for (let y = 0; y < h * 0.08; y += h * 0.012) c.fillRect(x, y, w * 0.035, h * 0.003);
  }
};

const haystack: Painter = (c, w, h, s) => {
  const r = rng(s);
  for (const [x, sc] of [
    [-w * 0.2, 1],
    [w * 0.22, 0.8],
  ] as [number, number][]) {
    c.beginPath();
    c.moveTo(x - w * 0.22 * sc, 0);
    c.quadraticCurveTo(x - w * 0.24 * sc, h * 0.8 * sc, x, h * 0.95 * sc);
    c.quadraticCurveTo(x + w * 0.24 * sc, h * 0.8 * sc, x + w * 0.22 * sc, 0);
    c.closePath();
    const g = c.createLinearGradient(x - w * 0.2, 0, x + w * 0.2, 0);
    g.addColorStop(0, "#f0d58a");
    g.addColorStop(1, "#a88a3e");
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = "rgba(120,90,30,0.5)";
    c.lineWidth = w * 0.004;
    for (let i = 0; i < 30; i++) {
      const y = r() * h * 0.8 * sc;
      c.beginPath();
      c.moveTo(x + (r() - 0.5) * w * 0.3 * sc, y);
      c.lineTo(x + (r() - 0.5) * w * 0.3 * sc, y + h * 0.05);
      c.stroke();
    }
    c.fillStyle = "#6b4a2c";
    c.fillRect(x - w * 0.005, h * 0.9 * sc, w * 0.01, h * 0.1 * sc);
  }
};

/** A cart with its mule, standing about. */
const cart: Painter = (c, w, h) => {
  c.fillStyle = "#8a5a34";
  c.fillRect(-w * 0.1, h * 0.35, w * 0.45, h * 0.25);
  c.strokeStyle = "#3a2616";
  c.lineWidth = w * 0.02;
  circle(c, w * 0.12, h * 0.3, h * 0.28);
  c.stroke();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI;
    c.beginPath();
    c.moveTo(w * 0.12 + Math.cos(a) * h * 0.28, h * 0.3 + Math.sin(a) * h * 0.28);
    c.lineTo(w * 0.12 - Math.cos(a) * h * 0.28, h * 0.3 - Math.sin(a) * h * 0.28);
    c.stroke();
  }
  // the mule
  c.fillStyle = "#6a5244";
  c.beginPath();
  c.ellipse(-w * 0.3, h * 0.55, w * 0.14, h * 0.13, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(-w * 0.42, h * 0.1, w * 0.03, h * 0.4);
  c.fillRect(-w * 0.2, h * 0.1, w * 0.03, h * 0.4);
  c.beginPath();
  c.ellipse(-w * 0.45, h * 0.72, w * 0.05, h * 0.1, 0.5, 0, Math.PI * 2);
  c.fill();
  c.fillRect(-w * 0.47, h * 0.8, w * 0.015, h * 0.1);
};

// ---------------------------------------------------------------------------
// The building site: cut stone, the site hut, a mason.
// ---------------------------------------------------------------------------

const stones: Painter = (c, w, h, s) => {
  const r = rng(s);
  const rows = 4;
  for (let row = 0; row < rows; row++) {
    const n = rows - row + 1;
    for (let k = 0; k < n; k++) {
      const bw = w / (rows + 1.3);
      const x = -((n - 1) * bw) / 2 + k * bw + (r() - 0.5) * bw * 0.1;
      const y = row * (h / rows) * 0.92;
      const g = c.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0);
      g.addColorStop(0, "#efdcb6");
      g.addColorStop(1, "#b8986a");
      c.fillStyle = g;
      c.fillRect(x - bw * 0.46, y, bw * 0.92, (h / rows) * 0.88);
      c.strokeStyle = "#6a5034";
      c.lineWidth = w * 0.008;
      c.strokeRect(x - bw * 0.46, y, bw * 0.92, (h / rows) * 0.88);
      // chisel marks
      c.strokeStyle = "rgba(120,90,60,0.4)";
      for (let m = 0; m < 4; m++) {
        c.beginPath();
        c.moveTo(x - bw * 0.3 + r() * bw * 0.5, y + r() * (h / rows) * 0.7);
        c.lineTo(x - bw * 0.2 + r() * bw * 0.5, y + r() * (h / rows) * 0.7);
        c.stroke();
      }
    }
  }
};

const hut: Painter = (c, w, h, s) => {
  // planks
  c.fillStyle = "#a07a50";
  c.fillRect(-w * 0.42, 0, w * 0.84, h * 0.62);
  const r = rng(s);
  for (let x = -w * 0.42; x < w * 0.42; x += w * 0.06) {
    c.fillStyle = `rgba(${r() > 0.5 ? "70,45,25" : "255,230,190"},0.18)`;
    c.fillRect(x, 0, w * 0.03, h * 0.62);
  }
  // corrugated roof
  c.fillStyle = "#8a8a84";
  c.beginPath();
  c.moveTo(-w * 0.48, h * 0.6);
  c.lineTo(w * 0.48, h * 0.7);
  c.lineTo(w * 0.48, h * 0.76);
  c.lineTo(-w * 0.48, h * 0.66);
  c.closePath();
  c.fill();
  c.fillStyle = "#2a2018";
  c.fillRect(-w * 0.3, 0, w * 0.14, h * 0.42);
  c.fillStyle = "#f3ead6";
  c.fillRect(w * 0.0, h * 0.3, w * 0.34, h * 0.16);
  c.save();
  c.translate(w * 0.17, h * 0.38);
  c.scale(1, -1);
  c.fillStyle = "#b8322f";
  c.font = `700 ${h * 0.1}px sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("OBRES", 0, 0);
  c.restore();
  c.beginPath();
  c.rect(-w * 0.42, 0, w * 0.84, h * 0.62);
  ink(c, "#3a2616", w * 0.01);
};

// ---------------------------------------------------------------------------
// The atlas.
// ---------------------------------------------------------------------------

export const ATLAS: Record<string, { tile: number; size: Tile; paint: Painter; seed: number }> = {};
const entries: [string, Tile, Painter, number][] = [
  ["olive", { w: 2.2, h: 2.2 }, olive, 1],
  ["olive2", { w: 2.0, h: 1.9 }, olive, 2],
  ["almond", { w: 2.0, h: 2.0 }, almond, 3],
  ["pine", { w: 3.0, h: 3.4 }, pine, 4],
  ["pine2", { w: 2.6, h: 3.0 }, pine, 5],
  ["cypress", { w: 0.9, h: 3.2 }, cypress, 6],
  ["plane", { w: 2.2, h: 2.8 }, plane, 7],
  ["plane2", { w: 2.4, h: 3.0 }, plane, 8],
  ["masia", { w: 3.4, h: 2.4 }, masia, 9],
  ["masiaTower", { w: 3.6, h: 2.9 }, masiaTower, 10],
  ["bobila", { w: 4.2, h: 6.2 }, bobila, 11],
  ["haystack", { w: 1.6, h: 1.0 }, haystack, 12],
  ["cart", { w: 1.6, h: 0.9 }, cart, 13],
  ["stones", { w: 1.4, h: 0.7 }, stones, 22],
  ["hut", { w: 1.8, h: 1.2 }, hut, 23],
];
entries.forEach(([name, size, paint, seed], i) => (ATLAS[name] = { tile: i, size, paint, seed }));

export const ATLAS_GRID = { cols: COLS, rows: ROWS };

/** Paint the whole atlas: each tile scaled so its cut-out fills the square. */
export function paintAtlas() {
  const cv = document.createElement("canvas");
  cv.width = COLS * TILE;
  cv.height = ROWS * TILE;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  for (const [, e] of Object.entries(ATLAS)) {
    const col = e.tile % COLS;
    const row = Math.floor(e.tile / COLS);
    const k = (TILE - 8) / Math.max(e.size.w, e.size.h);
    ctx.save();
    // y-up, origin at the tile's bottom centre (the cut-out's feet)
    ctx.translate(col * TILE + TILE / 2, row * TILE + TILE - 4);
    ctx.scale(k, -k);
    ctx.beginPath();
    ctx.rect(-e.size.w / 2, 0, e.size.w, e.size.h);
    ctx.clip();
    e.paint(ctx, e.size.w, e.size.h, e.seed);
    ctx.restore();
  }
  return cv;
}

/** Where a tile's cut-out sits inside its square, in 0..1 atlas units. */
export function tileRect(name: string) {
  const e = ATLAS[name];
  const col = e.tile % COLS;
  const row = Math.floor(e.tile / COLS);
  const k = (TILE - 8) / Math.max(e.size.w, e.size.h);
  const pw = e.size.w * k;
  const ph = e.size.h * k;
  const x0 = col * TILE + TILE / 2 - pw / 2;
  const y0 = row * TILE + TILE - 4 - ph;
  return {
    u0: x0 / (COLS * TILE),
    v0: 1 - (y0 + ph) / (ROWS * TILE),
    u1: (x0 + pw) / (COLS * TILE),
    v1: 1 - y0 / (ROWS * TILE),
  };
}

