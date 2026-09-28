// The scene-painter's bench: cut-out flats and pasted bills, painted once on
// a canvas at runtime. Every one is a single texture on a single plane, so a
// whole sky of clouds costs a handful of draw calls and no lights.

import { canvasTexture, font, rng, spaced } from "./canvas";

const CREAM = "#f6ecd6";
const INK = "#2b1a17";

/** A cut-out cloud, painted like a toy-theatre flat: scalloped, shaded, edged. */
export function cloudTexture(seed = 3) {
  return canvasTexture(512, 256, (ctx, w, h) => {
    const r = rng(seed);
    // the lobes, mirrored so each cloud is itself symmetric
    const lobes: [number, number, number][] = [[0, 118, 78]];
    for (let i = 1; i <= 3; i++) {
      const x = i * 62 + r() * 10;
      const rad = 78 - i * 14 + r() * 8;
      const y = 118 + i * 18 + r() * 6;
      lobes.push([x, y, rad], [-x, y, rad]);
    }
    const path = () => {
      ctx.beginPath();
      lobes.forEach(([x, y, rad]) => {
        ctx.moveTo(w / 2 + x + rad, y);
        ctx.arc(w / 2 + x, y, rad, 0, Math.PI * 2);
      });
      ctx.rect(w / 2 - 230, 150, 460, 58);
    };
    // the plywood edge, just showing below
    ctx.save();
    ctx.translate(0, 8);
    ctx.fillStyle = "#c7b08c";
    path();
    ctx.fill();
    ctx.restore();
    // the painted face: warm cream, shaded to peach underneath
    const g = ctx.createLinearGradient(0, 40, 0, 210);
    g.addColorStop(0, "#fffaf0");
    g.addColorStop(0.55, "#fbeede");
    g.addColorStop(1, "#efcfbf");
    ctx.fillStyle = g;
    path();
    ctx.fill();
    // a flat base, trimmed straight like a real ground-row cut
    ctx.clearRect(0, 208, w, h - 208);
    ctx.fillStyle = "#c7b08c";
    ctx.fillRect(w / 2 - 230, 208, 460, 8);
    // brushed highlights on each lobe
    lobes.forEach(([x, y, rad]) => {
      const hg = ctx.createRadialGradient(w / 2 + x - rad * 0.3, y - rad * 0.45, 2, w / 2 + x - rad * 0.3, y - rad * 0.45, rad * 0.7);
      hg.addColorStop(0, "rgba(255,255,255,0.75)");
      hg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(w / 2 + x, y, rad * 0.98, Math.PI, Math.PI * 2);
      ctx.fill();
    });
  });
}

/** A starburst for behind the sun, like the rays on an old travel poster. */
export function raysTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const n = 24;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = a0 + (Math.PI * 2) / n / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, w / 2, a0, a1);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,226,160,1)";
      ctx.fill();
    }
    // fade the burst out towards its rim
    ctx.globalCompositeOperation = "destination-in";
    const g = ctx.createRadialGradient(cx, cy, w * 0.08, cx, cy, w / 2);
    g.addColorStop(0, "rgba(0,0,0,0.9)");
    g.addColorStop(0.6, "rgba(0,0,0,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Canvas stripes for a bathing hut. */
export function hutTexture(stripe: string, ground = CREAM) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = stripe;
    for (let i = 0; i < 8; i += 2) ctx.fillRect((i * w) / 8, 0, w / 8, h);
    // weathering
    const r = rng(11);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(${r() > 0.5 ? "80,50,30" : "255,255,255"},${r() * 0.06})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
    }
  });
}

/** Sand for the beach ground row: warm, speckled, with a wet band at the tide line. */
export function sandTexture() {
  return canvasTexture(
    512,
    256,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#e9c98f");
      g.addColorStop(1, "#f3dcae");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const r = rng(21);
      for (let i = 0; i < 2600; i++) {
        const d = r();
        ctx.fillStyle = d > 0.6 ? "rgba(255,248,230,0.55)" : d > 0.2 ? "rgba(170,120,60,0.22)" : "rgba(120,80,40,0.3)";
        ctx.fillRect(r() * w, r() * h, 1.5, 1.5);
      }
    },
    { repeat: true },
  );
}

