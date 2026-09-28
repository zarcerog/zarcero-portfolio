"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { useStage } from "@/theatre/engine";

import { houseDarkAt, Q } from "../cues";
import { rng } from "../lib/canvas";
import { useLayout } from "../lib/layout";
import { haloMaterial, mats, setOpacity } from "../lib/materials";

const seg = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));

function seatGeometry() {
  const back = new THREE.BoxGeometry(0.52, 0.72, 0.1, 2, 2, 1);
  back.translate(0, 0.72, 0.2);
  const cushion = new THREE.BoxGeometry(0.5, 0.12, 0.44);
  cushion.translate(0, 0.42, 0);
  const armL = new THREE.BoxGeometry(0.05, 0.28, 0.46);
  armL.translate(-0.29, 0.5, 0.02);
  const armR = armL.clone();
  armR.translate(0.58, 0, 0);
  const g = mergeGeometries([back, cushion, armL, armR])!;
  // round the back a little
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 1.0) pos.setY(i, pos.getY(i) - Math.pow(pos.getX(i) * 1.6, 2) * 0.12);
  }
  g.computeVertexNormals();
  return g;
}

function headGeometry() {
  const head = new THREE.SphereGeometry(0.13, 7, 5);
  head.scale(1, 1.18, 1.05);
  head.translate(0, 1.32, 0.12);
  const shoulders = new THREE.CapsuleGeometry(0.2, 0.2, 2, 7);
  shoulders.rotateZ(Math.PI / 2);
  shoulders.scale(1, 0.7, 0.6);
  shoulders.translate(0, 1.02, 0.16);
  return mergeGeometries([head, shoulders])!;
}

function Seats() {
  const m = mats();
  const stage = useStage();
  const { tier } = useLayout();
  const rows = tier === "high" ? 16 : 11;
  const perSide = tier === "high" ? 11 : 8;
  const seatsRef = useRef<THREE.InstancedMesh>(null);
  const headsRef = useRef<THREE.InstancedMesh>(null);
  const seatGeo = useMemo(() => seatGeometry(), []);
  const headGeo = useMemo(() => headGeometry(), []);

  const layout = useMemo(() => {
    const r = rng(21);
    const seats: { x: number; y: number; z: number; occupied: boolean; delay: number }[] = [];
    for (let row = 0; row < rows; row++) {
      const z = 4.2 + row * 1.0;
      const y = -1.4 + row * 0.13;
      const curve = (x: number) => Math.pow(x / 9, 2) * 0.9;
      for (let s = 0; s < perSide; s++) {
        for (const side of [-1, 1]) {
          const x = side * (0.9 + s * 0.62);
          seats.push({ x, y, z: z + curve(x), occupied: r() < (row < 12 ? 0.62 : 0.35), delay: r() });
        }
      }
    }
    return seats;
  }, [rows, perSide]);

  const heads = useMemo(() => layout.filter((s) => s.occupied), [layout]);

  useLayoutEffect(() => {
    const mtx = new THREE.Matrix4();
    const rot = new THREE.Matrix4();
    layout.forEach((s, i) => {
      rot.makeRotationY(s.x * 0.03);
      mtx.makeTranslation(s.x, s.y, s.z).multiply(rot);
      seatsRef.current!.setMatrixAt(i, mtx);
    });
    seatsRef.current!.instanceMatrix.needsUpdate = true;
  }, [layout]);

  const lastAway = useRef(-1);
  useFrame(({ clock }) => {
    const t = stage.t;
    const I = Q.interval;
    const away = seg(t, ...I.audienceOut) * (1 - seg(t, ...I.audienceBack));
    const F = Q.finale;
    const clap = seg(t, F.bow[0], F.bow[1]) * (1 - seg(t, F.bow[3], F.bow[3] + 1));
    if (Math.abs(away - lastAway.current) < 0.001 && clap === 0) return;
    lastAway.current = away;
    const mtx = new THREE.Matrix4();
    const rot = new THREE.Matrix4();
    const time = clock.elapsedTime;
    heads.forEach((s, i) => {
      const k = Math.min(1, Math.max(0, away * 1.8 - s.delay * 0.8));
      const bob = clap > 0 ? Math.abs(Math.sin(time * 9 + s.delay * 20)) * 0.05 * clap : 0;
      rot.makeRotationY(s.x * 0.03);
      mtx.makeTranslation(s.x, s.y - k * 1.6 + bob, s.z).multiply(rot);
      headsRef.current!.setMatrixAt(i, mtx);
    });
    headsRef.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={seatsRef} args={[seatGeo, m.velvetSeat, layout.length]} />
      <instancedMesh ref={headsRef} args={[headGeo, m.silhouette, heads.length]} />
      {/* stalls carpet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.42, 14]}>
        <planeGeometry args={[30, 26]} />
        <meshLambertMaterial color="#3a0a10" />
      </mesh>
    </group>
  );
}

function OperaBox({ x, y, z }: { x: number; y: number; z: number }) {
  const m = mats();
  const side = Math.sign(x);
  const parapet = useMemo(() => {
    const g = new THREE.CylinderGeometry(1.25, 1.25, 1.0, 40, 1, true, -Math.PI / 2, Math.PI);
    return g;
  }, []);
  return (
    <group position={[x, y, z]} rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
      {/* the bowed front */}
      <mesh geometry={parapet} material={m.velvetDeep} position={[0, 0.5, 0.2]} scale={[1, 1, 0.5]} />
      <mesh material={m.gold} position={[0, 1.02, 0.2]} scale={[1, 1, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.06, 8, 40, Math.PI]} />
      </mesh>
      <mesh material={m.gold} position={[0, 0.0, 0.2]} scale={[1, 1, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.08, 8, 40, Math.PI]} />
      </mesh>
      {/* the dark interior and its drapes */}
      <mesh position={[0, 1.4, -0.6]} material={m.wallDark}>
        <boxGeometry args={[2.7, 3.2, 0.1]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.15, 1.9, -0.3]} material={m.velvetRed}>
          <boxGeometry args={[0.35, 2.4, 0.2]} />
        </mesh>
      ))}
      <mesh position={[0, 2.95, -0.25]} material={m.velvetRed}>
        <boxGeometry args={[2.7, 0.5, 0.25]} />
      </mesh>
      <mesh position={[0, 1.7, -0.4]} material={m.bulb}>
        <sphereGeometry args={[0.07, 8, 6]} />
      </mesh>
    </group>
  );
}

