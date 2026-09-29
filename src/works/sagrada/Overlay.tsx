"use client";

import { useRef } from "react";

import { useStage, useStageValue, useTick } from "@/theatre/engine";

import { ChapterCards, Fin, MarkerDefs, Poster } from "./Cards";
import { LANGS, setLang, useLang } from "./lang";
import { Notes } from "./Notes";
import { CHAPTER_TEXT, UI, lineText } from "./script.i18n";
import { SoundButton } from "./sound/SoundButton";

import { BEATS, CHAPTERS, FIN, LINES, REEL, lineEnv, placeAt, yearAt, type Env } from "./script";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
function envelope(t: number, [a, b, c, d]: Env) {
  if (t <= a || t >= d) return 0;
  if (t < b) return ease((t - a) / (b - a));
  if (t <= c) return 1;
  return 1 - ease((t - c) / (d - c));
}

/** Set opacity (and visibility) only when it changes. */
function fade(el: HTMLElement | null, v: number, last: { v: number }) {
  if (!el) return;
  const q = Math.round(v * 200) / 200;
  if (q === last.v) return;
  last.v = q;
  el.style.opacity = String(q);
  el.style.visibility = q > 0 ? "visible" : "hidden";
}

function chapterAt(t: number) {
  let idx = -1;
  CHAPTERS.forEach((c, i) => {
    if (t >= c.card[1]) idx = i;
  });
  return idx;
}

// ---------------------------------------------------------------------------

function Subtitles() {
  const lang = useLang();
  const refs = useRef<(HTMLParagraphElement | null)[]>([]);
  const last = useRef(LINES.map(() => ({ v: -1 })));
  const envs = LINES.map(lineEnv);
  useTick(-1, BEATS + 5, (t) => {
    LINES.forEach((_, i) => fade(refs.current[i], envelope(t, envs[i]), last.current[i]));
  });
  return (
    <div className="sf-subs" aria-hidden="true">
      {LINES.map((l, i) => (
        <p
          key={i}
          className="sf-sub"
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          {l.ca && lang !== "ca" && (
            <span className="sf-sub__ca" lang="ca">
              <em>«{l.ca}»</em>
              <small>{UI[lang].original}</small>
            </span>
          )}
          <span className="sf-sub__en">{lineText(l, lang)}</span>
        </p>
      ))}
    </div>
  );
}

/** The letterbox, with the slate in the top bar and the reel in the bottom one. */
function Letterbox() {
  const root = useRef<HTMLDivElement>(null);
  const year = useRef<HTMLSpanElement>(null);
  const place = useRef<HTMLSpanElement>(null);
  const head = useRef<HTMLSpanElement>(null);
  const lastYear = useRef("");
  const lastPlace = useRef("");
  const lastK = useRef(-1);
  const stage = useStage();
  const lang = useLang();
  const ui = UI[lang];
  const chapter = useStageValue(chapterAt, -1);
  useTick(-1, BEATS + 5, (t) => {
    const k = clamp01((t - 0.7) / 0.8);
    const q = Math.round(ease(k) * 100) / 100;
    const film = root.current?.closest<HTMLElement>(".sf-root");
    if (q !== lastK.current && film) {
      lastK.current = q;
      film.style.setProperty("--lb-k", String(q));
    }
    const y = yearAt(t);
    const ys = String(Math.floor(y));
    if (ys !== lastYear.current && year.current) {
      lastYear.current = ys;
      year.current.textContent = ys;
    }
    const p = placeAt(y);
    if (p !== lastPlace.current && place.current) {
      lastPlace.current = p;
      place.current.textContent = p;
    }
    if (head.current) head.current.style.transform = `scaleX(${clamp01(t / (FIN[1] + 0.3)).toFixed(4)})`;
  });
  const c = chapter >= 0 ? CHAPTERS[chapter] : null;
  const ct = chapter >= 0 ? CHAPTER_TEXT[lang][chapter] : null;
  return (
    <div className="sf-lb" ref={root}>
      <div className="sf-lb__bar sf-lb__bar--top">
        <a className="sf-lb__home" href="/works">
          <span aria-hidden="true">←</span> {ui.programme}
        </a>
        <p className="sf-lb__slate" aria-live="off">
          <span ref={place}>Sant Martí de Provençals</span>
          <b aria-hidden="true">·</b>
          <span className="sf-lb__year" ref={year}>
            1881
          </span>
        </p>
        <p className="sf-lb__chapter">
          {c && ct ? (
            <>
              <b>{c.numeral}</b> {ct.title}
            </>
          ) : (
            <>
              <b>¶</b> {ui.prologue}
            </>
          )}
        </p>
      </div>
      <div className="sf-lb__bar sf-lb__bar--bottom">
        <nav className="sf-reel" aria-label={ui.reel}>
          <span className="sf-reel__track" aria-hidden="true">
            <span className="sf-reel__head" ref={head} />
          </span>
          {REEL.map((r) => {
            const label = r.label === "Prologue" ? ui.prologue : r.label === "Fin" ? ui.fin : r.label;
            return (
              <button
                key={r.label}
                type="button"
                className="sf-reel__mark"
                style={{ left: `${(r.at / (FIN[1] + 0.3)) * 100}%` }}
                onClick={() => stage.jump(r.at)}
                aria-label={r.label === "Prologue" || r.label === "Fin" ? label : ui.chapter(r.label)}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/** The whole script, for screen readers and search engines. */
export function Transcript() {
  const lang = useLang();
  const ui = UI[lang];
  return (
    <article className="sf-sr" lang={lang}>
      <h1>{ui.transcript.title}</h1>
      <p>{ui.transcript.blurb}</p>
      <section>
        <h2>{ui.prologue}</h2>
        {LINES.filter((l) => l.at < CHAPTERS[0].card[0]).map((l, k) => (
          <p key={k}>{lineText(l, lang)}</p>
        ))}
      </section>
      {CHAPTERS.map((c, i) => {
        const from = c.card[0];
        const to = CHAPTERS[i + 1]?.card[0] ?? 1e9;
        const ct = CHAPTER_TEXT[lang][i];
        return (
          <section key={c.id}>
            <h2>
              {ct.word}: {ct.title} ({ct.years})
            </h2>
            {LINES.filter((l) => l.at >= from && l.at < to).map((l, k) => (
              <p key={k}>{lineText(l, lang)}</p>
            ))}
          </section>
        );
      })}
    </article>
  );
}

/**
 * The subtitle switch, beside the sound. On a phone it folds to a single
 * button that steps through the prints.
 */
function LangSwitch() {
  const lang = useLang();
  const ui = UI[lang];
  const i = LANGS.findIndex((l) => l.id === lang);
  return (
    <div className="sf-lang" role="group" aria-label={ui.subtitles} title={ui.subtitles}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
        <path d="M7 12.5h4M13 12.5h4M7 15.5h7" />
      </svg>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          className="sf-lang__opt"
          lang={l.id}
          aria-pressed={l.id === lang}
          title={l.name}
          // pressing the lit one moves on to the next print (the phone's only button)
          onClick={() => setLang(l.id === lang ? LANGS[(i + 1) % LANGS.length].id : l.id)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function Overlay() {
  return (
    <>
      <Letterbox />
      <MarkerDefs />
      <Notes />
      <Subtitles />
      <Poster />
      <ChapterCards />
      <Fin />
      <div className="sf-controls">
        <SoundButton />
        <LangSwitch />
      </div>
      <Transcript />
    </>
  );
}
