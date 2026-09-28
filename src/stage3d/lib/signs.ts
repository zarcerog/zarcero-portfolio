// The sign-writer's shop: every painted card, plaque and dial on stage.

import { ACT_CARDS, PLAYBILL } from "@/theatre/content";

import { canvasTexture, font, rng, spaced, wrap } from "./canvas";

const CREAM = "#f6ecd6";
const INK = "#2b1a17";
const VELVET = "#a3232e";
const GOLD = "#b8893a";

function paperGrain(ctx: CanvasRenderingContext2D, w: number, h: number, seed = 5) {
  const r = rng(seed);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? "90,60,30" : "255,255,255"},${r() * 0.05})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(120,80,30,0.18)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function doubleBorder(ctx: CanvasRenderingContext2D, w: number, h: number, outer: string, inner: string, s = 1) {
  ctx.strokeStyle = outer;
  ctx.lineWidth = 10 * s;
  ctx.strokeRect(5 * s, 5 * s, w - 10 * s, h - 10 * s);
  ctx.strokeStyle = inner;
  ctx.lineWidth = 2.5 * s;
  ctx.strokeRect(24 * s, 24 * s, w - 48 * s, h - 48 * s);
}

function rule(ctx: CanvasRenderingContext2D, cx: number, y: number, half: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - half, y);
  ctx.lineTo(cx - 24, y);
  ctx.moveTo(cx + 24, y);
  ctx.lineTo(cx + half, y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = font.serif(500, 26);
  ctx.textAlign = "center";
  ctx.fillText("✦", cx, y + 9);
}

export function billingTexture() {
  return canvasTexture(1400, 1000, (ctx, w, h) => {
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, w, h);
    paperGrain(ctx, w, h, 2);
    doubleBorder(ctx, w, h, VELVET, GOLD);
    ctx.textAlign = "center";
    ctx.fillStyle = VELVET;
    ctx.font = font.sans(600, 34);
    spaced(ctx, PLAYBILL.theatre.toUpperCase(), w / 2, 150, 14);
    ctx.fillStyle = INK;
    ctx.font = font.serif(500, 42, true);
    ctx.fillText(`— ${PLAYBILL.presents} —`, w / 2, 230);
    ctx.font = font.sans(600, 150);
    const [first, ...rest] = PLAYBILL.name.toUpperCase().split(" ");
    spaced(ctx, first, w / 2, 400, 10);
    spaced(ctx, rest.join(" "), w / 2, 555, 10);
    ctx.font = font.serif(500, 44, true);
    ctx.fillText(PLAYBILL.in, w / 2, 630);
    ctx.fillStyle = VELVET;
    ctx.font = font.serif(500, 76, true);
    ctx.fillText(`« ${PLAYBILL.title} »`, w / 2, 735);
    ctx.fillStyle = INK;
    ctx.font = font.type(400, 30);
    ctx.fillText(PLAYBILL.subtitle, w / 2, 800);
    rule(ctx, w / 2, 860, 420, GOLD);
    ctx.font = font.sans(600, 26);
    spaced(ctx, `${PLAYBILL.season} · ${PLAYBILL.location}`.toUpperCase(), w / 2, 925, 10);
  });
}

type Card = (typeof ACT_CARDS)[keyof typeof ACT_CARDS];

export function actCardTexture(card: Card) {
  return canvasTexture(1200, 760, (ctx, w, h) => {
    ctx.fillStyle = "#f5d4cc";
    ctx.fillRect(0, 0, w, h);
    paperGrain(ctx, w, h, card.numeral.length + 3);
    doubleBorder(ctx, w, h, "#8e2230", "#8a6423");
    ctx.textAlign = "center";
    ctx.fillStyle = "#8e2230";
    ctx.font = font.sans(600, 30);
    spaced(ctx, "— ACT —", w / 2, 120, 16);
    ctx.fillStyle = VELVET;
    ctx.font = font.serif(900, 250);
    ctx.fillText(card.numeral, w / 2, 350);
    ctx.fillStyle = INK;
    ctx.font = font.sans(600, 62);
    spaced(ctx, card.title.toUpperCase(), w / 2, 480, 14);
    ctx.font = font.serif(500, 40, true);
    const lines = wrap(ctx, card.line, w - 220);
    lines.forEach((l, i) => ctx.fillText(l, w / 2, 575 + i * 52));
  });
}

export function plaqueTexture(top: string, main: string, sub?: string) {
  return canvasTexture(1024, 300, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#f3dc93");
    g.addColorStop(0.5, "#c99a3e");
    g.addColorStop(1, "#7d5719");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(60,35,5,0.7)";
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    // screws
    ctx.fillStyle = "#6a4814";
    for (const [x, y] of [
      [40, 40],
      [w - 40, 40],
      [40, h - 40],
      [w - 40, h - 40],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "#3a2405";
    ctx.font = font.sans(600, 30);
    spaced(ctx, top.toUpperCase(), w / 2, 90, 10);
    ctx.font = font.serif(900, main.length > 16 ? 72 : 90);
    ctx.fillText(main, w / 2, sub ? 190 : 205);
    if (sub) {
      ctx.font = font.serif(500, 36, true);
      ctx.fillText(sub, w / 2, 250);
    }
  });
}

export function stageDoorTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = "#1f1a1c";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#c99a3e";
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = "#f0d78c";
    ctx.textAlign = "center";
    ctx.font = font.sans(700, 96);
    spaced(ctx, "STAGE DOOR", w / 2, 165, 26);
  });
}

