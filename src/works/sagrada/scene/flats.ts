// The pop-up book: where each painted flat of the temple stands, which piece
// of the building it belongs to, and how to paint it.
//
// Flats face the Nativity side (+z, the camera's side) unless they belong to
// the Passion, which faces the other way (−z) for the reverse shots.

import { BUILD } from "../script";
import { Sheet, STONE } from "./paint/kit";
import {
  APSE,
  APSE_ROOF,
  apse,
  apseRoof,
  bellTower,
  bellTowerSize,
  centralTower,
  CRYPT,
  crypt,
  CYPRESS,
  cypress,
  GLORY,
  glory,
  MOSAIC_NATIVITY,
  MOSAIC_PASSION,
  NATIVITY,
  nativityFacade,
  NAVE_LOWER,
  NAVE_UPPER,
  naveLower,
  naveUpper,
  PASSION,
  passionFacade,
  SACRISTY,
  sacristy,
  SCHOOLS,
  schools,
  shaftSize,
  WORKSHOP,
  workshop,
  type BellOpts,
  type Crown,
  type ShaftOpts,
} from "./paint/temple";

export type PieceId =
  | "crypt"
  | "apse"
  | "workshop"
  | "schools"
  | "nativityFacade"
  | "nativity0"
  | "nativity1"
  | "nativity2"
  | "nativity3"
  | "cypress"
  | "passionFacade"
  | "passion0"
  | "passion1"
  | "passion2"
  | "passion3"
  | "nave"
  | "vaults"
  | "apseRoof"
  | "sacristies"
  | "glory"
  | "evangelists"
  | "mary"
  | "jesus";

/** How a flat lights up at night. */
export type Role = "old" | "new" | "glass" | "tower" | "mary" | "jesus" | "timber";

export interface Flat {
  piece: PieceId;
  x: number;
  z: number;
  /** base height */
  y: number;
  w: number;
  h: number;
  /** +1 faces the Nativity side, −1 the Passion side */
  face: 1 | -1;
  role: Role;
  paint: (s: Sheet) => void;
  /** which group builds it (so the painting is spread over idle frames) */
  group: 0 | 1 | 2;
}

export interface PieceDef {
  span: readonly [number, number];
  /** the year it is taken down, if it ever is */
  until?: number;
  /** scaffolded while building? */
  scaffold?: boolean;
}

export const PIECES: Record<PieceId, PieceDef> = {
  crypt: { span: BUILD.crypt },
  apse: { span: BUILD.apse, scaffold: true },
  workshop: { span: BUILD.workshop, until: 1939.5 },
  schools: { span: [1909, 1909.6] },
  nativityFacade: { span: BUILD.nativityFacade, scaffold: true },
  nativity0: { span: BUILD.nativityTowers[0], scaffold: true },
  nativity1: { span: BUILD.nativityTowers[1], scaffold: true },
  nativity2: { span: BUILD.nativityTowers[2], scaffold: true },
  nativity3: { span: BUILD.nativityTowers[3], scaffold: true },
  cypress: { span: BUILD.cypress },
  passionFacade: { span: BUILD.passionFacade, scaffold: true },
  passion0: { span: BUILD.passionTowers[0], scaffold: true },
  passion1: { span: BUILD.passionTowers[1], scaffold: true },
  passion2: { span: BUILD.passionTowers[2], scaffold: true },
  passion3: { span: BUILD.passionTowers[3], scaffold: true },
  nave: { span: BUILD.nave, scaffold: true },
  vaults: { span: BUILD.vaults, scaffold: true },
  apseRoof: { span: BUILD.apseRoof },
  sacristies: { span: BUILD.sacristies, scaffold: true },
  glory: { span: BUILD.glory, scaffold: true },
  evangelists: { span: BUILD.evangelists, scaffold: true },
  mary: { span: BUILD.mary, scaffold: true },
  jesus: { span: BUILD.jesus, scaffold: true },
};

/** The four bell towers of each façade, left to right as seen from the Nativity. */
export const BELL_X = [-2.15, -0.8, 0.8, 2.15];
const BELL_R = [0.4, 0.44, 0.44, 0.4];
const NATIVITY_H = [9.8, 10.7, 10.7, 9.8];
const PASSION_H = [10.7, 11.2, 11.2, 10.7];
const APOSTLES_N = ["SANCTUS", "SANCTUS", "SANCTUS", "SANCTUS"];
const APOSTLES_P = ["HOSANNA", "SANCTUS", "SANCTUS", "HOSANNA"];

