"use client";

import { useRef, type ReactNode } from "react";

import { useStage, useTick } from "@/theatre/engine";

import { useLang } from "./lang";
import { BEATS, CHAPTERS, FIN, TITLE, type Chapter, type Env } from "./script";
import { CHAPTER_TEXT, UI } from "./script.i18n";

const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export function envelope(t: number, [a, b, c, d]: Env) {
  if (t <= a || t >= d) return 0;
  if (t < b) return ease((t - a) / (b - a));
  if (t <= c) return 1;
  return 1 - ease((t - c) / (d - c));
}

/** Set opacity (and visibility) only when it changes. */
export function fade(el: HTMLElement | null, v: number, last: { v: number }) {
  if (!el) return;
  const q = Math.round(v * 200) / 200;
  if (q === last.v) return;
  last.v = q;
  el.style.opacity = String(q);
  el.style.visibility = q > 0 ? "visible" : "hidden";
}

/**
 * Take a card out of layout while it's off screen. Hidden-but-laid-out text
 * still makes the browser fetch its face, and the title cards' borrowed faces
 * aren't wanted until the film is rolling (Film warms them in idle time).
 */
export function live(el: HTMLElement | null, on: boolean) {
  if (!el) return;
  const v = on ? "true" : "false";
  if (el.dataset.live !== v) el.dataset.live = v;
}

/** a little seeded generator (a class, so render code needn't reassign anything) */
class Rand {
  private s: number;
  constructor(seed: number) {
    this.s = seed;
  }
  next() {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s % 10000) / 10000;
  }
}
function seeded(seed: number) {
  const g = new Rand(seed);
  return () => g.next();
}

// ---------------------------------------------------------------------------
// Red marker: a rough filter, shared by the poster and the director's notes.
// ---------------------------------------------------------------------------

export function MarkerDefs() {
  return (
    <svg className="sf-defs" aria-hidden="true" width="0" height="0">
      <defs>
        {[1, 2, 3].map((k) => (
          <filter key={k} id={`sf-rough-${k}`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency={0.035 + k * 0.01} numOctaves={2} seed={k * 7} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={3 + k * 1.5} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
        <filter id="sf-bleed">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={3} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.3" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
        <pattern id="sf-halftone" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
          <circle cx="3.5" cy="3.5" r="1.6" fill="#1a1308" />
        </pattern>
      </defs>
    </svg>
  );
}

/** A patch of zig-zag scribble, as if someone were colouring in a box in a hurry. */
export function Scribble({ w, h, dense = 14, seed = 1, className }: { w: number; h: number; dense?: number; seed?: number; className?: string }) {
  const r = seeded(seed);
  let d = `M ${r() * 6} ${r() * 6}`;
  const n = dense;
  for (let i = 0; i < n; i++) {
    const y = (i / n) * h;
    d += ` L ${w - r() * 8} ${y + r() * 6} L ${r() * 8} ${y + h / n + r() * 6}`;
  }
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h + 10}`} aria-hidden="true">
      <path d={d} pathLength={1} fill="none" stroke="currentColor" strokeWidth={Math.max(3, h / n / 1.4)} strokeLinecap="round" strokeLinejoin="round" filter="url(#sf-rough-2)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The poster: yellow ink over the live sky, red marker all over it.
// ---------------------------------------------------------------------------

export function Poster() {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef({ v: -1 });
  useTick(-2, 3, (t) => {
    const el = ref.current;
    if (!el) return;
    fade(el, envelope(t, TITLE), last.current);
    el.style.setProperty("--peel", String(Math.max(0, Math.min(1, (t - 0.1) / 1.0))));
  });
  // three lines on a wide screen; on a phone the same words stack five deep,
  // so the title fits the narrow column beside the strip instead of running off it
  const titles = [
    { kind: "wide", box: "0 0 1000 640", x: 500, y0: 170, step: 190, lines: ["THE CLIENT", "IS NOT IN", "A HURRY"] },
    { kind: "tall", box: "0 0 760 990", x: 380, y0: 165, step: 188, lines: ["THE", "CLIENT", "IS NOT", "IN A", "HURRY"] },
  ];
  return (
    <div className="sf-poster" ref={ref}>
      <div className="sf-poster__ink" />
      <div className="sf-poster__dots" />
      <aside className="sf-poster__strip">
        <Scribble className="sf-poster__blot sf-poster__blot--a" w={120} h={150} seed={3} />
        <p>
          The Zarcero Picture Company <i>presents</i>
        </p>
        <p>a picture in seven chapters</p>
        <p>Barcelona · 1881 — 2026</p>
        <Scribble className="sf-poster__blot sf-poster__blot--b" w={120} h={220} seed={9} dense={18} />
        <p className="sf-poster__small">with the Sagrada Família as itself</p>
      </aside>
      {titles.map((t) => (
        <svg key={t.kind} className={`sf-poster__title sf-poster__title--${t.kind}`} viewBox={t.box} role="img" aria-label="The Client Is Not in a Hurry">
          {[1, 2, 3].map((k) => (
            <g key={k} filter={`url(#sf-rough-${k})`} transform={`translate(${(k - 2) * 3} ${(k - 2) * -2})`}>
              {t.lines.map((l, i) => (
                <text key={i} x={t.x} y={t.y0 + i * t.step} textAnchor="middle" className="sf-poster__word" style={{ strokeWidth: 5 - k }}>
                  {l}
                </text>
              ))}
            </g>
          ))}
        </svg>
      ))}
      <Scribble className="sf-poster__blot sf-poster__blot--c" w={160} h={120} seed={21} />
      <p className="sf-poster__note sf-poster__note--a">or, a short history of a very long building</p>
      <p className="sf-poster__note sf-poster__note--b">scroll to roll film ↓</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter cards, each in the manner of a different kind of picture.
