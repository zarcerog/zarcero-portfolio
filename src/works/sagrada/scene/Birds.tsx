"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { CUE } from "../script";
import { wingTexture } from "./textures";
import { seg, W } from "./world";

// Two gulls. Not important to the story, but they were there.

/** A tapered wing panel, root at the origin, reaching out along +x. */
function wingGeo(len: number, root: number, tip: number, sweep: number, flip: boolean) {
  const s = new THREE.Shape();
  s.moveTo(0, root / 2);
  s.lineTo(len, root / 2 - sweep);
  s.lineTo(len, root / 2 - sweep - tip);
  s.lineTo(0, -root / 2);
  s.closePath();
  const g = new THREE.ShapeGeometry(s);
  // UVs across the span, so the dark tip lands at the end of the outer panel
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / len, 0.5 + pos.getY(i) / root);
  g.rotateX(-Math.PI / 2);
  if (flip) g.scale(-1, 1, 1);
  return g;
}

/** Where the lead gull is at beat t (the director's notes circle it). */
export function gullAt(t: number, out: THREE.Vector3) {
  const p = seg(t, CUE.gulls[0], CUE.gulls[1]);
  return out.set(-26 + p * 52, 26 + p * 2, 55 - p * 5);
}

function Gull({ offset, phase }: { offset: THREE.Vector3; phase: number }) {
  const root = useRef<THREE.Group>(null);
  const wings = useRef<(THREE.Group | null)[]>([]);
  const tips = useRef<(THREE.Group | null)[]>([]);
  const mats = useMemo(() => {
    const wing = new THREE.MeshLambertMaterial({ color: "#eef0f2", side: THREE.DoubleSide });
    const tip = new THREE.MeshLambertMaterial({ map: wingTexture(), side: THREE.DoubleSide });
    const body = new THREE.MeshLambertMaterial({ color: "#f6f7f8" });
    const beak = new THREE.MeshLambertMaterial({ color: "#e8b43a" });
    return { wing, tip, body, beak };
  }, []);
  const geos = useMemo(
    () => ({
      innerL: wingGeo(0.8, 0.34, 0.3, 0.02, false),
      outerL: wingGeo(0.95, 0.3, 0.1, 0.22, false),
      innerR: wingGeo(0.8, 0.34, 0.3, 0.02, true),
      outerR: wingGeo(0.95, 0.3, 0.1, 0.22, true),
    }),
    [],
  );
  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const [a, b] = CUE.gulls;
    const on = W.t > a - 0.3 && W.t < b + 0.5;
    g.visible = on;
    if (!on) return;
    const p = seg(W.t, a, b);
    const time = W.time + phase;
    // a long glide across the sky, with a lazy bank
    const x = -26 + p * 52 + offset.x;
    const y = 26 + offset.y + Math.sin(time * 0.8) * 0.4 + p * 2;
    const z = 55 + offset.z - p * 5;
    g.position.set(x, y, z);
    g.rotation.set(0, Math.PI / 2 + 0.08, Math.sin(time * 0.5) * 0.15);
    // flap, glide, flap
    const cycle = (time * 0.35) % 1;
    const flapping = cycle < 0.55 ? 1 : 0.15;
    const f = Math.sin(time * 7.5) * 0.55 * flapping + 0.12;
    wings.current.forEach((w, k) => {
      if (w) w.rotation.z = (k === 0 ? 1 : -1) * f;
    });
    tips.current.forEach((w, k) => {
      if (w) w.rotation.z = (k === 0 ? 1 : -1) * (f * 0.8 - 0.1);
    });
  });
  return (
    <group ref={root} scale={2.0}>
      <mesh material={mats.body} scale={[0.12, 0.11, 0.42]}>
        <sphereGeometry args={[1, 12, 8]} />
      </mesh>
      <mesh material={mats.body} position={[0, 0.06, 0.45]}>
        <sphereGeometry args={[0.09, 10, 8]} />
      </mesh>
      <mesh material={mats.beak} position={[0, 0.05, 0.57]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.025, 0.1, 5]} />
      </mesh>
      <mesh material={mats.body} position={[0, 0.01, -0.52]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.2, 0.2, 1]}>
        <circleGeometry args={[0.5, 3]} />
      </mesh>
      {[0, 1].map((k) => (
        <group
          key={k}
          position={[k === 0 ? 0.1 : -0.1, 0.04, 0.02]}
          ref={(el) => {
            wings.current[k] = el;
          }}
        >
          <mesh geometry={k === 0 ? geos.innerL : geos.innerR} material={mats.wing} />
          <group
            position={[k === 0 ? 0.8 : -0.8, 0, 0]}
            ref={(el) => {
              tips.current[k] = el;
            }}
          >
            <mesh geometry={k === 0 ? geos.outerL : geos.outerR} material={mats.tip} />
          </group>
        </group>
      ))}
    </group>
  );
}

export function Birds() {
  return (
    <group>
      <Gull offset={new THREE.Vector3(0, 0, 0)} phase={0} />
      <Gull offset={new THREE.Vector3(-3.2, -1.1, 1.6)} phase={1.7} />
    </group>
  );
}
