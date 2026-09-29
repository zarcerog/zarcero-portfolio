"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

import { useStage } from "@/theatre/engine";
import { useLayout } from "@/stage3d/lib/layout";

import { CUE } from "../script";
import { Anchors } from "./Anchors";
import { Basilica } from "./Basilica";
import { Birds } from "./Birds";
import { City } from "./City";
import { Countryside } from "./Countryside";
import { Fireworks } from "./Fireworks";
import { Land } from "./Land";
import { Props } from "./Props";
import { Sky } from "./Sky";
import { Visions } from "./Visions";
import { put, sampleCamera, updateWorld, W } from "./world";

/** The world clock: beat, year, light. Runs before everything else each frame. */
function Clock() {
  const stage = useStage();
  useFrame((_, dt) => updateWorld(stage.t, dt), -2);
  return null;
}

const inside = (t: number, r: readonly [number, number]) => t >= r[0] && t <= r[1];

/**
 * Render on demand: every frame while scrolling or while something is alive
 * (gulls, fire, the tram, fireworks); ~30 fps otherwise; nothing when hidden.
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
      const t = stage.t;
      const moving = Math.abs(t - last) > 0.0002;
      last = t;
      const live = inside(t, CUE.gulls) || inside(t, CUE.fire) || inside(t, CUE.tram) || inside(t, CUE.fireworks) || inside(t, [20.5, 24.5]);
      if (moving || live || frame % 2 === 0) invalidate();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, stage]);
  return null;
}

const _breath = new THREE.Vector3();

function CameraRig() {
  const size = useThree((s) => s.size);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  const mouse = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  // ?cam=x,y,z,lx,ly,lz,fov pins the camera (for reviewing the art)
  const [pin] = useState(() => {
    if (process.env.NODE_ENV === "production") return null;
    const q = new URLSearchParams(window.location.search).get("cam");
    return q ? q.split(",").map(Number) : null;
  });
  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    let fov = sampleCamera(W.t, pos, look);
    if (pin) {
      pos.set(pin[0], pin[1], pin[2]);
      look.set(pin[3], pin[4], pin[5]);
      fov = pin[6] ?? 40;
    }
    // narrow screens: keep the width of the shot by widening the lens
    const aspect = size.width / size.height;
    const k = Math.min(2.3, Math.max(1, Math.pow(1.6 / aspect, 0.78)));
    if (k > 1) fov = (2 * Math.atan(Math.tan((fov * Math.PI) / 360) * k) * 180) / Math.PI;
    fov = Math.min(fov, 100);
    // a hand on the camera: a little parallax, a little breathing
    const m = mouse.current;
    m.sx += (m.x - m.sx) * 0.04;
    m.sy += (m.y - m.sy) * 0.04;
    const dist = pos.distanceTo(look);
    const amt = Math.min(0.6, dist * 0.012);
    right.subVectors(look, pos).cross(cam.up).normalize();
    up.copy(cam.up);
    pos.addScaledVector(right, m.sx * amt).addScaledVector(up, -m.sy * amt * 0.6);
    look.add(_breath.set(Math.sin(W.time * 0.21) * 0.04, Math.sin(W.time * 0.17) * 0.03, 0));
    cam.position.copy(pos);
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    cam.lookAt(look);
    state.gl.toneMappingExposure = W.light.exposure;
  }, -1);
  return null;
}

function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const flash = useRef<THREE.PointLight>(null);
  const scene = useThree((s) => s.scene);
  const fog = useMemo(() => new THREE.FogExp2("#e9dccb", 0.0024), []);
  useEffect(() => {
    put(scene, "fog", fog);
    return () => put(scene, "fog", null);
  }, [scene, fog]);
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const L = W.light;
    if (sun.current) {
      sun.current.position.copy(L.sunDir).multiplyScalar(90);
      sun.current.color.copy(L.sun);
      sun.current.intensity = L.sunI;
    }
    if (hemi.current) {
      hemi.current.color.copy(L.sky);
      hemi.current.groundColor.copy(L.ground);
      hemi.current.intensity = L.hemiI;
    }
    if (flash.current) {
      flash.current.color.copy(W.flashColor);
      flash.current.intensity = W.flash * 260;
    }
    fog.color.copy(L.fog);
    put(fog, "density", L.fogD);
  });
  const high = useLayout().tier === "high";
  return (
    <>
      <primitive object={target} position={[0, 0, 0]} />
      <directionalLight
        ref={sun}
        target={target}
        castShadow={high}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
      />
      <hemisphereLight ref={hemi} />
      <pointLight ref={flash} position={[0, 20, 6]} intensity={0} distance={90} decay={1.2} />
    </>
  );
}

/** Compile every material (hidden ones included) so a scroll never stalls on a shader. */
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

/** The rest of the world is built after the first shot is up, one piece per idle moment. */
function Later({ start, acts }: { start: boolean; acts: ReactNode[] }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start || n >= acts.length) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setN((k) => k + 1), { timeout: 400 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setN((k) => k + 1), 60);
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
  const [acts] = useState(() => {
    const all = [<Basilica key="b0" group={0} />, <Basilica key="b1" group={1} />, <Basilica key="b2" group={2} />, <City key="c" />, <Visions key="v" />, <Props key="p" />, <Fireworks key="f" />];
    // ?acts=0,1,2 builds only those (in development, for testing)
    const only = process.env.NODE_ENV === "production" ? null : new URLSearchParams(window.location.search).get("acts");
    return only ? all.filter((_, i) => only.split(",").includes(String(i))) : all;
  });
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
      shadows={tier === "high" ? "soft" : false}
      dpr={tier === "high" ? [1, 1.5] : [1, 1.25]}
      gl={{ antialias: true, powerPreference: "high-performance", stencil: false, alpha: false, localClippingEnabled: true } as THREE.WebGLRendererParameters}
      camera={{ position: [0, 4, 58], fov: 52, near: 0.1, far: 2500 }}
      onCreated={(state) => {
        state.gl.localClippingEnabled = true;
        state.gl.toneMapping = THREE.ACESFilmicToneMapping;
        state.gl.toneMappingExposure = 1.0;
        if (process.env.NODE_ENV !== "production") (window as unknown as { __film: unknown }).__film = state;
      }}
    >
      <Clock />
      <Driver />
      <CameraRig />
      <Anchors />
      <Lights />
      <Sky />
      <Suspense fallback={null}>
        <Land />
        <Countryside />
        <Birds />
        <Ready onReady={first} />
      </Suspense>
      <Later start={opened} acts={acts} />
    </Canvas>
  );
}
