"use client";

import type { ReactNode } from "react";

import { useLang } from "./lang";
import { MARKS, markEls } from "./marks";
import { NOTE_TEXT, type NoteText } from "./script.i18n";

// The director's notes, in red marker. Every stroke has pathLength 1, so the
// scene can draw it in by setting --d (0 → 1) on the note.

const P = ({ d, w = 4 }: { d: string; w?: number }) => (
  <path d={d} pathLength={1} className="sf-note__stroke" style={{ strokeWidth: w }} />
);
const T = ({ x, y, r = 0, size = 30, children }: { x: number; y: number; r?: number; size?: number; children: ReactNode }) => (
  <text x={x} y={y} transform={`rotate(${r} ${x} ${y})`} className="sf-note__text" style={{ fontSize: size }}>
    {children}
  </text>
);

/** a hand-drawn loop round something, not quite closing on itself */
const loop = (rx: number, ry: number, tilt = -6) => {
  const a = (tilt * Math.PI) / 180;
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const u = (i / 40) * Math.PI * 2.15 - 0.4;
    const wob = 1 + Math.sin(u * 3) * 0.04;
    const x = Math.cos(u) * rx * wob;
    const y = Math.sin(u) * ry * wob;
    pts.push(`${(x * Math.cos(a) - y * Math.sin(a)).toFixed(1)},${(x * Math.sin(a) + y * Math.cos(a)).toFixed(1)}`);
  }
  return `M ${pts.join(" L ")}`;
};

/** an arrow from (x0,y0) curving to (x1,y1), with a head */
const arrow = (x0: number, y0: number, x1: number, y1: number, bend = 30) => {
  const mx = (x0 + x1) / 2 + bend;
  const my = (y0 + y1) / 2 - bend * 0.5;
  const ang = Math.atan2(y1 - my, x1 - mx);
  const h = 16;
  const hx1 = x1 - Math.cos(ang - 0.45) * h;
  const hy1 = y1 - Math.sin(ang - 0.45) * h;
  const hx2 = x1 - Math.cos(ang + 0.45) * h;
  const hy2 = y1 - Math.sin(ang + 0.45) * h;
  return `M ${x0} ${y0} Q ${mx} ${my} ${x1} ${y1} M ${hx1.toFixed(1)} ${hy1.toFixed(1)} L ${x1} ${y1} L ${hx2.toFixed(1)} ${hy2.toFixed(1)}`;
};

/** `n` is the scrawl in the chosen print; `wide` nudges the longer ones left. */
const notes = (n: NoteText, wide: boolean): Record<string, ReactNode> => ({
  gulls: (
    <>
      <P d={loop(95, 70)} />
      <P d={arrow(190, -120, 95, -40, -20)} w={3} />
      <T x={130} y={-140} r={-8}>
        {n.gulls}
      </T>
    </>
  ),
  cerda: (
    <>
      <P d="M -150 -40 L 150 -52 M -160 30 L 160 18 M -70 -100 L -80 100 M 60 -104 L 50 96" w={3} />
      <T x={40} y={-120} r={-5}>
        {n.cerda}
      </T>
      <T x={70} y={-88} r={-5} size={22}>
        {n.cerdaSmall}
      </T>
    </>
  ),
  plot: (
    <>
      <P d={loop(210, 70, -3)} />
      <T x={130} y={-100} r={-7}>
        {n.plot}
      </T>
      <P d="M 118 -86 L 300 -96" w={2.5} />
    </>
  ),
  villar: (
    <>
      <P d="M -180 -170 L 170 160" w={9} />
      <P d="M 170 -175 L -165 165" w={9} />
      <T x={190} y={-150} r={-10} size={64}>
        NO.
      </T>
    </>
  ),
  flip: (
    <>
      <P d="M 90 -40 A 100 100 0 1 1 60 -80" w={5} />
      <P d="M 40 -95 L 60 -80 L 38 -60" w={5} />
      <T x={130} y={-40} r={-6}>
        {n.flip}
      </T>
    </>
  ),
  barnabas: (
    <>
      <P d={arrow(-190, 60, -25, 5, -30)} />
      <T x={-420} y={70} r={-6}>
        {n.barnabas}
      </T>
      <T x={-330} y={104} r={-6} size={24}>
        1925
      </T>
    </>
  ),
  glue: (
    <>
      <P d={arrow(-200, -140, -60, -40, -30)} w={3} />
      <P d={arrow(210, -120, 70, -30, 30)} w={3} />
      <T x={-40} y={-170} r={-4}>
        {n.glue}
      </T>
    </>
  ),
  pause: (
    <>
      <P d="M -95 -30 L 95 -38 L 100 30 L -92 36 Z" w={4} />
      <T x={-70} y={16} r={-3} size={44}>
        {n.pause}
      </T>
      <P d="M -120 -60 L 120 60" w={3} />
    </>
  ),
  tower: (
    <>
      <P d={arrow(190, -40, 30, -5, -25)} />
      <T x={200} y={-40} r={-4}>
        {n.tower}
      </T>
    </>
  ),
  montjuic: (
    <>
      <P d={arrow(-170, -110, -20, -20, 30)} />
      <T x={wide ? -300 : -250} y={-125} r={-6}>
        {n.montjuic}
      </T>
    </>
  ),
  lighthouse: (
    <>
      <P d={loop(60, 60, 0)} />
      <P d={arrow(-180, -110, -65, -30, -30)} w={3} />
      <T x={-310} y={-120} r={-6}>
        {n.lighthouse}
      </T>
    </>
  ),
  visca: (
    <>
      <T x={-60} y={0} r={-12} size={70}>
        Visca!
      </T>
      <P d="M 170 -80 L 180 -10 M 200 -90 L 205 -20 M 176 12 L 178 16 M 206 2 L 207 6" w={6} />
    </>
  ),
});

export function Notes() {
  const lang = useLang();
  const NOTES = notes(NOTE_TEXT[lang], lang !== "en");
  return (
    <div className="sf-notes" aria-hidden="true">
      {MARKS.map((m) => (
        <div
          key={m.id}
          className="sf-note"
          ref={(el) => {
            if (el) markEls.set(m.id, el);
            else markEls.delete(m.id);
          }}
        >
          <svg width="1" height="1" overflow="visible">
            <g filter="url(#sf-rough-1)">{NOTES[m.id]}</g>
          </svg>
        </div>
      ))}
    </div>
  );
}
