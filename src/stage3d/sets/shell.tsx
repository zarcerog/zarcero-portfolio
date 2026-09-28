"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";

import { useStage } from "@/theatre/engine";

import { mats } from "../lib/materials";

// How a set comes and goes, the way a real stage does it: the back cloth flies
// in from the grid, furniture trucks on from both wings in mirror image, the
// centrepiece rides up through a trap that stands open only while it travels.
// Nothing simply appears or vanishes.

export interface Cue {
  a: number;
  b: number;
  c: number;
  d: number;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const out3 = (p: number) => 1 - Math.pow(1 - p, 3);
const in3 = (p: number) => p * p * p;

/** How far a piece is in (1) or out (0); later pieces enter later and leave earlier. */
export function phaseOf(cue: Cue, t: number, delay = 0) {
  const inLen = cue.b - cue.a;
  const outLen = cue.d - cue.c;
  const pin = out3(seg(t, cue.a + inLen * delay * 0.5, cue.b + inLen * delay * 0.5));
  const pout = in3(seg(t, cue.c - outLen * delay * 0.3, cue.d - outLen * delay * 0.3));
  return pin * (1 - pout);
}

export const mx = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s: [number, number, number] = [1, 1, 1]) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(...s));

/** Place instances of one geometry from a list of matrices. */
export function Instances({
  geometry,
  material,
  matrices,
  colors,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
  /** optional per-instance tint */
  colors?: string[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    matrices.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true;
    if (colors) {
      const c = new THREE.Color();
      colors.forEach((hex, i) => im.setColorAt(i, c.set(hex)));
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
    im.computeBoundingSphere();
  }, [matrices, colors]);
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} frustumCulled={false} />;
}

export interface TrapState {
  /** 0 = lids shut … 1 = lids swung down out of the way */
  open: number;
  /** whether the shaft is showing at all */
  hole: boolean;
}

const smooth01 = (p: number) => p * p * (3 - 2 * p);
const ramp = (t: number, a: number, b: number) => smooth01(seg(t, a, b));
/** How long the lids take to swing, in beats. */
export const LID_BEATS = 0.14;

/**
 * The trap's choreography around a piece that rises over [up0, up1] and sinks
 * over [down0, down1]: the lids swing open just before it moves, the shaft
 * shows while it travels, and they swing shut after it has gone below.
 */
export function trapCycle(t: number, up0: number, up1: number, down0: number, down1: number): TrapState {
  if (t >= up0 - LID_BEATS && t < up1) return { open: ramp(t, up0 - LID_BEATS, up0), hole: true };
  if (t > down0 && t <= down1 + LID_BEATS) return { open: 1 - ramp(t, down1, down1 + LID_BEATS), hole: true };
  return { open: 0, hole: false };
}

/** Boards the size of the trap, matching the stage floor, for lids and lift platforms. */
export function useBoards(w: number, d: number) {
  const m = mats();
  return useMemo(() => {
    const map = m.woodMap.clone();
    map.repeat.set((w / 24) * 2.2, (d / 14.4) * 1.5);
    map.needsUpdate = true;
    return new THREE.MeshLambertMaterial({ map, color: "#c9a27e" });
  }, [m, w, d]);
}

/**
 * A trap in the stage floor. Its two lids slide apart and away under the
 * boards either side, uncovering the shaft from the middle outwards.
 */
