"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { canvasTexture, rng } from "@/stage3d/lib/canvas";
import { font } from "@/stage3d/lib/fonts";
import { useLayout } from "@/stage3d/lib/layout";

import { CUE } from "../script";
import { flatGeometry, paintedFlats } from "./Basilica";
import { filmSound } from "../sound/bus";
import { BOARD, buildCatenary, gather, harden, type CatenaryModel } from "./catenary";
import type { RopeSim } from "./rope";
import { easeInOut, easeOut, env, put, seg, smooth, W } from "./world";

// The visions: what the building was meant to be, hanging in the air above
// what it was. Del Villar's Gothic plan; Gaudí's upside-down string model;
// the plaster models (and their smashing); the computer's wireframe.

// ---------------------------------------------------------------------------
// I. Del Villar's neo-Gothic church, as a blueprint.
// ---------------------------------------------------------------------------

function edges(g: THREE.BufferGeometry, out: number[]) {
  const e = new THREE.EdgesGeometry(g, 20);
  const a = e.attributes.position.array as ArrayLike<number>;
  for (let i = 0; i < a.length; i++) out.push(a[i]);
}

/** One half (z ≥ 0) of a sensible Gothic Revival church. */
function gothicHalf() {
  const v: number[] = [];
  const B = (w: number, h: number, d: number, x: number, y: number, z: number) => edges(new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z), v);
  // nave and aisles
  B(7.5, 4.6, 1.3, -2.25, 0, 0.65);
  B(7.5, 2.6, 1.2, -2.25, 0, 1.9);
  // roof
  const roof = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-6, 4.6, 1.3),
    new THREE.Vector3(1.5, 4.6, 1.3),
    new THREE.Vector3(-6, 6.6, 0),
    new THREE.Vector3(1.5, 6.6, 0),
  ]);
  roof.setIndex([0, 1, 3, 0, 3, 2]);
  edges(roof, v);
  // transept arm
  B(2.4, 4.6, 1.6, 0.2, 0, 2.6);
  // buttresses & pinnacles along the aisle
  for (let k = 0; k < 6; k++) {
    const x = -5.6 + k * 1.3;
    B(0.25, 3.3, 0.5, x, 0, 2.6);
    const p = new THREE.ConeGeometry(0.16, 0.9, 4).translate(x, 3.75, 2.6);
    edges(p, v);
    // a lancet window between buttresses
    const w = new THREE.Shape();
    w.moveTo(-0.25, 0);
    w.lineTo(-0.25, 1.1);
    w.quadraticCurveTo(-0.25, 1.5, 0, 1.7);
    w.quadraticCurveTo(0.25, 1.5, 0.25, 1.1);
    w.lineTo(0.25, 0);
    const pts = w.getPoints(8);
    for (let i = 0; i < pts.length - 1; i++) {
      v.push(x + 0.65 + pts[i].x, 0.5 + pts[i].y, 2.51, x + 0.65 + pts[i + 1].x, 0.5 + pts[i + 1].y, 2.51);
    }
  }
  // the apse: a half-polygon
  const ap = new THREE.CylinderGeometry(2.1, 2.1, 4.2, 10, 1, true, 0, Math.PI / 2).translate(1.5, 2.1, 0);
  edges(ap, v);
  // the west tower and its spire (on the axis: this half gets half of it)
  B(2.4, 9, 1.2, -7.2, 0, 0.6);
  B(1.8, 2.2, 0.9, -7.2, 9, 0.45);
  const spire = new THREE.ConeGeometry(1.25, 6.5, 8, 1, true, 0, Math.PI).translate(-7.2, 11.2 + 3.25, 0);
  edges(spire, v);
  for (const dx of [-1.2, 1.2]) {
    const p = new THREE.ConeGeometry(0.2, 1.6, 4).translate(-7.2 + dx, 9.8, 1.1);
    edges(p, v);
  }
  // rose window
  for (let k = 0; k < 24; k++) {
    const a0 = (k / 24) * Math.PI;
    const a1 = ((k + 1) / 24) * Math.PI;
    v.push(-8.41, 6.2 + Math.sin(a0 - Math.PI / 2) * 0.8, Math.cos(a0 - Math.PI / 2) * 0.8, -8.41, 6.2 + Math.sin(a1 - Math.PI / 2) * 0.8, Math.cos(a1 - Math.PI / 2) * 0.8);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  return g;
}

