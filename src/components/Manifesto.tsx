"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";

interface ManifestoProps {
  onWaveformUpdate?: (amplitude: number) => void;
}

export default function Manifesto({ onWaveformUpdate }: ManifestoProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const line3Ref = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const line3 = line3Ref.current;
    const tag = tagRef.current;

    if (!section || !line1 || !line2 || !line3 || !tag) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set([line1, line2, line3], { color: "#F0EBE0", opacity: 1 });
        return;
      }

      // Split all three manifesto lines into words
      const split1 = new SplitText(line1, { type: "words" });
      const split2 = new SplitText(line2, { type: "words" });
      const split3 = new SplitText(line3, { type: "words" });

      const allWords = [...split1.words, ...split2.words, ...split3.words];

      // Set initial ghost state — dark, barely visible
      gsap.set(allWords, { color: "#1A1A1A", opacity: 0.15 });
      gsap.set(tag, { opacity: 0 });

      // Master timeline driven by scroll scrub
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=280%",     // very generous travel — words earn their reveal
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
          onUpdate(self) {
            // Waveform amplitude peaks as we approach the final word
            onWaveformUpdate?.(self.progress * 1.0);
          },
          onLeave() {
            // Flatline when manifesto exits
            onWaveformUpdate?.(0);
          },
        },
      });

      // Reveal each word: ghost → full white
      // Use stagger across the full timeline 0 → 0.85
      tl.to(
        allWords,
        {
          color: "#F0EBE0",
          opacity: 1,
          ease: "none",
          stagger: {
            each: 0.85 / allWords.length,
            from: "start",
          },
          duration: 0.001, // near-instant per word, stagger drives timing
        },
        0
      );

      // Tag fades in at 90% progress
      tl.to(tag, { opacity: 1, duration: 0.1 }, 0.85);

      // At very end: all words get a subtle signal-red tint on "RAW"
      const lastWords = split3.words;
      tl.to(lastWords, { color: "#FF2D00", ease: "none" }, 0.88);
      // Then snap back to ivory (the "raw" word burns red then settles)
      tl.to(lastWords, { color: "#F0EBE0", ease: "none" }, 0.95);

      // Section exit scroll: after pin releases, section fades out naturally
    }, section);

    return () => ctx.revert();
  }, [onWaveformUpdate]);

  return (
    <section ref={sectionRef} className="manifesto" id="manifesto">
      <div ref={innerRef} className="manifesto-inner">
        {/* Magazine folio */}
        <div
          style={{
            position: "absolute",
            top: "3rem",
            left: "clamp(2rem, 6vw, 8rem)",
          }}
        >
          <span className="section-label">/ MANIFESTO / p. 002</span>
        </div>

        {/*
          Ray Gun compositional logic:
          Each line is laterally offset — they don't stack cleanly.
          This mirrors the Street Culture / Ray Gun type-as-architecture approach.
        */}
        <span ref={line1Ref} className="manifesto-line">
          MAKE IT FEEL.
        </span>
        <span ref={line2Ref} className="manifesto-line">
          MAKE IT MEAN SOMETHING.
        </span>
        <span ref={line3Ref} className="manifesto-line">
          KEEP IT RAW.
        </span>

        {/* Tag that appears at end — small editorial note */}
        <div
          ref={tagRef}
          style={{
            position: "absolute",
            bottom: "4rem",
            right: "clamp(2rem, 6vw, 8rem)",
            textAlign: "right",
          }}
        >
          <p
            className="text-mono"
            style={{ fontSize: "0.625rem", color: "#F0EBE0", opacity: 0.3, letterSpacing: "0.15em" }}
          >
            zarcerog / 2026
          </p>
        </div>
      </div>
    </section>
  );
}
