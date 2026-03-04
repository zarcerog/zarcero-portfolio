"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Reduce motion: skip entirely
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Touch devices: skip
    if (window.matchMedia("(hover: none)").matches) return;

    let mouseX = 0;
    let mouseY = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      gsap.set(dot, { x: mouseX, y: mouseY });
      gsap.to(ring, {
        x: mouseX,
        y: mouseY,
        duration: 0.15,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    // Hover state — ring expands on interactive elements
    const onEnter = () => {
      gsap.to(ring, {
        scale: 2.8,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(dot, { scale: 0, duration: 0.2, overwrite: "auto" });
    };

    const onLeave = () => {
      gsap.to(ring, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(dot, { scale: 1, duration: 0.2, overwrite: "auto" });
    };

    const interactives = document.querySelectorAll(
      "a, button, [data-cursor='hover'], .work-card"
    );

    window.addEventListener("mousemove", onMove);
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    // Hide on mouse leave window
    const onLeaveWin = () => gsap.to([dot, ring], { opacity: 0 });
    const onEnterWin = () => gsap.to([dot, ring], { opacity: 1 });
    document.addEventListener("mouseleave", onLeaveWin);
    document.addEventListener("mouseenter", onEnterWin);

    return () => {
      window.removeEventListener("mousemove", onMove);
      interactives.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
      document.removeEventListener("mouseleave", onLeaveWin);
      document.removeEventListener("mouseenter", onEnterWin);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
