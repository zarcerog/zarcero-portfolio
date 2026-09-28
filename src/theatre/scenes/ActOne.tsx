"use client";

import Image from "next/image";
import { useRef } from "react";

import { NARRATION, PERSONAE, PLAYBILL } from "../content";
import { useOnStage, useTick } from "../engine";
import { easeBack, easeIn, easeOut, envelope, lerp, seg } from "../motion";
import { CUES } from "../timeline";

const C = CUES.act1;

function Hills() {
  return (
    <svg className="th-coast__hills-svg" viewBox="0 0 2400 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0 250 C 120 250, 250 247, 402 200 V420 H0 Z M1998 190 C 2150 228, 2280 230, 2400 240 V420 H1998 Z" fill="#c9dcc6" />
      <path d="M0 350 C 120 360, 250 370, 402 320 V420 H0 Z M1998 300 C 2150 330, 2280 335, 2400 340 V420 H1998 Z" fill="#a9c79f" />
      <g transform="translate(400 0)">
      {/* far range */}
      <path
        d="M0 200 C 160 150, 300 170, 420 160 C 560 150, 660 230, 800 240 C 940 230, 1040 150, 1180 160 C 1320 170, 1440 150, 1600 190 V420 H0 Z"
        fill="#c9dcc6"
      />
      {/* middle range */}
      <path
        d="M0 320 C 200 250, 360 280, 520 230 C 640 195, 720 230, 800 200 C 880 170, 980 230, 1080 230 C 1240 250, 1400 260, 1600 300 V420 H0 Z"
        fill="#a9c79f"
      />
      {/* the town on its hill, perfectly centred */}
      <g transform="translate(800 214)">
        <path d="M-300 206 C -220 60, -120 24, 0 18 C 120 24, 220 60, 300 206 Z" fill="#8fb487" />
        {/* cypresses */}
        {[-230, -196, 196, 230].map((x) => (
          <ellipse key={x} cx={x} cy={112} rx="9" ry="34" fill="#4f7a58" />
        ))}
        {/* houses */}
        {[
          [-150, 58, 56, 46, "#f2c6c0"],
          [-96, 42, 50, 62, "#f3e3c3"],
          [-46, 30, 40, 74, "#e7b56d"],
          [6, 34, 40, 70, "#eaa9a4"],
          [52, 44, 50, 60, "#f3e3c3"],
          [104, 60, 52, 44, "#f2c6c0"],
        ].map(([x, y, w, h, c], i) => (
          <g key={i}>
            <rect x={x as number} y={y as number} width={w as number} height={h as number} fill={c as string} />
            <path
              d={`M${(x as number) - 4} ${y} L${(x as number) + (w as number) / 2} ${(y as number) - 16} L${(x as number) + (w as number) + 4} ${y} Z`}
              fill="#c7674f"
            />
            <rect x={(x as number) + (w as number) / 2 - 6} y={(y as number) + 14} width="12" height="14" rx="6" fill="#5b8d93" />
          </g>
        ))}
        {/* bell tower */}
        <rect x="-14" y="-34" width="28" height="72" fill="#f6ecd6" />
        <path d="M-18 -34 Q0 -64 18 -34 Z" fill="#6aa3a6" />
        <rect x="-6" y="-22" width="12" height="16" rx="6" fill="#2f4f55" />
        <circle cx="0" cy="8" r="7" fill="#f3dc93" stroke="#8a6423" strokeWidth="1.5" />
      </g>
      </g>
    </svg>
  );
}

