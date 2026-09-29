"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { rng } from "@/stage3d/lib/canvas";

import { cloudTexture } from "./textures";
import { put, W } from "./world";

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
    gl_Position.z = gl_Position.w; // pinned to the far plane
  }
`;

const SKY_FRAG = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uFog;
  uniform vec3 uSunDir;
  uniform vec3 uSun;
  uniform float uNight;
  uniform float uTime;
  uniform vec3 uFlash;
  varying vec3 vDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    // the gradient: haze at the horizon, deepening overhead
    float k = pow(clamp(h, 0.0, 1.0), 0.55);
    vec3 col = mix(uHorizon, uZenith, k);
    // below the horizon the sky is simply the haze (the ground fades into it)
    col = mix(uFog, col, smoothstep(-0.04, 0.05, h));
    // the sun: a soft disc and a wide glow
    float s = max(dot(d, normalize(uSunDir)), 0.0);
    float day = 1.0 - uNight;
    col += uSun * (pow(s, 900.0) * 3.0 + pow(s, 12.0) * 0.28 + pow(s, 3.0) * 0.08) * day;
    // a moon, at night, in the same place
    col += vec3(0.85, 0.9, 1.0) * pow(s, 2400.0) * 2.0 * uNight;
    col += vec3(0.25, 0.3, 0.45) * pow(s, 30.0) * 0.25 * uNight;
    // stars
    if (uNight > 0.01 && h > 0.0) {
      vec3 q = floor(d * 420.0);
      float st = hash(q);
      float tw = 0.6 + 0.4 * sin(uTime * (1.0 + st * 3.0) + st * 40.0);
      col += vec3(step(0.9965, st) * tw * uNight * smoothstep(0.02, 0.25, h));
    }
    // the fireworks light up the smoke-hazed sky
    col += uFlash * (0.35 + 0.65 * (1.0 - k));
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function Dome() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uZenith: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uFog: { value: new THREE.Color() },
          uSunDir: { value: new THREE.Vector3(0, 1, 0) },
          uSun: { value: new THREE.Color() },
          uNight: { value: 0 },
          uTime: { value: 0 },
          uFlash: { value: new THREE.Color(0, 0, 0) },
        },
      }),
    [],
  );
  const ref = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    const L = W.light;
    const u = mat.uniforms;
    (u.uZenith.value as THREE.Color).copy(L.zenith);
    (u.uHorizon.value as THREE.Color).copy(L.horizon);
    (u.uFog.value as THREE.Color).copy(L.fog);
    (u.uSunDir.value as THREE.Vector3).copy(L.sunDir);
    (u.uSun.value as THREE.Color).copy(L.sun);
    put(u.uNight, "value", L.night);
    put(u.uTime, "value", W.time);
    (u.uFlash.value as THREE.Color).copy(W.flashColor).multiplyScalar(W.flash * 0.07);
    ref.current?.position.copy(camera.position);
  });
  return (
    <mesh ref={ref} material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[900, 48, 24]} />
    </mesh>
  );
}

interface Puff {
  x: number;
  y: number;
  z: number;
  s: number;
  seed: number;
  drift: number;
}

/** Painted cumulus, drifting in from the sea. */
function Clouds() {
  const puffs = useMemo<Puff[]>(() => {
    const r = rng(77);
    const out: Puff[] = [
      // framed for the opening shot, looking straight up
      { x: -34, y: 96, z: 6, s: 58, seed: 1, drift: 0.6 },
      { x: 38, y: 112, z: -14, s: 66, seed: 2, drift: 0.5 },
      { x: 4, y: 128, z: -52, s: 76, seed: 3, drift: 0.4 },
      { x: -6, y: 84, z: 40, s: 40, seed: 4, drift: 0.7 },
    ];
    for (let i = 0; i < 18; i++) {
      const a = r() * Math.PI * 2;
      const d = 140 + r() * 420;
      out.push({ x: Math.cos(a) * d, y: 70 + r() * 90, z: Math.sin(a) * d - 80, s: 60 + r() * 90, seed: 10 + i, drift: 0.3 + r() * 0.5 });
    }
    return out;
  }, []);
  const mats = useMemo(
    () =>
      puffs.map(
        (p) =>
          new THREE.SpriteMaterial({
            map: cloudTexture(p.seed % 7),
            transparent: true,
            depthWrite: false,
            fog: true,
          }),
      ),
    [puffs],
  );
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const tint = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const L = W.light;
    // lit side: the sun's colour, softened; at night a moonlit slate
    tint.copy(L.sun).lerp(new THREE.Color("#ffffff"), 0.55).multiplyScalar(1 - L.night * 0.72);
    tint.lerp(L.horizon, 0.18 + L.night * 0.2);
    puffs.forEach((p, i) => {
      const s = refs.current[i];
      if (!s) return;
      const x = ((p.x + W.time * p.drift + 700) % 1400) - 700;
      s.position.set(x, p.y, p.z);
      mats[i].color.copy(tint);
      put(mats[i], "opacity", 0.95 - L.night * 0.45);
    });
  });
  return (
    <group>
      {puffs.map((p, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          material={mats[i]}
          scale={[p.s, p.s * 0.5, 1]}
          position={[p.x, p.y, p.z]}
        />
      ))}
    </group>
  );
}

export function Sky() {
  return (
    <>
      <Dome />
      <Clouds />
    </>
  );
}
