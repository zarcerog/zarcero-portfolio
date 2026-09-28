// Procedural textures, painted on canvases at runtime. Nothing is downloaded:
// the wood, the velvet pile, the brick and every sign are drawn here.

import * as THREE from "three";

export { font, loadFonts, setFonts, type FontSet } from "./fonts";

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export function canvasTexture(
  w: number,
  h: number,
  draw: Draw,
  { srgb = true, repeat = false }: { srgb?: boolean; repeat?: boolean } = {},
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  tex.needsUpdate = true;
  return tex;
}

// deterministic noise so every visit paints the same boards
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Stage floorboards: colour + roughness. */
export function woodTextures() {
  const r = rng(7);
  const planks = 10;
  const boards: { tone: number; grain: number; seed: number }[] = [];
  for (let i = 0; i < planks * 3; i++) boards.push({ tone: r(), grain: r(), seed: r() * 1000 });

  const paint = (rough: boolean): Draw => (ctx, w, h) => {
    const pw = w / planks;
    for (let i = 0; i < planks; i++) {
      // boards are staggered along their length
      const segs = 3;
      const offset = (i % 3) * (h / 3) * 0.37;
      for (let s = -1; s < segs; s++) {
        const b = boards[(i * 3 + s + 3) % boards.length];
        const y0 = offset + (s * h) / segs;
        const y1 = y0 + h / segs;
        if (rough) {
          const v = 120 + b.tone * 60;
          ctx.fillStyle = `rgb(${v},${v},${v})`;
        } else {
          const l = 30 + b.tone * 9;
          ctx.fillStyle = `hsl(${24 + b.tone * 8}, ${38 + b.grain * 12}%, ${l}%)`;
        }
        ctx.fillRect(i * pw, y0, pw, y1 - y0);
        // grain
        const gr = rng(Math.floor(b.seed));
        for (let g = 0; g < 26; g++) {
          const gx = i * pw + gr() * pw;
          ctx.strokeStyle = rough
            ? `rgba(255,255,255,${0.05 + gr() * 0.08})`
            : `rgba(${gr() > 0.5 ? "20,10,4" : "255,220,170"},${0.05 + gr() * 0.08})`;
          ctx.lineWidth = 0.6 + gr() * 1.6;
          ctx.beginPath();
          let x = gx;
          ctx.moveTo(x, y0);
          for (let y = y0; y < y1; y += 16) {
            x += (gr() - 0.5) * 1.6;
            ctx.lineTo(Math.min(i * pw + pw - 1, Math.max(i * pw + 1, x)), y);
          }
          ctx.stroke();
        }
        // end joint
        ctx.fillStyle = rough ? "rgba(255,255,255,0.4)" : "rgba(10,4,2,0.55)";
        ctx.fillRect(i * pw, y0, pw, 2);
      }
      // seam
      ctx.fillStyle = rough ? "rgba(255,255,255,0.5)" : "rgba(8,3,1,0.7)";
      ctx.fillRect(i * pw, 0, 2, h);
    }
    // scuffs and tape marks from a thousand rehearsals
    const sr = rng(99);
    for (let k = 0; k < 40; k++) {
      ctx.fillStyle = rough ? `rgba(255,255,255,${0.08 + sr() * 0.1})` : `rgba(255,235,200,${0.02 + sr() * 0.04})`;
      ctx.beginPath();
      ctx.ellipse(sr() * w, sr() * h, 10 + sr() * 50, 3 + sr() * 12, sr() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!rough) {
      ctx.fillStyle = "rgba(240,215,140,0.55)";
      for (let k = 0; k < 6; k++) ctx.fillRect(sr() * w, sr() * h, 22, 5);
    }
  };
  const map = canvasTexture(1024, 1024, paint(false), { repeat: true });
  const roughnessMap = canvasTexture(1024, 1024, paint(true), { srgb: false, repeat: true });
  return { map, roughnessMap };
}

/** Velvet pile: faint vertical streaks, used as a multiply map. */
export function velvetTexture() {
  return canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      const r = rng(3);
      for (let i = 0; i < 900; i++) {
        const x = r() * w;
        const a = 0.03 + r() * 0.07;
        ctx.fillStyle = `rgba(0,0,0,${a})`;
        ctx.fillRect(x, r() * h, 1 + r() * 2, 20 + r() * 120);
      }
    },
    { repeat: true },
  );
}

