"use client";

import Image from "next/image";
import { useMemo, useRef, useState, type ReactNode } from "react";

import {
  CONCESSIONS,
  CREDITS,
  CREDITS_DISCLAIMER,
  INTRO,
  PERSONAE,
  PLAYBILL,
  DRESSING_ROOM,
  ROOMS,
  WORKS,
  ACT_CARDS,
  SCRIPT,
  SPEAKERS,
} from "@/theatre/content";
import { useStage, useTick } from "@/theatre/engine";
import { cueSound } from "@/theatre/sound/bus";
import { telegraphese } from "@/theatre/telegraph";

import { LINES, Q, roomCue, workCue } from "../cues";

type Env = readonly [number, number, number, number];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (p: number) => p * p * (3 - 2 * p);
function envelope(t: number, [a, b, c, d]: Env) {
  if (t <= a || t >= d) return 0;
  if (t < b) return smooth(clamp01((t - a) / (b - a)));
  if (t <= c) return 1;
  return 1 - smooth(clamp01((t - c) / (d - c)));
}

/** A DOM card that fades and drifts in on its cue. */
function Cue({ env, className, children, rise = 18, label }: { env: Env; className: string; children: ReactNode; rise?: number; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRef<boolean | null>(null);
  useTick(-1, 1e6, (t) => {
    const el = ref.current;
    if (!el) return;
    const e = envelope(t, env);
    const on = e > 0.001;
    if (on !== shown.current) {
      shown.current = on;
      el.style.visibility = on ? "visible" : "hidden";
      el.inert = !on;
    }
    if (!on) return;
    el.style.opacity = e.toFixed(3);
    el.style.setProperty("--rise", `${((1 - e) * (t < env[1] ? rise : -rise)).toFixed(2)}px`);
  });
  return (
    <div ref={ref} className={`ov ${className}`} role="group" aria-label={label} style={{ visibility: "hidden", opacity: 0 }}>
      {children}
    </div>
  );
}

/** Two cards, mirrored either side of the centre line (a single sheet on phones). */
function Pair({ env, label, left, right, className = "" }: { env: Env; label: string; left: ReactNode; right: ReactNode; className?: string }) {
  return (
    <Cue env={env} className={`ov-pair ${className}`} label={label}>
      <div className="ov-paper ov-pair__card ov-pair__card--left">{left}</div>
      <div className="ov-paper ov-pair__card ov-pair__card--right">{right}</div>
    </Cue>
  );
}

function Hint() {
  const ref = useRef<HTMLDivElement>(null);
  useTick(0, 1, (t) => {
    if (ref.current) ref.current.style.opacity = (1 - clamp01(t / 0.35)).toFixed(3);
  });
  return (
    <div className="ov-hint" ref={ref} aria-hidden="true">
      <span>{INTRO.hint}</span>
      <i />
    </div>
  );
}

/** The script: whoever is speaking, set like a play, top centre. */
function ScriptLine() {
  const ids = Object.keys(LINES);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useTick(-1, 1e6, (t) => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      const e = envelope(t, LINES[ids[i]]);
      const on = e > 0.001;
      if (el.dataset.on !== String(on)) {
        el.dataset.on = String(on);
        el.style.visibility = on ? "visible" : "hidden";
      }
      if (on) {
        el.style.opacity = e.toFixed(3);
        el.style.transform = `translate(-50%, ${((1 - e) * (t < LINES[ids[i]][1] ? 10 : -10)).toFixed(1)}px)`;
      }
    });
  });
  return (
    <div className="ov-script" aria-live="polite">
      {ids.map((id, i) => {
        const line = SCRIPT[id];
        if (!line) return null;
        return (
          <div key={id} ref={(el) => void (refs.current[i] = el)} className={`ov-script__line ov-script__line--${line.who}`} style={{ visibility: "hidden", opacity: 0 }}>
            <p className="ov-script__who">{SPEAKERS[line.who]}</p>
            <p className="ov-script__text">{line.text}</p>
          </div>
        );
      })}
    </div>
  );
}

