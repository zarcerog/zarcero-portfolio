import type { Viewport } from "next";
import { Anton, Bodoni_Moda, Courier_Prime, Jost, Limelight, Permanent_Marker } from "next/font/google";

import Booth from "@/booth/Booth";
import "@/booth/booth.css";

// The box office. Two shows tonight: the play (/theatre) and the pictures
// (/works). One ticket each, please.

const jost = Jost({ weight: ["400", "500", "600"], variable: "--f-sans", subsets: ["latin"], display: "swap" });
const bodoni = Bodoni_Moda({ weight: ["500", "700"], style: ["normal", "italic"], variable: "--f-serif", subsets: ["latin"], display: "swap" });
const courier = Courier_Prime({ weight: ["400", "700"], variable: "--f-type", subsets: ["latin"], display: "swap" });
const limelight = Limelight({ weight: "400", variable: "--f-marquee", subsets: ["latin"], display: "swap" });
const anton = Anton({ weight: "400", variable: "--f-anton", subsets: ["latin"], display: "swap" });
const marker = Permanent_Marker({ weight: "400", variable: "--f-marker", subsets: ["latin"], display: "swap" });

const FONTS = [jost, bodoni, courier, limelight, anton, marker].map((f) => f.variable).join(" ");

export const viewport: Viewport = {
  themeColor: "#e8b3a9",
};

export default function BoxOffice() {
  return <Booth fontClass={FONTS} siteName="Nicolás Zarcero" />;
}
