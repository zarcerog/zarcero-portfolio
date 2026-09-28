// The running order, in beats. One beat ≈ 0.8 viewport heights of scroll.
// Every cue in the show is defined here so the whole play can be re-timed
// from a single file — the stage manager's prompt book.

export const CUES = {
  prologue: {
    titleOut: [0.45, 1.15] as const,
    dim: [0.1, 1.3] as const,
    curtainOpen: [0.85, 2.3] as const,
  },

  act1: {
    start: 2.4,
    card: [2.4, 2.85, 3.2, 3.6] as const,
    setIn: [2.9, 3.7] as const,
    train: [3.5, 6.4] as const,
    lines: [
      [3.7, 4.0, 4.4, 4.6],
      [4.55, 4.8, 5.25, 5.45],
      [5.4, 5.65, 6.15, 6.4],
    ] as const,
    setOut: [6.3, 6.9] as const,
    personae: [6.85, 7.5, 8.35, 8.8] as const,
  },

  act2: {
    start: 8.8,
    card: [8.8, 9.25, 9.6, 10.0] as const,
    wagonIn: [9.5, 10.3] as const,
    // pan across four rooms: 0 → 3
    pan: [10.5, 14.7] as const,
    wagonOut: [14.9, 15.5] as const,
  },

  act3: {
    start: 15.5,
    card: [15.5, 15.95, 16.3, 16.7] as const,
    first: 16.5,
    each: 2.05,
  },

  intermission: {
    start: 26.8,
    curtainClose: [26.8, 27.5] as const,
    card: [27.3, 27.8, 29.6, 30.0] as const,
    audienceOut: [27.5, 28.0] as const,
    audienceBack: [29.2, 29.7] as const,
    curtainOpen: [29.9, 30.7] as const,
  },

  act4: {
    start: 30.7,
    card: [30.7, 31.15, 31.5, 31.9] as const,
    setIn: [31.6, 32.2] as const,
    pins: [32.2, 32.75, 33.3, 33.85] as const,
    setOut: [35.0, 35.6] as const,
  },

  act5: {
    start: 35.6,
    card: [35.6, 36.05, 36.4, 36.8] as const,
    setIn: [36.6, 37.3] as const,
    setOut: [39.6, 40.2] as const,
  },

  finale: {
    start: 40.2,
    curtainClose: [40.2, 40.9] as const,
    bows: [40.9, 42.2] as const,
    credits: [41.8, 47.0] as const,
    fin: [46.6, 47.4] as const,
  },
} as const;

export const TOTAL_BEATS = 48.4;

/** Works in Act III: in/out beats for scene `i`. */
export function workCue(i: number) {
  const a = CUES.act3.first + i * CUES.act3.each;
  return {
    a,
    b: a + 0.55,
    c: a + CUES.act3.each - 0.35,
    d: a + CUES.act3.each + 0.12,
  };
}

export interface ActMark {
  id: string;
  numeral: string;
  label: string;
  title: string;
  /** Beat where the act begins (for the annunciator). */
  from: number;
  /** Beat the programme jumps to (scenery fully set). */
  goto: number;
}

export const ACTS: ActMark[] = [
  { id: "prologue", numeral: "—", label: "Prologue", title: "The House Lights Dim", from: 0, goto: 0 },
  { id: "act-1", numeral: "I", label: "Act I", title: "The Protagonist", from: CUES.act1.start, goto: 3.75 },
  { id: "act-2", numeral: "II", label: "Act II", title: "The Apprenticeship", from: CUES.act2.start, goto: 10.4 },
  { id: "act-3", numeral: "III", label: "Act III", title: "The Works", from: CUES.act3.start, goto: 17.1 },
  { id: "intermission", numeral: "¶", label: "Intermission", title: "Refreshments", from: CUES.intermission.start, goto: 28.2 },
  { id: "act-4", numeral: "IV", label: "Act IV", title: "In Rehearsal", from: CUES.act4.start, goto: 34.3 },
  { id: "act-5", numeral: "V", label: "Act V", title: "The Stage Door", from: CUES.act5.start, goto: 37.5 },
  { id: "finale", numeral: "✦", label: "Curtain Call", title: "Credits", from: CUES.finale.start, goto: 42.5 },
];

export function actIndexAt(t: number) {
  let idx = 0;
  for (let i = 0; i < ACTS.length; i++) if (t >= ACTS[i].from - 0.01) idx = i;
  return idx;
}
