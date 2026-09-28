/** Turn ordinary prose into telegraphese. */
export function telegraphese(text: string) {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+(\s|$)/g, " STOP ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}
