// The cast: everyone who stands in the picture, painted properly this time.
// Each figure is drawn front-on and a little stiff, as if waiting for the
// photographer, in gouache: flat colour, light from the left, a thin ink line.
// Every character has two frames (idle, and a gesture) so the picture can
// breathe: masons strike, the bishop blesses, gentlemen tip their hats.
//
// Coordinates: y up, the feet at 0, a grown man about 1000 units tall.

type C = CanvasRenderingContext2D;

const INK = "#1d1512";
const SKIN = "#efc7a4";
const SKIN_LO = "#d9a882";
const WHITE = "#f6f1e6";

// ---------------------------------------------------------------------------
// Brushes
// ---------------------------------------------------------------------------

interface Paint {
  shade?: boolean;
  ink?: boolean;
  width?: number;
}

/** Fill an SVG path, light it from the left, and ink its edge. */
function fill(c: C, d: string, color: string, o: Paint = {}) {
  const p = new Path2D(d);
  c.fillStyle = color;
  c.fill(p);
  if (o.shade !== false) {
    c.save();
    c.clip(p);
    const g = c.createLinearGradient(-200, 0, 220, 0);
    g.addColorStop(0, "rgba(255,248,230,0.22)");
    g.addColorStop(0.45, "rgba(255,248,230,0)");
    g.addColorStop(0.62, "rgba(40,20,10,0)");
    g.addColorStop(1, "rgba(40,20,10,0.3)");
    c.fillStyle = g;
    c.fillRect(-400, -50, 800, 1300);
    c.restore();
  }
  if (o.ink !== false) {
    c.lineWidth = o.width ?? 6;
    c.lineJoin = "round";
    c.strokeStyle = INK;
    c.stroke(p);
  }
}

function line(c: C, d: string, color = INK, width = 6) {
  c.lineWidth = width;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.strokeStyle = color;
  c.stroke(new Path2D(d));
}