/** A gull, as a child would draw one — which is to say, as a painter would. */
export function gullTexture() {
  return canvasTexture(256, 128, (ctx, w) => {
    ctx.strokeStyle = "#f8f3ea";
    ctx.lineWidth = 11;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(18, 70);
    ctx.quadraticCurveTo(70, 18, w / 2, 78);
    ctx.quadraticCurveTo(w - 70, 18, w - 18, 70);
    ctx.stroke();
    ctx.strokeStyle = "rgba(60,50,50,0.55)";
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}

/** The canvas back of a director's chair, stencilled with its owner's name. */
export function chairBackTexture(name: string) {
  return canvasTexture(512, 160, (ctx, w, h) => {
    ctx.fillStyle = "#7a1620";
    ctx.fillRect(0, 0, w, h);
    const r = rng(4);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(${r() > 0.5 ? "0,0,0" : "255,200,190"},${r() * 0.07})`;
      ctx.fillRect(r() * w, r() * h, 2, 2);
    }
    ctx.strokeStyle = "rgba(240,215,160,0.8)";
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = "#f3dfae";
    ctx.textAlign = "center";
    ctx.font = font.sans(700, 58);
    spaced(ctx, name, w / 2, h / 2 + 20, 12);
  });
}

export interface PosterSpec {
  top: string;
  title: string;
  sub: string;
  bg: string;
  fg: string;
  accent: string;
  motif: "sun" | "stripes" | "circle" | "arch";
}

/** A playbill pasted to the brick outside the stage door. */
export function posterTexture(p: PosterSpec) {
  return canvasTexture(400, 600, (ctx, w, h) => {
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, w, h);
    // the motif, dead centre
    ctx.save();
    ctx.fillStyle = p.accent;
    ctx.strokeStyle = p.accent;
    const cx = w / 2;
    const cy = 250;
    if (p.motif === "sun") {
      for (let i = 0; i < 16; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((i / 16) * Math.PI * 2);
        ctx.fillRect(-4, 70, 8, 40);
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 58, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.motif === "stripes") {
      for (let i = 0; i < 6; i++) ctx.fillRect(cx - 110, cy - 90 + i * 32, 220, 14);
    } else if (p.motif === "circle") {
      ctx.lineWidth = 10;
      [96, 66, 36].forEach((rad) => {
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();
      });
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - 90, cy + 100);
      ctx.lineTo(cx - 90, cy - 20);
      ctx.arc(cx, cy - 20, 90, Math.PI, 0);
      ctx.lineTo(cx + 90, cy + 100);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // lettering
    ctx.textAlign = "center";
    ctx.fillStyle = p.fg;
    ctx.font = font.sans(600, 22);
    spaced(ctx, p.top.toUpperCase(), cx, 70, 6);
    ctx.font = font.serif(900, p.title.length > 8 ? 62 : 74, true);
    ctx.fillText(p.title, cx, 440);
    ctx.font = font.type(400, 22);
    ctx.fillText(p.sub, cx, 490);
    ctx.strokeStyle = p.fg;
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    // paste and weather
    const r = rng(p.title.length * 7);
    for (let i = 0; i < 1100; i++) {
      ctx.fillStyle = `rgba(${r() > 0.5 ? "70,45,25" : "255,255,255"},${r() * 0.08})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
    }
    const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.7);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(90,60,30,0.28)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = INK;
  });
}

