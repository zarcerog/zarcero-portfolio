import { describe, expect, it } from "vitest";

import { clocks, coins, pluck, projector } from "./dsp";
import { crossed, env, programFromActs, stepsCrossed, type SoundCue } from "./program";
import { SECTIONS, STEPS, barEvents, chordsOf, cycleOf, midiOf, themeBar, toMajor, type SectionId } from "./score";

describe("the score", () => {
  it("reads note names", () => {
    expect(midiOf("A4")).toBe(69);
    expect(midiOf("C#5")).toBe(73);
    expect(midiOf("Bb4")).toBe(70);
    expect(midiOf("D2")).toBe(38);
  });

  it("keeps every bar of the theme inside the bar", () => {
    for (let b = 0; b < 16; b++) {
      const notes = themeBar(b);
      expect(notes.length).toBeGreaterThan(0);
      for (const n of notes) expect(n.step + n.dur).toBeLessThanOrEqual(STEPS);
    }
  });

  it("puts the melody on chord tones on the downbeats", () => {
    // the first note of every bar belongs to that bar's chord (a march should land squarely)
    for (let b = 0; b < 16; b++) {
      const first = themeBar(b)[0];
      const chord = chordsOf(b)[0];
      const pcs = chord.tones.map((t) => t % 12);
      expect(pcs, `bar ${b + 1}`).toContain(first.midi % 12);
    }
  });

  it("turns D minor into D major for the curtain call", () => {
    expect(toMajor(midiOf("F4"))).toBe(midiOf("F#4"));
    expect(toMajor(midiOf("Bb4"))).toBe(midiOf("B4"));
    expect(toMajor(midiOf("C#5"))).toBe(midiOf("C#5"));
    expect(toMajor(midiOf("A4"))).toBe(midiOf("A4"));
  });

  it("gives every section a full, sane bar", () => {
    for (const id of Object.keys(SECTIONS) as SectionId[]) {
      const rooms = SECTIONS[id].rooms?.length ?? 1;
      for (let room = 0; room < rooms; room++) {
        for (let b = 0; b < cycleOf(id); b++) {
          const ev = barEvents(id, b, room);
          expect(ev.length, `${id} bar ${b}`).toBeGreaterThan(3);
          for (const e of ev) {
            expect(e.step).toBeGreaterThanOrEqual(0);
            expect(e.step).toBeLessThan(STEPS);
            expect(e.vel).toBeGreaterThan(0);
            expect(e.vel).toBeLessThanOrEqual(1);
            expect(e.midi).toBeGreaterThan(30);
            expect(e.midi).toBeLessThan(110);
          }
        }
      }
    }
  });
});

describe("the sound plot", () => {
  const cues: SoundCue[] = [
    { at: 1, name: "curtain", dir: "both" },
    { at: 2, name: "train", dir: "fwd" },
  ];

  it("fires cues the scroll passes, going forwards", () => {
    expect(crossed(cues, 0.5, 1.5).map((c) => c.name)).toEqual(["curtain"]);
    expect(crossed(cues, 0.5, 2).map((c) => c.name)).toEqual(["curtain", "train"]);
  });

  it("only replays the reversible ones going backwards", () => {
    expect(crossed(cues, 2.5, 0.5).map((c) => c.name)).toEqual(["curtain"]);
  });

  it("stays quiet on a long jump", () => {
    expect(crossed(cues, 0, 20)).toEqual([]);
  });

  it("counts footsteps along the walk", () => {
    expect(stepsCrossed(10, 12, 0.25, 9, 10.6)).toBe(2);
    expect(stepsCrossed(10, 12, 0.25, 10.6, 10.1)).toBe(2);
    expect(stepsCrossed(10, 12, 0.25, 12.5, 13)).toBe(0);
  });

  it("shapes envelopes", () => {
    expect(env(0.5, 0, 1, 2, 3)).toBeCloseTo(0.5);
    expect(env(1.5, 0, 1, 2, 3)).toBe(1);
    expect(env(3.5, 0, 1, 2, 3)).toBe(0);
  });

  it("follows the acts in the flat production", () => {
    const p = programFromActs([
      { id: "prologue", numeral: "", label: "", title: "", from: 0, goto: 0 },
      { id: "act-1", numeral: "", label: "", title: "", from: 3, goto: 3 },
      { id: "finale", numeral: "", label: "", title: "", from: 9, goto: 9 },
    ]);
    expect(p.sectionAt(1).id).toBe("prologue");
    expect(p.sectionAt(4).id).toBe("act1");
    expect(p.sectionAt(10).id).toBe("finale");
  });
});

describe("the instruments", () => {
  it("plucks a string at the right pitch", () => {
    const sr = 32000;
    for (const f of [110, 440]) {
      const { data, freq } = pluck(sr, f, { bright: 0.7, decay: 1, pick: 0.2, seconds: 0.5 });
      // find the period by autocorrelation of the settled tone
      const a = Math.round(sr * 0.1);
      const w = Math.round(sr * 0.2);
      let best = 0;
      let lag = 0;
      for (let L = Math.floor(sr / (f * 1.4)); L <= Math.ceil(sr / (f * 0.7)); L++) {
        let c = 0;
        for (let i = a; i < a + w; i++) c += data[i] * data[i + L];
        if (c > best) {
          best = c;
          lag = L;
        }
      }
      const measured = sr / lag;
      expect(Math.abs(measured - freq) / freq).toBeLessThan(0.05);
      expect(Math.abs(freq - f) / f).toBeLessThan(0.03);
    }
  });

  it("renders beds that loop cleanly and never blow up", () => {
    for (const [l, r] of [coins(8000, 2), projector(8000, 2), clocks(8000, 2)]) {
      for (let i = 0; i < l.length; i++) {
        expect(Number.isFinite(l[i]) && Number.isFinite(r[i])).toBe(true);
      }
    }
  });
});
