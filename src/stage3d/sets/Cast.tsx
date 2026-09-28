"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useStage } from "@/theatre/engine";

import { D, E, Q } from "../cues";
import { cardboard, mats, matcapTexture } from "../lib/materials";
import { chairBackTexture } from "../lib/paint";
import { signTexture } from "../lib/signs";
import { Instances, LiftPlatform, TrapDoor, trapCycle } from "./shell";

// The cast, recast as furniture. Nobody walks on; the objects carry the scenes:
// an empty director's chair behind a velvet rope for the Dramatis Personae,
// a stool and a script under the ghost light, and a fan of roses at the bow.

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const smooth = (p: number) => p * p * (3 - 2 * p);

/** 0 = below the stage … 1 = standing on it. */
function liftAt(t: number) {
  const [a, b, c, d] = Q.act1.personae;
  return smooth(seg(t, a - 0.1, b - 0.1)) * (1 - smooth(seg(t, c, d)));
}

/** When the roses are on stage (they land at the bow and stay for the credits). */
export const ROSES = [Q.finale.bow[0] - 0.15, Q.finale.bow[1], 47.6 + D + E, 48.4 + D + E] as const;

const Z_CHAIR = 0.6;
const Z_ROPE = 1.35;
const LIFT_DEPTH = 2.2;

function catenary(half: number, sag: number, n = 24) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const x = -half + (2 * half * i) / n;
    const u = x / half;
    pts.push(new THREE.Vector3(x, -sag * (1 - u * u), 0));
  }
  return new THREE.CatmullRomCurve3(pts);
}

/** A director's chair, the X-frame square to the house. */
function DirectorsChair() {
  const back = useMemo(() => chairBackTexture("ZARCERO"), []);
  const reserved = useMemo(() => signTexture("Reserved"), []);
  const canvas = useMemo(() => new THREE.MeshLambertMaterial({ color: "#7a1620" }), []);
  const wood = useMemo(() => new THREE.MeshLambertMaterial({ color: "#6b4125" }), []);
  const bar = Math.hypot(0.62, 0.62);
  return (
    <group scale={1.35}>
      {/* the X, front and back */}
      {[0.22, -0.22].map((z) =>
        [1, -1].map((s) => (
          <mesh key={`${z}${s}`} position={[0, 0.31, z]} rotation={[0, 0, (s * Math.PI) / 4]} material={wood}>
            <boxGeometry args={[bar, 0.035, 0.035]} />
          </mesh>
        )),
      )}
      {/* stiles: short in front for the arms, tall behind for the back */}
      {[-0.31, 0.31].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.43, 0.22]} material={wood}>
            <boxGeometry args={[0.04, 0.86, 0.04]} />
          </mesh>
          <mesh position={[x, 0.6, -0.22]} material={wood}>
            <boxGeometry args={[0.04, 1.2, 0.04]} />
          </mesh>
          <mesh position={[x, 0.87, 0.02]} material={wood}>
            <boxGeometry args={[0.07, 0.035, 0.56]} />
          </mesh>
          <mesh position={[x, 0.02, 0]} material={wood}>
            <boxGeometry args={[0.05, 0.04, 0.5]} />
          </mesh>
        </group>
      ))}
      {/* seat and back, in canvas */}
      <mesh position={[0, 0.62, 0]} material={canvas}>
        <boxGeometry args={[0.6, 0.02, 0.46]} />
      </mesh>
      <mesh position={[0, 1.02, -0.22]}>
        <boxGeometry args={[0.66, 0.26, 0.015]} />
        <meshLambertMaterial attach="material-0" color="#7a1620" />
        <meshLambertMaterial attach="material-1" color="#7a1620" />
        <meshLambertMaterial attach="material-2" color="#7a1620" />
        <meshLambertMaterial attach="material-3" color="#7a1620" />
        <meshLambertMaterial attach="material-4" map={back} />
        <meshLambertMaterial attach="material-5" color="#7a1620" />
      </mesh>
      {/* a tent card on the seat */}
      <group position={[0, 0.69, 0.04]}>
        {[1, -1].map((s) => (
          <mesh key={s} position={[0, 0, s * 0.025]} rotation={[s * -0.35, s < 0 ? Math.PI : 0, 0]}>
            <planeGeometry args={[0.3, 0.1]} />
            <meshLambertMaterial map={reserved} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Two brass stanchions and a velvet rope: the chair is on exhibition. */
function Rope() {
  const m = mats();
  const rope = useMemo(() => new THREE.TubeGeometry(catenary(1.25, 0.22), 32, 0.035, 8), []);
  return (
    <group position={[0, 0, Z_ROPE - Z_CHAIR]}>
      {[-1.25, 1.25].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.02, 0]} material={m.brass}>
            <cylinderGeometry args={[0.16, 0.19, 0.04, 24]} />
          </mesh>
          <mesh position={[0, 0.45, 0]} material={m.brass}>
            <cylinderGeometry args={[0.025, 0.03, 0.86, 12]} />
          </mesh>
          <mesh position={[0, 0.92, 0]} material={m.brass}>
            <sphereGeometry args={[0.06, 16, 12]} />
          </mesh>
        </group>
      ))}
      <mesh geometry={rope} material={m.velvetRed} position={[0, 0.84, 0]} />
    </group>
  );
}

