"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { rng } from "@/stage3d/lib/canvas";

import { BUILD, CUE } from "../script";
import { Sheet } from "./paint/kit";
import { DERRICK, derrick, POPEMOBILE, popemobile, TRAM, tram } from "./paint/vehicles";
import { dot, flameTexture, lattice, smokeTexture } from "./textures";
import { env, put, seg, W } from "./world";

// ---------------------------------------------------------------------------
// Cranes: timber derricks for Gaudí's men, tower cranes for everyone since.
// ---------------------------------------------------------------------------

/** A lattice girder: the texture tiles along its long axis. */
function latticeBox(w: number, h: number, d: number, rep = 0.6) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const upright = h >= Math.max(w, d);
  for (let i = 0; i < uv.count; i++) {
    if (upright) uv.setXY(i, uv.getX(i), (uv.getY(i) * h) / rep);
    else uv.setXY(i, (uv.getX(i) * Math.max(w, d)) / rep, uv.getY(i));
  }
  return g;
}

const steel = new THREE.MeshLambertMaterial({ map: lattice("steel"), alphaTest: 0.5, side: THREE.DoubleSide, color: "#e9c257" });
const concrete = new THREE.MeshLambertMaterial({ color: "#9a9894" });
const cab = new THREE.MeshLambertMaterial({ color: "#f1ede4" });
const cable = new THREE.LineBasicMaterial({ color: "#2a2a2a" });
const redLight = new THREE.SpriteMaterial({ map: dot("rgba(255,60,40,1)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });

interface CraneDef {
  x: number;
  z: number;
  h: number;
  jib: number;
  span: [number, number];
  phase: number;
}

const CRANES: CraneDef[] = [
  { x: -3.2, z: -0.3, h: 22, jib: 12, span: [1995, 2026.3], phase: 0.4 },
  { x: 5.6, z: 5.3, h: 15, jib: 9, span: [1984, 2022.6], phase: 2.1 },
  { x: -9.2, z: 3.6, h: 14, jib: 9, span: [1989, 2031], phase: 4.0 },
  { x: 4.8, z: -5.6, h: 18, jib: 10, span: [2007, 2031], phase: 1.2 },
];

function TowerCrane({ c }: { c: CraneDef }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tip = useRef<THREE.Sprite>(null);
  const mast = useMemo(() => latticeBox(0.5, c.h, 0.5).translate(0, c.h / 2, 0), [c.h]);
  const jib = useMemo(() => latticeBox(c.jib, 0.45, 0.45).translate(c.jib / 2, 0, 0), [c.jib]);
  const counter = useMemo(() => latticeBox(3.6, 0.4, 0.45).translate(-1.8, 0, 0), []);
  const hook = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1, 0)]), []);
  const hookLine = useMemo(() => new THREE.Line(hook, cable), [hook]);
  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const up = seg(W.year, c.span[0], c.span[0] + 0.6);
    const down = 1 - seg(W.year, c.span[1] - 0.3, c.span[1]);
    const v = up * down;
    g.visible = v > 0;
    g.scale.set(1, Math.max(0.001, v), 1);
    // slewing: follows the calendar, and stands still for the pandemic
    let y = W.year;
    if (y > BUILD.pandemic[0]) y = y < BUILD.pandemic[1] ? BUILD.pandemic[0] : y - (BUILD.pandemic[1] - BUILD.pandemic[0]);
    const idle = y > BUILD.pandemic[0] && W.year < BUILD.pandemic[1] ? 0 : Math.sin(W.time * 0.12 + c.phase) * 0.35;
    if (head.current) head.current.rotation.y = c.phase + y * 2.3 + idle;
    hookLine.position.set(c.jib * (0.45 + 0.3 * Math.sin(y * 3 + c.phase)), 0, 0);
    put(hookLine.scale, "y", 3 + 2 * Math.sin(y * 5 + c.phase));
    if (tip.current) {
      const blink = Math.sin(W.time * 3 + c.phase) > 0.2 ? 1 : 0.15;
      put(redLight, "opacity", W.light.night * blink);
      tip.current.visible = W.light.night > 0.05;
    }
  });
  return (
    <group ref={root} position={[c.x, 0, c.z]}>
      <mesh geometry={mast} material={steel} castShadow />
      <group ref={head} position={[0, c.h, 0]}>
        <mesh geometry={jib} material={steel} castShadow />
        <mesh geometry={counter} material={steel} />
        <mesh position={[-3.2, -0.4, 0]} material={concrete}>
          <boxGeometry args={[1.0, 0.7, 0.6]} />
        </mesh>
        <mesh position={[0.45, -0.35, 0.45]} material={cab}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
        </mesh>
        <mesh position={[0, 1.3, 0]} material={steel}>
          <coneGeometry args={[0.35, 2.6, 4]} />
        </mesh>
        <primitive object={hookLine} />
        <sprite ref={tip} position={[0, 2.7, 0]} scale={[0.9, 0.9, 1]} material={redLight} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Painted flats that move: the tram, the Popemobile; and the derricks.
// ---------------------------------------------------------------------------

function useFlat(size: { w: number; h: number }, paint: (s: Sheet) => void, ppu: number) {
  return useMemo(() => {
    const sheet = new Sheet(size.w, size.h, ppu);
    paint(sheet);
    const { map, glow } = sheet.textures(4);
    const geo = new THREE.PlaneGeometry(size.w, size.h);
    geo.translate(0, size.h / 2, 0);
    const mat = new THREE.MeshLambertMaterial({ map, emissiveMap: glow, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0, alphaTest: 0.5, side: THREE.DoubleSide });
    return { geo, mat };
  }, [size, paint, ppu]);
}

function Derrick({ x, z, s, phase }: { x: number; z: number; s: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const { geo, mat } = useFlat(DERRICK, derrick, 60);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const v = seg(W.year, BUILD.derricks[0], BUILD.derricks[0] + 1) * (1 - seg(W.year, BUILD.derricks[1] - 1, BUILD.derricks[1]));
    m.visible = v > 0;
    m.scale.set(phase > 1 ? -s : s, Math.max(0.001, v) * s, s);
  });
  return <mesh ref={ref} geometry={geo} material={mat} position={[x, 0, z]} castShadow />;
}

