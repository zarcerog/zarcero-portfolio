"use client";

import { useLoader } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";

import { WORKS, type Work } from "@/theatre/content";

import { workCue } from "../cues";
import { dropTexture, rng } from "../lib/canvas";
import { roundedBox } from "../lib/geom";
import { cardboard, haloMaterial, matcapTexture, mats } from "../lib/materials";
import { gameTexture, journalTexture, letterTexture, photoTexture } from "../lib/paint";
import { plaqueTexture } from "../lib/signs";
import { Instances, mx, SetShell } from "./shell";

// ACT III — the works. Each production gets a set of its own: a painted cloth
// flown in with the work framed upon it, props trucked on from both wings in
// mirror image, and a centrepiece that rides up through the trap.

export const DROP_Z = -3.2;
export const FRAME_Y = 4.95;

function lighten(hex: string, k: number) {
  return "#" + new THREE.Color(hex).lerp(new THREE.Color("#ffffff"), k).getHexString();
}

function giltFrame(w: number, h: number, border: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2);
  s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, h / 2);
  s.lineTo(-w / 2, h / 2);
  s.closePath();
  const hole = new THREE.Path();
  const iw = w / 2 - border;
  const ih = h / 2 - border;
  hole.moveTo(-iw, -ih);
  hole.lineTo(-iw, ih);
  hole.lineTo(iw, ih);
  hole.lineTo(iw, -ih);
  hole.closePath();
  s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: border * 0.35, bevelThickness: 0.12, bevelSegments: 5, curveSegments: 4 });
}

function Screenshot({ src, w, h, position }: { src: string; w: number; h: number; position?: string }) {
  const tex = useLoader(THREE.TextureLoader, src);
  const cropped = useMemo(() => {
    const t = tex.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    const img = t.image as { width: number; height: number };
    const imgAspect = img.width / img.height;
    const aspect = w / h;
    if (imgAspect > aspect) {
      const r = aspect / imgAspect;
      t.repeat.set(r, 1);
      t.offset.set(position?.startsWith("left") ? 0 : (1 - r) / 2, 0);
    } else {
      const r = imgAspect / aspect;
      t.repeat.set(1, r);
      t.offset.set(0, 1 - r);
    }
    t.needsUpdate = true;
    return t;
  }, [tex, w, h, position]);
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={cropped} color="#e9e4dc" />
    </mesh>
  );
}

function CampusBoard() {
  const holds = useMemo(() => {
    const r = rng(8);
    const colors = ["#b8323a", "#dcae45", "#2f6a68", "#5b4c9a"];
    return Array.from({ length: 16 }, (_, i) => ({
      x: (r() - 0.5) * 2.2,
      y: (r() - 0.5) * 3.0,
      s: 0.08 + r() * 0.08,
      c: colors[i % colors.length],
      rot: r() * Math.PI,
    }));
  }, []);
  const m = mats();
  return (
    <group>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[2.6, 3.4, 0.06]} />
        <meshLambertMaterial color="#e2c28e" />
      </mesh>
      {holds.map((h, i) => (
        <mesh key={i} position={[h.x, h.y, 0.04]} rotation={[0.4, h.rot, 0]} scale={[1.4, 1, 0.7]}>
          <dodecahedronGeometry args={[h.s, 0]} />
          <meshLambertMaterial color={h.c} />
        </mesh>
      ))}
      {[
        [0.35, 0.6],
        [-0.3, 1.15],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.16]} material={m.cream}>
          <sphereGeometry args={[0.07, 16, 12]} />
        </mesh>
      ))}
    </group>
  );
}