/** The chair rises on the stage lift for the Dramatis Personae. */
function PersonaeLift() {
  const stage = useStage();
  const ref = useRef<THREE.Group>(null);
  const [a, b, c, d] = Q.act1.personae;
  const zTrap = (Z_CHAIR + Z_ROPE) / 2;
  useFrame(() => {
    const p = liftAt(stage.t);
    const g = ref.current;
    if (g) {
      g.visible = p > 0.001;
      g.position.y = -LIFT_DEPTH * (1 - p);
    }
  });
  return (
    <group>
      <group ref={ref} position={[0, -LIFT_DEPTH, Z_CHAIR]} visible={false}>
        <DirectorsChair />
        <Rope />
        <LiftPlatform w={3.1} d={1.7} z={zTrap - Z_CHAIR} />
      </group>
      <TrapDoor w={3.1} d={1.7} z={zTrap} drive={(t) => trapCycle(t, a - 0.1, b - 0.1, c, d)} />
    </group>
  );
}

/** One rose: a cup of petals, a tighter bud inside, a green calyx. */
function useRoseKit() {
  return useMemo(() => {
    const cup = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.015, 0),
        new THREE.Vector2(0.06, 0.02),
        new THREE.Vector2(0.09, 0.06),
        new THREE.Vector2(0.1, 0.1),
        new THREE.Vector2(0.085, 0.125),
      ],
      14,
    );
    const inner = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.01, 0.03),
        new THREE.Vector2(0.05, 0.06),
        new THREE.Vector2(0.06, 0.11),
        new THREE.Vector2(0.04, 0.14),
      ],
      10,
    );
    const bud = new THREE.SphereGeometry(0.035, 10, 8);
    const calyx = new THREE.ConeGeometry(0.05, 0.06, 6);
    calyx.rotateX(Math.PI);
    const stem = new THREE.CylinderGeometry(0.01, 0.01, 1, 5);
    const leaf = new THREE.CircleGeometry(0.06, 8);
    leaf.scale(0.55, 1.2, 1);
    return { cup, inner, bud, calyx, stem, leaf };
  }, []);
}

const ROSE_COUNT = 4;

/**
 * A bouquet thrown at the bow: seven roses in a cone of brown paper, tied
 * with a ribbon, landing on the apron with its stems towards the house.
 */
