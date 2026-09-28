// Every word spoken on stage lives here — the script of the show.
// Both productions (the 3D stage and the flat fallback) read from this file.

export const PLAYBILL = {
  theatre: "The Zarcero Theatre",
  presents: "presents",
  name: "Nicolás Zarcero",
  shortName: "N. Zarcero",
  in: "in",
  title: "A Portfolio in Five Acts",
  subtitle: "Performed nightly, with one intermission and no refunds.",
  season: "Season MMXXVI",
  location: "Barcelona",
  email: "nzarcerogarcia@gmail.com",
  socials: [
    { label: "GitHub", short: "GH", href: "https://github.com/zarcerog" },
    { label: "LinkedIn", short: "LI", href: "https://www.linkedin.com/in/zarcerog/" },
    { label: "Instagram", short: "IG", href: "https://instagram.com/zarcerog" },
  ],
  archive: { label: "Archive Nº1", href: "/archive/1", year: "2026", honour: "Awwwards Honorable Mention" },
};

export const ACT_CARDS = {
  act1: {
    numeral: "I",
    title: "The Protagonist",
    line: "Wherein a young man, a coastline and a punctual train are introduced",
  },
  act2: {
    numeral: "II",
    title: "The Apprenticeship",
    line: "Wherein the trade is learned, one room at a time",
  },
  act3: {
    numeral: "III",
    title: "The Works",
    line: "Wherein several things are built, and most of them are finished",
  },
  act4: {
    numeral: "IV",
    title: "The Dressing Room",
    line: "Wherein the lead is found between shows, among his records, books and tools",
  },
  act5: {
    numeral: "V",
    title: "The Stage Door",
    line: "Wherein the audience is invited to write",
  },
};

export const NARRATION = [
  "Our story opens on a thin strip of Mediterranean coast, north of Barcelona, where the commuter train runs so near the water that on winter mornings it arrives faintly damp.",
  "Here we find NICOLÁS ZARCERO — engineer, designer, and self-appointed stage manager of a great many side projects.",
  "He taught himself to write software. No one asked him to. That, as it turned out, was precisely the point.",
];

export const PERSONAE = {
  heading: "Dramatis Personæ",
  cast: [
    { role: "Nicolás Zarcero", actor: "Himself" },
    { role: "The Engineer", actor: "also Himself" },
    { role: "The Designer", actor: "also Himself" },
    { role: "The Stage Manager", actor: "Himself, overworked" },
    { role: "A Bluetooth Device", actor: "Itself" },
    { role: "The Coastal Train", actor: "Itself (delayed)" },
  ],
  note: "Full-stack mobile engineer at Evinova. Self-taught, vocationally trained, and partial to software that behaves like a well-made object: quiet, exact, and a little bit delightful.",
};

export interface Room {
  id: string;
  number: string;
  company: string;
  role: string;
  detail: string;
  aside: string;
  prop: "school" | "motors" | "bank" | "clinic";
  wall: string;
  floor: string;
}

export const ROOMS: Room[] = [
  {
    id: "school",
    number: "Room 1",
    company: "The Schoolroom",
    role: "Grado Medio & Grado Superior",
    detail: "Vocational training in systems and software development.",
    aside: "Where he learned the syllabus by day — and, by night, at a desk at home, everything the syllabus had politely left out.",
    prop: "school",
    wall: "#b9d3c6",
    floor: "#8d6b4f",
  },
  {
    id: "volkswagen",
    number: "Room 2",
    company: "Volkswagen",
    role: "HMI & Quality Assurance",
    detail: "Human–machine interfaces for the car, and the rigorous business of breaking them.",
    aside: "Where he learned that every button is a promise, and that someone, somewhere, will press it four hundred times to see what happens.",
    prop: "motors",
    wall: "#f0c9a8",
    floor: "#6f5a4a",
  },
  {
    id: "vass",
    number: "Room 3",
    company: "VASS",
    role: "Banking Infrastructure",
    detail: "The payments plumbing behind Bizum and CaixaBank.",
    aside: "Where he learned that money moves at the speed of trust, and that trust keeps an audit log.",
    prop: "bank",
    wall: "#d9c3e0",
    floor: "#5e4a52",
  },
  {
    id: "evinova",
    number: "Room 4",
    company: "Evinova · AstraZeneca",
    role: "Full-Stack Mobile Engineer, since 2025",
    detail: "A regulated clinical app in React Native, TypeScript and Bluetooth Low Energy — built with a team in Spain, Bulgaria and Sweden.",
    aside: "Where he now writes software that patients rely upon, which is to say software that must not be clever — only correct.",
    prop: "clinic",
    wall: "#f3dfa2",
    floor: "#7a5f3d",
  },
];

