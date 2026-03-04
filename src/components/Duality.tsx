"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const CODE_ITEMS = [
  { key: "LANGS", val: "TypeScript · Swift · Kotlin" },
  { key: "FRONT", val: "React · Next.js · React Native" },
  { key: "BACK", val: "Node.js · Express · tRPC" },
  { key: "DATA", val: "MongoDB · PostgreSQL · Redis" },
  { key: "TOOLS", val: "Figma · GSAP · Three.js" },
  { key: "DEPLOY", val: "Vercel · AWS · Docker" },
];

const CULTURE_ITEMS = [
  { key: "SOUND", val: "Miles Davis · Coltrane · Sade" },
  { key: "INSTRUMENT", val: "Guitar, Drums" },
  { key: "READ", val: "Baldwin · Murakami · Camus" },
  { key: "WEAR", val: "Vintage" },
  { key: "CITY", val: "Barcelona → ??" },
  { key: "NOW", val: "Building in public. Slowly." },
];

export default function Duality() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftItemsRef = useRef<HTMLDivElement[]>([]);
  const rightItemsRef = useRef<HTMLDivElement[]>([]);
  const dividerLineRef = useRef<HTMLDivElement>(null);
  const leftHeadRef = useRef<HTMLHeadingElement>(null);
  const rightHeadRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(
          [
            ...leftItemsRef.current,
            ...rightItemsRef.current,
            dividerLineRef.current,
            leftHeadRef.current,
            rightHeadRef.current,
          ],
          { opacity: 1, y: 0 }
        );
        if (dividerLineRef.current)
          gsap.set(dividerLineRef.current, { scaleY: 1 });
        return;
      }

      // Start everything invisible
      gsap.set(leftItemsRef.current, { opacity: 0, yPercent: 60 });
      gsap.set(rightItemsRef.current, { opacity: 0, yPercent: -60 });
      gsap.set([leftHeadRef.current, rightHeadRef.current], {
        opacity: 0,
        yPercent: 30,
      });
      if (dividerLineRef.current)
        gsap.set(dividerLineRef.current, { scaleY: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=200%",
          scrub: 1.4,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Divider line draws down
      tl.to(
        dividerLineRef.current,
        {
          scaleY: 1,
          transformOrigin: "top center",
          ease: "none",
          duration: 0.4,
        },
        0
      );

      // Headings appear
      tl.to(
        [leftHeadRef.current, rightHeadRef.current],
        { opacity: 1, yPercent: 0, ease: "power2.out", duration: 0.2, stagger: 0.05 },
        0.1
      );

      // Left items sweep up from below (code = grounded, technical)
      leftItemsRef.current.forEach((item, i) => {
        tl.to(
          item,
          { opacity: 1, yPercent: 0, ease: "power2.out", duration: 0.15 },
          0.2 + i * 0.06
        );
      });

      // Right items sweep down from above (culture = inspired, aerial)
      rightItemsRef.current.forEach((item, i) => {
        tl.to(
          item,
          { opacity: 1, yPercent: 0, ease: "power2.out", duration: 0.15 },
          0.2 + i * 0.06
        );
      });

      // At 80% progress: brief color phase shift — frequencies diverge momentarily
      tl.to(
        leftItemsRef.current,
        { color: "#8080FF", duration: 0.1, ease: "none" },
        0.75
      );
      tl.to(
        rightItemsRef.current,
        { color: "#FF8060", duration: 0.1, ease: "none" },
        0.75
      );
      // Resolve back to ivory — they converge
      tl.to(
        [...leftItemsRef.current, ...rightItemsRef.current],
        { color: "#F0EBE0", duration: 0.15, ease: "none" },
        0.88
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="duality" id="duality">
      {/* Magazine folio */}
      <div style={{ position: "absolute", top: "3rem", left: "clamp(2rem, 5vw, 6rem)" }}>
        <span className="section-label">/ WHO AM I / p. 003</span>
      </div>

      <div className="duality-inner">
        {/* ── LEFT: THE CODE ── */}
        <div className="duality-col">
          <p className="duality-col-label">THE CODE</p>
          <h2 ref={leftHeadRef} className="duality-heading">
            WHAT
            <br />I BUILD
          </h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {CODE_ITEMS.map((item, i) => (
              <div
                key={item.key}
                ref={(el) => {
                  if (el) leftItemsRef.current[i] = el;
                }}
                className="duality-item"
              >
                <span className="duality-item-key">{item.key}</span>
                <span className="duality-item-val">{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="duality-divider">
          <div ref={dividerLineRef} className="duality-divider-line" />
        </div>

        {/* ── RIGHT: THE CULTURE ── */}
        <div className="duality-col">
          <p className="duality-col-label">THE CULTURE</p>
          <h2 ref={rightHeadRef} className="duality-heading">
            WHAT
            <br />MOVES ME
          </h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {CULTURE_ITEMS.map((item, i) => (
              <div
                key={item.key}
                ref={(el) => {
                  if (el) rightItemsRef.current[i] = el;
                }}
                className="duality-item"
              >
                <span className="duality-item-key">{item.key}</span>
                <span className="duality-item-val">{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
