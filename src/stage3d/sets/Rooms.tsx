"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";

import { ROOMS } from "@/theatre/content";
import { useStage } from "@/theatre/engine";

import { roomCue } from "../cues";
import { roundedBox } from "../lib/geom";
import { useLayout } from "../lib/layout";
import { cardboard, haloMaterial, mats, setOpacity } from "../lib/materials";
import { rng } from "../lib/canvas";
import { chartTexture, codeScreenTexture, friezeTexture, noteTexture, phoneAppTexture, rugTexture, tabletTexture, whiteboardTexture } from "../lib/paint";
import { clockTexture, plaqueTexture, wallpaperTexture } from "../lib/signs";
import { Instances, LiftPlatform, mx, SetShell, TrapDoor, trapCycle } from "./shell";

// ACT II — the apprenticeship. Four rooms, one at a time, each given the
// whole stage: the back wall flies in, the furniture trucks on from both
// wings in mirror image, and the centrepiece comes up through the trap.

const WALL_Z = -4.0;
const WALL_W = 16;
const WALL_H = 8.2;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const smooth = (p: number) => p * p * (3 - 2 * p);

/** Night falls over the schoolroom halfway through its scene. */
export function schoolNightAt(t: number) {
  const c = roomCue(0);
  return smooth(seg(t, c.b + 0.8, c.b + 1.1)) * (1 - smooth(seg(t, c.c + 0.1, c.d)));
}

/** The desk lamp at home: where the practical light hangs, and how bright. */
export function homeLampAt(t: number) {
  const n = schoolNightAt(t);
  const rise = smooth(seg(t, roomCue(0).b + 0.8, roomCue(0).b + 1.2)) * (1 - smooth(seg(t, roomCue(0).c, roomCue(0).d)));
  return { k: n * rise, y: -2.2 * (1 - rise) };
}

/** The trap the desk at home comes up through (and goes back down). */
function homeTrap(t: number) {
  const c = roomCue(0);
  return trapCycle(t, c.b + 0.8, c.b + 1.2, c.c, c.d);
}

/* -------------------------------------------------------------------------- */
/* The frame every room shares                                                 */
/* -------------------------------------------------------------------------- */

