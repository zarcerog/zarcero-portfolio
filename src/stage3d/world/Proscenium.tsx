"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useStage } from "@/theatre/engine";

import { curtainAt, houseDarkAt } from "../cues";
import { borderSurface, clothGeometry, curtainSurface, legSurface, shapeCloth, swagSurface } from "../lib/cloth";
import { haloMaterial, mats, setOpacity } from "../lib/materials";
import { apronTexture, crestTexture } from "../lib/signs";

export const OPENING = { halfW: 7.05, h: 8.5 };

/** Instanced little spheres laid out along a list of points. */
function Beads({ points, r = 0.06, mat }: { points: THREE.Vector3[]; r?: number; mat: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    points.forEach((p, i) => {
      m.makeTranslation(p.x, p.y, p.z);
      ref.current!.setMatrixAt(i, m);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [points]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, points.length]} material={mat}>
      <sphereGeometry args={[r, 7, 5]} />
    </instancedMesh>
  );
}

function linePoints(a: THREE.Vector3, b: THREE.Vector3, step: number) {
  const n = Math.max(1, Math.round(a.distanceTo(b) / step));
  return Array.from({ length: n + 1 }, (_, i) => a.clone().lerp(b, i / n));
}

function Frame() {
  const m = mats();
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-8.1, -1.4);
    s.lineTo(-8.1, 9.7);
    s.lineTo(8.1, 9.7);
    s.lineTo(8.1, -1.4);
    s.lineTo(7.05, -1.4);
    s.lineTo(7.05, 8.5);
    s.lineTo(-7.05, 8.5);
    s.lineTo(-7.05, -1.4);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.45, bevelEnabled: true, bevelSize: 0.09, bevelThickness: 0.1, bevelSegments: 4, curveSegments: 4 });
  }, []);

  const inner = useMemo(() => {
    const path = new THREE.CurvePath<THREE.Vector3>();
    path.add(new THREE.LineCurve3(new THREE.Vector3(-7.12, 0, 0.98), new THREE.Vector3(-7.12, 8.57, 0.98)));
    path.add(new THREE.LineCurve3(new THREE.Vector3(-7.12, 8.57, 0.98), new THREE.Vector3(7.12, 8.57, 0.98)));
    path.add(new THREE.LineCurve3(new THREE.Vector3(7.12, 8.57, 0.98), new THREE.Vector3(7.12, 0, 0.98)));
    return new THREE.TubeGeometry(path, 200, 0.1, 10, false);
  }, []);

  const outer = useMemo(() => {
    const path = new THREE.CurvePath<THREE.Vector3>();
    path.add(new THREE.LineCurve3(new THREE.Vector3(-8.0, 0, 1.0), new THREE.Vector3(-8.0, 9.6, 1.0)));
    path.add(new THREE.LineCurve3(new THREE.Vector3(-8.0, 9.6, 1.0), new THREE.Vector3(8.0, 9.6, 1.0)));
    path.add(new THREE.LineCurve3(new THREE.Vector3(8.0, 9.6, 1.0), new THREE.Vector3(8.0, 0, 1.0)));
    return new THREE.TubeGeometry(path, 200, 0.12, 10, false);
  }, []);

  const beads = useMemo(() => {
    const z = 1.02;
    return [
      ...linePoints(new THREE.Vector3(-7.56, 0.2, z), new THREE.Vector3(-7.56, 9.08, z), 0.22),
      ...linePoints(new THREE.Vector3(-7.34, 9.08, z), new THREE.Vector3(7.34, 9.08, z), 0.22),
      ...linePoints(new THREE.Vector3(7.56, 0.2, z), new THREE.Vector3(7.56, 9.08, z), 0.22),
    ];
  }, []);

  const pediment = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-8.3, 9.55);
    s.lineTo(8.3, 9.55);
    s.quadraticCurveTo(0, 12.9, -8.3, 9.55);
    const band = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3, curveSegments: 40 });
    const p = new THREE.Shape();
    p.moveTo(-6.9, 9.78);
    p.lineTo(6.9, 9.78);
    p.quadraticCurveTo(0, 12.3, -6.9, 9.78);
    const panel = new THREE.ExtrudeGeometry(p, { depth: 0.1, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 40 });
    return { band, panel };
  }, []);

  return (
    <group>
      <mesh geometry={geo} material={m.gold} position={[0, 0, 0.4]} />
      <mesh geometry={inner} material={m.gold} />
      <mesh geometry={outer} material={m.gold} />
      <Beads points={beads} mat={m.gold} />
      <mesh geometry={pediment.band} material={m.goldDull} position={[0, 0, 0.45]} />
      <mesh geometry={pediment.panel} material={m.velvetDeep} position={[0, 0, 0.82]} />
    </group>
  );
}

