// THE CLIENT IS NOT IN A HURRY — the shooting script.
//
// Everything in the picture is a pure function of one number, `t`: the
// scroll position in beats (one beat ≈ 0.8 of a viewport height, see the
// theatre engine). From `t` we derive the calendar year, the light, the
// camera and every line of dialogue — so the film plays identically
// forwards and backwards.

export type Env = readonly [number, number, number, number];

export const BEATS = 64;

// ---------------------------------------------------------------------------
// Chapters (Tarantino title cards). Each card is a hard black cut: the camera
// is allowed to jump while one is up.
// ---------------------------------------------------------------------------

/** Each chapter's card borrows the manner of a different kind of title. */
export type CardStyle = "gilt" | "pulp" | "mosaic" | "stark" | "scrawl" | "western" | "fable";

export interface Chapter {
  style: CardStyle;
  id: string;
  numeral: string;
  word: string;
  title: string;
  years: string;
  /** when the card is up (in, hold, out) */
  card: Env;
}

const card = (a: number): Env => [a, a + 0.18, a + 0.72, a + 0.9];

export const CHAPTERS: Chapter[] = [
  { style: "gilt", id: "one", numeral: "I", word: "Chapter One", title: "The Bookseller", years: "1866 — 1881", card: card(8.5) },
  { style: "pulp", id: "two", numeral: "II", word: "Chapter Two", title: "The First Stone", years: "1882 — 1883", card: card(13.7) },
  { style: "mosaic", id: "three", numeral: "III", word: "Chapter Three", title: "The Young Man from Reus", years: "1883 — 1926", card: card(19.0) },
  { style: "stark", id: "four", numeral: "IV", word: "Chapter Four", title: "The Tram", years: "June 1926", card: card(29.7) },
  { style: "scrawl", id: "five", numeral: "V", word: "Chapter Five", title: "Pieces", years: "1936 — 1976", card: card(35.0) },
  { style: "western", id: "six", numeral: "VI", word: "Chapter Six", title: "The Machines", years: "1976 — 2026", card: card(41.5) },
  { style: "fable", id: "seven", numeral: "VII", word: "Chapter Seven", title: "The Tenth of June", years: "2026", card: card(50.0) },
];

export const TITLE: Env = [-1, -0.5, 0.75, 1.25];
export const FIN: Env = [60.9, 61.4, 99, 100];

/** Where the programme (the reel at the bottom) jumps to for each chapter. */
export const REEL = [
  { label: "Prologue", at: 1.6 },
  ...CHAPTERS.map((c) => ({ label: c.numeral, at: c.card[3] + 0.15 })),
  { label: "Fin", at: FIN[1] + 0.3 },
];

// ---------------------------------------------------------------------------
// The subtitles. Yellow, as they should be.
// `ca` is the original line, for the one thing everybody quotes.
// ---------------------------------------------------------------------------

export interface Line {
  at: number;
  len: number;
  text: string;
  ca?: string;
}

const L = (at: number, text: string, len = 1.0, ca?: string): Line => ({ at, len, text, ca });

