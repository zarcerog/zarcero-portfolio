"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { rng } from "@/stage3d/lib/canvas";
import { font } from "@/stage3d/lib/fonts";
import { useLayout } from "@/stage3d/lib/layout";

import { CUE } from "../script";
import { filmSound } from "../sound/bus";
import { textPoints } from "./textures";
import { easeInOut, put, seg, W } from "./world";

// ---------------------------------------------------------------------------
// Fireworks: launched from the façade, burst over the towers. All the maths is
// in the vertex shader; the CPU only decides when and where each shell goes.
// ---------------------------------------------------------------------------

const PALETTE = ["#ffd27a", "#ff4d5e", "#ffffff", "#5fa8ff", "#7dff9a", "#ff7ad9", "#9fe7ff", "#ffb347"].map((c) => new THREE.Color(c));

const FW_VERT = /* glsl */ `
  #define SLOTS __SLOTS__
  attribute float aSlot;
  attribute vec3 aDir;
  attribute float aRand;
  uniform float uTime;
  uniform float uRise;
  uniform float uScale;
  uniform vec3 uOrigin[SLOTS];
  uniform vec3 uLaunch[SLOTS];
  uniform float uT0[SLOTS];
  uniform vec3 uColor[SLOTS];
  uniform float uKind[SLOTS];
  varying vec3 vCol;
  varying float vA;
  void main() {
    int s = int(aSlot + 0.5);
    float age = uTime - uT0[s];
    float kind = uKind[s];
    float life = kind > 1.5 ? 3.6 : 2.4;
    vec3 p;
    float a;
    float size;
    vec3 col = uColor[s];
    if (age < 0.0 || age > uRise + life) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vA = 0.0;
      vCol = vec3(0.0);
      return;
    }
    if (age < uRise) {
      // the shell climbing, trailing sparks
      float f = age / uRise;
      float e = 1.0 - (1.0 - f) * (1.0 - f);
      float lag = aRand * 0.16;
      p = mix(uLaunch[s], uOrigin[s], clamp(e - lag, 0.0, 1.0));
      p.x += sin(aRand * 40.0 + age * 20.0) * 0.04;
      a = (aRand < 0.4 ? 1.0 : 0.0) * (1.0 - lag * 5.0);
      col = vec3(1.0, 0.8, 0.5);
      size = 0.55;
    } else {
      float t = age - uRise;
      float willow = step(1.5, kind);
      float drag = mix(1.15, 1.7, willow);
      vec3 v = aDir * mix(10.0, 7.0, willow);
      p = uOrigin[s] + v * (1.0 - exp(-drag * t)) / drag;
      p.y -= 0.5 * mix(1.5, 2.4, willow) * t * t;
      float f = t / life;
      a = pow(1.0 - f, 1.3);
      a *= 0.65 + 0.35 * sin(uTime * 34.0 + aRand * 70.0);
      col = mix(vec3(1.0, 0.98, 0.9), col, smoothstep(0.0, 0.18, f));
      col = mix(col, vec3(1.0, 0.55, 0.2), willow * f);
      size = mix(1.0, 0.8, f);
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uScale * size * 0.42 / -mv.z, 1.5, 48.0);
    vA = a;
    vCol = col;
  }
`;

const FW_FRAG = /* glsl */ `
  varying vec3 vCol;
  varying float vA;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = smoothstep(0.5, 0.0, d);
    float a = pow(core, 1.8) * vA;
    gl_FragColor = vec4(vCol * a * 2.2, 1.0);
  }
`;

interface Slot {
  t0: number;
  origin: THREE.Vector3;
  launch: THREE.Vector3;
  color: THREE.Color;
  kind: number;
  /** 0 waiting, 1 climbing, 2 burst (for the sound) */
  heard: number;
}