/** The classroom whiteboard, mid-lesson. */
export function whiteboardTexture() {
  return canvasTexture(1024, 500, (ctx, w, h) => {
    ctx.fillStyle = "#f7f8f4";
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.45, "rgba(255,255,255,0.7)");
    g.addColorStop(0.55, "rgba(220,225,230,0.25)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // ghosts of old lessons
    ctx.fillStyle = "rgba(90,110,140,0.07)";
    ctx.font = font.type(400, 40);
    ctx.fillText("SELECT * FROM alumnos", 520, 440);
    // today's lesson
    ctx.fillStyle = "#1f4fa3";
    ctx.font = font.type(700, 46);
    ctx.fillText("function learn(topic) {", 60, 100);
    ctx.fillText("  while (curious) {", 60, 160);
    ctx.fillStyle = "#b8232e";
    ctx.fillText("    read(topic);", 60, 220);
    ctx.fillText("    build(topic);", 60, 280);
    ctx.fillStyle = "#1f4fa3";
    ctx.fillText("  }", 60, 340);
    ctx.fillText("}", 60, 400);
    // a diagram, boxes and arrows
    ctx.strokeStyle = "#2c7a4b";
    ctx.lineWidth = 5;
    [
      [700, 70],
      [860, 70],
      [780, 210],
    ].forEach(([x, y]) => ctx.strokeRect(x, y, 120, 70));
    ctx.beginPath();
    ctx.moveTo(760, 140);
    ctx.lineTo(820, 210);
    ctx.moveTo(920, 140);
    ctx.lineTo(860, 210);
    ctx.stroke();
    ctx.fillStyle = "#2c7a4b";
    ctx.font = font.type(700, 28);
    ctx.fillText("DB", 742, 115);
    ctx.fillText("API", 894, 115);
    ctx.fillText("APP", 812, 255);
  });
}

/** A laptop's screen: an editor, lit. */
export function codeScreenTexture(seed = 1, warm = false) {
  return canvasTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = warm ? "#2a2218" : "#1d2a2f";
    ctx.fillRect(0, 0, w, h);
    const r = rng(seed);
    const cols = warm ? ["#f1d38c", "#e8a07a", "#cfe3de", "#9fd6a6"] : ["#8fc9c4", "#e6c07a", "#cfe3de", "#e58c86"];
    for (let y = 14; y < h - 8; y += 12) {
      let x = 12 + Math.floor(r() * 3) * 12;
      const n = 1 + Math.floor(r() * 4);
      for (let i = 0; i < n && x < w - 20; i++) {
        const len = 12 + r() * 50;
        ctx.fillStyle = cols[Math.floor(r() * cols.length)];
        ctx.fillRect(x, y, len, 5);
        x += len + 8;
      }
    }
  });
}

/** The clinical app, as it looks on the tablet. */
export function tabletTexture() {
  return canvasTexture(1024, 700, (ctx, w, h) => {
    ctx.fillStyle = "#f7f4ee";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2f5e57";
    ctx.fillRect(0, 0, w, 90);
    ctx.fillStyle = "#f6ecd6";
    ctx.font = font.sans(600, 36);
    ctx.fillText("Good morning", 40, 58);
    ctx.fillStyle = "#9fd6c6";
    ctx.beginPath();
    ctx.roundRect(w - 290, 24, 250, 44, 22);
    ctx.fill();
    ctx.fillStyle = "#1d3a35";
    ctx.font = font.sans(600, 24);
    ctx.fillText("● Device connected", w - 270, 54);
    // today's card
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(40, 130, 440, 250, 22);
    ctx.fill();
    ctx.fillStyle = "#2b1a17";
    ctx.font = font.sans(500, 26);
    ctx.fillText("NEXT READING", 70, 185);
    ctx.font = font.serif(900, 92);
    ctx.fillText("08:00", 70, 290);
    ctx.fillStyle = "#6fa3a5";
    ctx.font = font.sans(500, 26);
    ctx.fillText("Synced 2 min ago", 70, 345);
    // a week of readings
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(520, 130, 460, 250, 22);
    ctx.fill();
    ctx.strokeStyle = "#a3232e";
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.beginPath();
    [300, 270, 285, 240, 250, 215, 225].forEach((y, i) => (i ? ctx.lineTo(560 + i * 64, y) : ctx.moveTo(560, y)));
    ctx.stroke();
    ctx.fillStyle = "#2b1a17";
    ctx.font = font.sans(500, 24);
    ctx.fillText("THIS WEEK", 550, 175);
    // three pill buttons, symmetric
    ["Take reading", "Diary", "Care team"].forEach((l, i) => {
      ctx.fillStyle = i === 0 ? "#2f5e57" : "#e4ece8";
      ctx.beginPath();
      ctx.roundRect(40 + i * 320, 440, 300, 90, 45);
      ctx.fill();
      ctx.fillStyle = i === 0 ? "#f6ecd6" : "#2b1a17";
      ctx.font = font.sans(600, 30);
      ctx.textAlign = "center";
      ctx.fillText(l, 190 + i * 320, 497);
      ctx.textAlign = "left";
    });
    ctx.fillStyle = "rgba(43,26,23,0.45)";
    ctx.font = font.type(400, 22);
    ctx.fillText("For illustration only · not a medical device", 40, 640);
  });
}

