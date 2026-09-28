"use client";

import { useRef } from "react";

import { useTick } from "../engine";
import { easeInOut, seg } from "../motion";
import { CUES, TOTAL_BEATS } from "../timeline";

/** How dark the auditorium is (0 lit, 1 show dark). */
export function houseDimAt(t: number) {
  const { prologue, intermission, finale } = CUES;
  const dim = easeInOut(seg(t, ...prologue.dim));
  // lights come up a little during the interval, and again for the credits
  const interval =
    easeInOut(seg(t, intermission.curtainClose[0], intermission.card[1])) *
    (1 - easeInOut(seg(t, intermission.audienceBack[0], intermission.curtainOpen[1])));
  const credits = easeInOut(seg(t, finale.fin[0], finale.fin[1]));
  return Math.max(0, dim - interval * 0.55 - credits * 0.5);
}

/**
 * The house lights. A window the size of the stage opening casts a huge
 * shadow over everything around it — frame, wall, audience.
 */
export function HouseLights() {
  const ref = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  useTick(-1, 1e6, (t) => {
    const d = houseDimAt(t);
    ref.current?.style.setProperty("--dim", (d * 0.66).toFixed(3));
    // footlights and stage wash follow the dimmer, inverted
    const host = root.current?.closest<HTMLElement>(".th-root");
    host?.style.setProperty("--foot", d.toFixed(3));
  });
  return (
    <div ref={root}>
      <div className="th-houselights" ref={ref} aria-hidden="true" />
    </div>
  );
}

export function Apron() {
  return (
    <div className="th-apron" aria-hidden="true">
      <div className="th-apron__lip" />
      <div className="th-footlights">
        {Array.from({ length: 15 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="th-apron__panels">
        {["❦", "✥", "MMXXVI", "✥", "❦"].map((m, i) => (
          <span key={i} className={i === 2 ? "is-center" : undefined}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

const HEADS = [
  "bowler",
  "bob",
  "bun",
  "tophat",
  "curly",
  "beret",
  "bald",
  "ponytail",
  "tophat",
  "bob",
  "bowler",
  "bun",
  "curly",
] as const;

function Head({ kind }: { kind: (typeof HEADS)[number] }) {
  const body = <path d="M8 120 C 10 92, 26 84, 50 84 C 74 84, 90 92, 92 120 Z" />;
  const neck = <rect x="42" y="70" width="16" height="18" rx="4" />;
  const skull = <ellipse cx="50" cy="56" rx="21" ry="24" />;
  const extra = {
    bowler: (
      <>
        <ellipse cx="50" cy="40" rx="30" ry="5" />
        <path d="M30 40 C 30 18, 70 18, 70 40 Z" />
      </>
    ),
    tophat: (
      <>
        <ellipse cx="50" cy="38" rx="30" ry="5" />
        <rect x="33" y="6" width="34" height="33" rx="2" />
      </>
    ),
    bob: <path d="M26 64 C 22 30, 78 30, 74 64 L 74 74 L 26 74 Z" />,
    bun: (
      <>
        <circle cx="50" cy="26" r="11" />
        <path d="M29 50 C 30 34, 70 34, 71 50 Z" />
      </>
    ),
    curly: (
      <>
        {[30, 40, 50, 60, 70].map((x, i) => (
          <circle key={i} cx={x} cy={38 + (i % 2) * 4} r="10" />
        ))}
        <circle cx="27" cy="52" r="8" />
        <circle cx="73" cy="52" r="8" />
      </>
    ),
    beret: <path d="M26 44 C 26 26, 80 24, 82 40 C 84 46, 60 46, 26 46 Z" />,
    bald: null,
    ponytail: <path d="M68 50 C 86 52, 88 78, 80 94 C 76 80, 74 66, 66 60 Z" />,
  }[kind];
  return (
    <svg viewBox="0 0 100 120" className="th-head" aria-hidden="true">
      {body}
      {neck}
      {skull}
      {extra}
    </svg>
  );
}

/** The front row. They leave at the interval and applaud at the end. */
export function Audience() {
  const ref = useRef<HTMLDivElement>(null);
  useTick(-1, 1e6, (t) => {
    const el = ref.current;
    if (!el) return;
    const { intermission, finale } = CUES;
    const away =
      easeInOut(seg(t, ...intermission.audienceOut)) *
      (1 - easeInOut(seg(t, ...intermission.audienceBack)));
    const clap = seg(t, finale.bows[0], finale.bows[1] + 0.6) * (1 - seg(t, finale.credits[0] + 1.5, finale.credits[0] + 2.5));
    const heads = el.children;
    for (let i = 0; i < heads.length; i++) {
      const h = heads[i] as HTMLElement;
      const stagger = Math.max(0, Math.min(1, away * 1.6 - (i % 5) * 0.12));
      const bob = clap > 0 ? Math.abs(Math.sin(t * 38 + i * 1.7)) * 7 * clap : 0;
      h.style.transform = `translateY(${(stagger * 115 - bob).toFixed(2)}%)`;
    }
  });
  return (
    <div className="th-audience" ref={ref} aria-hidden="true">
      {HEADS.map((k, i) => (
        <div key={i} className="th-audience__seat">
          <Head kind={k} />
        </div>
      ))}
    </div>
  );
}

/** Fly-rail rope with a sandbag: the scroll progress indicator. */
export function FlyRope() {
  const bag = useRef<HTMLDivElement>(null);
  useTick(0, TOTAL_BEATS, (t) => {
    const p = t / TOTAL_BEATS;
    if (bag.current) bag.current.style.transform = `translateY(calc(${p.toFixed(4)} * (100cqh - 34px)))`;
  });
  return (
    <div className="th-rope" aria-hidden="true">
      <div className="th-rope__line" />
      <div className="th-rope__bag" ref={bag}>
        <span />
      </div>
    </div>
  );
}
