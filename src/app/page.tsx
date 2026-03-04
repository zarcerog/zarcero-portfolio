"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

import { gsap, ScrollTrigger } from "@/lib/gsap";
import type { WaveformHandle } from "@/components/Waveform";

// Dynamic imports — all are client components with GSAP
const Preloader = dynamic(() => import("@/components/Preloader"), { ssr: false });
const Cursor = dynamic(() => import("@/components/Cursor"), { ssr: false });
const WaveformCanvas = dynamic(() => import("@/components/Waveform"), { ssr: false });
const Hero = dynamic(() => import("@/components/Hero"), { ssr: false });
const Manifesto = dynamic(() => import("@/components/Manifesto"), { ssr: false });
const Duality = dynamic(() => import("@/components/Duality"), { ssr: false });
const Work = dynamic(() => import("@/components/Work"), { ssr: false });
const RightNow = dynamic(() => import("@/components/RightNow"), { ssr: false });
const Contact = dynamic(() => import("@/components/Contact"), { ssr: false });
const ProjectOverlay = dynamic(() => import("@/components/ProjectOverlay"), { ssr: false });
const FlorLogo = dynamic(() => import("@/components/FlorLogo"), { ssr: false });

export default function Home() {
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const waveformRef = useRef<WaveformHandle>(null);
  const lenisRef = useRef<import("lenis").default | null>(null);

  // ── Initialize Lenis + GSAP ScrollTrigger ─────────────────────────
  useEffect(() => {
    if (!preloaderDone) return;

    let lenis: import("lenis").default;

    const initScroll = async () => {
      const Lenis = (await import("lenis")).default;

      lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
      });

      lenisRef.current = lenis;

      // Sync Lenis scroll events to GSAP ScrollTrigger
      lenis.on("scroll", () => ScrollTrigger.update());

      // Add Lenis RAF to GSAP's ticker for tight sync
      gsap.ticker.add((time: number) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);

      ScrollTrigger.refresh();
    };

    initScroll();

    return () => {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        gsap.ticker.remove(() => {});
      }
    };
  }, [preloaderDone]);

  // ── Waveform control callbacks (passed down to sections) ───────────
  const handleHeroWaveform = useCallback((amplitude: number) => {
    waveformRef.current?.setAmplitude(amplitude);
  }, []);

  const handleManifestoWaveform = useCallback((amplitude: number) => {
    waveformRef.current?.setAmplitude(amplitude);
    // Color shifts at peak — ivory → red as amplitude maxes
    if (amplitude > 0.8) {
      waveformRef.current?.setColor("#FF2D00");
    } else {
      waveformRef.current?.setColor("#FF2D00");
    }
  }, []);

  // ── Waveform visibility: fade in once preloader is done ────────────
  useEffect(() => {
    if (!preloaderDone) return;
    // Brief delay to let hero entry start first
    const timer = setTimeout(() => {
      waveformRef.current?.setOpacity(0.08);
    }, 300);
    return () => clearTimeout(timer);
  }, [preloaderDone]);

  // ── Pause / resume Lenis when project overlay opens / closes ───────
  useEffect(() => {
    if (activeSlug) {
      lenisRef.current?.stop();
    } else {
      lenisRef.current?.start();
    }
  }, [activeSlug]);

  return (
    <>
      {/* ── Flor de Barcelona logo preview (temporary) ────────────── */}
      {/* <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999 }}>
        <FlorLogo size={160} />
      </div> */}

      {/* ── Fixed layers ────────────────────────────────────────────── */}
      <Cursor />
      <WaveformCanvas ref={waveformRef} />

      {/* ── Project overlay (no URL change) ─────────────────────────── */}
      <ProjectOverlay
        activeSlug={activeSlug}
        onClose={() => setActiveSlug(null)}
        onNavigate={setActiveSlug}
      />

      {/* ── Preloader (sits above everything) ───────────────────────── */}
      <Preloader onComplete={() => setPreloaderDone(true)} />

      {/* ── Page content ────────────────────────────────────────────── */}
      <main style={{ position: "relative", zIndex: 2 }}>
        <Hero waveformAmplitude={handleHeroWaveform} />
        <Manifesto onWaveformUpdate={handleManifestoWaveform} />
        <Duality />
        <Work onProjectClick={setActiveSlug} />
        <RightNow />
        <Contact />
      </main>
    </>
  );
}
