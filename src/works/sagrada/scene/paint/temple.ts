// The temple, painted. Every function paints one flat of the pop-up book onto
// a Sheet (world units, origin bottom-centre, y up). The flats are layered in
// depth by ../flats.ts and rise with the calendar.
//
// Drawn after the building as it stands: the helical louvred openings and
// mitred mosaic pinnacles of the bell towers, the Nativity's three portals
// dripping with carved stone, the cypress full of doves, the Evangelists and
// their symbols, Mary's star and the four-armed cross of Jesus.

import { rng } from "@/stage3d/lib/canvas";
import { font } from "@/stage3d/lib/fonts";

import {
  archPath,
  ball,
  circle,
  drips,
  facetBody,
  grain,
  grime,
  hex,
  ink,
  mix,
  paper,
  parabolaPath,
  profilePath,
  relief,
  roundBody,
  Sheet,
  STONE,
  tesserae,
  text,
  type Ctx,
  type Stone,
} from "./kit";

const SERIF = (px: number) => font.serif(700, px);
const SANS = (px: number) => font.sans(700, px);

export const MOSAIC_NATIVITY = ["#c62f37", "#e9b736", "#f5eee2", "#d8732b", "#2e7a58", "#c62f37"];
export const MOSAIC_PASSION = ["#f5eee2", "#c62f37", "#e9b736", "#9fb8c9", "#f5eee2"];
const GLASS = ["#2f6fd6", "#1fa3a0", "#58c26a", "#1f4fb0", "#8fd0ff", "#ffd35a"];
const GLASS_WARM = ["#ff7a2a", "#ffb02e", "#e2352f", "#ffd35a", "#c22f5a", "#8a3fb5"];

/** Floodlight on the glow layer: warm from below, fading upwards. */
function flood(sheet: Sheet, path: () => void, top: number, strength = 0.85) {
  const g = sheet.g;
  path();
  const grad = g.createLinearGradient(0, 0, 0, top);
  grad.addColorStop(0, `rgba(255,190,120,${strength})`);
  grad.addColorStop(0.6, `rgba(255,178,110,${strength * 0.55})`);
  grad.addColorStop(1, `rgba(255,170,110,${strength * 0.3})`);
  g.fillStyle = grad;
  g.fill();
}

/** A dark opening: deep shadow, a lit lip at the bottom, louvres across. */
function opening(c: Ctx, g: Ctx | null, x: number, y: number, w: number, h: number, slats: number, s: Stone, glowCol?: string) {
  const r = Math.min(w, h) * 0.45;
  const grad = c.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, "#1a0f08");
  grad.addColorStop(1, "#2e1d12");
  c.fillStyle = grad;
  c.beginPath();
  c.roundRect(x - w / 2, y, w, h, r);
  c.fill();
  for (let k = 1; k <= slats; k++) {
    const yy = y + (h * k) / (slats + 1);
    c.strokeStyle = hex(s.mid, 0.9);
    c.lineWidth = h * 0.09;
    c.beginPath();
    c.moveTo(x - w / 2 + w * 0.08, yy + h * 0.05);
    c.lineTo(x + w / 2 - w * 0.08, yy - h * 0.05);
    c.stroke();
  }
  c.strokeStyle = hex(s.hi, 0.9);
  c.lineWidth = h * 0.07;
  c.beginPath();
  c.moveTo(x - w / 2 + r * 0.5, y - h * 0.02);
  c.lineTo(x + w / 2 - r * 0.5, y - h * 0.02);
  c.stroke();
  if (g) {
    g.fillStyle = glowCol ?? "rgba(0,0,0,1)";
    g.beginPath();
    g.roundRect(x - w / 2, y, w, h, r);
    g.fill();
  }
}

// ---------------------------------------------------------------------------
// The mitre: the mosaic pinnacle at the top of each bell tower.
// ---------------------------------------------------------------------------

function mitre(sheet: Sheet, cx: number, y0: number, R: number, mh: number, palette: string[], seed: number, s: Stone) {
  const c = sheet.c;
  const g = sheet.g;
  const mw = R * 1.05;
  // the collar
  c.fillStyle = mix(s.mid, "#b0892e", 0.5);
  c.beginPath();
  c.ellipse(cx, y0, R * 0.36, R * 0.09, 0, 0, Math.PI * 2);
  c.fill();
  ink(c, s.ink, sheet.px * 1.5);
  // the stalk: a hexagonal shaft with little windows
  const sh = mh * 0.24;
  c.fillStyle = s.mid;
  c.fillRect(cx - R * 0.22, y0, R * 0.44, sh);
  const sg = c.createLinearGradient(cx - R * 0.22, 0, cx + R * 0.22, 0);
  sg.addColorStop(0, s.hi);
  sg.addColorStop(1, s.lo);
  c.fillStyle = sg;
  c.fillRect(cx - R * 0.22, y0, R * 0.44, sh);
  for (let k = 0; k < 3; k++) {
    c.fillStyle = "#2a1a10";
    c.fillRect(cx - R * 0.14 + k * R * 0.1, y0 + sh * 0.3, R * 0.05, sh * 0.45);
  }
  // the mitre: a tall ogive in Venetian glass
  const y1 = y0 + sh;
  const h1 = mh * 0.62;
  archPath(c, cx, y1, mw, h1 * 0.45, h1);
  c.save();
  c.clip();
  tesserae(c, cx - mw / 2, y1, cx + mw / 2, y1 + h1, seed, palette, R * 0.075);
  // roundness
  const sh2 = c.createLinearGradient(cx - mw / 2, 0, cx + mw / 2, 0);
  sh2.addColorStop(0, "rgba(255,255,255,0.28)");
  sh2.addColorStop(0.35, "rgba(255,255,255,0)");
  sh2.addColorStop(1, "rgba(40,20,10,0.4)");
  c.fillStyle = sh2;
  c.fillRect(cx - mw / 2, y1, mw, h1);
  // the white cross laid into its face
  c.fillStyle = "#f7f2e8";
  c.fillRect(cx - mw * 0.06, y1 + h1 * 0.15, mw * 0.12, h1 * 0.6);
  c.fillRect(cx - mw * 0.28, y1 + h1 * 0.48, mw * 0.56, h1 * 0.1);
  c.restore();
  archPath(c, cx, y1, mw, h1 * 0.45, h1);
  ink(c, s.ink, sheet.px * 1.6);
  archPath(g, cx, y1, mw, h1 * 0.45, h1);
  g.save();
  g.clip();
  tesserae(g, cx - mw / 2, y1, cx + mw / 2, y1 + h1, seed, palette, R * 0.075);
  g.restore();
  // a necklace of white balls round its middle
  const by = y1 + h1 * 0.3;
  for (let k = 0; k < 9; k++) {
    const a = Math.PI * (k / 8);
    const x = cx - Math.cos(a) * mw * 0.55;
    const y = by - Math.sin(a) * R * 0.12;
    ball(c, x, y, R * 0.085, "#f7f3ea", "#6b5a44");
  }
  // the crowning cross, its arms ending in balls
  const ty = y1 + h1 + mh * 0.1;
  const arm = R * 0.34;
  c.fillStyle = "#e9b736";
  c.fillRect(cx - R * 0.045, y1 + h1 - R * 0.05, R * 0.09, mh * 0.1 + arm);
  c.fillRect(cx - arm, ty - R * 0.045, arm * 2, R * 0.09);
  ink(c, s.ink, sheet.px);
  for (const [dx, dy] of [
    [0, arm],
    [-arm, 0],
    [arm, 0],
  ]) {
    ball(c, cx + dx, ty + dy, R * 0.1, "#f7f3ea", "#6b5a44");
  }
  ball(c, cx, ty, R * 0.13, "#e9b736", "#6b4a10");
  c.strokeStyle = "#e9b736";
  c.lineWidth = R * 0.04;
  circle(c, cx, ty, arm * 0.62);
  c.stroke();
}

// ---------------------------------------------------------------------------
// The bell towers of the Nativity and the Passion.
// ---------------------------------------------------------------------------

export interface BellOpts {
  R: number;
  H: number;
  stone: Stone;
  seed: number;
  palette: string[];
  word: string;
  statue: boolean;
  angular?: boolean;
}

export function bellTowerSize(o: BellOpts) {
  return { w: o.R * 2.5, h: o.H + 0.15 };
}