// ---------------------------------------------------------------------------

/** a few hundred broken tiles, for Gaudí's trencadís */
function Trencadis() {
  const r = seeded(11);
  const cols = ["#e9b736", "#d8732b", "#c62f37", "#2e7a58", "#3a6fb0", "#f3ecdf", "#e8c46a", "#9c3b2f", "#6aa39a"];
  const tiles: ReactNode[] = [];
  for (let y = 0; y < 60; y += 1) {
    for (let x = 0; x < 100; x += 1) {
      if (r() < 0.55) continue;
      const px = x * 10 + r() * 4;
      const py = y * 10 + r() * 4;
      const sides = 4 + Math.floor(r() * 2);
      const pts = Array.from({ length: sides }, (_, k) => {
        const ang = (k / sides) * Math.PI * 2 + r() * 0.6;
        const rr = 4 + r() * 5;
        return `${(px + Math.cos(ang) * rr).toFixed(1)},${(py + Math.sin(ang) * rr).toFixed(1)}`;
      }).join(" ");
      tiles.push(<polygon key={`${x}-${y}`} points={pts} fill={cols[Math.floor(r() * cols.length)]} />);
    }
  }
  return (
    <svg className="sf-card__tiles" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="1000" height="600" fill="#efe4cf" />
      {tiles}
    </svg>
  );
}

