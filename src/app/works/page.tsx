import type { Metadata, Viewport } from "next";
import { Anton, Bodoni_Moda, Courier_Prime, Jost, Permanent_Marker } from "next/font/google";

import { Spires } from "@/booth/art";
import { PROGRAMME, roman } from "@/works/programme";
import "@/works/programme.css";

// The Picture House: the programme. A letterboard for what's on, and a
// reel for every work, newest first.

const jost = Jost({ weight: ["400", "500", "600"], variable: "--f-sans", subsets: ["latin"], display: "swap" });
const bodoni = Bodoni_Moda({ weight: ["500", "700"], style: ["normal", "italic"], variable: "--f-serif", subsets: ["latin"], display: "swap" });
const courier = Courier_Prime({ weight: ["400", "700"], variable: "--f-type", subsets: ["latin"], display: "swap" });
const anton = Anton({ weight: "400", variable: "--f-anton", subsets: ["latin"], display: "swap" });
const marker = Permanent_Marker({ weight: "400", variable: "--f-marker", subsets: ["latin"], display: "swap" });

const FONTS = [jost, bodoni, courier, anton, marker].map((f) => f.variable).join(" ");

const TITLE = "The Picture House — Works by Nicolás Zarcero";
const DESCRIPTION = "Now showing: The Client Is Not in a Hurry, a picture about the Sagrada Família in seven chapters.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "https://zarcerog.com/works", siteName: "zarcerog.com", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#070506",
};

/** Plastic letters, pushed into felt, never quite straight. */
function Letters({ text, row }: { text: string; row: number }) {
  return (
    <span className="wk-line" style={{ ["--row" as string]: row }}>
      {[...text].map((ch, k) => {
        const h = Math.sin((row + 1) * 91.7 + k * 12.9898) * 43758.5453;
        const r = h - Math.floor(h);
        return ch === " " ? (
          <span key={k} className="wk-gap" />
        ) : (
          <span
            key={k}
            className="wk-l"
            style={{ ["--r" as string]: `${((r - 0.5) * 7).toFixed(1)}deg`, ["--d" as string]: `${(row * 0.16 + k * 0.035).toFixed(2)}s` }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

export default function Works() {
  const now = PROGRAMME[0];
  const board = ["NOW SHOWING", roman(now.date), ...now.title.toUpperCase().replace("IS NOT", "IS NOT\n").split("\n").map((s) => s.trim())];
  return (
    <main className={`wk-root ${FONTS}`}>
      <nav className="wk-top" aria-label="Elsewhere in the house">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a hard cut between productions: their styles never share a document */}
        <a href="/">
          <span aria-hidden="true">←</span> Box office
        </a>
        <p>
          The Picture House <b aria-hidden="true">·</b> Programme
        </p>
        <a href="/theatre">
          The theatre <span aria-hidden="true">→</span>
        </a>
      </nav>

      <section className="wk-board" aria-label={`Now showing: ${now.title}, from ${roman(now.date)}`}>
        <div className="wk-board__bulbs" aria-hidden="true" />
        <div className="wk-board__felt" aria-hidden="true">
          {board.map((line, k) => (
            <Letters key={k} text={line} row={k} />
          ))}
        </div>
        <p className="wk-board__scrawl" aria-hidden="true">
          <span>still under construction!</span>
        </p>
      </section>

      <section className="wk-programme" aria-labelledby="wk-programme-h">
        <h1 id="wk-programme-h" className="wk-h">
          <span>Works</span>
          <small>dated like reels in a can · newest first</small>
        </h1>
        <ol className="wk-list">
          {PROGRAMME.map((w, k) => (
            <li key={w.date}>
              <a className="wk-reel" href={w.href}>
                <span className="wk-reel__poster" aria-hidden="true">
                  <span className="wk-reel__company">The Zarcero Picture Company</span>
                  <span className="wk-reel__ptitle">{w.title}</span>
                  <svg viewBox="0 0 300 460" preserveAspectRatio="xMidYMax meet">
                    <Spires />
                  </svg>
                </span>
                <span className="wk-reel__body">
                  <span className="wk-reel__meta">
                    <span className="wk-reel__no">Reel Nº{PROGRAMME.length - k}</span>
                    <time dateTime={w.date}>{roman(w.date)}</time>
                  </span>
                  <span className="wk-reel__title">{w.title}</span>
                  <span className="wk-reel__kind">{w.kind}</span>
                  <span className="wk-reel__log">{w.logline}</span>
                  <span className="wk-reel__facts">
                    {w.facts.map(([k2, v]) => (
                      <span key={k2}>
                        <i>{k2}</i>
                        {v}
                      </span>
                    ))}
                  </span>
                  <span className="wk-reel__go">
                    Take your seat <span aria-hidden="true">→</span>
                  </span>
                </span>
              </a>
            </li>
          ))}
          <li>
            <div className="wk-reel wk-reel--soon">
              <span className="wk-reel__poster wk-reel__poster--soon" aria-hidden="true">
                <span>?</span>
              </span>
              <span className="wk-reel__body">
                <span className="wk-reel__meta">
                  <span className="wk-reel__no">Reel Nº{PROGRAMME.length + 1}</span>
                  <span>In the edit</span>
                </span>
                <span className="wk-reel__title">Coming soon</span>
                <span className="wk-reel__log">
                  Title to be announced, possibly by telegram. The management regrets that it cannot say more, as it does
                  not yet know.
                </span>
              </span>
            </div>
          </li>
        </ol>
      </section>

      <footer className="wk-foot">
        <p>The Zarcero Picture Company · a department of the Zarcero Theatre · est. 2026</p>
        <p>Please do not feed the pigeons.</p>
      </footer>
    </main>
  );
}
