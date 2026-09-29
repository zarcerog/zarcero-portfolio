// The painter's kit. A Sheet is a canvas addressed in world units (ten metres),
// origin at the bottom centre, y pointing up — so every piece of scenery is
// drawn at its real proportions and the flats line up with the world.
//
// Each sheet has two layers: `map` (the gouache) and `glow` (what lights up at
// night: windows, stained glass, floodlit stone).

import * as THREE from "three";

import { rng } from "@/stage3d/lib/canvas";

export type Ctx = CanvasRenderingContext2D;

export class Sheet {
  readonly w: number;
  readonly h: number;
  readonly ppu: number;
  readonly map: HTMLCanvasElement;
  readonly glow: HTMLCanvasElement;
  readonly c: Ctx;
  readonly g: Ctx;

  constructor(w: number, h: number, ppu: number) {
    this.w = w;
    this.h = h;
    this.ppu = ppu;
    const W = Math.min(4096, Math.ceil(w * ppu));
    const H = Math.min(4096, Math.ceil(h * ppu));
    this.map = document.createElement("canvas");
    this.glow = document.createElement("canvas");
    this.map.width = this.glow.width = W;
    this.map.height = this.glow.height = H;
    // CPU canvases: thousands of small strokes rasterise faster (and more
    // predictably) in software than queued up for the GPU
    this.c = this.map.getContext("2d", { willReadFrequently: true })!;
    this.g = this.glow.getContext("2d", { willReadFrequently: true })!;
    const sx = W / w;
    const sy = H / h;
    for (const ctx of [this.c, this.g]) {
      ctx.setTransform(sx, 0, 0, -sy, W / 2, H);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
    }
    this.g.fillStyle = "#000";
    this.g.save();
    this.g.setTransform(1, 0, 0, 1, 0, 0);
    this.g.fillRect(0, 0, W, H);
    this.g.restore();
  }

  /** one pixel, in world units */
  get px() {
    return 1 / this.ppu;
  }

  textures(anisotropy = 8) {
    const map = new THREE.CanvasTexture(this.map);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = anisotropy;
    map.generateMipmaps = true;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    const glow = new THREE.CanvasTexture(this.glow);
    glow.colorSpace = THREE.SRGBColorSpace;
    return { map, glow };
  }
}

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

