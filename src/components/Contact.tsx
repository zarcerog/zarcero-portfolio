"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";

const LINKS = [
  { label: "GitHub", href: "https://github.com/zarcerog" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/zarcerog/" },
  { label: "Twitter", href: "https://twitter.com/zarcerog" },
  { label: "Instagram", href: "https://instagram.com/zarcerog" },
];

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLAnchorElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const emailEl = emailRef.current;
    const label = labelRef.current;
    const links = linksRef.current;
    const footer = footerRef.current;

    if (!section || !emailEl || !label || !links || !footer) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set([label, emailEl, links, footer], { opacity: 1, y: 0 });
        return;
      }

      // Split the email address into chars for scatter animation
      const split = new SplitText(emailEl, { type: "chars" });

      // Set initial scattered state — moderate distances to stay within section
      gsap.set(split.chars, {
        y: gsap.utils.distribute({
          base: -50,
          amount: 100,
          from: "center",
          ease: "none",
        }),
        x: gsap.utils.distribute({
          base: -25,
          amount: 50,
          from: "random",
          ease: "none",
        }),
        rotation: gsap.utils.distribute({
          base: -15,
          amount: 30,
          from: "random",
          ease: "none",
        }),
        opacity: 0,
      });

      gsap.set([label, links, footer], { opacity: 0, yPercent: 15 });

      ScrollTrigger.create({
        trigger: section,
        start: "top 60%",
        onEnter() {
          const tl = gsap.timeline();

          // Label fades in first
          tl.to(label, {
            opacity: 1,
            yPercent: 0,
            duration: 0.4,
            ease: "power2.out",
          });

          // Email chars fly in from scattered positions
          tl.to(
            split.chars,
            {
              y: 0,
              x: 0,
              rotation: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power4.out",
              stagger: {
                amount: 0.5,
                from: "center",
              },
            },
            "-=0.1"
          );

          // Social links
          tl.to(
            links,
            { opacity: 1, yPercent: 0, duration: 0.5, ease: "power2.out" },
            "-=0.3"
          );

          // Footer
          tl.to(
            footer,
            { opacity: 1, yPercent: 0, duration: 0.4, ease: "power2.out" },
            "-=0.2"
          );
        },
      });

      // Per-character hover: each char floats independently on mouseenter
      split.chars.forEach((char) => {
        char.addEventListener("mouseenter", () => {
          gsap.to(char, {
            y: gsap.utils.random(-10, 10),
            x: gsap.utils.random(-4, 4),
            duration: 0.35,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
            overwrite: "auto",
          });
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="contact" id="contact">
      {/* Folio */}
      <div
        style={{
          position: "absolute",
          top: "3rem",
          left: "clamp(2rem, 6vw, 8rem)",
        }}
      >
        <span className="section-label">/ OPEN CHANNEL / p. 006</span>
      </div>

      <p ref={labelRef} className="contact-label">
        LET&apos;S MAKE SOMETHING THAT MEANS SOMETHING.
      </p>

      {/*
        Email at magazine-CTA scale.
        Characters scatter-in from random positions on scroll entry.
        Each character floats independently on hover.
      */}
      <a
        ref={emailRef}
        href="mailto:nzarcerogarcia@gmail.com"
        className="contact-email"
        aria-label="Send email to nzarcerogarcia@gmail.com"
      >
        nzarcerogarcia@gmail.com
      </a>

      {/* Small waveform hint — a single line that pulses */}
      <div
        style={{
          width: "100%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, #FF2D00 20%, #FF2D00 80%, transparent 100%)",
          opacity: 0.3,
          marginBottom: "3rem",
        }}
      />

      {/* Social links */}
      <div ref={linksRef} className="contact-links">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link"
          >
            {link.label} ↗
          </a>
        ))}
      </div>

      {/* Footer */}
      <div ref={footerRef} className="contact-footer">
        <p className="contact-footer-copy">
          © {new Date().getFullYear()} NICOLAS ZARCERO — ZARCEROG.COM
        </p>
        <p className="contact-footer-copy">
          BUILT RAW · SHIPPED WITH INTENT
        </p>
      </div>
    </section>
  );
}
