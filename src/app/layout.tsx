import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";

// The root layout is deliberately neutral: each "production" brings its own
// stylesheet and typefaces. The box office lives at `/`; the play at
// `/theatre`, the pictures under `/works`, previous productions under
// `/archive/<n>`. Links between productions use plain <a> tags (hard
// navigation) so their global styles never share a document.

export const metadata: Metadata = {
  title: "Nicolás Zarcero — Box Office",
  description:
    "Two shows tonight: a portfolio in five acts, with an intermission; and a picture about a church that is running late. Nicolás Zarcero, engineer and designer.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Nicolás Zarcero — Box Office",
    description: "Two shows tonight. One ticket each, please.",
    url: "https://zarcerog.com",
    siteName: "zarcerog.com",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nicolás Zarcero — Box Office",
    description: "Two shows tonight. One ticket each, please.",
  },
  metadataBase: new URL("https://zarcerog.com"),
};

export const viewport: Viewport = {
  themeColor: "#2a1114",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
