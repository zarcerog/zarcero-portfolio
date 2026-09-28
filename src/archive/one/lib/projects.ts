export interface Project {
  slug: string;
  number: string;
  title: string;
  subtitle: string;
  year: string;
  description: string;
  story: string[];
  role: string;
  stack: string[];
  bg: string;
  bgImage?: string;
  bgGif?: string;
  gifPortrait?: boolean;
  accentColor: string;
  textAccent: string;
  externalUrl?: string;
}

export const PROJECTS: Project[] = [
  {
    slug: "studio-memoir",
    number: "01 / 04",
    title: "MEMOIR",
    subtitle: "A journal on design culture",
    year: "2025",
    role: "Design · Editorial",
    description:
      "A personal journal exploring the intersections of music, architecture, and design — the frequencies that shape how we build and feel.",
    story: [
      "Design doesn't exist in a vacuum. It's shaped by the jazz records you listen to at 2 AM, the brutalist building you walk past every morning, the typography on a concert poster from 1967. Studio Memoir is where all of that lives.",
      "It's a personal journal — part retrospective, part manifesto — about the culture underneath the craft. Music, architecture, design, and the invisible threads between them. Why Coltrane's phrasing mirrors good UI rhythm. How brutalism's honesty translates to interface design. What Ray Gun understood about typography that the rest of the industry still hasn't caught up to.",
      "Built with Astro for content-first speed, layered with heavy GSAP animations that give every page transition and scroll moment real physical weight. The writing is slow, intentional, deeply personal — the kind that only happens when you stop optimizing and start observing.",
    ],
    stack: ["Astro", "GSAP", "TypeScript", "Tailwind"],
    bg: "linear-gradient(160deg, #0A0A14 0%, #12101E 40%, #060606 100%)",
    bgImage: "/studio-memoir.png",
    bgGif: "/studio-memoir.gif",
    accentColor: "#8B5CF6",
    textAccent: "#A78BFA",
    externalUrl: "https://zarcerog.studio",
  },
  {
    slug: "dentos",
    number: "02 / 04",
    title: "DENTOS",
    subtitle: "Dental ERP system",
    year: "2024",
    role: "Full-stack · Product Design",
    description:
      "Modular practice management suite: digital odontogram, patient records, scheduling, billing, and staff time tracking — all in one unified interface.",
    story: [
      "Dental practices run on chaos. Scattered spreadsheets, paper charts, missed appointments, billing errors — the admin overhead was slowly killing small practices.",
      "DentOS was built to collapse that complexity into a single, considered interface. The interactive digital odontogram replaced paper tooth charts entirely. Patient records became searchable, persistent, and linked to every appointment and invoice.",
      "Scheduling accounts for chair availability, staff rotation, and equipment simultaneously. Billing integrates directly with treatment records — no double-entry. The result: practices that used to spend three hours on admin now spend under forty-five minutes.",
    ],
    stack: ["React", "Next.js", "MongoDB", "Node.js", "TypeScript"],
    bg: "linear-gradient(160deg, #061410 0%, #0A1E1A 40%, #060606 100%)",
    bgImage: "/dentos.png",
    bgGif: "/dentos.gif",
    accentColor: "#00C897",
    textAccent: "#00C897",
  },
  {
    slug: "memento",
    number: "03 / 04",
    title: "MEMENTO",
    subtitle: "Daily photo missions",
    year: "2024",
    role: "Mobile · Product Design",
    description:
      "An app where users complete daily missions by sharing photos or videos. Document the ordinary. Make it extraordinary.",
    story: [
      "The best photography isn't planned — it's responded to. Most photo apps give you infinite canvas and zero direction. Memento gives you the opposite: a constraint, a subject, a 24-hour window.",
      "Every morning, a new mission. Go find it. Shoot it. Share it with a community of people trying to see the same thing differently. The limitation is the point — it forces you to look harder at what's already in front of you.",
      "Built in React Native with a backend designed for high-volume media handling. The feed is curated chronologically, not algorithmically. No engagement optimization. Just work, ordered by when it was made.",
    ],
    stack: ["React Native", "Node.js", "AWS S3", "PostgreSQL"],
    bg: "linear-gradient(160deg, #180E06 0%, #211508 40%, #0A0600 100%)",
    bgImage: "/memento.png",
    bgGif: "/memento.gif",
    gifPortrait: true,
    accentColor: "#FF8C42",
    textAccent: "#FF8C42",
  },
  {
    slug: "zarcerog",
    number: "04 / 04",
    title: "ZARCEROG",
    subtitle: "This portfolio",
    year: "2025",
    role: "Design · Engineering",
    description:
      "The site you're looking at right now. Built to feel like something. Built to mean something. Kept raw.",
    story: [
      "The cobbler's shoes. Every developer's portfolio is a statement about what they value — and most of them say nothing, because they play it safe.",
      "The design language comes from Ray Gun magazine, underground zines, and street culture editorial: oversized type that bleeds off the edge, halftone grain across the surface, text that collides with imagery instead of sitting politely beside it.",
      "Under the hood: Next.js App Router, GSAP with ScrollTrigger and SplitText driving every animation, Lenis for smooth scroll synced to GSAP's ticker, and a Canvas 2D waveform controller that ties the scroll narrative together. The grain texture is a 10-frame animated SVG cycling at 0.8 seconds. Built raw. Shipped with intent.",
    ],
    stack: ["Next.js", "TypeScript", "GSAP", "Lenis", "Tailwind", "Canvas API"],
    bg: "linear-gradient(160deg, #060606 0%, #0F0A14 40%, #060606 100%)",
    bgImage: "/portfolio.png",
    bgGif: "/portfolio.gif",
    accentColor: "#FF2D00",
    textAccent: "#FF2D00",
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function getAdjacentProjects(slug: string): {
  prev: Project | null;
  next: Project | null;
} {
  const idx = PROJECTS.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? PROJECTS[idx - 1] : null,
    next: idx < PROJECTS.length - 1 ? PROJECTS[idx + 1] : null,
  };
}
