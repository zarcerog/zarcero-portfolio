"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { createWaveform, WaveformController } from "@/lib/waveform";
import { gsap } from "@/lib/gsap";

export interface WaveformHandle {
  setAmplitude: (v: number) => void;
  setColor: (hex: string) => void;
  setOpacity: (v: number) => void;
}

const Waveform = forwardRef<WaveformHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<WaveformController | null>(null);

  useImperativeHandle(ref, () => ({
    setAmplitude(v: number) {
      if (controllerRef.current) {
        gsap.to(controllerRef.current.state, {
          amplitude: Math.max(0, Math.min(1, v)),
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    },
    setColor(hex: string) {
      if (controllerRef.current) {
        controllerRef.current.state.color = hex;
      }
    },
    setOpacity(v: number) {
      if (controllerRef.current) {
        gsap.to(controllerRef.current.state, {
          opacity: Math.max(0, Math.min(1, v)),
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reduced motion: don't render waveform
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Mobile: skip waveform for perf
    if (window.innerWidth < 768) return;

    const controller = createWaveform(canvas);
    controllerRef.current = controller;

    // Start with invisible state — page.tsx controls opacity via ref
    controller.state.amplitude = 0.15;
    controller.state.opacity = 0;
    controller.start();

    // Pause when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controller.start();
        } else {
          controller.stop();
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    return () => {
      controller.destroy();
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="waveform-canvas"
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
});

Waveform.displayName = "Waveform";
export default Waveform;
