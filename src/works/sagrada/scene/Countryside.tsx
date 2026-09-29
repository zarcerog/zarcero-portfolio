"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canvasTexture, rng } from "@/stage3d/lib/canvas";
import { font } from "@/stage3d/lib/fonts";
import { useLayout } from "@/stage3d/lib/layout";

import { CUE } from "../script";
import { B, birth, CH, cellOf, coastX, isSpecial, P } from "./plan";
import { dot, smokeTexture, stone } from "./textures";
import { streetTrees } from "./City";
import { CAST_SHEET, Cutouts, type Cutout } from "./Cutouts";
import { easeOut, env, put, seg, W } from "./world";

// ---------------------------------------------------------------------------
// 1881: the Poblet. Farmhouses, a tile works, trees in the fields — each one
// quietly removed when the city reaches it.
// ---------------------------------------------------------------------------

function onTrack(x: number, z: number) {
  const d1 = Math.abs(z - (8 * Math.sin(x * 0.03 + 1) + 26));
  const d2 = Math.abs((x + z * 0.55) / Math.hypot(1, 0.55) - 12);
  const d3 = Math.abs(x - (6 * Math.sin(z * 0.05) - 34));
  return Math.min(d1, d2, d3) < 1.2;
}

const MASIES: [number, number, number][] = [
  [15, 25, 0.3],
  [-30, -19, -0.4],
  [33, -34, 0.9],
  [-13, -47, 0.1],
  [47, 11, -0.2],
  [-46, 31, 0.5],
  [-8, 58, 0.2],
];

const BOBILA: [number, number] = [-23, 17];

const ROUND = ["olive", "olive2", "almond"];

function ruralCutouts(n: number): Cutout[] {
  const r = rng(5);
  const out: Cutout[] = [];
  const cutFor = (x: number, z: number) => {
    const [i, j] = cellOf(x, z);
    if (i === 0 && j === 0) return 1882.1;
    if (isSpecial(i, j)) return 1906 + r() * 6;
    return birth(i, j) - 0.4;
  };
  const add = (name: string, x: number, z: number, s: number) => {
    if (x < coastX(z) + 4) return;
    if (onTrack(x, z)) return;
    // keep the camera's corridor in front of the site clear
    if (Math.abs(x) < 4.5 && z > 3 && z < 75) return;
    out.push({ name, x, z, s, from: -1e4, to: cutFor(x, z), flip: r() < 0.5, tint: (r() - 0.5) * 0.16 });
  };
  for (let k = 0; k < n; k++) {
    const a = r() * Math.PI * 2;
    const d = 9 + Math.pow(r(), 0.7) * 150;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d - 20;
    const q = r();
    const name = q < 0.72 ? ROUND[Math.floor(r() * 3)] : q < 0.9 ? (r() < 0.5 ? "pine" : "pine2") : "cypress";
    add(name, x, z, 0.5 + r() * 0.45);
  }
  // orchards, planted in rows
  const orchards: [number, number, number][] = [
    [-8, 18, 0.38],
    [22, 6, 0.38],
    [-20, -8, 0.38],
    [10, -24, 0.38],
    [30, 38, 0.38],
    [-38, 8, 0.38],
  ];
  for (const [ox, oz, rot] of orchards) {
    const kind = r() < 0.5 ? "almond" : "olive2";
    for (let a = 0; a < 6; a++) {
      for (let b = 0; b < 4; b++) {
        const lx = (a - 2.5) * 1.3;
        const lz = (b - 1.5) * 1.3;
        add(kind, ox + lx * Math.cos(rot) - lz * Math.sin(rot), oz + lx * Math.sin(rot) + lz * Math.cos(rot), 0.42 + r() * 0.1);
      }
    }
  }
  // farmhouses, each with its cypresses, a pine, a haystack or a cart
  MASIES.forEach(([mx, mz], k) => {
    const [i, j] = cellOf(mx, mz);
    const gone = birth(i, j) - 0.8;
    out.push({ name: k % 3 === 1 ? "masiaTower" : "masia", x: mx, z: mz, s: 1, from: -1e4, to: gone, flip: k % 2 === 0 });
    out.push({ name: "cypress", x: mx + 2.3, z: mz + 0.3, s: 0.85, from: -1e4, to: gone });
    out.push({ name: "cypress", x: mx - 2.4, z: mz - 0.4, s: 0.8, from: -1e4, to: gone });
    out.push({ name: "pine", x: mx + 1.2, z: mz - 2.4, s: 0.8, from: -1e4, to: gone });
    out.push({ name: k % 2 ? "haystack" : "cart", x: mx - 1.6, z: mz + 2.2, s: 1, from: -1e4, to: gone });
  });
  const [bx, bz] = BOBILA;
  const [bi, bj] = cellOf(bx, bz);
  out.push({ name: "bobila", x: bx, z: bz, s: 1, from: -1e4, to: birth(bi, bj) - 0.5 });
  return out;
}