function blueprintTexture() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = "#1f4f8f";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(200,225,255,0.18)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // the plan, drawn in white
    ctx.strokeStyle = "rgba(235,245,255,0.85)";
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.2, h * 0.3, w * 0.55, h * 0.4);
    ctx.strokeRect(w * 0.55, h * 0.12, w * 0.12, h * 0.76);
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.5, h * 0.2, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.strokeRect(w * 0.08, h * 0.38, w * 0.12, h * 0.24);
    for (let k = 0; k < 7; k++) {
      ctx.beginPath();
      ctx.arc(w * (0.25 + k * 0.07), h * 0.5, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(235,245,255,0.9)";
    ctx.font = font.type(700, 26);
    ctx.fillText("TEMPLO EXPIATORIO DE LA SAGRADA FAMILIA", 40, h - 60);
    ctx.font = font.type(400, 20);
    ctx.fillText("Proyecto · F. de P. del Villar, arquitecto · 1882", 40, h - 30);
    ctx.strokeStyle = "rgba(235,245,255,0.6)";
    ctx.strokeRect(20, 20, w - 40, h - 40);
  });
}

function Villar() {
  const root = useRef<THREE.Group>(null);
  const halves = useRef<(THREE.Group | null)[]>([]);
  const geo = useMemo(() => gothicHalf(), []);
  const line = useMemo(() => new THREE.LineBasicMaterial({ color: "#2f6fd0", transparent: true, depthWrite: false }), []);
  const sheet = useMemo(() => new THREE.MeshBasicMaterial({ map: blueprintTexture(), transparent: true, depthWrite: false, side: THREE.DoubleSide }), []);
  // the sheet, split lengthwise so it can be torn
  const sheetGeos = useMemo(() => {
    const top = new THREE.PlaneGeometry(18, 4.5);
    const uvT = top.attributes.uv;
    for (let i = 0; i < uvT.count; i++) uvT.setY(i, 0.5 + uvT.getY(i) * 0.5);
    top.translate(0, 2.25, 0);
    const bottom = new THREE.PlaneGeometry(18, 4.5);
    const uvB = bottom.attributes.uv;
    for (let i = 0; i < uvB.count; i++) uvB.setY(i, uvB.getY(i) * 0.5);
    bottom.translate(0, -2.25, 0);
    return [top, bottom];
  }, []);
  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const rise = easeOut(seg(W.t, ...CUE.villar.rise));
    const tear = easeInOut(seg(W.t, ...CUE.villar.tear));
    const on = rise > 0 && tear < 1;
    g.visible = on;
    if (!on) return;
    put(line, "opacity", (0.35 + 0.65 * rise) * (1 - tear) * (0.85 + 0.15 * Math.sin(W.time * 20)));
    put(sheet, "opacity", Math.min(1, rise * 1.5) * (1 - tear) * 0.7);
    halves.current.forEach((h, k) => {
      if (!h) return;
      const s = k === 0 ? 1 : -1;
      h.scale.set(1, Math.max(0.001, rise), s);
      h.position.set(-tear * 1.5, -tear * 2.5, s * tear * 4);
      h.rotation.set(s * tear * 0.7, 0, s * tear * 0.15);
    });
  });
  return (
    <group ref={root}>
      {[0, 1].map((k) => (
        <group
          key={k}
          ref={(el) => {
            halves.current[k] = el;
          }}
        >
          <lineSegments geometry={geo} material={line} />
          <mesh geometry={sheetGeos[0]} material={sheet} rotation={[-Math.PI / 2, 0, 0.12]} position={[-2, 0.05, 1.5]} scale={0.7} />
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// II. The catenary model: strings and little sacks of shot, hung from a board,
//     then turned the right way up. Full size, which Gaudí's was not.
// ---------------------------------------------------------------------------

/** A little sack of shot: a pear of cloth, tied at the top where the string holds it. */
function sackGeometry() {
  const prof = [
    [0.0, -0.3],
    [0.09, -0.285],
    [0.135, -0.22],
    [0.14, -0.14],
    [0.115, -0.07],
    [0.06, -0.03],
    [0.035, -0.015],
    [0.05, 0.0],
    [0.0, 0.01],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(prof, 9);
}

// the cord, as camera-facing ribbons: a line one pixel wide vanishes on a pale sky
const CORD_W = 0.034;

/** Rewrite the ribbon quads from the simulation, each turned to face `eye` (model space). */
function drawCords(sim: RopeSim, ribbon: THREE.BufferGeometry, eye: THREE.Vector3) {
  const P = sim.pos;
  const R = ribbon.attributes.position.array as Float32Array;
  const w = CORD_W / 2;
  for (let k = 0; k < sim.links; k++) {
    const i = sim.linkA(k) * 3;
    const j = sim.linkB(k) * 3;
    const ax = P[i];
    const ay = P[i + 1];
    const az = P[i + 2];
    const bx = P[j];
    const by = P[j + 1];
    const bz = P[j + 2];
    // side = (b − a) × (eye − mid), normalised
    const tx = bx - ax;
    const ty = by - ay;
    const tz = bz - az;
    const ex = eye.x - (ax + bx) / 2;
    const ey = eye.y - (ay + by) / 2;
    const ez = eye.z - (az + bz) / 2;
    let sx = ty * ez - tz * ey;
    let sy = tz * ex - tx * ez;
    let sz = tx * ey - ty * ex;
    const sl = Math.hypot(sx, sy, sz) || 1;
    sx = (sx / sl) * w;
    sy = (sy / sl) * w;
    sz = (sz / sl) * w;
    const o = k * 12;
    R[o] = ax - sx;
    R[o + 1] = ay - sy;
    R[o + 2] = az - sz;
    R[o + 3] = ax + sx;
    R[o + 4] = ay + sy;
    R[o + 5] = az + sz;
    R[o + 6] = bx - sx;
    R[o + 7] = by - sy;
    R[o + 8] = bz - sz;
    R[o + 9] = bx + sx;
    R[o + 10] = by + sy;
    R[o + 11] = bz + sz;
  }
  ribbon.attributes.position.needsUpdate = true;
}

function placeSacks(model: CatenaryModel, mesh: THREE.InstancedMesh, t: { m: THREE.Matrix4; p: THREE.Vector3; q: THREE.Quaternion; s: THREE.Vector3 }) {
  const P = model.sim.pos;
  model.sacks.forEach((sk, k) => {
    const i = sk.i * 3;
    t.p.set(P[i], P[i + 1], P[i + 2]);
    t.s.setScalar(sk.size);
    t.m.compose(t.p, t.q, t.s);
    mesh.setMatrixAt(k, t.m);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

function Catenary() {
  const { tier } = useLayout();
  const root = useRef<THREE.Group>(null);
  const pivot = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const sackRef = useRef<THREE.InstancedMesh>(null);

  const model = useMemo(() => {
    const m = buildCatenary(tier === "high" ? 16 : 10);
    // it starts gathered up under the board, waiting to be let down
    gather(m);
    return m;
  }, [tier]);

  const ribbon = useMemo(() => {
    const L = model.sim.links;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(L * 4 * 3);
    const uv = new Float32Array(L * 4 * 2);
    const idx = new Uint32Array(L * 6);
    for (let k = 0; k < L; k++) {
      uv.set([0, 0, 1, 0, 0, 1, 1, 1], k * 8);
      idx.set([k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 2, k * 4 + 1, k * 4 + 3], k * 6);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    return geo;
  }, [model]);

  const cordMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#9a6630", transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    [],
  );
  const sackMat = useMemo(() => new THREE.MeshLambertMaterial({ color: "#caa679", transparent: true, emissive: new THREE.Color("#4a3010") }), []);
  const boardMat = useMemo(() => new THREE.MeshLambertMaterial({ color: "#a4825c", transparent: true, depthWrite: false }), []);
  const sackGeo = useMemo(() => sackGeometry(), []);

  // the visitor's hand: where the pointer is, and when it last moved
  const hand = useRef({ x: 0, y: 0, moved: -1, lastPluck: 0 });
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const h = hand.current;
      h.x = (e.clientX / window.innerWidth) * 2 - 1;
      h.y = -(e.clientY / window.innerHeight) * 2 + 1;
      h.moved = performance.now();
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
    };
  }, []);

  const tmp = useMemo(
    () => ({
      inv: new THREE.Matrix4(),
      cam: new THREE.Vector3(),
      ray: new THREE.Raycaster(),
      o: new THREE.Vector3(),
      d: new THREE.Vector3(),
      m: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      p: new THREE.Vector3(),
      s: new THREE.Vector3(),
      ndc: new THREE.Vector2(),
    }),
    [],
  );
  const state = useRef({ on: false, released: -1, twanged: false, flip: 0, omega: 0 });

  useFrame(({ camera, clock }, delta) => {
    const g = root.current;
    const st = state.current;
    if (!g) return;
    const c = CUE.catenary;
    const vin = easeOut(seg(W.t, ...c.in));
    const flip = easeInOut(seg(W.t, ...c.flip));
    const out = seg(W.t, ...c.out);
    const on = vin > 0 && out < 1;
    g.visible = on;
    if (!on) {
      // taken down again: next time it is let down afresh
      if (st.on) {
        gather(model);
        st.released = -1;
        st.twanged = false;
      }
      st.on = false;
      return;
    }
    const now = clock.elapsedTime;
    if (!st.on) {
      st.on = true;
      st.released = now;
      st.flip = flip;
      st.omega = 0;
    }
    const a = vin * (1 - out);
    put(cordMat, "opacity", a);
    put(sackMat, "opacity", a);
    // the board is only scaffolding: it goes as the model turns over
    put(boardMat, "opacity", a * 0.55 * (1 - smooth(seg(flip, 0, 0.35))));
    if (pivot.current) {
      pivot.current.rotation.x = flip * Math.PI;
      // it lowers into place as the strings are let down
      pivot.current.position.y = BOARD / 2 + (1 - vin) * 6;
    }
    const grp = inner.current;
    if (!grp) return;
    grp.updateWorldMatrix(true, false);
    tmp.inv.copy(grp.matrixWorld).invert();

    // --- physics, in the model's own frame (gravity always hangs the strings "down" it)
    const sim = model.sim;
    const dt = Math.min(delta, 1 / 30);
    // turning it over swings everything: Euler and centrifugal forces about the pivot
    const theta = flip * Math.PI;
    const omega = dt > 0 ? (theta - st.flip * Math.PI) / dt : 0;
    const alpha = dt > 0 ? (omega - st.omega) / dt : 0;
    st.flip = flip;
    st.omega = omega;
    const yc = BOARD / 2;
    const clampA = (v: number) => Math.max(-60, Math.min(60, v));
    // once upright, the curves are stone: the strings stop swinging
    const stone = smooth(seg(flip, 0.55, 1));
    const time = W.time;
    put(sim, "wind", (x: number, y: number, z: number, o: Float32Array) => {
      const yy = y - yc;
      const gust = (1 - stone) * (0.9 + 0.6 * Math.sin(time * 0.37));
      o[0] = gust * Math.sin(time * 0.9 + y * 0.35 + z * 0.2) * 0.9;
      o[1] = clampA(alpha * z * 0.4 + omega * omega * yy * 0.4);
      o[2] = gust * Math.sin(time * 0.7 + x * 0.4 + y * 0.21) * 0.6 + clampA(-alpha * yy * 0.4 + omega * omega * z * 0.4);
    });
    // the hand, if it has moved lately and the model still hangs
    const h = hand.current;
    if (stone < 0.5 && performance.now() - h.moved < 120) {
      tmp.ray.setFromCamera(tmp.ndc.set(h.x, h.y), camera);
      tmp.o.copy(tmp.ray.ray.origin).applyMatrix4(tmp.inv);
      tmp.d.copy(tmp.ray.ray.direction).transformDirection(tmp.inv);
      const hit = sim.push(tmp.o.x, tmp.o.y, tmp.o.z, tmp.d.x, tmp.d.y, tmp.d.z, 0.55, 0.5);
      if (hit > 0.25 && now - h.lastPluck > 0.16) {
        h.lastPluck = now;
        filmSound("pluck", { pan: h.x * 0.8, gain: 0.08 + hit * 0.14 });
      }
    }
    const opts = model.opts;
    sim.step(dt, { ...opts, damping: opts.damping - stone * 0.25 });
    // turning over, the strings harden into the shape they hang in when still
    // (even if the visitor turned it before they had stopped swinging)
    const firm = smooth(seg(flip, 0.2, 0.9));
    if (firm > 0) harden(model, Math.min(1, firm * 12 * dt));
    // a hundred strings snapping taut, a second after they are let down
    if (!st.twanged && st.released >= 0 && now - st.released > 0.95) {
      st.twanged = true;
      if (vin > 0.3) filmSound("twang", { gain: 0.3 });
    }

    // --- draw: the cords as ribbons turned to the lens, the sacks where they hang
    tmp.cam.copy(camera.position).applyMatrix4(tmp.inv);
    drawCords(sim, ribbon, tmp.cam);
    if (sackRef.current) placeSacks(model, sackRef.current, tmp);
  });

  return (
    <group ref={root}>
      <group ref={pivot}>
        {/* pivot about the model's middle height */}
        <group ref={inner} position={[0, -BOARD / 2, 0]}>
          <mesh geometry={ribbon} material={cordMat} frustumCulled={false} />
          <instancedMesh ref={sackRef} args={[sackGeo, sackMat, model.sacks.length]} frustumCulled={false} />
          <mesh position={[0.2, BOARD + 0.12, 0]} material={boardMat}>
            <boxGeometry args={[6.4, 0.18, 9.6]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// III. The plaster model of the whole design: smashed, mended, and later
//      redrawn by the computers as a wireframe. Both are the painted flats
//      again, seen through a different shader.
// ---------------------------------------------------------------------------

const GHOST_VERT = /* glsl */ `
  varying vec2 vUv;
  #include <common>
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const GHOST_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uTexel;
  uniform float uOpacity;
  uniform float uMode;
  uniform float uTime;
  varying vec2 vUv;
  #include <common>
  #include <fog_pars_fragment>
  float lum(vec2 uv) {
    vec4 c = texture2D(uMap, uv);
    return dot(c.rgb, vec3(0.299, 0.587, 0.114)) * c.a + (1.0 - c.a) * 1.5;
  }
  void main() {
    vec4 c = texture2D(uMap, vUv);
    if (uMode < 0.5) {
      // plaster: white, with the carving just showing through
      if (c.a < 0.5) discard;
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      vec3 col = mix(vec3(0.99, 0.97, 0.93), vec3(l * 0.5 + 0.55), 0.4);
      gl_FragColor = vec4(col, uOpacity);
    } else {
      // the computer's drawing: edges only, in phosphor green
      vec2 t = uTexel * 1.5;
      float gx = -lum(vUv + vec2(-t.x, t.y)) - 2.0 * lum(vUv + vec2(-t.x, 0.0)) - lum(vUv + vec2(-t.x, -t.y))
                 + lum(vUv + vec2(t.x, t.y)) + 2.0 * lum(vUv + vec2(t.x, 0.0)) + lum(vUv + vec2(t.x, -t.y));
      float gy = -lum(vUv + vec2(-t.x, -t.y)) - 2.0 * lum(vUv + vec2(0.0, -t.y)) - lum(vUv + vec2(t.x, -t.y))
                 + lum(vUv + vec2(-t.x, t.y)) + 2.0 * lum(vUv + vec2(0.0, t.y)) + lum(vUv + vec2(t.x, t.y));
      float e = length(vec2(gx, gy));
      if (e < 0.35) discard;
      float scan = 0.75 + 0.25 * sin(vUv.y * 900.0 - uTime * 6.0);
      gl_FragColor = vec4(vec3(0.35, 1.0, 0.68) * scan, uOpacity * clamp(e * 0.9, 0.0, 1.0));
    }
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

function sampleShards(n: number) {
  const r = rng(1936);
  const pts: THREE.Vector3[] = [];
  for (const p of paintedFlats()) {
    const f = p.flat;
    if (f.piece === "workshop" || f.piece === "schools" || f.piece === "crypt" || f.piece === "glory") continue;
    const cw = Math.max(4, Math.round(f.w * 7));
    const ch = Math.max(4, Math.round(f.h * 7));
    const cv = document.createElement("canvas");
    cv.width = cw;
    cv.height = ch;
    const ctx = cv.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(p.sheet.map, 0, 0, cw, ch);
    const d = ctx.getImageData(0, 0, cw, ch).data;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        if (d[(y * cw + x) * 4 + 3] > 128) {
          const u = (x + r()) / cw - 0.5;
          pts.push(new THREE.Vector3(f.x + u * f.w * f.face, f.y + (1 - (y + r()) / ch) * f.h, f.z));
        }
      }
    }
  }
  const out: { p: THREE.Vector3; off: THREE.Vector3; spin: THREE.Vector3; s: number }[] = [];
  for (let k = 0; k < n && pts.length; k++) {
    const p = pts[Math.floor(r() * pts.length)];
    const dir = p.clone().sub(new THREE.Vector3(0, 7, 0)).normalize();
    dir.x += (r() - 0.5) * 0.8;
    dir.y += (r() - 0.3) * 0.8;
    dir.z += (r() - 0.5) * 0.8 + 0.4;
    const off = dir.normalize().multiplyScalar(4 + r() * 12);
    out.push({ p, off, spin: new THREE.Vector3(r() * 6, r() * 6, r() * 6), s: 0.14 + r() * 0.26 });
  }
  return out;
}

function Ghosts() {
  const { tier } = useLayout();
  const { flats, plasterU, wireU, timeU } = useMemo(() => {
    const plasterU = { value: 0 };
    const wireU = { value: 0 };
    const timeU = { value: 0 };
    const flats = paintedFlats()
      .filter((p) => !["workshop", "schools", "crypt", "glory"].includes(p.flat.piece))
      .map((p) => {
        const mk = (mode: number, opacity: { value: number }) =>
          new THREE.ShaderMaterial({
            vertexShader: GHOST_VERT,
            fragmentShader: GHOST_FRAG,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            fog: true,
            blending: mode ? THREE.AdditiveBlending : THREE.NormalBlending,
            uniforms: {
              ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
              uMap: { value: p.map },
              uTexel: { value: new THREE.Vector2(1 / p.sheet.map.width, 1 / p.sheet.map.height) },
              uOpacity: opacity,
              uMode: { value: mode },
              uTime: timeU,
            },
          });
        return { geo: flatGeometry(p.flat, 0.03), plaster: mk(0, plasterU), wire: mk(1, wireU) };
      });
    return { flats, plasterU, wireU, timeU };
  }, []);
  const shards = useMemo(() => sampleShards(tier === "high" ? 1600 : 800), [tier]);
  const shardGeo = useMemo(() => new THREE.TetrahedronGeometry(1, 0), []);
  const shardMat = useMemo(() => new THREE.MeshLambertMaterial({ color: "#f4efe4", emissive: new THREE.Color("#ffe9c8"), emissiveIntensity: 0.25 }), []);
  const plasterRef = useRef<THREE.Group>(null);
  const wireRef = useRef<THREE.Group>(null);
  const shardRef = useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const t = W.t;
    put(timeU, "value", W.time);
    // the model appears over the burning site, bursts, is mended, and fades
    const shown = env(t, 36.15, 36.55, 39.7, 40.4);
    const burst = easeOut(seg(t, ...CUE.shatter.burst));
    const mend = easeInOut(seg(t, ...CUE.shatter.mend));
    const s = burst * (1 - mend);
    const po = shown * 0.5 * (1 - Math.min(1, s * 3));
    put(plasterU, "value", po);
    if (plasterRef.current) plasterRef.current.visible = po > 0.001;
    const shardsOn = shown > 0 && s > 0.002;
    const sm = shardRef.current;
    if (sm) {
      sm.visible = shardsOn;
      if (shardsOn) {
        shards.forEach((d, k) => {
          const f = s * (0.8 + 0.2 * Math.sin(k));
          pos.copy(d.p).addScaledVector(d.off, f);
          pos.y -= f * f * 2.5;
          e.set(d.spin.x * f, d.spin.y * f, d.spin.z * f);
          q.setFromEuler(e);
          const size = d.s * (0.6 + 0.4 * Math.min(1, s * 4));
          sc.set(size, size, size);
          m.compose(pos, q, sc);
          sm.setMatrixAt(k, m);
        });
        sm.instanceMatrix.needsUpdate = true;
      }
    }
    // the computer's version, in phosphor green
    const w = env(t, CUE.wire[0], CUE.wire[0] + 0.5, CUE.wire[1] - 0.6, CUE.wire[1]);
    put(wireU, "value", w * (0.85 + 0.15 * Math.sin(W.time * 40)));
    if (wireRef.current) wireRef.current.visible = w > 0.001;
  });
  return (
    <group>
      <group ref={plasterRef} visible={false}>
        {flats.map((f, k) => (
          <mesh key={k} geometry={f.geo} material={f.plaster} renderOrder={2} />
        ))}
      </group>
      <group ref={wireRef} visible={false}>
        {flats.map((f, k) => (
          <mesh key={k} geometry={f.geo} material={f.wire} renderOrder={3} />
        ))}
      </group>
      <instancedMesh ref={shardRef} args={[shardGeo, shardMat, Math.max(1, shards.length)]} frustumCulled={false} visible={false} castShadow />
    </group>
  );
}

export function Visions() {
  return (
    <group>
      <Villar />
      <Catenary />
      <Ghosts />
    </group>
  );
}
