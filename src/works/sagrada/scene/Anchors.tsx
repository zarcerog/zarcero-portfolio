"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { MARKS, markEls } from "../marks";
import { gullAt } from "./Birds";
import { W } from "./world";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Breathing room kept between a note and the edge of the frame. */
const EDGE = 10;

/**
 * A note's reach either side of its pin, in its own units, measured once per
 * drawing (the words change with the subtitles, so it's keyed by element).
 */
const reach = new WeakMap<SVGGraphicsElement, { l: number; r: number }>();
function reachOf(el: HTMLElement) {
  const g = el.querySelector<SVGGraphicsElement>(".sf-note__as-drawn");
  if (!g) return null;
  const known = reach.get(g);
  if (known) return known;
  const was = el.dataset.mirror;
  el.dataset.mirror = "false"; // getBBox needs the as-drawn one on show
  let bb: DOMRect | null = null;
  try {
    bb = g.getBBox();
  } catch {
    /* not laid out yet */
  }
  el.dataset.mirror = was ?? "false";
  if (!bb || bb.width === 0) return null;
  const r = { l: bb.x, r: bb.x + bb.width };
  reach.set(g, r);
  return r;
}

/** How far a note would run off the frame, drawn at x with the given reach. */
function spill(x: number, l: number, r: number, width: number) {
  return Math.max(0, EDGE - (x + l)) + Math.max(0, x + r - (width - EDGE));
}

/** Pins the director's notes (DOM) onto the things they point at (world). */
export function Anchors() {
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  const lastRef = useRef(new Map<string, string>());
  useFrame((state) => {
    const last = lastRef.current;
    const t = W.t;
    const scale = Math.min(1, Math.max(0.55, size.width / 1280));
    for (const m of MARKS) {
      const el = markEls.get(m.id);
      if (!el) continue;
      const [a, b, c, d] = m.at;
      const on = t > a && t < d;
      if (!on) {
        if (last.get(m.id) !== "off") {
          el.style.setProperty("visibility", "hidden");
          last.set(m.id, "off");
        }
        continue;
      }
      if (m.anchor === "gull") gullAt(t, v);
      else v.set(m.anchor[0], m.anchor[1], m.anchor[2]);
      v.project(state.camera);
      const behind = v.z > 1;
      let x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;

      // Keep the words in frame: mirror the note when that fits better (the
      // arrow still lands on its subject), and only as a last resort slide it.
      const rc = reachOf(el);
      let mirror = el.dataset.mirror === "true";
      if (rc) {
        const l = rc.l * scale;
        const r = rc.r * scale;
        const asDrawn = spill(x, l, r, size.width);
        const mirrored = spill(x, -r, -l, size.width);
        // a little hysteresis, so a note on a moving subject doesn't flicker
        if (!mirror && mirrored + 16 < asDrawn) mirror = true;
        else if (mirror && asDrawn + 16 < mirrored) mirror = false;
        const [L, R] = mirror ? [-r, -l] : [l, r];
        if (x + L < EDGE) x = Math.min(EDGE - L, size.width - EDGE - R);
        else if (x + R > size.width - EDGE) x = Math.max(size.width - EDGE - R, EDGE - L);
      }
      const flip = mirror ? "true" : "false";
      if (el.dataset.mirror !== flip) el.dataset.mirror = flip;
      const draw = clamp01((t - a) / (b - a));
      const fade = t > c ? 1 - clamp01((t - c) / (d - c)) : 1;
      const key = `${x.toFixed(1)}|${y.toFixed(1)}|${draw.toFixed(3)}|${fade.toFixed(3)}|${behind}`;
      if (last.get(m.id) === key) continue;
      last.set(m.id, key);
      el.style.setProperty("visibility", behind ? "hidden" : "visible");
      el.style.setProperty("transform", `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`);
      el.style.setProperty("opacity", fade.toFixed(3));
      el.style.setProperty("--d", draw.toFixed(3));
    }
  });
  return null;
}
