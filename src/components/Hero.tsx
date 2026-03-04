"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";

interface HeroProps {
  waveformAmplitude?: (v: number) => void;
}

export default function Hero({ waveformAmplitude }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const name1Ref = useRef<HTMLSpanElement>(null);
  const name2Ref = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const folioRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const name1 = name1Ref.current;
    const name2 = name2Ref.current;
    const meta = metaRef.current;
    const folio = folioRef.current;
    const line = lineRef.current;

    if (!section || !name1 || !name2 || !meta || !folio || !line) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      if (reduced) {
        const targets = isMobile ? [name1, name2, meta, folio] : [name1, name2, meta, folio, line];
        gsap.set(targets, { opacity: 1, y: 0, clipPath: "none" });
        return;
      }

      // ─── Entry animation (after preloader) ─────────────────────────
      const split1 = new SplitText(name1, { type: "chars" });
      const split2 = new SplitText(name2, { type: "chars" });

      const entryTl = gsap.timeline({ delay: 0.1 });

      // NICOLAS — chars scramble in from below, staggered
      entryTl.from(split1.chars, {
        yPercent: 120,
        opacity: 0,
        duration: 0.7,
        ease: "power4.out",
        stagger: { amount: 0.35, from: "start" },
      });

      // GARCIA — with slight offset in timing, pulls in from right
      entryTl.from(
        split2.chars,
        {
          xPercent: 5,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: { amount: 0.25, from: "end" },
        },
        "-=0.45"
      );

      // Red signal line draws in (desktop only)
      if (!isMobile) {
        entryTl.from(
          line,
          { scaleX: 0, transformOrigin: "left center", duration: 0.6, ease: "power3.out" },
          "-=0.4"
        );
      }

      // Meta + folio fade up
      entryTl.from(
        [meta, folio],
        { opacity: 0, yPercent: 20, duration: 0.5, ease: "power2.out", stagger: 0.08 },
        "-=0.3"
      );

      // ─── Per-character hover: float + color swap (desktop only) ──
      if (!isMobile) {
        let revertTimer: ReturnType<typeof setTimeout> | null = null;

        const swapColors = () => {
          if (revertTimer) { clearTimeout(revertTimer); revertTimer = null; }
          gsap.to(split1.chars, { color: "#FF2D00", duration: 0.3, overwrite: "auto" });
          gsap.to(split2.chars, { color: "#F0EBE0", duration: 0.3, overwrite: "auto" });
        };

        const scheduleRevert = () => {
          if (revertTimer) clearTimeout(revertTimer);
          revertTimer = setTimeout(() => {
            gsap.to(split1.chars, { color: "#F0EBE0", duration: 0.3, overwrite: "auto" });
            gsap.to(split2.chars, { color: "#FF2D00", duration: 0.3, overwrite: "auto" });
            revertTimer = null;
          }, 50);
        };

        [...split1.chars, ...split2.chars].forEach((char) => {
          char.addEventListener("mouseenter", () => {
            swapColors();
            gsap.to(char, {
              y: gsap.utils.random(-8, 8),
              x: gsap.utils.random(-3, 3),
              duration: 0.35,
              ease: "power2.out",
              yoyo: true,
              repeat: 1,
              overwrite: "auto",
            });
          });
          char.addEventListener("mouseleave", scheduleRevert);
        });
      }

      // ─── Scroll exit — lines diverge like a page splitting open ─────
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate(self) {
          const p = self.progress;

          gsap.set(name1, {
            yPercent: -p * 150,
            xPercent: -p * 12,
            rotation: -p * 3,
          });

          gsap.set(name2, {
            yPercent: p * 20,
            xPercent: p * 8,
            rotation: p * 2,
          });

          if (!isMobile) {
            gsap.set(line, {
              scaleX: 1 - p,
              opacity: 1 - p * 2.5,
              transformOrigin: "center center",
            });
          }

          waveformAmplitude?.(0.15 + p * 0.6);
        },
      });
    }, section);

    return () => ctx.revert();
  }, [waveformAmplitude]);

  return (
    <section ref={sectionRef} className="hero" id="hero">
      {/* Name block — Ray Gun style: bleeds left, massive */}
      <div
        className="hero-name-block"
        style={{
          position: "absolute",
          bottom: "clamp(5rem, 12vh, 14rem)",
          left: 0,
          right: 0,
          padding: "0 clamp(1.5rem, 4vw, 5rem)",
        }}
      >
        <span
          ref={name1Ref}
          className="hero-name-line"
          style={{ display: "block" }}
        >
          NICO
        </span>
        <span
          ref={name2Ref}
          className="hero-name-line"
          style={{ display: "block" }}
        >
          ZARCERO
        </span>
      </div>

      {/* Signal line — magazine rule */}
      <div
        ref={lineRef}
        className="hero-signal-line"
      />

      {/* Top-right: magazine-style section label */}
      <div
        style={{
          position: "absolute",
          top: "3rem",
          right: "clamp(1.5rem, 4vw, 5rem)",
        }}
      >
        <span className="section-label">Vol. 1 / 2026</span>
      </div>

      {/* Top-left: ZARCEROG.COM header */}
      <div
        style={{
          position: "absolute",
          top: "3rem",
          left: "clamp(1.5rem, 4vw, 5rem)",
        }}
      >
        <span className="section-label">ZARCEROG.COM</span>
      </div>

      {/* Bottom-right: role + scroll hint */}
      <div ref={metaRef} className="hero-meta">
        <p className="hero-role">/ CREATIVE DEVELOPER</p>
        <p className="hero-scroll-hint" style={{ marginTop: "0.5rem" }}>
          ↓ scroll to tune in
        </p>
      </div>

      {/* Bottom-left: folio */}
      <div ref={folioRef} className="hero-folio">
        <span>p. 001</span>
      </div>
    </section>
  );
}
