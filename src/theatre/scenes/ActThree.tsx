"use client";

import Image from "next/image";
import { useRef } from "react";

import { WORKS, type Work } from "../content";
import { useOnStage, useTick } from "../engine";
import { flyY, seg, swing } from "../motion";
import { workCue } from "../timeline";

function CampusPlate() {
  const holds: [number, number, number, string][] = [
    [70, 250, 14, "#b8323a"],
    [120, 210, 11, "#dcae45"],
    [96, 160, 13, "#2f6a68"],
    [150, 124, 10, "#b8323a"],
    [120, 80, 12, "#5b4c9a"],
    [170, 46, 13, "#dcae45"],
    [60, 110, 9, "#2f6a68"],
    [186, 190, 10, "#5b4c9a"],
    [40, 196, 8, "#dcae45"],
  ];
  return (
    <div className="th-plate th-plate--campus" aria-hidden="true">
      <svg viewBox="0 0 230 300">
        <rect x="0" y="0" width="230" height="300" fill="#e6cfa2" />
        {Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 8 }, (_, c) => (
            <circle key={`${r}-${c}`} cx={14 + c * 29} cy={14 + r * 30} r="2" fill="#b89a68" />
          )),
        )}
        <path d="M70 250 L120 210 L96 160 L150 124 L120 80 L170 46" stroke="#2a2440" strokeWidth="2" strokeDasharray="4 6" fill="none" opacity="0.5" />
        {holds.map(([x, y, r, c], i) => (
          <path
            key={i}
            d={`M${x - r} ${y} Q${x - r} ${y - r * 1.1} ${x} ${y - r} Q${x + r * 1.2} ${y - r * 0.9} ${x + r} ${y + r * 0.2} Q${x} ${y + r * 1.1} ${x - r} ${y} Z`}
            fill={c}
            stroke="#2a2440"
            strokeWidth="1.5"
          />
        ))}
        <g className="th-fingers">
          <circle cx="150" cy="120" r="9" fill="#f6ecd6" stroke="#2a2440" strokeWidth="2" />
          <circle cx="120" cy="76" r="9" fill="#f6ecd6" stroke="#2a2440" strokeWidth="2" />
          <circle cx="150" cy="120" r="16" fill="none" stroke="#fff" strokeWidth="2" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}

function Frame({ work, priority }: { work: Work; priority: boolean }) {
  if (work.frame === "plate-campus") return <div className="th-frame th-frame--plate th-frame--tall"><CampusPlate /></div>;
  return (
    <div className={`th-frame ${work.frame === "phone" ? "th-frame--phone" : ""}`}>
      <div className="th-frame__img">
        {work.image && (
          <Image
            src={work.image}
            alt={work.imageAlt ?? work.title}
            fill
            priority={priority}
            sizes="(max-width: 700px) 80vw, 46vw"
            style={{ objectFit: "cover", objectPosition: work.imagePosition ?? "top center" }}
          />
        )}
      </div>
    </div>
  );
}

function WorkScene({ work, index }: { work: Work; index: number }) {
  const wrap = useRef<HTMLElement>(null);
  const drop = useRef<HTMLDivElement>(null);
  const { a, b, c, d } = workCue(index);
  useOnStage(wrap, a - 0.01, d + 0.01);
  useTick(a - 0.01, d + 0.01, (t) => {
    const y = flyY(t, a, b, c, d, -118);
    const r = t < c ? swing(t, a + (b - a) * 0.7, 0.9, 11) : 0;
    if (drop.current) drop.current.style.transform = `translateY(${y.toFixed(2)}%) rotate(${r.toFixed(3)}deg)`;
    if (wrap.current) wrap.current.style.setProperty("--settled", seg(t, b - 0.1, b + 0.2).toFixed(3));
  });

  return (
    <section
      className={`th-scene th-work th-work--${work.backdrop}`}
      ref={wrap}
      aria-label={`Act III, scene ${index + 1}: ${work.title}`}
      style={
        {
          "--w-bg": work.palette.bg,
          "--w-fg": work.palette.fg,
          "--w-accent": work.palette.accent,
        } as React.CSSProperties
      }
    >
      <div className="th-work__drop" ref={drop}>
        <div className="th-work__batten" aria-hidden="true" />
        <div className="th-work__cloth" aria-hidden="true" />
        <div className="th-work__layout">
          <header className="th-work__head">
            <p className="th-work__scene">
              Scene {index + 1} <span>of {WORKS.length}</span>
            </p>
            <h3 className="th-work__title">
              {work.title.split(".").map((part, i) => (
                <span key={i}>
                  {i > 0 && (
                    <>
                      <wbr />.
                    </>
                  )}
                  {part}
                </span>
              ))}
            </h3>
            <p className="th-work__kind">{work.kind}</p>
            <p className="th-work__year">{work.year}</p>
          </header>
          <Frame work={work} priority={index === 0} />
          <div className="th-work__card">
            <p className="th-work__desc">{work.description}</p>
            {work.aside && <p className="th-work__aside">{work.aside}</p>}
            <ul className="th-work__stack" aria-label="Built with">
              {work.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            {work.href && (
              <a className="th-button" href={work.href} target="_blank" rel="noreferrer">
                {work.hrefLabel ?? "Visit"} <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Works() {
  return (
    <>
      {WORKS.map((w, i) => (
        <WorkScene key={w.id} work={w} index={i} />
      ))}
    </>
  );
}
