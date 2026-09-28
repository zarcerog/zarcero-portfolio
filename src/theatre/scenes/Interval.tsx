"use client";

import { useRef } from "react";

import { CONCESSIONS, REHEARSALS } from "../content";
import { useOnStage, useTick } from "../engine";
import { easeBack, easeIn, easeOut, lerp, seg } from "../motion";
import { HangingCard } from "../parts/ActCard";
import { CUES } from "../timeline";

export function Intermission() {
  return (
    <HangingCard cue={CUES.intermission.card} className="th-interval" label="Intermission">
      <div className="th-interval__inner">
        <p className="th-interval__kicker">✦ &nbsp;The Management Announces&nbsp; ✦</p>
        <h2 className="th-interval__title">{CONCESSIONS.title}</h2>
        <p className="th-interval__sub">{CONCESSIONS.sub}</p>
        <div className="th-menu">
          <p className="th-menu__title">{CONCESSIONS.menuTitle}</p>
          <p className="th-menu__sub">{CONCESSIONS.menuSub}</p>
          <ul>
            {CONCESSIONS.items.map((item) => (
              <li key={item.name}>
                <span className="th-menu__name">{item.name}</span>
                <span className="th-leader" aria-hidden="true" />
                <span className="th-menu__note">{item.note}</span>
              </li>
            ))}
          </ul>
          <p className="th-menu__foot">{CONCESSIONS.footnote}</p>
        </div>
      </div>
    </HangingCard>
  );
}

function GhostLight() {
  return (
    <svg className="th-ghost__svg" viewBox="0 0 80 300" aria-hidden="true">
      <defs>
        <radialGradient id="ghost-bulb" cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor="#fffbe6" />
          <stop offset="0.6" stopColor="#ffe7a3" />
          <stop offset="1" stopColor="#e8b44f" />
        </radialGradient>
      </defs>
      <path d="M26 44 h28 l-4 22 h-20 Z" fill="none" stroke="#2b1a17" strokeWidth="3" />
      <path d="M40 18 v12" stroke="#2b1a17" strokeWidth="3" />
      <ellipse cx="40" cy="44" rx="16" ry="19" fill="url(#ghost-bulb)" />
      <path d="M26 44 l14 -18 l14 18 M40 26 v38" stroke="#2b1a17" strokeWidth="2" fill="none" opacity="0.7" />
      <rect x="36" y="64" width="8" height="200" fill="#2b1a17" />
      <path d="M40 262 L10 296 M40 262 L70 296 M40 262 V298" stroke="#2b1a17" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Rehearsal() {
  const wrap = useRef<HTMLElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const sign = useRef<HTMLDivElement>(null);
  const C = CUES.act4;
  const [inA, inB] = C.setIn;
  const [outA, outB] = C.setOut;
  useOnStage(wrap, inA - 0.01, outB + 0.01);

  useTick(inA - 0.01, outB + 0.01, (t) => {
    const pin = seg(t, inA, inB);
    const pout = seg(t, outA, outB);
    const on = easeOut(pin) * (1 - easeIn(pout));
    if (wrap.current) wrap.current.style.setProperty("--on", on.toFixed(3));
    if (ghost.current) {
      const flick = 0.9 + Math.sin(t * 47) * 0.04 + Math.sin(t * 13) * 0.05;
      ghost.current.style.transform = `translateX(-50%) translateY(${lerp(100, 0, easeBack(pin)) + lerp(0, 100, easeIn(pout))}%)`;
      ghost.current.style.setProperty("--flick", flick.toFixed(3));
    }
    if (sign.current) {
      sign.current.style.transform = `translateX(-50%) translateY(${lerp(-160, 0, easeBack(seg(pin, 0.3, 1))) + lerp(0, -160, easeIn(pout))}%)`;
    }
    if (board.current) {
      const cards = board.current.children;
      for (let i = 0; i < cards.length; i++) {
        const at = C.pins[i];
        const p = seg(t, at, at + 0.35);
        const e = easeBack(p) * (1 - easeIn(seg(pout, i * 0.1, 0.6 + i * 0.1)));
        const el = cards[i] as HTMLElement;
        const tilt = (i % 2 === 0 ? -1 : 1) * (1.6 + (i % 3) * 0.6);
        el.style.opacity = Math.min(1, e * 1.4).toFixed(3);
        el.style.transform = `translateY(${lerp(-40, 0, e).toFixed(2)}px) rotate(${lerp(tilt * 5, tilt, e).toFixed(2)}deg) scale(${lerp(1.08, 1, e).toFixed(3)})`;
      }
    }
  });

  return (
    <section className="th-scene th-rehearsal" ref={wrap} aria-label="Act IV: in rehearsal">
      <div className="th-backstage" aria-hidden="true" />
      <div className="th-ghost" ref={ghost} aria-hidden="true">
        <div className="th-ghost__glow" />
        <GhostLight />
      </div>
      <div className="th-quiet" ref={sign}>
        <span>Rehearsal in progress</span>
        <b>Quiet, please</b>
      </div>
      <div className="th-board" ref={board}>
        {REHEARSALS.map((r) => (
          <article key={r.id} className="th-index" style={{ "--tint": r.tint } as React.CSSProperties}>
            <i className="th-index__pin" aria-hidden="true" />
            <p className="th-index__medium">{r.medium}</p>
            <h3 className="th-index__title">{r.title}</h3>
            <p className="th-index__line">{r.line}</p>
            <p className="th-index__tech">{r.tech}</p>
            <span className="th-index__stamp" aria-hidden="true">
              Not yet open
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