/** The cloth, the gilt frame with the work in it, its picture light and plaque. */
function Cloth({ work, index, extra }: { work: Work; index: number; extra?: ReactNode }) {
  const m = mats();
  const cloth = useMemo(() => {
    const g = new THREE.PlaneGeometry(14.5, 8.4, 64, 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 2.1) * 0.05);
    g.computeVertexNormals();
    return g;
  }, []);
  const clothMat = useMemo(() => new THREE.MeshLambertMaterial({ map: dropTexture(work.backdrop, work.palette.bg, lighten(work.palette.bg, 0.3)) }), [work]);
  const plaque = useMemo(() => plaqueTexture(`Scene ${index + 1} of ${WORKS.length}`, work.title, work.kind), [work, index]);
  const size = work.frame === "landscape" ? { w: 5.6, h: 3.6, border: 0.3 } : work.frame === "phone" ? { w: 2.2, h: 4.1, border: 0.25 } : { w: 3.1, h: 3.95, border: 0.26 };
  const frameGeo = useMemo(() => giltFrame(size.w, size.h, size.border), [size.w, size.h, size.border]);
  const innerW = size.w - size.border * 2 - 0.08;
  const innerH = size.h - size.border * 2 - 0.08;
  return (
    <group position={[0, 0, DROP_Z]}>
      <mesh position={[0, 8.45, 0]} rotation={[0, 0, Math.PI / 2]} material={m.blackMetal}>
        <cylinderGeometry args={[0.07, 0.07, 15, 10]} />
      </mesh>
      <mesh geometry={cloth} material={clothMat} position={[0, 4.2, 0]} />
      <group position={[0, FRAME_Y, 0.14]}>
        <mesh geometry={frameGeo} material={m.gold} />
        <mesh position={[0, 0, 0.02]} material={m.cream}>
          <planeGeometry args={[innerW + 0.1, innerH + 0.1]} />
        </mesh>
        <group position={[0, 0, 0.05]}>{work.image ? <Screenshot src={work.image} w={innerW - 0.12} h={innerH - 0.12} position={work.imagePosition} /> : <CampusBoard />}</group>
        <group position={[0, size.h / 2 + 0.3, 0.35]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={m.brass}>
            <cylinderGeometry args={[0.07, 0.07, Math.min(2, size.w * 0.6), 16]} />
          </mesh>
          <mesh position={[0, -0.25, -0.2]} rotation={[0.6, 0, 0]} material={m.brass}>
            <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
          </mesh>
        </group>
        <mesh position={[0, -size.h / 2 - 0.62, 0.05]}>
          <boxGeometry args={[2.6, 0.76, 0.04]} />
          <meshLambertMaterial attach="material-0" color="#8a6423" />
          <meshLambertMaterial attach="material-1" color="#8a6423" />
          <meshLambertMaterial attach="material-2" color="#8a6423" />
          <meshLambertMaterial attach="material-3" color="#8a6423" />
          <meshLambertMaterial attach="material-4" map={plaque} />
          <meshLambertMaterial attach="material-5" color="#8a6423" />
        </mesh>
      </group>
      {extra}
    </group>
  );
}

/** A plinth of card, with a lip, for putting things on. */
function Plinth({ w = 0.7, h = 0.9, d = 0.7, paint = "#f4efe4" }: { w?: number; h?: number; d?: number; paint?: string }) {
  return (
    <group>
      <mesh position={[0, h / 2, 0]} material={cardboard(paint)}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <mesh position={[0, h + 0.03, 0]} material={cardboard(paint)}>
        <boxGeometry args={[w + 0.1, 0.06, d + 0.1]} />
      </mesh>
    </group>
  );
}

/** A card chair, as in the schoolroom: side panels for legs. */
function CardChair({ paint, rot = 0 }: { paint: string; rot?: number }) {
  const mat = cardboard(paint);
  return (
    <group rotation={[0, rot, 0]}>
      <mesh position={[0, 0.47, 0]} material={mat}>
        <boxGeometry args={[0.5, 0.05, 0.46]} />
      </mesh>
      {[-0.22, 0.22].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.225, 0]} material={mat}>
            <boxGeometry args={[0.035, 0.45, 0.42]} />
          </mesh>
          <mesh position={[x, 0.5, -0.21]} material={mat}>
            <boxGeometry args={[0.04, 1.0, 0.04]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.82, -0.21]} material={mat}>
        <boxGeometry args={[0.5, 0.34, 0.03]} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Scene 1 — zarcerog.studio: a reading room for design culture                */
/* -------------------------------------------------------------------------- */

const SPINES = ["#a3232e", "#2f6a68", "#dcae45", "#3a1d1b", "#e9b8b3", "#6fa6a8", "#f6ecd6", "#5b4c9a"];

