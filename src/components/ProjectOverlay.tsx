"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { getProject, getAdjacentProjects } from "@/lib/projects";
import type { Project } from "@/lib/projects";

// ─── Loading screen shown while project images preload ────────────────

function ProjectLoader({
  project,
  onReady,
}: {
  project: Project;
  onReady: () => void;
}) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    const srcs = [project.bgImage, project.bgGif].filter(Boolean) as string[];

    // No images to preload — ready immediately
    if (srcs.length === 0) {
      onReady();
      return;
    }

    let loaded = 0;
    const total = srcs.length;

    const checkDone = () => {
      loaded++;
      // Animate the bar
      if (barRef.current) {
        gsap.to(barRef.current, {
          scaleX: loaded / total,
          duration: 0.3,
          ease: "power2.out",
        });
      }
      if (loaded >= total && !readyRef.current) {
        readyRef.current = true;
        // Small delay so the bar visually completes
        setTimeout(() => {
          if (loaderRef.current) {
            gsap.to(loaderRef.current, {
              opacity: 0,
              duration: 0.35,
              ease: "power2.in",
              onComplete: onReady,
            });
          } else {
            onReady();
          }
        }, 200);
      }
    };

    srcs.forEach((src) => {
      const img = new window.Image();
      img.onload = checkDone;
      img.onerror = checkDone; // Don't block on failure
      img.src = src;
    });

    // Safety timeout — don't block longer than 4s
    const timeout = setTimeout(() => {
      if (!readyRef.current) {
        readyRef.current = true;
        onReady();
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, [project, onReady]);

  return (
    <div
      ref={loaderRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        background: "#060606",
        display: "flex",
        alignItems: "flex-end",
        padding: "3rem clamp(2rem, 6vw, 8rem)",
        pointerEvents: "none",
      }}
    >
      <div style={{ width: "100%" }}>
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "#1A1A1A",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            ref={barRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: project.accentColor,
              transformOrigin: "left",
              transform: "scaleX(0)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Abstract visuals for portfolio project (no screenshots) ────────────

function ZarcerogVisuals() {
  const W = 800, H = 120, amp = 30;
  let d = `M 0 ${H / 2}`;
  for (let x = 0; x <= W; x += 3) {
    const y = H / 2 + Math.sin((x / W) * Math.PI * 8) * amp * Math.sin((x / W) * Math.PI);
    d += ` L ${x} ${y}`;
  }
  return (
    <>
      <div style={{ width: "100%", aspectRatio: "16/9", position: "relative", overflow: "hidden", background: "#060606" }}>
        <svg style={{ position: "absolute", top: "50%", left: 0, width: "100%", transform: "translateY(-50%)", opacity: 0.4 }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <path d={d} fill="none" stroke="#FF2D00" strokeWidth="2" />
        </svg>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #060606 0%, transparent 10%, transparent 90%, #060606 100%)" }} />
        <div style={{ position: "absolute", bottom: "2rem", left: "2rem" }}>
          <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", color: "#FF2D00", letterSpacing: "0.2em", opacity: 0.6 }}>CANVAS 2D WAVEFORM</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ aspectRatio: "1", position: "relative", overflow: "hidden", background: "#0A0A0A" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "1.5rem" }}>
            <div style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(4rem, 10vw, 9rem)", color: "#F0EBE0", lineHeight: 0.85, opacity: 0.06, position: "absolute", top: "50%", left: "-0.02em", transform: "translateY(-50%)", whiteSpace: "nowrap" }}>ZARCERO</div>
            <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", color: "#FF2D00", letterSpacing: "0.2em", opacity: 0.6, position: "relative" }}>BEBAS NEUE / DISPLAY</p>
          </div>
        </div>
        <div style={{ aspectRatio: "1", position: "relative", overflow: "hidden", background: "#060610" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem", gap: "0.5rem" }}>
            {["NEXT.JS", "GSAP", "LENIS", "CANVAS 2D", "TAILWIND V4"].map((tech, i) => (
              <div key={tech} style={{ display: "flex", alignItems: "center", gap: "0.75rem", opacity: 0.3 + i * 0.1 }}>
                <div style={{ width: 6, height: 6, background: "#FF2D00", borderRadius: "50%", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.6rem", color: "#F0EBE0", letterSpacing: "0.1em" }}>{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Project content (remounts on slug change via key) ─────────────────

function ProjectContent({
  project,
  onNavigate,
  animateIn,
}: {
  project: Project;
  onNavigate: (slug: string) => void;
  onClose: () => void;
  animateIn: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const { prev, next } = getAdjacentProjects(project.slug);
  const hasImages = !!project.bgImage;

  useEffect(() => {
    if (!animateIn || hasAnimated.current) return;
    hasAnimated.current = true;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      if (contentRef.current) {
        const items = contentRef.current.querySelectorAll<HTMLElement>("[data-reveal]");
        gsap.set(items, { opacity: 1, yPercent: 0 });
      }
      return;
    }

    const ctx = gsap.context(() => {
      if (contentRef.current) {
        const items = contentRef.current.querySelectorAll<HTMLElement>("[data-reveal]");
        gsap.set(items, { opacity: 0, yPercent: 8 });
        gsap.to(items, {
          opacity: 1,
          yPercent: 0,
          duration: 0.65,
          ease: "power3.out",
          stagger: 0.15,
          delay: 0.3,
        });
      }
    });

    return () => ctx.revert();
  }, [animateIn]);

  const navBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "none",
    padding: 0,
    display: "block",
    textAlign: "left",
    width: "100%",
  };

  return (
    <div style={{ opacity: animateIn ? 1 : 0, transition: "opacity 0.4s ease" }}>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div style={{ position: "relative", height: "100vh", background: "#060606", overflow: "hidden" }}>
        {project.bgGif && (
          <Image
            src={project.bgGif}
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
            unoptimized
            priority
          />
        )}
        <div style={{
          position: "absolute",
          inset: 0,
          background: project.bg,
          opacity: project.bgGif ? 0.55 : 1,
          pointerEvents: "none",
          zIndex: 1,
        }} />
        {project.bgGif && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, transparent 15%, #06060640 45%, #060606cc 72%, #060606 100%)",
            pointerEvents: "none",
            zIndex: 2,
          }} />
        )}

        <div style={{ position: "absolute", top: "3rem", left: "clamp(2rem, 6vw, 8rem)", zIndex: 3 }}>
          <span className="section-label">{project.number}</span>
        </div>
        <div style={{ position: "absolute", top: "3rem", right: "clamp(2rem, 6vw, 8rem)", textAlign: "right", zIndex: 3 }}>
          <p className="section-label">{project.year}</p>
          <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", letterSpacing: "0.12em", color: "#F0EBE0", opacity: 0.3, marginTop: "0.25rem" }}>{project.role}</p>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3, padding: "4rem clamp(2rem, 6vw, 8rem)" }}>
          <div style={{ overflow: "hidden" }}>
            <h1 style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(16vw, 22vw, 26vw)", lineHeight: 0.85, color: "#F0EBE0", marginLeft: "-0.03em" }}>
              {project.title}
            </h1>
          </div>
          <div style={{ height: "1px", background: project.accentColor, opacity: 0.35, margin: "1.25rem 0 0.75rem" }} />
          <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "clamp(0.9rem, 2vw, 1.4rem)", color: project.textAccent, fontWeight: 700 }}>
            {project.subtitle}
          </p>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div ref={contentRef}>
        <div data-reveal style={{ padding: "clamp(5rem, 10vw, 12rem) clamp(2rem, 6vw, 8rem)", display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "clamp(3rem, 6vw, 8rem)", borderBottom: "1px solid #1A1A1A" }} className="project-story-grid">
          <div>
            <p className="section-label" style={{ marginBottom: "2.5rem" }}>THE STORY</p>
            {project.story.map((para, i) => (
              <p key={i} style={{ fontFamily: "var(--font-spacemono)", fontSize: "clamp(0.875rem, 1.2vw, 1.1rem)", lineHeight: 1.9, color: "#F0EBE0", opacity: 0.65, marginBottom: i < project.story.length - 1 ? "1.5rem" : 0 }}>
                {para}
              </p>
            ))}
          </div>
          <div style={{ paddingTop: "2.5rem" }}>
            <div style={{ borderTop: "1px solid #1A1A1A", paddingTop: "2rem", marginBottom: "2.5rem" }}>
              <p className="section-label" style={{ marginBottom: "1.25rem" }}>THE STACK</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {project.stack.map((tech) => (
                  <div key={tech} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 5, height: 5, background: project.accentColor, borderRadius: "50%", flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.8rem", color: "#F0EBE0", opacity: 0.55 }}>{tech}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: "1px solid #1A1A1A", paddingTop: "2rem", marginBottom: "2rem" }}>
              <p className="section-label" style={{ marginBottom: "0.75rem" }}>ROLE</p>
              <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.8rem", color: "#F0EBE0", opacity: 0.45 }}>{project.role}</p>
            </div>
            <div style={{ borderTop: "1px solid #1A1A1A", paddingTop: "2rem" }}>
              <p className="section-label" style={{ marginBottom: "0.75rem" }}>YEAR</p>
              <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.8rem", color: "#F0EBE0", opacity: 0.45 }}>{project.year}</p>
            </div>
          </div>
        </div>

        {/* ── Visuals ────────────────────────────────────────────── */}
        <div data-reveal style={{ padding: "clamp(4rem, 8vw, 10rem) 0", borderBottom: "1px solid #1A1A1A" }}>
          <p className="section-label" style={{ marginBottom: "2rem", paddingLeft: "clamp(2rem, 6vw, 8rem)" }}>VISUALS</p>
          {hasImages ? (
            <>
              <div style={{ padding: "0 clamp(2rem, 6vw, 8rem)" }}>
                <div style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16/9",
                  overflow: "hidden",
                  border: `1px solid ${project.accentColor}22`,
                  background: "#080808",
                }}>
                  <Image
                    src={project.bgImage!}
                    alt={`${project.title} screenshot`}
                    fill
                    sizes="90vw"
                    style={{ objectFit: project.gifPortrait ? "contain" : "cover" }}
                  />
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(180deg, transparent 80%, #06060640 100%)`,
                    pointerEvents: "none",
                  }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginTop: 0 }}>
                <div style={{
                  aspectRatio: "1",
                  position: "relative",
                  overflow: "hidden",
                  background: "#080808",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "clamp(1.5rem, 3vw, 3rem)",
                }}>
                  <div style={{
                    position: "relative",
                    ...(project.gifPortrait
                      ? { height: "85%", aspectRatio: "9/19.5" }
                      : { width: "100%", aspectRatio: "16/9" }),
                    overflow: "hidden",
                    border: `1px solid ${project.accentColor}18`,
                    borderRadius: project.gifPortrait ? "12px" : 0,
                  }}>
                    <Image
                      src={project.bgGif!}
                      alt={`${project.title} demo`}
                      fill
                      sizes={project.gifPortrait ? "25vw" : "50vw"}
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  </div>
                  <div style={{ position: "absolute", bottom: "1.5rem", left: "clamp(1.5rem, 3vw, 3rem)", zIndex: 2 }}>
                    <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", color: project.accentColor, letterSpacing: "0.2em", opacity: 0.7 }}>IN MOTION</p>
                  </div>
                </div>

                <div style={{
                  aspectRatio: "1",
                  position: "relative",
                  overflow: "hidden",
                  background: "#0A0A0A",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "clamp(2rem, 4vw, 4rem)",
                }}>
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `linear-gradient(${project.accentColor}08 1px, transparent 1px), linear-gradient(90deg, ${project.accentColor}08 1px, transparent 1px)`,
                    backgroundSize: "32px 32px",
                  }} />
                  <div style={{ position: "relative" }}>
                    <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", color: project.accentColor, letterSpacing: "0.2em", opacity: 0.6, marginBottom: "2rem" }}>BUILT WITH</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {project.stack.map((tech, i) => (
                        <div key={tech} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div style={{ width: 6, height: 6, background: project.accentColor, borderRadius: "50%", opacity: 0.4 + i * 0.12 }} />
                          <span style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.8rem", color: "#F0EBE0", letterSpacing: "0.08em", opacity: 0.5 + i * 0.1 }}>{tech}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ position: "relative" }}>
                    <div style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(4rem, 8vw, 8rem)", color: project.accentColor, lineHeight: 0.85, opacity: 0.06 }}>{project.year}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <ZarcerogVisuals />
          )}
        </div>

        {/* ── Navigation ─────────────────────────────────────────── */}
        <div data-reveal style={{
          padding: "clamp(4rem, 8vw, 10rem) clamp(2rem, 6vw, 8rem)",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: "clamp(2rem, 4vw, 4rem)",
          alignItems: "end",
        }}>
          <div>
            {prev ? (
              <button onClick={() => onNavigate(prev.slug)} style={navBtnStyle}>
                <p className="section-label" style={{ marginBottom: "0.75rem" }}>← PREVIOUS</p>
                <p style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(2.5rem, 5vw, 6rem)", color: "#F0EBE0", lineHeight: 0.88, opacity: 0.45, transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.45"; }}>
                  {prev.title}
                </p>
              </button>
            ) : <div />}
          </div>
          <div style={{ width: "1px", background: "#1A1A1A", alignSelf: "stretch" }} />
          <div style={{ textAlign: "right" }}>
            {next ? (
              <button onClick={() => onNavigate(next.slug)} style={{ ...navBtnStyle, textAlign: "right" }}>
                <p className="section-label" style={{ marginBottom: "0.75rem" }}>NEXT →</p>
                <p style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(2.5rem, 5vw, 6rem)", color: "#F0EBE0", lineHeight: 0.88, opacity: 0.45, transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.45"; }}>
                  {next.title}
                </p>
              </button>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Overlay shell ─────────────────────────────────────────────────────

export default function ProjectOverlay({
  activeSlug,
  onClose,
  onNavigate,
}: {
  activeSlug: string | null;
  onClose: () => void;
  onNavigate: (slug: string) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isInDom, setIsInDom] = useState(false);
  const [displayedSlug, setDisplayedSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (!activeSlug || isClosingRef.current) return;
    setIsLoading(true);
    setDisplayedSlug(activeSlug);
    setIsInDom(true);
  }, [activeSlug]);

  useEffect(() => {
    if (!isInDom || !overlayRef.current) return;
    document.documentElement.classList.add("locked");
    gsap.fromTo(
      overlayRef.current,
      { yPercent: 100 },
      { yPercent: 0, duration: 0.65, ease: "power3.inOut" }
    );
  }, [isInDom]);

  useEffect(() => {
    if (overlayRef.current && displayedSlug) {
      overlayRef.current.scrollTop = 0;
    }
  }, [displayedSlug]);

  function doClose() {
    if (isClosingRef.current || !overlayRef.current) return;
    isClosingRef.current = true;
    gsap.killTweensOf(overlayRef.current);
    gsap.to(overlayRef.current, {
      yPercent: 100,
      duration: 0.55,
      ease: "power3.inOut",
      onComplete: () => {
        document.documentElement.classList.remove("locked");
        isClosingRef.current = false;
        setIsInDom(false);
        setDisplayedSlug(null);
        onClose();
      },
    });
  }

  const handleLoaded = useCallback(() => setIsLoading(false), []);

  if (!isInDom) return null;

  const project = displayedSlug ? getProject(displayedSlug) : null;

  return (
    <div
      ref={overlayRef}
      data-lenis-prevent
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 6000,
        background: "#060606",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#060606", padding: "1.25rem clamp(2rem, 6vw, 8rem)", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1A1A1A" }}>
        <span className="section-label">/ PROJECT VIEW</span>
        <button
          onClick={doClose}
          style={{ background: "none", border: "none", cursor: "none", fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#FF2D00", padding: 0 }}
        >
          ✕ CLOSE
        </button>
      </div>

      {project && (
        <>
          {isLoading && (
            <ProjectLoader
              key={`loader-${displayedSlug}`}
              project={project}
              onReady={handleLoaded}
            />
          )}
          <ProjectContent
            key={displayedSlug!}
            project={project}
            onNavigate={(slug) => { setIsLoading(true); setDisplayedSlug(slug); onNavigate(slug); }}
            onClose={doClose}
            animateIn={!isLoading}
          />
        </>
      )}
    </div>
  );
}
