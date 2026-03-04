"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

// ─── Update these manually whenever your "now" changes ──────────────
const NOW_ITEMS = [
  {
    label: "LISTENING",
    value: "Kind of Blue — Miles Davis",
    note: "on repeat since 1959",
  },
  {
    label: "READING",
    value: "Giovanni's Room — Baldwin",
    note: "third time through",
  },
  {
    label: "BUILDING",
    value: "Ara",
    note: "coming soon(ish)",
  },
  {
    label: "WEARING",
    value: "Vintage Levi's 501 / 1988",
    note: "the real ones",
  },
  {
    label: "CITY",
    value: "Barcelona, ES",
    note: "for now",
  },
  {
    label: "WORKING",
    value: "Evinova - Mobile Software Engineer",
    note: "healthcare tech, hybrid",
  }
];

export default function RightNow() {
  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const itemRefs = useRef<HTMLDivElement[]>([]);
  const dotRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(itemRefs.current, { opacity: 1 });
        dotRefs.current.forEach((d) => d && gsap.set(d, { scale: 1 }));
        return;
      }

      // Heading: hide initially, reveal on scroll entry
      gsap.set(headRef.current, { yPercent: 40, opacity: 0 });

      ScrollTrigger.create({
        trigger: headRef.current,
        start: "top 80%",
        onEnter() {
          gsap.to(headRef.current, {
            yPercent: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
          });
        },
      });

      // Each item: signal dot pops in, then label/value fade
      itemRefs.current.forEach((item, i) => {
        const dot = dotRefs.current[i];

        ScrollTrigger.create({
          trigger: item,
          start: "top 85%",
          onEnter() {
            const tl = gsap.timeline();

            // Dot "tunes in"
            tl.to(dot, {
              scale: 1,
              duration: 0.4,
              ease: "back.out(1.7)",
            });

            // Item fades up
            tl.to(
              item,
              { opacity: 1, yPercent: 0, duration: 0.4, ease: "power2.out" },
              "-=0.2"
            );
          },
        });

        // Set initial state
        gsap.set(item, { opacity: 0, yPercent: 20 });
        if (dot) gsap.set(dot, { scale: 0 });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="rightnow" id="rightnow">
      {/* Folio */}
      <div style={{ position: "absolute", top: "3rem", left: "clamp(2rem, 6vw, 8rem)" }}>
        <span className="section-label">/ RIGHT NOW / p. 005</span>
      </div>

      {/*
        "RIGHT NOW" in massive display type — bleeds off top edge.
        Like a magazine section header.
      */}
      <div style={{ overflow: "hidden" }}>
        <h2 ref={headRef} className="rightnow-heading">
          RIGHT
          <br />
          <span style={{ color: "#FF2D00" }}>NOW</span>
        </h2>
      </div>

      {/* Signal grid */}
      <div className="rightnow-grid">
        {NOW_ITEMS.map((item, i) => (
          <div
            key={item.label}
            ref={(el) => { if (el) itemRefs.current[i] = el; }}
            className="rightnow-item"
          >
            <div
              ref={(el) => { if (el) dotRefs.current[i] = el; }}
              className="rightnow-dot"
              style={{ marginTop: "0.5rem" }}
            />
            <div>
              <p className="rightnow-item-label">{item.label}</p>
              <p className="rightnow-item-value">{item.value}</p>
              <p
                className="text-mono"
                style={{
                  fontSize: "0.625rem",
                  color: "#F0EBE0",
                  opacity: 0.25,
                  marginTop: "0.2rem",
                  fontStyle: "italic",
                }}
              >
                {item.note}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
