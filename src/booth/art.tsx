// The box office, drawn: a pink wall with two posters in gilt frames, a mint
// kiosk with a marquee of bulbs, a clerk in a pillbox hat behind the glass,
// a roller shutter, a bell. All in one 1600 × 1000 set, floor line at y 860.
//
// Everything that moves is moved by CSS (booth.css); this file only draws.

import type { CSSProperties, ReactNode } from "react";

const SERIF = { fontFamily: "var(--bx-serif)" } as const;
const SANS = { fontFamily: "var(--bx-sans)" } as const;
const MARQUEE = { fontFamily: "var(--bx-marquee)" } as const;
const ANTON = { fontFamily: "var(--bx-anton)" } as const;
const MARKER = { fontFamily: "var(--bx-marker)" } as const;

const PINK = "#e8b3a9";
const PINK_HI = "#f0c6bc";
const PINK_LO = "#cf958b";
const CREAM = "#f4e6cb";
const GOLD = "#c9a24a";
const GOLD_LO = "#8a6a24";
const BURGUNDY = "#86192a";
const MINT = "#93c3b1";
const MINT_LO = "#6fa290";
const INK = "#241417";

const i = (n: number): CSSProperties => ({ ["--i" as string]: n });

/* -------------------------------------------------------------------------- */
/*  The wall                                                                  */
/* -------------------------------------------------------------------------- */

function Pilaster({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y={96} width={44} height={684} fill={PINK_HI} />
      <rect x={x + 40} y={96} width={4} height={684} fill={PINK_LO} />
      <rect x={x - 6} y={96} width={56} height={16} fill={CREAM} />
      <rect x={x - 6} y={112} width={56} height={4} fill={PINK_LO} />
      <rect x={x - 4} y={760} width={52} height={20} fill={CREAM} />
    </g>
  );
}

