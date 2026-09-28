"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useStage } from "@/theatre/engine";

import { Q } from "../cues";
import { cardboard, haloMaterial, mats, setOpacity } from "../lib/materials";
import { posterTexture, type PosterSpec } from "../lib/paint";
import { signTexture, stageDoorTexture } from "../lib/signs";

// ACT V — the stage door. Not a flat on the stage this time: the audience is
// taken up onto the boards, into the wings, through the side door, along the
// corridor past the dressing rooms, to the stage door itself.

const C = Q.act5;
const seg = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const smooth = (p: number) => p * p * (3 - 2 * p);

/** The stage-door lamps: how bright (they're lit whenever the corridor is built). */
export function doorLampAt(t: number) {
  const k = seg(t, C.setIn[0], C.setIn[1]) * (1 - seg(t, C.setOut[0], C.setOut[1]));
  return { k, y: 0 };
}

/** Where the practical light hangs for the stage door (in the lobby, by the door). */
export const DOOR_LAMP: [number, number, number] = [29.1, 3.1, -2.2];

const WING_X = 9.5;
const CORR = { x0: 9.6, x1: 24, z: -2.2, w: 2.6, h: 3.1 };
const LOBBY = { x0: 24, x1: 30, z: -2.2, w: 9, h: 5.6 };

/** Bills from past productions, pasted either side of the door in mirror pairs. */
const POSTERS: PosterSpec[] = [
  { top: "Now showing", title: "Odonta", sub: "a clinic in three languages", bg: "#e9d7b5", fg: "#2b1a17", accent: "#6fa6a8", motif: "arch" },
  { top: "Held over", title: "Memoir", sub: "on music, buildings & type", bg: "#2f5e57", fg: "#f6ecd6", accent: "#e8b85c", motif: "sun" },
  { top: "Final week", title: "Campus", sub: "two fingers, no excuses", bg: "#a3232e", fg: "#f6ecd6", accent: "#f0c7b8", motif: "stripes" },
  { top: "Revival", title: "Memento", sub: "one photograph a day", bg: "#f0c7b8", fg: "#2b1a17", accent: "#a3232e", motif: "circle" },
];

/** The side wall of the stage-right wing, with its door. */
function WingWall({ leaf }: { leaf: React.Ref<THREE.Group> }) {
  const m = mats();
  const wall = cardboard("#4a4340");
  const sign = useMemo(() => signTexture("Stage door →"), []);
  const dz0 = CORR.z - 0.75;
  const dz1 = CORR.z + 0.75;
  const H = 6.5;
  return (
    <group position={[WING_X, 0, 0]}>
      <mesh position={[0, H / 2, (-9 + dz0) / 2]} material={wall}>
        <boxGeometry args={[0.2, H, dz0 + 9]} />
      </mesh>
      <mesh position={[0, H / 2, (dz1 + 0.2) / 2]} material={wall}>
        <boxGeometry args={[0.2, H, 0.2 - dz1]} />
      </mesh>
      <mesh position={[0, (2.6 + H) / 2, CORR.z]} material={wall}>
        <boxGeometry args={[0.2, H - 2.6, 1.5]} />
      </mesh>
      {/* frame, and the sign that says where it goes */}
      <mesh position={[-0.12, 2.65, CORR.z]} material={m.cream}>
        <boxGeometry args={[0.06, 0.12, 1.66]} />
      </mesh>
      {[dz0 - 0.04, dz1 + 0.04].map((z) => (
        <mesh key={z} position={[-0.12, 1.3, z]} material={m.cream}>
          <boxGeometry args={[0.06, 2.6, 0.1]} />
        </mesh>
      ))}
      <mesh position={[-0.13, 3.05, CORR.z]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.5, 0.5]} />
        <meshLambertMaterial map={sign} />
      </mesh>
      {/* the door leaf, hinged on its upstage edge; it swings away from us */}
      <group ref={leaf} position={[0, 0, dz0]}>
        <mesh position={[0, 1.29, 0.74]} material={cardboard("#6f2c2a")}>
          <boxGeometry args={[0.06, 2.56, 1.46]} />
        </mesh>
        <mesh position={[-0.05, 1.25, 1.3]} material={m.brass}>
          <sphereGeometry args={[0.045, 12, 8]} />
        </mesh>
      </group>
    </group>
  );
}