export const LINES: Line[] = [
  // — prologue: the sky, the gulls, the fields —
  L(1.4, "This is the sky above Barcelona, some time around 1881."),
  L(2.45, "It has not changed very much since. Nearly everything beneath it has."),
  L(3.5, "These are two gulls. They are not important to the story, but they were there, and it seemed rude to leave them out.", 1.05),
  L(5.2, "Below them lies the Poblet, a hamlet of Sant Martí de Provençals, just beyond the city limits."),
  L(6.25, "Market gardens, vineyards, a few farmhouses, and a tile works, smoking quietly to itself."),
  L(7.3, "Mr Cerdà had already drawn the streets of the new city across these fields. The streets simply had not arrived yet.", 1.1),

  // — I. The Bookseller —
  L(9.5, "Josep Maria Bocabella was a bookseller, a publisher of devotional magazines, and a man with a rather large idea."),
  L(10.55, "He had founded a society of devotees of Saint Joseph, and resolved to build them a temple paid for by donations and nothing else."),
  L(11.6, "In 1881 the society bought this field: one entire block of the future city, for 172,000 pesetas."),
  L(12.65, "It was, at the time, a considerable distance from anything at all.", 0.95),

  // — II. The First Stone —
  L(14.7, "The 19th of March, 1882. The feast of Saint Joseph. The first stone is laid, with appropriate ceremony."),
  L(15.75, "The architect, Francisco de Paula del Villar, proposed something sensible, symmetrical and neo-Gothic."),
  L(16.8, "He and the committee then disagreed about the cost of the stone. Within a year, he had resigned."),
  L(17.85, "A replacement was found. He was thirty-one years old, and he had opinions.", 1.05),

  // — III. The Young Man from Reus —
  L(20.0, "Antoni Gaudí finished the crypt more or less as planned. Everything after that, he took personally."),
  L(21.05, "He designed with string and little bags of weights, hung upside down, and let gravity do the arithmetic."),
  L(22.1, "Turned the right way up, the curves stood on their own."),
  L(23.15, "Asked when it would all be finished, he is said to have replied:"),
  L(24.2, "My client is not in a hurry.", 1.0, "El meu client no té pressa."),
  L(25.25, "The client, it was generally understood, was God."),
  L(26.3, "Meanwhile, the city finally arrived. In 1897, Sant Martí — Poblet and all — became Barcelona."),
  L(27.35, "The Nativity façade rose, carved so densely it could be read like a book by people who could not read."),
  L(28.4, "In 1925 the bell tower of Saint Barnabas was completed. It was the only one Gaudí would ever see.", 1.2),

  // — IV. The Tram —
  L(30.7, "On the 7th of June 1926, an elderly man was struck by a tram on the Gran Via."),
  L(31.75, "He carried no papers and was plainly dressed. He was taken for a beggar."),
  L(32.8, "He was the architect. He died three days later, aged seventy-three, and was buried in the crypt."),
  L(33.85, "The building carried on without him. It had, after all, been told there was no hurry.", 1.05),

  // — V. Pieces —
  L(36.0, "In July 1936, in the first days of the Civil War, the crypt was set alight and the workshop ransacked."),
  L(37.05, "Plans and photographs burned. The plaster models were smashed to pieces."),
  L(38.1, "Afterwards, people spent decades fitting the pieces back together, which is its own kind of devotion."),
  L(39.15, "In 1954 work began on the Passion façade: gaunt, angular and deliberately uncomfortable, as Gaudí intended.", 1.1),
  L(40.3, "Its four towers were finished in 1976. By then, nobody was surprised by the pace.", 1.1),

  // — VI. The Machines —
  L(42.5, "Then came the computers, which could finally do the sums Gaudí had done with string."),
  L(43.55, "Software written for aircraft turned out to be very good at cathedrals."),
  L(44.6, "In 2010 the nave was finished, and Pope Benedict XVI consecrated it a basilica."),
  L(45.65, "In 2020 a pandemic stopped the cranes. It was the first pause since the war."),
  L(46.7, "In 2021 a star was lit on the tower of the Virgin Mary. In 2023, the four Evangelists caught up."),
  L(47.75, "On the 20th of February 2026, the tower of Jesus Christ reached its full height: 172.5 metres."),
  L(48.8, "The tallest church in the world — and still, by design, lower than the hill of Montjuïc. The work of man, Gaudí felt, should not outrank the work of God.", 1.15),

  // — VII. The Tenth of June —
  L(51.0, "The 10th of June 2026. One hundred years, to the day, since Gaudí died."),
  L(52.05, "Pope Leo XIV came to bless the finished tower. Some 120,000 people came to watch him do it."),
  L(53.1, "He called its cross a lighthouse, open to the Mediterranean."),
  L(54.15, "And then, as is customary in Barcelona whenever anything at all is finished —", 1.1),
  L(58.2, "Strictly speaking, it is not finished. The Glory façade is still to come."),
  L(59.3, "The client remains unhurried.", 1.25),
];