/** June 1926: a tram crosses the frame, right in front of the lens. */
function Tram() {
  const ref = useRef<THREE.Mesh>(null);
  const { geo, mat } = useFlat(TRAM, tram, 320);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const [a, b] = CUE.tram;
    const on = W.t > a && W.t < b;
    m.visible = on;
    if (!on) return;
    const p = seg(W.t, a + 0.35, a + 2.2);
    m.position.x = 14 - p * 28;
    put(mat, "emissiveIntensity", 0.9);
  });
  return <mesh ref={ref} geometry={geo} material={mat} position={[0, 0, 6.65]} />;
}

/** June 2026: the Popemobile along the street, escorts flashing blue. */
function Popemobile() {
  const ref = useRef<THREE.Group>(null);
  const { geo, mat } = useFlat(POPEMOBILE, popemobile, 260);
  const blue = useMemo(() => new THREE.SpriteMaterial({ map: dot("rgba(80,140,255,1)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const a = 50.6;
    const b = 53.6;
    const on = W.t > a && W.t < b;
    g.visible = on;
    if (!on) return;
    const p = seg(W.t, a, b - 0.3);
    g.position.set(-22 + p * 44, 0, 6.65);
    put(mat, "emissiveIntensity", 0.6 + W.light.night * 0.6);
    put(blue, "opacity", Math.sin(W.time * 12) > 0 ? 1 : 0.2);
  });
  return (
    <group ref={ref}>
      <mesh geometry={geo} material={mat} />
      {[-1.1, -0.8, 0.8, 1.1].map((x) => (
        <sprite key={x} position={[x, 0.18, 0.1]} scale={[0.4, 0.4, 1]} material={blue} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// June 1926: the street lamps coming on.
// ---------------------------------------------------------------------------

function Lamps() {
  const heads = useRef<(THREE.Sprite | null)[]>([]);
  const post = useMemo(() => new THREE.MeshLambertMaterial({ color: "#2a2826" }), []);
  const glow = useMemo(() => new THREE.SpriteMaterial({ map: dot("rgba(255,200,130,1)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  const xs = [-6.2, -3.1, 0, 3.1, 6.2];
  useFrame(() => {
    const on = W.year > 1912 ? W.light.night : 0;
    put(glow, "opacity", Math.min(1, on * 1.4));
    heads.current.forEach((h) => {
      if (h) h.visible = on > 0.02;
    });
  });
  return (
    <group>
      {xs.map((x, k) => (
        <group key={x} position={[x, 0, 8.05]}>
          <mesh position={[0, 0.24, 0]} material={post}>
            <cylinderGeometry args={[0.012, 0.02, 0.48, 5]} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.05, 0.06, 0.05]} />
            <meshBasicMaterial color="#ffe0a8" />
          </mesh>
          <sprite
            ref={(s) => {
              heads.current[k] = s;
            }}
            position={[0, 0.5, 0]}
            scale={[0.6, 0.6, 1]}
            material={glow}
          />
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// July 1936: the crypt and the workshop burning.
// ---------------------------------------------------------------------------

function Fire() {
  const ref = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const flames = useMemo(() => {
    const r = rng(36);
    return Array.from({ length: 22 }, (_, k) => ({
      x: k < 12 ? 4.6 + (r() - 0.5) * 1.8 : 1.5 + Math.cos(r() * Math.PI - Math.PI / 2) * 2.6,
      z: k < 12 ? 3.4 + (r() - 0.5) * 0.9 : (r() - 0.5) * 4,
      s: 0.6 + r() * 0.8,
      ph: r() * 10,
    }));
  }, []);
  const flameMat = useMemo(() => new THREE.SpriteMaterial({ map: flameTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  const smokeMat = useMemo(() => new THREE.SpriteMaterial({ map: smokeTexture(), color: "#1a1412", transparent: true, depthWrite: false }), []);
  const fl = useRef<(THREE.Sprite | null)[]>([]);
  const sm = useRef<(THREE.Sprite | null)[]>([]);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const [a, b] = CUE.fire;
    const v = env(W.t, a, a + 0.3, b - 0.5, b);
    g.visible = v > 0;
    const fl0 = 0.8 + 0.2 * Math.sin(W.time * 17) * Math.sin(W.time * 7.3);
    if (light.current) light.current.intensity = v * 120 * fl0;
    flames.forEach((f, k) => {
      const s = fl.current[k];
      if (!s) return;
      const q = 0.75 + 0.35 * Math.sin(W.time * (6 + (k % 5)) + f.ph);
      s.position.set(f.x, (f.s * q) / 2, f.z);
      s.scale.set(f.s * 0.55 * v, f.s * q * v * 1.3, 1);
    });
    put(flameMat, "opacity", v);
    sm.current.forEach((s, k) => {
      if (!s) return;
      const f = (W.time * 0.12 + k / 8) % 1;
      s.position.set(3.2 + f * 3 + Math.sin(k) * 0.8, 1 + f * 12, 2 + Math.cos(k) * 0.7);
      const sz = (2 + f * 7) * v;
      s.scale.set(sz, sz, 1);
    });
    put(smokeMat, "opacity", v * 0.8);
  });
  return (
    <group ref={ref}>
      <pointLight ref={light} position={[3.4, 2.2, 5.5]} color="#ff7a2e" intensity={0} distance={60} decay={1.1} />
      {flames.map((f, k) => (
        <sprite
          key={k}
          ref={(s) => {
            fl.current[k] = s;
          }}
          material={flameMat}
        />
      ))}
      {Array.from({ length: 8 }, (_, k) => (
        <sprite
          key={k}
          ref={(s) => {
            sm.current[k] = s;
          }}
          material={smokeMat}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// June 2026: the Popemobile, arriving along Carrer de Provença.
// ---------------------------------------------------------------------------

export function Props() {
  return (
    <group>
      {CRANES.map((c, k) => (
        <TowerCrane key={k} c={c} />
      ))}
      <Derrick x={-3.4} z={5.0} s={1} phase={0.3} />
      <Derrick x={3.5} z={5.3} s={0.85} phase={2.2} />
      <Tram />
      <Lamps />
      <Fire />
      <Popemobile />
    </group>
  );
}