/** Where the dressing-room doors are, and the runs of wall between them. */
const DOORS_X = [0, 1, 2].map((k) => CORR.x0 + 3 + k * 4.6);
const DOOR_HALF = 0.6;
const RUNS: [number, number][] = (() => {
  const runs: [number, number][] = [];
  let x = CORR.x0;
  for (const d of DOORS_X) {
    runs.push([x, d - DOOR_HALF]);
    x = d + DOOR_HALF;
  }
  runs.push([x, CORR.x1]);
  return runs;
})();

/** The corridor: dressing-room doors in mirror image, caged lamps, pipes. */
function Corridor() {
  const m = mats();
  const bulb = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffe4b0", toneMapped: false }), []);
  const halo = useMemo(() => haloMaterial("#ffd49a", 0.55), []);
  const floorMap = useMemo(() => {
    const t = m.woodMap.clone();
    t.repeat.set(4, 0.8);
    t.needsUpdate = true;
    return t;
  }, [m]);
  const L = CORR.x1 - CORR.x0;
  const cx = (CORR.x0 + CORR.x1) / 2;
  const numbers = useMemo(() => [1, 2, 3, 4, 5, 6].map((n) => signTexture(`No. ${n}`)), []);
  return (
    <group>
      {/* floor, ceiling */}
      <mesh position={[cx, 0.01, CORR.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[L, CORR.w]} />
        <meshLambertMaterial map={floorMap} color="#b8906a" />
      </mesh>
      <mesh position={[cx, CORR.h, CORR.z]} rotation={[Math.PI / 2, 0, 0]} material={cardboard("#2b2624")}>
        <planeGeometry args={[L, CORR.w]} />
      </mesh>
      {/* two walls, mirror images: a green dado, cream above, doors every four metres */}
      {[-1, 1].map((sd) => {
        const z = CORR.z + (sd * CORR.w) / 2;
        return (
          <group key={sd}>
            <mesh position={[cx, CORR.h / 2, z]} rotation={[0, sd < 0 ? 0 : Math.PI, 0]} material={cardboard("#efe4cf")}>
              <planeGeometry args={[L, CORR.h]} />
            </mesh>
            {/* the dado and its rail stop at each door frame rather than run across it */}
            {RUNS.map(([x0, x1]) => (
              <group key={x0}>
                <mesh position={[(x0 + x1) / 2, 0.55, z - sd * 0.03]} material={cardboard("#2f5e57")}>
                  <boxGeometry args={[x1 - x0, 1.1, 0.04]} />
                </mesh>
                <mesh position={[(x0 + x1) / 2, 1.12, z - sd * 0.05]} material={m.cream}>
                  <boxGeometry args={[x1 - x0, 0.05, 0.06]} />
                </mesh>
              </group>
            ))}
            {DOORS_X.map((x, k) => {
              return (
                <group key={k} position={[x, 0, z - sd * 0.02]} rotation={[0, sd < 0 ? 0 : Math.PI, 0]}>
                  <mesh position={[0, 1.15, 0.03]} material={cardboard("#7a2c28")}>
                    <boxGeometry args={[1.0, 2.3, 0.04]} />
                  </mesh>
                  <mesh position={[0, 2.35, 0.04]} material={m.cream}>
                    <boxGeometry args={[1.16, 0.08, 0.06]} />
                  </mesh>
                  <mesh position={[0, 1.7, 0.06]}>
                    <planeGeometry args={[0.46, 0.15]} />
                    <meshLambertMaterial map={numbers[k * 2 + (sd < 0 ? 0 : 1)]} />
                  </mesh>
                  <mesh position={[0.36, 1.1, 0.08]} material={m.brass}>
                    <sphereGeometry args={[0.04, 10, 8]} />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}
      {/* pipes along the ceiling, and a caged lamp every few metres */}
      {[-0.7, 0.7].map((dz) => (
        <mesh key={dz} position={[cx, CORR.h - 0.15, CORR.z + dz]} rotation={[0, 0, Math.PI / 2]} material={m.blackMetal}>
          <cylinderGeometry args={[0.05, 0.05, L, 8]} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((k) => (
        <group key={k} position={[CORR.x0 + 1.4 + k * 3.2, CORR.h - 0.28, CORR.z]}>
          <mesh material={bulb}>
            <sphereGeometry args={[0.07, 10, 8]} />
          </mesh>
          <mesh material={m.blackMetal}>
            <torusGeometry args={[0.1, 0.008, 4, 12]} />
          </mesh>
          <mesh position={[-0.05, -0.1, 0]} rotation={[0, -Math.PI / 2, 0]} material={halo}>
            <planeGeometry args={[1.6, 1.6]} />
          </mesh>
        </group>
      ))}
      {/* the corridor opens into the lobby by the stage door */}
      <group>
        <mesh position={[(LOBBY.x0 + LOBBY.x1) / 2, 0.01, LOBBY.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[LOBBY.x1 - LOBBY.x0, LOBBY.w]} />
          <meshLambertMaterial map={floorMap} color="#b8906a" />
        </mesh>
        <mesh position={[(LOBBY.x0 + LOBBY.x1) / 2, LOBBY.h, LOBBY.z]} rotation={[Math.PI / 2, 0, 0]} material={cardboard("#2b2624")}>
          <planeGeometry args={[LOBBY.x1 - LOBBY.x0, LOBBY.w]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh position={[(LOBBY.x0 + LOBBY.x1) / 2, LOBBY.h / 2, LOBBY.z + (sd * LOBBY.w) / 2]} rotation={[0, sd < 0 ? 0 : Math.PI, 0]} material={m.brick}>
              <planeGeometry args={[LOBBY.x1 - LOBBY.x0, LOBBY.h]} />
            </mesh>
            {/* the lobby's front wall, either side of the corridor mouth */}
            <mesh position={[LOBBY.x0, LOBBY.h / 2, LOBBY.z + sd * (CORR.w / 2 + (LOBBY.w - CORR.w) / 4)]} rotation={[0, Math.PI / 2, 0]} material={m.brick}>
              <planeGeometry args={[(LOBBY.w - CORR.w) / 2, LOBBY.h]} />
            </mesh>
          </group>
        ))}
        <mesh position={[LOBBY.x0, (CORR.h + LOBBY.h) / 2, LOBBY.z]} rotation={[0, Math.PI / 2, 0]} material={m.brick}>
          <planeGeometry args={[CORR.w, LOBBY.h - CORR.h]} />
        </mesh>
      </group>
    </group>
  );
}

export function StageDoor() {
  const m = mats();
  const stage = useStage();
  const root = useRef<THREE.Group>(null);
  const leaf = useRef<THREE.Group>(null);
  const tex = useMemo(() => stageDoorTexture(), []);
  const green = useMemo(() => new THREE.MeshLambertMaterial({ color: "#2f5e57" }), []);
  const bulbMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffe0a8" }), []);
  const halo = useMemo(() => haloMaterial("#ffd08a", 0), []);
  const postRed = useMemo(() => new THREE.MeshLambertMaterial({ color: "#a3232e" }), []);
  const bills = useMemo(() => POSTERS.map((p) => new THREE.MeshLambertMaterial({ map: posterTexture(p) })), []);

  useFrame(() => {
    const t = stage.t;
    const on = t > C.setIn[0] - 0.02 && t < C.setOut[1] + 0.02;
    if (root.current) root.current.visible = on;
    if (!on) return;
    const d = doorLampAt(t);
    bulbMat.color.setRGB(1, 0.88, 0.66).multiplyScalar(0.4 + d.k * 0.8);
    setOpacity(halo, d.k * 0.7);
    // the wing door swings open just before we reach it
    if (leaf.current) leaf.current.rotation.y = smooth(seg(t, C.door[0], C.door[1])) * 1.75;
  });

  return (
    <group ref={root} visible={false}>
      <WingWall leaf={leaf} />
      <Corridor />
      {/* the stage door itself, on the far wall of the lobby, facing us */}
      <group position={[LOBBY.x1, 0, LOBBY.z]} rotation={[0, -Math.PI / 2, 0]}>
        <group position={[0, 0, 4.12]}>
          {/* a flat of brick with a recessed doorway */}
          <mesh position={[0, 3.2, -4.2]} material={m.brick}>
            <boxGeometry args={[9, 6.4, 0.3]} />
          </mesh>
          {/* the bills: a frieze of four above the door, pasted in mirror pairs */}
          {[-2.85, -0.95, 0.95, 2.85].map((x, i) => (
            <mesh key={x} position={[x, 4.3, -4.035]} rotation={[0, 0, (x < 0 ? 1 : -1) * 0.012]} material={bills[i]}>
              <planeGeometry args={[0.72, 1.08]} />
            </mesh>
          ))}
          {/* a stone step, and a boot-scraper's worth of cream trim */}
          <mesh position={[0, 0.07, -3.72]} material={m.cream}>
            <boxGeometry args={[2.7, 0.14, 0.5]} />
          </mesh>
          <mesh position={[0, 0.2, -4.03]} material={m.cream}>
            <boxGeometry args={[9, 0.4, 0.06]} />
          </mesh>
          <group position={[0, 0, -4.0]}>
            {/* frame */}
            <mesh position={[0, 2.75, 0]} material={m.cream}>
              <boxGeometry args={[2.2, 0.16, 0.2]} />
            </mesh>
            {[-1.02, 1.02].map((x) => (
              <mesh key={x} position={[x, 1.35, 0]} material={m.cream}>
                <boxGeometry args={[0.16, 2.7, 0.2]} />
              </mesh>
            ))}
            {/* the door itself, panelled */}
            <mesh position={[0, 1.33, 0.02]} material={green}>
              <boxGeometry args={[1.86, 2.62, 0.08]} />
            </mesh>
            {[
              [-0.42, 1.9],
              [0.42, 1.9],
              [-0.42, 0.7],
              [0.42, 0.7],
            ].map(([x, y], i) => (
              <mesh key={i} position={[x, y, 0.07]} material={green}>
                <boxGeometry args={[0.66, i < 2 ? 0.9 : 0.8, 0.03]} />
              </mesh>
            ))}
            {/* a pair of doors, a pair of handles */}
            <mesh position={[0, 1.33, 0.075]} material={m.ink}>
              <boxGeometry args={[0.02, 2.6, 0.02]} />
            </mesh>
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[sd * 0.12, 1.3, 0.12]} material={m.brass}>
                <sphereGeometry args={[0.05, 16, 12]} />
              </mesh>
            ))}
            {/* sign and lamp */}
            <mesh position={[0, 3.35, 0.05]}>
              <boxGeometry args={[2.4, 0.6, 0.05]} />
              <meshLambertMaterial attach="material-0" color="#1f1a1c" />
              <meshLambertMaterial attach="material-1" color="#1f1a1c" />
              <meshLambertMaterial attach="material-2" color="#1f1a1c" />
              <meshLambertMaterial attach="material-3" color="#1f1a1c" />
              <meshLambertMaterial attach="material-4" map={tex} />
              <meshLambertMaterial attach="material-5" color="#1f1a1c" />
            </mesh>
            {[-1, 1].map((sd) => (
              <group key={sd}>
                {/* a lamp either side */}
                <group position={[sd * 1.55, 3.1, 0.35]}>
                  <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]} material={m.blackMetal}>
                    <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
                  </mesh>
                  <mesh position={[0, 0.02, 0]} material={m.blackMetal}>
                    <coneGeometry args={[0.2, 0.18, 16, 1, true]} />
                  </mesh>
                  <mesh position={[0, -0.06, 0]} material={bulbMat}>
                    <sphereGeometry args={[0.06, 12, 8]} />
                  </mesh>
                  <mesh position={[0, -0.2, 0.1]} material={halo}>
                    <planeGeometry args={[1.8, 1.8]} />
                  </mesh>
                </group>
                {/* and a post box either side, because symmetry is not negotiable */}
                <group position={[sd * 1.95, 1.3, 0.25]}>
                  <mesh material={postRed}>
                    <boxGeometry args={[0.55, 0.75, 0.3]} />
                  </mesh>
                  <mesh position={[0, 0.18, 0.16]} material={m.ink}>
                    <boxGeometry args={[0.36, 0.05, 0.01]} />
                  </mesh>
                </group>
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}
