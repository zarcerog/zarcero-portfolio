"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { rng } from "@/stage3d/lib/canvas";
import { useLayout } from "@/stage3d/lib/layout";

import { B, birth, coastX, isSpecial, P } from "./plan";
import type { Cutout } from "./Cutouts";
import { Eixample } from "./Eixample";
import { dot } from "./textures";
import { put, seg, W } from "./world";

// ---------------------------------------------------------------------------
// Plane trees along the streets once the city has come, and in the squares.
// ---------------------------------------------------------------------------

export function streetTrees(): Cutout[] {
  const r = rng(99);
  const out: Cutout[] = [];
  for (let j = -3; j <= 3; j++) {
    for (let i = -3; i <= 3; i++) {
      if (i === 0 && j === 0) continue;
      const born = isSpecial(i, j) ? 1918 : birth(i, j) + 6;
      const cx = i * P;
      const cz = j * P;
      const e = B + 0.5;
      for (let s = -3; s <= 3; s++) {
        const o = s * 1.3;
        const pts: [number, number][] = [
          [cx + o, cz + e],
          [cx + o, cz - e],
          [cx + e, cz + o],
          [cx - e, cz + o],
        ];
        for (const [x, z] of pts) {
          // leave the street in front of the Nativity façade open for the camera
          if (i === 0 && j === 1 && z < cz) continue;
          out.push({ name: r() < 0.5 ? "plane" : "plane2", x, z, s: 0.55 + r() * 0.15, from: born + r() * 4, to: 9999, flip: r() < 0.5, tint: (r() - 0.5) * 0.12 });
        }
      }
    }
  }
  // the two squares either side of the temple
  for (const jj of [1, -1]) {
    for (let k = 0; k < 40; k++) {
      const x = (r() - 0.5) * 2 * (B - 0.8);
      const z = jj * P + (r() - 0.5) * 2 * (B - 0.8);
      if (jj === 1 && Math.hypot(x / 3.8, (z - P - 0.9) / 2.3) < 1.15) continue;
      // keep a clear strip along the street on the temple side
      if (jj === 1 && z < P - B + 2.2) continue;
      out.push({ name: r() < 0.15 ? "pine2" : r() < 0.5 ? "plane" : "plane2", x, z, s: 0.55 + r() * 0.3, from: 1916 + r() * 20, to: 9999, flip: r() < 0.5, tint: (r() - 0.5) * 0.12 });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// The modern skyline: the Olympic twin towers (1992) and Torre Glòries (2005).
// ---------------------------------------------------------------------------

function Landmarks() {
  const ref = useRef<THREE.Group>(null);
  const glories = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const r = 1.9 * (u < 0.62 ? 1 : Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.62) / 0.38, 2))));
      pts.push(new THREE.Vector2(Math.max(0.001, r), u * 14.4));
    }
    return new THREE.LatheGeometry(pts, 24);
  }, []);
  const gloriesMat = useMemo(() => new THREE.MeshLambertMaterial({ color: "#8f5d56", emissive: new THREE.Color("#2b6bff"), emissiveIntensity: 0 }), []);
  const glass = useMemo(() => new THREE.MeshLambertMaterial({ color: "#8fa1ad", emissive: new THREE.Color("#ffd49a"), emissiveIntensity: 0 }), []);
  const parts = useRef<THREE.Object3D[]>([]);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const [twins, torre] = parts.current;
    if (twins) {
      const p = seg(W.year, 1990, 1992);
      twins.visible = p > 0;
      twins.scale.y = Math.max(0.001, p);
    }
    if (torre) {
      const p = seg(W.year, 2003, 2005);
      torre.visible = p > 0;
      torre.scale.y = Math.max(0.001, p);
    }
    const n = W.light.night;
    // the Glòries tower changes colour at night
    gloriesMat.emissive.setHSL((W.time * 0.02) % 1, 0.8, 0.5);
    put(gloriesMat, "emissiveIntensity", n * 0.8);
    put(glass, "emissiveIntensity", n * 0.35);
  });
  const cx = coastX(-118) + 8;
  return (
    <group ref={ref}>
      <group
        ref={(o) => {
          if (o) parts.current[0] = o;
        }}
        position={[cx, 0, -118]}
      >
        <mesh position={[0, 7.7, 0]} material={glass}>
          <boxGeometry args={[3.2, 15.4, 3.2]} />
        </mesh>
        <mesh position={[3, 7.7, 7]} material={glass}>
          <boxGeometry args={[3.2, 15.4, 3.2]} />
        </mesh>
      </group>
      <group
        ref={(o) => {
          if (o) parts.current[1] = o;
        }}
        position={[-104, 0, 34]}
      >
        <mesh geometry={glories} material={gloriesMat} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 120,000 people with their telephones held up (a few thousand, really).
// ---------------------------------------------------------------------------

function Crowd() {
  const { tier } = useLayout();
  const { geo, mat } = useMemo(() => {
    const r = rng(10);
    const n = tier === "high" ? 5200 : 2400;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    let k = 0;
    while (k < n) {
      // streets within two blocks of the temple, and the two squares
      const x = (r() - 0.5) * P * 5;
      const z = (r() - 0.5) * P * 5;
      const i = Math.round(x / P);
      const j = Math.round(z / P);
      const lx = Math.abs(x - i * P);
      const lz = Math.abs(z - j * P);
      const inStreet = lx > B + 0.1 || lz > B + 0.1;
      const inSquare = i === 0 && Math.abs(j) === 1 && Math.hypot(x / 3.8, (z - P - 0.9) / 2.3) > 1.1;
      if (!inStreet && !inSquare) continue;
      if (i === 0 && j === 0) continue;
      pos[k * 3] = x;
      pos[k * 3 + 1] = 0.18 + r() * 0.1;
      pos[k * 3 + 2] = z;
      seed[k] = r();
      k++;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uOn: { value: 0 }, uMap: { value: dot() }, uScale: { value: 400 } },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime;
        uniform float uOn;
        uniform float uScale;
        varying float vA;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 2.0) + aSeed * 50.0);
          vA = uOn * tw * step(aSeed, uOn);
          gl_PointSize = uScale * 0.09 / -mv.z;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying float vA;
        void main() {
          vec4 c = texture2D(uMap, gl_PointCoord);
          gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * c.rgb * vA, 1.0);
        }
      `,
    });
    return { geo, mat };
  }, [tier]);
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    const on = seg(W.t, 51.2, 52.6) * (1 - seg(W.t, 61.5, 63));
    if (ref.current) ref.current.visible = on > 0;
    put(mat.uniforms.uOn, "value", on);
    put(mat.uniforms.uTime, "value", W.time);
    put(mat.uniforms.uScale, "value", state.size.height);
  });
  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} />;
}

export function City() {
  return (
    <group>
      <Eixample />
      <Landmarks />
      <Crowd />
    </group>
  );
}
