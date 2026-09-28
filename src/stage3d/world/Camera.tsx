"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import { useStage } from "@/theatre/engine";

import { useLayout } from "../lib/layout";

type V = [number, number, number];
interface Key {
  at: number;
  pos: V;
  look: V;
  fov?: number;
  /** how much of the portrait zoom-out to apply (close-ups want less) */
  fit?: number;
  /** portrait only: how far to lift the stage above the caption sheet (0..1) */
  lift?: number;
}

// The camera script: where we sit, beat by beat.
// Every shot is framed dead centre: the lens never leaves the centre line.
const KEYS: Key[] = [
  { at: 0, pos: [0, 2.3, 20], look: [0, 4.4, 0], fov: 38, lift: 0 },
  { at: 1.7, pos: [0, 2.2, 15.5], look: [0, 4.1, 0], lift: 0 },
  { at: 3.3, pos: [0, 2.5, 12.8], look: [0, 3.9, -2], lift: 0 },
  { at: 4.5, pos: [0, 2.7, 11.2], look: [0, 3.5, -3] },
  { at: 7.3, pos: [0, 2.6, 10.8], look: [0, 3.3, -3] },
  { at: 8.45, pos: [0, 2.1, 8.2], look: [0, 1.9, -1], fit: 0.8 },
  { at: 9.6, pos: [0, 2.1, 7.9], look: [0, 1.9, -1], fit: 0.8 },
  { at: 10.6, pos: [0, 2.6, 11.5], look: [0, 3.6, -2] },
  { at: 11.9, pos: [0, 3.0, 10.8], look: [0, 2.8, -2.6] },
  // after dark in the schoolroom, the camera finds the desk at home
  { at: 12.75, pos: [0, 3.0, 10.8], look: [0, 2.8, -2.6] },
  { at: 13.2, pos: [0, 2.3, 7.6], look: [0, 1.3, -0.6], fit: 0.8 },
  { at: 13.6, pos: [0, 2.3, 7.4], look: [0, 1.3, -0.6], fit: 0.8 },
  { at: 14.4, pos: [0, 3.0, 10.8], look: [0, 2.8, -2.6] },
  { at: 23.4, pos: [0, 3.0, 10.8], look: [0, 2.8, -2.6] },
  { at: 24.3, pos: [0, 2.8, 11.4], look: [0, 3.7, -2] },
  { at: 34.4, pos: [0, 2.7, 11.0], look: [0, 3.8, -2] },
  { at: 35.4, pos: [0, 2.4, 13.2], look: [0, 3.2, 0], lift: 0.6 },
  { at: 36.7, pos: [0, 2.4, 12.8], look: [0, 3.2, 0], lift: 0.6 },
  { at: 37.4, pos: [0, 2.6, 17.5], look: [0, 10.6, 9.4], fov: 46, fit: 0.5 },
  { at: 37.9, pos: [0, 2.6, 17.2], look: [0, 10.6, 9.4], fov: 46, fit: 0.5 },
  { at: 38.8, pos: [0, 2.4, 12.8], look: [0, 3.9, -1], fov: 38 },
  { at: 40.4, pos: [0, 2.4, 11.6], look: [0, 3.4, -2] },
  { at: 41.4, pos: [0, 1.5, 8.6], look: [0, 2.0, -2], fit: 0.85 },
  { at: 43.5, pos: [0, 1.5, 8.2], look: [0, 2.0, -2], fit: 0.85 },
  { at: 44.4, pos: [0, 2.4, 11.2], look: [0, 3.6, -2] },
  // Act V: up onto the stage, a turn into the wings, through the door,
  // down the corridor and on to the stage door
  { at: 45.4, pos: [0, 2.0, 6.6], look: [0, 1.9, -3] },
  { at: 46.2, pos: [0, 1.75, 1.7], look: [6, 1.7, -1.6], fov: 50, fit: 0.2 },
  { at: 46.9, pos: [5.4, 1.7, -1.8], look: [12, 1.7, -2.2], fov: 50, fit: 0 },
  { at: 47.4, pos: [9.3, 1.7, -2.2], look: [16, 1.7, -2.2], fov: 52, fit: 0 },
  { at: 48.0, pos: [17.5, 1.75, -2.2], look: [28, 1.75, -2.2], fov: 52, fit: 0 },
  { at: 48.4, pos: [23.6, 1.8, -2.2], look: [30, 2.1, -2.2], fov: 52, fit: 0, lift: 0.3 },
  { at: 51.08, pos: [23.6, 1.8, -2.2], look: [30, 2.1, -2.2], fov: 52, fit: 0, lift: 0.3 },
  // blackout — and back in our seats for the curtain call
  { at: 51.12, pos: [0, 2.3, 10.6], look: [0, 2.6, 0], fov: 38, lift: 0.4 },
  { at: 53.4, pos: [0, 2.3, 10.2], look: [0, 2.6, 0], lift: 0.4 },
  { at: 57.5, pos: [0, 6.2, 25.5], look: [0, 5.2, 0], fov: 44, lift: 0 },
  { at: 70, pos: [0, 6.2, 25.5], look: [0, 5.2, 0], fov: 44, lift: 0 },
];