export function TrapDoor({ w, d, z, x = 0, drive }: { w: number; d: number; z: number; x?: number; drive: (t: number) => TrapState }) {
  const stage = useStage();
  const m = mats();
  const root = useRef<THREE.Group>(null);
  const lids = useRef<(THREE.Group | null)[]>([]);
  const boards = useBoards(w / 2, d);
  useFrame(() => {
    const s = drive(stage.t);
    if (root.current) root.current.visible = s.hole;
    if (!s.hole) return;
    lids.current.forEach((g) => {
      if (!g) return;
      // each lid is anchored at its outer edge and retracts into it
      g.scale.x = Math.max(0.001, 1 - s.open);
      g.visible = s.open < 0.999;
    });
  });
  return (
    <group ref={root} position={[x, 0, z]} visible={false}>
      {/* the seam round the trap, and the dark shaft */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.darkWood}>
        <planeGeometry args={[w + 0.12, d + 0.12]} />
      </mesh>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.silhouette}>
        <planeGeometry args={[w, d]} />
      </mesh>
      {[-1, 1].map((sd, i) => (
        <group key={sd} ref={(g) => void (lids.current[i] = g)} position={[(sd * w) / 2, 0.006, 0]}>
          <mesh position={[(-sd * w) / 4, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={boards}>
            <planeGeometry args={[w / 2 - 0.02, d - 0.02]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** The lift's platform: the piece stands on it, and it becomes the floor when it arrives. */
export function LiftPlatform({ w, d, z, x = 0 }: { w: number; d: number; z: number; x?: number }) {
  const boards = useBoards(w, d);
  return (
    <mesh position={[x, -0.0165, z]} material={boards}>
      <boxGeometry args={[w, 0.04, d]} />
    </mesh>
  );
}

export function SetShell({
  cue,
  flown,
  left,
  right,
  centre,
  drop = 3.2,
  trap,
  wings = 11,
  onFrame,
  children,
}: {
  cue: Cue;
  /** flies in from the grid */
  flown?: ReactNode;
  /** trucked on from the left wing (mirrored for the right unless `right` is given) */
  left?: ReactNode;
  right?: ReactNode;
  /** rises through the trap */
  centre?: ReactNode;
  /** how far below the stage the centrepiece starts */
  drop?: number;
  /** the trap the centrepiece travels through: [width, depth, z] */
  trap?: [number, number, number];
  /** how far into the wings the side pieces go */
  wings?: number;
  /** extra per-frame work while the set is on */
  onFrame?: (t: number) => void;
  children?: ReactNode;
}) {
  const stage = useStage();
  const root = useRef<THREE.Group>(null);
  const back = useRef<THREE.Group>(null);
  const l = useRef<THREE.Group>(null);
  const r = useRef<THREE.Group>(null);
  const c = useRef<THREE.Group>(null);
  // the centrepiece moves over these windows (the same maths as phaseOf, delay 0.7)
  const inLen = cue.b - cue.a;
  const outLen = cue.d - cue.c;
  const up0 = cue.a + inLen * 0.35;
  const up1 = cue.b + inLen * 0.35;
  const down0 = cue.c - outLen * 0.21;
  const down1 = cue.d - outLen * 0.21;

  useFrame(() => {
    const t = stage.t;
    const g = root.current;
    if (!g) return;
    g.visible = t > cue.a - 0.02 && t < cue.d + 0.02;
    if (!g.visible) return;
    if (back.current) back.current.position.y = (1 - phaseOf(cue, t, 0)) * 10;
    const side = 1 - phaseOf(cue, t, 0.35);
    if (l.current) l.current.position.x = -side * wings;
    if (r.current) r.current.position.x = side * wings;
    const pc = phaseOf(cue, t, 0.7);
    if (c.current) c.current.position.y = -(1 - pc) * drop;
    onFrame?.(t);
  });

  return (
    <group ref={root} visible={false}>
      <group ref={back} position={[0, 10, 0]}>
        {flown}
      </group>
      <group ref={l} position={[-wings, 0, 0]}>
        {left}
      </group>
      <group ref={r} position={[wings, 0, 0]}>
        {right ?? <group scale={[-1, 1, 1]}>{left}</group>}
      </group>
      <group ref={c} position={[0, -drop, 0]}>
        {centre}
        {trap && <LiftPlatform w={trap[0]} d={trap[1]} z={trap[2]} />}
      </group>
      {trap && <TrapDoor w={trap[0]} d={trap[1]} z={trap[2]} drive={(t) => trapCycle(t, up0, up1, down0, down1)} />}
      {children}
    </group>
  );
}