export function quietTexture() {
  return canvasTexture(1024, 300, (ctx, w, h) => {
    ctx.fillStyle = "#1f1a1c";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#c99a3e";
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f0d78c";
    ctx.font = font.sans(600, 40);
    spaced(ctx, "REHEARSAL IN PROGRESS", w / 2, 110, 14);
    ctx.fillStyle = CREAM;
    ctx.font = font.serif(500, 92, true);
    ctx.fillText("Quiet, please", w / 2, 225);
  });
}

export function signTexture(text: string) {
  return canvasTexture(512, 170, (ctx, w, h) => {
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, w, h);
    paperGrain(ctx, w, h, 9);
    ctx.strokeStyle = "#6b4c3b";
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = "#2f6a68";
    ctx.textAlign = "center";
    // a trailing arrow is drawn, not typed: the subset webfont has no glyph for it
    const arrow = /\s*→$/.test(text);
    const words = text.replace(/\s*→$/, "").toUpperCase();
    const arrowW = arrow ? 70 : 0;
    const room = w - 70 - arrowW;
    // shrink the lettering until it fits inside the frame
    let size = 64;
    let spacing = 18;
    const width = () => [...words].reduce((s, c) => s + ctx.measureText(c).width, 0) + spacing * (words.length - 1);
    ctx.font = font.sans(600, size);
    while (width() > room && size > 24) {
      size -= 2;
      spacing = size * 0.28;
      ctx.font = font.sans(600, size);
    }
    const tw = width();
    const cx = w / 2 - arrowW / 2;
    spaced(ctx, words, cx, h / 2 + size * 0.36, spacing);
    if (arrow) {
      const ax = cx + tw / 2 + 22;
      const ay = h / 2;
      ctx.beginPath();
      ctx.moveTo(ax, ay - 5);
      ctx.lineTo(ax + 30, ay - 5);
      ctx.lineTo(ax + 30, ay - 17);
      ctx.lineTo(ax + 52, ay);
      ctx.lineTo(ax + 30, ay + 17);
      ctx.lineTo(ax + 30, ay + 5);
      ctx.lineTo(ax, ay + 5);
      ctx.closePath();
      ctx.fill();
    }
  });
}

export function crestTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h / 2, w * 0.6);
    g.addColorStop(0, "#fbf4e2");
    g.addColorStop(1, "#e2cda0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = VELVET;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font.serif(900, 330, true);
    ctx.fillText("Z", w / 2, h / 2 + 10);
  });
}

export function apronTexture() {
  return canvasTexture(2048, 256, (ctx, w, h) => {
    ctx.fillStyle = "#3a2216";
    ctx.fillRect(0, 0, w, h);
    const n = 7;
    const gap = 26;
    const pw = (w - gap * (n + 1)) / n;
    const glyphs = ["❦", "✥", "❦", "MMXXVI", "❦", "✥", "❦"];
    for (let i = 0; i < n; i++) {
      const x = gap + i * (pw + gap);
      const g = ctx.createLinearGradient(0, 30, 0, h - 30);
      g.addColorStop(0, "#e7aca6");
      g.addColorStop(1, "#c98580");
      ctx.fillStyle = g;
      ctx.fillRect(x, 34, pw, h - 68);
      ctx.strokeStyle = "#d9ad55";
      ctx.lineWidth = 6;
      ctx.strokeRect(x, 34, pw, h - 68);
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 14, 48, pw - 28, h - 96);
      ctx.fillStyle = "#8e2230";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (glyphs[i].length > 2) {
        ctx.font = font.sans(600, 44);
        spaced(ctx, glyphs[i], x + pw / 2, h / 2, 16);
      } else {
        ctx.font = font.serif(500, 70);
        ctx.fillText(glyphs[i], x + pw / 2, h / 2);
      }
    }
  });
}

export function wallpaperTexture(base: string, kind: "stripe" | "dot" | "diamond" | "check") {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      if (kind === "stripe") for (let x = 0; x < w; x += 64) ctx.fillRect(x, 0, 28, h);
      if (kind === "dot")
        for (let y = 16; y < h; y += 48) for (let x = 16 + ((y / 48) % 2) * 24; x < w; x += 48) {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      if (kind === "diamond") {
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 3;
        for (let i = -h; i < w + h; i += 48) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + h, h);
          ctx.moveTo(i + h, 0);
          ctx.lineTo(i, h);
          ctx.stroke();
        }
      }
      if (kind === "check") {
        ctx.fillRect(0, h * 0.62, w, 6);
        for (let x = 0; x < w; x += 40) ctx.fillRect(x, 0, 4, h * 0.62);
      }
      paperGrain(ctx, w, h, base.length);
    },
    { repeat: true },
  );
}

export function clockTexture(city: string) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 1; i <= 12; i++) {
      const a = ((i * 30 - 90) * Math.PI) / 180;
      ctx.font = font.serif(700, 52);
      ctx.fillText(["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][i - 1], w / 2 + Math.cos(a) * 190, h / 2 + Math.sin(a) * 190);
    }
    ctx.font = font.sans(600, 34);
    spaced(ctx, city.toUpperCase(), w / 2, h / 2 + 95, 6);
  });
}

export function umbrellaTexture() {
  return canvasTexture(
    512,
    64,
    (ctx, w, h) => {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? CREAM : "#e58c86";
        ctx.fillRect((i * w) / 8, 0, w / 8, h);
      }
    },
  );
}
