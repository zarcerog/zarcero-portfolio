"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { ACT_CARDS } from "@/theatre/content";
import { useStage } from "@/theatre/engine";

import { Q } from "../cues";
import { mats } from "../lib/materials";
import { actCardTexture, billingTexture } from "../lib/signs";

type Env = readonly [number, number, number, number];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const backOut = (p: number) => 1 + 2.35 * Math.pow(p - 1, 3) + 1.35 * Math.pow(p - 1, 2);
const easeIn = (p: number) => p * p * p;

/** Vertical offset of a flown piece: 0 in place, `away` up in the flies. */
export function fly(t: number, [a, b, c, d]: Env, away = 11) {
  if (t <= a || t >= d) return away;
  if (t < b) return away * (1 - backOut(clamp01((t - a) / (b - a))));
  if (t <= c) return 0;
  return away * easeIn(clamp01((t - c) / (d - c)));
}

/** A damped swing that starts when the piece lands. */
export function swing(t: number, since: number, amount = 0.05, freq = 9) {
  const k = Math.max(0, t - since);
  return amount * Math.exp(-k * 3.2) * Math.sin(k * freq);
}

function HangingCard({
  cue,
  texture,
  w,
  h,
  y,
  z,
}: {
  cue: Env;
  texture: THREE.Texture;
  w: number;
  h: number;
  y: number;
  z: number;
}) {
  const m = mats();
  const stage = useStage();
  const group = useRef<THREE.Group>(null);
  const materials = useMemo(() => {
    const face = new THREE.MeshLambertMaterial({ map: texture });
    return [m.paper, m.paper, m.paper, m.paper, face, m.paper];
  }, [m, texture]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = stage.t;
    const off = fly(t, cue);
    g.visible = off < 10.9;
    if (!g.visible) return;
    g.position.y = y + off;
    g.rotation.z = t < cue[2] ? swing(t, cue[1] - (cue[1] - cue[0]) * 0.2) : 0;
    g.rotation.x = t < cue[2] ? swing(t, cue[1], 0.03, 6) : 0;
  });

  return (
    <group ref={group} position={[0, y + 11, z]}>
      <mesh material={materials}>
        <boxGeometry args={[w, h, 0.04]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * w * 0.33, h / 2 + 6, 0]} material={m.ink}>
          <cylinderGeometry args={[0.008, 0.008, 12, 4]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * w * 0.33, h / 2 - 0.06, 0.03]} material={m.brass}>
          <torusGeometry args={[0.05, 0.015, 6, 16]} />
        </mesh>
      ))}
    </group>
  );
}

export function Cards() {
  const tex = useMemo(
    () => ({
      billing: billingTexture(),
      act1: actCardTexture(ACT_CARDS.act1),
      act2: actCardTexture(ACT_CARDS.act2),
      act3: actCardTexture(ACT_CARDS.act3),
      act4: actCardTexture(ACT_CARDS.act4),
      act5: actCardTexture(ACT_CARDS.act5),
    }),
    [],
  );
  const AW = 4.9;
  const AH = AW * (760 / 1200);
  return (
    <group>
      <HangingCard cue={Q.prologue.billing} texture={tex.billing} w={6.3} h={6.3 * (1000 / 1400)} y={4.25} z={0.7} />
      <HangingCard cue={Q.act1.card} texture={tex.act1} w={AW} h={AH} y={4.9} z={-0.9} />
      <HangingCard cue={Q.act2.card} texture={tex.act2} w={AW} h={AH} y={4.9} z={-0.9} />
      <HangingCard cue={Q.act3.card} texture={tex.act3} w={AW} h={AH} y={4.9} z={-0.9} />
      <HangingCard cue={Q.act4.card} texture={tex.act4} w={AW} h={AH} y={4.9} z={-0.9} />
      <HangingCard cue={Q.act5.card} texture={tex.act5} w={AW} h={AH} y={4.9} z={-0.9} />
    </group>
  );
}