export function lineEnv(l: Line): Env {
  return [l.at, l.at + 0.1, l.at + l.len - 0.1, l.at + l.len];
}

// ---------------------------------------------------------------------------
// The calendar: which year it is at each beat.
// ---------------------------------------------------------------------------

const YEARS: [number, number][] = [
  [0, 1881.3],
  [9.4, 1881.35],
  [13.6, 1881.9],
  [14.6, 1882.21], // 19 March 1882
  [16.8, 1882.6],
  [18.9, 1883.7],
  [19.9, 1883.9],
  [21.0, 1885],
  [23.1, 1889],
  [26.3, 1896],
  [27.3, 1906],
  [28.4, 1918],
  [29.2, 1925.4],
  [29.6, 1926.0],
  [30.6, 1926.43], // 7 June 1926
  [34.9, 1926.46],
  [35.9, 1936.54], // July 1936
  [37.4, 1936.7],
  [38.1, 1939],
  [39.1, 1953.5],
  [40.3, 1966],
  [41.4, 1976.9],
  [42.4, 1977],
  [43.5, 1990],
  [44.6, 2004],
  [45.6, 2010.85],
  [46.65, 2020.3],
  [47.7, 2023.9],
  [48.75, 2026.14], // 20 February 2026
  [50.0, 2026.2],
  [50.9, 2026.44], // 10 June 2026
  [BEATS + 5, 2026.44],
];

export function yearAt(t: number) {
  if (t <= YEARS[0][0]) return YEARS[0][1];
  for (let i = 0; i < YEARS.length - 1; i++) {
    const [a, ya] = YEARS[i];
    const [b, yb] = YEARS[i + 1];
    if (t <= b) return ya + ((yb - ya) * (t - a)) / (b - a);
  }
  return YEARS[YEARS.length - 1][1];
}

/** Until 1897 the Poblet belonged to Sant Martí de Provençals. */
export function placeAt(year: number) {
  return year < 1897 ? "Sant Martí de Provençals" : "Barcelona";
}

// ---------------------------------------------------------------------------
// Set pieces that play on beats rather than years.
// ---------------------------------------------------------------------------

export const CUE = {
  gulls: [1.9, 5.6] as const,
  tilt: [4.3, 6.6] as const,
  stakes: [10.9, 12.2] as const,
  ceremony: [14.4, 16.0] as const,
  villar: { rise: [15.7, 16.6] as const, tear: [16.9, 17.8] as const },
  catenary: { in: [20.9, 21.7] as const, flip: [22.05, 22.9] as const, out: [23.4, 24.4] as const },
  tram: [30.4, 34.6] as const,
  fire: [35.8, 37.6] as const,
  shatter: { burst: [36.9, 37.35] as const, mend: [38.0, 39.6] as const },
  wire: [42.3, 44.8] as const,
  dusk: [50.9, 52.2] as const,
  cross: [53.0, 53.8] as const,
  fireworks: [54.9, 64] as const,
  drones: { up: [55.2, 56.0] as const, a: [56.0, 57.3] as const, b: [57.5, 58.3] as const, out: [59.6, 60.8] as const },
};

// ---------------------------------------------------------------------------
// Construction, in calendar years.
// [start, finish] — a piece rises from its footing between the two.
// ---------------------------------------------------------------------------