function Roses() {
  const stage = useStage();
  const ref = useRef<THREE.Group>(null);
  const kit = useRoseKit();
  const m = mats();
  const mat = useMemo(
    () => ({
      petal: new THREE.MeshMatcapMaterial({
        matcap: matcapTexture({ core: "#6b0712", mid: "#b3162a", edge: "#ff6d74", rim: "rgba(255,160,160,0.45)", spot: "rgba(255,220,220,0.35)" }),
        side: THREE.DoubleSide,
      }),
      heart: new THREE.MeshMatcapMaterial({ matcap: matcapTexture({ core: "#3d030a", mid: "#7d0c19", edge: "#c23a45" }), side: THREE.DoubleSide }),
      green: new THREE.MeshLambertMaterial({ color: "#3f6a3a", side: THREE.DoubleSide }),
      paper: cardboard("#f6e3dc", { plain: true }),
      paperBack: new THREE.MeshLambertMaterial({ color: "#e9c9c0", side: THREE.BackSide }),
      ribbon: new THREE.MeshLambertMaterial({ color: "#a3232e" }),
      tag: new THREE.MeshLambertMaterial({ map: signTexture("Bravo"), side: THREE.DoubleSide }),
    }),
    [],
  );
  // the heads, arranged in a low dome at the open end of the paper
  const heads = useMemo(
    () =>
      Array.from({ length: ROSE_COUNT }, (_, i) => {
        const spots: [number, number, number][] = [
          [0, 0.31, -0.5],
          [-0.13, 0.22, -0.47],
          [0.13, 0.22, -0.47],
          [0, 0.14, -0.45],
        ];
        return new THREE.Vector3(...spots[i]);
      }),
    [],
  );
  const inst = useMemo(() => {
    const cup: THREE.Matrix4[] = [];
    const leaves: THREE.Matrix4[] = [];
    const stems: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const tip = new THREE.Vector3(0, 0.12, 0.62);
    heads.forEach((h, i) => {
      // each head faces out of the bouquet, towards the house and a little up
      const dir = h.clone().sub(new THREE.Vector3(0, 0.12, 0.2)).normalize();
      q.setFromUnitVectors(up, dir);
      cup.push(new THREE.Matrix4().compose(h, q, new THREE.Vector3(1.05, 1.05, 1.05)));
      const along = h.clone().sub(tip);
      const len = along.length();
      const sq = new THREE.Quaternion().setFromUnitVectors(up, along.clone().normalize());
      stems.push(new THREE.Matrix4().compose(tip.clone().add(h).multiplyScalar(0.5), sq, new THREE.Vector3(1, len, 1)));
      if (i % 2) {
        const lp = tip.clone().lerp(h, 0.72).add(new THREE.Vector3(i % 4 === 1 ? 0.07 : -0.07, 0.03, 0));
        leaves.push(new THREE.Matrix4().compose(lp, new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.1, 0, i % 4 === 1 ? -0.8 : 0.8)), new THREE.Vector3(1, 1, 1)));
      }
    });
    const buds = cup.map((mm) => mm.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.09, 0)));
    return { cup, leaves, stems, buds };
  }, [heads]);
  const cone = useMemo(() => {
    const g = new THREE.ConeGeometry(0.28, 1.0, 22, 1, true);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);

  useFrame(() => {
    const t = stage.t;
    const [a, b, c, d] = ROSES;
    const g = ref.current;
    if (!g) return;
    const on = t > a && t < d;
    g.visible = on;
    if (!on) return;
    // a toss from the stalls: a clean arc, one bounce, and it settles
    const p = seg(t, a, b);
    const fall = p < 0.72 ? 1 - Math.pow(p / 0.72, 2) : Math.sin(((p - 0.72) / 0.28) * Math.PI) * 0.06;
    g.position.y = fall * 2.4 - smooth(seg(t, c, d)) * 0.6;
    g.position.z = 1.35 + (1 - Math.min(1, p / 0.72)) * 2.2;
    g.rotation.x = (1 - Math.min(1, p / 0.72)) * -1.6;
  });

  const bouquet = (
    <group position={[0, 0.02, 0]}>
      <mesh geometry={cone} material={mat.paper} position={[0, 0.2, 0.05]} rotation={[0.18, 0, 0]} scale={[1, 0.72, 1]} />
      <mesh geometry={cone} material={mat.paperBack} position={[0, 0.2, 0.05]} rotation={[0.18, 0, 0]} scale={[0.98, 0.7, 0.99]} />
      <Instances geometry={kit.stem} material={mat.green} matrices={inst.stems} />
      <Instances geometry={kit.leaf} material={mat.green} matrices={inst.leaves} />
      <Instances geometry={kit.calyx} material={mat.green} matrices={inst.cup} />
      <Instances geometry={kit.cup} material={mat.petal} matrices={inst.cup} />
      <Instances geometry={kit.inner} material={mat.heart} matrices={inst.cup} />
      <Instances geometry={kit.bud} material={mat.heart} matrices={inst.buds} />
    </group>
  );

  return (
    <group ref={ref} position={[0, 0, 1.35]} scale={1.15} visible={false}>
      {/* two bouquets tied at the stems, opening in a V towards the house */}
      {[2.55, -2.55].map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <group position={[0, 0, -0.6]}>{bouquet}</group>
        </group>
      ))}
      {/* and one ribbon where they meet */}
      <group position={[0, 0.3, -0.1]}>
        <mesh material={mat.ribbon}>
          <torusGeometry args={[0.06, 0.02, 8, 20]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.1, 0.04, 0]} rotation={[0, 0, sd * 0.5]} scale={[1, 0.6, 1]} material={mat.ribbon}>
            <torusGeometry args={[0.08, 0.018, 8, 18]} />
          </mesh>
        ))}
        {[-1, 1].map((sd) => (
          <mesh key={`t${sd}`} position={[sd * 0.05, -0.1, 0.02]} rotation={[0, 0, sd * 0.35]} material={mat.ribbon}>
            <boxGeometry args={[0.04, 0.18, 0.01]} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.03]} material={m.gold}>
          <sphereGeometry args={[0.028, 10, 8]} />
        </mesh>
        <mesh position={[0, -0.2, 0.1]} rotation={[-1.1, 0, 0]} material={mat.tag}>
          <planeGeometry args={[0.22, 0.075]} />
        </mesh>
      </group>
    </group>
  );
}

export function Cast() {
  return (
    <group>
      <PersonaeLift />
      <Roses />
    </group>
  );
}