export function bellTower(sheet: Sheet, o: BellOpts) {
  const { R, H, stone: s } = o;
  const c = sheet.c;
  const g = sheet.g;
  const bodyTop = H * 0.8;
  const baseTop = H * 0.14;
  const r = (y: number) => {
    if (y < baseTop) return R * 1.04;
    const u = (y - baseTop) / (bodyTop - baseTop);
    return Math.max(R * 0.13, R * (1 - 0.1 * u) * Math.pow(Math.max(0.01, 1 - Math.pow(u, 2.25)), 0.56));
  };
  const path = (ctx: Ctx) => profilePath(ctx, 0, 0, bodyTop, r, 200);

  // — the body —
  path(c);
  c.save();
  c.clip();
  roundBody(c, 0, 0, bodyTop, r, s, 0.025);
  // the square base: pilasters and courses
  for (let k = -3; k <= 3; k++) {
    const x = (k / 3.5) * R;
    c.fillStyle = hex(k < 0 ? s.hi : s.lo, 0.35);
    c.fillRect(x - R * 0.03, 0, R * 0.06, baseTop);
  }
  for (let y = 0.35; y < baseTop; y += 0.35) {
    c.fillStyle = hex(s.lo, 0.45);
    c.fillRect(-R * 1.1, y, R * 2.2, sheet.px * 2);
  }
  // fluting up the spire: lines where the surface turns away
  for (let k = 0; k < 14; k++) {
    const th = -Math.PI / 2 + (k / 13) * Math.PI;
    c.beginPath();
    for (let y = baseTop; y < bodyTop; y += 0.08) {
      const x = r(y) * Math.sin(th) * 0.98;
      if (y === baseTop) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.strokeStyle = hex(Math.sin(th) < 0 ? s.hi : s.lo, 0.18);
    c.lineWidth = sheet.px * 1.5;
    c.stroke();
  }
  grain(c, -R * 1.1, 0, R * 1.1, bodyTop, o.seed, 0.8, sheet.px);

  // — the louvred openings, winding round the spire in a helix —
  const rowH = 0.21;
  let row = 0;
  const letters = o.word.split("");
  const letterRows = new Map<number, number>();
  const firstLetterRow = Math.floor((bodyTop * 0.5 - baseTop) / rowH);
  letters.forEach((_, i) => letterRows.set(firstLetterRow + i * 2, i));
  for (let y = baseTop + 0.2; y < bodyTop - 0.18; y += rowH, row++) {
    const rr = r(y + rowH / 2);
    const n = 9;
    for (let k = 0; k < n; k++) {
      const th = (k / n) * Math.PI * 2 + row * 0.3;
      const cz = Math.cos(th);
      if (cz < 0.12) continue;
      const x = rr * Math.sin(th) * 0.93;
      const ow = Math.min(rr * 0.4, rr * (Math.PI / n) * 1.15) * cz;
      const oh = rowH * (o.angular ? 0.55 : 0.46);
      const li = letterRows.get(row);
      if (li !== undefined && Math.abs(Math.sin(th)) < 0.35) {
        // Sanctus, Sanctus, Sanctus: raised letters winding up the tower
        text(c, letters[li], x, y + oh / 2, Math.min(0.2, rr * 0.5), SERIF, mix(s.hi, "#fff8e8", 0.5));
        continue;
      }
      opening(c, g, x, y, ow, oh, 1, s);
    }
  }
  // the apostle, seated in his niche above the base
  if (o.statue) {
    const ny = baseTop + 0.15;
    const nw = R * 0.95;
    const nh = R * 1.55;
    archPath(c, 0, ny, nw, nh * 0.55, nh);
    const ng = c.createLinearGradient(0, ny, 0, ny + nh);
    ng.addColorStop(0, "#2a1a10");
    ng.addColorStop(1, "#4a3220");
    c.fillStyle = ng;
    c.fill();
    ink(c, s.ink, sheet.px * 1.5);
    // the figure: head, halo, a cloak, knees
    const fc = mix(s.hi, "#ffffff", 0.2);
    c.fillStyle = hex(s.hi, 0.35);
    circle(c, 0, ny + nh * 0.68, R * 0.17);
    c.fill();
    c.fillStyle = fc;
    circle(c, 0, ny + nh * 0.66, R * 0.1);
    c.fill();
    c.beginPath();
    c.moveTo(-R * 0.2, ny + nh * 0.56);
    c.quadraticCurveTo(0, ny + nh * 0.62, R * 0.2, ny + nh * 0.56);
    c.lineTo(R * 0.28, ny + nh * 0.14);
    c.lineTo(-R * 0.28, ny + nh * 0.14);
    c.closePath();
    c.fill();
    c.fillStyle = hex(s.lo, 0.6);
    c.fillRect(-R * 0.02, ny + nh * 0.14, R * 0.04, nh * 0.35);
    c.fillStyle = mix(s.mid, s.hi, 0.4);
    c.fillRect(-R * 0.32, ny, R * 0.64, nh * 0.14);
  }
  grime(c, -R * 1.1, 0.2, R * 1.1, bodyTop, o.seed + 9, s.grime);
  c.restore();
  path(c);
  ink(c, s.ink, sheet.px * 2);
  path(g);
  g.save();
  g.clip();
  flood(sheet, () => path(g), bodyTop, 0.8);
  g.restore();
  // re-darken the openings on the glow layer (they stay black holes at night)
  // (already filled black by opening())

  // — the pinnacle —
  mitre(sheet, 0, bodyTop, R, H - bodyTop - 0.05, o.palette, o.seed + 3, s);
  paper(sheet, o.seed, 0.06);
}

// ---------------------------------------------------------------------------
// The central towers: Evangelists, Mary, Jesus.
// ---------------------------------------------------------------------------

export type Crown = "ox" | "lion" | "eagle" | "angel" | "star" | "cross";

export interface ShaftOpts {
  R: number;
  H: number;
  facets: number;
  body: number;
  crown: Crown;
  seed: number;
  stone: Stone;
}

export function shaftSize(o: ShaftOpts) {
  return { w: o.crown === "cross" ? o.R * 2.3 : o.R * 2.2, h: o.H + 0.1 };
}

/** The winged symbol of an Evangelist, in gilded and glazed ceramic. */
function symbol(sheet: Sheet, cx: number, y: number, R: number, kind: Crown) {
  const c = sheet.c;
  const g = sheet.g;
  const wing = (side: number) => {
    c.save();
    c.translate(cx, y);
    c.scale(side, 1);
    c.beginPath();
    c.moveTo(R * 0.08, R * 0.05);
    c.bezierCurveTo(R * 0.4, R * 0.3, R * 0.7, R * 0.55, R * 0.75, R * 0.95);
    c.bezierCurveTo(R * 0.55, R * 0.7, R * 0.4, R * 0.55, R * 0.12, R * 0.4);
    c.closePath();
    const wg = c.createLinearGradient(0, 0, R * 0.8, R);
    wg.addColorStop(0, "#fff7dc");
    wg.addColorStop(1, "#d9a73a");
    c.fillStyle = wg;
    c.fill();
    c.strokeStyle = "#7a5a1c";
    c.lineWidth = sheet.px * 1.2;
    c.stroke();
    for (let k = 1; k < 5; k++) {
      c.beginPath();
      c.moveTo(R * (0.12 + k * 0.1), R * (0.12 + k * 0.1));
      c.lineTo(R * (0.2 + k * 0.12), R * (0.4 + k * 0.12));
      c.stroke();
    }
    c.restore();
  };
  wing(-1);
  wing(1);
  const body = kind === "ox" ? "#c9924a" : kind === "lion" ? "#e3b24a" : kind === "eagle" ? "#b98a52" : "#f6efe2";
  ball(c, cx, y + R * 0.25, R * 0.3, body, "#5a3a10");
  // a head, and a hint of who it is
  ball(c, cx, y + R * 0.62, R * 0.16, kind === "angel" ? "#f3d9c0" : body, "#5a3a10");
  if (kind === "ox") {
    c.strokeStyle = "#f7f0dc";
    c.lineWidth = R * 0.05;
    c.beginPath();
    c.moveTo(cx - R * 0.14, y + R * 0.7);
    c.quadraticCurveTo(cx - R * 0.3, y + R * 0.85, cx - R * 0.2, y + R * 0.95);
    c.moveTo(cx + R * 0.14, y + R * 0.7);
    c.quadraticCurveTo(cx + R * 0.3, y + R * 0.85, cx + R * 0.2, y + R * 0.95);
    c.stroke();
  } else if (kind === "lion") {
    c.fillStyle = "#c98a2a";
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      circle(c, cx + Math.cos(a) * R * 0.2, y + R * 0.62 + Math.sin(a) * R * 0.2, R * 0.07);
      c.fill();
    }
    ball(c, cx, y + R * 0.62, R * 0.14, "#e3b24a", "#5a3a10");
  } else if (kind === "eagle") {
    c.fillStyle = "#e9b736";
    c.beginPath();
    c.moveTo(cx + R * 0.1, y + R * 0.62);
    c.lineTo(cx + R * 0.3, y + R * 0.56);
    c.lineTo(cx + R * 0.1, y + R * 0.55);
    c.fill();
  } else if (kind === "angel") {
    c.strokeStyle = "#e9b736";
    c.lineWidth = R * 0.03;
    c.beginPath();
    c.ellipse(cx, y + R * 0.84, R * 0.14, R * 0.04, 0, 0, Math.PI * 2);
    c.stroke();
  }
  g.fillStyle = "rgba(255,220,150,0.7)";
  circle(g, cx, y + R * 0.4, R * 0.5);
  g.fill();
}