/** A banknote of no known currency. */
export function noteTexture() {
  return canvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = "#cfe0c4";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#3f6a4a";
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = "#3f6a4a";
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, 30, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cfe0c4";
    ctx.font = font.serif(900, 40);
    ctx.textAlign = "center";
    ctx.fillText("Z", w / 2, h / 2 + 14);
    ctx.fillStyle = "#3f6a4a";
    ctx.font = font.serif(900, 30);
    ctx.fillText("100", 42, 48);
    ctx.fillText("100", w - 42, h - 26);
  });
}

/**
 * The inscription over the bank's columns, cut into the stone. Painted at the
 * same proportions as the frieze it sits on (18 : 1), so nothing is stretched.
 */
export function friezeTexture(main: string, sub: string) {
  return canvasTexture(2048, 112, (ctx, w, h) => {
    ctx.fillStyle = "#efe4cf";
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.font = font.serif(900, 74);
    // an incised letter: a highlight below, the cut in shadow above
    ctx.fillStyle = "rgba(255,250,238,0.9)";
    spaced(ctx, main, w / 2, 74, 22);
    ctx.fillStyle = "#4e3c24";
    spaced(ctx, main, w / 2, 72, 22);
    ctx.font = font.sans(600, 18);
    ctx.fillStyle = "#6d5a3c";
    spaced(ctx, sub, w / 2, 102, 8);
    // a rule either side of the words
    ctx.fillStyle = "rgba(78,60,36,0.6)";
    ctx.fillRect(w * 0.06, 46, w * 0.26, 4);
    ctx.fillRect(w * 0.68, 46, w * 0.26, 4);
  });
}

/**
 * Corrugated card: the stuff the scenery is built from. A pale kraft, so a
 * tint reads as paint; flutes, fibres and a darker cut edge round every face.
 */