function Walls() {
  const m = mats();
  const wallMat = useMemo(() => {
    const w = m.wall.clone();
    const map = w.map!.clone();
    map.repeat.set(12, 5);
    map.needsUpdate = true;
    w.map = map;
    return w;
  }, [m]);
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 13, 6, 13]} rotation={[0, -s * Math.PI / 2, 0]} material={wallMat}>
            <planeGeometry args={[28, 15]} />
          </mesh>
          {[3, 11, 19].map((z) => (
            <mesh key={z} position={[s * 12.85, 6, z]} material={m.goldDull}>
              <boxGeometry args={[0.25, 15, 0.5]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 6, 27]} rotation={[0, Math.PI, 0]} material={wallMat}>
        <planeGeometry args={[26, 15]} />
      </mesh>
      {/* ceiling with a gilded rose */}
      <mesh position={[0, 13.5, 13]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 28]} />
        <meshLambertMaterial color="#2a0d10" side={THREE.DoubleSide} />
      </mesh>
      {[3.6, 2.6].map((r, i) => (
        <mesh key={r} position={[0, 13.45 - i * 0.02, 10]} rotation={[Math.PI / 2, 0, 0]} material={m.goldDull}>
          <torusGeometry args={[r, 0.12, 10, 80]} />
        </mesh>
      ))}
      {/* balcony front across the back */}
      <mesh position={[0, 4.6, 21]} material={m.velvetDeep}>
        <boxGeometry args={[25, 1.1, 0.3]} />
      </mesh>
      <mesh position={[0, 5.2, 20.84]} rotation={[0, 0, Math.PI / 2]} material={m.gold}>
        <cylinderGeometry args={[0.07, 0.07, 25, 10]} />
      </mesh>
    </group>
  );
}

