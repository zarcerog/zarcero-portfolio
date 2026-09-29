// The film's score: "The Client Is Not in a Hurry", an original theme in
// G minor for the same little band as the theatre (balalaika, cimbalom,
// harpsichord, pizzicato bass, glockenspiel, a whistled flabiol…), played as
// variations, one per chapter, and turned to G major for the fireworks.
// Plain data and pure functions: no Web Audio here.

import { midiOf, SIXTEENTH as THEATRE_SIXTEENTH, type Inst, type NoteEv } from "@/theatre/sound/score";

export { midiOf };
export type { Inst, NoteEv };

/** A little slower than the theatre's march: a stroll, not a parade. */
export const TEMPO = 96;
export const STEPS = 16;
export const SIXTEENTH = 60 / TEMPO / 4;
export const BAR_SECONDS = SIXTEENTH * STEPS;
/** The theatre's orchestra measures note lengths in its own sixteenths. */
export const DUR_SCALE = SIXTEENTH / THEATRE_SIXTEENTH;

/** G natural minor → G major: Bb→B, Eb→E, F→F#. */
export function toMajor(midi: number) {
  const pc = ((midi % 12) + 12) % 12;
  return pc === 10 || pc === 3 || pc === 5 ? midi + 1 : midi;
}

// Eight quavers per bar: a note, "-" to hold the previous one, "." for a rest.
const THEME: string[] = [
  // A — a patient little tune, in G minor
  "D5 . D5 Eb5 D5 C5 Bb4 A4",
  "G4 - Bb4 - D5 - - .",
  "C5 . C5 D5 Eb5 D5 C5 Bb4",
  "A4 - F#4 - D4 - . .",
  "G4 . A4 Bb4 C5 D5 Eb5 D5",
  "C5 - Eb5 - G5 - F5 Eb5",
  "D5 C5 Bb4 A4 G4 A4 Bb4 F#4",
  "G4 - - - . . D4 .",
  // B — it lifts into B-flat, and takes its time coming home
  "F4 . Bb4 D5 F5 - D5 Bb4",
  "Eb5 - C5 - A4 - . .",
  "D5 . Bb4 G4 D5 - Bb4 G4",
  "C5 - A4 - F#4 - . .",
  "Eb5 . Eb5 D5 C5 Bb4 C5 D5",
  "Bb4 - G4 - D4 - . .",
  "C5 Eb5 G5 Eb5 D5 F#5 A5 F#5",
  "G5 - D5 - G4 - - .",
];

type Chord = string;
const HARMONY_MINOR: (Chord | [Chord, Chord])[] = [
  "Gm", "Gm", "Cm", "D7", ["Gm", "Eb"], "Cm", "D7", "Gm",
  "Bb", "F7", "Gm", "D7", "Cm", "Gm", ["Cm", "D7"], "Gm",
];
const HARMONY_MAJOR: (Chord | [Chord, Chord])[] = [
  "G", "G", "C", "D7", ["G", "C"], "C", "D7", "G",
  "D", "A7", "Bm", "D7", "C", "G", ["C", "D7"], "G",
];

const CHORDS: Record<string, [string, number[]]> = {
  Gm: ["G2", [0, 3, 7]],
  G: ["G2", [0, 4, 7]],
  Cm: ["C3", [0, 3, 7]],
  C: ["C3", [0, 4, 7]],
  D7: ["D2", [0, 4, 7, 10]],
  D: ["D2", [0, 4, 7]],
  Eb: ["Eb2", [0, 4, 7]],
  Bb: ["Bb2", [0, 4, 7]],
  F7: ["F2", [0, 4, 7, 10]],
  A7: ["A2", [0, 4, 7, 10]],
  Bm: ["B2", [0, 3, 7]],
};

export interface ThemeNote {
  step: number;
  midi: number;
  dur: number;
}

export function themeBar(bar: number, major = false): ThemeNote[] {
  const toks = THEME[bar % THEME.length].split(/\s+/);
  const out: ThemeNote[] = [];
  toks.forEach((tok, i) => {
    if (tok === "-" && out.length && out[out.length - 1].step + out[out.length - 1].dur === i * 2) {
      out[out.length - 1].dur += 2;
    } else if (tok !== "-" && tok !== ".") {
      const m = midiOf(tok);
      out.push({ step: i * 2, midi: major ? toMajor(m) : m, dur: 2 });
    }
  });
  return out;
}

export interface BarChord {
  step: number;
  dur: number;
  root: number;
  tones: number[];
}

export function chordsOf(bar: number, major = false): BarChord[] {
  const h = (major ? HARMONY_MAJOR : HARMONY_MINOR)[bar % 16];
  const parts = Array.isArray(h) ? h : [h];
  const len = STEPS / parts.length;
  return parts.map((name, i) => {
    const [root, iv] = CHORDS[name];
    const r = midiOf(root);
    return { step: i * len, dur: len, root: r, tones: iv.map((x) => r + x) };
  });
}

