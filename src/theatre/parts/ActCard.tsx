"use client";

import { useRef, type ReactNode } from "react";

import { useOnStage, useTick } from "../engine";
import { flyY, swing } from "../motion";

type Cue = readonly [number, number, number, number];

/**
 * A card hung from two lines, flown in from the flies and flown out again.
 * Used for act titles and the prologue billing.
 */
export function HangingCard({
  cue,
  className = "",
  children,
  label,
}: {
  cue: Cue;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [a, b, c, d] = cue;
  useOnStage(wrap, a - 0.01, d + 0.01);
  useTick(a - 0.01, d + 0.01, (t) => {
    const y = flyY(t, a, b, c, d, -140);
    const r = t < c ? swing(t, b - (b - a) * 0.25, 2.2, 10) : 0;
    if (card.current) card.current.style.transform = `translateY(${y.toFixed(2)}%) rotate(${r.toFixed(3)}deg)`;
  });
  return (
    <div className={`th-hang ${className}`} ref={wrap} role="group" aria-label={label}>
      <div className="th-hang__card" ref={card}>
        <i className="th-hang__line th-hang__line--l" aria-hidden="true" />
        <i className="th-hang__line th-hang__line--r" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

export function ActCard({
  cue,
  numeral,
  title,
  line,
}: {
  cue: Cue;
  numeral: string;
  title: string;
  line: string;
}) {
  return (
    <HangingCard cue={cue} className="th-actcard" label={`Act ${numeral}: ${title}`}>
      <div className="th-actcard__inner">
        <p className="th-actcard__act">
          <span aria-hidden="true">—</span> Act <span aria-hidden="true">—</span>
        </p>
        <p className="th-actcard__numeral">{numeral}</p>
        <h2 className="th-actcard__title">{title}</h2>
        <p className="th-actcard__line">{line}</p>
      </div>
    </HangingCard>
  );
}
