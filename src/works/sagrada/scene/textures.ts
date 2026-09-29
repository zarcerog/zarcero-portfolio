// The paint shop. Every surface in the picture is painted here, on canvases,
// at runtime: nothing is downloaded but the code.

import * as THREE from "three";

import { canvasTexture, rng } from "@/stage3d/lib/canvas";

type Ctx = CanvasRenderingContext2D;

const memo = new Map<string, unknown>();
function once<T>(key: string, make: () => T): T {
  if (!memo.has(key)) memo.set(key, make());
  return memo.get(key) as T;
}

function repeat(t: THREE.Texture, x = 1, y = 1) {
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(x, y);
  return t;
}

/** Speckle + blotches: the grain of cut sandstone. */
function stoneGrain(ctx: Ctx, w: number, h: number, seed: number, dark = 0.1, light = 0.08) {
  const r = rng(seed);
  for (let i = 0; i < (w * h) / 60; i++) {
    const v = r();
    ctx.fillStyle = v > 0.5 ? `rgba(255,248,230,${r() * light})` : `rgba(40,25,10,${r() * dark})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? "70,50,30" : "255,245,225"},${0.02 + r() * 0.04})`;
    ctx.beginPath();
    ctx.ellipse(r() * w, r() * h, 10 + r() * 60, 6 + r() * 30, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Soot and rain streaks for the old stone. */
function weather(ctx: Ctx, w: number, h: number, seed: number, amount: number) {
  const r = rng(seed);
  for (let i = 0; i < 90 * amount; i++) {
    const x = r() * w;
    const y = r() * h * 0.7;
    const len = 30 + r() * 160;
    const g = ctx.createLinearGradient(0, y, 0, y + len);
    const a = 0.05 + r() * 0.12 * amount;
    g.addColorStop(0, `rgba(30,22,16,${a})`);
    g.addColorStop(1, "rgba(30,22,16,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, 2 + r() * 6, len);
  }
}

/** Ashlar coursing: faint joints every so often. */
function courses(ctx: Ctx, w: number, h: number, rows: number, cols: number, a = 0.14) {
  ctx.strokeStyle = `rgba(40,28,18,${a})`;
  ctx.lineWidth = 1.2;
  for (let y = 0; y < rows; y++) {
    const yy = (y / rows) * h;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(w, yy);
    ctx.stroke();
    const off = (y % 2) * 0.5;
    for (let x = 0; x < cols; x++) {
      const xx = ((x + off) / cols) * w;
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx, yy + h / rows);
      ctx.stroke();
    }
  }
}

export interface Stone {
  map: THREE.Texture;
  bump: THREE.Texture;
}

/** A plain stone surface (walls, footings, the crypt). */
export function stone(seed = 1, aged = 0.6): Stone {
  return once(`stone:${seed}:${aged}`, () => {
    const draw = (bump: boolean) => (ctx: Ctx, w: number, h: number) => {
      ctx.fillStyle = bump ? "#808080" : "#ffffff";
      ctx.fillRect(0, 0, w, h);
      stoneGrain(ctx, w, h, seed, bump ? 0.3 : 0.12, bump ? 0.3 : 0.1);
      courses(ctx, w, h, 8, 3, bump ? 0.5 : 0.12);
      if (!bump) weather(ctx, w, h, seed + 7, aged);
    };
    return {
      map: repeat(canvasTexture(256, 256, draw(false))),
      bump: repeat(canvasTexture(256, 256, draw(true), { srgb: false })),
    };
  });
}

/** A lattice for scaffolding, cranes and derricks (alpha-tested). */
export function lattice(kind: "steel" | "timber" | "scaffold") {
  return once(`lattice:${kind}`, () =>
    repeat(
      canvasTexture(128, 128, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        const c = kind === "timber" ? "#6b4a2c" : kind === "steel" ? "#ffffff" : "#8c8d8f";
        ctx.strokeStyle = c;
        ctx.lineWidth = kind === "scaffold" ? 6 : 10;
        ctx.strokeRect(0, 0, w, h);
        ctx.lineWidth = kind === "scaffold" ? 4 : 7;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w, h);
        if (kind !== "scaffold") {
          ctx.moveTo(w, 0);
          ctx.lineTo(0, h);
        }
        ctx.stroke();
        if (kind === "scaffold") {
          ctx.fillStyle = "rgba(120,96,60,1)";
          ctx.fillRect(0, h - 10, w, 8);
        }
      }),
    ),
  );
}

/** A soft round sprite for glows, sparks, lamps and drones. */
export function dot(inner = "rgba(255,255,255,1)") {
  return once(`dot:${inner}`, () =>
    canvasTexture(64, 64, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, inner);
      g.addColorStop(0.18, inner.replace(/[\d.]+\)$/, "0.9)"));
      g.addColorStop(0.45, inner.replace(/[\d.]+\)$/, "0.22)"));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }),
  );
}

