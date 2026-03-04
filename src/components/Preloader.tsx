"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

interface PreloaderProps {
  onComplete: () => void;
}

function waitForFonts(): Promise<void> {
  return document.fonts.ready.then(() => {});
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const waveSvgRef = useRef<SVGPathElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (
      !preloaderRef.current ||
      !counterRef.current ||
      !waveSvgRef.current ||
      !barRef.current
    )
      return;

    document.documentElement.classList.add("locked");

    const el = counterRef.current;
    const waveEl = waveSvgRef.current;
    const barEl = barRef.current;
    const preloaderEl = preloaderRef.current;

    const pathLen = waveEl.getTotalLength?.() ?? 800;
    waveEl.style.strokeDasharray = String(pathLen);
    waveEl.style.strokeDashoffset = String(pathLen);

    let killed = false;
    const counter = { val: 0 };

    const phase1 = gsap.timeline();

    phase1.to(
      counter,
      {
        val: 85,
        duration: 1.4,
        ease: "power1.inOut",
        onUpdate() {
          el.textContent = String(Math.round(counter.val)).padStart(3, "0");
        },
      },
      0
    );

    phase1.to(
      waveEl,
      { strokeDashoffset: pathLen * 0.15, duration: 1.4, ease: "power2.inOut" },
      0
    );

    phase1.to(
      barEl,
      { scaleX: 0.85, duration: 1.4, ease: "power1.inOut", transformOrigin: "left center" },
      0
    );

    Promise.all([
      new Promise<void>((r) => phase1.then(() => r())),
      waitForFonts(),
    ]).then(() => {
      if (killed) return;

      const phase2 = gsap.timeline();

      phase2.to(
        counter,
        {
          val: 100,
          duration: 0.5,
          ease: "power1.out",
          onUpdate() {
            el.textContent = String(Math.round(counter.val)).padStart(3, "0");
          },
        },
        0
      );

      phase2.to(waveEl, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, 0);
      phase2.to(barEl, { scaleX: 1, duration: 0.5, ease: "power1.out" }, 0);

      phase2.call(() => {
        document.documentElement.classList.remove("locked");
        onCompleteRef.current();
      });

      phase2.to(preloaderEl, {
        yPercent: -100,
        duration: 0.9,
        ease: "power3.inOut",
      });
    });

    return () => {
      killed = true;
      phase1.kill();
      document.documentElement.classList.remove("locked");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate sine wave SVG path
  const W = 1440;
  const H = 60;
  const amp = 14;
  const freq = 4;
  let d = `M 0 ${H / 2}`;
  for (let x = 0; x <= W; x += 4) {
    const y = H / 2 + Math.sin((x / W) * Math.PI * 2 * freq) * amp;
    d += ` L ${x} ${y}`;
  }

  return (
    <div ref={preloaderRef} className="preloader" aria-hidden="true">
      {/* Wave SVG behind counter */}
      <svg
        className="preloader-wave"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ height: 60 }}
      >
        <path
          ref={waveSvgRef}
          d={d}
          fill="none"
          stroke="#FF2D00"
          strokeWidth="1.5"
        />
      </svg>

      {/* Counter */}
      <span className="preloader-counter">
        <span ref={counterRef}>000</span>
      </span>

      {/* Progress bar */}
      <div
        ref={barRef}
        style={{
          width: "100%",
          height: "1px",
          background: "#FF2D00",
          marginTop: "2rem",
          transform: "scaleX(0)",
          transformOrigin: "left center",
        }}
      />

      <p className="preloader-label">zarcerog.com / initializing signal</p>
    </div>
  );
}