export const BUILD = {
  crypt: [1882.3, 1889] as const,
  apse: [1889, 1894] as const,
  workshop: [1886, 1887] as const,
  nativityFacade: [1892, 1917] as const,
  /** Saint Barnabas first (1925); Sugrañes finishes the other three by 1930 */
  nativityTowers: [
    [1906, 1927.5],
    [1903, 1925.0],
    [1908, 1929],
    [1910, 1930],
  ] as const,
  cypress: [1923, 1930] as const,
  passionFacade: [1954, 1972] as const,
  passionTowers: [
    [1958, 1975.5],
    [1956, 1974.5],
    [1957, 1976.2],
    [1959, 1976.8],
  ] as const,
  nave: [1978, 2000] as const,
  vaults: [1996, 2010.5] as const,
  apseRoof: [2006, 2017] as const,
  sacristies: [2014, 2019] as const,
  /** the Glory façade: begun, nowhere near finished */
  glory: [2002, 2026.5] as const,
  gloryCap: 0.3,
  evangelists: [2014, 2023.8] as const,
  mary: [2015, 2021.9] as const,
  jesus: [2016, 2026.14] as const,
  derricks: [1889, 1926.3] as const,
  cranes: [1984, 2026.3] as const,
  pandemic: [2020.2, 2020.55] as const,
  tibidabo: [1902, 1961] as const,
};

// ---------------------------------------------------------------------------
// The light: sky, sun, haze and grade, keyed on beats.
// ---------------------------------------------------------------------------

export interface LightKey {
  at: number;
  zenith: string;
  horizon: string;
  /** sun direction: elevation & azimuth in degrees (0° az = towards +z, 90° = +x) */
  elev: number;
  azim: number;
  sun: string;
  sunI: number;
  sky: string;
  ground: string;
  hemiI: number;
  fog: string;
  fogD: number;
  /** 0 day … 1 full night (street lamps, windows, stars) */
  night: number;
  /** film grade: sepia amount */
  sepia: number;
  exposure: number;
}

const K = (at: number, k: Omit<LightKey, "at">): LightKey => ({ at, ...k });

const MORNING: Omit<LightKey, "at"> = {
  zenith: "#5f9fd6",
  horizon: "#f1dcbc",
  elev: 34,
  azim: -58,
  sun: "#fff0d2",
  sunI: 2.6,
  sky: "#cfe2f2",
  ground: "#8a7152",
  hemiI: 1.25,
  fog: "#e6dccd",
  fogD: 0.0011,
  night: 0,
  sepia: 0.22,
  exposure: 1.02,
};

const AFTERNOON: Omit<LightKey, "at"> = {
  ...MORNING,
  zenith: "#6aa2d0",
  horizon: "#f7d9b0",
  elev: 30,
  azim: -40,
  sun: "#ffe6bf",
  sunI: 2.5,
  sepia: 0.2,
};

const DUSK: Omit<LightKey, "at"> = {
  zenith: "#3c4f86",
  horizon: "#f2a36c",
  elev: 9,
  azim: -38,
  sun: "#ffa866",
  sunI: 2.0,
  sky: "#a39cc4",
  ground: "#4a3a30",
  hemiI: 1.15,
  fog: "#b98d78",
  fogD: 0.003,
  night: 0.55,
  sepia: 0.22,
  exposure: 1.05,
};

const NIGHT: Omit<LightKey, "at"> = {
  zenith: "#050a1e",
  horizon: "#1d2748",
  elev: 28,
  azim: 140,
  sun: "#8fa6e0",
  sunI: 0.6,
  sky: "#44529a",
  ground: "#1a1418",
  hemiI: 0.7,
  fog: "#141a33",
  fogD: 0.0032,
  night: 1,
  sepia: 0,
  exposure: 1.1,
};

const FIRE_NIGHT: Omit<LightKey, "at"> = {
  ...NIGHT,
  zenith: "#0b0710",
  horizon: "#4a1c14",
  fog: "#2a1410",
  sky: "#3a2a3a",
  sepia: 0.18,
};

const POSTWAR: Omit<LightKey, "at"> = {
  ...MORNING,
  zenith: "#7aa0bf",
  horizon: "#eadcc4",
  sepia: 0.14,
  azim: -30,
  elev: 38,
};

