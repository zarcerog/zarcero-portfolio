import type { Metadata } from "next";
import { Bodoni_Moda, Courier_Prime, Jost } from "next/font/google";

import Stage3D from "@/stage3d/Stage3D";
import "@/theatre/theatre.css";
import "@/stage3d/stage3d.css";

// Jost stands in for Futura; Bodoni for the playbill; Courier for the script.
// Only the cuts the show uses, Latin only (á, æ and º are all in it): every
// extra weight is another file the browser would fetch before the curtain.
const jost = Jost({
  weight: ["400", "500", "600", "700"],
  variable: "--f-sans",
  subsets: ["latin"],
  display: "swap",
});

const bodoni = Bodoni_Moda({
  weight: ["500", "700", "900"],
  style: ["normal", "italic"],
  variable: "--f-serif",
  subsets: ["latin"],
  display: "swap",
});

const courier = Courier_Prime({
  weight: ["400", "700"],
  variable: "--f-type",
  subsets: ["latin"],
  display: "swap",
});

const FONTS = {
  sans: jost.style.fontFamily,
  serif: bodoni.style.fontFamily,
  type: courier.style.fontFamily,
};

const TITLE = "Nicolás Zarcero — A Portfolio in Five Acts";
const DESCRIPTION =
  "The Zarcero Theatre presents Nicolás Zarcero, engineer and designer, in a portfolio in five acts, with an intermission.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/theatre" },
  openGraph: {
    title: TITLE,
    description: "Engineer, designer, and self-appointed stage manager of too many side projects.",
    url: "https://zarcerog.com/theatre",
    siteName: "zarcerog.com",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "Engineer, designer, and self-appointed stage manager of too many side projects.",
  },
};

// The play: the portfolio proper. The box office at `/` sells the tickets.
export default function Theatre() {
  return <Stage3D fontClass={`${jost.variable} ${bodoni.variable} ${courier.variable}`} fonts={FONTS} />;
}