/** Mary's twelve-pointed star, in glass. */
function star(sheet: Sheet, cx: number, cy: number, rS: number) {
  const c = sheet.c;
  const g = sheet.g;
  const pts = (ctx: Ctx, ro: number, ri: number) => {
    ctx.beginPath();
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2 + Math.PI / 2;
      const rr = k % 2 ? ri : ro;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };
  pts(c, rS, rS * 0.48);
  const sg = c.createRadialGradient(cx - rS * 0.2, cy + rS * 0.2, 0, cx, cy, rS);
  sg.addColorStop(0, "#ffffff");
  sg.addColorStop(0.5, "#dce9ff");
  sg.addColorStop(1, "#8fb0e0");
  c.fillStyle = sg;
  c.fill();
  ink(c, "#4a5a78", sheet.px * 1.4);
  // facets
  c.strokeStyle = "rgba(90,110,150,0.45)";
  c.lineWidth = sheet.px;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 + Math.PI / 2;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(a) * rS, cy + Math.sin(a) * rS);
    c.stroke();
  }
  pts(g, rS * 1.05, rS * 0.52);
  g.fillStyle = "rgba(210,228,255,1)";
  g.fill();
  const halo = g.createRadialGradient(cx, cy, 0, cx, cy, rS * 1.6);
  halo.addColorStop(0, "rgba(200,220,255,0.6)");
  halo.addColorStop(1, "rgba(200,220,255,0)");
  g.fillStyle = halo;
  circle(g, cx, cy, rS * 1.6);
  g.fill();
}

/** The cross of Jesus Christ: four arms of white glazed ceramic and glass. */
function cross(sheet: Sheet, cx: number, y0: number, h: number, arm: number) {
  const c = sheet.c;
  const g = sheet.g;
  const t = arm * 0.3;
  const cy = y0 + h * 0.58;
  const piece = (ctx: Ctx, x: number, y: number, w: number, hh: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, hh, t * 0.25);
  };
  const glaze = (x: number, y: number, w: number, hh: number) => {
    const gr = c.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, "#ffffff");
    gr.addColorStop(0.5, "#eef1f4");
    gr.addColorStop(1, "#b9c2cc");
    piece(c, x, y, w, hh);
    c.fillStyle = gr;
    c.fill();
    ink(c, "#58606a", sheet.px * 1.3);
    // a glass inlay down the middle
    c.fillStyle = "rgba(150,190,230,0.9)";
    c.fillRect(x + w * 0.38, y + hh * 0.1, w * 0.24, hh * 0.8);
    piece(g, x, y, w, hh);
    g.fillStyle = "rgba(255,255,255,1)";
    g.fill();
  };
  glaze(cx - t / 2, y0, t, h);
  glaze(cx - arm, cy - t / 2, arm * 2, t);
  // the arm pointing at us: a square boss with a glass eye
  c.fillStyle = "#f4f6f8";
  c.beginPath();
  c.roundRect(cx - t * 0.8, cy - t * 0.8, t * 1.6, t * 1.6, t * 0.3);
  c.fill();
  ink(c, "#58606a", sheet.px * 1.3);
  ball(c, cx, cy, t * 0.45, "#bcd6f2", "#3a5a80");
  const halo = g.createRadialGradient(cx, cy, 0, cx, cy, arm * 2.4);
  halo.addColorStop(0, "rgba(255,248,230,0.8)");
  halo.addColorStop(1, "rgba(255,248,230,0)");
  g.fillStyle = halo;
  circle(g, cx, cy, arm * 2.4);
  g.fill();
}

export function centralTower(sheet: Sheet, o: ShaftOpts) {
  const { R, H, facets, stone: s } = o;
  const c = sheet.c;
  const g = sheet.g;
  const top = H * o.body;
  const r = (y: number) => {
    const u = y / top;
    return Math.max(R * 0.08, R * (1 - 0.3 * u) * Math.pow(Math.max(0.02, 1 - Math.pow(u, 3.2)), 0.42));
  };
  const path = (ctx: Ctx) => profilePath(ctx, 0, 0, top, r, 200);
  path(c);
  c.save();
  c.clip();
  facetBody(c, 0, 0, top, r, facets, s, 0.03, 0.12);
  grain(c, -R * 1.1, 0, R * 1.1, top, o.seed, 0.6, sheet.px);
  // lozenge windows, row upon row, on every facet facing us
  const rowH = 0.34;
  let row = 0;
  for (let y = 0.6; y < top - 0.3; y += rowH, row++) {
    const rr = r(y + rowH / 2);
    for (let k = 0; k < facets; k++) {
      const a0 = (k / facets) * Math.PI * 2 + 0.12;
      const a1 = ((k + 1) / facets) * Math.PI * 2 + 0.12;
      const mid = (a0 + a1) / 2;
      const cz = Math.cos(mid);
      if (cz < 0.12) continue;
      const x = rr * Math.sin(mid);
      const w = Math.abs(rr * (Math.sin(a1) - Math.sin(a0))) * 0.5;
      const hh = rowH * 0.62;
      const yy = y + (row % 2 ? rowH * 0.25 : 0);
      c.fillStyle = "#28303a";
      c.beginPath();
      c.moveTo(x, yy);
      c.lineTo(x + w / 2, yy + hh / 2);
      c.lineTo(x, yy + hh);
      c.lineTo(x - w / 2, yy + hh / 2);
      c.closePath();
      c.fill();
      c.strokeStyle = hex(s.hi, 0.8);
      c.lineWidth = sheet.px * 1.2;
      c.stroke();
      g.fillStyle = `rgba(255,${210 + ((k * 7 + row * 3) % 40)},${150 + ((k * 13 + row) % 60)},0.95)`;
      g.beginPath();
      g.moveTo(x, yy);
      g.lineTo(x + w / 2, yy + hh / 2);
      g.lineTo(x, yy + hh);
      g.lineTo(x - w / 2, yy + hh / 2);
      g.closePath();
      g.fill();
    }
  }
  // the ribs where facets meet
  for (let k = 0; k < facets; k++) {
    const a = (k / facets) * Math.PI * 2 + 0.12;
    if (Math.cos(a) < 0) continue;
    c.beginPath();
    for (let y = 0; y <= top; y += 0.1) {
      const x = r(y) * Math.sin(a);
      if (y === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.strokeStyle = hex(s.hi, 0.55);
    c.lineWidth = sheet.px * 2;
    c.stroke();
  }
  c.restore();
  path(c);
  ink(c, s.ink, sheet.px * 2);
  path(g);
  g.save();
  g.clip();
  g.globalCompositeOperation = "destination-over";
  flood(sheet, () => path(g), top, 0.55);
  g.restore();

  // — the crown —
  if (o.crown === "cross") {
    // white glazed ceramic, faceted, set with glass
    const c0 = top - 0.2;
    const ch = H * 0.915 - c0;
    const rc = (y: number) => {
      const u = (y - c0) / ch;
      return Math.max(0.03, r(c0) * 1.35 * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * u)), 0.8) * (1 - 0.35 * u));
    };
    const cp = (ctx: Ctx) => profilePath(ctx, 0, c0, c0 + ch, rc, 120);
    cp(c);
    c.save();
    c.clip();
    facetBody(c, 0, c0, c0 + ch, rc, 12, STONE.ceramic, 0.02, 0.2);
    for (let y = c0 + 0.1; y < c0 + ch - 0.1; y += 0.16) {
      const rr = rc(y);
      for (let k = -3; k <= 3; k++) {
        const x = (k / 3.5) * rr * 0.85;
        c.fillStyle = "rgba(150,195,235,0.85)";
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + 0.035, y + 0.06);
        c.lineTo(x, y + 0.12);
        c.lineTo(x - 0.035, y + 0.06);
        c.fill();
      }
    }
    c.restore();
    cp(c);
    ink(c, "#6a6660", sheet.px * 1.6);
    cp(g);
    g.fillStyle = "rgba(255,246,228,0.9)";
    g.fill();
    cross(sheet, 0, c0 + ch - 0.05, H - (c0 + ch) - 0.02, R * 0.62);
  } else if (o.crown === "star") {
    const c0 = top - 0.15;
    const rc = (y: number) => {
      const u = (y - c0) / 0.9;
      return Math.max(0.02, R * 0.5 * Math.sin(Math.PI * Math.min(1, u)) + 0.02);
    };
    profilePath(c, 0, c0, c0 + 0.9, rc, 60);
    c.save();
    c.clip();
    roundBody(c, 0, c0, c0 + 0.9, rc, STONE.ceramic, 0.02);
    c.restore();
    profilePath(c, 0, c0, c0 + 0.9, rc, 60);
    ink(c, "#6a6660", sheet.px * 1.4);
    star(sheet, 0, H - R * 0.7, R * 0.7);
  } else {
    // a glazed bulb, and the Evangelist's winged symbol above it
    const c0 = top - 0.12;
    const bh = H * 0.07;
    const rc = (y: number) => Math.max(0.02, R * 0.42 * Math.pow(Math.sin(Math.PI * ((y - c0) / bh)), 0.7));
    profilePath(c, 0, c0, c0 + bh, rc, 50);
    c.save();
    c.clip();
    tesserae(c, -R, c0, R, c0 + bh, o.seed, ["#f5eee2", "#e9b736", "#f5eee2", "#c62f37"], R * 0.08);
    c.restore();
    profilePath(c, 0, c0, c0 + bh, rc, 50);
    ink(c, s.ink, sheet.px * 1.4);
    symbol(sheet, 0, c0 + bh * 0.85, R * 0.95, o.crown);
  }
  paper(sheet, o.seed + 1, 0.05);
}