function Studio({ work, index }: { work: Work; index: number }) {
  const m = mats();
  const records = useRef<(THREE.Mesh | null)[]>([]);
  const journal = useMemo(() => journalTexture(), []);
  const letters = useMemo(() => [letterTexture("A", "#3a1d1b"), letterTexture("a", "#a3232e")], []);
  const books = useMemo(() => {
    const r = rng(12);
    const mats4: THREE.Matrix4[] = [];
    const cols: string[] = [];
    [0.55, 1.25, 1.95, 2.65].forEach((y) => {
      let x = -0.66;
      while (x < 0.62) {
        const w = 0.07 + r() * 0.06;
        const h = 0.42 + r() * 0.18;
        mats4.push(mx(x + w / 2, y + h / 2, 0, 0, 0, r() > 0.9 ? 0.18 : 0, [w, h, 0.34]));
        cols.push(SPINES[Math.floor(r() * SPINES.length)]);
        x += w + 0.01;
      }
    });
    return { mats4, cols };
  }, []);
  const unit = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const bookMat = useMemo(() => new THREE.MeshLambertMaterial({ map: mats().kraft }), []);
  const cue = workCue(index);
  const spin = (t: number) => {
    if (t < cue.a || t > cue.d) return;
    const k = performance.now() / 1000;
    records.current.forEach((rec, i) => {
      if (rec) rec.rotation.y = k * 3.5 * (i ? -1 : 1);
    });
  };
  const side = (
    <group>
      {/* a bookcase, well read */}
      <group position={[-4.7, 0, -2.3]}>
        <mesh position={[0, 1.6, -0.2]} material={cardboard("#7a2c28")}>
          <boxGeometry args={[1.55, 3.2, 0.06]} />
        </mesh>
        {[-0.76, 0.76].map((x) => (
          <mesh key={x} position={[x, 1.6, 0]} material={cardboard("#8e3a33")}>
            <boxGeometry args={[0.05, 3.2, 0.46]} />
          </mesh>
        ))}
        {[0.5, 1.2, 1.9, 2.6, 3.2].map((y) => (
          <mesh key={y} position={[0, y, 0]} material={cardboard("#8e3a33")}>
            <boxGeometry args={[1.55, 0.05, 0.46]} />
          </mesh>
        ))}
        <Instances geometry={unit} material={bookMat} matrices={books.mats4} colors={books.cols} />
        {/* and on top, a model of a building */}
        <group position={[0, 3.23, 0]}>
          {[
            [0, 0.2, 0, 1.0, 0.4, 0.4],
            [-0.18, 0.55, 0, 0.5, 0.3, 0.36],
            [0.2, 0.62, 0.02, 0.3, 0.44, 0.3],
          ].map(([x, y, z, w, h, d], i) => (
            <mesh key={i} position={[x, y, z]} material={cardboard("#fbf6ea")}>
              <boxGeometry args={[w, h, d]} />
            </mesh>
          ))}
        </group>
      </group>
      {/* a record player on a plinth, Kind of Blue presumably */}
      <group position={[-2.75, 0, -0.9]}>
        <Plinth />
        <group position={[0, 0.96, 0]}>
          <mesh position={[0, 0.05, 0]} material={cardboard("#6b4125")}>
            <boxGeometry args={[0.62, 0.1, 0.5]} />
          </mesh>
          <mesh ref={(r) => void (records.current[0] = r)} position={[-0.05, 0.12, 0]} material={m.ink}>
            <cylinderGeometry args={[0.2, 0.2, 0.012, 32]} />
          </mesh>
          <mesh position={[-0.05, 0.13, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.004, 20]} />
            <meshLambertMaterial color="#2f5e9a" />
          </mesh>
          <mesh position={[0.2, 0.16, 0.05]} rotation={[0, 0.5, 0]} material={m.steel}>
            <boxGeometry args={[0.02, 0.02, 0.32]} />
          </mesh>
        </group>
      </group>
    </group>
  );
  return (
    <SetShell
      cue={cue}
      onFrame={spin}
      drop={2.4}
      trap={[1.6, 1.4, 0.55]}
      flown={
        <Cloth
          work={work}
          index={index}
          extra={
            // a type specimen, hung either side: capital and lower case
            <>
              {[-5.3, 5.3].map((x, i) => (
                <group key={x} position={[x, 5.9, 0.6]}>
                  {[-0.35, 0.35].map((wx) => (
                    <mesh key={wx} position={[wx, 2.2, 0]} material={m.ink}>
                      <cylinderGeometry args={[0.006, 0.006, 3.4, 4]} />
                    </mesh>
                  ))}
                  <mesh>
                    <planeGeometry args={[1.8, 1.8]} />
                    <meshLambertMaterial map={letters[i]} alphaTest={0.5} side={THREE.DoubleSide} />
                  </mesh>
                </group>
              ))}
            </>
          }
        />
      }
      left={side}
      centre={
        <group position={[0, 0, 0.55]}>
          {/* the lectern and the journal open upon it */}
          <mesh position={[0, 0.55, 0]} material={cardboard("#7a2c28")}>
            <boxGeometry args={[0.8, 1.1, 0.5]} />
          </mesh>
          <group position={[0, 1.18, 0]} rotation={[-0.5, 0, 0]}>
            <mesh material={cardboard("#8e3a33")}>
              <boxGeometry args={[1.3, 0.05, 0.62]} />
            </mesh>
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.2, 0.75]} />
              <meshLambertMaterial map={journal} />
            </mesh>
          </group>
        </group>
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Scene 2 — Odonta: a dentist's waiting room, with a monument                 */
/* -------------------------------------------------------------------------- */

/** A four-pointed sparkle, as on every dentist's sign. */
function sparkleGeometry(r: number) {
  const sh = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 ? r * 0.28 : r;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) sh.moveTo(x, y);
    else sh.lineTo(x, y);
  }
  sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1 });
}