export function hex(c: string, a = 1) {
  const n = parseInt(c.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** mix two hex colours, returning rgb() */
export function mix(a: string, b: string, t: number) {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

export interface Stone {
  hi: string;
  mid: string;
  lo: string;
  ink: string;
  /** soot and rain */
  grime: number;
}

export const STONE = {
  nativity: { hi: "#e9cfa2", mid: "#c49c6c", lo: "#7e5a3a", ink: "#3b2716", grime: 1 } as Stone,
  apse: { hi: "#e6cda4", mid: "#c3a073", lo: "#80603f", ink: "#3b2716", grime: 0.8 } as Stone,
  passion: { hi: "#ece5d6", mid: "#c9bfab", lo: "#8a8070", ink: "#3a342b", grime: 0.35 } as Stone,
  modern: { hi: "#f6f0e4", mid: "#ddd2bf", lo: "#a1937c", ink: "#4a3f31", grime: 0.12 } as Stone,
  ceramic: { hi: "#ffffff", mid: "#eeeae4", lo: "#b8b4ae", ink: "#5a5650", grime: 0 } as Stone,
};

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

/** Trace a closed silhouette from a radius profile r(y), y ∈ [y0, y1]. */
export function profilePath(ctx: Ctx, cx: number, y0: number, y1: number, r: (y: number) => number, steps = 120) {
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const y = y0 + ((y1 - y0) * i) / steps;
    const x = cx - r(y);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = steps; i >= 0; i--) {
    const y = y0 + ((y1 - y0) * i) / steps;
    ctx.lineTo(cx + r(y), y);
  }
  ctx.closePath();
}

/** A pointed (ogival) arch outline: width w, spring height hs, apex at ha. */
export function archPath(ctx: Ctx, cx: number, y0: number, w: number, hs: number, ha: number) {
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, y0);
  ctx.lineTo(cx - w / 2, y0 + hs);
  ctx.bezierCurveTo(cx - w / 2, y0 + hs + (ha - hs) * 0.55, cx - w * 0.18, y0 + ha * 0.97, cx, y0 + ha);
  ctx.bezierCurveTo(cx + w * 0.18, y0 + ha * 0.97, cx + w / 2, y0 + hs + (ha - hs) * 0.55, cx + w / 2, y0 + hs);
  ctx.lineTo(cx + w / 2, y0);
  ctx.closePath();
}

/** A parabolic arch (Gaudí's favourite): width w, height h. */
export function parabolaPath(ctx: Ctx, cx: number, y0: number, w: number, h: number, steps = 30) {
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const u = -1 + (2 * i) / steps;
    const x = cx + (u * w) / 2;
    const y = y0 + h * (1 - u * u);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function circle(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

/**
 * Fill a round body (tower, drum) by horizontal slices: each slice shaded
 * from lit (left) to shadow (right) across its own width, like gouache laid
 * on a turned form.
 */
export function roundBody(ctx: Ctx, cx: number, y0: number, y1: number, r: (y: number) => number, s: Stone, dy = 0.03) {
  for (let y = y0; y < y1; y += dy) {
    const rr = r(y + dy / 2);
    if (rr <= 0.0005) continue;
    const g = ctx.createLinearGradient(cx - rr, 0, cx + rr, 0);
    g.addColorStop(0, s.mid);
    g.addColorStop(0.18, s.hi);
    g.addColorStop(0.42, mix(s.hi, s.mid, 0.4));
    g.addColorStop(0.78, s.mid);
    g.addColorStop(1, s.lo);
    ctx.fillStyle = g;
    ctx.fillRect(cx - rr, y, rr * 2, dy * 1.08);
  }
}

/** A faceted body: flat tones per facet, as the central towers are built. */
export function facetBody(ctx: Ctx, cx: number, y0: number, y1: number, r: (y: number) => number, facets: number, s: Stone, dy = 0.04, twist = 0) {
  const light = new THREE.Vector2(-0.8, 0.6).normalize();
  for (let y = y0; y < y1; y += dy) {
    const rr = r(y + dy / 2);
    if (rr <= 0.0005) continue;
    for (let k = 0; k < facets; k++) {
      const a0 = (k / facets) * Math.PI * 2 + twist;
      const a1 = ((k + 1) / facets) * Math.PI * 2 + twist;
      const mid = (a0 + a1) / 2;
      // facing the viewer when cos(mid) > 0
      if (Math.cos(mid) <= 0) continue;
      const x0 = cx + rr * Math.sin(a0);
      const x1 = cx + rr * Math.sin(a1);
      const nx = Math.sin(mid);
      const nz = Math.cos(mid);
      const lit = Math.max(0, nx * light.x + nz * light.y);
      ctx.fillStyle = lit > 0.75 ? s.hi : lit > 0.45 ? mix(s.hi, s.mid, 0.5) : lit > 0.2 ? s.mid : s.lo;
      ctx.fillRect(Math.min(x0, x1), y, Math.abs(x1 - x0) + 0.004, dy * 1.08);
    }
  }
}

let grainTile: HTMLCanvasElement | null = null;

/** Grain: speckle and blotches, laid on as a pattern into the current clip. */
export function grain(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, seed: number, amount = 1, px = 0.006) {
  if (!grainTile) {
    const T = 256;
    grainTile = document.createElement("canvas");
    grainTile.width = grainTile.height = T;
    const g = grainTile.getContext("2d")!;
    const r = rng(77);
    for (let i = 0; i < 5200; i++) {
      g.fillStyle = r() > 0.55 ? `rgba(255,248,232,${0.08 + r() * 0.16})` : `rgba(50,32,18,${0.08 + r() * 0.16})`;
      const s = 1 + r() * 2.2;
      g.fillRect(r() * T, r() * T, s, s);
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? "80,55,30" : "255,245,225"},${0.03 + r() * 0.05})`;
      g.beginPath();
      g.ellipse(r() * T, r() * T, 8 + r() * 40, 5 + r() * 18, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  }
  const pat = ctx.createPattern(grainTile, "repeat")!;
  const k = px * 1.2;
  pat.setTransform(new DOMMatrix().translateSelf((seed * 0.73) % 1, (seed * 0.41) % 1).scaleSelf(k, k));
  ctx.save();
  ctx.globalAlpha = Math.min(1, amount);
  ctx.fillStyle = pat;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.restore();
}

/** Soot running down from under things. */
export function grime(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, seed: number, amount: number) {
  if (amount <= 0) return;
  const r = rng(seed);
  const n = Math.floor((x1 - x0) * 26 * amount);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const top = y0 + r() * (y1 - y0);
    const len = 0.2 + r() * 1.6;
    const g = ctx.createLinearGradient(0, top, 0, top - len);
    const a = (0.06 + r() * 0.12) * amount;
    g.addColorStop(0, `rgba(40,26,14,${a})`);
    g.addColorStop(1, "rgba(40,26,14,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x, top - len, 0.01 + r() * 0.035, len);
  }
}

/** One tile of carving, painted once per stone and size, then used as a pattern. */
const reliefTiles = new Map<string, HTMLCanvasElement>();

function reliefTile(s: Stone, size: number, density: number) {
  const key = `${s.hi}${s.mid}${s.lo}:${size}:${density}`;
  let cv = reliefTiles.get(key);
  if (cv) return cv;
  const T = 256;
  // the tile covers `span` world units; lumps are `size` world units
  const span = size * 14;
  const k = T / span;
  cv = document.createElement("canvas");
  cv.width = cv.height = T;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = s.mid;
  ctx.fillRect(0, 0, T, T);
  const r = rng(Math.round(size * 1000) + Math.round(density * 10));
  const n = Math.floor(span * span * 900 * density);
  for (let i = 0; i < n; i++) {
    const rad = size * (0.35 + r() * 0.9) * k;
    const rx = rad * (0.7 + r() * 0.6);
    const ry = rad * (0.7 + r() * 0.8);
    const rot = r() * 3;
    const d = rad * 0.28;
    const x = r() * T;
    const y = r() * T;
    // wrap round the edges so the tile repeats seamlessly
    for (const ox of [-T, 0, T]) {
      for (const oy of [-T, 0, T]) {
        const px = x + ox;
        const py = y + oy;
        if (px < -rad * 2 || px > T + rad * 2 || py < -rad * 2 || py > T + rad * 2) continue;
        ctx.fillStyle = hex(s.lo, 0.55);
        ctx.beginPath();
        ctx.ellipse(px + d, py + d, rx, ry, rot, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = hex(s.hi, 0.6);
        ctx.beginPath();
        ctx.ellipse(px - d * 0.7, py - d * 0.7, rx * 0.9, ry * 0.9, rot, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = (i & 1) === 0 ? s.mid : mix(s.mid, s.hi, 0.35);
        ctx.beginPath();
        ctx.ellipse(px, py, rx * 0.8, ry * 0.8, rot, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  reliefTiles.set(key, cv);
  return cv;
}

/**
 * Carving: thousands of little lumps, each lit from the top-left and shadowed
 * bottom-right, so a flat surface reads as crowded sculpture. Laid on as a
 * pattern, clipped to the current path, at `opacity` over what is there.
 */
export function relief(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, seed: number, s: Stone, density = 1, size = 0.05, opacity = 0.85) {
  const tile = reliefTile(s, size, density);
  const span = size * 14;
  const pat = ctx.createPattern(tile, "repeat")!;
  // pattern space: 256px per `span` world units, offset by the seed
  const m = new DOMMatrix().translateSelf((seed * 0.37) % span, (seed * 0.61) % span).scaleSelf(span / 256, span / 256);
  pat.setTransform(m);
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = pat;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.restore();
}

/** Stalactites of stone hanging from a curve (the Nativity's dripping gables). */
export function drips(ctx: Ctx, pts: [number, number][], seed: number, s: Stone, len = 0.25, every = 0.07) {
  const r = rng(seed);
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const d = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.floor(d / every));
    for (let k = 0; k < n; k++) {
      const t = (k + r() * 0.6) / n;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      const l = len * (0.3 + r() * 0.9);
      const w = 0.018 + r() * 0.03;
      const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
      g.addColorStop(0, s.hi);
      g.addColorStop(1, s.lo);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - w, y);
      ctx.quadraticCurveTo(x - w * 0.6, y - l * 0.6, x, y - l);
      ctx.quadraticCurveTo(x + w * 0.6, y - l * 0.6, x + w, y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/** A glossy ball (the white spheres on the pinnacles, the fruit on the nave). */
export function ball(ctx: Ctx, x: number, y: number, r: number, col: string, dark = "#000") {
  const g = ctx.createRadialGradient(x - r * 0.35, y + r * 0.35, r * 0.05, x, y, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.25, col);
  g.addColorStop(1, mix(col, dark, 0.45));
  ctx.fillStyle = g;
  circle(ctx, x, y, r);
  ctx.fill();
}

/** Venetian-glass mosaic, laid into the current clip. */
export function tesserae(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, seed: number, palette: string[], size = 0.028, bands = true) {
  const r = rng(seed);
  for (let y = y0; y < y1; y += size) {
    const band = palette[Math.floor(((y - y0) / (y1 - y0)) * palette.length * 1.5) % palette.length];
    for (let x = x0; x < x1; x += size) {
      const c = bands && r() < 0.75 ? band : palette[Math.floor(r() * palette.length)];
      ctx.fillStyle = c;
      ctx.fillRect(x + size * 0.08, y + size * 0.08, size * 0.84, size * 0.84);
      if (r() < 0.2) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(x + size * 0.15, y + size * 0.55, size * 0.3, size * 0.2);
      }
    }
  }
}

/** Ink outline around the current path. */
export function ink(ctx: Ctx, color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

/** Draw text upright in a y-up sheet. */
export function text(ctx: Ctx, str: string, x: number, y: number, size: number, font: (px: number) => string, color: string, align: CanvasTextAlign = "center") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.01, -0.01);
  ctx.font = font(size * 100);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(str, 0, 0);
  ctx.restore();
}

let paperTile: HTMLCanvasElement | null = null;

/** Paper tooth over everything: the whole sheet looks painted, not rendered. */
export function paper(sheet: Sheet, seed = 1, amount = 0.07) {
  if (!paperTile) {
    const T = 256;
    paperTile = document.createElement("canvas");
    paperTile.width = paperTile.height = T;
    const g = paperTile.getContext("2d")!;
    const r = rng(5);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = r() > 0.5 ? `rgba(255,250,240,${r()})` : `rgba(30,20,10,${r()})`;
      g.fillRect(r() * T, r() * T, 1 + r() * 2, 1 + r() * 2);
    }
  }
  const ctx = sheet.c;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-atop";
  ctx.globalAlpha = amount * 1.4;
  const pat = ctx.createPattern(paperTile, "repeat")!;
  pat.setTransform(new DOMMatrix().translateSelf((seed * 37) % 256, (seed * 91) % 256));
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, sheet.map.width, sheet.map.height);
  ctx.restore();
}