const MODERN: Omit<LightKey, "at"> = {
  ...MORNING,
  zenith: "#3f8fe0",
  horizon: "#dfeaf2",
  elev: 42,
  azim: -48,
  sun: "#fff6e6",
  sunI: 2.8,
  sky: "#cfe4f6",
  fog: "#d7e2ea",
  fogD: 0.0012,
  sepia: 0,
  exposure: 1.0,
};

export const LIGHT: LightKey[] = [
  K(0, { ...MORNING, sunI: 2.4 }),
  K(8.4, MORNING),
  K(19.8, MORNING),
  K(28.0, AFTERNOON),
  K(29.6, { ...AFTERNOON, elev: 20, horizon: "#f5c795" }),
  // IV — a June dusk
  K(29.95, DUSK),
  K(34.9, { ...DUSK, elev: 2, night: 0.75, zenith: "#27325e" }),
  // V — a July night, burning
  K(35.3, FIRE_NIGHT),
  K(37.6, FIRE_NIGHT),
  K(38.4, POSTWAR),
  K(41.4, { ...POSTWAR, sepia: 0.1 }),
  // VI — clear modern days
  K(41.9, MODERN),
  K(45.6, MODERN),
  K(46.0, { ...MODERN, zenith: "#7d8ea0", horizon: "#cfd3d6", sun: "#f2f2f2", sunI: 1.7, fog: "#c7ccd0" }),
  K(46.5, MODERN),
  K(49.9, { ...MODERN, elev: 22, horizon: "#f3d3a8", sun: "#ffdcae" }),
  // VII — dusk, then the night of the tenth of June
  K(50.4, DUSK),
  K(52.3, { ...NIGHT, night: 0.9, horizon: "#2b2f55" }),
  K(54.0, NIGHT),
  K(BEATS + 4, NIGHT),
];

/** Just the film grade, for the DOM (kept free of three.js). */
export function sepiaAt(t: number) {
  let i = 0;
  while (i < LIGHT.length - 2 && t > LIGHT[i + 1].at) i++;
  const a = LIGHT[i];
  const b = LIGHT[i + 1];
  const p = Math.min(1, Math.max(0, (t - a.at) / (b.at - a.at)));
  const s = p * p * (3 - 2 * p);
  return a.sepia + (b.sepia - a.sepia) * s;
}

// ---------------------------------------------------------------------------
// The camera: shots separated by hard cuts (the chapter cards hide them).
// ---------------------------------------------------------------------------

export type V3 = [number, number, number];
export interface CamKey {
  at: number;
  pos: V3;
  look: V3;
  fov?: number;
}
export interface Shot {
  keys: CamKey[];
}

const k = (at: number, pos: V3, look: V3, fov?: number): CamKey => ({ at, pos, look, fov });

