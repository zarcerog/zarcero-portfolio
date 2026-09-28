// The prompt book for the 3D production. Every cue, in beats
// (one beat ≈ 0.8 of a viewport height of scroll).

import type { ActMark } from "@/theatre/timeline";

type Env = readonly [number, number, number, number];

/** Act II: each room gets the whole stage, one after another. */
export const ROOM = { first: 11.2, each: 3.2 } as const;
/** How much later everything after Act II plays than it used to. */
export const D = 7;
/** …and how much longer the finale waits for the walk to the stage door. */
export const E = 2.5;

export const Q = {
  prologue: {
    dim: [0.15, 1.5] as const,
    billing: [-3, -2, 0.7, 1.35] as Env,
    curtainOpen: [1.1, 2.7] as const,
  },
  act1: {
    card: [2.8, 3.3, 3.7, 4.1] as Env,
    setIn: [3.5, 4.5] as const,
    train: [4.3, 7.6] as const,
    lines: [
      [4.5, 4.8, 5.2, 5.4],
      [5.35, 5.6, 6.05, 6.25],
      [6.2, 6.45, 6.95, 7.2],
    ] as readonly Env[],
    setOut: [7.15, 8.2] as const,
    personae: [8.05, 8.6, 9.55, 10.0] as Env,
  },
  act2: {
    card: [10.0, 10.5, 10.9, 11.3] as Env,
  },
  act3: {
    card: [17.0 + D, 17.5 + D, 17.9 + D, 18.3 + D] as Env,
    first: 18.1 + D,
    each: 2.5,
  },
  interval: {
    curtainClose: [28.0 + D, 28.8 + D] as const,
    narrator: [28.6 + D, 29.0 + D, 29.7 + D, 30.1 + D] as Env,
    menu: [29.0 + D, 29.5 + D, 30.9 + D, 31.3 + D] as Env,
    audienceOut: [28.9 + D, 29.4 + D] as const,
    audienceBack: [30.7 + D, 31.2 + D] as const,
    tiltDown: [30.8 + D, 31.7 + D] as const,
    curtainOpen: [31.5 + D, 32.3 + D] as const,
  },
  act4: {
    card: [32.3 + D, 32.8 + D, 33.2 + D, 33.6 + D] as Env,
    setIn: [33.3 + D, 34.0 + D] as const,
    pins: [34.0 + D, 34.5 + D, 35.0 + D, 35.5 + D] as const,
    setOut: [36.5 + D, 37.1 + D] as const,
  },
  act5: {
    card: [37.1 + D, 37.6 + D, 38.0 + D, 38.4 + D] as Env,
    /** the walk: across the stage, through the wing door, down the corridor */
    walk: [38.0 + D, 41.4 + D] as const,
    /** the wing door swings open as we reach it */
    door: [39.6 + D, 40.1 + D] as const,
    setIn: [37.9 + D, 38.6 + D] as const,
    form: [40.9 + D, 41.35 + D, 43.6 + D, 44.0 + D] as Env,
    /** a blackout while the audience is carried back to its seats */
    blackout: [43.7 + D, 44.0 + D, 44.2 + D, 44.5 + D] as Env,
    setOut: [44.05 + D, 44.1 + D] as const,
  },
  finale: {
    curtainClose: [43.8 + D, 44.05 + D] as const,
    bow: [43.15 + D + E, 43.4 + D + E, 43.65 + D + E, 43.95 + D + E] as Env,
    pullBack: [43.9 + D + E, 48.0 + D + E] as const,
    credits: [44.0 + D + E, 48.2 + D + E] as const,
    fin: [47.8 + D + E, 48.6 + D + E] as const,
  },
} as const;

export const BEATS = 50 + D + E;

/** Room `i` of Act II: set in over [a, b], played over [b, c], struck over [c, d]. */
export function roomCue(i: number) {
  const a = ROOM.first + i * ROOM.each;
  return { a, b: a + 0.7, c: a + ROOM.each - 0.7, d: a + ROOM.each };
}

/** Which room is on stage (the nearest one). */
export function roomAt(t: number) {
  return Math.min(3, Math.max(0, Math.floor((t - ROOM.first) / ROOM.each)));
}

