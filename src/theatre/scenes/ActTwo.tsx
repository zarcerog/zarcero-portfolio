"use client";

import { useRef } from "react";

import { ROOMS, type Room } from "../content";
import { useOnStage, useTick } from "../engine";
import { easeIn, easeInOut, easeOut, lerp, seg } from "../motion";
import { CUES } from "../timeline";

const C = CUES.act2;

function SchoolProp() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true">
      <rect x="40" y="10" width="240" height="120" rx="4" fill="#7a5a3c" />
      <rect x="48" y="18" width="224" height="104" fill="#35534b" />
      <g className="th-chalk" fill="none" stroke="#eef0e6" strokeWidth="2" strokeLinecap="round">
        <text x="62" y="46" className="th-chalk__text">print(&quot;hola, mundo&quot;)</text>
        <text x="62" y="70" className="th-chalk__text">if (curious) learn();</text>
        <text x="62" y="94" className="th-chalk__text">else learn();</text>
        <path d="M232 100 q10 -14 20 0" />
      </g>
      <rect x="120" y="130" width="80" height="6" fill="#7a5a3c" />
      <rect x="60" y="150" width="200" height="12" rx="2" fill="#a57a4f" />
      <rect x="70" y="162" width="8" height="34" fill="#7a5a3c" />
      <rect x="242" y="162" width="8" height="34" fill="#7a5a3c" />
      <circle cx="110" cy="136" r="12" fill="#b8323a" />
      <path d="M110 124 q4 -8 10 -8" stroke="#4f7a58" strokeWidth="3" fill="none" />
      <circle cx="220" cy="128" r="18" fill="#9cc6c4" stroke="#8a6423" strokeWidth="2" />
      <path d="M204 122 q16 8 32 0 M210 138 q10 -6 22 0" stroke="#4f7a58" strokeWidth="3" fill="none" />
      <path d="M220 146 v4 M210 150 h20" stroke="#8a6423" strokeWidth="3" />
    </svg>
  );
}

function DashboardProp() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true">
      <path d="M10 70 Q160 10 310 70 V170 H10 Z" fill="#3b3a3f" />
      <path d="M10 70 Q160 10 310 70" fill="none" stroke="#6f6e74" strokeWidth="4" />
      {[80, 240].map((cx, i) => (
        <g key={cx}>
          <circle cx={cx} cy="92" r="34" fill="#f6ecd6" stroke="#c99a3e" strokeWidth="4" />
          {Array.from({ length: 9 }, (_, k) => {
            const a = (-210 + k * 30) * (Math.PI / 180);
            return (
              <line
                key={k}
                x1={cx + Math.cos(a) * 24}
                y1={92 + Math.sin(a) * 24}
                x2={cx + Math.cos(a) * 30}
                y2={92 + Math.sin(a) * 30}
                stroke="#3b3a3f"
                strokeWidth="2"
              />
            );
          })}
          <line
            className={i === 0 ? "th-needle" : "th-needle th-needle--rpm"}
            x1={cx}
            y1="92"
            x2={cx}
            y2="66"
            stroke="#b8323a"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={cx} cy="92" r="4" fill="#3b3a3f" />
        </g>
      ))}
      <rect x="126" y="62" width="68" height="46" rx="5" fill="#6fa3a5" stroke="#1e1d21" strokeWidth="3" />
      <g fill="#f6ecd6">
        <rect x="134" y="70" width="14" height="12" rx="2" />
        <rect x="153" y="70" width="14" height="12" rx="2" />
        <rect x="172" y="70" width="14" height="12" rx="2" />
        <rect x="134" y="88" width="52" height="10" rx="2" opacity="0.7" />
      </g>
      <g className="th-wheel">
        <circle cx="160" cy="176" r="56" fill="none" stroke="#1e1d21" strokeWidth="12" />
        <path d="M104 176 H216 M160 176 V232" stroke="#1e1d21" strokeWidth="9" />
        <circle cx="160" cy="176" r="14" fill="#c99a3e" />
      </g>
    </svg>
  );
}

