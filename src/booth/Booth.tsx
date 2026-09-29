"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";

import { PROGRAMME } from "@/works/programme";

import { Bell, Guilloche, Kiosk, Pigeon, Wall } from "./art";
import { booth, type BoothSfx } from "./sound";

type Show = "theatre" | "picture";

const HREF: Record<Show, string> = { theatre: "/theatre", picture: "/works" };

// the clerk's script; times in ms from the shutter going up
const OPENING: [number, string][] = [
  [1500, "Good evening."],
  [3100, "The house has two shows tonight."],
  [5300, "On the left: a portfolio, in five acts, with an intermission."],
  [8900, "On the right: a picture about a church that has been running late since 1882."],
  [12900, "One ticket each, please. No refunds, no exchanges."],
  [16400, ""],
];
const RETURNING: [number, string][] = [
  [700, "Back again. Still two shows."],
  [3200, ""],
];
const BELL = [
  "Yes?",
  "Still two shows.",
  "I heard you the first time.",
  "The bell is largely decorative.",
  "The management thanks you for your enthusiasm.",
  "Please consult a ticket.",
  "…",
];
const HOVER: Record<Show, string> = {
  theatre: "Stalls, row Z. The acoustics are superb.",
  picture: "Row 29. Bring a coat; it runs rather long.",
};
const CHOSEN: Record<Show, string> = {
  theatre: "The stalls are to your left. Enjoy the play.",
  picture: "Mind the scaffolding.",
};
const IDLE = "Take your time. The church certainly did.";