/** When each line of the script is spoken (in/hold/out envelope, in beats). */
export const LINES: Record<string, Env> = {
  prologue: [-2, -1, 0.85, 1.1],
  coast1: [4.5, 4.65, 5.2, 5.35],
  coast2: [5.4, 5.5, 5.9, 6.0],
  coast3: [6.05, 6.15, 6.6, 6.72],
  coast4: [6.75, 6.85, 7.2, 7.32],
  coast5: [7.36, 7.45, 7.8, 7.9],
  personae: [8.4, 8.5, 9.3, 9.45],
  interval: [28.9 + D, 29.05 + D, 29.6 + D, 29.75 + D],
  ghost: [34.0 + D, 34.15 + D, 34.85 + D, 35.0 + D],
  ghost2: [35.1 + D, 35.2 + D, 35.9 + D, 36.05 + D],
  door: [38.5 + D, 38.62 + D, 39.4 + D, 39.55 + D],
  door2: [41.0 + D, 41.15 + D, 43.2 + D, 43.4 + D],
  bow: [42.6 + D + E, 42.7 + D + E, 43.0 + D + E, 43.1 + D + E],
};
for (let i = 0; i < 4; i++) {
  const r = roomCue(i);
  // one line in the first half of each room, one in the second
  LINES[`room${i}`] = [r.b - 0.05, r.b + 0.05, r.b + 0.75, r.b + 0.85];
  LINES[`room${i}b`] = [r.b + 0.95, r.b + 1.05, r.c - 0.05, r.c + 0.05];
}
for (let i = 0; i < 4; i++) {
  const a = Q.act3.first + i * Q.act3.each;
  LINES[`work${i}`] = [a + 0.9, a + 1.0, a + 1.85, a + 1.95];
}

export function workCue(i: number) {
  const a = Q.act3.first + i * Q.act3.each;
  return { a, b: a + 0.6, c: a + Q.act3.each - 0.35, d: a + Q.act3.each + 0.15 };
}

export const ACTS3D: ActMark[] = [
  { id: "prologue", numeral: "—", label: "Prologue", title: "The House Lights Dim", from: 0, goto: 0 },
  { id: "act-1", numeral: "I", label: "Act I", title: "The Protagonist", from: Q.act1.card[0], goto: 5.0 },
  { id: "act-2", numeral: "II", label: "Act II", title: "The Apprenticeship", from: Q.act2.card[0], goto: roomCue(0).b + 0.2 },
  { id: "act-3", numeral: "III", label: "Act III", title: "The Works", from: Q.act3.card[0], goto: 18.9 + D },
  { id: "intermission", numeral: "¶", label: "Intermission", title: "Refreshments", from: Q.interval.curtainClose[0], goto: 29.9 + D },
  { id: "act-4", numeral: "IV", label: "Act IV", title: "The Dressing Room", from: Q.act4.card[0], goto: 35.9 + D },
  { id: "act-5", numeral: "V", label: "Act V", title: "The Stage Door", from: Q.act5.card[0], goto: Q.act5.form[1] + 0.1 },
  { id: "finale", numeral: "✦", label: "Curtain Call", title: "Credits", from: Q.act5.blackout[2], goto: 44.5 + D + E },
];

/** 0 closed … 1 open. */
export function curtainAt(t: number) {
  const s = (x: number, a: number, b: number) => {
    const p = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  };
  const { prologue, interval, finale } = Q;
  if (t < interval.curtainClose[0]) return s(t, ...prologue.curtainOpen);
  if (t < interval.curtainOpen[0]) return 1 - s(t, ...interval.curtainClose);
  if (t < finale.curtainClose[0]) return s(t, ...interval.curtainOpen);
  return 1 - s(t, ...finale.curtainClose);
}

/** 0 = house lights up … 1 = show dark. */
export function houseDarkAt(t: number) {
  const s = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));
  const { prologue, interval, finale } = Q;
  const dim = s(t, ...prologue.dim);
  const up = s(t, interval.curtainClose[0], interval.menu[1]) * (1 - s(t, interval.audienceBack[0], interval.curtainOpen[1]));
  const end = s(t, finale.pullBack[0] + 1, finale.fin[1]);
  return Math.max(0, dim - up * 0.8 - end * 0.75);
}