/**
 * A tooth, the way a dentist's sign draws one: a broad crown with two soft
 * cusps, a waist, and two roots. Extruded thick and bevelled round, in enamel.
 */
function Tooth() {
  const m = mats();
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.3, 0.04);
    s.quadraticCurveTo(-0.2, -0.03, -0.13, 0.16);
    s.quadraticCurveTo(-0.06, 0.4, 0, 0.42);
    s.quadraticCurveTo(0.06, 0.4, 0.13, 0.16);
    s.quadraticCurveTo(0.2, -0.03, 0.3, 0.04);
    s.bezierCurveTo(0.42, 0.14, 0.48, 0.46, 0.53, 0.8);
    s.bezierCurveTo(0.6, 1.2, 0.45, 1.36, 0.27, 1.3);
    s.quadraticCurveTo(0.12, 1.22, 0, 1.2);
    s.quadraticCurveTo(-0.12, 1.22, -0.27, 1.3);
    s.bezierCurveTo(-0.45, 1.36, -0.6, 1.2, -0.53, 0.8);
    s.bezierCurveTo(-0.48, 0.46, -0.42, 0.14, -0.3, 0.04);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.1, bevelSegments: 6, curveSegments: 20 });
    g.translate(0, 0, -0.15);
    return g;
  }, []);
  const enamel = useMemo(
    () => new THREE.MeshMatcapMaterial({ matcap: matcapTexture({ core: "#ffffff", mid: "#eef3f5", edge: "#9fb1bd", spot: "#ffffff", band: "rgba(200,225,240,0.45)" }) }),
    [],
  );
  const star = useMemo(() => sparkleGeometry(0.16), []);
  return (
    <group>
      <mesh geometry={geo} material={enamel} position={[0, 0.12, 0]} />
      {[-1, 1].map((sd) => (
        <mesh key={sd} geometry={star} material={m.gold} position={[sd * 0.74, 1.4, 0]} scale={0.85} />
      ))}
    </group>
  );
}

