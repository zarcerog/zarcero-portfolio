import type { Metadata } from "next";
import { Bebas_Neue, Barlow_Condensed, Space_Mono } from "next/font/google";
import { TransitionProvider } from "@/context/TransitionContext";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const barlowCondensed = Barlow_Condensed({
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-spacemono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Nicolas Zarcero — Creative Developer",
  description:
    "Creative developer building at the intersection of code, craft, and culture. Make it feel. Make it mean something. Keep it raw.",
  openGraph: {
    title: "Nicolas Zarcero — Creative Developer",
    description: "Make it feel. Make it mean something. Keep it raw.",
    url: "https://zarcerog.com",
    siteName: "zarcerog.com",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nicolas Zarcero — Creative Developer",
    description: "Make it feel. Make it mean something. Keep it raw.",
  },
  metadataBase: new URL("https://zarcerog.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bebasNeue.variable} ${barlowCondensed.variable} ${spaceMono.variable}`}
      >
        {/* Grain paper texture — fixed, above everything except cursor */}
        <div className="grain-layer" aria-hidden="true" />
        <TransitionProvider>{children}</TransitionProvider>
      </body>
    </html>
  );
}