function flat(piece: PieceId, x: number, z: number, y: number, size: { w: number; h: number }, role: Role, paint: (s: Sheet) => void, group: 0 | 1 | 2, face: 1 | -1 = 1): Flat {
  return { piece, x, z, y, w: size.w, h: size.h, role, paint, group, face };
}

function bell(i: number, passion: boolean): Flat {
  const o: BellOpts = {
    R: BELL_R[i],
    H: (passion ? PASSION_H : NATIVITY_H)[i],
    stone: passion ? STONE.passion : STONE.nativity,
    seed: (passion ? 50 : 10) + i,
    palette: passion ? MOSAIC_PASSION : MOSAIC_NATIVITY,
    word: (passion ? APOSTLES_P : APOSTLES_N)[i],
    statue: true,
    angular: passion,
  };
  const id = `${passion ? "passion" : "nativity"}${i}` as PieceId;
  // mirrored for the Passion side, so left and right still match the world
  const x = passion ? BELL_X[3 - i] : BELL_X[i];
  return flat(id, x, passion ? -3.3 : 3.62, 0, bellTowerSize(o), passion ? "new" : "old", (s) => bellTower(s, o), passion ? 2 : 0, passion ? -1 : 1);
}

function shaft(piece: PieceId, x: number, z: number, o: ShaftOpts, role: Role): Flat {
  return flat(piece, x, z, 0, shaftSize(o), role, (s) => centralTower(s, o), 1);
}

const evangelist = (x: number, z: number, crown: Crown, seed: number): Flat =>
  shaft("evangelists", x, z, { R: 0.56, H: 13.5, facets: 10, body: 0.86, crown, seed, stone: STONE.modern }, "tower");

export const FLATS: Flat[] = [
  // — the Nativity side (group 0) —
  flat("crypt", 2.0, 2.75, 0, CRYPT, "old", crypt, 0),
  flat("apse", 2.95, 1.6, 0, APSE, "old", apse, 0),
  flat("workshop", 5.1, 3.7, 0, WORKSHOP, "timber", workshop, 0),
  flat("schools", -5.3, 4.7, 0, SCHOOLS, "old", schools, 0),
  flat("nativityFacade", 0, 3.3, 0, NATIVITY, "old", nativityFacade, 0),
  flat("cypress", 0, 3.45, 6.25, CYPRESS, "old", cypress, 0),
  ...[0, 1, 2, 3].map((i) => bell(i, false)),

  // — the central towers (group 1) —
  evangelist(-1.25, 1.25, "ox", 71),
  evangelist(1.25, 1.25, "lion", 72),
  evangelist(-1.25, -1.25, "eagle", 73),
  evangelist(1.25, -1.25, "angel", 74),
  shaft("mary", 1.95, -0.35, { R: 0.72, H: 13.8, facets: 12, body: 0.88, crown: "star", seed: 81, stone: STONE.modern }, "mary"),
  shaft("jesus", 0, 0, { R: 1.08, H: 17.25, facets: 16, body: 0.8, crown: "cross", seed: 91, stone: STONE.modern }, "jesus"),

  // — the rest: nave, roofs, Passion, sacristies, Glory (group 2) —
  flat("nave", -4.2, 2.25, 0, NAVE_LOWER, "glass", naveLower, 2),
  flat("vaults", -4.1, 1.1, 0, NAVE_UPPER, "glass", naveUpper, 2),
  flat("apseRoof", 2.6, 0.6, 0, APSE_ROOF, "new", apseRoof, 2),
  flat("sacristies", 4.5, 4.3, 0, SACRISTY, "new", sacristy, 2),
  flat("sacristies", -4.5, -4.3, 0, SACRISTY, "new", sacristy, 2, -1),
  flat("glory", -7.6, 1.8, 0, GLORY, "new", glory, 2),
  flat("passionFacade", 0, -3.55, 0, PASSION, "new", passionFacade, 2, -1),
  ...[0, 1, 2, 3].map((i) => bell(i, true)),
];

/** Every piece's height range (for the line of the day's work). */
export function pieceExtent(id: PieceId) {
  const fs = FLATS.filter((f) => f.piece === id);
  return {
    base: Math.min(...fs.map((f) => f.y)),
    top: Math.max(...fs.map((f) => f.y + f.h)),
  };
}