function voicing(ch: BarChord, floor: number, count: number) {
  const pcs = ch.tones.map((t) => ((t % 12) + 12) % 12);
  const out: number[] = [];
  for (let m = floor; out.length < count && m < floor + 36; m++) if (pcs.includes(((m % 12) + 12) % 12)) out.push(m);
  return out;
}

// ---------------------------------------------------------------- parts

type Part = (bar: number, major: boolean, out: NoteEv[]) => void;

const melody =
  (inst: Inst, o: { octave?: number; vel?: number; tremolo?: boolean; staccato?: boolean; legato?: boolean; only?: "A" | "B" }): Part =>
  (bar, major, out) => {
    if (o.only === "A" && bar % 16 >= 8) return;
    if (o.only === "B" && bar % 16 < 8) return;
    const vel = o.vel ?? 0.8;
    for (const n of themeBar(bar, major)) {
      const midi = n.midi + (o.octave ?? 0);
      if (o.tremolo && n.dur >= 2) {
        for (let k = 0; k < n.dur * 2; k++) out.push({ inst, step: n.step + k / 2, midi, dur: 0.7, vel: vel * (k === 0 ? 1 : Math.max(0.3, 0.6 - k * 0.015)) });
      } else {
        out.push({ inst, step: n.step, midi, dur: o.staccato ? 1 : o.legato ? n.dur + 0.3 : n.dur, vel });
      }
    }
  };

const bass =
  (vel = 0.8, pattern: "oompah" | "downbeat" | "walk" = "oompah"): Part =>
  (bar, major, out) => {
    const chords = chordsOf(bar, major);
    if (pattern === "walk") {
      const next = chordsOf(bar + 1, major)[0].root;
      chords.forEach((c) => {
        const beats = c.dur / 4;
        const line = [c.root, c.tones[1], c.tones[2], next > c.root ? next - 1 : next + 1];
        for (let b = 0; b < beats; b++) {
          const idx = beats === 4 ? b : b === 0 ? 0 : 3;
          out.push({ inst: "bass", step: c.step + b * 4, midi: line[idx], dur: 3, vel: vel * (b === 0 ? 1 : 0.8) });
        }
      });
      return;
    }
    chords.forEach((c) => {
      out.push({ inst: "bass", step: c.step, midi: c.root, dur: 4, vel });
      if (pattern === "oompah") {
        const fifth = c.tones[2] - 12 >= 38 ? c.tones[2] - 12 : c.tones[2];
        out.push({ inst: "bass", step: c.step + c.dur / 2, midi: fifth, dur: 3, vel: vel * 0.8 });
      }
    });
  };

const stabs =
  (inst: Inst, vel = 0.5, steps = [4, 12]): Part =>
  (bar, major, out) => {
    const chords = chordsOf(bar, major);
    for (const s of steps) {
      const c = chords.find((ch) => s >= ch.step && s < ch.step + ch.dur) ?? chords[0];
      voicing(c, 55, 3).forEach((m, i) => out.push({ inst, step: s + i * 0.12, midi: m, dur: 2, vel: vel * (1 - i * 0.1) }));
    }
  };

const arpeggio =
  (inst: Inst, every: 1 | 2, vel = 0.5, floor = 62): Part =>
  (bar, major, out) => {
    const shape = [0, 2, 1, 3, 2, 4, 3, 1];
    for (const c of chordsOf(bar, major)) {
      const v = voicing(c, floor, 5);
      for (let s = 0; s < c.dur; s += every) {
        const i = (s / every) % shape.length;
        out.push({ inst, step: c.step + s, midi: v[shape[i]], dur: every * 1.5, vel: vel * (s % 4 === 0 ? 1 : 0.75) });
      }
    }
  };

const pad =
  (inst: Inst, vel = 0.3, floor = 50): Part =>
  (bar, major, out) => {
    for (const c of chordsOf(bar, major)) voicing(c, floor, 4).forEach((m) => out.push({ inst, step: c.step, midi: m, dur: c.dur, vel }));
  };

const drums =
  (inst: Inst, steps: number[], vel = 0.5, accent: number[] = [], every = 1): Part =>
  (bar, _major, out) => {
    if (bar % every !== 0) return;
    for (const s of steps) out.push({ inst, step: s, midi: 60, dur: 1, vel: accent.includes(s) ? vel : vel * 0.6 });
  };

const clock =
  (vel = 0.4): Part =>
  (_bar, _major, out) => {
    for (let b = 0; b < 4; b++) out.push({ inst: "wood", step: b * 4, midi: b % 2 ? 72 : 79, dur: 1, vel });
  };

const march =
  (vel = 0.45): Part =>
  (bar, _major, out) => {
    for (const s of [0, 4, 6, 8, 12, 14]) out.push({ inst: "snare", step: s, midi: 60, dur: 1, vel: s % 8 === 0 ? vel : vel * 0.6 });
    if (bar % 4 === 3) for (let s = 12; s < 16; s += 0.5) out.push({ inst: "snare", step: s, midi: 60, dur: 0.5, vel: vel * (0.3 + (s - 12) * 0.12) });
  };

