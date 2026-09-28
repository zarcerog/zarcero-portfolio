"use client";

import { useRef } from "react";

import { useTick } from "../engine";
import { easeInOut, seg } from "../motion";
import { CUES } from "../timeline";

/** How far open the house curtain is at beat t (0 closed, 1 open). */
export function curtainOpenAt(t: number) {
  const { prologue, intermission, finale } = CUES;
  if (t < intermission.curtainClose[0]) return easeInOut(seg(t, ...prologue.curtainOpen));
  if (t < intermission.curtainOpen[0]) return 1 - easeInOut(seg(t, ...intermission.curtainClose));
  if (t < finale.curtainClose[0]) return easeInOut(seg(t, ...intermission.curtainOpen));
  return 1 - easeInOut(seg(t, ...finale.curtainClose));
}

/** Gilded cartouche with the house monogram. */
export function Crest() {
  return (
    <svg className="th-crest" viewBox="0 0 220 150" aria-hidden="true">
      <defs>
        <linearGradient id="crest-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3dc93" />
          <stop offset="0.45" stopColor="#c99a3e" />
          <stop offset="1" stopColor="#7d5719" />
        </linearGradient>
        <radialGradient id="crest-cream" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#fbf4e2" />
          <stop offset="1" stopColor="#e9d8b4" />
        </radialGradient>
      </defs>
      {/* scrolling acanthus arms */}
      <path
        d="M110 118 C 70 128, 22 120, 14 92 C 8 70, 30 58, 44 70 C 54 79, 44 92, 34 86"
        fill="none"
        stroke="url(#crest-gold)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M110 118 C 150 128, 198 120, 206 92 C 212 70, 190 58, 176 70 C 166 79, 176 92, 186 86"
        fill="none"
        stroke="url(#crest-gold)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* crown */}
      <path
        d="M84 30 L92 6 L103 24 L110 2 L117 24 L128 6 L136 30 Z"
        fill="url(#crest-gold)"
        stroke="#6a4814"
        strokeWidth="1.5"
      />
      {/* beaded ring */}
      <ellipse cx="110" cy="74" rx="58" ry="48" fill="url(#crest-gold)" stroke="#6a4814" strokeWidth="2" />
      <ellipse
        cx="110"
        cy="74"
        rx="52"
        ry="42"
        fill="none"
        stroke="#fbe7a8"
        strokeWidth="3"
        strokeDasharray="0.1 7"
        strokeLinecap="round"
      />
      <ellipse cx="110" cy="74" rx="44" ry="34" fill="url(#crest-cream)" stroke="#8a6423" strokeWidth="2" />
      {/* tail */}
      <path d="M96 120 Q110 146 124 120 Z" fill="url(#crest-gold)" stroke="#6a4814" strokeWidth="1.5" />
      <text
        x="110"
        y="90"
        textAnchor="middle"
        className="th-crest__z"
        fill="#a3232e"
      >
        Z
      </text>
    </svg>
  );
}

