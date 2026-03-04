"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { PROJECTS } from "@/lib/projects";

export default function Work({ onProjectClick }: { onProjectClick?: (slug: string) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const titleRefs = useRef<HTMLHeadingElement[]>([]);
  const infoRefs = useRef<HTMLDivElement[]>([]);
  const shieldRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const onHover = useCallback((i: number) => setHoveredCard(i), []);
  const onLeave = useCallback(() => setHoveredCard(null), []);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        titleRefs.current.forEach((t) => {
          if (t) gsap.set(t, { clipPath: "inset(0 0% 0 0)" });
        });
        infoRefs.current.forEach((info) => {
          if (info) gsap.set(info, { opacity: 1 });
        });
        return;
      }

      const numCards = PROJECTS.length;
      const isMobile = window.innerWidth < 768;
      const totalTravel = (numCards - 1) * window.innerWidth;

      titleRefs.current.forEach((title, i) => {
        if (!title) return;
        gsap.set(title, {
          clipPath: i === 0 ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
        });
      });
      infoRefs.current.forEach((info, i) => {
        if (!info) return;
        gsap.set(info, { opacity: i === 0 ? 1 : 0 });
      });

      const startDwell = isMobile ? 0.05 : 0.10;
      const moveFraction = isMobile ? 0.90 : 0.80;
      const endDwell = 1 - startDwell - moveFraction;
      const pinTotal = totalTravel / moveFraction;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${pinTotal}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      tl.to({}, { duration: startDwell }, 0);
      tl.to(track, { x: -totalTravel, ease: "none", duration: moveFraction }, startDwell);
      tl.to({}, { duration: endDwell }, startDwell + moveFraction);

      // Only animate reveals for cards that start off-screen (index 1+)
      for (let i = 1; i < numCards; i++) {
        const title = titleRefs.current[i];
        const info = infoRefs.current[i];
        const entryProgress = startDwell + (i - 0.7) / (numCards - 1) * moveFraction;
        const revealDuration = 0.12;

        if (title) {
          tl.to(
            title,
            { clipPath: "inset(0 0% 0 0)", ease: "power2.out", duration: revealDuration },
            entryProgress
          );
        }
        if (info) {
          tl.to(
            info,
            { opacity: 1, ease: "power2.out", duration: revealDuration * 1.2 },
            entryProgress + 0.03
          );
        }
      }

      // Fade out the top gradient shield and label as scroll begins
      const fadeTargets = [shieldRef.current, labelRef.current].filter(Boolean);
      if (fadeTargets.length) {
        tl.to(fadeTargets, { opacity: 0, ease: "power2.in", duration: startDwell + moveFraction * 0.25 }, 0);
      }

      // Velocity-based skew for physical weight
      ScrollTrigger.create({
        id: "work-skew",
        trigger: section,
        start: "top top",
        end: `+=${pinTotal}`,
        onUpdate(self) {
          const v = self.getVelocity() / 6000;
          gsap.to(track, {
            skewX: Math.max(-3, Math.min(3, v * -2)),
            ease: "power3.out",
            duration: 0.5,
            overwrite: "auto",
          });
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="work"
      id="work"
      style={{ height: "100vh", position: "relative" }}
    >
      {/* Gradient shield keeps the folio label above card backgrounds */}
      <div
        ref={shieldRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "8rem",
          background:
            "linear-gradient(to bottom, rgba(6,6,6,1) 0%, rgba(6,6,6,0.7) 60%, transparent 100%)",
          zIndex: 10,
          pointerEvents: "none",
          transition: "opacity 0.4s ease",
          ...(hoveredCard !== null && { opacity: 0 }),
        }}
      />

      <div
        ref={labelRef}
        style={{
          position: "absolute",
          top: "3rem",
          left: "clamp(2rem, 5vw, 6rem)",
          zIndex: 11,
          transition: "opacity 0.4s ease",
          ...(hoveredCard !== null && { opacity: 0 }),
        }}
      >
        <span className="section-label">/ STUFF I BUILT / p. 004</span>
      </div>

      {/* Horizontal scroll track */}
      <div
        ref={trackRef}
        className="work-track"
        style={{ height: "100vh", willChange: "transform" }}
      >
        {PROJECTS.map((project, i) => (
          <div
            key={project.title}
            className="work-card"
            data-cursor="hover"
            onClick={() => onProjectClick?.(project.slug)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onProjectClick?.(project.slug); }}
          >
            {/* Background layers */}
            <div
              className="work-card-bg"
              style={{ background: project.bg, position: "absolute", inset: 0 }}
            />

            {project.bgImage && (
              <>
                <Image
                  src={project.bgImage}
                  alt=""
                  fill
                  sizes="100vw"
                  className="work-card-bg-img"
                  style={{ opacity: hoveredCard === i ? 0 : 1 }}
                  priority={i === 0}
                />
                <Image
                  src={project.bgGif!}
                  alt=""
                  fill
                  sizes="100vw"
                  className="work-card-bg-img"
                  style={{ opacity: hoveredCard === i ? 1 : 0 }}
                  unoptimized
                />
              </>
            )}

            {/* Gradient overlay — always visible */}
            <div
              className="work-card-bg-overlay"
              style={{ background: project.bg }}
            />

            {/* Bottom accent bleed */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "50%",
                background: `linear-gradient(to top, ${project.accentColor}18 0%, transparent 100%)`,
                pointerEvents: "none",
                zIndex: 2,
              }}
            />

            <div className="work-card-number" style={{ zIndex: 3 }}>
              {project.number}
            </div>

            {/* Giant title — Ray Gun spread */}
            <h2
              ref={(el) => { if (el) titleRefs.current[i] = el; }}
              className="work-card-title"
              onMouseEnter={() => onHover(i)}
              onMouseLeave={onLeave}
              style={{ pointerEvents: "auto" }}
            >
              {project.title}
            </h2>

            {/* Bottom info bar */}
            <div
              ref={(el) => { if (el) infoRefs.current[i] = el; }}
              className="work-card-info"
            >
              <div>
                <p
                  className="text-mono"
                  style={{
                    fontSize: "clamp(1.2rem, 2.5vw, 2rem)",
                    color: project.textAccent,
                    marginBottom: "0.6rem",
                    fontWeight: 700,
                  }}
                >
                  {project.subtitle}
                </p>
                <p className="work-card-desc">{project.description}</p>
                <div className="work-card-stack" style={{ marginTop: "1rem" }}>
                  {project.stack.map((tag) => (
                    <span key={tag} className="work-card-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p
                  className="text-mono"
                  style={{
                    fontSize: "0.625rem",
                    color: "#F0EBE0",
                    opacity: 0.3,
                    marginBottom: "1rem",
                  }}
                >
                  {project.year}
                </p>
                <button
                  onClick={() => onProjectClick?.(project.slug)}
                  className="work-card-link"
                  onMouseEnter={() => onHover(i)}
                  onMouseLeave={onLeave}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid #FF2D00",
                    cursor: "none",
                    paddingBottom: "2px",
                  }}
                >
                  VIEW PROJECT →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