const timpani =
  (vel = 0.6, every = 4): Part =>
  (bar, major, out) => {
    const root = chordsOf(bar, major)[0].root;
    if (bar % every === 0) out.push({ inst: "timp", step: 0, midi: root < 40 ? root + 12 : root, dur: 8, vel });
    if (bar % 16 === 15) for (let s = 8; s < 16; s += 0.5) out.push({ inst: "timp", step: s, midi: 43, dur: 1, vel: vel * (0.25 + (s - 8) * 0.05) });
  };

// ---------------------------------------------------------------- the chapters

export type SectionId = "sky" | "fields" | "stone" | "gaudi" | "tram" | "fire" | "mend" | "machines" | "june" | "fiesta" | "fin";

interface Section {
  parts: Part[];
  major?: boolean;
  /** only the first eight bars, round and round */
  aOnly?: boolean;
}

export const SECTIONS: Record<SectionId, Section> = {
  // Prologue: the sky, a music box
  sky: { parts: [melody("celesta", { octave: 12, vel: 0.45 }), arpeggio("celesta", 2, 0.2, 62), pad("organ", 0.1)] },
  // I. The fields of the Poblet: balalaika over a guitar, and a flabiol (whistle) in the B section
  fields: {
    parts: [
      melody("balalaika", { tremolo: true, vel: 0.7 }),
      melody("whistle", { octave: 12, legato: true, vel: 0.3, only: "B" }),
      stabs("guitar", 0.38),
      bass(0.72),
      drums("tri", [0], 0.28, [0], 4),
    ],
  },
  // II. The first stone: ceremony, snare and glockenspiel
  stone: {
    parts: [melody("glock", { octave: 12, vel: 0.5 }), march(0.34), bass(0.7, "downbeat"), pad("organ", 0.14), timpani(0.5)],
  },
  // III. Gaudí: everybody busy at once
  gaudi: {
    parts: [
      melody("cimbalom", { tremolo: true, vel: 0.62 }),
      melody("glock", { octave: 12, vel: 0.26, staccato: true, only: "B" }),
      arpeggio("harpsi", 1, 0.34, 55),
      bass(0.75, "walk"),
      drums("brush", [0, 2, 4, 6, 8, 10, 12, 14], 0.28, [4, 12]),
      timpani(0.5),
    ],
  },
  // IV. June 1926: a guitar alone, the celesta very quiet
  tram: {
    aOnly: true,
    parts: [arpeggio("guitar", 2, 0.4, 50), melody("celesta", { vel: 0.3 }), pad("organ", 0.09), bass(0.5, "downbeat")],
  },
  // V. The fire: only the organ and the drums, low
  fire: { parts: [pad("organ", 0.16, 43), timpani(0.45, 2)] },
  // …and the mending: somebody whistles
  mend: {
    parts: [melody("whistle", { legato: true, vel: 0.5 }), bass(0.5, "downbeat"), arpeggio("celesta", 2, 0.15, 62), pad("organ", 0.08)],
  },
  // VI. The machines: glockenspiel, harpsichord, a clock ticking
  machines: {
    parts: [
      melody("glock", { octave: 12, staccato: true, vel: 0.5 }),
      arpeggio("harpsi", 1, 0.38, 55),
      bass(0.72),
      clock(0.26),
      drums("brush", [0, 4, 8, 12], 0.22, [0, 8]),
    ],
  },
  // VII. The tenth of June: waiting for the dark
  june: {
    parts: [melody("celesta", { octave: 12, vel: 0.4 }), arpeggio("guitar", 2, 0.34, 50), pad("organ", 0.12), bass(0.6, "downbeat"), timpani(0.4)],
  },
  // …and the fireworks: the whole band, in G major
  fiesta: {
    major: true,
    parts: [
      melody("cimbalom", { tremolo: true, vel: 0.62 }),
      melody("glock", { octave: 12, vel: 0.42 }),
      melody("whistle", { octave: 12, legato: true, vel: 0.22, only: "B" }),
      arpeggio("harpsi", 1, 0.3, 55),
      bass(0.8),
      march(0.3),
      timpani(0.55),
      drums("tri", [0], 0.3, [0], 2),
      pad("organ", 0.12),
    ],
  },
  // Fin: the music box plays the house out, in the major
  fin: { major: true, aOnly: true, parts: [melody("celesta", { octave: 12, vel: 0.42 }), arpeggio("celesta", 2, 0.18, 62)] },
};

export function cycleOf(id: SectionId) {
  return SECTIONS[id].aOnly ? 8 : 16;
}

export function barEvents(id: SectionId, bar: number): NoteEv[] {
  const s = SECTIONS[id];
  const out: NoteEv[] = [];
  for (const p of s.parts) p(bar % cycleOf(id), !!s.major, out);
  return out.sort((x, y) => x.step - y.step);
}

/** A rising flourish that marks a change of chapter. */
export function flourish(major = false): NoteEv[] {
  const notes = ["G5", "Bb5", "D6", "G6", "Bb6", "D7"].map((n) => (major ? toMajor(midiOf(n)) : midiOf(n)));
  return notes.map((midi, i) => ({ inst: "celesta" as const, step: i * 0.5, midi, dur: 3, vel: 0.33 + i * 0.04 }));
}