/** The red swagged valance across the top of the proscenium. */
export function Valance() {
  const swag =
    "M1200 64 Q1030 150 850 70 Q600 170 350 70 Q170 150 0 64";
  return (
    <div className="th-valance" aria-hidden="true">
      <svg viewBox="0 0 1200 130" preserveAspectRatio="none">
        <defs>
          <linearGradient id="val-velvet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6d1219" />
            <stop offset="0.35" stopColor="#b3303a" />
            <stop offset="0.7" stopColor="#9e2630" />
            <stop offset="1" stopColor="#5e0f15" />
          </linearGradient>
          <linearGradient id="val-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3dc93" />
            <stop offset="0.5" stopColor="#c99a3e" />
            <stop offset="1" stopColor="#7d5719" />
          </linearGradient>
        </defs>
        <path d={`M0 0 H1200 V64 ${swag.slice(swag.indexOf("Q"))} Z`} fill="url(#val-velvet)" />
        {/* fringe */}
        <path
          d={swag}
          transform="translate(0 7)"
          fill="none"
          stroke="#d9b25c"
          strokeWidth="12"
          strokeDasharray="1.5 3.5"
          vectorEffect="non-scaling-stroke"
        />
        <path d={swag} fill="none" stroke="url(#val-gold)" strokeWidth="5" vectorEffect="non-scaling-stroke" />
        <path
          d={swag}
          transform="translate(0 -16)"
          fill="none"
          stroke="#e7c677"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          opacity="0.8"
        />
        <rect x="0" y="0" width="1200" height="16" fill="url(#val-gold)" />
        <line
          x1="0"
          y1="8"
          x2="1200"
          y2="8"
          stroke="#fff1bf"
          strokeWidth="3"
          strokeDasharray="0.1 9"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

/** A tied-back red side drape (the "tableau" legs from the reference). */
function Leg({ side }: { side: "left" | "right" }) {
  return (
    <div className={`th-leg th-leg--${side}`} aria-hidden="true">
      <svg viewBox="0 0 100 1000" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`leg-${side}`} x1="0" x2="16" y1="0" y2="0" gradientUnits="userSpaceOnUse" spreadMethod="repeat">
            <stop offset="0" stopColor="#6d1219" />
            <stop offset="0.35" stopColor="#b8363f" />
            <stop offset="0.55" stopColor="#cf4b53" />
            <stop offset="1" stopColor="#6d1219" />
          </linearGradient>
        </defs>
        <path
          d="M0 0 H100 C 88 250, 46 480, 30 620 C 40 720, 62 860, 78 1000 H0 Z"
          fill={`url(#leg-${side})`}
        />
        <path
          d="M100 0 C 88 250, 46 480, 30 620 C 40 720, 62 860, 78 1000"
          fill="none"
          stroke="#d9b25c"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <i className="th-leg__tie" />
    </div>
  );
}

export function Legs() {
  return (
    <>
      <Leg side="left" />
      <Leg side="right" />
    </>
  );
}

/** The pleated teal border drape that hangs just inside the opening. */
export function Border() {
  return <div className="th-border" aria-hidden="true" />;
}

/** The house curtain. Gathers to the sides as it opens. */
export function HouseCurtain() {
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useTick(-1, 1e6, (t) => {
    const p = curtainOpenAt(t);
    const s = 1 - 0.86 * p;
    // A tableau curtain lifts its inner hem as it draws back.
    const lift = p * 26;
    if (left.current) {
      left.current.style.transform = `scaleX(${s.toFixed(4)})`;
      left.current.style.clipPath = `polygon(0 0, 100% 0, 100% ${(100 - lift).toFixed(2)}%, 0 100%)`;
    }
    if (right.current) {
      right.current.style.transform = `scaleX(${s.toFixed(4)})`;
      right.current.style.clipPath = `polygon(0 0, 100% 0, 100% 100%, 0 ${(100 - lift).toFixed(2)}%)`;
    }
    if (wrap.current) wrap.current.dataset.state = p > 0.995 ? "open" : p < 0.005 ? "closed" : "moving";
  });

  return (
    <div className="th-curtain" ref={wrap} data-state="closed" aria-hidden="true">
      <div className="th-curtain__half th-curtain__half--left" ref={left} />
      <div className="th-curtain__half th-curtain__half--right" ref={right} />
    </div>
  );
}

/** The bare stage: cyclorama, fly battens and floorboards. */
export function BareStage() {
  return (
    <div className="th-bare" aria-hidden="true">
      <div className="th-cyc" />
      <div className="th-battens">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

export function Floor() {
  return <div className="th-floor" aria-hidden="true" />;
}

/** Warm light from the flies, plus the footlight glow on the floor. */
export function StageWash() {
  return <div className="th-wash" aria-hidden="true" />;
}
