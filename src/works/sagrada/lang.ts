"use client";

import { useSyncExternalStore } from "react";

// Which subtitles are threaded through the projector. English is the print
// the page is rendered with; Catalan and Spanish are chosen on the client
// (from ?lang=, a remembered choice, or the browser), so the server HTML and
// the first client render always agree.

export type Lang = "en" | "ca" | "es";

export const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: "en", label: "EN", name: "English" },
  { id: "ca", label: "CA", name: "Català" },
  { id: "es", label: "ES", name: "Español" },
];

const KEY = "zt-subs";
const isLang = (x: unknown): x is Lang => x === "en" || x === "ca" || x === "es";

let current: Lang = "en";
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getLang() {
  return current;
}

export function setLang(next: Lang, remember = true) {
  if (remember) {
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* private mode: the choice lasts as long as the page */
    }
  }
  if (next === current) return;
  current = next;
  listeners.forEach((fn) => fn());
}

/** ?lang=ca beats a remembered choice, which beats the browser's languages. */
export function pickLang(): Lang {
  try {
    const q = new URLSearchParams(window.location.search).get("lang");
    if (isLang(q)) return q;
  } catch {
    /* no URL to speak of */
  }
  try {
    const saved = window.localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* no storage */
  }
  const prefs = typeof navigator !== "undefined" ? (navigator.languages ?? [navigator.language]) : [];
  for (const p of prefs) {
    const base = (p || "").toLowerCase().split("-")[0];
    if (base === "en") return "en";
    if (base === "ca") return "ca";
    // Spanish, and the other languages of Spain, get the Spanish print
    if (base === "es" || base === "gl" || base === "eu") return "es";
  }
  return "en";
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, () => "en");
}
