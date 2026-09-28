// The wardrobe department: every surface in the house.
//
// Built for economy. Nothing here needs the renderer to trace a light:
//  · metals and velvets are MATCAPS — a painted sphere that stands in for
//    a whole lighting rig, one texture lookup per pixel;
//  · painted scenery is LAMBERT (diffuse only, no specular maths);
//  · anything that glows is BASIC (unlit).
// The house lights "dim" by tinting colours, not by moving lights.

import * as THREE from "three";

import { brickTextures, canvasTexture, damaskTexture, velvetTexture, woodTextures } from "./canvas";
import { kraftTexture } from "./paint";

export type Mats = ReturnType<typeof createMaterials>;

let cache: Mats | null = null;

export function mats() {
  if (!cache) cache = createMaterials();
  return cache;
}

interface MatcapSpec {
  core: string;
  mid: string;
  edge: string;
  /** specular spot (top-left) */
  spot?: string;
  /** bright band reflected from the stage floor */
  band?: string;
  /** grazing sheen at the rim (velvet) */
  rim?: string;
}

/** Paint a lit sphere. This single image is the whole lighting for a material. */
export function matcapTexture(s: MatcapSpec) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const r = w / 2;
    ctx.fillStyle = s.edge;
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.05, cx, cy, r);
    g.addColorStop(0, s.core);
    g.addColorStop(0.55, s.mid);
    g.addColorStop(1, s.edge);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    if (s.band) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const b = ctx.createRadialGradient(cx, cy + r * 0.45, 2, cx, cy + r * 0.45, r * 0.7);
      b.addColorStop(0, s.band);
      b.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = b;
      ctx.scale(1, 0.45);
      ctx.beginPath();
      ctx.arc(cx, (cy + r * 0.45) / 0.45, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (s.rim) {
      const rg = ctx.createRadialGradient(cx, cy, r * 0.62, cx, cy, r);
      rg.addColorStop(0, "rgba(0,0,0,0)");
      rg.addColorStop(1, s.rim);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (s.spot) {
      const sp = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.42, 0, cx - r * 0.38, cy - r * 0.42, r * 0.28);
      sp.addColorStop(0, s.spot);
      sp.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sp;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Soft round glow for halos, spotlight pools and the like. */
export function glowTexture(inner = "rgba(255,236,200,1)") {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, inner);
    g.addColorStop(0.35, inner.replace(/[\d.]+\)$/, "0.45)"));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function matcap(spec: MatcapSpec, extra: THREE.MeshMatcapMaterialParameters = {}) {
  return new THREE.MeshMatcapMaterial({ matcap: matcapTexture(spec), ...extra });
}

function createMaterials() {
  const pile = velvetTexture();
  const pileWide = pile.clone();
  pileWide.repeat.set(8, 1);
  pileWide.needsUpdate = true;
  const wood = woodTextures();
  const brick = brickTextures();
  brick.map.repeat.set(4, 2.5);
  const damask = damaskTexture();
  damask.repeat.set(10, 6);

  const VELVET: MatcapSpec = { core: "#3a040b", mid: "#6e0d17", edge: "#b8343f", rim: "rgba(255,120,130,0.55)", spot: "rgba(255,170,160,0.18)" };
  const GOLD: MatcapSpec = { core: "#f7e2a0", mid: "#c9973e", edge: "#4a2c08", spot: "rgba(255,250,225,0.95)", band: "rgba(255,210,120,0.55)" };

  return {
    // — velvets (matcap: dark core, bright grazing sheen) —
    velvetRed: matcap(VELVET, { map: pileWide, side: THREE.DoubleSide }),
    velvetDeep: matcap({ ...VELVET, core: "#240206", mid: "#4a0810", edge: "#8a2530" }, { side: THREE.DoubleSide }),
    velvetTeal: matcap({ core: "#0c2a2d", mid: "#1f5156", edge: "#6fb3b0", rim: "rgba(160,230,225,0.5)" }, { side: THREE.DoubleSide }),
    velvetSeat: matcap({ ...VELVET, core: "#2a0308", mid: "#5b0b13" }),
    // — metals —
    gold: matcap(GOLD),
    goldDull: matcap({ ...GOLD, core: "#d9b877", mid: "#a47a2c", spot: "rgba(255,240,200,0.5)" }),
    brass: matcap({ core: "#f0d58e", mid: "#b98a3c", edge: "#3e2708", spot: "rgba(255,245,210,0.8)", band: "rgba(255,200,120,0.35)" }),
    steel: matcap({ core: "#e8ecef", mid: "#8d949b", edge: "#2d3136", spot: "rgba(255,255,255,0.9)", band: "rgba(200,210,220,0.4)" }),
    blackMetal: matcap({ core: "#4a4440", mid: "#1d1917", edge: "#0a0808", spot: "rgba(255,240,220,0.35)" }),
    crystal: matcap({ core: "#ffffff", mid: "#fff1d8", edge: "#a88a5a", spot: "#ffffff", band: "rgba(255,220,160,0.8)" }),
    // — painted & natural surfaces (diffuse only) —
    woodMap: wood.map,
    woodRough: wood.roughnessMap,
    darkWood: new THREE.MeshLambertMaterial({ color: "#3a2216" }),
    wall: new THREE.MeshLambertMaterial({ map: damask, color: "#b98b86" }),
    wallDark: new THREE.MeshLambertMaterial({ color: "#1c0a0c" }),
    brick: new THREE.MeshLambertMaterial({ map: brick.map, color: "#c9a79b" }),
    cream: matcap({ core: "#fffaf0", mid: "#eadcc0", edge: "#8a7458" }),
    paper: new THREE.MeshLambertMaterial({ color: "#f6ecd6" }),
    ink: new THREE.MeshLambertMaterial({ color: "#1b1110" }),
    silhouette: new THREE.MeshBasicMaterial({ color: "#0b0405" }),
    // — things that glow —
    bulb: new THREE.MeshBasicMaterial({ color: "#fff0cf" }),
    bulbCool: new THREE.MeshBasicMaterial({ color: "#fff8ec" }),
    glow: glowTexture(),
    kraft: kraftTexture(),
    kraftPlain: (() => {
      const t = kraftTexture(false);
      t.repeat.set(0.8, 0.8);
      return t;
    })(),
  };
}

/** A soft additive halo: the cheap stand-in for bloom around a bulb. */
export function haloMaterial(color = "#ffcf8a", opacity = 0.8) {
  return new THREE.MeshBasicMaterial({
    map: mats().glow,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

const boards = new Map<string, THREE.MeshLambertMaterial>();

/**
 * Painted cardboard, the house material for built scenery. One kraft texture
 * shared by every colour; the tint is the paint.
 */
export function cardboard(paint = "#ffffff", { plain = false }: { plain?: boolean } = {}) {
  // `plain` is for curved or extruded shapes, whose faces don't map 0–1: no cut edge, tiled
  const key = `${paint}${plain ? ":p" : ""}`;
  let m = boards.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ map: plain ? mats().kraftPlain : mats().kraft, color: paint });
    boards.set(key, m);
  }
  return m;
}

/** Fade a material (a function, so frame loops needn't reassign memoised values). */
export function setOpacity(m: THREE.Material, v: number) {
  m.opacity = v;
}