function PersonaeCard() {
  return (
    <Pair
      env={Q.act1.personae}
      label={PERSONAE.heading}
      className="ov-personae"
      left={
        <>
          <h2 className="ov-display">{PERSONAE.heading}</h2>
          <p className="ov-kicker ov-kicker--ink">In order of appearance</p>
          <dl className="th-cast">
            {PERSONAE.cast.map((row) => (
              <div key={row.role} className="th-cast__row">
                <dt>{row.role}</dt>
                <span aria-hidden="true" className="th-leader" />
                <dd>{row.actor}</dd>
              </div>
            ))}
          </dl>
        </>
      }
      right={
        <>
          <p className="ov-kicker">A note on the lead</p>
          <p className="ov-body">{PERSONAE.note}</p>
        </>
      }
    />
  );
}

function RoomCaptions() {
  return (
    <>
      {ROOMS.map((room, idx) => {
        const c = roomCue(idx);
        return (
          <Pair
            key={room.id}
            env={[c.b - 0.3, c.b + 0.05, c.c - 0.1, c.c + 0.2]}
            label={room.company}
            className="ov-room"
            left={
              <>
                <p className="ov-kicker">{room.number}</p>
                <h3 className="ov-display ov-display--sm">{room.company}</h3>
                <p className="ov-sub">{room.role}</p>
                <ol className="ov-dots" aria-hidden="true">
                  {ROOMS.map((r, i) => (
                    <li key={r.id} data-on={i === idx} />
                  ))}
                </ol>
              </>
            }
            right={
              <>
                <p className="ov-body">{room.detail}</p>
                <p className="ov-note">{room.aside}</p>
              </>
            }
          />
        );
      })}
    </>
  );
}