function RoomShell({
  index,
  wall,
  pattern,
  wainscot,
  children,
  flown,
  left,
  right,
  centre,
  drop = 3.2,
  trap,
  dim,
}: {
  index: number;
  wall: string;
  pattern: "stripe" | "dot" | "diamond" | "check";
  wainscot: string;
  children?: ReactNode;
  flown?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  centre?: ReactNode;
  drop?: number;
  trap?: [number, number, number];
  /** darken the room's own walls (0 = as lit, 1 = black) */
  dim?: (t: number) => number;
}) {
  const m = mats();
  const room = ROOMS[index];
  const paper = useMemo(() => {
    const t = wallpaperTexture(wall, pattern);
    t.repeat.set(5, 2.6);
    return t;
  }, [wall, pattern]);
  const wainscotMat = useMemo(() => new THREE.MeshLambertMaterial({ color: wainscot }), [wainscot]);
  const paperMat = useMemo(() => new THREE.MeshLambertMaterial({ map: paper }), [paper]);
  const plaque = useMemo(() => plaqueTexture(room.number, room.company), [room]);

  const onFrame = (t: number) => {
    if (!dim) return;
    const k = 1 - dim(t);
    paperMat.color.setScalar(k);
    wainscotMat.color.set(wainscot).multiplyScalar(k);
  };

  return (
    <SetShell
      cue={roomCue(index)}
      left={left}
      right={right}
      centre={centre}
      drop={drop}
      trap={trap}
      onFrame={onFrame}
      flown={
        <>
          <mesh position={[0, WALL_H / 2, WALL_Z]} material={paperMat}>
            <planeGeometry args={[WALL_W, WALL_H]} />
          </mesh>
          <mesh position={[0, 0.6, WALL_Z + 0.04]} material={wainscotMat}>
            <boxGeometry args={[WALL_W, 1.2, 0.08]} />
          </mesh>
          <mesh position={[0, 1.22, WALL_Z + 0.09]} material={m.cream}>
            <boxGeometry args={[WALL_W, 0.07, 0.08]} />
          </mesh>
          <mesh position={[0, 6.05, WALL_Z + 0.05]} material={m.cream}>
            <boxGeometry args={[WALL_W, 0.12, 0.1]} />
          </mesh>
          {/* the nameplate */}
          <mesh position={[0, 6.55, WALL_Z + 0.08]}>
            <planeGeometry args={[2.6, 0.76]} />
            <meshLambertMaterial map={plaque} />
          </mesh>
          {flown}
        </>
      }
    >
      {children}
    </SetShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Room 1 — the schoolroom (and, after dark, the desk at home)                 */
/* -------------------------------------------------------------------------- */

const DESKS: [number, number][] = [
  [-2.3, -2.0],
  [-4.7, -2.0],
  [-2.3, -0.3],
  [-4.7, -0.3],
];

function Schoolroom() {
  const stage = useStage();
  const m = mats();
  const board = useMemo(() => whiteboardTexture(), []);
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({ map: codeScreenTexture(3), toneMapped: false }), []);
  const deskMat = cardboard("#f2dcb4");
  const sideMat = cardboard("#d9b98a");
  const chairMat = cardboard("#7fb5b3");
  const laptopMat = cardboard("#aab2b6");
  const paneMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#cfe6ee", toneMapped: false }), []);
  const moonMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#fff4d6", transparent: true, opacity: 0, toneMapped: false }), []);
  const lampHalo = useMemo(() => haloMaterial("#ffd494", 0), []);
  const bulb = useMemo(() => new THREE.MeshBasicMaterial({ color: "#fff1cf", toneMapped: false }), []);
  const warmScreen = useMemo(() => new THREE.MeshBasicMaterial({ map: codeScreenTexture(9, true), toneMapped: false }), []);
  const home = useRef<THREE.Group>(null);

  // every piece is a slab of card: desks stand on two side panels, chairs on
  // two side panels and a pair of back legs that run up into the backrest
  const geo = useMemo(
    () => ({
      top: new THREE.BoxGeometry(1.5, 0.06, 0.72),
      side: new THREE.BoxGeometry(0.05, 0.74, 0.64),
      modesty: new THREE.BoxGeometry(1.3, 0.34, 0.03),
      base: new THREE.BoxGeometry(0.4, 0.03, 0.28),
      lid: new THREE.BoxGeometry(0.4, 0.27, 0.02),
      screen: new THREE.PlaneGeometry(0.36, 0.23),
      seat: new THREE.BoxGeometry(0.46, 0.045, 0.42),
      chairSide: new THREE.BoxGeometry(0.035, 0.45, 0.38),
      post: new THREE.BoxGeometry(0.04, 0.92, 0.04),
      back: new THREE.BoxGeometry(0.46, 0.3, 0.03),
    }),
    [],
  );
  // the class: four desks a side, every one with a laptop (instanced, and the
  // right-hand side of the room is the mirror image of the left)
  const inst = useMemo(() => {
    const tops: THREE.Matrix4[] = [];
    const sides: THREE.Matrix4[] = [];
    const modesty: THREE.Matrix4[] = [];
    const bases: THREE.Matrix4[] = [];
    const lids: THREE.Matrix4[] = [];
    const screens: THREE.Matrix4[] = [];
    const seats: THREE.Matrix4[] = [];
    const chairSides: THREE.Matrix4[] = [];
    const posts: THREE.Matrix4[] = [];
    const backs: THREE.Matrix4[] = [];
    for (const [x, z] of DESKS) {
      tops.push(mx(x, 0.77, z));
      sides.push(mx(x - 0.66, 0.37, z), mx(x + 0.66, 0.37, z));
      modesty.push(mx(x, 0.55, z - 0.28));
      bases.push(mx(x, 0.815, z + 0.08));
      lids.push(mx(x, 0.95, z - 0.07, -0.2));
      screens.push(mx(x, 0.95, z - 0.07, -0.2).multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.012)));
      const cz = z + 0.62;
      seats.push(mx(x, 0.47, cz));
      chairSides.push(mx(x - 0.2, 0.225, cz - 0.02), mx(x + 0.2, 0.225, cz - 0.02));
      posts.push(mx(x - 0.2, 0.46, cz + 0.2), mx(x + 0.2, 0.46, cz + 0.2));
      backs.push(mx(x, 0.76, cz + 0.2));
    }
    return { tops, sides, modesty, bases, lids, screens, seats, chairSides, posts, backs };
  }, []);

  useFrame(() => {
    const t = stage.t;
    const n = schoolNightAt(t);
    paneMat.color.setRGB(0.81, 0.9, 0.93).lerp(new THREE.Color(0.1, 0.13, 0.26), n);
    setOpacity(moonMat, n);
    screenMat.color.setScalar(1 - n * 0.9);
    const lamp = homeLampAt(t);
    if (home.current) {
      home.current.visible = lamp.y > -2.19;
      home.current.position.y = lamp.y;
    }
    setOpacity(lampHalo, lamp.k * 0.85);
    bulb.color.setRGB(1, 0.94, 0.8).multiplyScalar(0.4 + lamp.k * 0.8);
  });

  const windows = (
    <>
      {[-5.3, 5.3].map((x) => (
        <group key={x} position={[x, 3.3, WALL_Z + 0.06]}>
          <mesh material={m.cream}>
            <boxGeometry args={[1.9, 2.5, 0.1]} />
          </mesh>
          <mesh position={[0, 0, 0.06]} material={paneMat}>
            <planeGeometry args={[1.62, 2.22]} />
          </mesh>
          <mesh position={[0, 0, 0.08]} material={m.cream}>
            <boxGeometry args={[0.07, 2.22, 0.03]} />
          </mesh>
          <mesh position={[0, 0.2, 0.08]} material={m.cream}>
            <boxGeometry args={[1.62, 0.07, 0.03]} />
          </mesh>
          <mesh position={[x < 0 ? 0.42 : -0.42, 0.7, 0.07]} material={moonMat}>
            <circleGeometry args={[0.16, 24]} />
          </mesh>
        </group>
      ))}
    </>
  );

  return (
    <RoomShell
      index={0}
      dim={(t) => schoolNightAt(t) * 0.6}
      wall="#b9d3c6"
      pattern="stripe"
      wainscot="#6f927f"
      flown={
        <>
          {/* the whiteboard, and the clock above it */}
          <group position={[0, 3.4, WALL_Z + 0.08]}>
            <mesh material={m.steel}>
              <boxGeometry args={[4.6, 2.3, 0.06]} />
            </mesh>
            <mesh position={[0, 0, 0.035]}>
              <planeGeometry args={[4.42, 2.14]} />
              <meshBasicMaterial map={board} toneMapped={false} color="#e9e9e4" />
            </mesh>
            <mesh position={[0, -1.2, 0.1]} material={m.steel}>
              <boxGeometry args={[4.2, 0.05, 0.16]} />
            </mesh>
            {["#1f4fa3", "#b8232e", "#2c7a4b"].map((c, i) => (
              <mesh key={c} position={[1.2 + i * 0.22, -1.15, 0.12]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.025, 0.025, 0.16, 8]} />
                <meshLambertMaterial color={c} />
              </mesh>
            ))}
          </group>
          <group position={[0, 5.35, WALL_Z + 0.1]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={m.blackMetal}>
              <cylinderGeometry args={[0.36, 0.36, 0.06, 32]} />
            </mesh>
            <mesh position={[0, 0, 0.035]} material={m.cream}>
              <circleGeometry args={[0.31, 32]} />
            </mesh>
            <mesh position={[0, 0.08, 0.05]} material={m.ink}>
              <boxGeometry args={[0.025, 0.18, 0.01]} />
            </mesh>
            <mesh position={[0.08, 0, 0.05]} rotation={[0, 0, -Math.PI / 2]} material={m.ink}>
              <boxGeometry args={[0.02, 0.16, 0.01]} />
            </mesh>
          </group>
          {windows}
        </>
      }
      centre={
        <group ref={home} position={[0, -2.2, 0.55]} visible={false}>
          <LiftPlatform w={2.1} d={2.0} z={0.35} />
          {/* the desk at home: a lamp, a laptop, the books, a cold coffee */}
          <mesh position={[0, 0.76, 0]} material={cardboard("#c79a6b")}>
            <boxGeometry args={[1.7, 0.07, 0.8]} />
          </mesh>
          {[-0.78, 0.78].map((x) => (
            <mesh key={x} position={[x, 0.37, 0]} material={cardboard("#b4875a")}>
              <boxGeometry args={[0.07, 0.74, 0.72]} />
            </mesh>
          ))}
          <group position={[0, 0.8, 0.05]}>
            <mesh position={[0, 0.012, 0.08]} material={laptopMat}>
              <boxGeometry args={[0.42, 0.025, 0.28]} />
            </mesh>
            <group position={[0, 0.14, -0.07]} rotation={[-0.2, 0, 0]}>
              <mesh material={laptopMat}>
                <boxGeometry args={[0.42, 0.28, 0.02]} />
              </mesh>
              <mesh position={[0, 0, 0.012]} material={warmScreen}>
                <planeGeometry args={[0.38, 0.24]} />
              </mesh>
            </group>
          </group>
          {/* lamp, stage left; books and mug, stage right — near enough to mirror */}
          <group position={[-0.58, 0.8, -0.15]}>
            <mesh position={[0, 0.02, 0]} material={m.brass}>
              <cylinderGeometry args={[0.1, 0.12, 0.04, 20]} />
            </mesh>
            <mesh position={[0.08, 0.28, 0]} rotation={[0, 0, -0.35]} material={m.brass}>
              <cylinderGeometry args={[0.012, 0.012, 0.56, 6]} />
            </mesh>
            <mesh position={[0.22, 0.52, 0]} rotation={[0, 0, 0.6]} material={m.velvetTeal}>
              <coneGeometry args={[0.13, 0.18, 20, 1, true]} />
            </mesh>
            <mesh position={[0.26, 0.47, 0]} material={bulb}>
              <sphereGeometry args={[0.045, 12, 8]} />
            </mesh>
            <mesh position={[0.26, 0.45, 0.12]} material={lampHalo}>
              <planeGeometry args={[1.6, 1.6]} />
            </mesh>
          </group>
          <group position={[0.58, 0.8, -0.12]}>
            {["#a3232e", "#2f6a68", "#dcae45"].map((c, i) => (
              <mesh key={c} position={[0, 0.035 + i * 0.07, 0]} rotation={[0, i * 0.18 - 0.2, 0]}>
                <boxGeometry args={[0.36, 0.065, 0.26]} />
                <meshLambertMaterial color={c} />
              </mesh>
            ))}
            <mesh position={[0.02, 0.29, 0.2]} material={m.cream}>
              <cylinderGeometry args={[0.05, 0.045, 0.1, 16]} />
            </mesh>
          </group>
          <group position={[0, 0, 0.72]}>
            <mesh position={[0, 0.47, 0]} geometry={geo.seat} material={chairMat} />
            {[-0.2, 0.2].map((x) => (
              <group key={x}>
                <mesh position={[x, 0.225, -0.02]} geometry={geo.chairSide} material={chairMat} />
                <mesh position={[x, 0.46, 0.2]} geometry={geo.post} material={chairMat} />
              </group>
            ))}
            <mesh position={[0, 0.76, 0.2]} geometry={geo.back} material={chairMat} />
          </group>
        </group>
      }
      left={
        <group>
          <Instances geometry={geo.top} material={deskMat} matrices={inst.tops} />
          <Instances geometry={geo.side} material={sideMat} matrices={inst.sides} />
          <Instances geometry={geo.modesty} material={sideMat} matrices={inst.modesty} />
          <Instances geometry={geo.base} material={laptopMat} matrices={inst.bases} />
          <Instances geometry={geo.lid} material={laptopMat} matrices={inst.lids} />
          <Instances geometry={geo.screen} material={screenMat} matrices={inst.screens} />
          <Instances geometry={geo.seat} material={chairMat} matrices={inst.seats} />
          <Instances geometry={geo.chairSide} material={chairMat} matrices={inst.chairSides} />
          <Instances geometry={geo.post} material={chairMat} matrices={inst.posts} />
          <Instances geometry={geo.back} material={chairMat} matrices={inst.backs} />
        </group>
      }
    >
      <TrapDoor w={2.1} d={2.0} z={0.9} drive={homeTrap} />
    </RoomShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Room 2 — the motor works                                                    */
/* -------------------------------------------------------------------------- */

const roadVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const roadFrag = /* glsl */ `
uniform float time;
uniform float level;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  float hz = 0.47;
  vec3 col;
  if (uv.y > hz) {
    float k = (uv.y - hz) / (1.0 - hz);
    col = mix(vec3(0.98, 0.83, 0.66), vec3(0.58, 0.75, 0.84), pow(k, 0.7));
    float hill = hz + 0.06 + 0.025 * sin(abs(uv.x - 0.5) * 14.0) + 0.012 * sin(abs(uv.x - 0.5) * 41.0);
    if (uv.y < hill) col = vec3(0.6, 0.7, 0.56);
    float sun = smoothstep(0.075, 0.065, distance(uv * vec2(1.78, 1.0), vec2(0.89, hz + 0.16)));
    col = mix(col, vec3(1.0, 0.9, 0.68), sun);
  } else {
    float y = hz - uv.y;
    float z = 0.09 / max(y, 0.0015);
    float x = (uv.x - 0.5) * z * 3.2;
    float s = z + time * 9.0;
    col = mix(vec3(0.5, 0.64, 0.42), vec3(0.45, 0.59, 0.38), step(0.5, fract(s * 0.25)));
    float road = 1.7;
    if (abs(x) < road + 0.25) {
      // kerbs, red and white
      col = mix(vec3(0.86, 0.3, 0.3), vec3(0.95), step(0.5, fract(s * 0.5)));
    }
    if (abs(x) < road) {
      col = vec3(0.33, 0.33, 0.35);
      if (abs(x) < 0.06 && fract(s * 0.35) < 0.5) col = vec3(0.97, 0.92, 0.74);
    }
    col = mix(col, vec3(0.9, 0.82, 0.7), smoothstep(0.08, 0.0, y) * 0.55);
  }
  float v = smoothstep(0.85, 0.25, distance(uv, vec2(0.5)));
  col *= (0.78 + 0.22 * v) * (0.97 + 0.03 * sin(time * 50.0)) * level;
  gl_FragColor = vec4(col, 1.0);
}`;

/** A motor car, seen more or less head on. Built from a handful of shared parts. */
function useCarKit() {
  return useMemo(() => {
    const side = new THREE.Shape();
    // profile in (z, y): tail at −2.1, nose at +2.1
    side.moveTo(-2.1, 0.32);
    side.lineTo(-2.1, 0.92);
    side.quadraticCurveTo(-2.05, 1.05, -1.8, 1.06);
    side.lineTo(1.35, 1.02);
    side.quadraticCurveTo(2.05, 0.98, 2.12, 0.78);
    side.lineTo(2.12, 0.32);
    side.closePath();
    const body = new THREE.ExtrudeGeometry(side, { depth: 1.76, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3, curveSegments: 8 });
    body.translate(0, 0, -0.88);
    body.rotateY(-Math.PI / 2);
    const cab = new THREE.Shape();
    cab.moveTo(-1.55, 0.98);
    cab.lineTo(-1.25, 1.56);
    cab.quadraticCurveTo(-1.15, 1.62, -0.9, 1.62);
    cab.lineTo(0.25, 1.6);
    cab.quadraticCurveTo(0.45, 1.58, 0.55, 1.5);
    cab.lineTo(1.05, 0.98);
    cab.closePath();
    const cabin = new THREE.ExtrudeGeometry(cab, { depth: 1.46, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 6 });
    cabin.translate(0, 0, -0.73);
    cabin.rotateY(-Math.PI / 2);
    return {
      body,
      cabin,
      roof: roundedBox(1.56, 0.08, 1.5, 0.04),
      wheel: new THREE.CylinderGeometry(0.36, 0.36, 0.26, 24),
      hub: new THREE.CylinderGeometry(0.19, 0.19, 0.28, 16),
      lamp: roundedBox(0.42, 0.2, 0.06, 0.08),
      grille: roundedBox(0.8, 0.22, 0.05, 0.06),
      badge: new THREE.CircleGeometry(0.1, 24),
      plate: new THREE.PlaneGeometry(0.52, 0.12),
    };
  }, []);
}

function Car({ paint, lampMat }: { paint: THREE.Material; lampMat: THREE.Material }) {
  const m = mats();
  const kit = useCarKit();
  return (
    <group>
      <mesh geometry={kit.body} material={paint} />
      <mesh geometry={kit.cabin} material={cardboard("#3b4a4f", { plain: true })} />
      <mesh geometry={kit.roof} material={paint} position={[0, 1.64, -0.42]} />
      {[-0.86, 0.86].map((x) =>
        [-1.35, 1.35].map((z) => (
          <group key={`${x}${z}`} position={[x, 0.36, z]} rotation={[0, 0, Math.PI / 2]}>
            <mesh geometry={kit.wheel} material={m.ink} />
            <mesh geometry={kit.hub} material={m.steel} />
          </group>
        )),
      )}
      {/* the face: two lamps, a grille, a badge */}
      {[-0.58, 0.58].map((x) => (
        <mesh key={x} geometry={kit.lamp} material={lampMat} position={[x, 0.78, 2.18]} />
      ))}
      <mesh geometry={kit.grille} material={cardboard("#3b4a4f", { plain: true })} position={[0, 0.56, 2.18]} />
      <mesh geometry={kit.badge} material={m.steel} position={[0, 0.8, 2.22]} />
      <mesh geometry={kit.plate} material={m.cream} position={[0, 0.4, 2.23]} />
    </group>
  );
}

function Motors() {
  const stage = useStage();
  const m = mats();
  const screen = useRef<THREE.Group>(null);
  const film = useRef<THREE.Mesh>(null);
  const hero = useRef<THREE.Group>(null);
  const road = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: roadVert, fragmentShader: roadFrag, uniforms: { time: { value: 0 }, level: { value: 0 } }, toneMapped: false }),
    [],
  );
  const paints = { side: cardboard("#9fcde0", { plain: true }), hero: cardboard("#ec6a5c", { plain: true }) };
  const lamps = useMemo(() => new THREE.MeshBasicMaterial({ color: "#fff3d6", toneMapped: false }), []);
  const cue = roomCue(1);

  useFrame(() => {
    const t = stage.t;
    if (t < cue.a - 0.02 || t > cue.d + 0.02) return;
    // the screen unrolls from its batten, then the film runs
    const unroll = smooth(seg(t, cue.b - 0.1, cue.b + 0.35)) * (1 - smooth(seg(t, cue.c - 0.2, cue.c + 0.2)));
    if (screen.current) screen.current.scale.y = Math.max(0.001, unroll);
    const level = smooth(seg(unroll, 0.7, 1));
    const u = film.current ? (film.current.material as THREE.ShaderMaterial).uniforms : null;
    if (u) {
      u.time.value = performance.now() / 1000;
      u.level.value = level;
    }
    // the hero car idles as the road runs past it
    if (hero.current) hero.current.position.y = Math.sin(performance.now() / 55) * 0.006 * level;
  });

  return (
    <RoomShell
      index={1}
      trap={[3.1, 5.1, 0.4]}
      wall="#f0c9a8"
      pattern="dot"
      wainscot="#b98a6a"
      flown={
        <group position={[0, 5.85, WALL_Z + 0.35]}>
          {/* the batten; the screen hangs from it */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={m.blackMetal}>
            <cylinderGeometry args={[0.07, 0.07, 7.6, 12]} />
          </mesh>
          <group ref={screen} scale={[1, 0.001, 1]}>
            <mesh ref={film} position={[0, -2.05, 0]} material={road}>
              <planeGeometry args={[7.1, 3.99]} />
            </mesh>
            <mesh position={[0, -4.08, 0]} rotation={[0, 0, Math.PI / 2]} material={m.blackMetal}>
              <cylinderGeometry args={[0.04, 0.04, 7.2, 8]} />
            </mesh>
          </group>
        </group>
      }
      left={
        <group position={[-4.5, 0, -1.2]} rotation={[0, 0.5, 0]}>
          <mesh position={[0, 0.08, 0]} material={cardboard("#e9dcc4")}>
            <cylinderGeometry args={[2.3, 2.4, 0.16, 48]} />
          </mesh>
          <group position={[0, 0.16, 0]} scale={0.82}>
            <Car paint={paints.side} lampMat={lamps} />
          </group>
        </group>
      }
      centre={
        <group position={[0, 0, 0.4]}>
          <mesh position={[0, 0.05, 0]} material={cardboard("#4a4f52")}>
            <boxGeometry args={[2.8, 0.1, 4.8]} />
          </mesh>
          <group ref={hero} scale={0.9}>
            <group position={[0, 0.1, 0]}>
              <Car paint={paints.hero} lampMat={lamps} />
            </group>
          </group>
        </group>
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Room 3 — the bank                                                           */
/* -------------------------------------------------------------------------- */

interface Drop {
  x: number;
  z: number;
  v: number;
  off: number;
  spin: number;
}

/** Pairs of falling things, mirrored across the centre line. */
function drops(n: number, seed: number): Drop[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const x = 0.4 + r() * 6.4;
    return { x: i % 2 ? x : -x, z: -3.2 + r() * 4.2, v: 0.55 + r() * 0.5, off: r() * 9, spin: 1 + r() * 3 };
  });
}

const SCRATCH = new THREE.Object3D();

/** Move every note (or coin) one frame further down. */
function rain(im: THREE.InstancedMesh | null, list: Drop[], now: number, k: number, flutter: boolean) {
  if (!im) return;
  im.visible = k > 0.01;
  if (!im.visible) return;
  list.forEach((p, i) => {
    const y = 8.5 - ((now * p.v + p.off) % 9);
    const sway = flutter ? Math.sin(now * 1.7 + p.off) * 0.35 : 0;
    SCRATCH.position.set(p.x + sway * Math.sign(p.x), y, p.z);
    SCRATCH.rotation.set(now * p.spin * (flutter ? 0.6 : 1), (flutter ? now * 0.7 : 0) * Math.sign(p.x), flutter ? Math.sin(now + p.off) * 0.8 : now * p.spin);
    SCRATCH.scale.setScalar(k);
    SCRATCH.updateMatrix();
    im.setMatrixAt(i, SCRATCH.matrix);
  });
  im.instanceMatrix.needsUpdate = true;
}

function MoneyRain() {
  const stage = useStage();
  const { tier } = useLayout();
  const notes = useRef<THREE.InstancedMesh>(null);
  const coins = useRef<THREE.InstancedMesh>(null);
  const noteMat = useMemo(() => new THREE.MeshBasicMaterial({ map: noteTexture(), side: THREE.DoubleSide, color: "#e6e2d6" }), []);
  const noteGeo = useMemo(() => new THREE.PlaneGeometry(0.46, 0.23), []);
  const coinGeo = useMemo(() => new THREE.CylinderGeometry(0.11, 0.11, 0.02, 18), []);
  const nN = tier === "high" ? 44 : 24;
  const nC = tier === "high" ? 30 : 16;
  const seeds = useMemo(() => ({ notes: drops(nN, 7), coins: drops(nC, 19) }), [nN, nC]);
  const cue = roomCue(2);

  useFrame(() => {
    const t = stage.t;
    if (t < cue.a || t > cue.d) return;
    const now = performance.now() / 1000;
    const k = smooth(seg(t, cue.b - 0.2, cue.b + 0.3)) * (1 - smooth(seg(t, cue.c, cue.d)));
    rain(notes.current, seeds.notes, now, k, true);
    rain(coins.current, seeds.coins, now, k, false);
  });
  const m = mats();
  return (
    <group>
      <instancedMesh ref={notes} args={[noteGeo, noteMat, nN]} frustumCulled={false} visible={false} />
      <instancedMesh ref={coins} args={[coinGeo, m.gold, nC]} frustumCulled={false} visible={false} />
    </group>
  );
}

function Bank() {
  const stage = useStage();
  const m = mats();
  const frieze = useMemo(() => friezeTexture("THE BANK", "EST. MMXXIII · IN TRUST WE AUDIT"), []);
  const stone = cardboard("#f4e9d4");
  const tube = cardboard("#fbf3e3", { plain: true });
  const wheel = useRef<THREE.Group>(null);
  const pediment = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-4.8, 0);
    s.lineTo(0, 1.25);
    s.lineTo(4.8, 0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: false });
    g.translate(0, 0, -0.2);
    return g;
  }, []);
  const coinGeo = useMemo(() => new THREE.CylinderGeometry(0.16, 0.16, 0.045, 20), []);
  const stacks = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    const heights = [9, 14, 6, 11, 17, 8];
    [-3.1, -3.55, -4.3, -4.75, -5.5, -5.95].forEach((x, i) => {
      const z = -0.6 - (i % 2) * 0.45;
      for (let c = 0; c < heights[i]; c++) {
        const jitter = ((c * 7 + i * 3) % 5) * 0.004;
        out.push(mx(x + jitter, 0.03 + c * 0.047, z));
      }
    });
    return out;
  }, []);
  const cue = roomCue(2);
  useFrame(() => {
    const t = stage.t;
    if (t < cue.a || t > cue.d) return;
    if (wheel.current) wheel.current.rotation.z = t * 1.6;
  });
  const columns = [-4.1, -2.9, -1.7, 1.7, 2.9, 4.1];
  return (
    <RoomShell
      index={2}
      wall="#d9c3e0"
      pattern="diamond"
      wainscot="#8f7596"
      flown={
        <group position={[0, 0, WALL_Z + 0.5]}>
          {/* entablature, frieze and pediment */}
          <mesh position={[0, 4.62, 0]} material={stone}>
            <boxGeometry args={[9.8, 0.62, 0.6]} />
          </mesh>
          <mesh position={[0, 4.62, 0.31]}>
            <planeGeometry args={[9.2, 0.5]} />
            <meshLambertMaterial map={frieze} />
          </mesh>
          <mesh position={[0, 4.98, 0]} material={m.cream}>
            <boxGeometry args={[10.2, 0.12, 0.72]} />
          </mesh>
          <mesh geometry={pediment} position={[0, 5.04, 0]} material={cardboard("#f4e9d4", { plain: true })} />
          <mesh position={[0, 5.5, 0.22]} material={m.gold}>
            <circleGeometry args={[0.32, 32]} />
          </mesh>
        </group>
      }
      centre={
        <group position={[0, 0, WALL_Z + 0.5]}>
          {/* steps */}
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.09 + i * 0.18, 0.9 - i * 0.3]} material={stone}>
              <boxGeometry args={[10 - i * 0.5, 0.18, 1.2]} />
            </mesh>
          ))}
          {columns.map((x) => (
            <group key={x} position={[x, 0.54, 0]}>
              <mesh position={[0, 0.1, 0]} material={stone}>
                <boxGeometry args={[0.72, 0.2, 0.72]} />
              </mesh>
              <mesh position={[0, 1.88, 0]} material={tube}>
                <cylinderGeometry args={[0.24, 0.28, 3.4, 20]} />
              </mesh>
              <mesh position={[0, 3.68, 0]} material={stone}>
                <boxGeometry args={[0.74, 0.22, 0.74]} />
              </mesh>
            </group>
          ))}
          {/* the vault door, between the middle columns */}
          <group position={[0, 2.35, -0.1]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={m.steel}>
              <cylinderGeometry args={[1.25, 1.25, 0.26, 48]} />
            </mesh>
            <mesh position={[0, 0, 0.14]} material={m.steel}>
              <torusGeometry args={[1.08, 0.06, 10, 48]} />
            </mesh>
            <group ref={wheel} position={[0, 0, 0.26]}>
              {[0, Math.PI / 3, (2 * Math.PI) / 3].map((a) => (
                <mesh key={a} rotation={[0, 0, a]} material={m.brass}>
                  <boxGeometry args={[0.09, 1.2, 0.07]} />
                </mesh>
              ))}
              <mesh rotation={[Math.PI / 2, 0, 0]} material={m.gold}>
                <cylinderGeometry args={[0.18, 0.18, 0.12, 20]} />
              </mesh>
            </group>
          </group>
        </group>
      }
      drop={5.2}
      trap={[10.4, 1.9, -3.1]}
      left={<Instances geometry={coinGeo} material={m.gold} matrices={stacks} />}
    >
      <MoneyRain />
    </RoomShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Room 4 — the clinic                                                         */