function Train() {
  const car = (x: number, nose: boolean, panto: boolean) => (
    <g transform={`translate(${x} 0)`}>
      {panto && (
        <path d="M60 16 L80 2 L100 16 M70 2 H90" stroke="#3a2b27" strokeWidth="2.5" fill="none" />
      )}
      <path
        d={
          nose
            ? "M0 22 H168 C 186 22, 196 40, 198 70 V78 H0 Z"
            : "M0 22 H194 V78 H0 Z"
        }
        fill="#f6ecd6"
        stroke="#3a2b27"
        strokeWidth="2"
      />
      <rect x="0" y="18" width={nose ? 170 : 194} height="6" fill="#b9b1a3" />
      <rect x="0" y="58" width={nose ? 198 : 194} height="8" fill="#b8323a" />
      {[14, 58, 102, 146].map((wx) =>
        nose && wx > 140 ? null : <rect key={wx} x={wx} y="32" width="30" height="18" rx="3" fill="#35585d" />,
      )}
      {nose && <path d="M156 32 H172 C 182 34, 188 42, 190 50 H156 Z" fill="#35585d" />}
      <rect x="92" y="30" width="2" height="46" fill="#3a2b27" opacity="0.4" />
      <g fill="#2b1a17">
        <circle cx="30" cy="82" r="7" />
        <circle cx="48" cy="82" r="7" />
        <circle cx="146" cy="82" r="7" />
        <circle cx="164" cy="82" r="7" />
      </g>
    </g>
  );
  return (
    <svg className="th-train-svg" viewBox="0 0 600 92" aria-hidden="true">
      {car(0, false, false)}
      {car(200, false, true)}
      {car(400, true, false)}
      <rect x="194" y="40" width="6" height="30" fill="#3a2b27" />
      <rect x="394" y="40" width="6" height="30" fill="#3a2b27" />
    </svg>
  );
}

function Umbrella({ flip = false }: { flip?: boolean }) {
  return (
    <svg className="th-umbrella" viewBox="0 0 120 130" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <rect x="58" y="30" width="4" height="100" fill="#6b4c3b" />
      <path d="M4 44 Q60 -14 116 44 Z" fill="#f6ecd6" />
      <path d="M60 15 L4 44 Q18 50 32 44 Z M60 15 L60 44 Q74 50 88 44 Z" fill="#e58c86" />
      <path d="M4 44 Q18 50 32 44 Q46 50 60 44 Q74 50 88 44 Q102 50 116 44" fill="none" stroke="#b8323a" strokeWidth="2" />
    </svg>
  );
}

