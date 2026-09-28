// A few shapes the stock geometries lack. Built once and shared.

import * as THREE from "three";

const cache = new Map<string, THREE.BufferGeometry>();

/** A box with softened edges (an extruded rounded rectangle with a small bevel). */
export function roundedBox(w: number, h: number, d: number, r: number) {
  const key = `rb:${w}:${h}:${d}:${r}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const bevel = Math.min(r, d / 2 - 0.001, w / 4, h / 4);
  const iw = w / 2 - bevel;
  const ih = h / 2 - bevel;
  const cr = Math.max(0.0001, Math.min(r, iw, ih) - bevel * 0.5);
  const s = new THREE.Shape();
  s.moveTo(-iw + cr, -ih);
  s.lineTo(iw - cr, -ih);
  s.quadraticCurveTo(iw, -ih, iw, -ih + cr);
  s.lineTo(iw, ih - cr);
  s.quadraticCurveTo(iw, ih, iw - cr, ih);
  s.lineTo(-iw + cr, ih);
  s.quadraticCurveTo(-iw, ih, -iw, ih - cr);
  s.lineTo(-iw, -ih + cr);
  s.quadraticCurveTo(-iw, -ih, -iw + cr, -ih);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.001, d - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 5,
  });
  g.translate(0, 0, -(d - bevel * 2) / 2);
  cache.set(key, g);
  return g;
}