function VaultProp() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true">
      {[
        [40, 150],
        [58, 150],
        [262, 150],
        [280, 150],
      ].map(([x, y], i) => (
        <g key={i}>
          {Array.from({ length: 4 + (i % 2) }, (_, k) => (
            <ellipse key={k} cx={x} cy={y + 30 - k * 8} rx="12" ry="4" fill="#dcae45" stroke="#8a6423" strokeWidth="1.5" />
          ))}
        </g>
      ))}
      <circle cx="160" cy="100" r="92" fill="#8f949a" />
      <circle cx="160" cy="100" r="82" fill="#b7bcc1" stroke="#6a6f75" strokeWidth="4" />
      {Array.from({ length: 16 }, (_, k) => {
        const a = (k / 16) * Math.PI * 2;
        return <circle key={k} cx={160 + Math.cos(a) * 72} cy={100 + Math.sin(a) * 72} r="4" fill="#6a6f75" />;
      })}
      <g className="th-vault-wheel">
        {[0, 60, 120].map((r) => (
          <rect key={r} x="154" y="44" width="12" height="112" rx="6" fill="#c99a3e" transform={`rotate(${r} 160 100)`} />
        ))}
        <circle cx="160" cy="100" r="18" fill="#f0d78c" stroke="#8a6423" strokeWidth="3" />
      </g>
    </svg>
  );
}

function ClinicProp() {
  const clock = (x: number, label: string) => (
    <g transform={`translate(${x} 26)`}>
      <circle r="17" fill="#f6ecd6" stroke="#8a6423" strokeWidth="3" />
      <line className="th-clock-h" x1="0" y1="0" x2="0" y2="-9" stroke="#2b1a17" strokeWidth="2.5" strokeLinecap="round" />
      <line className="th-clock-m" x1="0" y1="0" x2="0" y2="-13" stroke="#b8323a" strokeWidth="1.8" strokeLinecap="round" />
      <text y="32" textAnchor="middle" className="th-clock-label">
        {label}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true">
      {clock(90, "Barcelona")}
      {clock(160, "Bosnia")}
      {clock(230, "Sweden")}
      {/* the phone */}
      <rect x="132" y="74" width="56" height="112" rx="10" fill="#2b1a17" />
      <rect x="137" y="82" width="46" height="96" rx="5" fill="#f6ecd6" />
      <path d="M142 120 h8 l4 -10 l6 20 l5 -14 l3 4 h12" fill="none" stroke="#b8323a" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="143" y="140" width="34" height="6" rx="3" fill="#6fa3a5" />
      <rect x="143" y="152" width="24" height="6" rx="3" fill="#9cc6c4" />
      {/* the device */}
      <rect x="52" y="140" width="46" height="24" rx="12" fill="#f6ecd6" stroke="#8a6423" strokeWidth="2.5" />
      <circle cx="75" cy="152" r="4" fill="#6fa3a5" />
      <g className="th-ble" fill="none" stroke="#2f6a68" strokeWidth="3" strokeLinecap="round">
        <path d="M104 142 q8 10 0 20" />
        <path d="M112 134 q14 18 0 36" />
        <path d="M120 126 q20 26 0 52" />
      </g>
      <rect x="226" y="150" width="50" height="36" rx="3" fill="#b9d3c6" stroke="#8a6423" strokeWidth="2" />
      <path d="M236 160 h30 M236 168 h22 M236 176 h26" stroke="#2f6a68" strokeWidth="2.5" />
    </svg>
  );
}

const PROPS: Record<Room["prop"], () => React.ReactElement> = {
  school: SchoolProp,
  motors: DashboardProp,
  bank: VaultProp,
  clinic: ClinicProp,
};