function Column({ x }: { x: number }) {
  const m = mats();
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.42, 0.46, 9.2, 64, 1, false);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      const a = Math.atan2(pz, px);
      const r = Math.hypot(px, pz);
      const f = 1 - 0.07 * Math.pow(Math.abs(Math.cos(a * 10)), 3);
      pos.setX(i, Math.cos(a) * r * f);
      pos.setZ(i, Math.sin(a) * r * f);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group position={[x, 0, 1.4]}>
      <mesh geometry={geo} material={m.cream} position={[0, 4.8, 0]} />
      <mesh material={m.gold} position={[0, 0.15, 0]}>
        <boxGeometry args={[1.25, 0.5, 1.25]} />
      </mesh>
      <mesh material={m.gold} position={[0, 0.5, 0]}>
        <torusGeometry args={[0.5, 0.09, 12, 40]} />
      </mesh>
      <mesh material={m.gold} position={[0, 9.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.46, 0.1, 12, 40]} />
      </mesh>
      <mesh material={m.gold} position={[0, 9.7, 0]}>
        <boxGeometry args={[1.3, 0.45, 1.3]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.gold} position={[s * 0.55, 9.52, 0.62]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.16, 0.05, 10, 24]} />
        </mesh>
      ))}
    </group>
  );
}

function Crest() {
  const m = mats();
  const tex = useMemo(() => crestTexture(), []);
  const { ring, face, arms, garlands, leaves } = useMemo(() => {
    const rx = 1.0;
    const ry = 0.8;
    const outer = new THREE.Shape();
    outer.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
    const hole = new THREE.Path();
    hole.absellipse(0, 0, rx * 0.78, ry * 0.76, 0, Math.PI * 2, true, 0);
    outer.holes.push(hole);
    const ring = new THREE.ExtrudeGeometry(outer, { depth: 0.18, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.08, bevelSegments: 4, curveSegments: 48 });

    const fs = new THREE.Shape();
    fs.absellipse(0, 0, rx * 0.8, ry * 0.78, 0, Math.PI * 2, false, 0);
    const face = new THREE.ShapeGeometry(fs, 48);
    // normalise UVs to 0..1 across the ellipse
    const uv = face.attributes.uv as THREE.BufferAttribute;
    const pos = face.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / (rx * 1.6) + 0.5, pos.getY(i) / (ry * 1.56) + 0.5);

    const arm = (s: number) =>
      new THREE.TubeGeometry(
        new THREE.CubicBezierCurve3(
          new THREE.Vector3(s * 0.9, -0.3, 0.1),
          new THREE.Vector3(s * 1.9, -0.9, 0.1),
          new THREE.Vector3(s * 2.4, 0.4, 0.1),
          new THREE.Vector3(s * 1.8, 0.35, 0.1),
        ),
        40,
        0.1,
        10,
        false,
      );
    const garland = (s: number) =>
      new THREE.QuadraticBezierCurve3(new THREE.Vector3(s * 1.9, 0.3, 0), new THREE.Vector3(s * 4.8, -2.4, 0.1), new THREE.Vector3(s * 7.6, -0.9, -0.15));
    const g1 = garland(-1);
    const g2 = garland(1);
    const leaves = [...g1.getSpacedPoints(34), ...g2.getSpacedPoints(34)];
    return {
      ring,
      face,
      arms: [arm(-1), arm(1)],
      garlands: [new THREE.TubeGeometry(g1, 60, 0.07, 8), new THREE.TubeGeometry(g2, 60, 0.07, 8)],
      leaves,
    };
  }, []);

  return (
    <group position={[0, 11.1, 0.95]}>
      <mesh geometry={ring} material={m.gold} />
      <mesh geometry={face} position={[0, 0, 0.12]}>
        <meshBasicMaterial map={tex} />
      </mesh>
      {arms.map((g, i) => (
        <mesh key={i} geometry={g} material={m.gold} />
      ))}
      {garlands.map((g, i) => (
        <mesh key={i} geometry={g} material={m.goldDull} />
      ))}
      <Beads points={leaves} r={0.13} mat={m.goldDull} />
      {[-0.4, 0, 0.4].map((x, i) => (
        <mesh key={i} material={m.gold} position={[x, 0.95 + (i === 1 ? 0.12 : 0), 0.1]}>
          <coneGeometry args={[0.12, 0.45 + (i === 1 ? 0.2 : 0), 12]} />
        </mesh>
      ))}
      <mesh material={m.gold} position={[0, -0.95, 0.1]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.22, 0.5, 16]} />
      </mesh>
    </group>
  );
}

