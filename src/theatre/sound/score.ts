// The score. One original theme, "The Zarcero Theatre March", in D minor,
// played as a set of variations: every act re-orchestrates the same tune,
// the way a young person's guide to the orchestra introduces one section at a
// time. Everything here is plain data and pure functions (no Web Audio), so
// the arrangement can be tested and rendered offline.

export type Inst =
  | "balalaika" // tremolo plucked strings (Karplus–Strong)
  | "guitar" // softer plucked chords
  | "bass" // pizzicato double bass
  | "harpsi" // harpsichord
  | "cimbalom" // hammered dulcimer
  | "glock" // glockenspiel
  | "celesta"
  | "organ" // pump organ pad
  | "whistle"
  | "brush" // brushed snare swish
  | "snare" // light march snare
  | "wood" // woodblock
  | "timp" // timpani
  | "tri"; // triangle

export interface NoteEv {
  inst: Inst;
  /** position in sixteenths from the start of the bar (may be fractional) */
  step: number;
  midi: number;
  /** length in sixteenths */
  dur: number;
  /** 0…1 */
  vel: number;
}

export const TEMPO = 116;
export const STEPS = 16;
/** seconds per sixteenth */
export const SIXTEENTH = 60 / TEMPO / 4;
export const BAR_SECONDS = SIXTEENTH * STEPS;

// ---------------------------------------------------------------- pitch

const NAMES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "C#5" → 73, "Bb4" → 70 */
export function midiOf(name: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  const acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  return NAMES[m[1]] + acc + (Number(m[3]) + 1) * 12;
}

/** D natural minor → D major: F→F#, C→C#, Bb→B (C# stays: it is the leading tone). */
export function toMajor(midi: number) {
  const pc = ((midi % 12) + 12) % 12;
  return pc === 5 || pc === 0 || pc === 10 ? midi + 1 : midi;
}

// ---------------------------------------------------------------- the tune

// Eight quavers per bar: a note, "-" to hold the previous one, "." for a rest.
const THEME: string[] = [
  // A — the march, in D minor
  "A4 . A4 D5 C5 Bb4 A4 .",
  "F4 - A4 - D4 - - .",
  "G4 . G4 Bb4 D5 C5 Bb4 .",
  "A4 - C#5 - E5 - . .",
  "F5 . E5 D5 C#5 D5 A4 .",
  "Bb4 . D5 . F5 - D5 .",
  "G4 Bb4 D5 Bb4 A4 C#5 E5 G5",
  "F5 - D5 - - . A4 .",
  // B — it opens out into F major and finds its way home
  "C5 - A4 F4 A4 C5 F5 -",
  "E5 - C5 - G4 - . .",
  "D5 - F5 - A5 - F5 D5",
  "C#5 - E5 - A4 - . .",
  "D5 . D5 F5 Bb5 - A5 G5",
  "A5 - F5 - C5 - A4 .",
  "Bb4 D5 G5 D5 C#5 E5 A5 G5",
  "F5 - E5 - D5 - - .",
];

type Chord = string;
/** one chord per bar, or two (first and second half) */
const HARMONY_MINOR: (Chord | [Chord, Chord])[] = [
  "Dm", "Dm", "Gm", "A7", "Dm", "Bb", ["Gm", "A7"], "Dm",
  "F", "C", "Dm", "A", "Bb", "F", ["Gm", "A7"], "Dm",
];
const HARMONY_MAJOR: (Chord | [Chord, Chord])[] = [
  "D", "D", "G", "A7", "D", "Bm", ["G", "A7"], "D",
  "F#m", "A", "D", "A", "Bm", "F#m", ["G", "A7"], "D",
];

/** root (in octave 2, for the bass) and chord-tone intervals */
const CHORDS: Record<string, [string, number[]]> = {
  Dm: ["D2", [0, 3, 7]],
  D: ["D2", [0, 4, 7]],
  Gm: ["G2", [0, 3, 7]],
  G: ["G2", [0, 4, 7]],
  A7: ["A2", [0, 4, 7, 10]],
  A: ["A2", [0, 4, 7]],
  Bb: ["Bb2", [0, 4, 7]],
  Bm: ["B2", [0, 3, 7]],
  F: ["F2", [0, 4, 7]],
  "F#m": ["F#2", [0, 3, 7]],
  C: ["C3", [0, 4, 7]],
};