export function Apprenticeship() {
  const wrap = useRef<HTMLElement>(null);
  const wagon = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  const [inA, inB] = C.wagonIn;
  const [outA, outB] = C.wagonOut;
  useOnStage(wrap, inA - 0.01, outB + 0.01);

  useTick(inA - 0.01, outB + 0.01, (t) => {
    // the building rolls on stage on its wagon, stage right to left
    const pin = easeOut(seg(t, inA, inB));
    const pout = easeIn(seg(t, outA, outB));
    if (wagon.current) {
      wagon.current.style.transform = `translateX(${lerp(105, 0, pin) + lerp(0, -105, pout)}%)`;
    }

    // the camera dollies from room to room, pausing in each
    const [pa, pb] = C.pan;
    const steps = ROOMS.length - 1;
    const span = (pb - pa) / steps;
    let pos = 0;
    for (let i = 0; i < steps; i++) {
      pos += easeInOut(seg(t, pa + i * span + span * 0.45, pa + (i + 1) * span));
    }
    if (track.current) {
      track.current.style.setProperty("--room", pos.toFixed(4));
      const idx = Math.round(pos);
      if (track.current.dataset.room !== String(idx)) track.current.dataset.room = String(idx);

      // props come alive
      const root = track.current;
      const needle = root.querySelector<SVGElement>(".th-needle");
      const rpm = root.querySelector<SVGElement>(".th-needle--rpm");
      const wheel = root.querySelector<SVGElement>(".th-wheel");
      const vault = root.querySelector<SVGElement>(".th-vault-wheel");
      const ble = root.querySelectorAll<SVGElement>(".th-ble path");
      const hands = root.querySelectorAll<SVGElement>(".th-clock-h");
      const mins = root.querySelectorAll<SVGElement>(".th-clock-m");
      const k = t - pa;
      const rot = (el: SVGElement | null, deg: number, cx: number, cy: number) =>
        el?.setAttribute("transform", `rotate(${deg.toFixed(2)} ${cx} ${cy})`);
      rot(needle, -120 + ((Math.sin(k * 3) + 1) / 2) * 200, 80, 92);
      rot(rpm, -110 + ((Math.sin(k * 5 + 1) + 1) / 2) * 150, 240, 92);
      rot(wheel, Math.sin(k * 2.2) * 24, 160, 176);
      rot(vault, k * 110, 160, 100);
      ble.forEach((p, i) => {
        const w = (Math.sin(k * 9 - i * 1.1) + 1) / 2;
        p.style.opacity = (0.25 + w * 0.75).toFixed(3);
      });
      // three offices, one timezone
      hands.forEach((h) => rot(h, k * 40, 0, 0));
      mins.forEach((m) => rot(m, k * 480, 0, 0));
    }
  });

  return (
    <section className="th-scene th-apprentice" ref={wrap} aria-label="Act II: the apprenticeship">
      <div className="th-wagon" ref={wagon}>
        <div className="th-rooms" ref={track} data-room="0">
          {ROOMS.map((room, i) => {
            const Prop = PROPS[room.prop];
            return (
              <article
                key={room.id}
                className={`th-room th-room--${room.prop}`}
                style={{ "--wall": room.wall, "--rfloor": room.floor, "--i": i } as React.CSSProperties}
              >
                <div className="th-room__cornice">
                  <span>{room.number}</span>
                </div>
                <div className="th-room__box">
                  <div className="th-room__lamp" aria-hidden="true" />
                  <header className="th-room__head">
                    <p className="th-room__role">{room.role}</p>
                    <h3 className="th-room__company">{room.company}</h3>
                  </header>
                  <div className="th-room__prop">
                    <Prop />
                  </div>
                  <div className="th-room__text">
                    <p className="th-room__detail">{room.detail}</p>
                    <p className="th-room__aside">{room.aside}</p>
                  </div>
                  <div className="th-room__floor" aria-hidden="true" />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