function dot(c: C, x: number, y: number, r: number, color: string, ink = false) {
  c.beginPath();
  c.ellipse(x, y, r, r, 0, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
  if (ink) {
    c.lineWidth = 4;
    c.strokeStyle = INK;
    c.stroke();
  }
}

const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${-Number(x)} ${y}`);

// ---------------------------------------------------------------------------
// Body parts (the right-hand side is the left's mirror)
// ---------------------------------------------------------------------------

interface Face {
  skin?: string;
  hair: string;
  moustache?: "none" | "pencil" | "walrus" | "handlebar";
  beard?: "none" | "chin" | "full" | "long";
  bald?: boolean;
  /** eyes closed, as in prayer */
  shut?: boolean;
  cy?: number;
  scale?: number;
}

function head(c: C, f: Face) {
  const s = f.scale ?? 1;
  const cy = f.cy ?? 860;
  c.save();
  c.translate(0, cy);
  c.scale(s, s);
  const skin = f.skin ?? SKIN;
  // neck
  fill(c, "M-19 -110 L-19 -48 L19 -48 L19 -110 Z", SKIN_LO, { shade: false });
  // ears
  fill(c, "M-50 -2 Q-64 4 -60 -20 Q-56 -30 -48 -24 Z", skin);
  fill(c, mirror("M-50 -2 Q-64 4 -60 -20 Q-56 -30 -48 -24 Z"), skin);
  // the head
  fill(c, "M0 -64 Q-54 -62 -52 2 Q-50 58 0 62 Q50 58 52 2 Q54 -62 0 -64 Z", skin);
  // hair: short at the sides, neatly parted (unless there is none)
  if (!f.bald) fill(c, "M-52 8 Q-58 56 -10 66 Q30 70 50 44 Q56 24 52 8 Q46 36 20 40 Q-8 30 -18 46 Q-40 40 -46 12 Z", f.hair);
  else fill(c, "M-52 -4 Q-56 22 -46 30 L-44 6 Z M52 -4 Q56 22 46 30 L44 6 Z", f.hair);
  // eyes and brows
  if (f.shut) {
    line(c, "M-26 4 Q-18 0 -10 4", INK, 5);
    line(c, "M10 4 Q18 0 26 4", INK, 5);
  } else {
    dot(c, -18, 6, 6, INK);
    dot(c, 18, 6, 6, INK);
    dot(c, -16, 8, 2, "#fff");
    dot(c, 20, 8, 2, "#fff");
  }
  line(c, "M-30 20 Q-18 26 -8 21", f.hair, 6);
  line(c, "M8 21 Q18 26 30 20", f.hair, 6);
  // nose, cheeks
  line(c, "M2 8 Q-6 -16 4 -20", SKIN_LO, 5);
  dot(c, -30, -16, 9, "rgba(226,120,110,0.28)");
  dot(c, 30, -16, 9, "rgba(226,120,110,0.28)");
  // beards
  const beard = f.beard ?? "none";
  if (beard === "chin") fill(c, "M-40 -18 Q-36 -58 0 -66 Q36 -58 40 -18 Q24 -40 0 -40 Q-24 -40 -40 -18 Z", f.hair, { width: 4 });
  if (beard === "full") fill(c, "M-52 0 Q-58 -64 0 -92 Q58 -64 52 0 Q40 -30 0 -36 Q-40 -30 -52 0 Z", f.hair, { width: 4 });
  if (beard === "long") fill(c, "M-52 4 Q-60 -80 0 -150 Q60 -80 52 4 Q40 -28 0 -34 Q-40 -28 -52 4 Z", f.hair, { width: 4 });
  // moustaches
  const m = f.moustache ?? "none";
  if (m === "pencil") line(c, "M-18 -26 Q0 -22 18 -26", f.hair, 5);
  if (m === "walrus") fill(c, "M-30 -40 Q-26 -20 0 -24 Q26 -20 30 -40 Q14 -30 0 -32 Q-14 -30 -30 -40 Z", f.hair, { width: 3 });
  if (m === "handlebar") {
    fill(c, "M-8 -24 Q-26 -32 -42 -24 Q-50 -18 -46 -10 Q-44 -22 -30 -24 Q-18 -22 -2 -30 Z", f.hair, { width: 3 });
    fill(c, mirror("M-8 -24 Q-26 -32 -42 -24 Q-50 -18 -46 -10 Q-44 -22 -30 -24 Q-18 -22 -2 -30 Z"), f.hair, { width: 3 });
  }
  if (m === "none" && beard === "none") line(c, "M-10 -32 Q0 -36 10 -32", "#9a5a4a", 4);
  c.restore();
}

function shoes(c: C, color = "#1a1412") {
  const d = "M-18 0 L-18 24 L-58 26 Q-94 24 -96 12 Q-94 0 -70 0 Z";
  fill(c, d, color, { width: 4 });
  fill(c, mirror(d), color, { width: 4 });
  line(c, "M-80 16 Q-64 22 -40 20", "rgba(255,255,255,0.35)", 4);
}

/** Espardenyes: rope soles, canvas, black ribbons crossed round the ankle. */
function espadrilles(c: C) {
  const d = "M-18 0 L-18 22 L-58 24 Q-92 22 -94 10 Q-92 0 -70 0 Z";
  fill(c, d, "#eadcc0", { width: 4 });
  fill(c, mirror(d), "#eadcc0", { width: 4 });
  fill(c, "M-94 0 L-18 0 L-18 8 L-94 8 Z", "#b89a6a", { width: 3, shade: false });
  fill(c, mirror("M-94 0 L-18 0 L-18 8 L-94 8 Z"), "#b89a6a", { width: 3, shade: false });
  for (const s of [-1, 1]) {
    line(c, `M${s * 66} 24 L${s * 26} 60 M${s * 26} 24 L${s * 66} 60`, INK, 5);
  }
}

function trousers(c: C, color: string, stripes = false) {
  const d = "M-10 20 L-64 20 L-68 480 L-2 480 Z";
  fill(c, d, color);
  fill(c, mirror(d), color);
  if (stripes)
    for (const x of [-52, -38, -24, 24, 38, 52]) line(c, `M${x} 26 L${x * 1.04} 470`, "rgba(20,20,20,0.35)", 3);
}

type Arm = "down" | "hip" | "front" | "up" | "hat" | "chest" | "strike" | "raise";

/** A sleeve from the shoulder at (sx, 750) to a hand; returns the hand. */
function arm(c: C, side: -1 | 1, pose: Arm, cloth: string, hand = SKIN, sx = 104): [number, number] {
  const S = (x: number) => x * side;
  let d: string;
  let hx: number;
  let hy: number;
  switch (pose) {
    case "up":
      d = `M${S(sx - 8)} 770 Q${S(sx + 40)} 820 ${S(sx + 36)} 920 L${S(sx + 30)} 1010 L${S(sx - 4)} 1006 L${S(sx - 2)} 900 Q${S(sx - 14)} 820 ${S(sx - 30)} 760 Z`;
      hx = S(sx + 14);
      hy = 1024;
      break;
    case "hat":
      d = `M${S(sx - 8)} 770 Q${S(sx + 36)} 800 ${S(sx + 10)} 900 L${S(sx - 26)} 960 L${S(sx - 50)} 940 L${S(sx - 22)} 880 Q${S(sx - 10)} 820 ${S(sx - 30)} 760 Z`;
      hx = S(sx - 40);
      hy = 962;
      break;
    case "raise":
      d = `M${S(sx - 8)} 770 Q${S(sx + 36)} 760 ${S(sx + 50)} 700 L${S(sx + 80)} 780 L${S(sx + 52)} 800 L${S(sx + 30)} 740 Q${S(sx + 10)} 760 ${S(sx - 30)} 740 Z`;
      hx = S(sx + 72);
      hy = 810;
      break;
    case "hip":
      d = `M${S(sx)} 760 Q${S(sx + 44)} 700 ${S(sx + 40)} 630 L${S(sx + 10)} 540 L${S(sx - 18)} 552 L${S(sx + 8)} 630 Q${S(sx + 8)} 700 ${S(sx - 24)} 740 Z`;
      hx = S(sx - 6);
      hy = 546;
      break;
    case "front":
      d = `M${S(sx)} 760 Q${S(sx + 26)} 700 ${S(sx + 22)} 620 L${S(sx - 34)} 560 L${S(sx - 58)} 580 L${S(sx - 10)} 632 Q${S(sx - 10)} 700 ${S(sx - 28)} 740 Z`;
      hx = S(sx - 56);
      hy = 566;
      break;
    case "chest":
      d = `M${S(sx)} 760 Q${S(sx + 26)} 700 ${S(sx + 18)} 640 L${S(sx - 40)} 640 L${S(sx - 60)} 668 L${S(sx - 8)} 674 Q${S(sx - 8)} 710 ${S(sx - 28)} 740 Z`;
      hx = S(sx - 60);
      hy = 654;
      break;
    case "strike":
      d = `M${S(sx)} 760 Q${S(sx + 40)} 700 ${S(sx + 36)} 610 L${S(sx + 16)} 470 L${S(sx - 16)} 474 L${S(sx + 4)} 610 Q${S(sx + 2)} 700 ${S(sx - 26)} 740 Z`;
      hx = S(sx + 2);
      hy = 456;
      break;
    default:
      d = `M${S(sx)} 764 Q${S(sx + 34)} 730 ${S(sx + 34)} 640 L${S(sx + 36)} 486 L${S(sx + 2)} 482 L${S(sx)} 640 Q${S(sx - 2)} 710 ${S(sx - 26)} 744 Z`;
      hx = S(sx + 18);
      hy = 470;
  }
  fill(c, d, cloth);
  dot(c, hx, hy, 19, hand, true);
  return [hx, hy];
}

// ---------------------------------------------------------------------------
// Costumes
// ---------------------------------------------------------------------------

/** A frock coat, open over a waistcoat; the shirt and a cravat. */
function frockCoat(c: C, coat: string, waistcoat: string, cravat: string) {
  fill(c, "M-40 744 L40 744 L46 500 L0 474 L-46 500 Z", waistcoat);
  for (const y of [690, 640, 590, 540]) dot(c, 0, y, 5, "#c9a24a");
  fill(c, "M-36 770 L36 770 L0 690 Z", WHITE, { width: 4 });
  fill(c, "M-26 752 L0 740 L26 752 L26 722 L0 734 L-26 722 Z", cravat, { width: 4 });
  const panel = "M-104 766 Q-126 700 -116 560 L-126 318 L-44 318 L-36 520 L-40 746 Z";
  fill(c, panel, coat);
  fill(c, mirror(panel), coat);
  // lapels
  fill(c, "M-40 746 L-70 712 L-44 600 Z", coat, { width: 4 });
  fill(c, mirror("M-40 746 L-70 712 L-44 600 Z"), coat, { width: 4 });
  // a watch chain
  line(c, "M-42 560 Q-20 530 0 548", "#d9b24a", 3);
}

function topHat(c: C, color = "#161212", band = "#3a2a2a", y = 918, lift = 0) {
  c.save();
  c.translate(0, lift);
  fill(c, `M-54 ${y} L-58 ${y + 142} Q0 ${y + 152} 58 ${y + 142} L54 ${y} Z`, color);
  fill(c, `M-54 ${y + 4} L-55 ${y + 30} L55 ${y + 30} L54 ${y + 4} Z`, band, { width: 3 });
  fill(c, `M-84 ${y} Q-84 ${y - 16} 0 ${y - 16} Q84 ${y - 16} 84 ${y} Q84 ${y + 12} 0 ${y + 12} Q-84 ${y + 12} -84 ${y} Z`, color);
  line(c, `M-40 ${y + 40} L-40 ${y + 130}`, "rgba(255,255,255,0.18)", 8);
  c.restore();
}

function bowler(c: C, color = "#2a1f1a", y = 914) {
  fill(c, `M-52 ${y} Q-56 ${y + 90} 0 ${y + 92} Q56 ${y + 90} 52 ${y} Z`, color);
  fill(c, `M-74 ${y} Q-74 ${y - 14} 0 ${y - 14} Q74 ${y - 14} 74 ${y} Q74 ${y + 10} 0 ${y + 10} Q-74 ${y + 10} -74 ${y} Z`, color);
  fill(c, `M-52 ${y + 6} L-53 ${y + 22} L53 ${y + 22} L52 ${y + 6} Z`, "#120d0b", { width: 3 });
}

/** The barretina: a Catalan cap of red wool, flopping to one side. */
function barretina(c: C, y = 912) {
  fill(c, `M-54 ${y} Q-60 ${y + 70} -20 ${y + 96} Q40 ${y + 120} 86 ${y + 70} Q104 ${y + 44} 80 ${y + 34} Q60 ${y + 30} 54 ${y} Z`, "#b52a2a");
  fill(c, `M-56 ${y - 6} L56 ${y - 6} L54 ${y + 18} L-54 ${y + 18} Z`, "#7a1616", { width: 4 });
}

function flatCap(c: C, color: string, y = 914) {
  fill(c, `M-56 ${y} Q-60 ${y + 60} 0 ${y + 66} Q56 ${y + 60} 60 ${y + 10} Z`, color);
  fill(c, `M-58 ${y + 6} Q0 ${y - 30} 76 ${y - 6} Q70 ${y + 10} 52 ${y + 12} Z`, color);
}

function cane(c: C, hx: number, hy: number) {
  line(c, `M${hx + 4} ${hy + 10} L${hx + 30} 0`, "#3a2416", 12);
  dot(c, hx + 2, hy + 18, 12, "#d9b24a", true);
}

// ---------------------------------------------------------------------------
// The characters
// ---------------------------------------------------------------------------

export type Painter = (c: C, frame: number) => void;

interface Gent {
  coat: string;
  waistcoat: string;
  cravat: string;
  trousers: string;
  stripes?: boolean;
  face: Face;
  hat: "top" | "bowler" | "none";
  cane?: boolean;
}

/** A gentleman of the committee. Frame 1: he raises his hat. */
function gent(g: Gent): Painter {
  return (c, frame) => {
    shoes(c);
    trousers(c, g.trousers, g.stripes);
    const [lx, ly] = arm(c, -1, "down", g.coat, "#f2efe8");
    frockCoat(c, g.coat, g.waistcoat, g.cravat);
    head(c, g.face);
    if (frame === 0 || g.hat === "none") {
      arm(c, 1, g.cane ? "down" : "hip", g.coat, "#f2efe8");
      if (g.hat === "top") topHat(c);
      if (g.hat === "bowler") bowler(c);
      if (g.cane) cane(c, 122, 470);
    } else {
      // the hat, raised an inch off the head
      if (g.hat === "top") topHat(c, undefined, undefined, 918, 44);
      if (g.hat === "bowler") bowler(c, undefined, 958);
      arm(c, 1, "hat", g.coat, "#f2efe8");
      if (g.cane) cane(c, lx - 10, ly);
    }
  };
}

interface Lady {
  dress: string;
  trim: string;
  mantilla?: boolean;
  bonnet?: string;
  hair: string;
  parasol?: string;
}

/** A lady of the society, in the fashion of 1882: bustle, drape, and either a mantilla and fan or a parasol. */
function lady(l: Lady): Painter {
  return (c, frame) => {
    shoes(c, "#2a1a14");
    // the skirt, the apron drape, a pleated hem
    fill(c, "M-54 560 Q-96 380 -170 40 Q-176 14 -150 12 L150 12 Q176 14 170 40 Q96 380 54 560 Z", l.dress);
    fill(c, "M-160 60 L160 60 L158 12 L-158 12 Z", l.trim, { width: 4 });
    for (let x = -140; x <= 140; x += 28) line(c, `M${x} 16 L${x * 1.01} 56`, "rgba(0,0,0,0.22)", 3);
    fill(c, "M-56 556 Q-126 420 -124 300 Q-60 250 0 262 Q60 250 124 300 Q126 420 56 556 Z", l.trim);
    line(c, "M-90 330 Q0 290 90 330", "rgba(0,0,0,0.2)", 5);
    // the bodice, buttoned, narrow at the waist
    fill(c, "M-80 764 Q-94 690 -54 556 L54 556 Q94 690 80 764 Z", l.dress);
    for (const y of [720, 680, 640, 600]) dot(c, 0, y, 5, l.trim, true);
    fill(c, "M-30 770 L30 770 L22 740 L-22 740 Z", WHITE, { width: 4 });
    head(c, { hair: l.hair, cy: 852, scale: 0.9 });
    // hair up, in a bun
    dot(c, 0, 920, 26, l.hair, true);
    if (l.mantilla) {
      // a peineta comb, and black lace falling to the shoulders
      fill(c, "M-44 900 Q-58 990 0 1030 Q58 990 44 900 Z", "#4a2c18");
      c.save();
      c.globalAlpha = 0.82;
      fill(c, "M-44 1000 Q-100 960 -104 860 Q-110 760 -128 700 Q-100 690 -84 720 Q-70 690 -52 720 Q-60 800 -50 880 Q-40 950 0 960 Q40 950 50 880 Q60 800 52 720 Q70 690 84 720 Q100 690 128 700 Q110 760 104 860 Q100 960 44 1000 Q0 1020 -44 1000 Z", "#1a1216", { shade: false, width: 3 });
      c.restore();
      // arms: clasped, with a fan (open on frame 1)
      arm(c, -1, "front", l.dress, SKIN, 82);
      const [hx, hy] = arm(c, 1, frame ? "chest" : "front", l.dress, SKIN, 82);
      if (frame) {
        c.save();
        c.translate(hx, hy + 6);
        for (let k = 0; k < 7; k++) {
          const a = Math.PI * (0.15 + (k / 6) * 0.7);
          fill(c, `M0 0 L${Math.cos(a) * 96} ${Math.sin(a) * 96} L${Math.cos(a + 0.18) * 96} ${Math.sin(a + 0.18) * 96} Z`, k % 2 ? "#c9373c" : "#f2d9a6", { width: 3 });
        }
        c.restore();
      } else line(c, `M${hx} ${hy} L${hx + 10} ${hy + 70}`, "#c9373c", 12);
    } else {
      if (l.bonnet) {
        fill(c, "M-60 930 Q-66 1000 0 1010 Q66 1000 60 930 Q0 950 -60 930 Z", l.bonnet);
        dot(c, -30, 982, 12, "#e04a5a", true);
        dot(c, -8, 994, 10, "#f2d06a", true);
        line(c, "M-50 930 Q-40 880 -10 860", l.trim, 6);
      }
      arm(c, -1, "front", l.dress, "#f2efe8", 82);
      const [hx, hy] = arm(c, 1, "raise", l.dress, "#f2efe8", 82);
      if (l.parasol) {
        const tilt = frame ? 0.14 : -0.04;
        c.save();
        c.translate(hx, hy);
        c.rotate(tilt);
        c.scale(0.8, 0.8);
        line(c, "M0 0 L-6 300", "#3a2416", 9);
        fill(c, "M-150 270 Q-150 410 -6 420 Q140 410 138 270 Q110 286 84 270 Q58 288 30 272 Q2 288 -26 272 Q-54 288 -82 272 Q-112 288 -150 270 Z", l.parasol);
        for (const x of [-100, -50, 0, 50, 100]) line(c, `M-6 416 L${x} 276`, "rgba(0,0,0,0.25)", 3);
        c.restore();
      }
    }
  };
}

/** The Bishop of Barcelona: alb, red cope, mitre, crozier. Frame 1: a blessing. */
const bishop: Painter = (c, frame) => {
  shoes(c, "#6a1a2a");
  fill(c, "M-96 760 L-132 14 L132 14 L96 760 Z", WHITE);
  fill(c, "M-132 14 L132 14 L128 70 L-128 70 Z", "#ead8b0", { width: 4 });
  // the cope, open at the front, with its gold orphrey
  const cope = "M-106 772 Q-172 420 -160 70 L-70 70 Q-40 420 -34 752 Z";
  fill(c, cope, "#9e1e34");
  fill(c, mirror(cope), "#9e1e34");
  fill(c, "M-34 752 Q-40 420 -70 70 L-46 70 Q-18 420 -12 752 Z", "#d9aa3a", { width: 4 });
  fill(c, mirror("M-34 752 Q-40 420 -70 70 L-46 70 Q-18 420 -12 752 Z"), "#d9aa3a", { width: 4 });
  fill(c, "M-40 736 L40 736 L40 700 L-40 700 Z", "#d9aa3a", { width: 4 });
  dot(c, 0, 718, 14, "#3a7ad0", true);
  // the crozier, in his left hand
  const [lx, ly] = arm(c, -1, "front", "#9e1e34", "#f6f1e6");
  line(c, `M${lx} 0 L${lx} 1070`, "#c9982a", 12);
  line(c, `M${lx} 1060 Q${lx} 1150 ${lx + 56} 1146 Q${lx + 92} 1126 ${lx + 70} 1094 Q${lx + 52} 1078 ${lx + 40} 1098`, "#c9982a", 14);
  void ly;
  head(c, { hair: "#c9c2b6", moustache: "none", beard: "none", shut: frame === 1 });
  // the mitre, with its lappets
  fill(c, "M-50 912 L-56 1044 L0 1110 L56 1044 L50 912 Z", "#f4ecd8");
  fill(c, "M-8 912 L-8 1100 L8 1100 L8 912 Z", "#d9aa3a", { width: 3 });
  fill(c, "M-50 912 L50 912 L51 936 L-51 936 Z", "#d9aa3a", { width: 3 });
  arm(c, 1, frame ? "up" : "front", "#9e1e34", "#f6f1e6");
};

/** A priest: cassock, biretta, a book. Frame 1: he looks up from it. */
const priest: Painter = (c, frame) => {
  shoes(c);
  fill(c, "M-100 766 L-122 14 L122 14 L100 766 Z", "#1c1818");
  for (let y = 740; y > 40; y -= 46) dot(c, 0, y, 4, "#3a3434");
  arm(c, -1, "chest", "#1c1818");
  const [hx, hy] = arm(c, 1, "chest", "#1c1818");
  fill(c, `M${hx - 90} ${hy - 30} L${hx + 10} ${hy - 30} L${hx + 10} ${hy + 44} L${hx - 90} ${hy + 44} Z`, frame ? "#6a1a1a" : "#1a1414");
  if (!frame) fill(c, `M${hx - 88} ${hy + 40} L${hx + 8} ${hy + 40} L${hx + 8} ${hy + 30} L${hx - 88} ${hy + 30} Z`, "#e9d6a0", { width: 2, shade: false });
  fill(c, "M-22 776 L22 776 L22 752 L-22 752 Z", WHITE, { width: 3 });
  head(c, { hair: "#4a3a30", moustache: "none", shut: frame === 0 });
  // biretta: three ridges and a pompom
  fill(c, "M-50 912 L-52 990 L52 990 L50 912 Z", "#141010");
  for (const x of [-26, 0, 26]) line(c, `M${x} 990 L${x} 1006`, "#141010", 10);
  dot(c, 0, 1012, 11, "#141010");
};

/** An altar boy with a censer. Frame 1: the censer swings. */
const altarBoy: Painter = (c, frame) => {
  c.save();
  c.scale(0.78, 0.78);
  shoes(c);
  fill(c, "M-96 760 L-116 14 L116 14 L96 760 Z", "#a82a2c");
  // the surplice, with lace at the hem
  fill(c, "M-110 766 Q-150 600 -150 400 L150 400 Q150 600 110 766 Z", WHITE);
  for (let x = -140; x < 150; x += 20) dot(c, x, 404, 9, WHITE, true);
  arm(c, -1, "front", WHITE);
  const [hx, hy] = arm(c, 1, "down", WHITE);
  head(c, { hair: "#5a3a22", cy: 860, scale: 1.06 });
  fill(c, "M-56 900 Q-60 950 0 958 Q60 950 56 900 Q30 916 0 914 Q-30 916 -56 900 Z", "#5a3a22");
  // the thurible, on its chains
  const sx = frame ? hx + 120 : hx - 10;
  const sy = hy - 280;
  line(c, `M${hx} ${hy} L${sx - 14} ${sy + 40} M${hx} ${hy} L${sx + 14} ${sy + 40}`, "#c9982a", 3);
  fill(c, `M${sx - 34} ${sy + 40} Q${sx - 40} ${sy - 10} ${sx} ${sy - 18} Q${sx + 40} ${sy - 10} ${sx + 34} ${sy + 40} Z`, "#d9aa3a");
  // and its smoke
  c.globalAlpha = 0.45;
  for (let k = 0; k < 4; k++) dot(c, sx + (frame ? -20 : 10) * k, sy + 60 + k * 50, 20 + k * 8, "#e8e4dc");
  c.globalAlpha = 1;
  c.restore();
};

interface Mason {
  smock: string;
  trousers: string;
  cap: "barretina" | "flat";
  capColor?: string;
  face: Face;
}

/** A mason at his block, mallet and chisel. Frame 0: mallet up; frame 1: the blow. */
function mason(m: Mason): Painter {
  return (c, frame) => {
    espadrilles(c);
    trousers(c, m.trousers);
    // the smock, loose, gathered at the yoke; the red sash
    fill(c, "M-104 766 Q-146 600 -136 360 L136 360 Q146 600 104 766 Z", m.smock);
    for (const x of [-60, -30, 0, 30, 60]) line(c, `M${x} 740 Q${x * 1.1} 560 ${x * 1.25} 370`, "rgba(0,0,0,0.12)", 4);
    fill(c, "M-134 540 L134 540 L134 488 L-134 488 Z", "#b52a2a", { width: 4 });
    fill(c, "M96 488 L126 380 L150 392 L124 488 Z", "#b52a2a", { width: 4 });
    fill(c, "M-30 780 L30 780 L0 740 Z", "#e8e0d0", { width: 4 });
    head(c, m.face);
    if (m.cap === "barretina") barretina(c);
    else flatCap(c, m.capColor ?? "#5a5048");
    // the block in front of him
    fill(c, "M-150 0 L150 0 L150 180 L-150 180 Z", "#d8c49a");
    line(c, "M-130 140 L-40 160 M60 60 L130 90", "rgba(90,60,30,0.35)", 4);
    // the chisel, in his left hand, its point on the stone
    const [lx, ly] = arm(c, -1, "strike", m.smock, SKIN);
    line(c, `M${lx + 6} ${ly + 30} L${lx + 34} 184`, "#8a8a88", 12);
    line(c, `M${lx + 2} ${ly + 30} L${lx + 8} ${ly + 70}`, "#5a4a3a", 16);
    // the mallet: up, or down on the chisel's head
    if (frame === 0) {
      const [hx, hy] = arm(c, 1, "up", m.smock, SKIN);
      line(c, `M${hx} ${hy} L${hx + 70} ${hy + 90}`, "#7a5230", 12);
      fill(c, `M${hx + 50} ${hy + 90} L${hx + 120} ${hy + 40} L${hx + 146} ${hy + 76} L${hx + 76} ${hy + 126} Z`, "#8a6a44");
    } else {
      const [hx, hy] = arm(c, 1, "front", m.smock, SKIN);
      line(c, `M${hx} ${hy} L${lx + 40} ${ly + 70}`, "#7a5230", 12);
      fill(c, `M${lx - 10} ${ly + 44} L${lx + 60} ${ly + 44} L${lx + 60} ${ly + 96} L${lx - 10} ${ly + 96} Z`, "#8a6a44");
      // chips of stone
      for (const [x, y] of [
        [lx + 70, 230],
        [lx + 100, 260],
        [lx + 10, 250],
      ])
        dot(c, x, y, 7, "#efe2c4", true);
    }
  };
}

/** Josep Maria Bocabella, bookseller, with an armful of his books. Frame 1: he offers one. */
const bookseller: Painter = (c, frame) => {
  shoes(c);
  trousers(c, "#2a2624");
  arm(c, -1, "down", "#1e1a18", "#f2efe8");
  frockCoat(c, "#1e1a18", "#3a3028", "#1a1414");
  head(c, { hair: "#b8b0a4", beard: "long", moustache: "walrus" });
  topHat(c);
  const cols = ["#b8322f", "#2f4a5a", "#e9b736", "#3f6a3a", "#6a3a6a"];
  const lift = frame ? 60 : 0;
  for (let k = 0; k < 5; k++) {
    const y = 560 + k * 26 + (k === 4 ? lift : 0);
    fill(c, `M-20 ${y} L110 ${y + 6} L110 ${y + 30} L-20 ${y + 24} Z`, cols[k], { width: 3 });
  }
  arm(c, 1, "chest", "#1e1a18", "#f2efe8");
};

interface Architect {
  young: boolean;
}

/** Antoni Gaudí: the dandy of 1883, or the old man of 1920 in a crumpled suit. Frame 1: he points up. */
function gaudi(a: Architect): Painter {
  return (c, frame) => {
    if (a.young) {
      shoes(c);
      trousers(c, "#2a3040");
      arm(c, -1, frame ? "down" : "hip", "#23304a", "#f2efe8");
      frockCoat(c, "#23304a", "#6a5a3a", "#8a2a3a");
      head(c, { hair: "#b8804a", beard: "full", moustache: "walrus" });
      topHat(c);
      arm(c, 1, frame ? "up" : "down", "#23304a", "#f2efe8");
    } else {
      espadrilles(c);
      trousers(c, "#3a3632");
      // a baggy jacket, badly buttoned
      fill(c, "M-110 766 Q-134 600 -128 340 L128 340 Q134 600 110 766 Z", "#44403a");
      fill(c, "M-40 770 L40 770 L0 690 Z", "#e8e0d0", { width: 4 });
      line(c, "M-6 690 L-10 360", "rgba(0,0,0,0.3)", 4);
      for (const y of [620, 520]) dot(c, -8, y, 6, "#2a2622", true);
      arm(c, -1, "chest", "#44403a");
      // a roll of plans under his arm
      fill(c, "M-150 640 L40 700 L32 728 L-156 668 Z", "#e8dcc0", { width: 4 });
      head(c, { hair: "#f2f0ea", beard: "full", moustache: "walrus" });
      arm(c, 1, frame ? "up" : "down", "#44403a");
    }
  };
}

// ---------------------------------------------------------------------------
// The sheet
// ---------------------------------------------------------------------------

export const CAST: Record<string, Painter> = {
  gent: gent({ coat: "#1f1c1c", waistcoat: "#7a6a52", cravat: "#6a2230", trousers: "#6a6a6a", stripes: true, face: { hair: "#3a2a20", moustache: "handlebar" }, hat: "top", cane: true }),
  gent2: gent({ coat: "#2e2a36", waistcoat: "#a8884a", cravat: "#2a2a4a", trousers: "#3a3434", face: { hair: "#5a3a26", moustache: "walrus", beard: "chin" }, hat: "top" }),
  gent3: gent({ coat: "#3a3028", waistcoat: "#c9b88a", cravat: "#1a1a1a", trousers: "#55504a", face: { hair: "#8a8278", moustache: "walrus", bald: true }, hat: "bowler" }),
  gent4: gent({ coat: "#26303a", waistcoat: "#e2d6b8", cravat: "#b8322f", trousers: "#7a7466", stripes: true, face: { hair: "#1a1410", moustache: "pencil" }, hat: "top", cane: true }),
  lady: lady({ dress: "#6a2c3c", trim: "#8a4252", mantilla: true, hair: "#2a1a12" }),
  lady2: lady({ dress: "#2f4a5a", trim: "#d9cdb4", bonnet: "#e8d8c0", hair: "#6a4428", parasol: "#e9d6c8" }),
  lady3: lady({ dress: "#1e1a1e", trim: "#3a3036", mantilla: true, hair: "#1a1210" }),
  lady4: lady({ dress: "#8a7a4a", trim: "#e8dcc0", bonnet: "#b8c8a8", hair: "#8a5a30", parasol: "#c9373c" }),
  priest,
  bishop,
  boy: altarBoy,
  mason: mason({ smock: "#3a5a86", trousers: "#b8a888", cap: "barretina", face: { hair: "#3a2a20", moustache: "walrus" } }),
  mason2: mason({ smock: "#8a8e90", trousers: "#6a5a44", cap: "flat", capColor: "#4a4038", face: { hair: "#6a5040", beard: "full" } }),
  bookseller,
  gaudiYoung: gaudi({ young: true }),
  gaudiOld: gaudi({ young: false }),
};

/** Every figure's box, in painter units: centred on the feet. */
const BOX = { w: 560, h: 1180 };
const TW = 192;
const TH = 400;
const COLS = 10;
const NAMES = Object.keys(CAST);
const ROWS = Math.ceil((NAMES.length * 2) / COLS);

/** World size of a figure's tile at scale 1 (a grown man ≈ 0.43 tall, like the old cut-outs). */
export const CAST_SIZE = { w: (BOX.w / 1000) * 0.43, h: (BOX.h / 1000) * 0.43 };

export function paintCast() {
  const cv = document.createElement("canvas");
  cv.width = COLS * TW;
  cv.height = ROWS * TH;
  const ctx = cv.getContext("2d")!;
  const k = (TH - 8) / BOX.h;
  NAMES.forEach((name, n) => {
    for (let f = 0; f < 2; f++) {
      const t = n * 2 + f;
      const col = t % COLS;
      const row = Math.floor(t / COLS);
      ctx.save();
      ctx.translate(col * TW + TW / 2, row * TH + TH - 4);
      ctx.scale(k, -k);
      ctx.beginPath();
      ctx.rect(-BOX.w / 2, -10, BOX.w, BOX.h + 10);
      ctx.clip();
      CAST[name](ctx, f);
      ctx.restore();
    }
  });
  return cv;
}

/** Where a figure's frame sits in the sheet, in 0..1 texture units. */
export function castRect(name: string, frame: number) {
  const n = NAMES.indexOf(name);
  if (n < 0) throw new Error(`no such character: ${name}`);
  const t = n * 2 + frame;
  const col = t % COLS;
  const row = Math.floor(t / COLS);
  const k = (TH - 8) / BOX.h;
  const pw = BOX.w * k;
  const ph = BOX.h * k;
  const x0 = col * TW + TW / 2 - pw / 2;
  const y0 = row * TH + TH - 4 - ph;
  const W = COLS * TW;
  const H = ROWS * TH;
  return { u0: x0 / W, v0: 1 - (y0 + ph) / H, u1: (x0 + pw) / W, v1: 1 - y0 / H };
}

export const castNames = () => NAMES.slice();
