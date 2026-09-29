"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canvasTexture, rng } from "@/stage3d/lib/canvas";

import { B, birth, CH, coastX, isSpecial, P, REACH } from "./plan";
import { easeOut, put, seg, W } from "./world";

// ---------------------------------------------------------------------------
// The Eixample, one house at a time: every block is a ring of separate
// buildings round its courtyard — different heights, different paint, a
// taller house on each chamfered corner (often with a little domed tribune),
// stair huts and water tanks on the terraces.
// ---------------------------------------------------------------------------

const PAINT = ["#efe3cb", "#e3c9a0", "#e8bfae", "#d9d2c4", "#efdcaa", "#dcc1a4", "#cfd3c2", "#e9d6c0", "#d8b08c", "#c9b8a6"];
const DEPTH = 2.35;
const FLOOR = 0.34;

/** A façade tile: 4 bays × 3 floors of tall windows, shutters and iron balconies. */
function facadeTextures() {
  const draw = (glow: boolean) => (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const r = rng(glow ? 9 : 8);
    ctx.fillStyle = glow ? "#000" : "#ffffff";
    ctx.fillRect(0, 0, w, h);
    if (!glow) {
      // stucco, lightly mottled
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "120,90,60"},${0.03 + r() * 0.05})`;
        ctx.fillRect(r() * w, r() * h, 3 + r() * 18, 2 + r() * 10);
      }
    }
    const bays = 4;
    const floors = 3;
    const bw = w / bays;
    const fh = h / floors;
    for (let f = 0; f < floors; f++) {
      const y = f * fh;
      if (!glow) {
        // cornice
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(0, y, w, 4);
        ctx.fillStyle = "rgba(90,60,40,0.22)";
        ctx.fillRect(0, y + 4, w, 3);
      }
      for (let b = 0; b < bays; b++) {
        const x = b * bw + bw * 0.3;
        const ww = bw * 0.4;
        const wy = y + fh * 0.2;
        const wh = fh * 0.64;
        if (glow) {
          if (r() < 0.45) {
            const g = ctx.createLinearGradient(0, wy, 0, wy + wh);
            g.addColorStop(0, `rgba(255,${200 + r() * 40},${120 + r() * 60},1)`);
            g.addColorStop(1, `rgba(255,${160 + r() * 40},${80 + r() * 40},0.8)`);
            ctx.fillStyle = g;
            ctx.fillRect(x, wy, ww, wh);
          }
          continue;
        }
        // the window, with a stone surround
        ctx.fillStyle = "rgba(255,250,240,0.7)";
        ctx.fillRect(x - 3, wy - 4, ww + 6, wh + 5);
        ctx.fillStyle = "#2d2a2b";
        ctx.fillRect(x, wy, ww, wh);
        // shutters, some shut, most half open
        const shut = r();
        ctx.fillStyle = r() > 0.4 ? "#5f7f69" : "#8a6a4a";
        if (shut < 0.25) ctx.fillRect(x, wy, ww, wh);
        else {
          ctx.fillRect(x - ww * 0.32, wy, ww * 0.3, wh);
          ctx.fillRect(x + ww * 1.02, wy, ww * 0.3, wh);
        }
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        for (let s = 0; s < 6; s++) ctx.fillRect(x - ww * 0.32, wy + (s * wh) / 6, ww * 1.64, 1);
        // an iron balcony, and sometimes a geranium
        ctx.fillStyle = "#26211f";
        ctx.fillRect(x - ww * 0.25, wy + wh - 2, ww * 1.5, 3);
        ctx.fillRect(x - ww * 0.25, wy + wh - 16, ww * 1.5, 2);
        for (let k = 0; k <= 7; k++) ctx.fillRect(x - ww * 0.25 + (k / 7) * ww * 1.5, wy + wh - 16, 1.5, 15);
        if (r() < 0.3) {
          ctx.fillStyle = r() > 0.5 ? "#c9373c" : "#e0a238";
          ctx.beginPath();
          ctx.arc(x + ww * (0.1 + r() * 0.8), wy + wh - 18, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };
  const map = canvasTexture(256, 256, draw(false));
  const glow = canvasTexture(256, 256, draw(true));
  for (const t of [map, glow]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  }
  return { map, glow };
}

/** Terraces: tiles, drying laundry, a skylight or two. */
function roofTexture() {
  const t = canvasTexture(256, 256, (ctx, w, h) => {
    const r = rng(31);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) {
      for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) {
        ctx.fillStyle = `rgba(${150 + r() * 40},${110 + r() * 30},${90 + r() * 20},0.25)`;
        ctx.fillRect(x, y, 15, 15);
      }
    }
    for (let i = 0; i < 10; i++) {
      ctx.strokeStyle = "rgba(60,60,60,0.5)";
      const x = r() * w;
      const y = r() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 40, y);
      ctx.stroke();
      for (let k = 0; k < 5; k++) {
        ctx.fillStyle = ["#f2f2f2", "#6a8fc4", "#d45a5a", "#f0d060"][Math.floor(r() * 4)];
        ctx.fillRect(x + 4 + k * 8, y, 5, 7);
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

interface Geo {
  pos: number[];
  nor: number[];
  uv: number[];
  col: number[];
}

const _e1 = new THREE.Vector3();
const _e2 = new THREE.Vector3();

function quad(g: Geo, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, n: THREE.Vector3, uvs: number[], col: THREE.Color, shadeBottom: boolean) {
  // wind the quad so its front face points along n
  const facing = _e1.subVectors(b, a).cross(_e2.subVectors(c, a)).dot(n) >= 0;
  const vs = facing ? [a, b, c, a, c, d] : [a, c, b, a, d, c];
  const us = facing ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
  vs.forEach((v, i) => {
    g.pos.push(v.x, v.y, v.z);
    g.nor.push(n.x, n.y, n.z);
    g.uv.push(uvs[us[i] * 2], uvs[us[i] * 2 + 1]);
    // a little dirt at street level
    const k = shadeBottom && v.y < 0.01 ? 0.72 : 1;
    g.col.push(col.r * k, col.g * k, col.b * k);
  });
}

/** One building: a box standing on segment a→b, `depth` deep towards the inside. */
function building(walls: Geo, roofs: Geo, a: THREE.Vector2, b: THREE.Vector2, depth: number, h: number, col: THREE.Color) {
  const dir = b.clone().sub(a);
  const len = dir.length();
  dir.normalize();
  const inward = new THREE.Vector2(-dir.y, dir.x); // left of a→b
  const a2 = a.clone().addScaledVector(inward, depth);
  const b2 = b.clone().addScaledVector(inward, depth);
  const V = (p: THREE.Vector2, y: number) => new THREE.Vector3(p.x, y, p.y);
  const uS = len / 1.9;
  const vS = h / (FLOOR * 3);
  // street façade
  const out = new THREE.Vector3(-inward.x, 0, -inward.y);
  quad(walls, V(a, 0), V(b, 0), V(b, h), V(a, h), out, [0, 0, uS, 0, uS, vS, 0, vS], col, true);
  // courtyard façade
  quad(walls, V(b2, 0), V(a2, 0), V(a2, h), V(b2, h), new THREE.Vector3(inward.x, 0, inward.y), [0, 0, uS, 0, uS, vS, 0, vS], col.clone().multiplyScalar(0.92), true);
  // party walls (visible when a neighbour is shorter)
  const d = depth / 1.9;
  quad(walls, V(a2, 0), V(a, 0), V(a, h), V(a2, h), new THREE.Vector3(-dir.x, 0, -dir.y), [0, 0, d, 0, d, vS, 0, vS], col.clone().multiplyScalar(0.85), true);
  quad(walls, V(b, 0), V(b2, 0), V(b2, h), V(b, h), new THREE.Vector3(dir.x, 0, dir.y), [0, 0, d, 0, d, vS, 0, vS], col.clone().multiplyScalar(0.85), true);
  // the terrace
  const R = (p: THREE.Vector2) => [p.x / 3, p.y / 3];
  quad(roofs, V(a, h), V(b, h), V(b2, h), V(a2, h), new THREE.Vector3(0, 1, 0), [...R(a), ...R(b), ...R(b2), ...R(a2)], new THREE.Color("#d8cbb8").lerp(col, 0.25), false);
}

function box(walls: Geo, roofs: Geo, cx: number, cz: number, w: number, d: number, y: number, h: number, col: THREE.Color) {
  const a = new THREE.Vector2(cx - w / 2, cz + d / 2);
  const b = new THREE.Vector2(cx + w / 2, cz + d / 2);
  const V = (x: number, yy: number, z: number) => new THREE.Vector3(x, yy, z);
  const faces: [THREE.Vector3[], THREE.Vector3][] = [
    [[V(a.x, y, a.y), V(b.x, y, b.y), V(b.x, y + h, b.y), V(a.x, y + h, a.y)], V(0, 0, 1)],
    [[V(b.x, y, cz - d / 2), V(a.x, y, cz - d / 2), V(a.x, y + h, cz - d / 2), V(b.x, y + h, cz - d / 2)], V(0, 0, -1)],
    [[V(b.x, y, b.y), V(b.x, y, cz - d / 2), V(b.x, y + h, cz - d / 2), V(b.x, y + h, b.y)], V(1, 0, 0)],
    [[V(a.x, y, cz - d / 2), V(a.x, y, a.y), V(a.x, y + h, a.y), V(a.x, y + h, cz - d / 2)], V(-1, 0, 0)],
  ];
  // small things: no windows, so sample a blank corner of the façade tile
  for (const [q, n] of faces) quad(walls, q[0], q[1], q[2], q[3], n, [0.02, 0.02, 0.05, 0.02, 0.05, 0.05, 0.02, 0.05], col, false);
  quad(roofs, V(a.x, y + h, a.y), V(b.x, y + h, b.y), V(b.x, y + h, cz - d / 2), V(a.x, y + h, cz - d / 2), V(0, 1, 0), [0, 0, 0.1, 0, 0.1, 0.1, 0, 0.1], col, false);
}

/** A whole block, built house by house. */
function blockVariant(seed: number, tall: boolean) {
  const r = rng(seed);
  const walls: Geo = { pos: [], nor: [], uv: [], col: [] };
  const roofs: Geo = { pos: [], nor: [], uv: [], col: [] };
  const h0 = B - 0.05;
  // the chamfered outline, counter-clockwise so "left" is inside
  const pts = [
    [-h0 + CH, -h0],
    [h0 - CH, -h0],
    [h0, -h0 + CH],
    [h0, h0 - CH],
    [h0 - CH, h0],
    [-h0 + CH, h0],
    [-h0, h0 - CH],
    [-h0, -h0 + CH],
  ].map(([x, z]) => new THREE.Vector2(x, z));
  const height = () => (tall ? 2.2 + r() * 1.1 : 1.6 + r() * 0.9);
  const colour = () => new THREE.Color(PAINT[Math.floor(r() * PAINT.length)]).offsetHSL(0, 0, (r() - 0.5) * 0.06);
  for (let e = 0; e < 8; e++) {
    const a = pts[e];
    const b = pts[(e + 1) % 8];
    const len = a.distanceTo(b);
    const chamfer = e % 2 === 1;
    if (chamfer) {
      // the corner house: taller, and often a tribune with a little dome
      const h = height() + 0.35;
      const col = colour();
      building(walls, roofs, a, b, DEPTH * 0.9, h, col);
      if (r() < 0.55) {
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const inward = new THREE.Vector2(-(b.y - a.y), b.x - a.x).normalize();
        const c = mid.clone().addScaledVector(inward, 0.45);
        box(walls, roofs, c.x, c.y, 0.7, 0.7, h, 0.35, col);
        // (the dome is added as a separate mesh: see Domes)
      }
      continue;
    }
    // split the long side into houses of 1.0–2.0 units
    let t = 0;
    const dir = b.clone().sub(a).normalize();
    while (t < len - 0.01) {
      let w = 1.0 + r() * 1.0;
      if (len - (t + w) < 0.8) w = len - t;
      const p0 = a.clone().addScaledVector(dir, t);
      const p1 = a.clone().addScaledVector(dir, t + w);
      const h = height();
      const col = colour();
      building(walls, roofs, p0, p1, DEPTH, h, col);
      // a stair hut or a water tank on the terrace
      if (r() < 0.5) {
        const inward = new THREE.Vector2(-dir.y, dir.x);
        const c = p0.clone().add(p1).multiplyScalar(0.5).addScaledVector(inward, 0.9 + r() * 0.6);
        const s = 0.25 + r() * 0.25;
        box(walls, roofs, c.x, c.y, s, s, h, 0.2 + r() * 0.12, new THREE.Color("#e8e0d4"));
      }
      t += w;
    }
  }
  const toGeo = (g: Geo) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(g.pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(g.nor, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(g.uv, 2));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(g.col, 3));
    return geo;
  };
  return { walls: toGeo(walls), roofs: toGeo(roofs) };
}

interface Block {
  x: number;
  z: number;
  born: number;
  rot: number;
  variant: number;
}

const VARIANTS = 6;

export function Eixample() {
  const { blocks, byVariant } = useMemo(() => {
    const r = rng(2024);
    const blocks: Block[] = [];
    for (let j = -REACH; j <= REACH; j++) {
      for (let i = -REACH; i <= REACH; i++) {
        if (isSpecial(i, j)) continue;
        if (i * P + B < coastX(j * P)) continue;
        const born = birth(i, j);
        const tall = born > 1950;
        const v = Math.floor(r() * (VARIANTS / 2)) + (tall ? VARIANTS / 2 : 0);
        blocks.push({ x: i * P, z: j * P, born, rot: Math.floor(r() * 4) * (Math.PI / 2), variant: v });
      }
    }
    const byVariant = Array.from({ length: VARIANTS }, (_, v) => blocks.filter((b) => b.variant === v));
    return { blocks, byVariant };
  }, []);

  const { geos, mats } = useMemo(() => {
    const geos = Array.from({ length: VARIANTS }, (_, v) => blockVariant(100 + v * 17, v >= VARIANTS / 2));
    const f = facadeTextures();
    const roof = roofTexture();
    const mats = {
      walls: new THREE.MeshLambertMaterial({ map: f.map, emissiveMap: f.glow, emissive: new THREE.Color("#ffc47a"), emissiveIntensity: 0, vertexColors: true }),
      roofs: new THREE.MeshLambertMaterial({ map: roof, vertexColors: true }),
    };
    return { geos, mats };
  }, []);

  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const last = useRef(-1);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame(() => {
    put(mats.walls, "emissiveIntensity", W.light.night * 1.15);
    if (Math.abs(W.year - last.current) < 0.02) return;
    last.current = W.year;
    byVariant.forEach((list, v) => {
      const walls = refs.current[v * 2];
      const roofs = refs.current[v * 2 + 1];
      if (!walls || !roofs) return;
      let any = false;
      list.forEach((b, k) => {
        const p = easeOut(seg(W.year, b.born, b.born + 2.5));
        pos.set(b.x, 0, b.z);
        q.setFromAxisAngle(up, b.rot);
        // A block that isn't built yet must vanish, not lie flat: squashed to
        // the ground its terrace fights the fields for depth and flickers.
        // Growing, it starts a hair above the ground and rises from there.
        if (p <= 0) sc.set(0, 0, 0);
        else {
          sc.set(1, Math.max(0.02, p), 1);
          any = true;
        }
        m.compose(pos, q, sc);
        walls.setMatrixAt(k, m);
        roofs.setMatrixAt(k, m);
      });
      walls.visible = roofs.visible = any;
      walls.instanceMatrix.needsUpdate = true;
      roofs.instanceMatrix.needsUpdate = true;
    });
  });

  void blocks;
  return (
    <group>
      {byVariant.map((list, v) =>
        list.length ? (
          <group key={v}>
            <instancedMesh
              ref={(el) => {
                refs.current[v * 2] = el;
              }}
              args={[geos[v].walls, mats.walls, list.length]}
              castShadow
              receiveShadow
              frustumCulled={false}
            />
            <instancedMesh
              ref={(el) => {
                refs.current[v * 2 + 1] = el;
              }}
              args={[geos[v].roofs, mats.roofs, list.length]}
              receiveShadow
              frustumCulled={false}
            />
          </group>
        ) : null,
      )}
    </group>
  );
}
