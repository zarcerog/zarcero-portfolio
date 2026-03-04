"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useState,
  RefObject,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";

interface TransitionContextValue {
  navigateTo: (href: string, displayLabel?: string) => void;
  panelRef: RefObject<HTMLDivElement | null>;
}

const TransitionContext = createContext<TransitionContextValue>({
  navigateTo: (_href: string, _label?: string) => {},
  panelRef: { current: null },
});

export function usePageTransition() {
  return useContext(TransitionContext);
}

export function TransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const [label, setLabel] = useState("");

  // Whenever the pathname changes (navigation resolved), slide the panel off the top
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    const panel = panelRef.current;
    if (!panel) return;

    // Panel is currently at y:0 (covering the screen).
    // Slide it off the top to reveal the new page.
    gsap.to(panel, {
      yPercent: -100,
      duration: 0.65,
      ease: "power3.inOut",
      delay: 0.05,
      onComplete: () => {
        isAnimating.current = false;
        // Reset below screen, ready for the next transition
        gsap.set(panel, { yPercent: 100 });
        setLabel("");
      },
    });
  }, [pathname]);

  const navigateTo = useCallback(
    (href: string, displayLabel = "") => {
      if (isAnimating.current) return;
      if (pathname === href) return;

      isAnimating.current = true;
      setLabel(displayLabel);

      const panel = panelRef.current;
      if (!panel) {
        router.push(href);
        return;
      }

      // Start from below the screen
      gsap.set(panel, { yPercent: 100 });

      // Slide up to cover the screen
      gsap.to(panel, {
        yPercent: 0,
        duration: 0.55,
        ease: "power3.inOut",
        onComplete: () => {
          router.push(href);
        },
      });
    },
    [router, pathname]
  );

  return (
    <TransitionContext.Provider value={{ navigateTo, panelRef }}>
      {/*
        Transition panel — full-screen signal-red curtain.
        Starts positioned below the viewport (translateY 100%).
        Slides up to cover the screen on navigation, then off the top.
      */}
      <div
        ref={panelRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "#FF2D00",
          zIndex: 9500,
          transform: "translateY(100%)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-start",
          padding: "3rem clamp(2rem, 6vw, 8rem)",
          pointerEvents: "none",
        }}
      >
        {label && (
          <span
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(3rem, 8vw, 10rem)",
              color: "#060606",
              lineHeight: 0.88,
              letterSpacing: "-0.01em",
            }}
          >
            {label}
          </span>
        )}
      </div>

      {children}
    </TransitionContext.Provider>
  );
}
