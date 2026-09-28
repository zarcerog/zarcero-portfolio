// Cloth without a physics engine: parametric surfaces for drapes, swags
// and the house curtain. u runs across the cloth, v from top (0) to hem (1).

import * as THREE from "three";

export type Surface = (u: number, v: number, out: THREE.Vector3) => void;

export function clothGeometry(segU: number, segV: number) {
  const g = new THREE.PlaneGeometry(1, 1, segU, segV);
  // PlaneGeometry uv: u 0→1 left→right, v 1→0 top→bottom. We keep our own.
  const count = (segU + 1) * (segV + 1);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const params = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    params[i * 2] = uv.getX(i);
    params[i * 2 + 1] = 1 - uv.getY(i);
  }
  g.userData.params = params;
  return g;
}

const tmp = new THREE.Vector3();

export function shapeCloth(g: THREE.BufferGeometry, surface: Surface) {
  const pos = g.attributes.position as THREE.BufferAttribute;
  const params = g.userData.params as Float32Array;
  for (let i = 0; i < pos.count; i++) {
    surface(params[i * 2], params[i * 2 + 1], tmp);
    pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingSphere();
  g.computeBoundingBox();
}

/** A swag of fabric hung between two points, sagging in the middle. */
export function swagSurface(x0: number, x1: number, top: number, drop: number, sag: number, depth: number): Surface {
  return (u, v, out) => {
    const s = Math.sin(Math.PI * u);
    const y = top - v * (drop + sag * s);
    // horizontal folds that fan out towards the hem
    const folds = Math.sin(v * Math.PI * 5 + u * 0.8) * 0.05 * v * s;
    out.set(x0 + (x1 - x0) * u, y, depth * s * (0.4 + v * 0.6) + folds);
  };
}

/** A tied-back side drape. `dir` = +1 for the left leg (cloth to the right of the edge). */
export function legSurface(edge: number, dir: number, height: number, full: number, tieAt = 0.6): Surface {
  return (u, v, out) => {
    // width profile: full at top, pinched at the tie-back, flared at the floor
    let w: number;
    if (v < tieAt) {
      const k = v / tieAt;
      w = full * (1 - 0.8 * k * k);
    } else {
      const k = (v - tieAt) / (1 - tieAt);
      w = full * (0.2 + 0.55 * Math.sqrt(k));
    }
    const pinch = 1 - w / full;
    const folds = Math.sin(u * Math.PI * 2 * 7) * (0.05 + 0.18 * pinch);
    out.set(edge + dir * u * w, height * (1 - v), folds + 0.1 * Math.sin(Math.PI * u) * (1 - pinch));
  };
}

/** A pleated border strip. */
export function borderSurface(width: number, top: number, drop: number, pleats: number): Surface {
  return (u, v, out) => {
    const x = -width / 2 + u * width;
    const z = Math.sin(u * Math.PI * 2 * pleats) * 0.07 * (0.6 + v * 0.6);
    out.set(x, top - v * drop - Math.sin(u * Math.PI * pleats * 2) * 0.02, z);
  };
}

/**
 * One half of the house curtain, drawn like a traveller: it parts in the
 * middle and slides off to the side, its pleats closing up like an accordion.
 * The cloth keeps its length — as the half gets narrower, each pleat gets
 * deeper — so the folds read as real fabric being gathered.
 *
 * side: -1 left half, +1 right half. open: 0 closed … 1 fully gathered.
 */
export function curtainSurface(side: number, halfWidth: number, height: number, open: number, overlap = 0.1): Surface {
  const pleats = 18;
  const closed = halfWidth + overlap + 0.3; // meets (and slightly overlaps) the other half
  const cloth = closed / 0.94; // flat width: a little fullness even when closed
  const stacked = 1.05; // width of the gathered bundle
  const w = closed + (stacked - closed) * open;
  const outer = side * (halfWidth + 0.3);
  // half a pleat of cloth spans w / (2 * pleats) horizontally; the rest goes into depth
  const half = cloth / (2 * pleats);
  const depth = Math.sqrt(Math.max(0, half * half - Math.pow(w / (2 * pleats), 2)));
  return (u, v, out) => {
    const x = outer - side * w * u;
    const k = u * pleats;
    const f = k - Math.floor(k);
    const tri = 1 - Math.abs(2 * f - 1); // accordion zig-zag…
    const soft = 0.5 - 0.5 * Math.cos(f * Math.PI * 2); // …with velvet-soft creases
    const z = (tri * 0.6 + soft * 0.4 - 0.5) * depth * 2 + Math.sin(v * 2.4 + u * 9) * 0.015;
    out.set(x, height * (1 - v), z);
  };
}
