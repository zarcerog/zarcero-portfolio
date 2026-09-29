import type { Metadata, Viewport } from "next";
import { Abril_Fatface, Alfa_Slab_One, Anton, Bodoni_Moda, Cinzel, Courier_Prime, Jost, Nanum_Pen_Script, Permanent_Marker, Shrikhand, Yellowtail } from "next/font/google";

import Film from "@/works/sagrada/Film";
import "@/works/sagrada/film.css";

// Works are dated, like reels in a can. This one: the Sagrada Família, told
// as a picture in seven chapters, with yellow subtitles.

const jost = Jost({ weight: ["400", "500", "600", "700"], variable: "--f-sans", subsets: ["latin"], display: "swap" });
const bodoni = Bodoni_Moda({ weight: ["500", "700", "900"], style: ["normal", "italic"], variable: "--f-serif", subsets: ["latin"], display: "swap" });
const courier = Courier_Prime({ weight: ["400", "700"], variable: "--f-type", subsets: ["latin"], display: "swap" });

// The title cards: one borrowed vintage for each chapter. None of them is on
// screen before the first card (beat 8.5), so they are not preloaded: they'd
// only compete with the scene for the first paint. The film warms them in the
// background once the projector is rolling (see Film). The red marker stays
// preloaded — it's all over the poster on the very first frame.
const cinzel = Cinzel({ weight: ["700"], variable: "--f-cinzel", subsets: ["latin"], display: "swap", preload: false });
const anton = Anton({ weight: "400", variable: "--f-anton", subsets: ["latin"], display: "swap", preload: false });
const shrikhand = Shrikhand({ weight: "400", variable: "--f-shrikhand", subsets: ["latin"], display: "swap", preload: false });
const abril = Abril_Fatface({ weight: "400", variable: "--f-abril", subsets: ["latin"], display: "swap", preload: false });
const pen = Nanum_Pen_Script({ weight: "400", variable: "--f-pen", subsets: ["latin"], display: "swap", preload: false });
const slab = Alfa_Slab_One({ weight: "400", variable: "--f-slab", subsets: ["latin"], display: "swap", preload: false });
const script = Yellowtail({ weight: "400", variable: "--f-script", subsets: ["latin"], display: "swap", preload: false });
const marker = Permanent_Marker({ weight: "400", variable: "--f-marker", subsets: ["latin"], display: "swap" });

const CARD_FONTS = [cinzel, anton, shrikhand, abril, pen, slab, script, marker].map((f) => f.variable).join(" ");

/** The late faces, in the order their chapters come up, as CSS font shorthands. */
const WARM = [
  `700 1em ${cinzel.style.fontFamily}`,
  `400 1em ${anton.style.fontFamily}`,
  `400 1em ${shrikhand.style.fontFamily}`,
  `400 1em ${abril.style.fontFamily}`,
  `400 1em ${pen.style.fontFamily}`,
  `400 1em ${slab.style.fontFamily}`,
  `400 1em ${script.style.fontFamily}`,
];

const FONTS = {
  sans: `${jost.style.fontFamily}, Jost, Futura, sans-serif`,
  serif: `${bodoni.style.fontFamily}, "Bodoni Moda", Didot, serif`,
  type: `${courier.style.fontFamily}, "Courier Prime", "Courier New", monospace`,
};

const TITLE = "The Client Is Not in a Hurry — a short history of a very long building";
const DESCRIPTION =
  "The Sagrada Família, from a field outside Barcelona in 1881 to the fireworks of 10 June 2026, as a scroll-driven picture in seven chapters.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "https://zarcerog.com/works/2026-09-29", siteName: "zarcerog.com", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#070506",
};

export default function Page() {
  return <Film fontClass={`${jost.variable} ${bodoni.variable} ${courier.variable} ${CARD_FONTS}`} fonts={FONTS} warm={WARM} />;
}
