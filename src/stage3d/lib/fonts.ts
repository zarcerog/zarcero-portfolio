// The type cases. Kept free of three.js so the page can set its fonts before
// the stage (and its renderer) has even been downloaded.

export interface FontSet {
  sans: string;
  serif: string;
  type: string;
}

let FONTS: FontSet = {
  sans: "Futura, 'Century Gothic', sans-serif",
  serif: "Didot, 'Bodoni 72', serif",
  type: "'Courier New', monospace",
};

export function setFonts(f: FontSet) {
  FONTS = f;
}

export const font = {
  sans: (weight: number, px: number) => `${weight} ${px}px ${FONTS.sans}`,
  serif: (weight: number, px: number, italic = false) => `${italic ? "italic " : ""}${weight} ${px}px ${FONTS.serif}`,
  type: (weight: number, px: number, italic = false) => `${italic ? "italic " : ""}${weight} ${px}px ${FONTS.type}`,
};

export async function loadFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  const probes = [
    font.sans(500, 40),
    font.sans(600, 40),
    font.sans(700, 40),
    font.serif(900, 40),
    font.serif(500, 40, true),
    font.serif(900, 40, true),
    font.type(400, 40),
    font.type(700, 40),
  ];
  try {
    await Promise.all(probes.map((p) => document.fonts.load(p, "AaZzÁá")));
  } catch {
    /* fall back to system faces */
  }
}
