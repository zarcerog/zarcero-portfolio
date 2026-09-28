// What a production tells the sound department: which variation plays where,
// which effects fire at which beat, and which ambient beds run under which
// scenes. Plain data, no Web Audio.

import type { ActMark } from "../timeline";
import type { SectionId } from "./score";
import type { BedName, SfxName, SfxOpts } from "./sfx";

export interface SoundCue {
  at: number;
  name: SfxName;
  /** "both": also when scrolling back through it (the scenery moves both ways) */
  dir?: "fwd" | "both";
  opts?: SfxOpts;
}

export interface SoundProgram {
  sectionAt: (t: number) => { id: SectionId; room: number };
  /** 0…1: how loud the band plays (e.g. silent in a blackout) */
  musicLevel: (t: number) => number;
  cues: SoundCue[];
  beds: { name: BedName; level: (t: number) => number }[];
  /** footsteps along a stretch of the scroll, one every `every` beats */
  steps?: { a: number; b: number; every: number; verb?: (t: number) => number }[];
}

const BY_ACT: Record<string, SectionId> = {
  prologue: "prologue",
  "act-1": "act1",
  "act-2": "act2",
  "act-3": "act3",
  intermission: "interval",
  "act-4": "act4",
  "act-5": "act5",
  finale: "finale",
};

/** Music only, following the acts: for the flat production. */
export function programFromActs(acts: ActMark[]): SoundProgram {
  return {
    sectionAt: (t) => {
      let id: SectionId = "prologue";
      for (const a of acts) if (t >= a.from - 0.01) id = BY_ACT[a.id] ?? id;
      return { id, room: 0 };
    },
    musicLevel: () => 1,
    cues: [],
    beds: [],
  };
}

/** A trapezoid envelope: 0 → 1 over [a, b], 1 until c, → 0 over [c, d]. */
export function env(t: number, a: number, b: number, c: number, d: number) {
  if (t <= a || t >= d) return 0;
  if (t < b) return (t - a) / (b - a);
  if (t <= c) return 1;
  return (d - t) / (d - c);
}

/**
 * Which cues the scroll passed going from `from` to `to`. A long jump (the
 * programme's links) fires nothing: nobody wants every effect at once.
 */
export function crossed(cues: SoundCue[], from: number, to: number, maxJump = 2.5) {
  if (from === to || Math.abs(to - from) > maxJump) return [];
  const fwd = to > from;
  return cues.filter((c) => (fwd ? c.at > from && c.at <= to : c.at <= from && c.at > to && c.dir === "both"));
}

/** Footsteps crossed between two beats (for a stride of `every` beats). */
export function stepsCrossed(a: number, b: number, every: number, from: number, to: number) {
  const lo = Math.max(a, Math.min(from, to));
  const hi = Math.min(b, Math.max(from, to));
  if (hi <= lo || Math.abs(to - from) > 2.5) return 0;
  return Math.floor((hi - a) / every) - Math.floor((lo - a) / every);
}