/** Damask wallpaper for the auditorium. */
export function damaskTexture(base = "#4a141b", ink = "rgba(240,190,120,0.10)") {
  return canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = ink;
      const motif = (cx: number, cy: number, s: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(s, s);
        ctx.beginPath();
        ctx.moveTo(0, -60);
        ctx.bezierCurveTo(30, -40, 36, -10, 0, 10);
        ctx.bezierCurveTo(-36, -10, -30, -40, 0, -60);
        ctx.moveTo(0, 10);
        ctx.bezierCurveTo(40, 20, 44, 60, 0, 60);
        ctx.bezierCurveTo(-44, 60, -40, 20, 0, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-38, 0, 8, 0, Math.PI * 2);
        ctx.arc(38, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      motif(w / 2, h / 2, 1);
      motif(0, 0, 1);
      motif(w, 0, 1);
      motif(0, h, 1);
      motif(w, h, 1);
    },
    { repeat: true },
  );
}

/** Backstage brick, colour + bump. */
export function brickTextures() {
  const r = rng(11);
  const rows = 16;
  const cols = 6;
  const paint = (bump: boolean): Draw => (ctx, w, h) => {
    ctx.fillStyle = bump ? "#222" : "#4b2c24";
    ctx.fillRect(0, 0, w, h);
    const bh = h / rows;
    const bw = w / cols;
    for (let y = 0; y < rows; y++) {
      const off = (y % 2) * bw * 0.5;
      for (let x = -1; x < cols + 1; x++) {
        const t = r();
        if (bump) {
          ctx.fillStyle = `rgb(${190 + t * 50},${190 + t * 50},${190 + t * 50})`;
        } else {
          ctx.fillStyle = `hsl(${10 + t * 12}, ${34 + t * 16}%, ${26 + t * 12}%)`;
        }
        ctx.fillRect(x * bw + off + 3, y * bh + 3, bw - 6, bh - 6);
        if (!bump) {
          for (let k = 0; k < 6; k++) {
            ctx.fillStyle = `rgba(0,0,0,${r() * 0.12})`;
            ctx.fillRect(x * bw + off + 3 + r() * bw, y * bh + 3 + r() * bh, 4 + r() * 10, 2 + r() * 5);
          }
        }
      }
    }
    if (!bump) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(0,0,0,0.25)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  };
  return {
    map: canvasTexture(512, 512, paint(false), { repeat: true }),
    bumpMap: canvasTexture(512, 512, paint(true), { srgb: false, repeat: true }),
  };
}

/** Painted scenery cloths for Act III. */
export function dropTexture(kind: string, bg: string, fg: string) {
  return canvasTexture(1024, 640, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    if (kind === "stripes") {
      for (let x = 0; x < w; x += 64) ctx.fillRect(x, 0, 32, h);
    } else if (kind === "diamonds") {
      const dw = 80;
      const dh = 120;
      for (let y = -dh; y < h + dh; y += dh) {
        for (let x = -dw; x < w + dw; x += dw) {
          const ox = ((y / dh) % 2) * (dw / 2);
          ctx.beginPath();
          ctx.moveTo(x + ox, y);
          ctx.lineTo(x + ox + dw / 2, y + dh / 2);
          ctx.lineTo(x + ox, y + dh);
          ctx.lineTo(x + ox - dw / 2, y + dh / 2);
          ctx.closePath();
          ctx.fill();
        }
      }
    } else if (kind === "sunburst") {
      const cx = w / 2;
      const cy = h * 0.58;
      const n = 36;
      for (let i = 0; i < n; i += 2) {
        const a0 = (i / n) * Math.PI * 2;
        const a1 = ((i + 1) / n) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a0) * w, cy + Math.sin(a0) * w);
        ctx.lineTo(cx + Math.cos(a1) * w, cy + Math.sin(a1) * w);
        ctx.closePath();
        ctx.fill();
      }
    } else if (kind === "dots") {
      for (let y = 20; y < h; y += 44) {
        for (let x = 20 + ((y / 44) % 2) * 22; x < w; x += 44) {
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (kind === "checker") {
      const s = 56;
      for (let y = 0; y < h; y += s) for (let x = ((y / s) % 2) * s; x < w; x += s * 2) ctx.fillRect(x, y, s, s);
    }
    // painted-canvas wash: uneven brushwork + darker hem
    const r = rng(kind.length * 17);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = `rgba(${r() > 0.5 ? "255,250,235" : "60,30,20"},${0.015 + r() * 0.03})`;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 30 + r() * 140, 10 + r() * 40, r() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    const g = ctx.createRadialGradient(w / 2, h * 0.5, h * 0.2, w / 2, h * 0.5, w * 0.7);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(30,10,5,0.32)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Wrap text into lines that fit `maxWidth` on the canvas. */
export function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Letter-spaced text (canvas letterSpacing is not everywhere yet). */
export function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  const chars = [...text];
  const total = chars.reduce((s, c) => s + ctx.measureText(c).width, 0) + spacing * (chars.length - 1);
  let cx = ctx.textAlign === "center" ? x - total / 2 : ctx.textAlign === "right" ? x - total : x;
  const align = ctx.textAlign;
  ctx.textAlign = "left";
  for (const c of chars) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + spacing;
  }
  ctx.textAlign = align;
}