// ---------------------------------------------------------------------------
// The Nativity façade: three portals, Faith, Hope and Charity, dripping stone.
// ---------------------------------------------------------------------------

export const NATIVITY = { w: 5.6, h: 6.7 };

export function nativityFacade(sheet: Sheet) {
  const c = sheet.c;
  const g = sheet.g;
  const s = STONE.nativity;
  const W = 2.75;
  const top = 4.3;
  const outline = (ctx: Ctx) => {
    ctx.beginPath();
    ctx.moveTo(-W, 0);
    ctx.lineTo(-W, top);
    // left side gable
    ctx.bezierCurveTo(-W + 0.3, top + 0.2, -1.75, top + 0.9, -1.47, top + 1.15);
    ctx.bezierCurveTo(-1.2, top + 0.9, -0.9, top + 0.4, -0.62, top + 0.35);
    // the great central gable, a mountain of carving
    ctx.bezierCurveTo(-0.62, top + 1.1, -0.35, top + 1.9, 0, top + 2.25);
    ctx.bezierCurveTo(0.35, top + 1.9, 0.62, top + 1.1, 0.62, top + 0.35);
    ctx.bezierCurveTo(0.9, top + 0.4, 1.2, top + 0.9, 1.47, top + 1.15);
    ctx.bezierCurveTo(1.75, top + 0.9, W - 0.3, top + 0.2, W, top);
    ctx.lineTo(W, 0);
    ctx.closePath();
  };
  outline(c);
  c.save();
  c.clip();
  const bg = c.createLinearGradient(-W, 0, W, 0);
  bg.addColorStop(0, s.hi);
  bg.addColorStop(0.5, s.mid);
  bg.addColorStop(1, s.lo);
  c.fillStyle = bg;
  c.fillRect(-W, 0, W * 2, NATIVITY.h);
  const v = c.createLinearGradient(0, 0, 0, NATIVITY.h);
  v.addColorStop(0, "rgba(40,25,12,0.25)");
  v.addColorStop(0.4, "rgba(40,25,12,0)");
  v.addColorStop(1, "rgba(255,240,210,0.15)");
  c.fillStyle = v;
  c.fillRect(-W, 0, W * 2, NATIVITY.h);
  // every surface crowded with carving
  relief(c, -W, 0, W, NATIVITY.h, 21, s, 1.1, 0.055);
  relief(c, -0.65, top, 0.65, NATIVITY.h, 22, s, 1.4, 0.04);

  // — three portals —
  const portal = (cx: number, pw: number, spring: number, apex: number, seed: number, main: boolean) => {
    // archivolts, stepping inwards
    for (let k = 3; k >= 0; k--) {
      const e = k * 0.07;
      archPath(c, cx, 0, pw + e * 2, spring, apex + e * 1.4);
      c.fillStyle = k === 0 ? "#1f130b" : mix(s.lo, s.mid, k / 4);
      c.fill();
      if (k > 0) {
        c.save();
        c.clip();
        relief(c, cx - pw, 0, cx + pw, apex + 0.4, seed + k, s, 1.3, 0.03);
        c.restore();
      }
    }
    // deep shadow inside
    archPath(c, cx, 0, pw, spring, apex);
    const dg = c.createLinearGradient(0, 0, 0, apex);
    dg.addColorStop(0, "#241710");
    dg.addColorStop(1, "#130b06");
    c.fillStyle = dg;
    c.fill();
    // the bronze doors, grown over with leaves (and the odd insect)
    c.save();
    archPath(c, cx, 0, pw, spring, apex);
    c.clip();
    const dh = spring * 0.62;
    const bronze = c.createLinearGradient(cx - pw / 2, 0, cx + pw / 2, 0);
    bronze.addColorStop(0, "#5f7a54");
    bronze.addColorStop(0.5, "#3f5a3c");
    bronze.addColorStop(1, "#2a3a28");
    c.fillStyle = bronze;
    c.fillRect(cx - pw / 2, 0, pw, dh);
    const lr = rng(seed + 40);
    for (let i = 0; i < 90 * pw; i++) {
      const x = cx - pw / 2 + lr() * pw;
      const y = lr() * dh;
      c.fillStyle = lr() > 0.5 ? "rgba(150,180,120,0.8)" : "rgba(40,60,35,0.8)";
      c.beginPath();
      c.ellipse(x, y, 0.035 + lr() * 0.03, 0.015, lr() * 3, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = "#1a120b";
    c.fillRect(cx - sheet.px, 0, sheet.px * 2, dh);
    // the sculpture groups in the tympanum
    const fr = rng(seed + 60);
    const figs = main ? 7 : 4;
    for (let i = 0; i < figs; i++) {
      const fx = cx + (i - (figs - 1) / 2) * (pw / (figs + 0.5));
      const fy = dh + 0.08 + (main && (i === 3) ? 0.18 : fr() * 0.1);
      const fh = main && i === 3 ? 0.42 : 0.28 + fr() * 0.08;
      c.fillStyle = mix(s.hi, "#ffffff", 0.25);
      c.beginPath();
      c.moveTo(fx - 0.05, fy);
      c.quadraticCurveTo(fx - 0.07, fy + fh * 0.6, fx - 0.03, fy + fh * 0.8);
      c.lineTo(fx + 0.03, fy + fh * 0.8);
      c.quadraticCurveTo(fx + 0.07, fy + fh * 0.6, fx + 0.05, fy);
      c.fill();
      circle(c, fx, fy + fh * 0.9, 0.035);
      c.fill();
    }
    if (main) {
      // the star of Bethlehem over the Holy Family
      c.fillStyle = "#f4cf5a";
      const sx = cx;
      const sy = apex - 0.35;
      c.beginPath();
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const rr = k % 2 ? 0.04 : 0.11;
        c.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr);
      }
      c.fill();
      // and the comet's tail
      c.strokeStyle = "rgba(244,207,90,0.8)";
      c.lineWidth = 0.02;
      c.beginPath();
      c.moveTo(sx, sy);
      c.quadraticCurveTo(sx - 0.2, sy - 0.25, sx - 0.18, sy - 0.55);
      c.stroke();
    }
    c.restore();
    // stone dripping from the arch like wax
    const pts: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const a = Math.PI * u;
      pts.push([cx - Math.cos(a) * (pw / 2 + 0.05), spring + Math.sin(a) * (apex - spring + 0.05)]);
    }
    drips(c, pts, seed + 7, s, 0.22, 0.05);
    archPath(c, cx, 0, pw + 0.3, spring, apex + 0.4);
    ink(c, hex(s.ink, 0.6), sheet.px * 1.4);
    // glow: the portals lit from within
    archPath(g, cx, 0, pw, spring, apex);
    const gg = g.createLinearGradient(0, 0, 0, apex);
    gg.addColorStop(0, "rgba(255,200,130,1)");
    gg.addColorStop(1, "rgba(255,170,90,0.6)");
    g.fillStyle = gg;
    g.fill();
  };
  portal(0, 0.78, 2.2, 3.75, 101, true);
  portal(-1.47, 0.52, 1.5, 2.75, 202, false);
  portal(1.47, 0.52, 1.5, 2.75, 303, false);
  // the two columns of the central portal, standing on turtles
  for (const x of [-0.5, 0.5]) {
    const cg = c.createLinearGradient(x - 0.05, 0, x + 0.05, 0);
    cg.addColorStop(0, s.hi);
    cg.addColorStop(1, s.lo);
    c.fillStyle = cg;
    c.fillRect(x - 0.045, 0.14, 0.09, 1.9);
    c.fillStyle = "#5c7a4a";
    c.beginPath();
    c.ellipse(x, 0.08, 0.13, 0.08, 0, 0, Math.PI * 2);
    c.fill();
    ink(c, s.ink, sheet.px);
  }
  // cornices between the storeys, softened by carving
  for (const y of [2.95, 3.9]) {
    c.fillStyle = hex(s.hi, 0.5);
    c.fillRect(-W, y, W * 2, 0.05);
    c.fillStyle = hex(s.lo, 0.5);
    c.fillRect(-W, y - 0.04, W * 2, 0.04);
  }
  // angels with trumpets on the upper storey
  const ar = rng(77);
  for (let i = 0; i < 6; i++) {
    const x = -1.9 + i * 0.76;
    if (Math.abs(x) < 0.5) continue;
    const y = 3.35 + ar() * 0.2;
    c.fillStyle = mix(s.hi, "#ffffff", 0.3);
    c.beginPath();
    c.moveTo(x - 0.06, y);
    c.lineTo(x + 0.06, y);
    c.lineTo(x + 0.03, y + 0.3);
    c.lineTo(x - 0.03, y + 0.3);
    c.fill();
    circle(c, x, y + 0.36, 0.045);
    c.fill();
    c.strokeStyle = "#e9c46a";
    c.lineWidth = 0.02;
    c.beginPath();
    c.moveTo(x + 0.03, y + 0.36);
    c.lineTo(x + 0.22, y + 0.46);
    c.stroke();
  }
  // snow-like drips along the gable edges
  const edge: [number, number][] = [];
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    edge.push([-0.62 + 1.24 * u, top + 0.35 + Math.sin(Math.PI * u) * 1.9]);
  }
  drips(c, edge, 55, s, 0.3, 0.04);
  grime(c, -W, 0.3, W, NATIVITY.h, 31, s.grime * 1.2);
  grain(c, -W, 0, W, NATIVITY.h, 32, 0.7, sheet.px);
  c.restore();
  outline(c);
  ink(c, s.ink, sheet.px * 2);
  // glow: floodlit stone behind the lit portals
  outline(g);
  g.save();
  g.clip();
  g.globalCompositeOperation = "destination-over";
  flood(sheet, () => outline(g), NATIVITY.h, 0.6);
  g.restore();
  paper(sheet, 4, 0.06);
}

