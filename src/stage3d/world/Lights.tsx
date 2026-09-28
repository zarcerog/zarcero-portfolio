"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useStage } from "@/theatre/engine";

import { houseDarkAt, Q } from "../cues";
import { useLayout } from "../lib/layout";
import { mats } from "../lib/materials";
import { ROSES } from "../sets/Cast";
import { dressingLightAt } from "../sets/DressingRoom";
import { DOOR_LAMP, doorLampAt } from "../sets/StageDoor";
import { homeLampAt, schoolNightAt } from "../sets/Rooms";

// The whole rig is three lights: sky fill, one key, one practical.
// Beams, pools and glows are painted geometry, not lights.

const seg = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
export const env = (t: number, a: number, b: number, c: number, d: number) =>
  t <= a || t >= d ? 0 : t < b ? seg(t, a, b) : t <= c ? 1 : 1 - seg(t, c, d);

/** How bright the stage is: full for most acts, lower in the dressing room and after dark. */
export function stageLevelAt(t: number) {
  const r = Q.act4;
  const door = Q.act5;
  const dressing = seg(t, r.setIn[0] - 0.3, r.setIn[1]) * (1 - seg(t, r.setOut[0], r.setOut[1]));
  const doorDim = seg(t, door.setIn[0] - 0.3, door.setIn[1]) * (1 - seg(t, door.setOut[0], door.setOut[1]));
  return 1 - dressing * 0.45 - doorDim * 0.25 - schoolNightAt(t) * 0.8;
}

const beamVert = /* glsl */ `
varying float vAlong;
varying vec3 vN;
varying vec3 vV;
void main() {
  vAlong = uv.y;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const beamFrag = /* glsl */ `