function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Ticket({
  show,
  chosen,
  onChoose,
  onHover,
}: {
  show: Show;
  chosen: Show | null;
  onChoose: (show: Show, e: MouseEvent<HTMLAnchorElement>) => void;
  onHover: (show: Show) => void;
}) {
  const el = useRef<HTMLAnchorElement>(null);
  const film = PROGRAMME[0];
  // a small tilt towards the pointer, as if held up to the light
  const tilt = (e: React.PointerEvent) => {
    const a = el.current;
    if (!a || e.pointerType !== "mouse") return;
    const r = a.getBoundingClientRect();
    a.style.setProperty("--tx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    a.style.setProperty("--ty", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const untilt = () => {
    el.current?.style.setProperty("--tx", "0");
    el.current?.style.setProperty("--ty", "0");
  };
  const state = chosen === show ? "chosen" : chosen ? "other" : "idle";
  return (
    // plain links: a hard cut between productions, their styles never share a document
    <a
      ref={el}
      href={HREF[show]}
      className={`bx-ticket bx-ticket--${show}`}
      data-state={state}
      onClick={(e) => onChoose(show, e)}
      onPointerMove={tilt}
      onPointerEnter={() => onHover(show)}
      onFocus={() => onHover(show)}
      onPointerLeave={untilt}
      aria-label={
        show === "theatre"
          ? "The Zarcero Theatre: Nicolás Zarcero in A Portfolio in Five Acts. Enter the theatre."
          : `The Picture House: now showing, ${film.title}. See the programme.`
      }
    >
      <span className="bx-ticket__float">
        <span className="bx-ticket__paper">
          <span className="bx-ticket__main">
            <Guilloche id={`g-${show}`} color={show === "theatre" ? "rgba(134,25,42,0.16)" : "rgba(20,14,10,0.12)"} />
            {show === "theatre" ? (
              <>
                <span className="bx-t__house">The Zarcero Theatre</span>
                <span className="bx-t__presents">presents</span>
                <span className="bx-t__title">
                  A Portfolio
                  <br />
                  in Five Acts
                </span>
                <span className="bx-t__sub">with an intermission · starring Nicolás Zarcero</span>
                <span className="bx-t__row">
                  <span>
                    <i>Curtain</i> 8:00 pm
                  </span>
                  <span>
                    <i>Stalls</i> Row Z
                  </span>
                  <span>
                    <i>Seat</i> 1
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="bx-t__house">The Picture House</span>
                <span className="bx-t__now">Now showing</span>
                <span className="bx-t__title">{film.title}</span>
                <span className="bx-t__sub">{film.kind.toLowerCase()} · and whatever comes next</span>
                <span className="bx-t__row">
                  <span>
                    <i>Reel</i> 9:15 pm
                  </span>
                  <span>
                    <i>Row</i> 29
                  </span>
                  <span>
                    <i>Seat</i> IX
                  </span>
                </span>
                <svg className="bx-t__circle" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
                  <path
                    pathLength={1}
                    d="M22 40 C 10 18 70 6 130 8 C 190 10 198 34 170 48 C 130 60 40 58 16 38 C 8 30 30 18 60 16"
                    fill="none"
                    stroke="#d8262e"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                </svg>
              </>
            )}
          </span>
          <span className="bx-ticket__stub">
            <span className="bx-t__admit">Admit one</span>
            <span className="bx-t__serial">Nº {show === "theatre" ? "000 001" : "002 026"}</span>
            <span className="bx-ticket__hole" aria-hidden="true" />
          </span>
        </span>
        <span className="bx-ticket__chad" aria-hidden="true" />
      </span>
    </a>
  );
}

/** Notes in the director's red marker, drawn on after the tickets land. */
function Notes() {
  return (
    <svg className="bx-notes" viewBox="0 0 1600 1000" overflow="visible" aria-hidden="true">
      <g className="bx-note bx-note--pick">
        <text x={800} y={878} textAnchor="middle">
          pick one!
        </text>
        <path pathLength={1} d="M734 868 C 690 874 640 858 620 828" />
        <path pathLength={1} d="M614 848 L618 826 L638 838" />
        <path pathLength={1} d="M866 868 C 910 874 960 858 980 828" />
        <path pathLength={1} d="M986 848 L982 826 L962 838" />
      </g>
      <g className="bx-note bx-note--bell">
        <text x={1074} y={548} textAnchor="middle" transform="rotate(-6 1074 548)">
          ring me
        </text>
        <path pathLength={1} d="M1050 562 C 1020 580 968 584 944 596" />
        <path pathLength={1} d="M958 586 L942 597 L960 604" />
      </g>
    </svg>
  );
}

export default function Booth({ fontClass, siteName }: { fontClass: string; siteName: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState("");
  const [talking, setTalking] = useState(false);
  const [chosen, setChosen] = useState<Show | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [pigeon, setPigeon] = useState<"walk" | "fly">("walk");
  const [pigeonGen, setPigeonGen] = useState(0);
  const [quick, setQuick] = useState(false);
  const timers = useRef<number[]>([]);
  const said = useRef<Set<string>>(new Set());
  const bellCount = useRef(0);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const say = useCallback(
    (text: string, hold = 2800) => {
      setLine(text);
      setTalking(!!text);
      if (text) later(Math.min(1600, 400 + text.length * 32), () => setTalking(false));
      if (text && hold > 0) {
        const mine = text;
        later(hold, () => setLine((l) => (l === mine ? "" : l)));
      }
    },
    [later],
  );

  const sfx = useCallback((name: BoothSfx, force = false) => booth.play(name, force), []);

  // the opening: the shutter goes up and the clerk says his piece
  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem("bx-seen") === "1";
      window.sessionStorage.setItem("bx-seen", "1");
    } catch {
      // no memory, no matter
    }
    booth.load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the visitor's saved choice on arrival
    setSoundOn(booth.on);
    setQuick(seen);
    const script = seen ? RETURNING : OPENING;
    for (const [at, text] of script)
      later(at, () => {
        setLine(text);
        setTalking(!!text);
        if (text) later(400 + text.length * 30, () => setTalking(false));
      });
    later(seen ? 20000 : 32000, () => setLine((l) => l || IDLE));
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, [later]);

  // anybody who asked for sound before gets it with their first touch
  useEffect(() => {
    const go = () => {
      if (booth.on) booth.unlock();
    };
    window.addEventListener("pointerdown", go, { once: true, capture: true });
    window.addEventListener("keydown", go, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", go, true);
      window.removeEventListener("keydown", go, true);
    };
  }, []);

  // coming back with the browser's back button: sell them another ticket
  useEffect(() => {
    const show = (e: PageTransitionEvent) => {
      if (e.persisted) setChosen(null);
    };
    window.addEventListener("pageshow", show);
    return () => window.removeEventListener("pageshow", show);
  }, []);

  // the clerk's eyes, and a little parallax, follow the pointer
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    const move = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          el.style.setProperty("--px", px.toFixed(3));
          el.style.setProperty("--py", py.toFixed(3));
        });
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  // the clock behind the clerk keeps real time
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const tick = () => {
      const d = new Date();
      const m = d.getMinutes() + d.getSeconds() / 60;
      el.style.setProperty("--hh", `${((d.getHours() % 12) + m / 60) * 30}deg`);
      el.style.setProperty("--mm", `${m * 6}deg`);
    };
    tick();
    const id = window.setInterval(tick, 20000);
    return () => clearInterval(id);
  }, []);

  const choose = (show: Show, e: MouseEvent<HTMLAnchorElement>) => {
    // new tabs and middle clicks go straight through
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (chosen) return;
    const href = HREF[show];
    if (reduced()) {
      window.location.assign(href);
      return;
    }
    setChosen(show);
    say(CHOSEN[show], 0);
    sfx("punch");
    later(320, () => sfx("tear"));
    later(640, () => sfx(show === "theatre" ? "curtain" : "projector"));
    later(show === "theatre" ? 1900 : 2250, () => window.location.assign(href));
  };

  const hover = (show: Show) => {
    if (chosen) return;
    sfx(show === "theatre" ? "chimeTheatre" : "chimePicture");
    if (said.current.has(show)) return;
    said.current.add(show);
    say(HOVER[show]);
  };

  const ring = () => {
    booth.unlock();
    sfx("ding", true);
    const el = root.current?.querySelector(".bx-bell");
    el?.classList.remove("is-rung");
    void (el as HTMLElement | null)?.offsetWidth;
    el?.classList.add("is-rung");
    say(BELL[Math.min(bellCount.current++, BELL.length - 1)], 2400);
  };

  const toggleSound = () => {
    const next = !soundOn;
    booth.set(next);
    setSoundOn(next);
    if (next) {
      sfx("switch");
      later(120, () => sfx("ding"));
      say("Sound, very good. The house has an orchestra.", 2600);
    } else say("Silence. Very good.", 2000);
  };

  const shoo = () => {
    if (pigeon === "fly") return;
    setPigeon("fly");
    sfx("coo");
    later(500, () => sfx("flap"));
    say("The pigeon does not have a ticket.", 2600);
    // another one turns up eventually; they always do
    later(16000, () => {
      setPigeon("walk");
      setPigeonGen((g) => g + 1);
    });
  };

  return (
    <main
      ref={root}
      className={`bx-root ${fontClass}`}
      data-quick={quick}
      data-talking={talking}
      data-chosen={chosen ?? undefined}
    >
      <h1 className="bx-sr">{siteName}: box office. Two shows tonight — choose a ticket.</h1>
      <div className="bx-set">
        <div className="bx-floor" aria-hidden="true">
          <div className="bx-floor__plane" />
        </div>
        <div className="bx-layer bx-layer--wall">
          <Wall />
        </div>
        <div className="bx-layer bx-layer--kiosk">
          <Kiosk />
          <button type="button" className="bx-bell" onClick={ring} aria-label="Ring the bell">
            <Bell />
          </button>
          <button type="button" className="bx-card" onClick={toggleSound} aria-pressed={soundOn} aria-label="Sound">
            <span className="bx-card__k">Sound</span>
            <span className="bx-card__v">{soundOn ? "on ♪" : "off"}</span>
          </button>
          <Notes />
        </div>
        <button
          key={pigeonGen}
          type="button"
          className="bx-pigeon"
          data-state={pigeon}
          onClick={shoo}
          aria-label="A pigeon, without a ticket"
          tabIndex={-1}
        >
          <span className="bx-pigeon__walk">
            <Pigeon />
          </span>
        </button>
        <nav className="bx-layer bx-layer--tickets" aria-label="Tickets">
          <Ticket show="theatre" chosen={chosen} onChoose={choose} onHover={hover} />
          <Ticket show="picture" chosen={chosen} onChoose={choose} onHover={hover} />
        </nav>
      </div>

      <p className="bx-sub" aria-hidden="true" data-on={!!line}>
        <span key={line}>{line}</span>
      </p>

      <footer className="bx-foot">
        <a href="/archive/1">Lost property: Archive Nº1 →</a>
      </footer>

      {/* the ways out */}
      <div className="bx-curtains" aria-hidden="true">
        <span className="bx-curtains__l" />
        <span className="bx-curtains__r" />
        <span className="bx-curtains__pelmet" />
      </div>
      <div className="bx-iris" aria-hidden="true">
        <span className="bx-iris__yellow" />
        <span className="bx-iris__black" />
        <span className="bx-iris__word">Now showing</span>
      </div>
    </main>
  );
}