export interface ThemeNote {
  step: number;
  midi: number;
  dur: number;
}

/** The theme's notes in bar `bar` (0…15), in sixteenths. */
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

/** Chord tones stacked upwards from `floor`. */
function voicing(ch: BarChord, floor: number, count: number) {
  const pcs = ch.tones.map((t) => ((t % 12) + 12) % 12);
  const out: number[] = [];
  for (let m = floor; out.length < count && m < floor + 36; m++) {
    if (pcs.includes(((m % 12) + 12) % 12)) out.push(m);
  }
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
        // balalaika tremolo: the note re-struck every thirty-second, softening
        for (let k = 0; k < n.dur * 2; k++) {
          out.push({ inst, step: n.step + k / 2, midi, dur: 0.7, vel: vel * (k === 0 ? 1 : Math.max(0.3, 0.6 - k * 0.015)) });
        }
      } else {
        out.push({ inst, step: n.step, midi, dur: o.staccato ? 1 : o.legato ? n.dur + 0.3 : n.dur, vel });
      }
    }
  };

const oompah =
  (inst: Inst, vel = 0.8, pattern: "oompah" | "downbeat" | "walk" = "oompah"): Part =>
  (bar, major, out) => {
    const chords = chordsOf(bar, major);
    if (pattern === "walk") {
      // a walking line: root, third, fifth, then a step towards the next root
      const next = chordsOf(bar + 1, major)[0].root;
      chords.forEach((c) => {
        const beats = c.dur / 4;
        const line = [c.root, c.tones[1], c.tones[2], next > c.root ? next - 1 : next + 1];
        for (let b = 0; b < beats; b++) {
          const idx = beats === 4 ? b : b === 0 ? 0 : 3;
          out.push({ inst, step: c.step + b * 4, midi: line[idx], dur: 3, vel: vel * (b === 0 ? 1 : 0.8) });
        }
      });
      return;
    }
    chords.forEach((c) => {
      out.push({ inst, step: c.step, midi: c.root, dur: 4, vel });
      if (pattern === "oompah") {
        const fifth = c.tones[2] - 12 >= 38 ? c.tones[2] - 12 : c.tones[2];
        out.push({ inst, step: c.step + c.dur / 2, midi: fifth, dur: 3, vel: vel * 0.8 });
      }
    });
  };

