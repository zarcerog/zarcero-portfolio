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

export default function Home() {
  return <Stage3D fontClass={`${jost.variable} ${bodoni.variable} ${courier.variable}`} fonts={FONTS} />;
}