export interface Work {
  id: string;
  title: string;
  kind: string;
  year: string;
  description: string;
  aside?: string;
  stack: string[];
  href?: string;
  hrefLabel?: string;
  image?: string;
  imageAlt?: string;
  /** CSS object-position for the screenshot inside its frame. */
  imagePosition?: string;
  /** Shape of the frame: landscape screenshot, phone, or an illustrated plate. */
  frame: "landscape" | "phone" | "plate-campus";
  backdrop: "stripes" | "diamonds" | "sunburst" | "dots" | "checker";
  palette: { bg: string; fg: string; accent: string };
}

export const WORKS: Work[] = [
  {
    id: "studio",
    title: "zarcerog.studio",
    kind: "An Editorial Journal",
    year: "2025 —",
    description:
      "A journal on design culture — music, architecture, type — and the frequencies that shape how we build and feel. Every article is a small, separately built world.",
    stack: ["Astro", "GSAP", "TypeScript", "Tailwind"],
    href: "https://zarcerog.studio",
    hrefLabel: "Visit the journal",
    image: "/theatre/memoir.webp",
    imageAlt: "Studio Memoir — long-form observations on design, architecture and sound",
    imagePosition: "left center",
    frame: "landscape",
    backdrop: "stripes",
    palette: { bg: "#e9b8b3", fg: "#3a1d1b", accent: "#a3232e" },
  },
  {
    id: "odonta",
    title: "Odonta",
    kind: "Clinic Management for Dentists",
    year: "2024 —",
    description:
      "An interactive odontogram, calendars for many doctors, careful patient records, and invoicing precise enough to satisfy the Spanish tax office. In three languages.",
    aside: "Pictured: an early rehearsal, under its former stage name.",
    stack: ["Next.js", "Hono", "Drizzle", "Neon", "Turborepo"],
    image: "/theatre/odonta.webp",
    imageAlt: "The Odonta dashboard, in an early version called DentOS",
    frame: "landscape",
    backdrop: "diamonds",
    palette: { bg: "#a9cfc9", fg: "#1f3b3a", accent: "#2f6a68" },
  },
  {
    id: "campus",
    title: "Campus",
    kind: "A Bouldering Game",
    year: "2026",
    description:
      "A climbing game played with two fingers, as climbing was always meant to be. Chalk is the currency. Gravity is not negotiable.",
    stack: ["Expo", "React Native", "Skia"],
    frame: "plate-campus",
    backdrop: "dots",
    palette: { bg: "#c9c3e3", fg: "#2a2440", accent: "#5b4c9a" },
  },
  {
    id: "memento",
    title: "Memento",
    kind: "Daily Photo Missions",
    year: "2024",
    description:
      "One subject, one day, no algorithm. A new mission every morning — go out and find it — and a feed ordered strictly by when the work was made.",
    stack: ["React Native", "Node.js", "AWS S3", "PostgreSQL"],
    image: "/theatre/memento.webp",
    imageAlt: "Memento — today's missions feed",
    frame: "phone",
    backdrop: "checker",
    palette: { bg: "#bcd7a6", fg: "#26351c", accent: "#b0493a" },
  },
];

