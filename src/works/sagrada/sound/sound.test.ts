import { describe, expect, it } from "vitest";

import { countryside, crowd, fire, masons, street, traffic, wind } from "./beds";
import { crossed } from "./director";
import { BEDS_PLOT, CUES, musicLevel, sectionAt } from "./program";
import { SECTIONS, STEPS, barEvents, chordsOf, cycleOf, midiOf, themeBar, toMajor, type SectionId } from "./score";

describe("the film's score", () => {
  it("keeps every bar of the theme inside the bar", () => {
    for (let b = 0; b < 16; b++) {
      const notes = themeBar(b);
      expect(notes.length).toBeGreaterThan(0);
      for (const n of notes) expect(n.step + n.dur).toBeLessThanOrEqual(STEPS);
    }
  });

  it("lands the melody on a chord tone on every downbeat, in the minor and the major", () => {
    for (const major of [false, true]) {
      for (let b = 0; b < 16; b++) {
        const first = themeBar(b, major)[0];
        const pcs = chordsOf(b, major)[0].tones.map((t) => t % 12);
        expect(pcs, `bar ${b + 1}${major ? " (major)" : ""}`).toContain(first.midi % 12);
      }
    }
  });

  it("turns G minor into G major for the fireworks", () => {
    expect(toMajor(midiOf("Bb4"))).toBe(midiOf("B4"));
    expect(toMajor(midiOf("Eb5"))).toBe(midiOf("E5"));
    expect(toMajor(midiOf("F4"))).toBe(midiOf("F#4"));
    expect(toMajor(midiOf("F#4"))).toBe(midiOf("F#4"));
    expect(toMajor(midiOf("G4"))).toBe(midiOf("G4"));
  });

  it("gives every chapter a full, sane bar", () => {
    for (const id of Object.keys(SECTIONS) as SectionId[]) {
      for (let b = 0; b < cycleOf(id); b++) {
        const ev = barEvents(id, b);
        expect(ev.length, `${id} bar ${b}`).toBeGreaterThan(1);
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
  });
});

describe("the sound plot", () => {
  it("keeps its cues in order", () => {
    for (let i = 1; i < CUES.length; i++) expect(CUES[i].at).toBeGreaterThanOrEqual(CUES[i - 1].at);
  });

  it("follows the chapters", () => {
    expect(sectionAt(0)).toBe("sky");
    expect(sectionAt(10)).toBe("fields");
    expect(sectionAt(25)).toBe("gaudi");
    expect(sectionAt(36)).toBe("fire");
    expect(sectionAt(45)).toBe("machines");
    expect(sectionAt(57)).toBe("fiesta");
    expect(sectionAt(63)).toBe("fin");
  });

  it("stops the band for the pandemic, and only then", () => {
    expect(musicLevel(46.1)).toBe(0);
    expect(musicLevel(44)).toBeGreaterThan(0.9);
    expect(musicLevel(47.2)).toBeGreaterThan(0.9);
  });

  it("keeps every bed between silence and full", () => {
    for (const b of BEDS_PLOT) {
      for (let t = -1; t < 66; t += 0.25) {
        const v = b.level(t);
        expect(v, `${b.name} at ${t}`).toBeGreaterThanOrEqual(0);
        expect(v, `${b.name} at ${t}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("fires the cues it scrolls past, forwards only unless marked both ways", () => {
    const fwd = crossed(CUES, 14.5, 14.8).map((c) => c.name);
    expect(fwd).toContain("bells");
    const back = crossed(CUES, 14.8, 14.5).map((c) => c.name);
    expect(back).not.toContain("bells");
    expect(crossed(CUES, 0, 20)).toEqual([]);
  });
});

describe("the beds", () => {
  const sr = 8000;
  for (const [name, make] of Object.entries({ wind, countryside, masons, street, fire, traffic, crowd })) {
    it(`${name} is audible, finite, and loops`, () => {
      const [l, r] = make(sr);
      expect(l.length).toBe(r.length);
      let peak = 0;
      let sum = 0;
      for (let i = 0; i < l.length; i++) {
        expect(Number.isFinite(l[i]) && Number.isFinite(r[i])).toBe(true);
        peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
        sum += l[i] * l[i];
      }
      expect(peak).toBeGreaterThan(0.001);
      expect(Math.sqrt(sum / l.length)).toBeGreaterThan(peak * 0.02);
    });
  }
});
