"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useLayout } from "@/stage3d/lib/layout";

import { CUE } from "../script";
import { FLATS, PIECES, pieceExtent, type Flat, type PieceId, type Role } from "./flats";
import { Sheet } from "./paint/kit";
import { scaffoldTile } from "./paint/temple";
import { built, put, seg, W } from "./world";

// ---------------------------------------------------------------------------
// Painting: each flat is painted once, the first time it is needed, and kept.
// ---------------------------------------------------------------------------

export interface Painted {
  flat: Flat;
  map: THREE.CanvasTexture;
  glow: THREE.CanvasTexture;
  sheet: Sheet;
}

const painted = new Map<Flat, Painted>();

export function paintFlat(f: Flat, ppu: number): Painted {
  let p = painted.get(f);
  if (!p) {
    const sheet = new Sheet(f.w, f.h, ppu);
    f.paint(sheet);
    const { map, glow } = sheet.textures();
    p = { flat: f, map, glow, sheet };
    painted.set(f, p);
  }
  return p;
}

export function paintedFlats() {
  return [...painted.values()];
}

/** A plane standing on its base, centred on x. */
export function flatGeometry(f: Flat, inset = 0) {
  const g = new THREE.PlaneGeometry(f.w, f.h);
  g.translate(0, f.h / 2, 0);
  if (f.face === -1) g.rotateY(Math.PI);
  g.translate(f.x, f.y, f.z + inset * f.face);
  return g;
}

// ---------------------------------------------------------------------------
// Scaffolding: a painted band that climbs with the work.
// ---------------------------------------------------------------------------

const BAND = 2.4;

let scafCache: { timber: THREE.CanvasTexture; steel: THREE.CanvasTexture } | null = null;
function scaffoldTex() {
  if (!scafCache) {
    const make = (k: "timber" | "steel") => {
      const t = new THREE.CanvasTexture(scaffoldTile(k));
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    };
    scafCache = { timber: make("timber"), steel: make("steel") };
  }
  return scafCache;
}

// ---------------------------------------------------------------------------

interface Lit {
  mat: THREE.MeshLambertMaterial;
  role: Role;
}

/** Every material on the building, so the night can light them all at once. */
const wardrobe = new Set<Lit>();

function Piece({ id, flats, ppu }: { id: PieceId; flats: Flat[]; ppu: number }) {
  const def = PIECES[id];
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), []);
  const { base, top } = useMemo(() => pieceExtent(id), [id]);
  const items = useMemo(
    () =>
      flats.map((f) => {
        const p = paintFlat(f, ppu);
        const mat = new THREE.MeshLambertMaterial({
          map: p.map,
          emissiveMap: p.glow,
          emissive: new THREE.Color("#ffffff"),
          emissiveIntensity: 0,
          alphaTest: 0.5,
          side: THREE.DoubleSide,
          clippingPlanes: [plane],
          clipShadows: true,
        });
        return { f, geo: flatGeometry(f), lit: { mat, role: f.role } as Lit };
      }),
    [flats, ppu, plane],
  );
  useLayoutEffect(() => {
    items.forEach((i) => wardrobe.add(i.lit));
    return () => items.forEach((i) => wardrobe.delete(i.lit));
  }, [items]);

  // one scaffold band per flat
  const scafs = useMemo(() => {
    if (!def.scaffold) return [];
    const t = scaffoldTex();
    return flats.map((f) => {
      const w = Math.min(f.w, 3.4) + 0.3;
      const g = new THREE.PlaneGeometry(w, BAND);
      g.translate(0, BAND / 2, 0);
      if (f.face === -1) g.rotateY(Math.PI);
      const mk = (tex: THREE.Texture) => {
        const m = tex.clone();
        m.repeat.set(w / 1.3, BAND / 1.3);
        m.needsUpdate = true;
        return new THREE.MeshLambertMaterial({ map: m, alphaTest: 0.35, side: THREE.DoubleSide });
      };
      return { f, g, timber: mk(t.timber), steel: mk(t.steel) };
    });
  }, [def.scaffold, flats]);

  const group = useRef<THREE.Group>(null);
  const scafRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const p = built(W.year, def.span);
    const gone = def.until !== undefined && W.year > def.until;
    g.visible = p > 0 && !gone;
    const h = base + p * (top - base);
    put(plane, "constant", p >= 1 ? 1e4 : h + 0.001);
    const working = p > 0 && p < 1;
    const modern = W.year > 1950;
    scafs.forEach((s, k) => {
      const m = scafRefs.current[k];
      if (!m) return;
      // only where this flat is actually being built
      const local = h - s.f.y;
      m.visible = working && local > 0.3 && local < s.f.h + 0.2;
      m.position.set(s.f.x, s.f.y + Math.max(0, local - BAND + 0.3), s.f.z + s.f.face * 0.18);
      m.material = modern ? s.steel : s.timber;
    });
  });

  return (
    <group>
      <group ref={group}>
        {items.map((i, k) => (
          <mesh key={k} geometry={i.geo} material={i.lit.mat} castShadow receiveShadow />
        ))}
      </group>
      {scafs.map((s, k) => (
        <mesh
          key={k}
          ref={(el) => {
            scafRefs.current[k] = el;
          }}
          geometry={s.g}
          material={s.timber}
          visible={false}
          castShadow
        />
      ))}
    </group>
  );
}

/** Lights the building at night: floodlights, stained glass, the star, the cross. */
function NightWork() {
  useFrame(() => {
    const n = W.light.night;
    const y = W.year;
    const flood = n * seg(y, 1985, 1995);
    const glass = n * seg(y, 1990, 2000);
    const cross = n * seg(W.t, CUE.cross[0], CUE.cross[1]);
    const fire = W.flash * 0.05;
    wardrobe.forEach(({ mat, role }) => {
      let e = 0;
      switch (role) {
        case "old":
        case "new":
          e = flood * 0.75 + fire;
          break;
        case "glass":
          e = glass * 1.2 + flood * 0.3 + fire;
          break;
        case "tower":
          e = flood * 0.9 + fire;
          break;
        case "mary":
          e = flood * 0.9 + n * seg(y, 2021.9, 2021.95) * 0.4 + fire;
          break;
        case "jesus":
          e = flood * 0.85 + cross * 0.9 + fire;
          break;
        case "timber": {
          // the workshop, after the fire
          const burnt = seg(y, 1936.55, 1936.7);
          mat.color.setScalar(1 - burnt * 0.8);
          break;
        }
      }
      put(mat, "emissiveIntensity", e);
    });
  });
  return null;
}

export function Basilica({ group }: { group: 0 | 1 | 2 }) {
  const { tier } = useLayout();
  const ppu = tier === "high" ? 170 : 110;
  const pieces = useMemo(() => {
    const m = new Map<PieceId, Flat[]>();
    for (const f of FLATS) {
      if (f.group !== group) continue;
      if (!m.has(f.piece)) m.set(f.piece, []);
      m.get(f.piece)!.push(f);
    }
    return [...m.entries()];
  }, [group]);
  return (
    <group>
      {pieces.map(([id, flats]) => (
        <Piece key={id} id={id} flats={flats} ppu={ppu} />
      ))}
      {group === 0 && <NightWork />}
    </group>
  );
}