export const CONCESSIONS = {
  title: "Intermission",
  sub: "Fifteen minutes. The bar is open; the skills are on the house.",
  menuTitle: "The Concession Stand",
  menuSub: "Tonight's specialities",
  items: [
    { name: "React Native", note: "served daily" },
    { name: "TypeScript", note: "strictly typed" },
    { name: "Bluetooth Low Energy", note: "low energy, high patience" },
    { name: "Next.js · Hono · Node", note: "house blend" },
    { name: "three.js · WebGL", note: "you're looking at it" },
    { name: "Astro · GSAP · Lenis", note: "for the scroll" },
    { name: "Typography & Layout", note: "aligned to the pixel" },
    { name: "KiCad · ESP32 · nRF52", note: "made to order" },
    { name: "Claude Code & MCP", note: "ask the waiter" },
  ],
  footnote: "No outside interfaces permitted in the auditorium.",
};

export interface Rehearsal {
  id: string;
  title: string;
  medium: string;
  line: string;
  tech: string;
  tint: string;
}

// Productions still in rehearsal. Remove any you'd rather keep under the dust sheet.
export const REHEARSALS: Rehearsal[] = [
  {
    id: "form",
    title: "FORM",
    medium: "Hardware",
    line: "A precision stainless-steel breathwork trainer. Three resistances, no screen, no lights — Bluetooth only for the curious.",
    tech: "Zephyr · nRF52840 · KiCad",
    tint: "#dfe7ea",
  },
  {
    id: "the-game",
    title: "The Game",
    medium: "Hardware",
    line: "A handheld virtual pet with an e-paper face. Creatures evolve; their owners meet by NFC.",
    tech: "ESP32-C3 · e-paper · NFC",
    tint: "#f3dfe0",
  },
  {
    id: "wolfman",
    title: "The Wolfman",
    medium: "Animation",
    line: "An animated noir in six episodes. Louisiana, 1974. Two are written; the soundtrack already exists.",
    tech: "Script · Storyboard",
    tint: "#efe4c6",
  },
  {
    id: "coeficiente",
    title: "Coeficiente",
    medium: "Fiction",
    line: "A dystopian novel, told not in pages but in scroll.",
    tech: "MDX · Scrollytelling",
    tint: "#dde8d6",
  },
];

// Act IV: backstage, in the lead's dressing room — after zarcerog.com, Vol. 1.
export const DRESSING_ROOM = {
  manifesto: ["Make it feel.", "Make it mean something.", "Keep it raw."],
  honour: { title: "Honorable Mention", from: "Awwwards", for: "zarcerog.com", date: "March 2026" },
  cards: [
    {
      id: "code",
      kicker: "The Code",
      title: "What I build",
      tint: "#dfe7ea",
      rows: [
        ["Langs", "TypeScript · Swift · Kotlin"],
        ["Front", "React · Next.js · React Native"],
        ["Back", "Node.js · Express · tRPC"],
        ["Data", "MongoDB · PostgreSQL · Redis"],
        ["Tools", "Figma · GSAP · Three.js"],
        ["Deploy", "Vercel · AWS · Docker"],
      ],
    },
    {
      id: "culture",
      kicker: "The Culture",
      title: "What moves me",
      tint: "#f3dfe0",
      rows: [
        ["Sound", "Miles Davis · Coltrane · Sade"],
        ["Instrument", "Guitar, drums"],
        ["Read", "Baldwin · Murakami · Camus"],
        ["Wear", "Vintage"],
        ["City", "Barcelona → ??"],
        ["Now", "Building in public. Slowly."],
      ],
    },
    {
      id: "now",
      kicker: "Right now",
      title: "On the dressing table",
      tint: "#efe4c6",
      rows: [
        ["Listening", "Kind of Blue — on repeat since 1959"],
        ["Reading", "Giovanni's Room — third time through"],
        ["Building", "Ara — coming soon(ish)"],
        ["Wearing", "Levi's 501, 1988 — the real ones"],
        ["Working", "Evinova — healthcare tech, hybrid"],
      ],
    },
  ] as { id: string; kicker: string; title: string; tint: string; rows: [string, string][] }[],
};