function Odonta({ work, index }: { work: Work; index: number }) {
  const leaf = useMemo(() => new THREE.MeshLambertMaterial({ color: "#5f8f62" }), []);
  const side = (
    <group>
      <group position={[-4.9, 0, -1.2]}>
        <CardChair paint="#6fa6a8" rot={0.25} />
      </group>
      <group position={[-4.1, 0, -1.1]}>
        <CardChair paint="#6fa6a8" rot={0.25} />
      </group>
      <group position={[-3.2, 0, -0.9]}>
        <mesh position={[0, 0.25, 0]} material={cardboard("#f4efe4")}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
        </mesh>
        {["#e8b85c", "#a3232e", "#f6ecd6"].map((c, i) => (
          <mesh key={c} position={[0, 0.52 + i * 0.025, 0]} rotation={[0, i * 0.3, 0]} material={cardboard(c)}>
            <boxGeometry args={[0.3, 0.02, 0.4]} />
          </mesh>
        ))}
      </group>
      <group position={[-5.9, 0, -2.0]}>
        <mesh position={[0, 0.35, 0]} material={cardboard("#d98a66", { plain: true })}>
          <cylinderGeometry args={[0.3, 0.22, 0.7, 18]} />
        </mesh>
        {[
          [0, 1.2, 0.5],
          [-0.2, 1.6, 0.36],
          [0.2, 1.8, 0.32],
        ].map(([x, y, r], i) => (
          <mesh key={i} position={[x, y, 0]} material={leaf}>
            <sphereGeometry args={[r, 12, 10]} />
          </mesh>
        ))}
      </group>
    </group>
  );
  return (
    <SetShell
      cue={workCue(index)}
      drop={3.2}
      trap={[1.4, 1.4, 0.4]}
      flown={<Cloth work={work} index={index} />}
      left={side}
      centre={
        <group position={[0, 0, 0.4]}>
          <Plinth w={1.0} h={0.8} d={1.0} paint="#2f6a68" />
          <group position={[0, 0.84, 0]} scale={0.95}>
            <Tooth />
          </group>
        </group>
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Scene 3 — Campus: a bouldering gym                                          */
/* -------------------------------------------------------------------------- */

function Campus({ work, index }: { work: Work; index: number }) {
  const m = mats();
  const screen = useMemo(() => gameTexture(), []);
  const side = (
    <group position={[-4.3, 0, -1.0]}>
      {/* crash pads, stacked */}
      <mesh position={[0, 0.2, 0]} geometry={roundedBox(2.0, 0.4, 1.3, 0.08)} material={cardboard("#2f6a68", { plain: true })} />
      <mesh position={[0.1, 0.58, 0.05]} rotation={[0, 0.12, 0]} geometry={roundedBox(1.8, 0.36, 1.2, 0.08)} material={cardboard("#dcae45", { plain: true })} />
      {/* a chalk bucket and a coil of rope */}
      <group position={[1.35, 0, 0.55]}>
        <mesh position={[0, 0.18, 0]} material={m.cream}>
          <cylinderGeometry args={[0.16, 0.13, 0.36, 16]} />
        </mesh>
        <mesh position={[0, 0.37, 0]} material={cardboard("#f6ecd6", { plain: true })}>
          <cylinderGeometry args={[0.14, 0.14, 0.02, 16]} />
        </mesh>
      </group>
      <mesh position={[-0.4, 0.84, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.05, 8, 24]} />
        <meshLambertMaterial color="#a3232e" />
      </mesh>
    </group>
  );
  return (
    <SetShell
      cue={workCue(index)}
      drop={3.0}
      trap={[1.6, 1.2, 0.5]}
      flown={<Cloth work={work} index={index} />}
      left={side}
      centre={
        <group position={[0, 0, 0.5]}>
          {/* the game, on a phone the size of a door */}
          <mesh position={[0, 0.2, 0]} material={cardboard("#5b4c9a")}>
            <boxGeometry args={[1.2, 0.4, 0.8]} />
          </mesh>
          <group position={[0, 1.45, -0.1]} rotation={[-0.08, 0, 0]}>
            <mesh geometry={roundedBox(1.1, 2.0, 0.08, 0.14)} material={m.ink} />
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[0.96, 1.84]} />
              <meshBasicMaterial map={screen} toneMapped={false} />
            </mesh>
          </group>
        </group>
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Scene 4 — Memento: a photographer's studio, the day's prints drying         */
/* -------------------------------------------------------------------------- */

function Memento({ work, index }: { work: Work; index: number }) {
  const m = mats();
  const photos = useMemo(() => [0, 1, 2, 3].map((i) => new THREE.MeshLambertMaterial({ map: photoTexture(i), side: THREE.DoubleSide })), []);
  const soft = useMemo(() => new THREE.MeshBasicMaterial({ color: "#fff6e6", toneMapped: false }), []);
  const glow = useMemo(() => haloMaterial("#fff1d8", 0.45), []);
  // two lines of prints strung across the stage, mirrored
  const lines = useMemo(() => {
    const out: { x: number; y: number; z: number; rot: number; tex: number }[] = [];
    [
      [6.1, -1.4],
      [5.4, -0.6],
    ].forEach(([y, z], row) => {
      for (let k = 0; k < 7; k++) {
        const u = (k + 0.5) / 7;
        const x = -6 + u * 12;
        const sag = 0.55 * (1 - Math.pow(2 * u - 1, 2));
        out.push({ x, y: y - sag, z, rot: Math.sin(k * 1.7 + row) * 0.08, tex: (k + row) % 4 });
      }
    });
    return out;
  }, []);
  const side = (
    <group>
      {/* a camera on its tripod, looking at the centre */}
      <group position={[-3.6, 0, -0.6]} rotation={[0, 0.45, 0]}>
        {[0, 2.1, 4.2].map((a) => (
          <mesh key={a} position={[Math.sin(a) * 0.22, 0.6, Math.cos(a) * 0.22]} rotation={[Math.cos(a) * 0.18, 0, -Math.sin(a) * 0.18]} material={m.blackMetal}>
            <cylinderGeometry args={[0.018, 0.018, 1.25, 6]} />
          </mesh>
        ))}
        <mesh position={[0, 1.3, 0]} material={cardboard("#3b3a38")}>
          <boxGeometry args={[0.36, 0.26, 0.2]} />
        </mesh>
        <mesh position={[0, 1.3, 0.16]} rotation={[Math.PI / 2, 0, 0]} material={m.ink}>
          <cylinderGeometry args={[0.08, 0.09, 0.16, 16]} />
        </mesh>
      </group>
      {/* a softbox, lit */}
      <group position={[-5.5, 0, -1.6]} rotation={[0, 0.6, 0]}>
        <mesh position={[0, 0.9, 0]} material={m.blackMetal}>
          <cylinderGeometry args={[0.02, 0.03, 1.8, 6]} />
        </mesh>
        <mesh position={[0, 2.0, 0]} material={cardboard("#2b2a28")}>
          <boxGeometry args={[1.0, 0.8, 0.45]} />
        </mesh>
        <mesh position={[0, 2.0, 0.23]} material={soft}>
          <planeGeometry args={[0.9, 0.7]} />
        </mesh>
        <mesh position={[0, 2.0, 0.5]} material={glow}>
          <planeGeometry args={[2.4, 2.4]} />
        </mesh>
      </group>
    </group>
  );
  return (
    <SetShell
      cue={workCue(index)}
      drop={2.6}
      trap={[1.5, 1.3, 0.5]}
      flown={
        <Cloth
          work={work}
          index={index}
          extra={
            <group position={[0, 0, -DROP_Z]}>
              {[
                [6.1, -1.4],
                [5.4, -0.6],
              ].map(([y, z]) => (
                <mesh key={y} position={[0, y - 0.25, z]} rotation={[0, 0, Math.PI / 2]} material={m.ink}>
                  <cylinderGeometry args={[0.006, 0.006, 12, 4]} />
                </mesh>
              ))}
              {lines.map((p, i) => (
                <mesh key={i} position={[p.x, p.y - 0.3, p.z]} rotation={[0, 0, p.rot]} material={photos[p.tex]}>
                  <planeGeometry args={[0.5, 0.6]} />
                </mesh>
              ))}
            </group>
          }
        />
      }
      left={side}
      centre={
        <group position={[0, 0, 0.5]}>
          <Plinth w={0.9} h={0.85} d={0.8} paint="#bcd7a6" />
          {/* an instant camera, the size of a suitcase */}
          <group position={[0, 1.2, 0]}>
            <mesh geometry={roundedBox(0.9, 0.62, 0.6, 0.08)} material={cardboard("#f4efe4", { plain: true })} />
            <mesh position={[0, 0.02, 0.31]} rotation={[Math.PI / 2, 0, 0]} material={m.ink}>
              <cylinderGeometry args={[0.2, 0.22, 0.1, 24]} />
            </mesh>
            <mesh position={[0, 0.02, 0.37]} rotation={[Math.PI / 2, 0, 0]} material={m.steel}>
              <cylinderGeometry args={[0.12, 0.12, 0.02, 24]} />
            </mesh>
            <mesh position={[0.3, 0.2, 0.305]} material={soft}>
              <planeGeometry args={[0.18, 0.1]} />
            </mesh>
            <mesh position={[0, -0.22, 0.305]}>
              <planeGeometry args={[0.8, 0.05]} />
              <meshLambertMaterial color="#b0493a" />
            </mesh>
          </group>
        </group>
      }
    />
  );
}

const SETS: Record<string, (p: { work: Work; index: number }) => ReactNode> = {
  studio: Studio,
  odonta: Odonta,
  campus: Campus,
  memento: Memento,
};

export function Drops() {
  return (
    <group>
      {WORKS.map((w, i) => {
        const Set = SETS[w.id];
        return Set ? <Set key={w.id} work={w} index={i} /> : null;
      })}
    </group>
  );
}
