"use client";

import { useEffect, useRef } from "react";
import { notFound } from "next/navigation";
import { gsap, SplitText, ScrollTrigger } from "@/lib/gsap";
import { getProject, getAdjacentProjects, PROJECTS } from "@/lib/projects";
import { usePageTransition } from "@/context/TransitionContext";

// ─── Abstract visual panels ───────────────────────────────────────────

function StudioMemoirVisuals() {
  return (
    <>
      <div style={{ width: "100%", aspectRatio: "16/9", position: "relative", overflow: "hidden", background: "#0A0A14" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />
        {/* Editorial grid lines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {/* Stacked journal pages */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: "clamp(160px, 20vw, 240px)", height: "clamp(200px, 25vw, 300px)", border: "1px solid rgba(139,92,246,0.2)", background: `rgba(139,92,246,${0.02 + i * 0.02})`, position: "absolute", top: `${i * -8}px`, left: `${i * 8}px`, transform: `rotate(${-3 + i * 3}deg) translate(-50%, -50%)` }} />
          ))}
        </div>
        <div style={{ position: "absolute", bottom: "2rem", left: "2rem" }}>
          <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", color: "#A78BFA", letterSpacing: "0.2em", opacity: 0.6 }}>MUSIC · ARCHITECTURE · DESIGN</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ aspectRatio: "1", position: "relative", overflow: "hidden", background: "#08081A" }}>
          {/* Sound wave bars */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", padding: "2rem" }}>
            {Array.from({ length: 24 }).map((_, i) => {
              const h = 20 + Math.sin(i * 0.6) * 40 + Math.cos(i * 0.3) * 20;
              return <div key={i} style={{ width: "3px", height: `${h}%`, background: `rgba(139,92,246,${0.15 + (h / 100) * 0.3})`, borderRadius: "2px" }} />;
            })}
          </div>
          <div style={{ position: "absolute", bottom: "1.5rem", left: "2rem" }}>
            <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", color: "#A78BFA", letterSpacing: "0.2em", opacity: 0.5 }}>FREQUENCY</p>
          </div>
        </div>

        <div style={{ aspectRatio: "1", position: "relative", overflow: "hidden", background: "#0C0A18" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem" }}>
            <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.6rem", color: "#A78BFA", letterSpacing: "0.2em", opacity: 0.5, marginBottom: "1rem" }}>LATEST ENTRY</p>
            <p style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(1.5rem, 3vw, 3rem)", color: "#A78BFA", lineHeight: 0.9, opacity: 0.7 }}>THE CULTURE UNDERNEATH THE CRAFT.</p>
          </div>
        </div>
      </div>
    </>
  );
}

function DentosVisuals() {
  return (
    <>
      <div style={{ width: "100%", aspectRatio: "16/9", position: "relative", overflow: "hidden", background: "#061410" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,200,151,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,151,0.08) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, transparent 0%, rgba(0,200,151,0.06) 100%)" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "8px", opacity: 0.35 }}>
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} style={{ width: 28, height: 28, border: "1px solid #00C897", borderRadius: 4 }} />
          ))}
        </div>
        <div style={{ position: "absolute", bottom: "2rem", left: "2rem" }}>
          <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", color: "#00C897", letterSpacing: "0.2em", opacity: 0.6 }}>DIGITAL ODONTOGRAM</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ aspectRatio: "1", position: "relative", overflow: "hidden", background: "#041010" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,200,151,0.05) 1px, transparent 1px)", backgroundSize: "100% 48px" }} />
          <div style={{ position: "absolute", top: "2rem", left: "2rem", right: "2rem" }}>
            {["09:00", "10:00", "11:00", "13:00", "14:30"].map((t, i) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", opacity: 0.5 + i * 0.1 }}>
                <span style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.6rem", color: "#00C897", minWidth: "3rem" }}>{t}</span>
                <div style={{ height: "24px", background: "rgba(0,200,151,0.2)", border: "1px solid rgba(0,200,151,0.4)", flex: 1 }} />
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", bottom: "1.5rem", left: "2rem" }}>
            <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", color: "#00C897", letterSpacing: "0.2em", opacity: 0.5 }}>SCHEDULING</p>
          </div>
        </div>

        <div style={{ aspectRatio: "1", position: "relative", overflow: "hidden", background: "#060E0B" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(3rem, 6vw, 6rem)", color: "#00C897", opacity: 0.15, lineHeight: 1 }}>$48,290</div>
            <div style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", color: "#00C897", letterSpacing: "0.2em", opacity: 0.4, marginTop: "0.5rem" }}>MONTHLY REVENUE</div>
          </div>
          <div style={{ position: "absolute", bottom: "1.5rem", left: "2rem" }}>
            <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", color: "#00C897", letterSpacing: "0.2em", opacity: 0.5 }}>BILLING OVERVIEW</p>
          </div>
        </div>
      </div>
    </>
  );
}

function MementoVisuals() {
  return (
    <>
      <div style={{ width: "100%", aspectRatio: "16/9", position: "relative", overflow: "hidden", background: "#120A04" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(255,140,66,0.12) 0%, transparent 65%)" }} />
        {[80, 140, 200, 260, 320].map((r, i) => (
          <div key={r} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: r, height: r, border: "1px solid rgba(255,140,66,0.15)", borderRadius: "50%", opacity: 1 - i * 0.12 }} />
        ))}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,140,66,0.3)", border: "1px solid #FF8C42" }} />
        <div style={{ position: "absolute", bottom: "2rem", left: "2rem" }}>
          <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", color: "#FF8C42", letterSpacing: "0.2em", opacity: 0.6 }}>ONE MISSION. 24 HOURS.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ aspectRatio: "1", position: "relative", overflow: "hidden", background: "#0E0804" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "1.5rem", gap: "6px" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(255,140,66,0.3)" }} />
                <div style={{ flex: 1, height: "clamp(28px, 5vw, 44px)", background: `rgba(255,140,66,${0.04 + i * 0.03})`, border: "1px solid rgba(255,140,66,0.1)" }} />
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(255,140,66,0.3)" }} />
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", bottom: "1.5rem", left: "2rem" }}>
            <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", color: "#FF8C42", letterSpacing: "0.2em", opacity: 0.5 }}>MISSION FEED</p>
          </div>
        </div>

        <div style={{ aspectRatio: "1", position: "relative", overflow: "hidden", background: "#180E06" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem" }}>
            <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.6rem", color: "#FF8C42", letterSpacing: "0.2em", opacity: 0.5, marginBottom: "1rem" }}>TODAY&apos;S MISSION</p>
            <p style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(1.5rem, 3vw, 3rem)", color: "#FF8C42", lineHeight: 0.9, opacity: 0.7 }}>FIND SOMETHING THAT DOESN&apos;T BELONG.</p>
          </div>
        </div>
      </div>
    </>
  );
}

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
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "1.5rem", overflow: "hidden" }}>
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