export const CREDITS: { role: string; names: string[] }[] = [
  { role: "Written & Directed by", names: ["Nicolás Zarcero"] },
  { role: "Designed by", names: ["Nicolás Zarcero"] },
  { role: "Engineered by", names: ["Nicolás Zarcero"] },
  { role: "Set Construction", names: ["React Three Fiber", "three.js", "a great deal of patience"] },
  { role: "Lighting Design", names: ["WebGL, by candlelight"] },
  { role: "Velvet", names: ["a matcap, painted by hand"] },
  { role: "Properties", names: ["One director's chair", "Four rooms of card", "A record player, one record", "Seven roses"] },
  { role: "Fly System & Rigging", names: ["requestAnimationFrame", "Lenis"] },
  { role: "Typefaces", names: ["Jost", "Bodoni Moda", "Courier Prime"] },
  { role: "The Coastal Train", names: ["as Itself"] },
  { role: "Filmed on Location", names: ["Barcelona, Spain"] },
  { role: "Previous Productions", names: ["zarcerog.com, Archive Nº1 (2026)", "Awwwards Honorable Mention"] },
];

export const CREDITS_DISCLAIMER =
  "No velvet was harmed in the making of this website. Any resemblance to other portfolios, living or deprecated, is purely coincidental.";

export type Speaker = "narrator" | "nico";

export const SPEAKERS: Record<Speaker, string> = {
  narrator: "The Narrator",
  nico: "Nicolás, from the wings",
};

/** The spoken script of the 3D production, in running order. */
export const SCRIPT: Record<string, { who: Speaker; text: string }> = {
  prologue: {
    who: "narrator",
    text: "Good evening. Kindly silence your telephones. Tonight's performance concerns a young man, a coastline, and a great many side projects.",
  },
  coast1: {
    who: "narrator",
    text: "Our story opens on a thin strip of Mediterranean coast, north of Barcelona, where the commuter train runs so near the water that on winter mornings it arrives faintly damp.",
  },
  coast2: { who: "nico", text: "It's usually on time. Usually." },
  coast3: {
    who: "narrator",
    text: "Here we find Nicolás Zarcero — engineer, designer, and self-appointed stage manager of a great many side projects.",
  },
  coast4: { who: "narrator", text: "He taught himself to write software. No one asked him to." },
  coast5: { who: "nico", text: "That was more or less the point." },
  personae: { who: "nico", text: "That's my chair. I'll mostly be back here." },
  room0: { who: "nico", text: "I read the manual. Then everything the manual left out." },
  room0b: {
    who: "narrator",
    text: "By day, the syllabus. By night, at a small desk at home, a great many projects that nobody had assigned.",
  },
  room1: { who: "narrator", text: "Then, the motor trade: screens for the dashboard, and the business of breaking them before a driver could." },
  room1b: { who: "nico", text: "Four hundred presses. It held." },
  room2: { who: "narrator", text: "Then a bank. Or rather, the pipes beneath several." },
  room2b: { who: "nico", text: "Every cent accounted for. Twice." },
  room3: { who: "narrator", text: "And now, medicine: one clinical app, one team, three countries and two time zones." },
  room3b: { who: "nico", text: "Not clever. Correct." },
  work0: { who: "nico", text: "Each article is its own small building." },
  work1: { who: "nico", text: "The tax office has not complained. Yet." },
  work2: { who: "nico", text: "Two fingers. No excuses." },
  work3: { who: "nico", text: "One photograph a day. No algorithm." },
  interval: { who: "narrator", text: "Fifteen minutes. The bar is open; the skills are on the house." },
  ghost: {
    who: "narrator",
    text: "Backstage, between shows. A dressing room tells you more about its occupant than any play he appears in.",
  },
  ghost2: { who: "nico", text: "Make it feel. Make it mean something. Keep it raw." },
  door: { who: "narrator", text: "And now, the part where you come in." },
  door2: { who: "nico", text: "Write to me. I answer every telegram." },
  bow: { who: "narrator", text: "Ladies and gentlemen — the author. Who is, as ever, in the wings." },
};

export const INTRO = {
  loading: "The house is filling up",
  loaded: "Kindly take your seat",
  hint: "Scroll to raise the curtain",
  sound: "Best enjoyed with the sound on",
};