/** The bòbila's plume, drifting off the top of its painted chimney. */
function Smoke() {
  const puffs = useRef<(THREE.Sprite | null)[]>([]);
  const group = useRef<THREE.Group>(null);
  const [x, z] = BOBILA;
  const [i, j] = cellOf(x, z);
  const gone = birth(i, j) - 0.5;
  const smoke = useMemo(
    () =>
      Array.from({ length: 8 }, () => new THREE.SpriteMaterial({ map: smokeTexture(), color: "#dcd6cc", transparent: true, depthWrite: false, opacity: 0.6 })),
    [],
  );
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    g.visible = W.year < gone;
    // the chimney is painted on a card that turns to face us: follow it
    const cam = state.camera;
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    right.y = 0;
    right.normalize();
    g.position.set(x + right.x * 0.8, 5.95, z + right.z * 0.8);
    const n = W.light.night;
    puffs.current.forEach((s, k) => {
      if (!s) return;
      const f = (W.time * 0.07 + k / 8) % 1;
      s.position.set(f * 3.6 + Math.sin(f * 6 + k) * 0.3, f * 6.5, f * 0.8);
      const sz = 0.6 + f * 3.6;
      s.scale.set(sz, sz, 1);
      put(smoke[k], "opacity", (1 - f) * 0.6 * (1 - n * 0.5));
    });
  });
  return (
    <group ref={group}>
      {smoke.map((mat, k) => (
        <sprite
          key={k}
          material={mat}
          ref={(s) => {
            puffs.current[k] = s;
          }}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Cerdà's stakes across the fields, the rope round the purchased block, and
// its sign.
// ---------------------------------------------------------------------------

function outline(cx: number, cz: number, half = B, ch = CH) {
  const h = half;
  return [
    [cx - h + ch, cz - h],
    [cx + h - ch, cz - h],
    [cx + h, cz - h + ch],
    [cx + h, cz + h - ch],
    [cx + h - ch, cz + h],
    [cx - h + ch, cz + h],
    [cx - h, cz + h - ch],
    [cx - h, cz - h + ch],
  ] as [number, number][];
}

function Stakes() {
  const list = useMemo(() => {
    const out: { x: number; z: number; at: number; gone: number }[] = [];
    for (let j = -3; j <= 3; j++) {
      for (let i = -3; i <= 3; i++) {
        const pts = outline(i * P, j * P);
        const d = Math.hypot(i, j);
        const gone = isSpecial(i, j) ? (i === 0 && j === 0 ? 1882.3 : 1906) : birth(i, j) - 0.5;
        pts.forEach(([x, z], k) => out.push({ x, z, at: 7.35 + d * 0.16 + k * 0.012, gone }));
      }
    }
    return out;
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.07, 0.55, 0.07);
    g.translate(0, 0.27, 0);
    return g;
  }, []);
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: "#efe6d2" }), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  const last = useRef(-99);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    if (Math.abs(W.t - last.current) < 0.002) return;
    last.current = W.t;
    let any = false;
    list.forEach((s, k) => {
      const up = easeOut(seg(W.t, s.at, s.at + 0.25));
      const down = 1 - seg(W.year, s.gone - 0.3, s.gone);
      const v = up * down;
      if (v > 0.001) any = true;
      pos.set(s.x, 0, s.z);
      // gone (or not yet up) means gone: never a flat ghost on the ground
      if (v <= 0.001) sc.set(0, 0, 0);
      else sc.set(1, Math.max(0.02, v), 1);
      m.compose(pos, q, sc);
      mesh.setMatrixAt(k, m);
    });
    mesh.visible = any;
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, list.length]} frustumCulled={false} castShadow />;
}

function signTexture() {
  return canvasTexture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = "#f3e7cf";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#b8322f";
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, w - 60, h - 60);
    ctx.fillStyle = "#b8322f";
    ctx.textAlign = "center";
    ctx.font = font.sans(700, 118);
    ctx.fillText("VENUT", w / 2, 160);
    ctx.fillStyle = "#3a2a22";
    ctx.font = font.serif(500, 26, true);
    ctx.fillText("Associació Espiritual de Devots", w / 2, 212);
    ctx.fillText("de Sant Josep  ·  1881", w / 2, 246);
  });
}

