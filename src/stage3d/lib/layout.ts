"use client";

import { useSyncExternalStore } from "react";

export type Tier = "high" | "low";

export interface Layout {
  portrait: boolean;
  aspect: number;
  tier: Tier;
}

function read(): Layout {
  if (typeof window === "undefined") return { portrait: false, aspect: 1.6, tier: "high" };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const weak = (nav.deviceMemory ?? 8) < 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
  const forced = new URLSearchParams(window.location.search).get("quality");
  let tier: Tier = coarse || w < 820 || weak ? "low" : "high";
  if (forced === "high" || forced === "low") tier = forced;
  return { portrait: w / h < 0.9, aspect: w / h, tier };
}

let snapshot: Layout | null = null;
const subs = new Set<() => void>();

function subscribe(cb: () => void) {
  subs.add(cb);
  if (subs.size === 1) window.addEventListener("resize", onResize);
  return () => {
    subs.delete(cb);
    if (subs.size === 0) window.removeEventListener("resize", onResize);
  };
}

function onResize() {
  const next = read();
  if (!snapshot || next.portrait !== snapshot.portrait || next.tier !== snapshot.tier || Math.abs(next.aspect - snapshot.aspect) > 0.02) {
    snapshot = next;
    subs.forEach((s) => s());
  }
}

function get() {
  if (!snapshot) snapshot = read();
  return snapshot;
}

const SERVER: Layout = { portrait: false, aspect: 1.6, tier: "high" };

export function useLayout() {
  return useSyncExternalStore(subscribe, get, () => SERVER);
}
