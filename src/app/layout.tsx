import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";

// The root layout is deliberately neutral: each "production" brings its own
// stylesheet and typefaces. The current show lives at `/`, previous ones under
// `/archive/<n>`. Links between productions use plain <a> tags (hard
// navigation) so their global styles never share a document.

export const metadata: Metadata = {
  title: "Nicolás Zarcero — A Portfolio in Five Acts",
  description:
    "The Zarcero Theatre presents Nicolás Zarcero, engineer and designer, in a portfolio in five acts, with an intermission.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Nicolás Zarcero — A Portfolio in Five Acts",
    description: "Engineer, designer, and self-appointed stage manager of too many side projects.",
    url: "https://zarcerog.com",
    siteName: "zarcerog.com",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nicolás Zarcero — A Portfolio in Five Acts",
    description: "Engineer, designer, and self-appointed stage manager of too many side projects.",
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
