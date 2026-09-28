"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useStage } from "@/theatre/engine";

import { Q } from "../cues";
import { mats } from "../lib/materials";

const seg = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));

type Pal = [string, string, string, number];

// cyclorama colours per scene: top, horizon, floor glow, intensity
const PALETTES: { at: number; pal: Pal }[] = [
  { at: 0, pal: ["#0d2a33", "#3b5d63", "#6a4a47", 0.55] },
  { at: 3.4, pal: ["#0d2a33", "#3b5d63", "#6a4a47", 0.55] },
  { at: 4.2, pal: ["#6fa6b6", "#f6d3b6", "#f19a82", 1.05] },
  { at: 7.3, pal: ["#6fa6b6", "#f6d3b6", "#f19a82", 1.05] },
  { at: 8.0, pal: ["#0b1a22", "#1f2f36", "#3a2626", 0.45] },
  { at: 10.6, pal: ["#0b1a22", "#1f2f36", "#3a2626", 0.45] },
  { at: 11.4, pal: ["#2b1a14", "#6b4a33", "#3a241a", 0.6] },
  { at: 23.6, pal: ["#2b1a14", "#6b4a33", "#3a241a", 0.6] },
  { at: 24.3, pal: ["#101a26", "#39424f", "#2a1e22", 0.5] },
];

function paletteAt(t: number) {
  let i = 0;
  while (i < PALETTES.length - 2 && t > PALETTES[i + 1].at) i++;
  const a = PALETTES[i];
  const b = PALETTES[i + 1];
  const p = seg(t, a.at, b.at);
  const mix = (x: string, y: string) => new THREE.Color(x).lerp(new THREE.Color(y), p);
  return { top: mix(a.pal[0], b.pal[0]), mid: mix(a.pal[1], b.pal[1]), low: mix(a.pal[2], b.pal[2]), k: a.pal[3] + (b.pal[3] - a.pal[3]) * p };
}

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const frag = /* glsl */ `
uniform vec3 top;
uniform vec3 mid;
uniform vec3 low;
uniform float k;
varying vec2 vUv;
void main() {
  float y = vUv.y;
  vec3 c = mix(low, mid, smoothstep(0.0, 0.32, y));
  c = mix(c, top, smoothstep(0.32, 1.0, y));
  // a soft pool of light where the cyc meets the floor
  float glow = exp(-pow((vUv.x - 0.5) * 2.2, 2.0)) * smoothstep(0.55, 0.0, y) * 0.35;
  c += mid * glow;
  // cloth: gentle vertical seams
  c *= 0.96 + 0.04 * sin(vUv.x * 180.0);
  gl_FragColor = vec4(c * k, 1.0);
  #include <colorspace_fragment>
}`;

/** The cyclorama: a flown cloth lit from below. Out for Acts IV and V. */
export function Cyc() {
  const stage = useStage();
  const group = useRef<THREE.Group>(null);
  const cloth = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          top: { value: new THREE.Color() },
          mid: { value: new THREE.Color() },
          low: { value: new THREE.Color() },
          k: { value: 1 },
        },
        fog: false,
      }),
    [],
  );
  const geo = useMemo(() => {
    // gently curved like a real cyc
    const g = new THREE.PlaneGeometry(26, 14, 60, 1);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, Math.pow(x / 13, 2) * 2.2);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame(() => {
    const t = stage.t;
    const p = paletteAt(t);
    const u = (cloth.current?.material as THREE.ShaderMaterial | undefined)?.uniforms;
    if (u) {
      u.top.value.copy(p.top);
      u.mid.value.copy(p.mid);
      u.low.value.copy(p.low);
      u.k.value = p.k;
    }
    if (group.current) {
      // flies out for rehearsal and the stage door, returns for the finale
      const out = seg(t, Q.act4.setIn[0] - 0.9, Q.act4.setIn[0] - 0.1) * (1 - seg(t, Q.act5.setOut[0], Q.finale.curtainClose[1]));
      group.current.position.y = out * 16;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={cloth} geometry={geo} material={mat} position={[0, 6.8, -10.9]} />
      <mesh position={[0, 13.9, -10.9]} material={mats().blackMetal}>
        <cylinderGeometry args={[0.08, 0.08, 26, 8]} />
      </mesh>
    </group>
  );
}

/** The real back wall of the stage, brick, with a radiator and pipes. */
export function BackWall() {
  const m = mats();
  return (
    <group position={[0, 0, -11.8]}>
      <mesh position={[0, 7, 0]} material={m.brick}>
        <planeGeometry args={[26, 14]} />
      </mesh>
      {[-7.5, 6.2].map((x) => (
        <mesh key={x} position={[x, 7, 0.12]} material={m.blackMetal}>
          <cylinderGeometry args={[0.07, 0.07, 14, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 11.2, 0.2]} rotation={[0, 0, Math.PI / 2]} material={m.blackMetal}>
        <cylinderGeometry args={[0.1, 0.1, 26, 8]} />
      </mesh>
      {/* fly-gallery ropes on the side */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-10.4 + i * 0.12, 6, 3]} material={m.cream}>
          <cylinderGeometry args={[0.018, 0.018, 12, 5]} />
        </mesh>
      ))}
    </group>
  );
}