/** A painted cumulus: soft, lit from the top-left, grey in the belly. */
export function cloudTexture(seed: number) {
  return once(`cloud:${seed}`, () =>
    canvasTexture(512, 256, (ctx, w, h) => {
      const r = rng(seed);
      const puffs: [number, number, number][] = [];
      const n = 14 + Math.floor(r() * 8);
      for (let i = 0; i < n; i++) {
        const u = r();
        const x = w * (0.18 + u * 0.64);
        const top = Math.sin(u * Math.PI);
        const y = h * (0.62 - top * 0.22 - r() * 0.12);
        const rad = h * (0.12 + top * 0.16 + r() * 0.08);
        puffs.push([x, y, rad]);
      }
      // belly shadow first, then lit puffs, then highlights
      for (const [x, y, rad] of puffs) {
        const g = ctx.createRadialGradient(x, y + rad * 0.3, rad * 0.1, x, y + rad * 0.2, rad * 1.15);
        g.addColorStop(0, "rgba(206,208,220,0.95)");
        g.addColorStop(0.7, "rgba(190,194,210,0.6)");
        g.addColorStop(1, "rgba(190,194,210,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y + rad * 0.2, rad * 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const [x, y, rad] of puffs) {
        const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.35, rad * 0.05, x, y, rad);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.6, "rgba(250,248,245,0.85)");
        g.addColorStop(1, "rgba(240,240,242,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      // flatten the base
      const fade = ctx.createLinearGradient(0, h * 0.7, 0, h * 0.86);
      fade.addColorStop(0, "rgba(0,0,0,0)");
      fade.addColorStop(1, "rgba(0,0,0,1)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = fade;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);
      ctx.globalCompositeOperation = "source-over";
    }),
  );
}

/** Smoke puff (for the tile works, the fire, and the kilns). */
export function smokeTexture() {
  return once("smoke", () =>
    canvasTexture(128, 128, (ctx, w, h) => {
      const r = rng(41);
      for (let i = 0; i < 14; i++) {
        const x = w * (0.3 + r() * 0.4);
        const y = h * (0.3 + r() * 0.4);
        const rad = w * (0.15 + r() * 0.2);
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, "rgba(255,255,255,0.35)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    }),
  );
}

/** A flame tongue. */
export function flameTexture() {
  return once("flame", () =>
    canvasTexture(64, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h * 0.78, 2, w / 2, h * 0.62, h * 0.5);
      g.addColorStop(0, "rgba(255,245,200,1)");
      g.addColorStop(0.25, "rgba(255,190,80,0.95)");
      g.addColorStop(0.6, "rgba(230,80,20,0.6)");
      g.addColorStop(1, "rgba(120,20,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.quadraticCurveTo(w * 1.05, h * 0.7, w / 2, h);
      ctx.quadraticCurveTo(-w * 0.05, h * 0.7, w / 2, 0);
      ctx.fill();
    }),
  );
}

/** A gull's wing from above: grey mantle, black tips with white spots. */
export function wingTexture() {
  return once("wing", () =>
    canvasTexture(128, 64, (ctx, w, h) => {
      ctx.fillStyle = "#eef0f2";
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(238,240,242,1)");
      g.addColorStop(0.55, "rgba(230,232,236,1)");
      g.addColorStop(0.68, "rgba(28,28,32,1)");
      g.addColorStop(1, "rgba(20,20,24,1)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(w * 0.88, h * 0.5, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }),
  );
}

/** Fields, streets and sea are painted in the ground's shader; this is its grain. */
export function grainTexture() {
  return once("grain", () =>
    repeat(
      canvasTexture(
        256,
        256,
        (ctx, w, h) => {
          const img = ctx.createImageData(w, h);
          const r = rng(51);
          for (let i = 0; i < w * h; i++) {
            const v = 100 + r() * 155;
            img.data[i * 4] = v;
            img.data[i * 4 + 1] = 100 + r() * 155;
            img.data[i * 4 + 2] = 100 + r() * 155;
            img.data[i * 4 + 3] = 255;
          }
          ctx.putImageData(img, 0, 0);
        },
        { srgb: false },
      ),
    ),
  );
}

/** Text drawn as points: used by the drones. Returns normalised [x, y] pairs. */
export function textPoints(text: string, count: number, font: string, seed = 7) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 200;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#fff";
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, c.width / 2, c.height / 2 + 6);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const pts: [number, number][] = [];
  const step = 4;
  for (let y = 0; y < c.height; y += step) {
    for (let x = 0; x < c.width; x += step) {
      if (data[(y * c.width + x) * 4] > 128) pts.push([x / c.width - 0.5, 0.5 - y / c.height]);
    }
  }
  // choose `count` of them, evenly
  const r = rng(seed);
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  const out: [number, number][] = [];
  for (let i = 0; i < count; i++) out.push(pts[i % Math.max(1, pts.length)] ?? [0, 0]);
  return out;
}