function WorkCards() {
  return (
    <>
      {WORKS.map((w, i) => {
        const c = workCue(i);
        return (
          <Pair
            key={w.id}
            env={[c.b - 0.25, c.b + 0.05, c.c - 0.1, c.c + 0.15]}
            label={w.title}
            className="ov-work"
            left={
              <>
                <p className="ov-kicker">
                  Scene {i + 1} of {WORKS.length}
                </p>
                <h3 className="ov-display ov-display--sm">{w.title}</h3>
                <p className="ov-sub">{w.kind}</p>
                <p className="ov-year">{w.year}</p>
              </>
            }
            right={
              <>
                <p className="ov-body">{w.description}</p>
                {w.aside && <p className="ov-note">{w.aside}</p>}
                <ul className="ov-stack" aria-label="Built with">
                  {w.stack.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                {w.href && (
                  <a className="th-button" href={w.href} target="_blank" rel="noreferrer">
                    {w.hrefLabel ?? "Visit"} <span aria-hidden="true">→</span>
                  </a>
                )}
              </>
            }
          />
        );
      })}
    </>
  );
}

function Interval() {
  return (
    <Pair
      env={Q.interval.menu}
      label={CONCESSIONS.title}
      className="ov-interval"
      left={
        <>
          <p className="ov-kicker ov-kicker--teal">✦ The Management Announces ✦</p>
          <h2 className="ov-display ov-display--xl">{CONCESSIONS.title}</h2>
          <p className="ov-sub">{CONCESSIONS.sub}</p>
        </>
      }
      right={
        <div className="ov-menu">
          <p className="ov-menu__title">{CONCESSIONS.menuTitle}</p>
          <ul>
            {CONCESSIONS.items.map((item) => (
              <li key={item.name}>
                <span className="ov-menu__name">{item.name}</span>
                <span className="th-leader" aria-hidden="true" />
                <span className="ov-menu__note">{item.note}</span>
              </li>
            ))}
          </ul>
          <p className="ov-menu__foot">{CONCESSIONS.footnote}</p>
        </div>
      }
    />
  );
}

/** Act IV: three index cards pinned round the mirror — the tools, the culture, the now. */
function DressingCards() {
  const cards = useRef<(HTMLElement | null)[]>([]);
  const C = Q.act4;
  useTick(C.pins[0] - 0.1, C.setOut[1], (t) => {
    cards.current.forEach((el, i) => {
      if (!el) return;
      const p = clamp01((t - C.pins[i]) / 0.3);
      const out = clamp01((t - C.setOut[0]) / 0.4);
      const e = smooth(p) * (1 - out);
      const tilt = (i % 2 ? 1 : -1) * (1.2 + (i % 3) * 0.6);
      el.style.opacity = Math.min(1, e * 1.3).toFixed(3);
      el.style.transform = `translateY(${((1 - e) * -30).toFixed(1)}px) rotate(${(tilt * (1 + (1 - e) * 4)).toFixed(2)}deg)`;
    });
  });
  return (
    <Cue env={[C.pins[0] - 0.1, C.pins[0], C.setOut[0], C.setOut[1]]} className="ov-board ov-board--dressing" label={ACT_CARDS.act4.title}>
      {DRESSING_ROOM.cards.map((c, i) => (
        <article key={c.id} ref={(el) => void (cards.current[i] = el)} className="ov-index" style={{ "--tint": c.tint } as React.CSSProperties}>
          <i className="ov-index__pin" aria-hidden="true" />
          <p className="ov-index__medium">{c.kicker}</p>
          <h3 className="ov-index__title">{c.title}</h3>
          <dl className="ov-index__rows">
            {c.rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </Cue>
  );
}

/** Between the stage door and the curtain call, the lights go out. */
function Blackout() {
  const ref = useRef<HTMLDivElement>(null);
  const env = Q.act5.blackout;
  useTick(env[0] - 0.01, env[3] + 0.01, (t) => {
    const el = ref.current;
    if (!el) return;
    const e = t <= env[0] || t >= env[3] ? 0 : t < env[1] ? clamp01((t - env[0]) / (env[1] - env[0])) : t <= env[2] ? 1 : 1 - clamp01((t - env[2]) / (env[3] - env[2]));
    el.style.opacity = e.toFixed(3);
    el.style.visibility = e > 0.001 ? "visible" : "hidden";
  });
  return <div ref={ref} className="ov-blackout" aria-hidden="true" style={{ visibility: "hidden", opacity: 0 }} />;
}

function Telegram() {
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const body = useMemo(() => {
    const m = telegraphese(message || "Have a project in mind. Would like to talk.");
    return m.endsWith("STOP") ? m : `${m} STOP`;
  }, [message]);
  const href = useMemo(() => {
    const subject = `TELEGRAM${from ? ` FROM ${from.toUpperCase()}` : ""} — via zarcerog.com`;
    const text = `${body}\n\n— ${from || "A member of the audience"}`;
    return `mailto:${PLAYBILL.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  }, [from, body]);
  const words = body.split(" ").filter((w) => w && w !== "STOP").length;

  return (
    <Cue env={Q.act5.form} className="ov-pair ov-telegram-pair" label="Send a telegram">
      <div className="ov-pair__card ov-pair__card--left ov-telegram">
        <div className="ov-telegram__head">
          <p className="ov-telegram__brand">Telegram</p>
          <p className="ov-telegram__meta">
            <span>Via Stage Door</span>
            <span>Nº {String(words).padStart(3, "0")}</span>
            <span>Urgent</span>
          </p>
        </div>
        <p className="ov-telegram__row">
          <span className="ov-telegram__label">To</span>
          <span className="ov-telegram__value">NICOLÁS ZARCERO</span>
        </p>
        <label className="ov-telegram__row">
          <span className="ov-telegram__label">From</span>
          <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Your name" autoComplete="name" maxLength={60} />
        </label>
        <label className="ov-telegram__row ov-telegram__row--msg">
          <span className="ov-telegram__label">Message</span>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Have a project in mind. Would like to talk." rows={3} maxLength={600} data-lenis-prevent />
        </label>
        <p className="ov-telegram__tape" aria-live="polite">
          {body}
        </p>
        <a className="th-button th-button--ink" href={href} onClick={() => cueSound("telegraph")}>
          Send by telegraph <span aria-hidden="true">→</span>
        </a>
      </div>
      <div className="ov-paper ov-pair__card ov-pair__card--right ov-elsewhere">
        <p className="ov-kicker">Or by other means</p>
        <div className="ov-stamps" aria-label="Elsewhere">
          {PLAYBILL.socials.map((s) => (
            <a key={s.href} className="th-stamp" href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
              <span className="th-stamp__inner">
                <span className="th-stamp__short">{s.short}</span>
                <span className="th-stamp__label">{s.label}</span>
              </span>
            </a>
          ))}
        </div>
        <p className="ov-body">
          <a href={`mailto:${PLAYBILL.email}`}>{PLAYBILL.email}</a>
        </p>
        <p className="ov-note">Replies within 24–48 hours, weather permitting.</p>
      </div>
    </Cue>
  );
}

function Credits() {
  const roll = useRef<HTMLDivElement>(null);
  const [a, b] = Q.finale.credits;
  useTick(a, b, (t) => {
    const p = clamp01((t - a) / (b - a));
    if (roll.current) roll.current.style.transform = `translate(-50%, calc(${p.toFixed(4)} * (-100vh - 100%)))`;
  });
  return (
    <Cue env={[a, a + 0.1, b - 0.1, b]} className="ov-credits" label="Credits">
      <div className="ov-credits__roll" ref={roll}>
        <p className="ov-credits__house">{PLAYBILL.theatre}</p>
        <p className="ov-credits__title">{PLAYBILL.title}</p>
        {CREDITS.map((c) => (
          <div key={c.role} className="ov-credits__block">
            <p className="ov-credits__role">{c.role}</p>
            {c.names.map((n) => (
              <p key={n} className="ov-credits__name">
                {n}
              </p>
            ))}
          </div>
        ))}
        <p className="ov-credits__disclaimer">{CREDITS_DISCLAIMER}</p>
      </div>
    </Cue>
  );
}

function Fin() {
  const stage = useStage();
  return (
    <Cue env={[Q.finale.fin[0], Q.finale.fin[1], 1e5, 1e5 + 1]} className="ov-fin" label="Fin">
      <p className="ov-fin__word">Fin.</p>
      <div className="th-rule" aria-hidden="true">
        <span>✦</span>
      </div>
      <div className="ov-fin__actions">
        <button type="button" className="th-button" onClick={() => stage.jump(0)}>
          <span aria-hidden="true">↑</span> Encore
        </button>
        <a className="th-button th-button--ghost" href={`mailto:${PLAYBILL.email}`}>
          Write to the stage door
        </a>
      </div>
      <a className="ov-fin__archive" href={PLAYBILL.archive.href}>
        <span className="ov-fin__archive-img">
          <Image src="/theatre/archive.webp" alt="" width={1400} height={838} sizes="120px" />
        </span>
        <span>
          <em>Previous production · {PLAYBILL.archive.honour}</em>
          <b>
            {PLAYBILL.archive.label} · {PLAYBILL.archive.year} →
          </b>
        </span>
      </a>
      <p className="ov-fin__copy">
        © {PLAYBILL.archive.year} {PLAYBILL.name}
      </p>
    </Cue>
  );
}

/** Words for screen readers that the 3D signage says visually. */
function Accessible() {
  return (
    <div className="ov-sr">
      <h1>
        {PLAYBILL.theatre} presents {PLAYBILL.name} in {PLAYBILL.title}
      </h1>
      <p>{PLAYBILL.subtitle}</p>
      {Object.values(ACT_CARDS).map((c) => (
        <p key={c.numeral}>
          Act {c.numeral}: {c.title}. {c.line}.
        </p>
      ))}
    </div>
  );
}

export function Overlays() {
  return (
    <div className="ov-layer">
      <Accessible />
      <Hint />
      <ScriptLine />
      <PersonaeCard />
      <RoomCaptions />
      <WorkCards />
      <Interval />
      <DressingCards />
      <Telegram />
      <Credits />
      <Fin />
      <Blackout />
    </div>
  );
}