export function Coast() {
  const wrap = useRef<HTMLElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const hills = useRef<HTMLDivElement>(null);
  const sea = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const beach = useRef<HTMLDivElement>(null);
  const train = useRef<HTMLDivElement>(null);
  const clouds = useRef<HTMLDivElement>(null);
  const narr = useRef<HTMLDivElement>(null);

  const [inA, inB] = C.setIn;
  const [outA, outB] = C.setOut;
  useOnStage(wrap, inA - 0.01, outB + 0.01);

  useTick(inA - 0.01, outB + 0.01, (t) => {
    const pin = seg(t, inA, inB);
    const pout = seg(t, outA, outB);
    // staggered assembly: sky flies in, ground rows rise, waves slide on
    const skyIn = easeBack(seg(pin, 0, 0.6)) * (1 - easeIn(seg(pout, 0.35, 1)));
    const hillIn = easeOut(seg(pin, 0.2, 0.75)) * (1 - easeIn(seg(pout, 0.2, 0.8)));
    const seaIn = easeOut(seg(pin, 0.3, 0.85)) * (1 - easeIn(seg(pout, 0.1, 0.7)));
    const groundIn = easeOut(seg(pin, 0.45, 1)) * (1 - easeIn(seg(pout, 0, 0.55)));

    if (sky.current) sky.current.style.transform = `translateY(${lerp(-105, 0, skyIn).toFixed(2)}%)`;
    if (hills.current) hills.current.style.transform = `translateY(${lerp(110, 0, hillIn).toFixed(2)}%)`;
    if (rail.current) rail.current.style.transform = `translateY(${lerp(260, 0, groundIn).toFixed(2)}%)`;
    if (beach.current) beach.current.style.transform = `translateY(${lerp(110, 0, groundIn).toFixed(2)}%)`;

    if (sea.current) {
      const rows = sea.current.children;
      for (let i = 0; i < rows.length; i++) {
        const dir = i % 2 === 0 ? -1 : 1;
        const offIn = (1 - seaIn) * 120 * dir;
        // the wave machine: rows drift against each other as you scroll
        const drift = Math.sin(t * 2.4 + i * 1.3) * 3.2 + t * 2.2 * dir;
        (rows[i] as HTMLElement).style.transform = `translateX(${(offIn + (drift % 6) - 6).toFixed(3)}%)`;
      }
    }

    if (clouds.current) {
      const cs = clouds.current.children;
      for (let i = 0; i < cs.length; i++) {
        const sway = Math.sin(t * 1.7 + i * 2.1) * 1.4;
        (cs[i] as HTMLElement).style.transform = `rotate(${sway.toFixed(3)}deg)`;
      }
    }

    // the 08:14 to Barcelona
    const tp = seg(t, C.train[0], C.train[1]);
    if (train.current) {
      train.current.style.transform = `translateX(calc(${(tp * 1).toFixed(4)} * (100cqw + 100%) - 100%)) translateY(${(Math.sin(t * 60) * 0.6).toFixed(2)}px)`;
    }

    if (narr.current) {
      const box = narr.current;
      const lines = box.querySelectorAll<HTMLElement>("[data-line]");
      lines.forEach((line, i) => {
        const [a, b, c, d] = C.lines[i];
        const e = envelope(t, a, b, c, d);
        line.style.opacity = e.toFixed(3);
        line.style.transform = `translateY(${((1 - e) * (t < b ? 8 : -8)).toFixed(2)}px)`;
        // typewriter reveal
        const typed = seg(t, a, b + 0.15);
        line.style.setProperty("--typed", typed.toFixed(3));
      });
      const boxE = envelope(t, C.lines[0][0] - 0.15, C.lines[0][0] + 0.15, C.lines[2][2], C.lines[2][3]);
      box.style.opacity = boxE.toFixed(3);
      box.style.transform = `translateX(-50%) translateY(${lerp(-30, 0, boxE).toFixed(2)}px)`;
    }
  });

  return (
    <section className="th-scene th-coast" ref={wrap} aria-label="Act I, scene 1: the coast">
      <div className="th-coast__sky" ref={sky}>
        <div className="th-coast__sun" />
        <div className="th-coast__clouds" ref={clouds}>
          <i className="th-cloud th-cloud--1" />
          <i className="th-cloud th-cloud--2" />
          <i className="th-cloud th-cloud--3" />
          <i className="th-cloud th-cloud--4" />
        </div>
      </div>
      <div className="th-coast__hills" ref={hills}>
        <Hills />
      </div>
      <div className="th-coast__sea" ref={sea}>
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="th-coast__rail" ref={rail}>
        <div className="th-coast__catenary" />
        <div className="th-coast__train" ref={train}>
          <Train />
        </div>
        <div className="th-coast__wall" />
      </div>
      <div className="th-coast__beach" ref={beach}>
        <Umbrella />
        <div className="th-coast__sign">
          <span>Platja</span>
        </div>
        <Umbrella flip />
      </div>
      <div className="th-narration" ref={narr}>
        <p className="th-narration__label">The Narrator</p>
        <div className="th-narration__lines">
          {NARRATION.map((line, i) => (
            <p key={i} data-line={i}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Personae() {
  const wrap = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLDivElement>(null);
  const [a, b, c, d] = C.personae;
  useOnStage(wrap, a - 0.01, d + 0.01);
  useTick(a - 0.01, d + 0.01, (t) => {
    let y: number;
    if (t < b) y = lerp(115, 0, easeBack(seg(t, a, b)));
    else if (t <= c) y = 0;
    else y = lerp(0, 115, easeIn(seg(t, c, d)));
    if (card.current) card.current.style.transform = `translateY(${y.toFixed(2)}%)`;
    if (spot.current) spot.current.style.opacity = envelope(t, a, b, c, d).toFixed(3);
  });

  return (
    <section className="th-scene th-personae" ref={wrap} aria-label="Act I, scene 2: dramatis personae">
      <div className="th-spot" ref={spot} aria-hidden="true" />
      <div className="th-trap">
        <div className="th-personae__card" ref={card}>
          <div className="th-personae__inner">
            <div className="th-personae__portrait">
              <div className="th-oval">
                <Image
                  src="/theatre/nico.webp"
                  alt="Portrait of Nicolás Zarcero in a striped shirt, mountains behind"
                  width={640}
                  height={640}
                  sizes="(max-width: 700px) 30vw, 220px"
                />
              </div>
              <p className="th-personae__caption">{PLAYBILL.name}</p>
            </div>
            <div className="th-personae__text">
              <h2 className="th-personae__heading">{PERSONAE.heading}</h2>
              <p className="th-personae__order">In order of appearance</p>
              <dl className="th-cast">
                {PERSONAE.cast.map((row) => (
                  <div key={row.role} className="th-cast__row">
                    <dt>{row.role}</dt>
                    <span aria-hidden="true" className="th-leader" />
                    <dd>{row.actor}</dd>
                  </div>
                ))}
              </dl>
              <p className="th-personae__note">{PERSONAE.note}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