const stabs =
  (inst: Inst, vel = 0.5, steps = [4, 12]): Part =>
  (bar, major, out) => {
    const chords = chordsOf(bar, major);
    for (const s of steps) {
      const c = chords.find((ch) => s >= ch.step && s < ch.step + ch.dur) ?? chords[0];
      voicing(c, 57, 3).forEach((m, i) => out.push({ inst, step: s + i * 0.12, midi: m, dur: 2, vel: vel * (1 - i * 0.1) }));
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
    for (const c of chordsOf(bar, major)) {
      voicing(c, floor, 4).forEach((m) => out.push({ inst, step: c.step, midi: m, dur: c.dur, vel }));
    }
  };

const drums =
  (inst: Inst, steps: number[], vel = 0.5, accent: number[] = [], every = 1): Part =>
  (bar, _major, out) => {
    if (bar % every !== 0) return;
    for (const s of steps) out.push({ inst, step: s, midi: 60, dur: 1, vel: accent.includes(s) ? vel : vel * 0.6 });
  };

/** tick-tock: high on the beat, low off it */
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
  (vel = 0.6): Part =>
  (bar, major, out) => {
    const root = chordsOf(bar, major)[0].root;
    if (bar % 4 === 0) out.push({ inst: "timp", step: 0, midi: root < 40 ? root + 12 : root, dur: 8, vel });
    if (bar % 16 === 15) for (let s = 8; s < 16; s += 0.5) out.push({ inst: "timp", step: s, midi: 45, dur: 1, vel: vel * (0.25 + (s - 8) * 0.05) });
  };

// ---------------------------------------------------------------- the variations

export type SectionId = "prologue" | "act1" | "act2" | "act3" | "interval" | "act4" | "act5" | "finale";

interface Section {
  parts: Part[];
  /** extra parts for Act II's four rooms */
  rooms?: Part[][];
  major?: boolean;
  /** play only the first eight bars, round and round */
  aOnly?: boolean;
}

export const SECTIONS: Record<SectionId, Section> = {
  // a music box while the house settles
  prologue: {
    parts: [melody("celesta", { octave: 12, vel: 0.5 }), arpeggio("celesta", 2, 0.22, 62), pad("organ", 0.12)],
  },
  // the Maresme: balalaika tremolo, a guitar, the bass, brushes like surf
  act1: {
    parts: [
      melody("balalaika", { tremolo: true, vel: 0.75 }),
      stabs("guitar", 0.4),
      oompah("bass", 0.75),
      drums("brush", [0, 2, 4, 6, 8, 10, 12, 14], 0.35, [4, 12]),
      drums("tri", [0], 0.3, [0], 4),
    ],
  },
  // the apprenticeship: the harpsichord keeps busy, the glockenspiel sings,
  // a woodblock keeps office hours; each room adds its own instrument
  act2: {
    parts: [melody("glock", { octave: 12, staccato: true, vel: 0.55 }), arpeggio("harpsi", 1, 0.42, 57), oompah("bass", 0.7), clock(0.3)],
    rooms: [
      [],
      [march(0.35)],
      [melody("cimbalom", { tremolo: true, vel: 0.5, octave: -12, only: "B" }), drums("tri", [0, 8], 0.25, [0], 1)],
      [arpeggio("celesta", 2, 0.25, 74), drums("tri", [0], 0.3, [0], 2)],
    ],
  },
  // the works: everyone at once
  act3: {
    parts: [
      melody("cimbalom", { tremolo: true, vel: 0.7 }),
      melody("glock", { octave: 12, vel: 0.3, staccato: true }),
      arpeggio("harpsi", 1, 0.35, 57),
      oompah("bass", 0.8, "walk"),
      drums("brush", [0, 2, 4, 6, 8, 10, 12, 14], 0.3, [4, 12]),
      timpani(0.55),
      pad("organ", 0.1),
    ],
  },
  // refreshments: somebody whistles over the pizzicato
  interval: {
    parts: [melody("whistle", { legato: true, vel: 0.55 }), oompah("bass", 0.55, "downbeat"), arpeggio("celesta", 2, 0.16, 62), pad("organ", 0.1)],
  },
  // the dressing room: a guitar picked alone, the celesta very quiet
  act4: {
    major: true,
    parts: [arpeggio("guitar", 2, 0.42, 50), melody("celesta", { vel: 0.38, only: "B" }), pad("organ", 0.08), oompah("bass", 0.5, "downbeat")],
  },
  // the walk to the stage door: a little march, still in the minor
  act5: {
    aOnly: true,
    parts: [melody("balalaika", { tremolo: true, vel: 0.62 }), oompah("bass", 0.7), march(0.3), pad("organ", 0.1, 45)],
  },
  // curtain call: the same tune, in the major, with the whole band
  finale: {
    major: true,
    parts: [
      melody("glock", { octave: 12, vel: 0.45 }),
      melody("cimbalom", { tremolo: true, vel: 0.65 }),
      arpeggio("harpsi", 1, 0.32, 57),
      oompah("bass", 0.8),
      march(0.32),
      timpani(0.6),
      drums("tri", [0], 0.3, [0], 2),
      pad("organ", 0.12),
    ],
  },
};

/** How many bars a section loops over. */
export function cycleOf(id: SectionId) {
  return SECTIONS[id].aOnly ? 8 : 16;
}

/** Every note of one bar of a section, sorted by time. */
export function barEvents(id: SectionId, bar: number, room = 0): NoteEv[] {
  const s = SECTIONS[id];
  const b = bar % cycleOf(id);
  const out: NoteEv[] = [];
  for (const p of s.parts) p(b, !!s.major, out);
  for (const p of s.rooms?.[room] ?? []) p(b, !!s.major, out);
  return out.sort((x, y) => x.step - y.step);
}

/** A short flourish (rising arpeggio) that marks a change of act. */
export function flourish(major = false): NoteEv[] {
  const notes = ["D5", "F5", "A5", "D6", "F6", "A6"].map((n) => (major ? toMajor(midiOf(n)) : midiOf(n)));
  return notes.map((midi, i) => ({ inst: "celesta" as const, step: i * 0.5, midi, dur: 3, vel: 0.35 + i * 0.04 }));
}
