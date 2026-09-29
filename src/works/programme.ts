// The Picture House's programme: every work, dated like a reel in a can.
// Newest first. The box office and the letterboard at /works both read it.

export interface Work {
  /** ISO date, also the route: /works/<date> */
  date: string;
  href: string;
  title: string;
  /** the line under the title on the programme */
  logline: string;
  kind: string;
  /** small print, in pairs */
  facts: [string, string][];
}

export const PROGRAMME: Work[] = [
  {
    date: "2026-09-29",
    href: "/works/2026-09-29",
    title: "The Client Is Not in a Hurry",
    logline:
      "The Sagrada Família, from a field outside Barcelona in 1881 to the fireworks of June 2026. A picture in seven chapters, painted in your browser, with yellow subtitles.",
    kind: "A picture in seven chapters",
    facts: [
      ["Running time", "144 years, abridged to one long scroll"],
      ["Rated", "G, for Gaudí"],
      ["Sound", "Yes. Well, a whistlie"],
      ["Photography", "None. Every frame is painted"],
    ],
  },
];

/** "29 · IX · 2026", the way the letterboard spells it. */
export function roman(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const R = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return `${d} · ${R[m - 1]} · ${y}`;
}