export function kraftTexture(edged = true) {
  return canvasTexture(
    256,
    256,
    (ctx, w, h) => {
    ctx.fillStyle = "#f3e7d0";
    ctx.fillRect(0, 0, w, h);
    const r = rng(31);
    // the flutes, just showing through the liner
    for (let x = 0; x < w; x += 10) {
      ctx.fillStyle = "rgba(120,80,40,0.07)";
      ctx.fillRect(x, 0, 4, h);
    }
    // fibres and specks
    for (let i = 0; i < 900; i++) {
      const d = r();
      ctx.fillStyle = d > 0.55 ? "rgba(255,248,232,0.3)" : "rgba(110,70,35,0.12)";
      ctx.fillRect(r() * w, r() * h, 1 + r() * 5, 1);
    }
    if (!edged) return;
    // a hand-cut edge on every face
    ctx.strokeStyle = "rgba(90,58,28,0.55)";
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.strokeStyle = "rgba(255,244,220,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    },
    { repeat: !edged },
  );
}

/** The clinical app on a phone in the device lab. */
export function phoneAppTexture(seed = 0) {
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = "#f7f4ee";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2f5e57";
    ctx.fillRect(0, 0, w, 70);
    ctx.fillStyle = "#9fd6c6";
    ctx.beginPath();
    ctx.arc(w - 36, 36, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(20, 94, w - 40, 150, 16);
    ctx.fill();
    ctx.fillStyle = "#2b1a17";
    ctx.font = font.serif(900, 56);
    ctx.fillText(["08:00", "12:30", "20:00"][seed % 3], 36, 190);
    ctx.fillStyle = "#6fa3a5";
    ctx.font = font.sans(600, 18);
    ctx.fillText("NEXT READING", 36, 128);
    ctx.strokeStyle = "#a3232e";
    ctx.lineWidth = 5;
    ctx.beginPath();
    [300, 280, 292, 262, 270, 250].forEach((y, i) => (i ? ctx.lineTo(36 + i * 36, y + seed * 6) : ctx.moveTo(36, y)));
    ctx.stroke();
    ctx.fillStyle = "#2f5e57";
    ctx.beginPath();
    ctx.roundRect(20, h - 120, w - 40, 56, 28);
    ctx.fill();
  });
}

