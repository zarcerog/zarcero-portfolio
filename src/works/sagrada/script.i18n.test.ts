import { describe, expect, it } from "vitest";

import { CHAPTERS, LINES } from "./script";
import { CHAPTER_TEXT, NOTE_TEXT, SUBS, UI, lineText } from "./script.i18n";

describe("the foreign-language prints", () => {
  for (const print of ["ca", "es"] as const) {
    it(`gives every line of the script exactly one ${print} subtitle`, () => {
      const beats = Object.keys(SUBS[print]).map(Number).sort((a, b) => a - b);
      expect(beats).toEqual(LINES.map((l) => l.at).sort((a, b) => a - b));
      for (const l of LINES) expect(SUBS[print][l.at].trim().length).toBeGreaterThan(0);
    });

    it(`keeps the ${print} subtitles about as long as the English`, () => {
      // a line much longer than the original won't fit on screen in its beat
      for (const l of LINES) expect(lineText(l, print).length).toBeLessThan(l.text.length * 1.45 + 12);
    });

    it(`titles all seven chapters in ${print}`, () => {
      expect(CHAPTER_TEXT[print]).toHaveLength(CHAPTERS.length);
    });
  }

  it("leaves the English print exactly as shot", () => {
    for (const l of LINES) expect(lineText(l, "en")).toBe(l.text);
    expect(CHAPTER_TEXT.en.map((c) => c.title)).toEqual(CHAPTERS.map((c) => c.title));
  });

  it("has the same words to fill in every language", () => {
    const keys = (o: object) => Object.keys(o).sort();
    expect(keys(NOTE_TEXT.ca)).toEqual(keys(NOTE_TEXT.en));
    expect(keys(NOTE_TEXT.es)).toEqual(keys(NOTE_TEXT.en));
    expect(keys(UI.ca.end)).toEqual(keys(UI.en.end));
    expect(keys(UI.es.sound)).toEqual(keys(UI.en.sound));
  });

  it("quotes Gaudí in his own words in the Catalan print", () => {
    const quote = LINES.find((l) => l.ca)!;
    expect(lineText(quote, "ca")).toBe(quote.ca);
  });
});
