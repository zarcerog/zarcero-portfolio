// The director's notes: red marker scrawled over the film, pinned to things
// in the world (a gull, a tower, a hill) and drawn in as you scroll.
// Kept free of three.js: the scene projects the anchors, the DOM draws.

export type Anchor = readonly [number, number, number] | "gull";

export interface Mark {
  id: string;
  /** draw in over [a, b], hold, fade over [c, d] (beats) */
  at: readonly [number, number, number, number];
  anchor: Anchor;
}

const m = (id: string, a: number, len: number, anchor: Anchor): Mark => ({ id, at: [a, a + 0.3, a + len - 0.15, a + len], anchor });

export const MARKS: Mark[] = [
  m("gulls", 3.6, 1.0, "gull"),
  m("cerda", 7.5, 0.95, [0, 0, 0]),
  m("plot", 11.75, 0.95, [0, 0, 0]),
  m("villar", 16.95, 0.85, [-2, 6.5, 0]),
  m("flip", 22.1, 0.95, [0, 12.5, 0]),
  m("barnabas", 29.1, 0.6, [-0.8, 10.4, 3.6]),
  m("glue", 38.2, 1.0, [0, 9, 0]),
  m("pause", 45.75, 0.9, [-3.2, 22, -0.3]),
  m("tower", 49.3, 0.65, [0, 17.25, 0]),
  m("montjuic", 49.4, 0.55, [-40, 34, -400]),
  m("lighthouse", 53.2, 0.9, [0, 16.55, 0]),
  m("visca", 55.4, 1.4, [9, 21, 0]),
];

/** The DOM registers each mark's element here; the scene positions them. */
export const markEls = new Map<string, HTMLElement>();