function Chandelier() {
  const m = mats();
  const stage = useStage();
  const group = useRef<THREE.Group>(null);
  const bulbMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffd9a0" }), []);
  const halo = useMemo(() => haloMaterial("#ffc98a", 0.6), []);
  const crystals = useRef<THREE.InstancedMesh>(null);
  const bulbs = useRef<THREE.InstancedMesh>(null);

  const layout = useMemo(() => {
    const cr: THREE.Matrix4[] = [];
    const bl: THREE.Matrix4[] = [];
    const tiers = [
      { r: 1.9, y: 0, n: 18 },
      { r: 1.35, y: 0.7, n: 12 },
      { r: 0.8, y: 1.3, n: 8 },
    ];
    tiers.forEach((tier) => {
      for (let i = 0; i < tier.n; i++) {
        const a = (i / tier.n) * Math.PI * 2;
        bl.push(new THREE.Matrix4().makeTranslation(Math.cos(a) * tier.r, tier.y + 0.18, Math.sin(a) * tier.r));
        for (let k = 0; k < 4; k++) {
          const a2 = a + (k / 4) * ((Math.PI * 2) / tier.n);
          cr.push(
            new THREE.Matrix4()
              .makeTranslation(Math.cos(a2) * (tier.r + 0.05), tier.y - 0.35 - (k % 2) * 0.22, Math.sin(a2) * (tier.r + 0.05))
              .multiply(new THREE.Matrix4().makeScale(0.7, 1.6, 0.7)),
          );
        }
      }
    });
    for (let i = 0; i < 14; i++) cr.push(new THREE.Matrix4().makeTranslation(0, -0.6 - i * 0.12, 0).multiply(new THREE.Matrix4().makeScale(1 + (7 - Math.abs(7 - i)) * 0.3, 1, 1 + (7 - Math.abs(7 - i)) * 0.3)));
    return { cr, bl };
  }, []);

  useLayoutEffect(() => {
    layout.cr.forEach((mtx, i) => crystals.current!.setMatrixAt(i, mtx));
    layout.bl.forEach((mtx, i) => bulbs.current!.setMatrixAt(i, mtx));
    crystals.current!.instanceMatrix.needsUpdate = true;
    bulbs.current!.instanceMatrix.needsUpdate = true;
  }, [layout]);

  useFrame((_, dt) => {
    const lit = 1 - houseDarkAt(stage.t);
    if (group.current) group.current.rotation.y += dt * 0.03;
    bulbMat.color.setRGB(1, 0.86, 0.62).multiplyScalar(0.45 + lit * 0.7);
    setOpacity(halo, 0.15 + lit * 0.7);
  });

  return (
    <group position={[0, 11.4, 10]}>
      <mesh material={m.gold} position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 3, 8]} />
      </mesh>
      <group ref={group}>
        {[1.9, 1.35, 0.8].map((r, i) => (
          <mesh key={r} material={m.gold} position={[0, [0, 0.7, 1.3][i], 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.045, 8, 64]} />
          </mesh>
        ))}
        <instancedMesh ref={crystals} args={[undefined, m.crystal, layout.cr.length]}>
          <octahedronGeometry args={[0.07, 0]} />
        </instancedMesh>
        <instancedMesh ref={bulbs} args={[undefined, bulbMat, layout.bl.length]}>
          <sphereGeometry args={[0.07, 8, 6]} />
        </instancedMesh>
      </group>
      <FaceCamera position={[0, 0.4, 0]}>
        <mesh material={halo}>
          <planeGeometry args={[7, 7]} />
        </mesh>
      </FaceCamera>
    </group>
  );
}

/** Keeps its children turned towards the camera (a halo is a flat card). */
function FaceCamera({ position, children }: { position: [number, number, number]; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    const g = ref.current;
    if (!g || !g.parent) return;
    g.quaternion.copy(camera.quaternion);
    // cancel the parent's rotation so the card faces the lens exactly
    const pq = new THREE.Quaternion();
    g.parent.getWorldQuaternion(pq);
    g.quaternion.premultiply(pq.invert());
  });
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

function Sconces() {
  const stage = useStage();
  const bulbMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffd9a0" }), []);
  const halo = useMemo(() => haloMaterial("#ffc47a", 0.6), []);
  const spots = useMemo(
    () => [
      [-12.6, 5, 9],
      [12.6, 5, 9],
      [-12.6, 5, 17],
      [12.6, 5, 17],
    ],
    [],
  );
  useFrame(() => {
    const lit = 1 - houseDarkAt(stage.t);
    bulbMat.color.setRGB(1, 0.84, 0.6).multiplyScalar(0.4 + lit * 0.8);
    setOpacity(halo, 0.1 + lit * 0.6);
  });
  return (
    <group>
      {spots.map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <mesh material={bulbMat}>
            <sphereGeometry args={[0.14, 10, 8]} />
          </mesh>
          <mesh material={halo} rotation={[0, (p[0] < 0 ? 1 : -1) * Math.PI / 2, 0]}>
            <planeGeometry args={[2.2, 2.2]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Auditorium() {
  return (
    <group>
      <Walls />
      <Seats />
      {[
        [-11.4, 2.2, 4.4],
        [-11.4, 5.4, 4.4],
        [-11.4, 2.2, 8.2],
        [-11.4, 5.4, 8.2],
        [11.4, 2.2, 4.4],
        [11.4, 5.4, 4.4],
        [11.4, 2.2, 8.2],
        [11.4, 5.4, 8.2],
      ].map(([x, y, z], i) => (
        <OperaBox key={i} x={x} y={y} z={z} />
      ))}
      <Chandelier />
      <Sconces />
    </group>
  );
}