export const SHOTS: Shot[] = [
  // Prologue: looking straight up, gulls; then the crane down to the fields.
  {
    keys: [
      k(0, [0, 4, 58], [0, 80, 49], 56),
      k(4.3, [0, 5, 60], [0, 80, 50], 54),
      k(6.6, [0, 26, 78], [0, 4, -30], 40),
      k(8.7, [0, 22, 66], [0, 3, -20], 40),
    ],
  },
  // I: down to the plot, as the surveyors stake it
  {
    keys: [
      k(8.8, [0, 10, 28], [0, 1.0, 1], 38),
      // down to Bocabella in his field, while he is introduced
      k(9.9, [1.5, 1.3, 7.9], [0.55, 0.62, 3.2], 32),
      k(10.9, [1.1, 1.55, 8.6], [0.55, 0.68, 3.2], 32),
      k(11.6, [0, 8, 22], [0, 0.8, 1], 38),
      k(13.95, [0, 6.5, 18.5], [0, 0.8, 1], 38),
    ],
  },
  // II: the stone, the Gothic ghost, its tearing up
  {
    keys: [
      k(14.0, [0, 1.3, 8.6], [0, 0.75, 2.2], 36),
      k(15.4, [0, 1.8, 10.2], [0, 1.0, 2.0], 36),
      k(16.6, [-1.5, 7, 29], [-1.5, 6.2, 0], 40),
      k(19.25, [-1.5, 6.8, 27], [-1.5, 5.6, 0], 40),
    ],
  },
  // III: the catenary vision, the rising façade, the city seen from above
  {
    keys: [
      k(19.3, [0, 5, 30], [0, 3.5, 0], 40),
      k(20.9, [0, 8.2, 33], [0, 8.6, 0], 48),
      k(23.1, [0, 8.4, 34], [0, 8.8, 0], 48),
      k(24.4, [0, 5.5, 24], [0, 4.2, 0], 40),
      k(25.4, [0, 34, 36], [0, 0, 2], 42),
      k(26.1, [0.01, 92, 4], [0, 0, 0], 44),
      k(27.3, [0.01, 96, 4], [0, 0, 0], 44),
      k(28.1, [0, 8, 30], [0, 6.2, 0], 40),
      k(29.95, [0, 7.5, 26], [0, 6.6, 0], 40),
    ],
  },
  // IV: at street level, at dusk, a tram crosses the frame
  {
    keys: [
      k(30.0, [-4, 0.45, 9.7], [-2.5, 5, 0], 50),
      k(32.4, [0, 0.45, 9.5], [0, 5.6, 0], 50),
      k(35.25, [4, 0.45, 9.7], [2.5, 5, 0], 50),
    ],
  },
  // V: fire at night; the plaster ghost bursts and mends; a hard cut round
  // to the Passion side
  {
    keys: [
      k(35.3, [7, 3.2, 17], [2.5, 2.8, 0], 40),
      k(36.6, [3, 6, 28], [0, 7, 0], 42),
      k(37.6, [0, 9, 40], [0, 8, 0], 44),
      k(39.05, [0, 9, 42], [0, 8.5, 0], 44),
    ],
  },
  {
    keys: [
      k(39.1, [3, 6.5, -27], [0, 6, 0], 42),
      k(40.3, [0, 7.5, -31], [0, 6.5, 0], 42),
      k(41.75, [-2, 8, -34], [0, 7, 0], 42),
    ],
  },
  // VI: cranes, computers, towers; up to the cross, and out to Montjuïc
  {
    keys: [
      k(41.8, [-18, 12, 40], [0, 8, 0], 44),
      k(43.4, [-8, 11, 44], [0, 9, 0], 44),
      k(44.8, [0, 10, 44], [0, 9, 0], 42),
      k(46.3, [0, 11, 46], [0, 9.5, 0], 42),
      k(47.7, [0, 12, 40], [0, 11, 0], 42),
      k(48.3, [0, 15.5, 22], [0, 15.2, 0], 40),
      k(48.95, [0, 17.0, 13], [0, 16.5, 0], 38),
      k(49.9, [0, 12.5, 44], [0, 14.5, -60], 40),
      k(50.3, [0, 12.5, 44], [0, 14.5, -60], 40),
    ],
  },
  // VII: night, the crowd, the cross; fireworks; back up into the sky
  {
    keys: [
      k(50.35, [0, 6, 46], [0, 8, 0], 42),
      k(52.5, [0, 5, 40], [0, 9, 0], 42),
      k(53.9, [0, 12, 23], [0, 15.4, 0], 40),
      k(55.0, [0, 4, 50], [0, 13, 0], 50),
      k(58.3, [0, 4, 54], [0, 15, 0], 50),
      k(60.4, [0, 5, 58], [0, 32, -10], 52),
      k(BEATS + 4, [0, 5, 58], [0, 40, -10], 52),
    ],
  },
];
