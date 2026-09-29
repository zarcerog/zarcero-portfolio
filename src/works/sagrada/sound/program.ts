// The sound plot: which variation plays under which chapter, which effect
// fires at which beat, which beds run under which scenes. Plain data.

import { env } from "@/theatre/sound/program";

import { MARKS } from "../marks";
import { CHAPTERS, CUE, FIN, TITLE } from "../script";
import type { SectionId } from "./score";
import type { FilmBed, FilmSfx, SfxOpts } from "./sfx";

export interface FilmCue {
  at: number;
  name: FilmSfx;
  /** "both": also when scrolling back through it */
  dir?: "fwd" | "both";
  opts?: SfxOpts;
}

const fwd = (at: number, name: FilmSfx, opts?: SfxOpts): FilmCue => ({ at, name, dir: "fwd", opts });
const both = (at: number, name: FilmSfx, opts?: SfxOpts): FilmCue => ({ at, name, dir: "both", opts });

export const CUES: FilmCue[] = [
  fwd(TITLE[2] + 0.1, "roll"),
  // the gulls, crossing overhead
  fwd(2.6, "gull", { pan: -0.6 }),
  fwd(3.35, "gull", { pan: 0.1, gain: 0.22 }),
  fwd(4.3, "gull", { pan: 0.7 }),
  // I: the stakes go in, the sign goes up
  fwd(7.35, "stakes"),
  fwd(CUE.stakes[0] + 0.5, "sign"),
  // II: bells for Saint Joseph, applause for the stone; the Gothic plan unrolled and torn up
  fwd(14.7, "bells"),
  fwd(15.35, "applause"),
  fwd(CUE.villar.rise[0], "unroll"),
  fwd(CUE.villar.tear[0], "rip"),
  // III: turned over (the strings' own twang and plucks come from the physics); Barnabas finished
  fwd(CUE.catenary.flip[0], "whoosh"),
  fwd(29.15, "bells", { gain: 0.08 }),
  // IV: the tram, and a single bell
  fwd(CUE.tram[0] + 0.3, "tramBell"),
  fwd(CUE.tram[0] + 0.45, "tramBy"),
  fwd(32.85, "toll"),
  // V: fire, the models smashed, the pieces flying home
  fwd(CUE.fire[0] + 0.2, "ignite"),
  fwd(CUE.shatter.burst[0], "shatter"),
  fwd(CUE.shatter.mend[0] + 0.1, "mend"),
  // VI: computers, cranes, the pandemic's pause, a star
  fwd(CUE.wire[0] + 0.1, "boot"),
  fwd(43.9, "crane"),
  fwd(45.7, "tapeStop"),
  fwd(46.62, "tapeStart"),
  fwd(46.9, "sparkle"),
  fwd(48.75, "bells", { gain: 0.1 }),
  // VII: the crowd for the Pope, the cross lit, and then
  fwd(52.1, "cheer"),
  fwd(CUE.cross[0], "choir"),
  fwd(FIN[0] + 0.1, "fin"),
];

// every chapter card is a hard cut; every note is scrawled in red
for (const c of CHAPTERS) CUES.push(both(c.card[0], "splice"));
for (const m of MARKS) CUES.push(fwd(m.at[0], "scribble"));
CUES.sort((a, b) => a.at - b.at);

const c = (id: string) => CHAPTERS.find((x) => x.id === id)!.card;

export function sectionAt(t: number): SectionId {
  if (t < c("one")[0]) return "sky";
  if (t < c("two")[0]) return "fields";
  if (t < c("three")[0]) return "stone";
  if (t < c("four")[0]) return "gaudi";
  if (t < c("five")[0]) return "tram";
  if (t < CUE.shatter.mend[0]) return "fire";
  if (t < c("six")[0]) return "mend";
  if (t < c("seven")[0]) return "machines";
  if (t < CUE.fireworks[0]) return "june";
  if (t < FIN[0]) return "fiesta";
  return "fin";
}

/** 0…1: how loud the band plays. */
export function musicLevel(t: number) {
  // the pandemic stops the band as well as the cranes
  const pause = env(t, 45.7, 45.8, 46.55, 46.62);
  // a little room for the tram and the bell
  const tram = env(t, CUE.tram[0], CUE.tram[0] + 0.3, 33.2, 33.8);
  // the fire: only the drums
  const fire = env(t, CUE.fire[0], CUE.fire[0] + 0.2, CUE.fire[1], CUE.fire[1] + 0.3);
  // under the chapter cards, the projector takes over for a moment
  return (1 - pause) * (1 - 0.35 * tram) * (1 - 0.3 * fire) * (1 - 0.45 * cards(t));
}

/** 0…1: how far into a chapter card we are. */
function cards(t: number) {
  let v = 0;
  for (const ch of CHAPTERS) v = Math.max(v, env(t, ch.card[0], ch.card[1], ch.card[2], ch.card[3]));
  return v;
}

export const BEDS_PLOT: { name: FilmBed; level: (t: number) => number }[] = [
  // the projector under the poster and the chapter cards, and a little throughout
  { name: "projector", level: (t) => Math.max(env(t, -1, 0, TITLE[2], TITLE[3] + 0.4), cards(t) * 0.8, 0.12) },
  { name: "wind", level: (t) => Math.max(env(t, 0.8, 1.8, 6.4, 8.5) * 0.9, env(t, 37.4, 37.8, 38.3, 38.9) * 0.6) },
  { name: "countryside", level: (t) => env(t, 5.0, 6.2, 24.5, 26.5) },
  { name: "masons", level: (t) => Math.max(env(t, 17.6, 18.6, 29.2, 29.7), env(t, 38.6, 39.2, 41.2, 41.5)) },
  { name: "street", level: (t) => env(t, 26.0, 27.5, 34.6, 35.0) * 0.9 },
  { name: "fire", level: (t) => env(t, CUE.fire[0], CUE.fire[0] + 0.3, CUE.fire[1] - 0.3, CUE.fire[1] + 0.2) },
  { name: "traffic", level: (t) => env(t, 41.9, 42.6, 50.2, 51.0) * (1 - env(t, 45.7, 45.8, 46.55, 46.62) * 0.8) },
  { name: "crowd", level: (t) => env(t, 50.8, 52.0, 60.6, 61.6) },
];