uniform vec3 color;
uniform float opacity;
varying float vAlong;
varying vec3 vN;
varying vec3 vV;
void main() {
  float facing = abs(dot(vN, vV));
  float a = pow(facing, 2.2) * pow(vAlong, 1.4) * opacity;
  gl_FragColor = vec4(color * a, a);
}`;

/** A fake light beam: an open cone, brightest at its source, soft at its edges. */
function Beam({ from, to, color, width, level }: { from: [number, number, number]; to: [number, number, number]; color: string; width: number; level: (t: number) => number }) {
  const stage = useStage();
  const ref = useRef<THREE.Mesh>(null);
  const { geo, mat, pos, quat } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const len = a.distanceTo(b);
    const geo = new THREE.CylinderGeometry(0.12, width, len, 24, 1, true);
    const mat = new THREE.ShaderMaterial({
      vertexShader: beamVert,
      fragmentShader: beamFrag,
      uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const pos = a.clone().lerp(b, 0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize());
    return { geo, mat, pos, quat };
  }, [from, to, color, width]);
  useFrame(() => {
    const k = level(stage.t);
    const m = ref.current;
    if (!m) return;
    m.visible = k > 0.01;
    (m.material as THREE.ShaderMaterial).uniforms.opacity.value = k * 0.22;
  });
  return <mesh ref={ref} geometry={geo} material={mat} position={pos} quaternion={quat} />;
}

/** A pool of light painted on the floor. */
function Pool({ at, size, color, level }: { at: (t: number) => [number, number]; size: number; color: string; level: (t: number) => number }) {
  const stage = useStage();
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: mats().glow,
        color,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
      }),
    [color],
  );
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const k = level(stage.t);
    m.visible = k > 0.01;
    if (!m.visible) return;
    const [x, z] = at(stage.t);
    m.position.set(x, 0.012, z);
    (m.material as THREE.MeshBasicMaterial).opacity = k * 0.55;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} material={mat}>
      <planeGeometry args={[size, size * 0.75]} />
    </mesh>
  );
}

const dustVert = /* glsl */ `
uniform float time;
uniform float px;
attribute float seed;
varying float vA;
void main() {
  vec3 p = position;
  p.x += sin(time * 0.35 + seed * 6.28) * 0.35;
  p.y += mod(time * 0.08 + seed * 7.0, 8.0) - 4.0;
  p.z += cos(time * 0.3 + seed * 3.1) * 0.25;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = px * (0.6 + seed) * 18.0 / -mv.z;
  vA = 0.55 + 0.45 * sin(time * 1.3 + seed * 20.0);
  gl_Position = projectionMatrix * mv;
}`;
const dustFrag = /* glsl */ `
uniform vec3 color;
uniform float opacity;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vA * opacity;
  gl_FragColor = vec4(color * a, a);
}`;

/** Dust in the beams: one point cloud, drifting in its own shader. */
function Dust({ count }: { count: number }) {
  const stage = useStage();
  const ref = useRef<THREE.Points>(null);
  const { geo, mat } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    let s = 11;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (r() - 0.5) * 14;
      pos[i * 3 + 1] = (r() - 0.5) * 8;
      pos[i * 3 + 2] = (r() - 0.5) * 7;
      seed[i] = r();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: dustVert,
      fragmentShader: dustFrag,
      uniforms: { time: { value: 0 }, px: { value: 1 }, color: { value: new THREE.Color("#ffe6c0") }, opacity: { value: 0.45 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo, mat };
  }, [count]);
  useFrame(({ gl }) => {
    const u = ref.current ? (ref.current.material as THREE.ShaderMaterial).uniforms : null;
    if (!u) return;
    u.time.value = performance.now() / 1000;
    u.px.value = gl.getPixelRatio();
    u.opacity.value = 0.45 * houseDarkAt(stage.t);
  });
  return <points ref={ref} geometry={geo} material={mat} position={[0, 4.5, 1.5]} frustumCulled={false} />;
}

export function Lights() {
  const { tier } = useLayout();
  const stage = useStage();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const practical = useRef<THREE.PointLight>(null);
  const m = mats();

  useLayoutEffect(() => {
    const k = key.current;
    if (!k) return;
    k.target.position.set(0, 1, -3);
    k.target.updateMatrixWorld();
  }, []);

  useFrame(() => {
    const t = stage.t;
    const dark = houseDarkAt(t);
    const lit = 1 - dark;
    const level = stageLevelAt(t);
    if (hemi.current) hemi.current.intensity = (0.55 + lit * 0.9) * (0.4 + 0.6 * level);
    if (key.current) key.current.intensity = 2.4 * level;

    // the house "dims" by tinting its materials — no lights involved
    const house = 0.32 + 0.68 * lit;
    m.velvetSeat.color.setScalar(house);
    m.velvetDeep.color.setScalar(0.45 + 0.55 * lit);
    m.goldDull.color.setScalar(0.55 + 0.45 * lit);
    // the stage's own velvet follows the stage level
    const s = 0.25 + 0.75 * level;
    m.velvetRed.color.setScalar(s);
    m.velvetTeal.color.setScalar(s);

    const p = practical.current;
    if (p) {
      const g = dressingLightAt(t);
      const d = doorLampAt(t);
      const h = homeLampAt(t);
      if (h.k > 0.001) {
        p.position.set(-0.3, 1.9 + h.y, 0.9);
        p.intensity = h.k * 6;
        p.distance = 7;
      } else if (g.k >= d.k) {
        // the bulbs round the dressing-room mirror
        p.position.set(0, 3.0 + g.y, -2.4);
        p.intensity = g.k * 9;
        p.distance = 9;
      } else {
        p.position.set(...DOOR_LAMP);
        p.intensity = d.k * 10;
        p.distance = 12;
      }
    }
  });

  const beams = (t: number) => houseDarkAt(t) * stageLevelAt(t) * (1 - seg(t, Q.finale.curtainClose[0], Q.finale.curtainClose[1]));
  const chair = (t: number) => env(t, ...Q.act1.personae);
  const roses = (t: number) => env(t, ...ROSES) * 0.85;

  return (
    <>
      <hemisphereLight ref={hemi} args={["#ffe6cc", "#3a0f14", 1]} />
      <directionalLight ref={key} position={[0, 12, 12]} color="#ffe6c4" intensity={2.4} />
      <pointLight ref={practical} color="#ffe2b0" intensity={0} decay={2} />

      {/* two follow-spot beams from the boxes, perfectly mirrored */}
      <Beam from={[-10.4, 7.6, 6.6]} to={[-1.4, 0, -1]} color="#ffdcae" width={2.2} level={beams} />
      <Beam from={[10.4, 7.6, 6.6]} to={[1.4, 0, -1]} color="#ffdcae" width={2.2} level={beams} />
      {/* the specials, straight down the centre line: the empty chair, then the roses */}
      <Beam from={[0, 11, 7]} to={[0, 0, 0.6]} color="#fff1d6" width={1.9} level={chair} />
      <Beam from={[0, 11, 8]} to={[0, 0, 1.3]} color="#ffe6d6" width={1.3} level={roses} />

      <Pool at={() => [0, -1]} size={9} color="#ffd9a8" level={(t) => 0.35 * beams(t)} />
      <Pool at={() => [0, 0.8]} size={4.2} color="#fff1d6" level={chair} />
      <Pool at={() => [0, 1.3]} size={2.6} color="#ffe6d6" level={roses} />
      <Pool at={() => [0, -2.2]} size={5} color="#ffe0a8" level={(t) => dressingLightAt(t).k * 0.7} />
      <Pool at={() => [0, 0.7]} size={3.4} color="#ffd9a0" level={(t) => homeLampAt(t).k * 0.8} />

      {/* dust in the beams (a single cheap point cloud) */}
      <Dust count={tier === "high" ? 70 : 35} />
    </>
  );
}