const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

function sample(t: number) {
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].at) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const p = ease(Math.min(1, Math.max(0, (t - a.at) / (b.at - a.at))));
  const fovA = a.fov ?? 38;
  const fovB = b.fov ?? fovA;
  return {
    pos: a.pos.map((v, k) => lerp(v, b.pos[k], p)) as V,
    look: a.look.map((v, k) => lerp(v, b.look[k], p)) as V,
    fov: lerp(fovA, b.fov ?? fovA, p) || fovB,
    fit: lerp(a.fit ?? 1, b.fit ?? 1, p),
    lift: lerp(a.lift ?? 1, b.lift ?? 1, p),
  };
}

export function CameraRig() {
  const stage = useStage();
  const size = useThree((st) => st.size);
  const layout = useLayout();
  const look = useRef(new THREE.Vector3());
  const lastShift = useRef(-1);
  useEffect(() => {
    lastShift.current = -1;
  }, [size.width, size.height, layout.portrait]);



  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const s = sample(stage.t);
    const aspect = size.width / size.height;
    // keep the stage's width in view on narrow screens
    const widen = Math.min(2.25, Math.max(1, Math.pow(1.55 / aspect, 0.72)));
    let fit = 1 + (widen - 1) * s.fit;
    let fov = s.fov;
    // never back the lens into the balcony: past row 15, widen the lens instead
    const MAX_Z = 19.5;
    const dz = s.pos[2] - s.look[2];
    if (s.look[2] + dz * fit > MAX_Z && dz > 0) {
      const capped = (MAX_Z - s.look[2]) / dz;
      const k = fit / Math.max(0.5, capped);
      fov = (2 * Math.atan(Math.tan((s.fov * Math.PI) / 360) * k) * 180) / Math.PI;
      fit = Math.max(0.5, capped);
    }


    look.current.set(...s.look);
    const z = s.look[2] + (s.pos[2] - s.look[2]) * fit;
    // pulled back on a narrow screen, keep the lens above the audience's heads
    const floor = fit > 1.05 ? 1.3 + Math.max(0, z - 8) * 0.13 : -10;
    cam.position.set(
      s.look[0] + (s.pos[0] - s.look[0]) * fit,
      Math.max(floor, s.look[1] + (s.pos[1] - s.look[1]) * fit),
      z,
    );
    // portrait: slide the frame up so the stage clears the caption sheet
    const shift = layout.portrait ? size.height * 0.11 * s.lift : 0;
    if (Math.abs(shift - lastShift.current) > 0.5) {
      lastShift.current = shift;
      if (shift > 0) cam.setViewOffset(size.width, size.height, 0, shift, size.width, size.height);
      else cam.clearViewOffset();
      cam.updateProjectionMatrix();
    }
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    cam.lookAt(look.current);
  });

  return null;
}
