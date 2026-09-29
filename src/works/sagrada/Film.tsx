"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { StageProvider, useTick } from "@/theatre/engine";
import { loadFonts, setFonts, type FontSet } from "@/stage3d/lib/fonts";

import { pickLang, setLang, useLang } from "./lang";
import { Overlay, Transcript } from "./Overlay";
import { BEATS, sepiaAt } from "./script";

const loadScene = () => import("./scene/Scene");
const Scene = dynamic(loadScene, { ssr: false });

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** The film leader, counting down while the projector is threaded. */
function Leader({ ready }: { ready: boolean }) {
  return (
    <div className="sf-leader" data-ready={ready} aria-hidden={ready}>
      <div className="sf-leader__ring">
        <span className="sf-leader__sweep" />
        <span className="sf-leader__cross" />
        <span className="sf-leader__num">
          <i>3</i>
          <i>2</i>
          <i>1</i>
        </span>
      </div>
      <p className="sf-leader__house">The Zarcero Picture Company</p>
      <p className="sf-leader__line">{ready ? "Rolling." : "Threading the projector"}</p>
    </div>
  );
}

/** The grade: sepia for the old reels, clean for the new ones. */
function Grade({ canvas }: { canvas: React.RefObject<HTMLDivElement | null> }) {
  const last = useRef(-1);
  useTick(-1, BEATS + 5, (t) => {
    const s = Math.round(sepiaAt(t) * 100) / 100;
    if (s === last.current || !canvas.current) return;
    last.current = s;
    canvas.current.style.setProperty("filter", s > 0 ? `sepia(${s}) saturate(${(1 - s * 0.25).toFixed(3)}) contrast(1.04)` : "none");
  });
  return null;
}

const NONE: string[] = [];

/**
 * Fetch the title-card faces once the picture is rolling, while the audience
 * is still in the prologue, so every card is set in its own face by the time
 * it comes up. Idle time only; nothing waits on it.
 */
function useWarmFonts(ready: boolean, faces: string[]) {
  useEffect(() => {
    if (!ready || typeof document === "undefined" || !document.fonts) return;
    let gone = false;
    const idle = (fn: () => void) =>
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 400);
    const next = (i: number) => {
      if (gone || i >= faces.length) return;
      document.fonts
        .load(faces[i], "AaZz")
        .catch(() => undefined)
        .then(() => idle(() => next(i + 1)));
    };
    idle(() => next(0));
    return () => {
      gone = true;
    };
  }, [ready, faces]);
}

export default function Film({ fontClass, fonts, warm = NONE }: { fontClass: string; fonts: FontSet; warm?: string[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "3d" | "text">("pending");
  const [fontsReady, setFontsReady] = useState(false);
  const [ready, setReady] = useState(false);
  const lang = useLang();

  // the print is picked on the client, after the English one has hydrated
  useEffect(() => setLang(pickLang(), false), []);

  useEffect(() => {
    const next = webglAvailable() ? "3d" : "text";
    if (next === "3d") void loadScene();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capability check needs the browser
    setMode(next);
    setFonts(fonts);
    loadFonts().then(() => setFontsReady(true));
  }, [fonts]);

  const onReady = useCallback(() => setReady(true), []);
  useWarmFonts(ready, warm);

  if (mode === "text") {
    return (
      <div className={`sf-root sf-root--text ${fontClass}`} lang={lang}>
        <Transcript />
      </div>
    );
  }

  return (
    <div className={`sf-root ${fontClass}`} ref={rootRef} data-ready={ready} lang={lang}>
      <StageProvider rootRef={rootRef} beats={BEATS}>
        <div className="sf-track" aria-hidden="true" />
        <div className="sf-canvas" ref={canvasRef} aria-hidden="true">
          {mode === "3d" && fontsReady && <Scene onReady={onReady} />}
        </div>
        <div className="sf-grain" aria-hidden="true" />
        <Grade canvas={canvasRef} />
        <Overlay />
        <Leader ready={ready} />
      </StageProvider>
    </div>
  );
}
