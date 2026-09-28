"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

import { useStage } from "@/theatre/engine";

import { useLayout } from "./lib/layout";
import { BackWall, Cyc } from "./sets/Backstage";
import { Coast } from "./sets/Coast";
import { Cast } from "./sets/Cast";
import { DressingRoom } from "./sets/DressingRoom";
import { Drops } from "./sets/Drops";
import { Rooms } from "./sets/Rooms";
import { StageDoor } from "./sets/StageDoor";
import { Auditorium } from "./world/Auditorium";
import { CameraRig } from "./world/Camera";
import { Cards } from "./world/Cards";
import { Lights } from "./world/Lights";
import { Proscenium } from "./world/Proscenium";

/**
 * Render on demand. While the visitor scrolls we draw every frame; when the
 * page is still we drop to ~30 fps for the idle life (waves, dust, breathing);
 * when the tab is hidden we draw nothing at all.
 */
function Driver() {
  const invalidate = useThree((s) => s.invalidate);
  const stage = useStage();
  useEffect(() => {
    let raf = 0;
    let last = -1;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      frame++;
      const moving = Math.abs(stage.t - last) > 0.0002;
      last = stage.t;
      if (moving || frame % 2 === 0) invalidate();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, stage]);
  return null;
}

/** Compile every material under `root` — hidden scenery included — so a scroll never stalls on a shader. */
function precompile(gl: THREE.WebGLRenderer, root: THREE.Object3D, camera: THREE.Camera, scene: THREE.Scene) {
  const hidden: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (!o.visible) {
      hidden.push(o);
      o.visible = true;
    }
  });
  try {
    gl.compile(root, camera, scene);
  } catch {
    /* not fatal */
  }
  hidden.forEach((o) => (o.visible = false));
}

/** Signals once everything inside the Suspense boundary has loaded and drawn. */
function Ready({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    precompile(gl, scene, camera, scene);
    let n = 0;
    let raf = 0;
    const tick = () => {
      if (++n > 3) onReady();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gl, scene, camera, onReady]);
  return null;
}

/** One later act: mounted, then compiled, while the audience watches the first. */
function Built({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (ref.current) precompile(gl, ref.current, camera, scene);
    invalidate();
  }, [gl, scene, camera, invalidate]);
  return <group ref={ref}>{children}</group>;
}

/**
 * The house opens with only the first act built. The rest of the scenery is
 * built afterwards, one act at a time in running order, whenever the browser
 * is idle — so the curtain rises sooner and no single frame does it all.
 */
function Later({ start, acts }: { start: boolean; acts: ReactNode[] }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start || n >= acts.length) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setN((k) => k + 1), { timeout: 500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setN((k) => k + 1), 80);
    return () => window.clearTimeout(id);
  }, [start, n, acts.length]);
  return (
    <>
      {acts.slice(0, n).map((a, i) => (
        <Suspense key={i} fallback={null}>
          <Built>{a}</Built>
        </Suspense>
      ))}
    </>
  );
}

export default function Scene({ onReady }: { onReady: () => void }) {
  const { tier } = useLayout();
  const [opened, setOpened] = useState(false);
  const ready = useRef(onReady);
  useEffect(() => {
    ready.current = onReady;
  });
  const [first] = useState(() => () => {
    setOpened(true);
    ready.current();
  });
  return (
    <Canvas
      frameloop="demand"
      dpr={tier === "high" ? [1, 1.5] : [1, 1.25]}
      gl={{ antialias: true, powerPreference: "high-performance", stencil: false, alpha: false }}
      camera={{ position: [0, 2.3, 20], fov: 38, near: 0.1, far: 90 }}
      onCreated={(state) => {
        state.gl.toneMapping = THREE.ACESFilmicToneMapping;
        state.gl.toneMappingExposure = 1.05;
        if (process.env.NODE_ENV !== "production") (window as unknown as { __stage: unknown }).__stage = state;
      }}
    >
      <Driver />
      <color attach="background" args={["#060203"]} />
      <CameraRig />
      <Lights />
      <Auditorium />
      <Proscenium />
      <BackWall />
      <Cyc />
      <Suspense fallback={null}>
        <Coast />
        <Cast />
        <Cards />
        <Ready onReady={first} />
      </Suspense>
      <Later start={opened} acts={[<Rooms key="rooms" />, <Drops key="drops" />, <DressingRoom key="dressing" />, <StageDoor key="door" />]} />
    </Canvas>
  );
}