/* -------------------------------------------------------------------------- */

const ZONES = [
  { label: "Bulgaria", tz: "Europe/Sofia" },
  { label: "Spain", tz: "Europe/Madrid" },
  { label: "Sweden", tz: "Europe/Stockholm" },
];

function Clinic() {
  const stage = useStage();
  const m = mats();
  const faces = useMemo(() => ZONES.map((z) => clockTexture(z.label)), []);
  const tablet = useMemo(() => tabletTexture(), []);
  const hands = useRef<(THREE.Group | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const ringMat = useMemo(
    () => [0, 1, 2].map(() => new THREE.MeshBasicMaterial({ color: "#7fe0d6", transparent: true, depthWrite: false, toneMapped: false })),
    [],
  );
  const led = useMemo(() => new THREE.MeshBasicMaterial({ color: "#7fe0d6", toneMapped: false }), []);
  const formats = useMemo(
    () => ZONES.map((z) => new Intl.DateTimeFormat("en-GB", { timeZone: z.tz, hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" })),
    [],
  );
  const lastSec = useRef(-1);
  const leaf = useMemo(() => new THREE.MeshLambertMaterial({ color: "#5f8f62" }), []);
  const pot = cardboard("#d98a66", { plain: true });
  const chart = useMemo(() => chartTexture(), []);
  const rug = useMemo(() => rugTexture(), []);
  const phones = useMemo(() => [0, 1, 2].map((i) => new THREE.MeshBasicMaterial({ map: phoneAppTexture(i), toneMapped: false })), []);
  const glowWarm = useMemo(() => haloMaterial("#ffe9c2", 0.5), []);
  // the pharmacy cabinet's stock: boxes and bottles on three shelves (one side; mirrored)
  const stock = useMemo(() => {
    const boxes: THREE.Matrix4[] = [];
    const bottles: THREE.Matrix4[] = [];
    [0.98, 1.68, 2.38].forEach((y, row) => {
      for (let k = 0; k < 5; k++) {
        const x = -0.52 + k * 0.26;
        if ((k + row) % 2) boxes.push(mx(x, y + 0.13, 0, 0, 0, 0, [1, 1 + ((k * 3 + row) % 3) * 0.2, 1]));
        else bottles.push(mx(x, y + 0.12, 0.02));
      }
    });
    return { boxes, bottles };
  }, []);
  const stockGeo = useMemo(() => ({ box: new THREE.BoxGeometry(0.2, 0.24, 0.2), bottle: new THREE.CylinderGeometry(0.07, 0.07, 0.24, 12) }), []);
  const amber = useMemo(() => new THREE.MeshLambertMaterial({ color: "#c98f2e" }), []);
  const cue = roomCue(3);

  useFrame(() => {
    const t = stage.t;
    if (t < cue.a || t > cue.d) return;
    // real time, in each of the team's three countries
    const now = new Date();
    const sec = now.getSeconds();
    if (sec !== lastSec.current) {
      lastSec.current = sec;
      formats.forEach((f, i) => {
        const g = hands.current[i];
        if (!g) return;
        const parts = Object.fromEntries(f.formatToParts(now).map((p) => [p.type, p.value]));
        const h = +parts.hour % 12;
        const mi = +parts.minute;
        (g.children[0] as THREE.Object3D).rotation.z = -((h + mi / 60) / 12) * Math.PI * 2;
        (g.children[1] as THREE.Object3D).rotation.z = -(mi / 60) * Math.PI * 2;
        (g.children[2] as THREE.Object3D).rotation.z = -(sec / 60) * Math.PI * 2;
      });
    }
    const beat = performance.now() / 1000;
    rings.current.forEach((r, i) => {
      if (!r) return;
      const k = (beat * 0.6 + i / 3) % 1;
      r.scale.setScalar(0.4 + k * 2.2);
      setOpacity(ringMat[i], (1 - k) * 0.85);
    });
  });

  const hand = (w: number, l: number, color: string) => (
    <mesh>
      <boxGeometry args={[w, l, 0.01]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );

  return (
    <RoomShell
      index={3}
      trap={[3.7, 3.8, -0.35]}
      wall="#c9e2d6"
      pattern="check"
      wainscot="#f4f1ea"
      flown={
        <>
          {ZONES.map((z, i) => (
            <group key={z.tz} position={[(i - 1) * 3.0, 4.15, WALL_Z + 0.08]} scale={1.3}>
              <mesh material={m.brass} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.62, 0.62, 0.08, 40]} />
              </mesh>
              <mesh position={[0, 0, 0.05]}>
                <circleGeometry args={[0.56, 40]} />
                <meshLambertMaterial map={faces[i]} />
              </mesh>
              <group ref={(g) => void (hands.current[i] = g)} position={[0, 0, 0.07]}>
                <group>
                  <group position={[0, 0.14, 0]}>{hand(0.04, 0.3, "#1b1110")}</group>
                </group>
                <group>
                  <group position={[0, 0.2, 0.002]}>{hand(0.028, 0.42, "#1b1110")}</group>
                </group>
                <group>
                  <group position={[0, 0.18, 0.004]}>{hand(0.012, 0.46, "#b8232e")}</group>
                </group>
              </group>
            </group>
          ))}
          {/* a framed chart either side, above the cabinets */}
          {[-4.3, 4.3].map((x) => (
            <group key={x} position={[x, 4.35, WALL_Z + 0.08]}>
              <mesh material={m.goldDull}>
                <boxGeometry args={[1.0, 1.24, 0.05]} />
              </mesh>
              <mesh position={[0, 0, 0.03]}>
                <planeGeometry args={[0.84, 1.06]} />
                <meshLambertMaterial map={chart} />
              </mesh>
            </group>
          ))}
          {/* two pendant lamps over the centre */}
          {[-2.0, 2.0].map((x) => (
            <group key={x} position={[x, 6.4, -1.4]}>
              <mesh position={[0, -1.1, 0]} material={m.ink}>
                <cylinderGeometry args={[0.008, 0.008, 2.2, 4]} />
              </mesh>
              <mesh position={[0, -2.3, 0]} material={cardboard("#f4f1ea", { plain: true })}>
                <sphereGeometry args={[0.32, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              </mesh>
              <mesh position={[0, -2.33, 0]} material={m.bulb}>
                <sphereGeometry args={[0.07, 10, 8]} />
              </mesh>
              <mesh position={[0, -2.45, 0.2]} material={glowWarm}>
                <planeGeometry args={[1.4, 1.4]} />
              </mesh>
            </group>
          ))}
        </>
      }
      left={
        <group>
          {/* a pharmacy cabinet against the wall, open shelves, well stocked */}
          <group position={[-4.3, 0, WALL_Z + 0.4]}>
            <mesh position={[0, 1.35, -0.02]} material={cardboard("#8fc4b4")}>
              <boxGeometry args={[1.55, 2.7, 0.5]} />
            </mesh>
            <mesh position={[0, 1.45, 0.23]} material={cardboard("#e7f2ec")}>
              <boxGeometry args={[1.35, 2.2, 0.02]} />
            </mesh>
            {[0.98, 1.68, 2.38].map((y) => (
              <mesh key={y} position={[0, y, 0.33]} material={cardboard("#f4f1ea")}>
                <boxGeometry args={[1.4, 0.04, 0.24]} />
              </mesh>
            ))}
            <mesh position={[0, 2.78, 0.02]} material={cardboard("#f4f1ea")}>
              <boxGeometry args={[1.7, 0.12, 0.6]} />
            </mesh>
            <group position={[0, 0, 0.33]}>
              <Instances geometry={stockGeo.box} material={cardboard("#fbf8f1")} matrices={stock.boxes} />
              <Instances geometry={stockGeo.bottle} material={amber} matrices={stock.bottles} />
            </group>
            <mesh position={[0, 0.4, 0.26]} material={cardboard("#7ab2a2")}>
              <boxGeometry args={[1.35, 0.6, 0.04]} />
            </mesh>
          </group>
          {/* the device lab: a desk of test phones, all running the app */}
          <group position={[-2.95, 0, -0.9]}>
            <mesh position={[0, 0.78, 0]} material={cardboard("#f1ece2")}>
              <boxGeometry args={[1.45, 0.06, 0.7]} />
            </mesh>
            {[-0.66, 0.66].map((x) => (
              <mesh key={x} position={[x, 0.38, 0]} material={cardboard("#d9d2c4")}>
                <boxGeometry args={[0.05, 0.76, 0.62]} />
              </mesh>
            ))}
            <mesh position={[0, 0.86, -0.08]} rotation={[-0.35, 0, 0]} material={cardboard("#e7d7b8")}>
              <boxGeometry args={[1.1, 0.06, 0.26]} />
            </mesh>
            {[-0.36, 0, 0.36].map((x, i) => (
              <group key={x} position={[x, 1.02, -0.12]} rotation={[-0.35, 0, 0]}>
                <mesh geometry={roundedBox(0.17, 0.33, 0.02, 0.03)} material={m.ink} />
                <mesh position={[0, 0, 0.012]} material={phones[i]}>
                  <planeGeometry args={[0.15, 0.3]} />
                </mesh>
              </group>
            ))}
          </group>
          <group position={[-5.9, 0, -1.1]}>
            <mesh position={[0, 0.35, 0]} material={pot}>
              <cylinderGeometry args={[0.32, 0.24, 0.7, 20]} />
            </mesh>
            {[
              [0, 1.25, 0, 0.55],
              [-0.22, 1.7, 0.05, 0.4],
              [0.2, 1.95, -0.05, 0.36],
            ].map(([x, y, z, r], i) => (
              <mesh key={i} position={[x, y, z]} material={leaf}>
                <sphereGeometry args={[r, 14, 10]} />
              </mesh>
            ))}
          </group>
        </group>
      }
      centre={
        <group>
          {/* the tablet on its easel */}
          <group position={[0, 0, -1.3]}>
            {[-0.5, 0.5].map((x) => (
              <mesh key={x} position={[x, 0.75, -0.2]} rotation={[0.25, 0, 0]} material={m.brass}>
                <cylinderGeometry args={[0.025, 0.025, 1.6, 8]} />
              </mesh>
            ))}
            <group position={[0, 1.85, 0]} rotation={[-0.14, 0, 0]}>
              <mesh geometry={roundedBox(2.3, 1.6, 0.07, 0.12)} material={m.ink} />
              <mesh position={[0, 0, 0.04]}>
                <planeGeometry args={[2.12, 1.45]} />
                <meshBasicMaterial map={tablet} toneMapped={false} />
              </mesh>
            </group>
          </group>
          <mesh position={[0, 0.006, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.4, 2.34]} />
            <meshLambertMaterial map={rug} />
          </mesh>
          {/* the device on its plinth, talking to the tablet over Bluetooth */}
          <group position={[0, 0, 0.5]}>
            <mesh position={[0, 0.5, 0]} material={cardboard("#f7f3ea")}>
              <boxGeometry args={[0.8, 1.0, 0.8]} />
            </mesh>
            <mesh position={[0, 1.03, 0]} material={m.velvetTeal}>
              <boxGeometry args={[0.66, 0.06, 0.66]} />
            </mesh>
            <group position={[0, 1.2, 0]} scale={1.4}>
              <mesh material={m.cream}>
                <cylinderGeometry args={[0.2, 0.22, 0.09, 32]} />
              </mesh>
              <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} material={led}>
                <ringGeometry args={[0.12, 0.145, 32]} />
              </mesh>
              {/* radio waves, drawn the way a child would: rings, rippling out */}
              {[0, 1, 2].map((i) => (
                <mesh key={i} ref={(r) => void (rings.current[i] = r)} material={ringMat[i]} position={[0, 0.02, 0.05]}>
                  <ringGeometry args={[0.3, 0.33, 48]} />
                </mesh>
              ))}
            </group>
          </group>
        </group>
      }
    />
  );
}

export function Rooms() {
  return (
    <group>
      <Schoolroom />
      <Motors />
      <Bank />
      <Clinic />
    </group>
  );
}