/** The cypress: the Tree of Life, full of white doves, with the Tau on top. */
export const CYPRESS = { w: 1.3, h: 2.5 };

export function cypress(sheet: Sheet) {
  const c = sheet.c;
  const g = sheet.g;
  const h = 2.1;
  const shape = (ctx: Ctx) => {
    ctx.beginPath();
    ctx.moveTo(-0.46, 0.12);
    ctx.bezierCurveTo(-0.5, 0.8, -0.2, 1.6, 0, h);
    ctx.bezierCurveTo(0.2, 1.6, 0.5, 0.8, 0.46, 0.12);
    ctx.closePath();
  };
  // a rocky pedestal
  c.fillStyle = STONE.nativity.mid;
  c.beginPath();
  c.ellipse(0, 0.1, 0.52, 0.14, 0, 0, Math.PI * 2);
  c.fill();
  ink(c, STONE.nativity.ink, sheet.px * 1.4);
  shape(c);
  c.save();
  c.clip();
  const gr = c.createLinearGradient(-0.5, 0, 0.5, 0);
  gr.addColorStop(0, "#5e9a5a");
  gr.addColorStop(0.5, "#3b7646");
  gr.addColorStop(1, "#1f4a2e");
  c.fillStyle = gr;
  c.fillRect(-0.6, 0, 1.2, h);
  const r = rng(12);
  for (let i = 0; i < 1600; i++) {
    const y = r() * h;
    const x = (r() - 0.5) * 1.0;
    c.fillStyle = r() > 0.5 ? "rgba(140,190,120,0.55)" : "rgba(20,50,30,0.5)";
    c.beginPath();
    c.ellipse(x, y, 0.028, 0.012, 0.6 + r() * 0.6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  shape(c);
  ink(c, "#1c3322", sheet.px * 1.6);
  // the doves
  for (let i = 0; i < 16; i++) {
    const y = 0.3 + r() * 1.6;
    const wdt = 0.4 * (1 - y / h) + 0.05;
    const x = (r() - 0.5) * wdt * 1.6;
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.ellipse(x, y, 0.05, 0.028, r() - 0.5, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(x - 0.02, y + 0.01);
    c.lineTo(x - 0.07, y + 0.07);
    c.lineTo(x + 0.01, y + 0.02);
    c.fill();
    g.fillStyle = "rgba(255,255,255,0.8)";
    circle(g, x, y, 0.04);
    g.fill();
  }
  // the Tau cross and the X, in red and gold
  c.fillStyle = "#c62f37";
  c.fillRect(-0.025, h - 0.02, 0.05, 0.3);
  c.fillRect(-0.1, h + 0.24, 0.2, 0.05);
  ball(c, 0, h + 0.36, 0.05, "#e9b736", "#6b4a10");
  shape(g);
  g.save();
  g.clip();
  g.fillStyle = "rgba(120,200,130,0.5)";
  g.fillRect(-0.6, 0, 1.2, h);
  g.restore();
  paper(sheet, 5, 0.06);
}

// ---------------------------------------------------------------------------
// The nave: aisle wall with tracery windows and fruit on the pinnacles;
// the clerestory and roof above.
// ---------------------------------------------------------------------------

function tracery(sheet: Sheet, cx: number, y0: number, w: number, h: number, glass: string[], seed: number) {
  const c = sheet.c;
  const g = sheet.g;
  const s = STONE.modern;
  parabolaPath(c, cx, y0, w, h);
  c.fillStyle = "#2c3440";
  c.fill();
  // mullions and the bubbles of Gaudí's hyperboloid windows
  c.save();
  parabolaPath(c, cx, y0, w, h);
  c.clip();
  const r = rng(seed);
  c.fillStyle = s.hi;
  for (let k = 1; k < 4; k++) c.fillRect(cx - w / 2 + (w * k) / 4 - 0.012, y0, 0.024, h);
  for (let i = 0; i < 9; i++) {
    const x = cx + (r() - 0.5) * w * 0.8;
    const y = y0 + h * (0.35 + r() * 0.55);
    const rr = 0.05 + r() * 0.08;
    c.strokeStyle = s.hi;
    c.lineWidth = 0.022;
    circle(c, x, y, rr);
    c.stroke();
  }
  // stained glass, catching a little daylight
  for (let i = 0; i < 40; i++) {
    c.fillStyle = hex(glass[Math.floor(r() * glass.length)], 0.28);
    c.fillRect(cx + (r() - 0.5) * w, y0 + r() * h, 0.05, 0.08);
  }
  c.restore();
  parabolaPath(c, cx, y0, w, h);
  ink(c, s.ink, sheet.px * 1.4);
  // glow: coloured glass
  g.save();
  parabolaPath(g, cx, y0, w, h);
  g.clip();
  for (let i = 0; i < 220; i++) {
    g.fillStyle = glass[Math.floor(r() * glass.length)];
    g.fillRect(cx + (r() - 0.5) * w, y0 + r() * h, 0.04 + r() * 0.05, 0.05 + r() * 0.08);
  }
  g.fillStyle = s.hi;
  for (let k = 1; k < 4; k++) g.fillRect(cx - w / 2 + (w * k) / 4 - 0.01, y0, 0.02, h);
  g.restore();
}

function fruit(sheet: Sheet, x: number, y: number, seed: number) {
  const c = sheet.c;
  const s = STONE.modern;
  // a slender pinnacle carrying a bowl of fruit, in coloured glass
  c.beginPath();
  c.moveTo(x - 0.1, y);
  c.lineTo(x - 0.03, y + 0.45);
  c.lineTo(x + 0.03, y + 0.45);
  c.lineTo(x + 0.1, y);
  c.closePath();
  c.fillStyle = s.mid;
  c.fill();
  ink(c, s.ink, sheet.px);
  const r = rng(seed);
  const cols = ["#d9452f", "#f0a62a", "#e8d23a", "#7fae3a", "#b83a7a", "#f07a2a"];
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI;
    ball(c, x + Math.cos(a) * 0.08, y + 0.55 + Math.sin(a) * 0.08 + r() * 0.06, 0.05 + r() * 0.02, cols[Math.floor(r() * cols.length)], "#3a1a10");
  }
  const g = sheet.g;
  g.fillStyle = "rgba(255,180,90,0.9)";
  circle(g, x, y + 0.58, 0.13);
  g.fill();
}

export const NAVE_LOWER = { w: 4.8, h: 3.9 };

export function naveLower(sheet: Sheet) {
  const c = sheet.c;
  const s = STONE.modern;
  const W = 2.4;
  const wallTop = 3.0;
  c.beginPath();
  c.rect(-W, 0, W * 2, wallTop);
  c.save();
  c.clip();
  const bg = c.createLinearGradient(0, 0, 0, wallTop);
  bg.addColorStop(0, s.mid);
  bg.addColorStop(1, s.hi);
  c.fillStyle = bg;
  c.fillRect(-W, 0, W * 2, wallTop);
  grain(c, -W, 0, W, wallTop, 41, 0.6, sheet.px);
  c.restore();
  const bays = 5;
  const bw = (W * 2) / bays;
  for (let b = 0; b < bays; b++) {
    const cx = -W + bw * (b + 0.5);
    tracery(sheet, cx, 0.35, bw * 0.62, 1.35, GLASS, 50 + b);
    tracery(sheet, cx, 1.85, bw * 0.5, 0.95, GLASS, 60 + b);
    // buttress pilaster between bays
    const px = -W + bw * b;
    const pg = c.createLinearGradient(px - 0.07, 0, px + 0.07, 0);
    pg.addColorStop(0, s.hi);
    pg.addColorStop(1, s.lo);
    c.fillStyle = pg;
    c.fillRect(px - 0.07, 0, 0.14, wallTop);
  }
  c.fillStyle = s.hi;
  c.fillRect(-W, wallTop - 0.08, W * 2, 0.08);
  c.beginPath();
  c.rect(-W, 0, W * 2, wallTop);
  ink(c, s.ink, sheet.px * 1.6);
  for (let b = 0; b <= bays; b++) fruit(sheet, -W + bw * b + (b === 0 ? 0.12 : b === bays ? -0.12 : 0), wallTop, 70 + b);
  const g = sheet.g;
  g.save();
  g.globalCompositeOperation = "destination-over";
  g.fillStyle = "rgba(255,190,130,0.35)";
  g.fillRect(-W, 0, W * 2, wallTop);
  g.restore();
  paper(sheet, 6, 0.05);
}

export const NAVE_UPPER = { w: 5.0, h: 7.4 };

export function naveUpper(sheet: Sheet) {
  const c = sheet.c;
  const s = STONE.modern;
  const W = 2.5;
  const wallTop = 5.1;
  // clerestory
  c.fillStyle = s.mid;
  c.fillRect(-W, 0, W * 2, wallTop);
  const bays = 5;
  const bw = (W * 2) / bays;
  for (let b = 0; b < bays; b++) tracery(sheet, -W + bw * (b + 0.5), 3.2, bw * 0.5, 1.6, GLASS, 80 + b);
  // the roof: a row of pointed lanterns, like a range of little mountains
  const roof = (ctx: Ctx) => {
    ctx.beginPath();
    ctx.moveTo(-W, wallTop);
    for (let b = 0; b < bays; b++) {
      const x0 = -W + bw * b;
      ctx.bezierCurveTo(x0 + bw * 0.25, wallTop + 0.2, x0 + bw * 0.42, wallTop + 1.5, x0 + bw * 0.5, wallTop + 2.0);
      ctx.bezierCurveTo(x0 + bw * 0.58, wallTop + 1.5, x0 + bw * 0.75, wallTop + 0.2, x0 + bw, wallTop);
    }
    ctx.lineTo(W, wallTop - 0.01);
    ctx.lineTo(-W, wallTop - 0.01);
    ctx.closePath();
  };
  roof(c);
  c.save();
  c.clip();
  const rg = c.createLinearGradient(-W, 0, W, 0);
  rg.addColorStop(0, s.hi);
  rg.addColorStop(1, s.mid);
  c.fillStyle = rg;
  c.fillRect(-W, wallTop, W * 2, 2.2);
  relief(c, -W, wallTop, W, wallTop + 2.1, 90, s, 0.4, 0.04);
  c.restore();
  roof(c);
  ink(c, s.ink, sheet.px * 1.6);
  for (let b = 0; b < bays; b++) {
    const x = -W + bw * (b + 0.5);
    ball(c, x, wallTop + 2.05, 0.08, "#e9b736", "#6b4a10");
  }
  c.beginPath();
  c.rect(-W, 0, W * 2, wallTop);
  ink(c, s.ink, sheet.px * 1.4);
  const g = sheet.g;
  g.save();
  g.globalCompositeOperation = "destination-over";
  g.fillStyle = "rgba(255,190,130,0.3)";
  g.fillRect(-W, 0, W * 2, wallTop);
  roof(g);
  g.fill();
  g.restore();
  paper(sheet, 7, 0.05);
}

// ---------------------------------------------------------------------------
// The apse (1890s), its pinnacles; the apse roof; the crypt; the sacristies.
// ---------------------------------------------------------------------------

export const APSE = { w: 3.3, h: 6.5 };

export function apse(sheet: Sheet) {
  const c = sheet.c;
  const s = STONE.apse;
  const W = 1.6;
  const wallTop = 3.2;
  c.fillStyle = s.mid;
  c.beginPath();
  c.rect(-W, 0, W * 2, wallTop);
  c.save();
  c.clip();
  // a drum: lit on the left, turning away on the right
  roundBody(c, -0.3, 0, wallTop, () => W + 0.3, s, 0.05);
  relief(c, -W, 0, W, wallTop, 111, s, 0.35, 0.04);
  for (let k = 0; k < 5; k++) {
    const x = -W + 0.3 + k * 0.62;
    archPath(c, x, 0.5, 0.3, 1.2, 1.9);
    c.fillStyle = "#2c2a30";
    c.fill();
    ink(c, s.ink, sheet.px);
    archPath(sheet.g, x, 0.5, 0.3, 1.2, 1.9);
    sheet.g.fillStyle = GLASS_WARM[k % GLASS_WARM.length];
    sheet.g.fill();
  }
  grime(c, -W, 0.3, W, wallTop, 112, s.grime);
  grain(c, -W, 0, W, wallTop, 113, 0.6, sheet.px);
  c.restore();
  c.beginPath();
  c.rect(-W, 0, W * 2, wallTop);
  ink(c, s.ink, sheet.px * 1.6);
  // the pinnacles: slender, crowned with ears of wheat
  for (let k = 0; k < 6; k++) {
    const x = -W + 0.15 + k * 0.6;
    const h = 2.7 + (k % 2) * 0.35;
    const pr = (y: number) => 0.13 * Math.pow(1 - (y - wallTop) / h, 0.7) + 0.01;
    profilePath(c, x, wallTop, wallTop + h, pr, 40);
    c.save();
    c.clip();
    roundBody(c, x, wallTop, wallTop + h, pr, s, 0.03);
    c.restore();
    profilePath(c, x, wallTop, wallTop + h, pr, 40);
    ink(c, s.ink, sheet.px * 1.2);
    // wheat ears
    for (let e = 0; e < 5; e++) {
      c.fillStyle = "#e3c16a";
      c.beginPath();
      c.ellipse(x + (e % 2 ? 0.03 : -0.03), wallTop + h - 0.2 + e * 0.05, 0.03, 0.06, e % 2 ? -0.4 : 0.4, 0, Math.PI * 2);
      c.fill();
    }
  }
  const g = sheet.g;
  g.save();
  g.globalCompositeOperation = "destination-over";
  g.fillStyle = "rgba(255,190,130,0.4)";
  g.fillRect(-W, 0, W * 2, wallTop);
  g.restore();
  paper(sheet, 8, 0.06);
}

export const APSE_ROOF = { w: 3.8, h: 5.8 };

export function apseRoof(sheet: Sheet) {
  const c = sheet.c;
  const s = STONE.modern;
  const shape = (ctx: Ctx) => parabolaPath(ctx, 0, 3.0, 3.6, 2.6, 40);
  shape(c);
  c.save();
  c.clip();
  roundBody(c, 0, 3, 5.7, (y) => 1.8 * Math.sqrt(Math.max(0, 1 - (y - 3) / 2.6)), s, 0.03);
  for (let k = -4; k <= 4; k++) {
    c.strokeStyle = hex(s.lo, 0.4);
    c.lineWidth = 0.02;
    c.beginPath();
    c.moveTo(k * 0.42, 3);
    c.quadraticCurveTo(k * 0.25, 4.6, 0, 5.6);
    c.stroke();
  }
  c.restore();
  shape(c);
  ink(c, s.ink, sheet.px * 1.4);
  shape(sheet.g);
  sheet.g.fillStyle = "rgba(255,190,130,0.35)";
  sheet.g.fill();
  paper(sheet, 9, 0.05);
}

export const CRYPT = { w: 5.2, h: 1.2 };

export function crypt(sheet: Sheet) {
  const c = sheet.c;
  const s = STONE.apse;
  c.fillStyle = s.mid;
  c.fillRect(-2.6, 0, 5.2, 1.0);
  c.save();
  c.beginPath();
  c.rect(-2.6, 0, 5.2, 1.0);
  c.clip();
  roundBody(c, 0, 0, 1.0, () => 2.6, s, 0.05);
  // del Villar's neo-Gothic: lancets and buttresses, very correct
  for (let k = 0; k < 8; k++) {
    const x = -2.3 + k * 0.66;
    archPath(c, x, 0.2, 0.18, 0.4, 0.62);
    c.fillStyle = "#2a2522";
    c.fill();
    c.fillStyle = s.lo;
    c.fillRect(x + 0.3, 0, 0.1, 1.0);
  }
  grain(c, -2.6, 0, 2.6, 1, 120, 0.6, sheet.px);
  c.restore();
  c.fillStyle = s.hi;
  c.fillRect(-2.65, 0.95, 5.3, 0.1);
  c.beginPath();
  c.rect(-2.6, 0, 5.2, 1.05);
  ink(c, s.ink, sheet.px * 1.4);
  paper(sheet, 10, 0.05);
}

export const SACRISTY = { w: 2.2, h: 4.4 };

export function sacristy(sheet: Sheet) {
  const c = sheet.c;
  const s = STONE.modern;
  c.beginPath();
  c.rect(-0.95, 0, 1.9, 1.4);
  c.save();
  c.clip();
  roundBody(c, 0, 0, 1.4, () => 0.95, s, 0.04);
  for (let k = -2; k <= 2; k++) {
    archPath(c, k * 0.34, 0.3, 0.14, 0.4, 0.62);
    c.fillStyle = "#2c3440";
    c.fill();
  }
  c.restore();
  c.beginPath();
  c.rect(-0.95, 0, 1.9, 1.4);
  ink(c, s.ink, sheet.px * 1.4);
  // the dome: twelve ribs rising to a mosaic pinnacle
  const dome = (y: number) => 0.95 * Math.pow(Math.max(0, 1 - (y - 1.4) / 2.5), 0.55);
  profilePath(c, 0, 1.4, 3.9, dome, 60);
  c.save();
  c.clip();
  facetBody(c, 0, 1.4, 3.9, dome, 12, s, 0.025, 0.1);
  for (let y = 1.7; y < 3.5; y += 0.3) {
    const rr = dome(y);
    for (let k = -2; k <= 2; k++) {
      c.fillStyle = "#2c3440";
      c.fillRect(k * rr * 0.36 - 0.02, y, 0.04, 0.12);
    }
  }
  c.restore();
  profilePath(c, 0, 1.4, 3.9, dome, 60);
  ink(c, s.ink, sheet.px * 1.4);
  archPath(c, 0, 3.8, 0.24, 0.1, 0.5);
  c.save();
  c.clip();
  tesserae(c, -0.2, 3.8, 0.2, 4.3, 130, MOSAIC_NATIVITY, 0.03);
  c.restore();
  ball(c, 0, 4.33, 0.05, "#f7f3ea", "#6b5a44");
  profilePath(sheet.g, 0, 0, 3.9, (y) => (y < 1.4 ? 0.95 : dome(y)), 60);
  sheet.g.fillStyle = "rgba(255,190,130,0.4)";
  sheet.g.fill();
  paper(sheet, 11, 0.05);
}

// ---------------------------------------------------------------------------
// The Passion façade (seen from its own side): six leaning columns like bones,
// a canopy of eighteen more, and the Crucifixion in hard, angular stone.
// ---------------------------------------------------------------------------

export const PASSION = { w: 5.6, h: 6.2 };

export function passionFacade(sheet: Sheet) {
  const c = sheet.c;
  const g = sheet.g;
  const s = STONE.passion;
  const W = 2.75;
  // the deep portico: a wall in shadow
  c.fillStyle = mix(s.lo, "#3a342b", 0.4);
  c.fillRect(-W, 0, W * 2, 4.4);
  const r = rng(140);
  // the bronze doors of the Gospel, covered in letters
  c.fillStyle = "#6b5a3a";
  c.fillRect(-0.9, 0, 1.8, 1.9);
  c.fillStyle = "rgba(230,200,140,0.8)";
  for (let y = 0.1; y < 1.8; y += 0.07) {
    for (let x = -0.85; x < 0.85; x += 0.05) {
      if (r() < 0.6) c.fillRect(x, y, 0.03, 0.035);
    }
  }
  // the Crucifixion, angular, above the door
  c.fillStyle = s.hi;
  c.fillRect(-0.03, 2.4, 0.06, 1.2);
  c.fillRect(-0.35, 3.25, 0.7, 0.05);
  c.beginPath();
  c.moveTo(-0.08, 2.6);
  c.lineTo(0.08, 2.6);
  c.lineTo(0.05, 3.2);
  c.lineTo(-0.3, 3.28);
  c.lineTo(0.3, 3.28);
  c.lineTo(-0.05, 3.2);
  c.closePath();
  c.fill();
  // mourners, in hard planes
  for (let k = -3; k <= 3; k++) {
    if (k === 0) continue;
    const x = k * 0.32;
    c.fillStyle = k % 2 ? s.hi : s.mid;
    c.beginPath();
    c.moveTo(x - 0.08, 2.0);
    c.lineTo(x + 0.08, 2.0);
    c.lineTo(x + 0.04, 2.45);
    c.lineTo(x, 2.55);
    c.lineTo(x - 0.04, 2.45);
    c.closePath();
    c.fill();
  }
  // six columns, leaning out like the bones of a ribcage
  for (let k = 0; k < 6; k++) {
    const xb = [-2.1, -1.35, -0.55, 0.55, 1.35, 2.1][k];
    const xt = xb * 1.18;
    const cg = c.createLinearGradient(xb - 0.15, 0, xb + 0.15, 0);
    cg.addColorStop(0, s.hi);
    cg.addColorStop(0.6, s.mid);
    cg.addColorStop(1, s.lo);
    c.fillStyle = cg;
    c.beginPath();
    c.moveTo(xb - 0.12, 0);
    c.bezierCurveTo(xb - 0.05, 1.2, xt - 0.2, 2.8, xt - 0.16, 4.3);
    c.lineTo(xt + 0.16, 4.3);
    c.bezierCurveTo(xt + 0.2, 2.8, xb + 0.05, 1.2, xb + 0.12, 0);
    c.closePath();
    c.fill();
    ink(c, s.ink, sheet.px * 1.4);
    // the knuckles of the bone
    c.fillStyle = s.hi;
    c.beginPath();
    c.ellipse(xb, 0.6, 0.14, 0.07, 0, 0, Math.PI * 2);
    c.fill();
  }
  // the canopy and its eighteen bone-like struts
  c.fillStyle = s.mid;
  c.beginPath();
  c.moveTo(-W, 4.3);
  c.lineTo(W, 4.3);
  c.lineTo(W - 0.2, 4.75);
  c.lineTo(-W + 0.2, 4.75);
  c.closePath();
  c.fill();
  ink(c, s.ink, sheet.px * 1.6);
  for (let k = 0; k < 18; k++) {
    const x = -2.45 + (k / 17) * 4.9;
    const h = 0.7 + Math.sin((k / 17) * Math.PI) * 0.85;
    const bg = c.createLinearGradient(x - 0.05, 0, x + 0.05, 0);
    bg.addColorStop(0, s.hi);
    bg.addColorStop(1, s.lo);
    c.fillStyle = bg;
    c.beginPath();
    c.moveTo(x - 0.06, 4.75);
    c.quadraticCurveTo(x - 0.02, 4.75 + h * 0.5, x - 0.04, 4.75 + h);
    c.lineTo(x + 0.04, 4.75 + h);
    c.quadraticCurveTo(x + 0.02, 4.75 + h * 0.5, x + 0.06, 4.75);
    c.closePath();
    c.fill();
    ink(c, s.ink, sheet.px);
  }
  // the risen Christ, in gold, at the very top
  ball(c, 0, 6.0, 0.08, "#e9b736", "#6b4a10");
  c.save();
  c.beginPath();
  c.rect(-W, 0, W * 2, 6.2);
  c.clip();
  grain(c, -W, 0, W, 6.2, 141, 0.5, sheet.px);
  c.restore();
  g.fillStyle = "rgba(255,200,140,0.5)";
  g.fillRect(-W, 0, W * 2, 4.8);
  paper(sheet, 12, 0.05);
}

// ---------------------------------------------------------------------------
// The Glory façade (from the side, unfinished), the workshop, the schools.
// ---------------------------------------------------------------------------

export const GLORY = { w: 2.8, h: 3.6 };

export function glory(sheet: Sheet) {
  const c = sheet.c;
  const s = STONE.modern;
  const r = rng(150);
  c.fillStyle = "#b9b4aa";
  c.fillRect(-1.3, 0, 2.6, 2.6);
  // concrete columns and their formwork
  for (let k = 0; k < 5; k++) {
    const x = -1.1 + k * 0.55;
    const h = 2.6 + r() * 0.9;
    const cg = c.createLinearGradient(x - 0.1, 0, x + 0.1, 0);
    cg.addColorStop(0, s.hi);
    cg.addColorStop(1, "#8f8a82");
    c.fillStyle = cg;
    c.fillRect(x - 0.1, 0, 0.2, h);
    ink(c, s.ink, sheet.px);
    // rebar sticking out of the top
    c.strokeStyle = "#6a4a3a";
    c.lineWidth = sheet.px * 1.5;
    for (let b = 0; b < 4; b++) {
      c.beginPath();
      c.moveTo(x - 0.08 + b * 0.05, h);
      c.lineTo(x - 0.08 + b * 0.05 + (r() - 0.5) * 0.04, h + 0.2 + r() * 0.1);
      c.stroke();
    }
  }
  c.fillStyle = "#d8d2c6";
  c.fillRect(-1.3, 1.25, 2.6, 0.12);
  c.fillRect(-1.3, 2.5, 2.6, 0.12);
  c.beginPath();
  c.rect(-1.3, 0, 2.6, 2.62);
  ink(c, s.ink, sheet.px * 1.2);
  paper(sheet, 13, 0.05);
}

export const WORKSHOP = { w: 2.3, h: 1.35 };

export function workshop(sheet: Sheet) {
  const c = sheet.c;
  c.fillStyle = "#b08a5e";
  c.fillRect(-1.05, 0, 2.1, 0.85);
  for (let x = -1.05; x < 1.05; x += 0.09) {
    c.fillStyle = x % 0.18 < 0.09 ? "rgba(90,60,30,0.25)" : "rgba(255,240,210,0.12)";
    c.fillRect(x, 0, 0.09, 0.85);
  }
  c.beginPath();
  c.moveTo(-1.15, 0.85);
  c.lineTo(0, 1.3);
  c.lineTo(1.15, 0.85);
  c.closePath();
  c.fillStyle = "#b4634a";
  c.fill();
  ink(c, "#3a2616", sheet.px * 1.4);
  for (const x of [-0.6, 0, 0.6]) {
    c.fillStyle = "#2a2018";
    c.fillRect(x - 0.12, 0.35, 0.24, 0.3);
    sheet.g.fillStyle = "rgba(255,200,120,1)";
    sheet.g.fillRect(x - 0.12, 0.35, 0.24, 0.3);
  }
  c.fillStyle = "#3a2618";
  c.fillRect(-0.9, 0, 0.3, 0.6);
  c.beginPath();
  c.rect(-1.05, 0, 2.1, 0.85);
  ink(c, "#3a2616", sheet.px * 1.4);
  text(c, "TALLER", 0.35, 0.74, 0.09, SANS, "#f4e6c2");
  paper(sheet, 14, 0.05);
}

export const SCHOOLS = { w: 2.5, h: 1.05 };

export function schools(sheet: Sheet) {
  const c = sheet.c;
  // brick walls that ripple, under a roof that waves
  const wave = (x: number) => 0.72 + Math.sin(x * 6) * 0.1;
  c.beginPath();
  c.moveTo(-1.15, 0);
  for (let x = -1.15; x <= 1.15; x += 0.02) c.lineTo(x, wave(x));
  c.lineTo(1.15, 0);
  c.closePath();
  c.fillStyle = "#b86c4d";
  c.fill();
  c.save();
  c.clip();
  for (let y = 0; y < 1; y += 0.05) {
    for (let x = -1.2 + ((y * 20) % 2) * 0.05; x < 1.2; x += 0.1) {
      c.fillStyle = `rgba(${Math.random() > 0.5 ? "255,220,190" : "90,40,20"},0.12)`;
      c.fillRect(x, y, 0.09, 0.04);
    }
  }
  c.restore();
  c.strokeStyle = "#7a3f28";
  c.lineWidth = 0.05;
  c.beginPath();
  for (let x = -1.2; x <= 1.2; x += 0.02) c.lineTo(x, wave(x) + 0.03);
  c.stroke();
  for (const x of [-0.7, -0.2, 0.3, 0.8]) {
    c.fillStyle = "#2a2018";
    c.fillRect(x - 0.1, 0.2, 0.2, 0.3);
    sheet.g.fillStyle = "rgba(255,200,120,1)";
    sheet.g.fillRect(x - 0.1, 0.2, 0.2, 0.3);
  }
  ink(c, "#3a2616", sheet.px);
  paper(sheet, 15, 0.05);
}

// ---------------------------------------------------------------------------
// Scaffolding, painted as a repeating tile.
// ---------------------------------------------------------------------------

export function scaffoldTile(kind: "timber" | "steel") {
  const size = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const c = cv.getContext("2d")!;
  const r = rng(kind === "timber" ? 7 : 8);
  if (kind === "steel") {
    // steel tubes, boards, and a loose green safety net
    c.clearRect(0, 0, size, size);
    c.strokeStyle = "rgba(70,140,95,0.55)";
    c.lineWidth = 1;
    for (let k = -size; k < size * 2; k += 16) {
      c.beginPath();
      c.moveTo(k, 0);
      c.lineTo(k + size, size);
      c.moveTo(k, size);
      c.lineTo(k + size, 0);
      c.stroke();
    }
    c.strokeStyle = "#b9bec2";
    c.lineWidth = 6;
    for (const x of [10, 138]) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, size);
      c.stroke();
    }
    c.lineWidth = 4;
    for (const y of [26, 154]) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(size, y);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(10, 154);
    c.lineTo(138, 26);
    c.stroke();
    c.fillStyle = "#d9b24a";
    c.fillRect(0, 150, size, 8);
    c.fillRect(0, 22, size, 8);
    // a worker in a hard hat
    c.fillStyle = "#f07a1a";
    c.fillRect(70, 130, 10, 20);
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(75, 125, 5, 0, Math.PI * 2);
    c.fill();
  } else {
    c.clearRect(0, 0, size, size);
    // poles, ledgers, braces and planks, lashed with rope
    c.strokeStyle = "#6b4a2c";
    c.lineCap = "round";
    c.lineWidth = 7;
    for (const x of [12, 132]) {
      c.beginPath();
      c.moveTo(x + r() * 3, 0);
      c.lineTo(x + r() * 3, size);
      c.stroke();
    }
    c.lineWidth = 5;
    for (const y of [60, 188]) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(size, y + r() * 4);
      c.stroke();
    }
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(12, 60);
    c.lineTo(132, 188);
    c.stroke();
    c.fillStyle = "#a07a4a";
    c.fillRect(0, 52, size, 9);
    c.fillRect(0, 180, size, 9);
    c.strokeStyle = "#d8c39a";
    c.lineWidth = 2;
    for (const [x, y] of [
      [12, 60],
      [132, 60],
      [12, 188],
      [132, 188],
    ]) {
      c.beginPath();
      c.arc(x, y, 6, 0, Math.PI * 2);
      c.stroke();
    }
    // a ladder
    c.strokeStyle = "#7a5634";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(200, 0);
    c.lineTo(200, size);
    c.moveTo(222, 0);
    c.lineTo(222, size);
    c.stroke();
    for (let y = 8; y < size; y += 18) {
      c.beginPath();
      c.moveTo(200, y);
      c.lineTo(222, y);
      c.stroke();
    }
  }
  return cv;
}
