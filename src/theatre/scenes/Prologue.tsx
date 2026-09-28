"use client";

import { useRef } from "react";

import { PLAYBILL } from "../content";
import { useOnStage, useTick } from "../engine";
import { seg } from "../motion";
import { HangingCard } from "../parts/ActCard";
import { CUES } from "../timeline";

const [, titleOut] = CUES.prologue.titleOut;

export function Prologue() {
  const hint = useRef<HTMLDivElement>(null);
  useOnStage(hint, -1, 0.9);
  useTick(0, 0.9, (t) => {
    if (hint.current) hint.current.style.opacity = (1 - seg(t, 0.02, 0.35)).toFixed(3);
  });

  return (
    <>
      <HangingCard
        cue={[-3, -2, CUES.prologue.titleOut[0], titleOut]}
        className="th-billing"
        label="Tonight's billing"
      >
        <div className="th-billing__inner">
          <p className="th-billing__house">{PLAYBILL.theatre}</p>
          <p className="th-billing__small">— {PLAYBILL.presents} —</p>
          <h1 className="th-billing__name">{PLAYBILL.name}</h1>
          <p className="th-billing__small">{PLAYBILL.in}</p>
          <p className="th-billing__title">
            <span aria-hidden="true">«</span> {PLAYBILL.title} <span aria-hidden="true">»</span>
          </p>
          <p className="th-billing__sub">{PLAYBILL.subtitle}</p>
          <div className="th-rule" aria-hidden="true">
            <span>✦</span>
          </div>
          <p className="th-billing__season">{PLAYBILL.season}</p>
        </div>
      </HangingCard>

      <div className="th-hint" ref={hint}>
        <span>Kindly scroll to raise the curtain</span>
        <i aria-hidden="true" />
      </div>
    </>
  );
}