function Shells() {
  const { tier } = useLayout();
  const slots = tier === "high" ? 30 : 16;
  const per = tier === "high" ? 200 : 120;
  const rise = 1.15;
  const r = useMemo(() => rng(610), []);
  const { geo, mat, state } = useMemo(() => {
    const n = slots * per;
    const aSlot = new Float32Array(n);
    const aDir = new Float32Array(n * 3);
    const aRand = new Float32Array(n);
    const pos = new Float32Array(n * 3);
    const kinds: number[] = [];
    const v = new THREE.Vector3();
    for (let s = 0; s < slots; s++) {
      const kind = s % 5 === 0 ? 1 : s % 3 === 1 ? 2 : 0;
      kinds.push(kind);
      const normal = new THREE.Vector3(r() - 0.5, 1, r() - 0.5).normalize();
      const t1 = new THREE.Vector3(1, 0, 0).cross(normal).normalize();
      const t2 = normal.clone().cross(t1).normalize();
      for (let k = 0; k < per; k++) {
        const i = s * per + k;
        aSlot[i] = s;
        aRand[i] = r();
        if (kind === 1) {
          const a = (k / per) * Math.PI * 2;
          v.copy(t1).multiplyScalar(Math.cos(a)).addScaledVector(t2, Math.sin(a)).multiplyScalar(0.9 + r() * 0.1);
        } else {
          // uniform on the sphere, a little ragged
          const u = r() * 2 - 1;
          const th = r() * Math.PI * 2;
          const q = Math.sqrt(1 - u * u);
          v.set(q * Math.cos(th), u, q * Math.sin(th)).multiplyScalar(0.75 + r() * 0.25);
        }
        aDir[i * 3] = v.x;
        aDir[i * 3 + 1] = v.y;
        aDir[i * 3 + 2] = v.z;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSlot", new THREE.BufferAttribute(aSlot, 1));
    geo.setAttribute("aDir", new THREE.BufferAttribute(aDir, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(aRand, 1));
    const state: Slot[] = kinds.map((kind) => ({
      t0: -1e5,
      origin: new THREE.Vector3(),
      launch: new THREE.Vector3(),
      color: new THREE.Color(),
      kind,
      heard: 2,
    }));
    const mat = new THREE.ShaderMaterial({
      vertexShader: FW_VERT.replace("__SLOTS__", String(slots)),
      fragmentShader: FW_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uRise: { value: rise },
        uScale: { value: 800 },
        uOrigin: { value: state.map((s) => s.origin) },
        uLaunch: { value: state.map((s) => s.launch) },
        uT0: { value: state.map(() => -1e5) },
        uColor: { value: state.map((s) => s.color) },
        uKind: { value: kinds.slice() },
      },
    });
    return { geo, mat, state };
  }, [slots, per, r]);

  const size = useThree((s) => s.size);
  const ref = useRef<THREE.Points>(null);
  const wasOn = useRef(false);
  const flashCol = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const now = W.time;
    const [a, b] = CUE.fireworks;
    const on = W.t >= a && W.t <= b;
    const u = mat.uniforms;
    put(u.uTime, "value", now);
    put(u.uScale, "value", size.height);
    if (on && !wasOn.current) {
      // the first volley, staggered
      state.forEach((s, i) => (s.t0 = now + (i / state.length) * 3.2 + r() * 0.4 - 10));
    }
    if (!on && W.t < a) state.forEach((s) => (s.t0 = -1e5));
    wasOn.current = on;
    let flash = 0;
    flashCol.setRGB(0, 0, 0);
    state.forEach((s, i) => {
      const life = s.kind === 2 ? 3.6 : 2.4;
      const age = now - s.t0;
      if (on && age > rise + life) {
        put(s, "t0", now + r() * 1.4);
        // launched from the façade and the tower tops, bursting over the spires
        const side = r() - 0.5;
        s.origin.set(side * 26, 11 + r() * 15, -3 + r() * 8);
        const fromTower = r() < 0.45;
        s.launch.set(fromTower ? (r() - 0.5) * 3.4 : side * 5, fromTower ? 9.5 : 4.5, fromTower ? 3.3 : 3.4);
        s.color.copy(s.kind === 2 ? PALETTE[0] : PALETTE[Math.floor(r() * PALETTE.length)]);
        put(s, "heard", 0);
      }
      // tell the sound department (if anyone is listening)
      if (on && s.heard === 0 && now >= s.t0) {
        put(s, "heard", 1);
        if (r() < 0.5) filmSound("launch", { pan: s.launch.x / 12, gain: 0.8 });
      }
      if (on && s.heard === 1 && now >= s.t0 + rise) {
        put(s, "heard", 2);
        const pan = Math.max(-0.9, Math.min(0.9, s.origin.x / 16));
        filmSound("boom", { pan, gain: 0.6 + (s.origin.y - 11) / 40 });
        if (s.kind === 2) filmSound("glitter", { pan, gain: 0.8 });
      }
      put((u.uT0.value as number[]), i, s.t0);
      const t = now - s.t0 - rise;
      if (t > 0 && t < 1.2) {
        const k = Math.exp(-t * 3.2);
        flash += k;
        flashCol.r += s.color.r * k;
        flashCol.g += s.color.g * k;
        flashCol.b += s.color.b * k;
      }
    });
    if (flash > 0) flashCol.multiplyScalar(1 / flash);
    W.flash = Math.min(2, flash * 0.55);
    W.flashColor.lerp(flash > 0 ? flashCol : W.flashColor, 0.4);
    if (ref.current) ref.current.visible = on || state.some((s) => now - s.t0 < rise + 3.6);
  });

  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} renderOrder={5} />;
}