function ProsceniumWall() {
  const m = mats();
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-15, -1.4);
    s.lineTo(15, -1.4);
    s.lineTo(15, 16);
    s.lineTo(-15, 16);
    s.closePath();
    const h = new THREE.Path();
    h.moveTo(-8.1, -1.4);
    h.lineTo(-8.1, 9.7);
    h.lineTo(8.1, 9.7);
    h.lineTo(8.1, -1.4);
    h.closePath();
    s.holes.push(h);
    const g = new THREE.ShapeGeometry(s);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 30, uv.getY(i) / 17);
    return g;
  }, []);
  return <mesh geometry={geo} material={m.wall} position={[0, 0, 0.38]} />;
}

function Valance() {
  const m = mats();
  const { swags, fringe } = useMemo(() => {
    const defs = [
      swagSurface(-7.1, -2.3, 8.55, 0.4, 0.7, 0.28),
      swagSurface(-2.4, 2.4, 8.55, 0.4, 0.95, 0.34),
      swagSurface(2.3, 7.1, 8.55, 0.4, 0.7, 0.28),
    ];
    const swags = defs.map((surf) => {
      const g = clothGeometry(40, 16);
      shapeCloth(g, surf);
      return g;
    });
    const pts: THREE.Vector3[] = [];
    const v = new THREE.Vector3();
    defs.forEach((surf) => {
      for (let i = 0; i <= 44; i++) {
        surf(i / 44, 1, v);
        pts.push(v.clone());
      }
    });
    return { swags, fringe: pts };
  }, []);

  const fringeRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mtx = new THREE.Matrix4();
    fringe.forEach((p, i) => {
      mtx.makeTranslation(p.x, p.y - 0.12, p.z);
      fringeRef.current!.setMatrixAt(i, mtx);
    });
    fringeRef.current!.instanceMatrix.needsUpdate = true;
  }, [fringe]);

  return (
    <group position={[0, 0, 0.3]}>
      {swags.map((g, i) => (
        <mesh key={i} geometry={g} material={m.velvetRed} />
      ))}
      <instancedMesh ref={fringeRef} args={[undefined, undefined, fringe.length]} material={m.gold}>
        <boxGeometry args={[0.035, 0.24, 0.035]} />
      </instancedMesh>
      {[-2.35, 2.35].map((x) => (
        <group key={x} position={[x, 8.2, 0.2]}>
          <mesh material={m.gold}>
            <sphereGeometry args={[0.2, 20, 16]} />
          </mesh>
          <mesh material={m.gold} position={[0, -0.55, 0]}>
            <cylinderGeometry args={[0.05, 0.16, 0.8, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Legs() {
  const m = mats();
  const geos = useMemo(
    () =>
      [
        [-OPENING.halfW, 1],
        [OPENING.halfW, -1],
      ].map(([edge, dir]) => {
        const g = clothGeometry(44, 60);
        shapeCloth(g, legSurface(edge, dir, OPENING.h, 2.3));
        return { g, edge, dir };
      }),
    [],
  );
  return (
    <group position={[0, 0, 0.22]}>
      {geos.map(({ g, edge, dir }) => (
        <group key={edge}>
          <mesh geometry={g} material={m.velvetRed} />
          <group position={[edge + dir * 0.5, OPENING.h * 0.4, 0.2]}>
            <mesh material={m.gold}>
              <torusGeometry args={[0.28, 0.06, 10, 30]} />
            </mesh>
            <mesh material={m.gold} position={[dir * 0.1, -0.35, 0.05]}>
              <sphereGeometry args={[0.16, 18, 14]} />
            </mesh>
            <mesh material={m.gold} position={[dir * 0.1, -0.85, 0.05]}>
              <cylinderGeometry args={[0.05, 0.2, 0.8, 16]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

function Border() {
  const m = mats();
  const g = useMemo(() => {
    const geo = clothGeometry(160, 6);
    shapeCloth(geo, borderSurface(14.3, 8.6, 1.0, 26));
    return geo;
  }, []);
  return <mesh geometry={g} material={m.velvetTeal} position={[0, 0, 0.12]} />;
}

function HouseCurtain() {
  const m = mats();
  const stage = useStage();
  const halves = useMemo(() => [clothGeometry(162, 10), clothGeometry(162, 10)], []);
  const last = useRef(-1);
  useFrame(() => {
    const o = curtainAt(stage.t);
    if (Math.abs(o - last.current) < 0.0005) return;
    last.current = o;
    shapeCloth(halves[0], curtainSurface(-1, OPENING.halfW, OPENING.h + 0.2, o));
    shapeCloth(halves[1], curtainSurface(1, OPENING.halfW, OPENING.h + 0.2, o));
  });
  return (
    <group position={[0, 0, 0]}>
      {halves.map((g, i) => (
        <mesh key={i} geometry={g} material={m.velvetRed} frustumCulled={false} />
      ))}
    </group>
  );
}

function StageFloor() {
  const m = mats();
  const map = useMemo(() => {
    const a = m.woodMap.clone();
    a.repeat.set(2.2, 1.5);
    a.needsUpdate = true;
    return a;
  }, [m]);
  return (
    <group>
      <mesh position={[0, -0.16, -4.8]} material={m.darkWood}>
        <boxGeometry args={[24, 0.3, 14.4]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -4.8]}>
        <planeGeometry args={[24, 14.4]} />
        <meshLambertMaterial map={map} color="#d4ae88" />
      </mesh>
    </group>
  );
}

function Apron() {
  const m = mats();
  const stage = useStage();
  const tex = useMemo(() => apronTexture(), []);
  const bulbMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffd9a0" }), []);
  const halo = useMemo(() => haloMaterial("#ffc47a", 0), []);
  const bulbs = useMemo(() => Array.from({ length: 23 }, (_, i) => new THREE.Vector3(-10 + i * (20 / 22), 0.08, 2.18)), []);
  const hoods = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mtx = new THREE.Matrix4();
    bulbs.forEach((p, i) => {
      mtx.makeTranslation(p.x, 0.06, p.z + 0.08);
      hoods.current!.setMatrixAt(i, mtx);
    });
    hoods.current!.instanceMatrix.needsUpdate = true;
  }, [bulbs]);
  useFrame(() => {
    const d = houseDarkAt(stage.t);
    bulbMat.color.setRGB(1, 0.85, 0.62).multiplyScalar(0.45 + d * 0.9);
    setOpacity(halo, d * 0.55);
  });
  return (
    <group>
      <mesh position={[0, -0.7, 2.41]}>
        <planeGeometry args={[22, 1.4]} />
        <meshLambertMaterial map={tex} />
      </mesh>
      <mesh position={[0, -0.02, 2.42]} rotation={[0, 0, Math.PI / 2]} material={m.gold}>
        <cylinderGeometry args={[0.06, 0.06, 22, 12]} />
      </mesh>
      <instancedMesh ref={hoods} args={[undefined, undefined, bulbs.length]} material={m.blackMetal}>
        <boxGeometry args={[0.42, 0.14, 0.16]} />
      </instancedMesh>
      <Beads points={bulbs} r={0.07} mat={bulbMat} />
      {/* one long strip of glow instead of 23 lights */}
      <mesh position={[0, 0.35, 2.2]} material={halo} scale={[1, 1, 1]}>
        <planeGeometry args={[22, 1.1]} />
      </mesh>
    </group>
  );
}

export function Proscenium() {
  return (
    <group>
      <ProsceniumWall />
      <Frame />
      <Column x={-9.05} />
      <Column x={9.05} />
      <Crest />
      <Border />
      <Valance />
      <Legs />
      <HouseCurtain />
      <StageFloor />
      <Apron />
    </group>
  );
}