/** A rug for the clinic floor: symmetric, of course. */
export function rugTexture() {
  return canvasTexture(512, 352, (ctx, w, h) => {
    ctx.fillStyle = "#2f5e57";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#f3e7cf";
    ctx.lineWidth = 10;
    ctx.strokeRect(22, 22, w - 44, h - 44);
    ctx.lineWidth = 3;
    ctx.strokeRect(42, 42, w - 84, h - 84);
    ctx.fillStyle = "#e8b85c";
    for (const [x, y] of [
      [w / 2, h / 2],
      [w * 0.25, h / 2],
      [w * 0.75, h / 2],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, y - 40);
      ctx.lineTo(x + 28, y);
      ctx.lineTo(x, y + 40);
      ctx.lineTo(x - 28, y);
      ctx.closePath();
      ctx.fill();
    }
    const r = rng(5);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(${r() > 0.5 ? "0,0,0" : "255,255,255"},${r() * 0.06})`;
      ctx.fillRect(r() * w, r() * h, 2, 2);
    }
  });
}

/** A framed chart for the clinic wall: one heartbeat, drawn neatly. */
export function chartTexture() {
  return canvasTexture(256, 320, (ctx, w, h) => {
    ctx.fillStyle = "#fbf8f1";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(111,163,165,0.35)";
    ctx.lineWidth = 1;
    for (let x = 16; x < w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 16; y < h; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#a3232e";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(10, 170);
    ctx.lineTo(80, 170);
    ctx.lineTo(100, 110);
    ctx.lineTo(128, 240);
    ctx.lineTo(150, 140);
    ctx.lineTo(166, 170);
    ctx.lineTo(246, 170);
    ctx.stroke();
    ctx.fillStyle = "#2b1a17";
    ctx.textAlign = "center";
    ctx.font = font.sans(600, 18);
    spaced(ctx, "FIG. 1", w / 2, 290, 6);
  });
}

/** An open journal, two pages of a long read on design culture. */
export function journalTexture() {
  return canvasTexture(1024, 640, (ctx, w, h) => {
    ctx.fillStyle = "#fbf6ea";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(w / 2 - 6, 0, 12, h);
    const col = (x0: number, seed: number) => {
      const r = rng(seed);
      for (let y = 190; y < h - 50; y += 22) {
        const len = 330 + r() * 70;
        ctx.fillStyle = "rgba(43,26,23,0.55)";
        ctx.fillRect(x0, y, y % 154 === 0 ? len * 0.6 : len, 7);
      }
    };
    ctx.fillStyle = "#2b1a17";
    ctx.font = font.serif(900, 92);
    ctx.fillText("Memoir", 56, 140);
    ctx.fillStyle = "#a3232e";
    ctx.font = font.sans(600, 20);
    spaced(ctx, "ON MUSIC, ARCHITECTURE & TYPE", 60, 172, 5);
    col(60, 3);
    ctx.fillStyle = "#e9b8b3";
    ctx.fillRect(w / 2 + 50, 60, 410, 250);
    ctx.fillStyle = "#3a1d1b";
    ctx.beginPath();
    ctx.arc(w / 2 + 255, 185, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e9b8b3";
    ctx.beginPath();
    ctx.arc(w / 2 + 255, 185, 14, 0, Math.PI * 2);
    ctx.fill();
    col(w / 2 + 50, 7);
  });
}

/** A cut-out letter for hanging, type-specimen style (transparent around it). */
export function letterTexture(ch: string, color = "#2b1a17") {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font.serif(900, 440);
    ctx.fillText(ch, w / 2, h / 2 + 20);
  });
}

/** Campus, as it looks on a phone: a wall of holds and two fingertips. */
export function gameTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = "#e6cfa2";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#b89a68";
    for (let y = 20; y < h; y += 34) for (let x = 18; x < w; x += 34) ctx.fillRect(x, y, 3, 3);
    const holds: [number, number, string][] = [
      [70, 430, "#b8323a"],
      [150, 360, "#dcae45"],
      [96, 290, "#2f6a68"],
      [180, 220, "#b8323a"],
      [110, 150, "#5b4c9a"],
      [170, 80, "#dcae45"],
    ];
    holds.forEach(([x, y, c]) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x, y, 20, 14, 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = "#2a2440";
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    holds.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.setLineDash([]);
    [
      [180, 220],
      [110, 150],
    ].forEach(([x, y]) => {
      ctx.fillStyle = "#f6ecd6";
      ctx.strokeStyle = "#2a2440";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.fillStyle = "#2a2440";
    ctx.font = font.sans(700, 22);
    ctx.fillText("CHALK 12", 16, 34);
  });
}

/** An instant photograph: a white frame, and a day's small mission inside it. */
export function photoTexture(seed: number) {
  return canvasTexture(128, 152, (ctx, w, h) => {
    ctx.fillStyle = "#fbf8f1";
    ctx.fillRect(0, 0, w, h);
    const palettes = [
      ["#7fb0bf", "#f2a88f", "#e8cb97"],
      ["#2f5e57", "#e8b85c", "#f6ecd6"],
      ["#a3232e", "#f5d4cc", "#2b1a17"],
      ["#5b4c9a", "#c9c3e3", "#dcae45"],
    ];
    const [sky, mid, low] = palettes[seed % palettes.length];
    ctx.fillStyle = sky;
    ctx.fillRect(10, 10, w - 20, 70);
    ctx.fillStyle = low;
    ctx.fillRect(10, 80, w - 20, 36);
    ctx.fillStyle = mid;
    ctx.beginPath();
    if (seed % 2) ctx.arc(w / 2, 70, 22, 0, Math.PI * 2);
    else ctx.fillRect(w / 2 - 22, 46, 44, 44);
    ctx.fill();
    ctx.fillStyle = "rgba(43,26,23,0.6)";
    ctx.font = font.type(400, 12);
    ctx.fillText(`day ${String(seed * 37 + 12).padStart(3, "0")}`, 12, h - 14);
  });
}

/** The dressing-room mirror, with the manifesto written on it in lipstick. */
export function mirrorTexture(lines: string[]) {
  return canvasTexture(1024, 700, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#c9d3d6");
    g.addColorStop(0.45, "#eef2f1");
    g.addColorStop(0.55, "#b8c4c8");
    g.addColorStop(1, "#8e9ca2");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // a few long streaks of reflection
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(w * 0.62, 0);
    ctx.lineTo(w * 0.72, 0);
    ctx.lineTo(w * 0.42, h);
    ctx.lineTo(w * 0.32, h);
    ctx.fill();
    // the manifesto, in lipstick, a little crooked
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.04);
    ctx.fillStyle = "#b3202d";
    ctx.textAlign = "center";
    lines.forEach((l, i) => {
      ctx.font = font.serif(900, i === 1 ? 56 : 78, true);
      ctx.fillText(l.toUpperCase(), 0, -110 + i * 120);
    });
    ctx.restore();
    // photographs and notes tucked into the frame
    const tuck = (x: number, y: number, rot: number, fill: string, text?: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(-58, -66, 124, 140);
      ctx.fillStyle = text ? "#f6e27a" : "#fbf8f1";
      ctx.fillRect(-62, -70, 124, 140);
      if (!text) {
        ctx.fillStyle = fill;
        ctx.fillRect(-52, -60, 104, 96);
      } else {
        ctx.fillStyle = "#2b1a17";
        ctx.font = font.type(700, 20);
        text.split("\n").forEach((l, i) => ctx.fillText(l, -50, -30 + i * 28));
      }
      ctx.restore();
    };
    tuck(80, 90, -0.12, "#7fb0bf");
    tuck(w - 80, 90, 0.12, "#e8b85c");
    tuck(80, h - 90, 0.08, "", "ARA\nsoon(ish)");
    tuck(w - 80, h - 90, -0.08, "", "call\nmum");
  });
}

/** A framed certificate of honour. */
export function certificateTexture(title: string, from: string, forWhat: string, date: string) {
  return canvasTexture(512, 400, (ctx, w, h) => {
    ctx.fillStyle = "#fbf6ea";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#8a6423";
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, w - 56, h - 56);
    ctx.textAlign = "center";
    ctx.fillStyle = "#2b1a17";
    ctx.font = font.sans(600, 20);
    spaced(ctx, from.toUpperCase(), w / 2, 84, 8);
    ctx.font = font.serif(900, 50, true);
    ctx.fillText(title, w / 2, 160);
    ctx.font = font.type(400, 22);
    ctx.fillText(`awarded to ${forWhat}`, w / 2, 212);
    ctx.fillText(date, w / 2, 244);
    ctx.fillStyle = "#c99a3e";
    ctx.beginPath();
    ctx.arc(w / 2, 310, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a3232e";
    ctx.fillRect(w / 2 - 22, 336, 14, 40);
    ctx.fillRect(w / 2 + 8, 336, 14, 40);
  });
}

/** A record sleeve, lettered only. */
export function sleeveTexture(title: string, artist: string, year: string) {
  return canvasTexture(400, 400, (ctx, w, h) => {
    ctx.fillStyle = "#1f3b5c";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f6ecd6";
    ctx.font = font.serif(900, 56, true);
    ctx.fillText(title, 28, 90);
    ctx.font = font.sans(600, 22);
    spaced(ctx, artist.toUpperCase(), 30, 130, 6);
    ctx.fillStyle = "#2f5e9a";
    ctx.beginPath();
    ctx.arc(w / 2 + 40, h / 2 + 60, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f6ecd6";
    ctx.font = font.type(400, 20);
    ctx.fillText(year, 30, h - 30);
  });
}

/** An enamel destination board, as on a railway platform. */
export function destinationTexture(text: string) {
  return canvasTexture(1024, 160, (ctx, w, h) => {
    ctx.fillStyle = "#1f3b5c";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#f6ecd6";
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = "#f6ecd6";
    ctx.textAlign = "center";
    ctx.font = font.sans(700, 76);
    spaced(ctx, text, w / 2, 108, 14);
  });
}

/** A book's spine, lettered. */
export function spineTexture(title: string, author: string, bg: string) {
  return canvasTexture(512, 96, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = font.serif(900, 40, true);
    ctx.fillText(title, 24, 62);
    ctx.textAlign = "right";
    ctx.font = font.sans(600, 22);
    spaced(ctx, author.toUpperCase(), w - 24, 60, 4);
  });
}