const VISUALS: Record<string, React.FC> = {
  "studio-memoir": StudioMemoirVisuals,
  dentos: DentosVisuals,
  memento: MementoVisuals,
  zarcerog: ZarcerogVisuals,
};

// ─── Main client component ────────────────────────────────────────────
export default function ProjectPageClient({ slug }: { slug: string }) {
  const project = getProject(slug);
  if (!project) notFound();

  const { navigateTo } = usePageTransition();
  const { prev, next } = getAdjacentProjects(slug);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const VisualsComponent = VISUALS[slug] ?? null;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      // Hero title entry
      if (titleRef.current) {
        const split = new SplitText(titleRef.current, { type: "chars" });
        gsap.set(split.chars, { yPercent: 110, opacity: 0 });
        gsap.to(split.chars, {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power4.out",
          stagger: { amount: 0.3 },
          delay: 0.1,
        });
      }

      // Content section reveals
      if (contentRef.current) {
        const items = contentRef.current.querySelectorAll<HTMLElement>("[data-reveal]");
        items.forEach((item) => {
          gsap.set(item, { opacity: 0, yPercent: 15 });
          ScrollTrigger.create({
            trigger: item,
            start: "top 85%",
            onEnter: () => {
              gsap.to(item, { opacity: 1, yPercent: 0, duration: 0.65, ease: "power3.out" });
            },
          });
        });
      }
    });

    return () => ctx.revert();
  }, [slug]);

  const navBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "none",
    padding: 0,
    display: "block",
  };

  const navTitleStyle: React.CSSProperties = {
    fontFamily: "var(--font-bebas)",
    fontSize: "clamp(2.5rem, 5vw, 6rem)",
    color: "#F0EBE0",
    lineHeight: 0.88,
    opacity: 0.45,
    transition: "opacity 0.2s",
  };

  return (
    <div style={{ background: "#060606", minHeight: "100vh" }}>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          height: "100vh",
          background: project.bg,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "4rem clamp(2rem, 6vw, 8rem)",
        }}
      >
        {/* Top bar */}
        <div style={{ position: "absolute", top: "3rem", left: "clamp(2rem, 6vw, 8rem)", display: "flex", alignItems: "center", gap: "2.5rem" }}>
          <button
            onClick={() => navigateTo("/", "INDEX")}
            style={{ ...navBtnStyle, fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#F0EBE0", opacity: 0.45 }}
          >
            ← BACK TO INDEX
          </button>
          <span className="section-label">{project.number}</span>
        </div>

        <div style={{ position: "absolute", top: "3rem", right: "clamp(2rem, 6vw, 8rem)", textAlign: "right" }}>
          <p className="section-label">{project.year}</p>
          <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "0.625rem", letterSpacing: "0.12em", color: "#F0EBE0", opacity: 0.3, marginTop: "0.25rem" }}>{project.role}</p>
        </div>

        {/* Accent rule */}
        <div style={{ position: "absolute", bottom: "calc(clamp(5rem, 12vh, 13rem) - 1.5rem)", left: "clamp(2rem, 6vw, 8rem)", right: "clamp(2rem, 6vw, 8rem)", height: "1px", background: project.accentColor, opacity: 0.35 }} />

        {/* Title */}
        <div style={{ overflow: "hidden" }}>
          <h1
            ref={titleRef}
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(16vw, 22vw, 26vw)",
              lineHeight: 0.85,
              color: "#F0EBE0",
              marginLeft: "-0.03em",
            }}
          >
            {project.title}
          </h1>
        </div>

        <p style={{ fontFamily: "var(--font-spacemono)", fontSize: "clamp(0.9rem, 2vw, 1.4rem)", color: project.textAccent, marginTop: "0.75rem", fontWeight: 700 }}>
          {project.subtitle}
        </p>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div ref={contentRef}>

        {/* Story + Sidebar */}
        <div
          data-reveal
          style={{
            padding: "clamp(5rem, 10vw, 12rem) clamp(2rem, 6vw, 8rem)",
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
            gap: "clamp(3rem, 6vw, 8rem)",
            borderBottom: "1px solid #1A1A1A",
          }}
          className="project-story-grid"
        >
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

        {/* Visuals */}
        {VisualsComponent && (
          <div data-reveal style={{ padding: "clamp(4rem, 8vw, 10rem) 0", borderBottom: "1px solid #1A1A1A" }}>
            <p className="section-label" style={{ marginBottom: "2rem", paddingLeft: "clamp(2rem, 6vw, 8rem)" }}>VISUALS</p>
            <VisualsComponent />
          </div>
        )}

        {/* Prev / Next navigation */}
        <div data-reveal style={{ padding: "clamp(4rem, 8vw, 10rem) clamp(2rem, 6vw, 8rem)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div>
            {prev ? (
              <button onClick={() => navigateTo(`/project/${prev.slug}`, prev.title)} style={navBtnStyle}>
                <p className="section-label" style={{ marginBottom: "0.75rem" }}>← PREVIOUS</p>
                <p
                  style={navTitleStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.45"; }}
                >
                  {prev.title}
                </p>
              </button>
            ) : <div />}
          </div>

          <div style={{ textAlign: "right" }}>
            {next ? (
              <button onClick={() => navigateTo(`/project/${next.slug}`, next.title)} style={{ ...navBtnStyle, textAlign: "right" }}>
                <p className="section-label" style={{ marginBottom: "0.75rem" }}>NEXT →</p>
                <p
                  style={navTitleStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.45"; }}
                >
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