function PictureLight({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x - 150} 250 L${x + 150} 250 L${x + 110} 470 L${x - 110} 470 Z`} fill="url(#bx-lightcone)" className="bx-lightcone" />
      <rect x={x - 4} y={214} width={8} height={24} fill={GOLD_LO} />
      <rect x={x - 70} y={232} width={140} height={14} rx={7} fill={GOLD} />
      <rect x={x - 70} y={241} width={140} height={5} rx={2} fill={GOLD_LO} />
      <rect x={x - 62} y={246} width={124} height={3} fill="#fff4cc" className="bx-lamp" />
    </g>
  );
}

function Frame({ x, children }: { x: number; children: ReactNode }) {
  const w = 300;
  const h = 460;
  const x0 = x - w / 2;
  const y0 = 270;
  return (
    <g>
      <rect x={x0 - 22} y={y0 - 22} width={w + 44} height={h + 44} fill="rgba(60,20,20,0.28)" transform="translate(8 10)" />
      <rect x={x0 - 22} y={y0 - 22} width={w + 44} height={h + 44} fill={GOLD} />
      <rect x={x0 - 22} y={y0 - 22} width={w + 44} height={h + 44} fill="none" stroke={GOLD_LO} strokeWidth={3} />
      <rect x={x0 - 12} y={y0 - 12} width={w + 24} height={h + 24} fill="none" stroke="#e9cf7e" strokeWidth={4} />
      <rect x={x0 - 4} y={y0 - 4} width={w + 8} height={h + 8} fill={GOLD_LO} />
      <svg x={x0} y={y0} width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="hidden">
        {children}
      </svg>
      {/* glass */}
      <path d={`M${x0} ${y0} L${x0 + 120} ${y0} L${x0} ${y0 + 160} Z`} fill="rgba(255,255,255,0.09)" />
      <path d={`M${x0 + w} ${y0 + h - 140} L${x0 + w} ${y0 + h} L${x0 + w - 90} ${y0 + h} Z`} fill="rgba(255,255,255,0.06)" />
    </g>
  );
}

/** The play's poster: velvet, a gilt proscenium, and a very long title. */
function TheatrePoster() {
  return (
    <>
      <rect width={300} height={460} fill="#5e1019" />
      {/* the proscenium */}
      <path d="M20 440 L20 120 Q20 34 150 34 Q280 34 280 120 L280 440" fill="none" stroke={GOLD} strokeWidth={10} />
      <path d="M32 440 L32 124 Q32 48 150 48 Q268 48 268 124 L268 440" fill="#1b0508" stroke="#8a6a24" strokeWidth={2} />
      {/* the curtains, drawn back */}
      <path d="M32 124 Q32 48 150 48 L150 58 Q84 70 76 150 Q70 300 88 440 L32 440 Z" fill="#a3303a" />
      <path d="M268 124 Q268 48 150 48 L150 58 Q216 70 224 150 Q230 300 212 440 L268 440 Z" fill="#a3303a" />
      {[44, 56, 238, 250].map((x) => (
        <path key={x} d={`M${x} 90 Q${x + (x < 150 ? 6 : -6)} 260 ${x} 440`} stroke="#6e1522" strokeWidth={3} fill="none" opacity={0.7} />
      ))}
      <path d="M40 60 Q150 110 260 60 L260 74 Q150 128 40 74 Z" fill="#7d1620" />
      <circle cx={150} cy={78} r={3} fill={GOLD} />
      {/* the spot */}
      <ellipse cx={150} cy={396} rx={70} ry={12} fill="rgba(255,236,190,0.25)" />
      <text x={150} y={138} textAnchor="middle" fill={GOLD} style={SANS} fontSize={10} fontWeight={600} letterSpacing={3.4}>
        THE ZARCERO THEATRE
      </text>
      <text x={150} y={156} textAnchor="middle" fill="#e9cf7e" style={SERIF} fontStyle="italic" fontSize={12}>
        presents
      </text>
      <text x={150} y={196} textAnchor="middle" fill={CREAM} style={SERIF} fontSize={23} fontWeight={700} letterSpacing={0.5}>
        NICOLÁS ZARCERO
      </text>
      <text x={150} y={214} textAnchor="middle" fill="#e9cf7e" style={SANS} fontSize={8.5} fontWeight={600} letterSpacing={2.6}>
        ENGINEER · DESIGNER
      </text>
      <text x={150} y={262} textAnchor="middle" fill={CREAM} style={SERIF} fontStyle="italic" fontSize={34}>
        A Portfolio
      </text>
      <text x={150} y={300} textAnchor="middle" fill={CREAM} style={SERIF} fontStyle="italic" fontSize={34}>
        in Five Acts
      </text>
      <text x={150} y={326} textAnchor="middle" fill="#e9cf7e" style={SERIF} fontStyle="italic" fontSize={13}>
        with an intermission
      </text>
      <text x={150} y={420} textAnchor="middle" fill={GOLD} style={SANS} fontSize={8.5} fontWeight={600} letterSpacing={2.4}>
        NIGHTLY · STALLS · ROW Z
      </text>
      {[-1, 1].map((s) => (
        <text key={s} x={150 + s * 88} y={301} textAnchor="middle" fill={GOLD} fontSize={14} style={SERIF}>
          ✦
        </text>
      ))}
    </>
  );
}

/** Four spires, a cross, and the scaffolding: the silhouette of the picture. */
export function Spires({ fill = INK }: { fill?: string }) {
  const tower = (x: number, h0: number, w: number) => {
    const h = h0 * 0.74;
    return `M${x - w} 460 L${x - w} ${460 - h * 0.62} Q${x - w * 0.95} ${460 - h * 0.9} ${x} ${460 - h} Q${x + w * 0.95} ${460 - h * 0.9} ${x + w} ${460 - h * 0.62} L${x + w} 460 Z`;
  };
  return (
    <g fill={fill}>
      <path d={tower(52, 150, 13)} />
      <path d={tower(84, 176, 14)} />
      <path d={tower(216, 176, 14)} />
      <path d={tower(248, 150, 13)} />
      <path d={tower(116, 214, 16)} />
      <path d={tower(184, 214, 16)} />
      <path d={tower(150, 262, 20)} />
      <rect x={148} y={248} width={4} height={20} />
      <rect x={142} y={253} width={16} height={4} />
      <path d="M0 460 L0 392 L30 386 L30 460 Z M270 460 L270 386 L300 392 L300 460 Z" />
      <rect x={20} y={378} width={260} height={82} />
      {/* windows, lit */}
      {[70, 110, 150, 190, 230].map((x) => (
        <path key={x} d={`M${x - 6} 446 L${x - 6} 418 Q${x} 408 ${x + 6} 418 L${x + 6} 446 Z`} fill="#f2c230" opacity={0.85} />
      ))}
    </g>
  );
}

/** The picture's poster: yellow, black, and the director's red marker. */
function PicturePoster() {
  return (
    <>
      <rect width={300} height={460} fill="#f2c230" />
      <rect width={300} height={460} fill="url(#bx-grain)" opacity={0.5} />
      <text x={22} y={42} fill={INK} style={SANS} fontSize={9} fontWeight={600} letterSpacing={2.2}>
        THE ZARCERO PICTURE COMPANY
      </text>
      <text x={22} y={104} fill={INK} style={ANTON} fontSize={60} letterSpacing={-0.5}>
        THE CLIENT
      </text>
      <text x={22} y={164} fill={INK} style={ANTON} fontSize={60}>
        IS NOT IN
      </text>
      <text x={22} y={224} fill={INK} style={ANTON} fontSize={60}>
        A HURRY
      </text>
      <text x={22} y={250} fill={INK} style={SERIF} fontStyle="italic" fontSize={13}>
        a picture in seven chapters
      </text>
      <Spires />
      <g className="bx-scrawl" style={MARKER}>
        <path
          pathLength={1}
          d="M168 262 C 200 246 290 250 286 280 C 282 306 190 310 170 290 C 158 276 176 262 210 258"
          fill="none"
          stroke="#d8262e"
          strokeWidth={3.2}
          strokeLinecap="round"
        />
        <text x={228} y={287} textAnchor="middle" fill="#d8262e" fontSize={19} transform="rotate(-5 228 287)">
          now showing!
        </text>
      </g>
    </>
  );
}

function Plaque({ x, children }: { x: number; children: string }) {
  return (
    <g>
      <rect x={x - 90} y={758} width={180} height={26} rx={3} fill={GOLD} stroke={GOLD_LO} strokeWidth={2} />
      <circle cx={x - 80} cy={771} r={2.4} fill={GOLD_LO} />
      <circle cx={x + 80} cy={771} r={2.4} fill={GOLD_LO} />
      <text x={x} y={775.5} textAnchor="middle" fill={INK} style={SANS} fontSize={11} fontWeight={600} letterSpacing={2.4}>
        {children}
      </text>
    </g>
  );
}

export function Wall() {
  const pilasters = [];
  for (let x = -1810; x < 3400; x += 380) pilasters.push(x);
  return (
    <svg className="bx-art bx-art--wall" viewBox="0 0 1600 1000" overflow="visible" aria-hidden="true">
      <defs>
        <radialGradient id="bx-lightcone" cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="#fff2cf" stopOpacity={0.5} />
          <stop offset="1" stopColor="#fff2cf" stopOpacity={0} />
        </radialGradient>
        <pattern id="bx-grain" width={6} height={6} patternUnits="userSpaceOnUse">
          <circle cx={1} cy={1} r={0.6} fill="#b8871a" />
          <circle cx={4} cy={3.5} r={0.5} fill="#fff1b0" />
        </pattern>
        <pattern id="bx-tiles" width={40} height={80} patternUnits="userSpaceOnUse" x={0} y={784}>
          <rect width={40} height={80} fill="#7a2330" />
          <rect width={38} height={36} x={1} y={1} fill="#86293a" />
          <rect width={38} height={36} x={1} y={41} fill="#80263a" />
        </pattern>
      </defs>
      {/* stucco */}
      <rect x={-2400} y={-2000} width={6400} height={2860} fill={PINK} />
      {/* cornice and frieze */}
      <rect x={-2400} y={20} width={6400} height={16} fill={PINK_LO} />
      <rect x={-2400} y={36} width={6400} height={12} fill={CREAM} />
      <rect x={-2400} y={48} width={6400} height={18} fill="#dc9f95" />
      <rect x={-2400} y={66} width={6400} height={8} fill="url(#bx-dentil)" />
      <pattern id="bx-dentil" width={18} height={8} patternUnits="userSpaceOnUse">
        <rect width={10} height={8} fill={CREAM} />
      </pattern>
      <rect x={-2400} y={86} width={6400} height={6} fill={CREAM} />
      {pilasters.map((x) => (
        <Pilaster key={x} x={x} />
      ))}
      {/* the dado: burgundy tiles under a cream rail */}
      <rect x={-2400} y={784} width={6400} height={76} fill="url(#bx-tiles)" />
      <rect x={-2400} y={776} width={6400} height={10} fill={CREAM} />
      <rect x={-2400} y={786} width={6400} height={3} fill={PINK_LO} />
      <rect x={-2400} y={852} width={6400} height={10} fill="#3a1a1e" />
      {/* the posters */}
      <PictureLight x={300} />
      <PictureLight x={1300} />
      <Frame x={300}>
        <TheatrePoster />
      </Frame>
      <Frame x={1300}>
        <PicturePoster />
      </Frame>
      <Plaque x={300}>← THE THEATRE</Plaque>
      <Plaque x={1300}>THE PICTURE HOUSE →</Plaque>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  The kiosk                                                                 */
/* -------------------------------------------------------------------------- */

const ARCH = "M660 620 L660 476 A140 140 0 0 1 940 476 L940 620 Z";

function Bulbs() {
  const pts: [number, number][] = [];
  for (let x = 572; x <= 1028; x += 24) pts.push([x, 158]);
  for (let y = 182; y <= 230; y += 24) pts.push([1030, y]);
  for (let x = 1028; x >= 572; x -= 24) pts.push([x, 254]);
  for (let y = 230; y >= 182; y -= 24) pts.push([570, y]);
  return (
    <g>
      {pts.map(([x, y], k) => (
        <g key={k} className="bx-bulb" style={i(k)}>
          <circle cx={x} cy={y} r={13} fill="url(#bx-bulbglow)" className="bx-bulb__glow" />
          <circle cx={x} cy={y} r={5} className="bx-bulb__lamp" />
        </g>
      ))}
    </g>
  );
}

function Sunburst({ cx, cy, r, a, b, n = 14 }: { cx: number; cy: number; r: number; a: string; b: string; n?: number }) {
  const rays = [];
  for (let k = 0; k < n; k++) {
    const t0 = Math.PI + (k / n) * Math.PI;
    const t1 = Math.PI + ((k + 1) / n) * Math.PI;
    rays.push(
      <path
        key={k}
        d={`M${cx} ${cy} L${(cx + r * Math.cos(t0)).toFixed(1)} ${(cy + r * Math.sin(t0)).toFixed(1)} A${r} ${r} 0 0 1 ${(cx + r * Math.cos(t1)).toFixed(1)} ${(cy + r * Math.sin(t1)).toFixed(1)} Z`}
        fill={k % 2 ? a : b}
      />,
    );
  }
  return <g>{rays}</g>;
}

function Column({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y={300} width={60} height={540} fill={CREAM} />
      {[10, 20, 30, 40, 50].map((d) => (
        <rect key={d} x={x + d - 1.5} y={330} width={3} height={478} rx={1.5} fill="#dccaa5" />
      ))}
      <rect x={x + 56} y={300} width={4} height={540} fill="#d4c09a" />
      <rect x={x - 6} y={300} width={72} height={10} fill={GOLD} />
      <rect x={x - 3} y={310} width={66} height={8} fill={GOLD_LO} />
      <rect x={x - 6} y={808} width={72} height={10} fill={GOLD} />
      <rect x={x - 8} y={818} width={76} height={22} fill={CREAM} />
    </g>
  );
}

function Awning() {
  const stripes = [];
  for (let k = 0; k < 18; k++) {
    stripes.push(<rect key={k} x={602 + k * 22} y={300} width={22} height={26} fill={k % 2 ? "#f4e6cb" : "#cf4a5c"} />);
  }
  let scallop = "M602 326";
  for (let k = 0; k < 18; k++) scallop += ` a11 9 0 0 0 22 0`;
  return (
    <g>
      <path d="M594 300 L1006 300 L1006 326 L594 326 Z" fill="rgba(40,10,10,0.2)" transform="translate(0 8)" />
      <clipPath id="bx-awning">
        <path d={`${scallop} L998 300 L602 300 Z`} />
      </clipPath>
      <g clipPath="url(#bx-awning)">{stripes}</g>
      <rect x={596} y={296} width={408} height={6} rx={3} fill={GOLD} />
    </g>
  );
}

/** Behind the glass: the office, and the clerk. */
function Office() {
  return (
    <g>
      <rect x={650} y={320} width={300} height={310} fill="url(#bx-office)" />
      {/* wallpaper */}
      {Array.from({ length: 15 }, (_, k) => (
        <rect key={k} x={660 + k * 20} y={330} width={10} height={290} fill="#e2b976" opacity={0.35} />
      ))}
      {/* pigeonholes of ticket rolls */}
      <rect x={668} y={392} width={76} height={96} fill="#6b3a24" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <g key={`${r}${c}`}>
            <rect x={672 + c * 24} y={396 + r * 30} width={20} height={26} fill="#3a1e12" />
            <circle cx={682 + c * 24} cy={413 + r * 30} r={7} fill={(r + c) % 2 ? "#f2c230" : "#e8d2a6"} />
            <circle cx={682 + c * 24} cy={413 + r * 30} r={2.2} fill="#6b3a24" />
          </g>
        )),
      )}
      {/* the clock */}
      <g>
        <circle cx={878} cy={404} r={28} fill={BURGUNDY} />
        <circle cx={878} cy={404} r={23} fill="#f8efdc" />
        {Array.from({ length: 12 }, (_, k) => (
          <rect key={k} x={877} y={383} width={2} height={k % 3 ? 3 : 5} fill={INK} transform={`rotate(${k * 30} 878 404)`} />
        ))}
        <g className="bx-hand bx-hand--h">
          <rect x={876.8} y={392} width={2.4} height={13} rx={1.2} fill={INK} />
        </g>
        <g className="bx-hand bx-hand--m">
          <rect x={877.2} y={386} width={1.6} height={19} rx={0.8} fill={INK} />
        </g>
        <circle cx={878} cy={404} r={2} fill={GOLD} />
      </g>
      <rect x={650} y={500} width={300} height={6} fill="#6b3a24" opacity={0.5} />
      <Clerk />
    </g>
  );
}

function Clerk() {
  const SKIN = "#f1c9a6";
  return (
    <g className="bx-clerk">
      {/* uniform */}
      <path d="M700 632 L706 596 Q712 574 744 568 L856 568 Q888 574 894 596 L900 632 Z" fill="#5c2a6b" />
      <path d="M744 568 L800 612 L856 568 Z" fill="#f7efe0" />
      <path d="M744 568 L772 572 L800 612 Z M856 568 L828 572 L800 612 Z" fill="#48205a" />
      {[590, 606].map((y) => (
        <g key={y}>
          <circle cx={776} cy={y + 6} r={3} fill={GOLD} />
          <circle cx={824} cy={y + 6} r={3} fill={GOLD} />
        </g>
      ))}
      {/* epaulettes */}
      <rect x={712} y={574} width={30} height={7} rx={3} fill={GOLD} transform="rotate(-14 727 577)" />
      <rect x={858} y={574} width={30} height={7} rx={3} fill={GOLD} transform="rotate(14 873 577)" />
      {/* neck and bow tie */}
      <rect x={787} y={540} width={26} height={32} fill="#e0b18e" />
      <path d="M786 572 L800 578 L814 572 L814 586 L800 580 L786 586 Z" fill={BURGUNDY} />
      <circle cx={800} cy={579} r={3.2} fill="#6e1522" />
      {/* head */}
      <ellipse cx={761} cy={508} rx={6} ry={10} fill="#e6b692" />
      <ellipse cx={839} cy={508} rx={6} ry={10} fill="#e6b692" />
      <ellipse cx={800} cy={505} rx={38} ry={46} fill={SKIN} />
      <ellipse cx={777} cy={522} rx={7} ry={4} fill="#eba891" opacity={0.6} />
      <ellipse cx={823} cy={522} rx={7} ry={4} fill="#eba891" opacity={0.6} />
      {/* hair, very neatly parted */}
      <path d="M762 500 Q760 458 800 456 Q842 456 839 500 Q834 478 818 474 Q796 470 786 478 Q772 482 768 500 Z" fill="#3b2418" />
      <path d="M786 478 Q792 470 806 470" stroke="#5a3a28" strokeWidth={1.4} fill="none" />
      {/* the pillbox hat */}
      <g transform="rotate(-7 800 452)">
        <rect x={774} y={436} width={52} height={24} rx={4} fill={BURGUNDY} />
        <rect x={774} y={452} width={52} height={6} fill={GOLD} />
        <ellipse cx={800} cy={437} rx={26} ry={4} fill="#a3303a" />
        <path d="M824 458 Q836 476 834 496" stroke={GOLD} strokeWidth={1.4} fill="none" />
      </g>
      {/* brows, eyes */}
      <path d="M776 490 Q785 486 794 490" stroke="#3b2418" strokeWidth={2.6} strokeLinecap="round" fill="none" className="bx-brow" />
      <path d="M806 490 Q815 486 824 490" stroke="#3b2418" strokeWidth={2.6} strokeLinecap="round" fill="none" className="bx-brow" />
      <ellipse cx={785} cy={500} rx={7} ry={5} fill="#fbf6ee" />
      <ellipse cx={815} cy={500} rx={7} ry={5} fill="#fbf6ee" />
      <g className="bx-pupils">
        <circle cx={785} cy={500} r={3.3} fill="#2a1a12" />
        <circle cx={815} cy={500} r={3.3} fill="#2a1a12" />
        <circle cx={786.2} cy={498.8} r={1} fill="#fff" />
        <circle cx={816.2} cy={498.8} r={1} fill="#fff" />
      </g>
      <g className="bx-lids">
        <rect x={776} y={494} width={18} height={12} fill={SKIN} />
        <rect x={806} y={494} width={18} height={12} fill={SKIN} />
      </g>
      {/* nose, moustache, mouth */}
      <path d="M800 504 Q797 516 801 519" stroke="#c98d6e" strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <path d="M786 527 Q794 522 800 525 Q806 522 814 527" stroke="#3b2418" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <ellipse cx={800} cy={533} rx={6} ry={1.6} fill="#8c3a36" className="bx-mouth" />
    </g>
  );
}

function Shutter() {
  const ribs = [];
  for (let y = 322; y < 612; y += 12) ribs.push(<rect key={y} x={650} y={y} width={300} height={2} fill="#8f897f" />);
  return (
    <g className="bx-shutter">
      <rect x={650} y={316} width={300} height={306} fill="#b8b2a7" />
      {ribs}
      <rect x={650} y={600} width={300} height={22} fill="#7d776d" />
      <rect x={784} y={606} width={32} height={8} rx={4} fill="#4e4a44" />
      <text x={800} y={500} textAnchor="middle" fill="rgba(60,40,40,0.55)" style={SANS} fontSize={28} fontWeight={700} letterSpacing={8}>
        CLOSED
      </text>
    </g>
  );
}

export function Kiosk() {
  return (
    <svg className="bx-art bx-art--kiosk" viewBox="0 0 1600 1000" overflow="visible" aria-hidden="true">
      <defs>
        <radialGradient id="bx-bulbglow">
          <stop offset="0" stopColor="#fff3c4" stopOpacity={0.9} />
          <stop offset="0.35" stopColor="#ffd77a" stopOpacity={0.45} />
          <stop offset="1" stopColor="#ffb84a" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="bx-office" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6dca2" />
          <stop offset="1" stopColor="#d49a52" />
        </linearGradient>
        <linearGradient id="bx-marble" x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0" stopColor="#f1ebe0" />
          <stop offset="0.5" stopColor="#e4dccd" />
          <stop offset="1" stopColor="#f3eee5" />
        </linearGradient>
        <radialGradient id="bx-windowglow" cx="0.5" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#ffe8b0" stopOpacity={0.55} />
          <stop offset="1" stopColor="#ffe8b0" stopOpacity={0} />
        </radialGradient>
        <clipPath id="bx-window">
          <path d={ARCH} />
        </clipPath>
        <path id="bx-archtext" d="M660 476 A140 140 0 0 1 940 476" />
      </defs>

      {/* the warm spill from the window, on the wall behind */}
      <ellipse cx={800} cy={520} rx={420} ry={300} fill="url(#bx-windowglow)" className="bx-spill" />

      {/* crest */}
      <Sunburst cx={800} cy={148} r={78} a={GOLD} b={CREAM} n={16} />
      <circle cx={800} cy={112} r={24} fill={BURGUNDY} stroke={GOLD} strokeWidth={4} />
      <text x={800} y={124} textAnchor="middle" fill="#e9cf7e" style={SERIF} fontSize={32} fontWeight={700} fontStyle="italic">
        Z
      </text>

      {/* marquee */}
      <rect x={556} y={146} width={488} height={120} rx={6} fill="#2b1418" />
      <rect x={582} y={170} width={436} height={72} fill={CREAM} />
      <rect x={588} y={176} width={424} height={60} fill="none" stroke={BURGUNDY} strokeWidth={2} />
      <text x={800} y={228} textAnchor="middle" fill={BURGUNDY} style={MARQUEE} fontSize={56} letterSpacing={6} className="bx-marquee">
        BOX OFFICE
      </text>
      <Bulbs />

      {/* body */}
      <rect x={580} y={266} width={440} height={574} fill={MINT} />
      <rect x={580} y={266} width={440} height={574} fill="url(#bx-windowglow)" opacity={0.4} />
      <rect x={574} y={266} width={452} height={34} fill={CREAM} />
      <rect x={574} y={296} width={452} height={4} fill={GOLD} />
      <text x={800} y={288} textAnchor="middle" fill={BURGUNDY} style={SANS} fontSize={13} fontWeight={600} letterSpacing={7}>
        TAQUILLA · Nº 1 · TAQUILLA
      </text>
      <Column x={586} />
      <Column x={954} />
      <Awning />

      {/* the window */}
      <path d={ARCH} fill="none" stroke={GOLD} strokeWidth={32} />
      <path d={ARCH} fill="none" stroke={BURGUNDY} strokeWidth={25} />
      <g clipPath="url(#bx-window)">
        <Office />
        <rect x={650} y={320} width={300} height={310} fill="rgba(215,238,242,0.1)" />
        <path d="M650 420 L760 330 L800 330 L650 470 Z" fill="rgba(255,255,255,0.13)" />
        <path d="M650 500 L840 330 L852 330 L650 512 Z" fill="rgba(255,255,255,0.1)" />
        <path d="M860 630 L950 540 L950 580 L900 630 Z" fill="rgba(255,255,255,0.08)" />
        <Shutter />
      </g>
      <path d={ARCH} fill="none" stroke="#e9cf7e" strokeWidth={2} transform="translate(0 -1)" />
      <text fill="#f6e3b0" style={SANS} fontSize={12.5} fontWeight={600} letterSpacing={4.6} dominantBaseline="central">
        <textPath href="#bx-archtext" startOffset="50%" textAnchor="middle">
          TWO SHOWS TONIGHT
        </textPath>
      </text>
      {/* the speaking grille */}
      <circle cx={800} cy={596} r={17} fill={GOLD} stroke={GOLD_LO} strokeWidth={2} />
      {[
        [0, 0],
        [-7, 0],
        [7, 0],
        [0, -7],
        [0, 7],
        [-5, -5],
        [5, -5],
        [-5, 5],
        [5, 5],
      ].map(([dx, dy]) => (
        <circle key={`${dx},${dy}`} cx={800 + dx} cy={596 + dy} r={1.6} fill={GOLD_LO} />
      ))}

      {/* the counter */}
      <rect x={728} y={612} width={144} height={8} rx={3} fill="#1a0f0f" />
      <rect x={632} y={620} width={336} height={16} fill="url(#bx-marble)" />
      <path d="M660 624 Q700 630 740 626 M820 628 Q880 622 940 630" stroke="#c9bfae" strokeWidth={1} fill="none" />
      <rect x={632} y={636} width={336} height={10} fill="#cbbfab" />

      {/* the lower panel, with a sunburst inlay */}
      <rect x={646} y={646} width={308} height={162} fill={MINT_LO} />
      <rect x={668} y={664} width={264} height={128} fill={MINT} stroke={GOLD} strokeWidth={3} />
      <clipPath id="bx-panel">
        <rect x={668} y={664} width={264} height={128} />
      </clipPath>
      <g clipPath="url(#bx-panel)">
        <Sunburst cx={800} cy={792} r={120} a={CREAM} b={MINT} n={18} />
      </g>

      {/* plinth */}
      <rect x={570} y={840} width={460} height={16} fill="#3a1a1e" />
      <rect x={558} y={854} width={484} height={10} fill="#2a1216" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small props                                                               */
/* -------------------------------------------------------------------------- */

export function Bell() {
  return (
    <svg viewBox="0 0 60 44" aria-hidden="true" className="bx-bell__svg">
      <ellipse cx={30} cy={40} rx={24} ry={4} fill="rgba(0,0,0,0.25)" />
      <rect x={6} y={33} width={48} height={7} rx={3} fill="#3a1a1e" />
      <rect x={27} y={2} width={6} height={8} rx={2} fill={GOLD_LO} className="bx-bell__plunger" />
      <path d="M8 34 Q8 10 30 10 Q52 10 52 34 Z" fill={GOLD} />
      <path d="M14 30 Q15 16 28 14" stroke="#fff3c4" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.7} />
      <path d="M8 34 L52 34" stroke={GOLD_LO} strokeWidth={2} />
    </svg>
  );
}

export function Pigeon() {
  return (
    <svg viewBox="0 0 80 64" aria-hidden="true" className="bx-pigeon__svg">
      <ellipse cx={40} cy={60} rx={20} ry={3} fill="rgba(0,0,0,0.2)" className="bx-pigeon__shadow" />
      <g className="bx-pigeon__legs">
        <path d="M36 50 L34 60 M44 50 L46 60" stroke="#d0506a" strokeWidth={2.4} strokeLinecap="round" />
      </g>
      <g className="bx-pigeon__body">
        <path d="M10 38 L2 34 L4 42 Z" fill="#5e6470" />
        <ellipse cx={36} cy={40} rx={24} ry={13} fill="#8b93a3" />
        <path d="M18 36 Q34 26 52 38 Q36 46 18 36 Z" fill="#6f7788" className="bx-pigeon__wing" />
        <path d="M24 38 L44 40 M26 42 L42 43" stroke="#4a5060" strokeWidth={1.6} />
      </g>
      <g className="bx-pigeon__head">
        <path d="M50 36 Q52 24 58 20 L62 30 Q60 38 54 42 Z" fill="#5f7a74" />
        <circle cx={60} cy={18} r={8} fill="#7a8292" />
        <circle cx={62} cy={16} r={2} fill="#e8762a" />
        <circle cx={62.4} cy={16} r={0.9} fill="#1a1a1a" />
        <path d="M67 18 L74 20 L67 21 Z" fill="#3a3a3a" />
        <circle cx={66.5} cy={17.5} r={1.4} fill="#e9e6e0" />
      </g>
    </svg>
  );
}

/** Paper grain for the tickets, as a tiny SVG texture. */
export function Guilloche({ id, color }: { id: string; color: string }) {
  return (
    <svg className="bx-ticket__guilloche" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 400 180">
      <defs>
        <pattern id={id} width={24} height={12} patternUnits="userSpaceOnUse">
          <path d="M0 6 Q6 0 12 6 T24 6" fill="none" stroke={color} strokeWidth={0.6} />
          <path d="M0 9 Q6 3 12 9 T24 9" fill="none" stroke={color} strokeWidth={0.4} />
        </pattern>
      </defs>
      <rect width={400} height={180} fill={`url(#${id})`} />
    </svg>
  );
}
