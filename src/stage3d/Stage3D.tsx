"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { INTRO } from "@/theatre/content";
import { StageProvider } from "@/theatre/engine";
import { Chrome } from "@/theatre/parts/Chrome";

import { ACTS3D, BEATS } from "./cues";
import { loadFonts, setFonts, type FontSet } from "./lib/fonts";
import { Overlays } from "./overlay/Overlays";

const loadScene = () => import("./Scene");
// the sound plot is fetched only when somebody turns the sound on
const loadSound = () => import("./soundProgram").then((m) => m.PROGRAM);
const Scene = dynamic(loadScene, { ssr: false });
// the flat production is only fetched when WebGL is missing (or with ?flat)
const Theatre = dynamic(() => import("@/theatre/Theatre"), { ssr: false });

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** The loading curtain: shown until the house is built. */
function Loader({ ready }: { ready: boolean }) {
  return (
    <div className="ov-loader" data-ready={ready} aria-hidden={ready}>
      <div className="ov-loader__curtain ov-loader__curtain--l" />
      <div className="ov-loader__curtain ov-loader__curtain--r" />
      <div className="ov-loader__card">
        <p className="ov-loader__house">The Zarcero Theatre</p>
        <p className="ov-loader__line">
          {ready ? INTRO.loaded : INTRO.loading}
          <span className="ov-loader__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </p>
        <p className="ov-loader__sound">
          <span aria-hidden="true">♪ </span>
          {INTRO.sound}
        </p>
      </div>
    </div>
  );
}

export default function Stage3D({ fontClass, fonts }: { fontClass: string; fonts: FontSet }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "3d" | "flat">("pending");
  const [fontsReady, setFontsReady] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const flat = new URLSearchParams(window.location.search).has("flat");
    const next = !flat && webglAvailable() ? "3d" : "flat";
    // start fetching the stage while the fonts load, rather than after
    if (next === "3d") void loadScene();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capability check needs the browser
    setMode(next);
    setFonts(fonts);
    loadFonts().then(() => setFontsReady(true));
  }, [fonts]);

  const onReady = useCallback(() => setReady(true), []);

  if (mode === "flat") return <Theatre fontClass={fontClass} />;

  return (
    <div className={`th-root st-root ${fontClass}`} ref={rootRef} data-ready={ready}>
      <StageProvider rootRef={rootRef} beats={BEATS}>
        <div className="th-track" aria-hidden="true" />
        <div className="st-canvas" aria-hidden="true">
          {mode === "3d" && fontsReady && <Scene onReady={onReady} />}
        </div>
        {/* film grain and vignette, done in CSS instead of a post-processing pass */}
        <div className="st-film" aria-hidden="true" />
        <Overlays />
        <Chrome acts={ACTS3D} sound={loadSound} />
        <Loader ready={ready} />
      </StageProvider>
    </div>
  );
}