function Plot() {
  const rope = useRef<THREE.Line>(null);
  const sign = useRef<THREE.Group>(null);
  const { geo, total } = useMemo(() => {
    const pts = outline(0, 0, B - 0.3, CH);
    pts.push(pts[0]);
    const v = pts.map(([x, z]) => new THREE.Vector3(x, 0.42, z));
    // sagging between posts
    const out: THREE.Vector3[] = [];
    for (let k = 0; k < v.length - 1; k++) {
      for (let s = 0; s < 8; s++) {
        const f = s / 8;
        const p = v[k].clone().lerp(v[k + 1], f);
        p.y -= Math.sin(f * Math.PI) * 0.12;
        out.push(p);
      }
    }
    out.push(v[v.length - 1]);
    const g = new THREE.BufferGeometry().setFromPoints(out);
    return { geo: g, total: out.length };
  }, []);
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color: "#c0302b" }), []);
  const tex = useMemo(() => signTexture(), []);
  useFrame(() => {
    const draw = seg(W.t, CUE.stakes[0], CUE.stakes[1]);
    const gone = 1 - seg(W.year, 1882.25, 1882.6);
    if (rope.current) {
      rope.current.visible = draw > 0 && gone > 0;
      geo.setDrawRange(0, Math.floor(draw * total));
    }
    const sg = sign.current;
    if (sg) {
      const up = easeOut(seg(W.t, CUE.stakes[0] + 0.5, CUE.stakes[0] + 1.0));
      const v = up * gone;
      sg.visible = v > 0;
      sg.scale.setScalar(Math.max(0.001, v));
    }
  });
  return (
    <group>
      <primitive object={new THREE.Line(geo, mat)} ref={rope} />
      <group ref={sign} position={[2.8, 0, B - 0.2]}>
        <mesh position={[-0.55, 0.5, 0]}>
          <boxGeometry args={[0.07, 1.0, 0.07]} />
          <meshLambertMaterial color="#6b4a2c" />
        </mesh>
        <mesh position={[0.55, 0.5, 0]}>
          <boxGeometry args={[0.07, 1.0, 0.07]} />
          <meshLambertMaterial color="#6b4a2c" />
        </mesh>
        <mesh position={[0, 0.95, 0.04]} castShadow>
          <boxGeometry args={[1.5, 0.94, 0.04]} />
          <meshLambertMaterial map={tex} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 19 March 1882: a striped canopy, bunting, the bishop, the committee in
// their hats, and the first stone.
// ---------------------------------------------------------------------------

function Ceremony() {
  const ref = useRef<THREE.Group>(null);
  const glint = useRef<THREE.Sprite>(null);
  const stripes = useMemo(
    () =>
      canvasTexture(256, 64, (ctx, w, h) => {
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = i % 2 ? "#f4ead6" : "#c63b36";
          ctx.fillRect((i * w) / 8, 0, w / 8, h);
        }
      }),
    [],
  );
  const stoneTex = stone(3, 0.1);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const [a, b] = CUE.ceremony;
    const v = env(W.t, a, a + 0.35, b - 0.3, b);
    g.visible = v > 0;
    g.scale.set(1, Math.max(0.001, easeOut(v)), 1);
    if (glint.current) {
      const s = 0.4 + 0.25 * Math.sin(W.time * 3);
      glint.current.scale.set(s, s, 1);
    }
  });
  return (
    <group ref={ref} position={[0, 0, 0.4]}>
      {/* the canopy */}
      <mesh position={[0, 1.2, 1.75]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[3.4, 0.05, 1.6]} />
        <meshLambertMaterial map={stripes} />
      </mesh>
      {[-1.6, 1.6].map((x) =>
        [1.0, 2.5].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.6, z]}>
            <cylinderGeometry args={[0.03, 0.03, 1.2, 5]} />
            <meshLambertMaterial color="#e8d9b8" />
          </mesh>
        )),
      )}
      {/* bunting */}
      {Array.from({ length: 14 }, (_, k) => (
        <mesh key={k} position={[-1.6 + (k + 0.5) * (3.2 / 14), 1.05 - Math.sin(((k + 0.5) / 14) * Math.PI) * 0.12, 0.98]} rotation={[0, 0, Math.PI]}>
          <circleGeometry args={[0.09, 3]} />
          <meshBasicMaterial color={["#c63b36", "#e8b53a", "#3f7f86", "#f4ead6"][k % 4]} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* the first stone, on a little dais */}
      <mesh position={[0, 0.06, 1.7]} receiveShadow>
        <boxGeometry args={[1.0, 0.12, 0.7]} />
        <meshLambertMaterial color="#a78c6c" />
      </mesh>
      <mesh position={[0, 0.3, 1.7]} castShadow>
        <boxGeometry args={[0.42, 0.36, 0.42]} />
        <meshLambertMaterial map={stoneTex.map} color="#e5d6ba" />
      </mesh>
      <sprite ref={glint} position={[0.2, 0.55, 1.95]}>
        <spriteMaterial map={dot("rgba(255,246,216,1)")} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/** How each character moves: [frames per second, share of the time on the gesture]. */
const ROUTINE: Record<string, [number, number]> = {
  gent: [0.16, 0.22],
  gent2: [0.14, 0.2],
  gent3: [0.18, 0.25],
  gent4: [0.15, 0.22],
  lady: [0.2, 0.55],
  lady2: [0.45, 0.5],
  lady3: [0.17, 0.6],
  lady4: [0.4, 0.5],
  priest: [0.12, 0.35],
  bishop: [0.1, 0.55],
  boy: [0.75, 0.5],
  mason: [1.25, 0.45],
  mason2: [1.05, 0.45],
  bookseller: [0.18, 0.4],
  gaudiYoung: [0.1, 0.3],
  gaudiOld: [0.09, 0.3],
};

function person(name: string, x: number, z: number, from: number, to: number, k: number, extra: Partial<Cutout> = {}): Cutout {
  const [anim, duty] = ROUTINE[name];
  const r = rng(k * 7 + 3);
  return { name, x, z, s: 2.3, from, to, grow: 0.03, anim, duty, phase: r(), wobble: 0.025 + r() * 0.02, ...extra };
}

/** The first-stone party: two symmetric rows of the committee and their wives, the clergy, an altar boy. */
function guests(): Cutout[] {
  const out: Cutout[] = [];
  const [from, to] = [1882.14, 1882.46];
  const rows = [
    ["gent", "lady", "gent2", "lady3", "gent4", "lady2", "gent3"],
    ["gent3", "lady4", "gent", "lady", "gent2", "lady3", "gent4"],
  ];
  rows.forEach((names, side) => {
    const sx = side ? 1 : -1;
    names.forEach((n, k) => out.push(person(n, sx * (0.72 + k * 0.44), 2.72 + (k % 2) * 0.3, from, to, side * 10 + k, { flip: side > 0 })));
  });
  // the clergy stand before the stone, so it can still be seen between them
  out.push(person("bishop", -0.36, 2.25, from, to, 40, { s: 2.4 }));
  out.push(person("boy", 0.36, 2.25, from, to, 42));
  out.push(person("priest", -0.8, 1.7, from, to, 41));
  return out;
}

/** The works: stone piles, the site hut (painted props). */
function site(): Cutout[] {
  const out: Cutout[] = [];
  const r = rng(1882);
  const spots: [number, number][] = [
    [-4.6, 3.6],
    [4.2, -3.8],
    [-3.2, -4.4],
    [4.8, 2.4],
    [-5.2, -1.2],
    [2.8, 4.6],
  ];
  spots.forEach(([x, z], k) => out.push({ name: "stones", x, z, s: 0.9 + r() * 0.4, from: 1882.35 + k * 0.4, to: 1995, flip: r() < 0.5, grow: 0.4 }));
  out.push({ name: "hut", x: -4.2, z: -3.2, s: 1, from: 1882.5, to: 1980, grow: 0.3 });
  return out;
}

/** The people of the works: masons at their blocks; the bookseller; the architect, young and then old. */
function workers(): Cutout[] {
  const out: Cutout[] = [];
  const masons: [number, number][] = [
    [-3.6, 3.9],
    [3.6, -3.2],
    [5.0, 1.8],
    [-2.6, 4.9],
    [-5.4, 0.4],
    [1.8, -4.8],
  ];
  masons.forEach(([x, z], k) => out.push(person(k % 2 ? "mason2" : "mason", x, z, 1882.6 + k * 0.3, 1935, 60 + k, { flip: k % 3 === 0, grow: 0.2 })));
  // Josep Maria Bocabella, standing in his field with an armful of books
  out.push(person("bookseller", 0.6, 3.2, 1881.33, 1881.93, 70, { s: 2.4, grow: 0.01 }));
  // Gaudí on his site: the young man from 1883, the old one to the end
  out.push(person("gaudiYoung", -1.9, 4.3, 1883.9, 1905, 71, { grow: 0.1 }));
  out.push(person("gaudiOld", -3.3, -2.3, 1905, 1926.44, 72, { grow: 0.1 }));
  return out;
}

export function Countryside() {
  const { tier } = useLayout();
  const items = useMemo(() => [...ruralCutouts(tier === "high" ? 560 : 320), ...streetTrees(), ...site()], [tier]);
  const people = useMemo(() => [...guests(), ...workers()], []);
  return (
    <group>
      <Cutouts items={items} />
      <Cutouts items={people} sheet={CAST_SHEET} />
      <Smoke />
      <Stakes />
      <Plot />
      <Ceremony />
    </group>
  );
}