// ---------------------------------------------------------------------------
// The drone show: a swarm that climbs from the square behind the temple and
// writes in the sky.
// ---------------------------------------------------------------------------

const DR_VERT = /* glsl */ `
  attribute vec3 aA;
  attribute vec3 aB;
  attribute float aRand;
  uniform float uUp;
  uniform float uAB;
  uniform float uOut;
  uniform float uTime;
  uniform float uScale;
  varying vec3 vCol;
  varying float vA;
  void main() {
    float d = aRand * 0.35;
    float up = clamp((uUp - d) / (1.0 - 0.35), 0.0, 1.0);
    up = up * up * (3.0 - 2.0 * up);
    float ab = clamp((uAB - d * 0.6) / (1.0 - 0.21), 0.0, 1.0);
    ab = ab * ab * (3.0 - 2.0 * ab);
    vec3 target = mix(aA, aB, ab);
    // climb straight up first, then fly to the letter
    vec3 lift = vec3(position.x, mix(position.y, target.y, min(1.0, up * 1.6)), position.z);
    vec3 p = mix(lift, target, smoothstep(0.35, 1.0, up));
    p.y += uOut * (8.0 + aRand * 10.0);
    p += vec3(sin(uTime * 0.7 + aRand * 20.0), cos(uTime * 0.6 + aRand * 13.0), 0.0) * 0.06;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uScale * 0.55 / -mv.z, 1.5, 18.0);
    vCol = mix(vec3(1.0, 0.86, 0.55), vec3(0.55, 0.8, 1.0), ab);
    vA = step(0.001, uUp) * (1.0 - uOut) * (0.75 + 0.25 * sin(uTime * 3.0 + aRand * 30.0));
  }
`;

function Drones() {
  const { tier } = useLayout();
  const { geo, mat } = useMemo(() => {
    const n = tier === "high" ? 900 : 520;
    const A = textPoints("1926 · 2026", n, font.sans(700, 150), 3);
    const Bp = textPoints("GAUDÍ", n, font.sans(700, 170), 5);
    const r = rng(77);
    const pos = new Float32Array(n * 3);
    const a = new Float32Array(n * 3);
    const b = new Float32Array(n * 3);
    const rand = new Float32Array(n);
    const side = Math.ceil(Math.sqrt(n));
    for (let i = 0; i < n; i++) {
      // a grid on the square behind the Passion façade
      pos[i * 3] = ((i % side) / side - 0.5) * 9;
      pos[i * 3 + 1] = 0.3;
      pos[i * 3 + 2] = -13.3 + (Math.floor(i / side) / side - 0.5) * 9;
      a[i * 3] = A[i][0] * 44;
      a[i * 3 + 1] = 33 + A[i][1] * 9;
      a[i * 3 + 2] = -22;
      b[i * 3] = Bp[i][0] * 40;
      b[i * 3 + 1] = 33 + Bp[i][1] * 8;
      b[i * 3 + 2] = -22;
      rand[i] = r();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aA", new THREE.BufferAttribute(a, 3));
    geo.setAttribute("aB", new THREE.BufferAttribute(b, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: DR_VERT,
      fragmentShader: FW_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uUp: { value: 0 }, uAB: { value: 0 }, uOut: { value: 0 }, uTime: { value: 0 }, uScale: { value: 800 } },
    });
    return { geo, mat };
  }, [tier]);
  const size = useThree((s) => s.size);
  const ref = useRef<THREE.Points>(null);
  useFrame(() => {
    const d = CUE.drones;
    const up = seg(W.t, d.up[0], d.a[0] + 0.4);
    const ab = easeInOut(seg(W.t, ...d.b));
    const out = easeInOut(seg(W.t, ...d.out));
    const u = mat.uniforms;
    put(u.uUp, "value", up);
    put(u.uAB, "value", ab);
    put(u.uOut, "value", out);
    put(u.uTime, "value", W.time);
    put(u.uScale, "value", size.height);
    if (ref.current) ref.current.visible = up > 0 && out < 1;
  });
  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} renderOrder={4} />;
}

export function Fireworks() {
  return (
    <group>
      <Shells />
      <Drones />
    </group>
  );
}