function CardBody({ c }: { c: Chapter }) {
  const label = <p className="sf-card__label">{c.word}</p>;
  switch (c.style) {
    case "gilt":
      return (
        <>
          {label}
          <p className="sf-card__gilt">{c.title}</p>
          <p className="sf-card__years">{c.years}</p>
        </>
      );
    case "pulp": {
      const [a, ...rest] = c.title.toUpperCase().split(" ");
      return (
        <>
          {label}
          <p className="sf-card__pulp">
            <span>{a}</span>
            <span>{rest.join(" ")}</span>
          </p>
          <p className="sf-card__years">{c.years}</p>
        </>
      );
    }
    case "mosaic":
      return (
        <>
          <Trencadis />
          {label}
          <p className="sf-card__groovy">
            The Young Man
            <br />
            <small>from</small> Reus
          </p>
          <p className="sf-card__fine">© MDCCCLXXXIII — MCMXXVI · A Picture in Stone, Mostly.</p>
        </>
      );
    case "stark":
      return (
        <>
          {label}
          <p className="sf-card__stark">
            THE
            <br />
            TRAM
          </p>
          <p className="sf-card__vol">{c.years}</p>
        </>
      );
    case "scrawl":
      return (
        <>
          <p className="sf-card__scrawl-label">chapter five</p>
          <p className="sf-card__scrawl">
            {"PIECES".split("").map((ch, i) => (
              <span key={i} style={{ transform: `rotate(${[-4, 3, -2, 5, -3, 2][i]}deg) translateY(${[0, -4, 3, -2, 4, -1][i]}px)` }}>
                {ch}
              </span>
            ))}
          </p>
          <p className="sf-card__scrawl-label">{c.years}</p>
        </>
      );
    case "western":
      return (
        <>
          {label}
          <p className="sf-card__western">
            THE <span>M</span>ACHINES
          </p>
          <p className="sf-card__spaced">1976 — 2026</p>
        </>
      );
    case "fable":
      return (
        <>
          {label}
          <p className="sf-card__fable">
            <span className="sf-card__fable-a">
              <b>T</b>he Tenth
            </span>
            <span className="sf-card__fable-b">…of June</span>
          </p>
        </>
      );
  }
}

export function ChapterCards() {
  const lang = useLang();
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const last = useRef(CHAPTERS.map(() => ({ v: -1 })));
  useTick(-1, BEATS + 5, (t) => {
    CHAPTERS.forEach((c, i) => {
      const v = envelope(t, c.card);
      fade(refs.current[i], v, last.current[i]);
      live(refs.current[i], v > 0);
    });
  });
  return (
    <>
      {CHAPTERS.map((c, i) => (
        <div
          key={c.id}
          className={`sf-card sf-card--${c.style}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          aria-hidden="true"
        >
          <CardBody c={c} />
          {lang !== "en" && (
            <p className="sf-card__sub" lang={lang}>
              {CHAPTER_TEXT[lang][i].word}: {CHAPTER_TEXT[lang][i].title}
            </p>
          )}
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Fin.
// ---------------------------------------------------------------------------

export function Fin() {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef({ v: -1 });
  const stage = useStage();
  const txt = UI[useLang()].end;
  useTick(FIN[0] - 1, BEATS + 5, (t) => {
    const v = envelope(t, FIN);
    fade(ref.current, v, last.current);
    live(ref.current, v > 0);
    if (ref.current) ref.current.dataset.on = t > FIN[1] - 0.2 ? "true" : "false";
  });
  return (
    <div className="sf-fin" ref={ref}>
      <p className="sf-fin__word">FIN.</p>
      <p className="sf-fin__sub">{txt.forNow}</p>
      <dl className="sf-fin__credits">
        <div>
          <dt>{txt.by}</dt>
          <dd>Nicolás Zarcero</dd>
        </div>
        <div>
          <dt>{txt.stagehand}</dt>
          <dd>Claude</dd>
        </div>
        <div>
          <dt>{txt.photography}</dt>
          <dd>{txt.photographyNote}</dd>
        </div>
        <div>
          <dt>{txt.gulls}</dt>
          <dd>{txt.themselves}</dd>
        </div>
      </dl>
      <p className="sf-fin__note">{txt.note}</p>
      <div className="sf-fin__actions">
        <button type="button" onClick={() => stage.jump(0)}>
          <span aria-hidden="true">↺</span> {txt.again}
        </button>
        <a href="/works">{txt.programme}</a>
        <a href="/theatre">
          {txt.theatre} <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
